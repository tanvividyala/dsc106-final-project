"""
CMIP6 Climate Data Pipeline
Approach: pandas CSV catalog → gcsfs mapper → xr.open_zarr (from Pangeo notebook)
Country masks: regionmask Natural Earth countries (~177 countries)

Outputs:
  data/tas_anomalies.json
  data/pr_anomalies.json
  data/metadata.json
"""

# ── SSL fix — must precede all network/gcsfs/aiohttp imports ──────────────────
import os
import certifi
os.environ.setdefault("SSL_CERT_FILE", certifi.where())
os.environ.setdefault("REQUESTS_CA_BUNDLE", certifi.where())

import json
import warnings
from datetime import date

import numpy as np
import pandas as pd
import xarray as xr
import gcsfs
import regionmask

warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)

# ── Configuration ──────────────────────────────────────────────────────────────

CATALOG_CSV = (
    "https://storage.googleapis.com/cmip6/cmip6-zarr-consolidated-stores.csv"
)

VARIABLES = ["tas", "pr"]
SCENARIO_EXPERIMENTS = ["ssp126", "ssp245", "ssp585"]

PRIMARY_MODEL = "MPI-ESM1-2-LR"
FALLBACK_MODEL = "CESM2"

HISTORICAL_SLICE = slice("1980", "2014")
SCENARIO_SLICE   = slice("2015", "2100")
BASELINE_SLICE   = slice("1995", "2014")

OUTPUT_DIR = "data"

# Natural Earth 110m country boundaries (~177 countries)
COUNTRIES = regionmask.defined_regions.natural_earth_v5_0_0.countries_110

# ── GCS filesystem (singleton) ─────────────────────────────────────────────────
gcs = gcsfs.GCSFileSystem(token="anon")

# ── Helpers ────────────────────────────────────────────────────────────────────

def log(msg: str) -> None:
    print(f"[pipeline] {msg}", flush=True)


def load_catalog() -> pd.DataFrame:
    log("Downloading catalog CSV (~80 MB)…")
    df = pd.read_csv(CATALOG_CSV)
    log(f"Catalog loaded — {len(df):,} rows, {df.source_id.nunique()} models")
    return df


def find_zstore(
    df: pd.DataFrame,
    variable: str,
    experiment: str,
    model: str,
    member: str = "r1i1p1f1",
) -> str | None:
    q = (
        f"variable_id == '{variable}' & "
        f"experiment_id == '{experiment}' & "
        f"source_id == '{model}' & "
        f"table_id == 'Amon'"
    )
    sub = df.query(q)
    if sub.empty:
        return None
    pref = sub[sub.member_id == member]
    row = pref.iloc[0] if not pref.empty else sub.iloc[0]
    return row.zstore


def open_zarr(zstore: str) -> xr.Dataset | None:
    try:
        mapper = gcs.get_mapper(zstore)
        return xr.open_zarr(mapper, consolidated=True)
    except Exception as exc:
        log(f"  WARNING: could not open {zstore} — {exc}")
        return None


def get_dataset(
    df: pd.DataFrame, variable: str, experiment: str
) -> tuple[xr.Dataset | None, str]:
    for model in [PRIMARY_MODEL, FALLBACK_MODEL]:
        zstore = find_zstore(df, variable, experiment, model)
        if zstore is None:
            log(f"  {model}: no catalog entry for {variable}/{experiment}")
            continue
        log(f"  Opening {model}/{variable}/{experiment}…")
        ds = open_zarr(zstore)
        if ds is not None:
            return ds, model
    return None, ""


def convert_units(da: xr.DataArray, variable: str) -> xr.DataArray:
    if variable == "tas":
        return da - 273.15       # K → °C
    if variable == "pr":
        return da * 86400        # kg m-2 s-1 → mm day-1
    return da


def wrap_lon(ds: xr.Dataset) -> xr.Dataset:
    """Shift 0–360 grid to −180–180 if needed."""
    if float(ds["lon"].max()) > 180:
        ds = ds.assign_coords(lon=(ds["lon"] + 180) % 360 - 180)
        ds = ds.sortby("lon")
    return ds


def country_annual_means(da: xr.DataArray) -> dict[str, xr.DataArray]:
    """
    Compute area-weighted annual means for every country using regionmask.
    1. Compute annual means from monthly data first (12x size reduction)
    2. Load into memory
    3. Compute cos-lat weighted mean for each country polygon
    Returns {country_name: (years,) DataArray}
    """
    # Annual means first — pull only 1/12 of the data over the network
    ann = da.resample(time="YE").mean()
    log("    Loading annual data into memory…")
    ann = ann.load()

    # Compute country mask on this model's lat/lon grid
    mask = COUNTRIES.mask(ann["lon"], ann["lat"])   # (lat, lon), int codes, NaN=ocean

    # cos-lat weights broadcast over lon
    lat_w = np.cos(np.deg2rad(ann["lat"]))           # (lat,)

    results: dict[str, xr.DataArray] = {}
    codes = np.unique(mask.values[~np.isnan(mask.values)]).astype(int)

    for code in codes:
        name = COUNTRIES[code].name
        cmask = mask == code                          # (lat, lon) bool DataArray
        w2d   = lat_w * cmask                         # (lat, lon), zero outside country
        total_w = float(w2d.sum())
        if total_w == 0:
            continue
        ts = (ann * w2d).sum(["lat", "lon"]) / total_w
        results[name] = ts

    return results


def to_records(da: xr.DataArray, baseline: float) -> list[dict]:
    years = da["time"].dt.year.values.tolist()
    vals  = (da - baseline).values.tolist()
    return [{"year": int(y), "anomaly": round(float(v), 3)} for y, v in zip(years, vals)]


# ── Core pipeline ──────────────────────────────────────────────────────────────

def process_variable(df: pd.DataFrame, variable: str) -> tuple[dict, dict]:
    log(f"\n{'='*60}")
    log(f"Processing variable: {variable}")
    log(f"{'='*60}")

    # ── Historical run ─────────────────────────────────────────────────────────
    log("Step 1 — Loading historical run…")
    hist_ds, hist_model = get_dataset(df, variable, "historical")
    if hist_ds is None:
        log(f"CRITICAL: no historical data for {variable}. Skipping.")
        return {}, {}

    hist_ds  = wrap_lon(hist_ds)
    hist_var = hist_ds[variable].sortby("time").sel(time=HISTORICAL_SLICE)
    hist_var = convert_units(hist_var, variable)
    log(f"  Shape: {dict(hist_var.sizes)}")

    log("Step 2 — Computing country annual means (historical)…")
    hist_country = country_annual_means(hist_var)
    log(f"  Got timeseries for {len(hist_country)} countries")

    # ── Baselines (1995-2014 mean per country) ─────────────────────────────────
    log("Step 3 — Computing 1995-2014 baselines…")
    baselines: dict[str, float] = {}
    for name, ts in hist_country.items():
        sub = ts.sortby("time").sel(time=BASELINE_SLICE)
        if sub.sizes["time"] == 0:
            log(f"  WARNING: no baseline data for {name}, skipping.")
            continue
        baselines[name] = float(sub.mean().values)
    log(f"  Baselines computed for {len(baselines)} countries")

    # Historical anomaly records (1980-2014), reused as prefix for every scenario
    hist_records: dict[str, list] = {
        name: to_records(ts, baselines[name])
        for name, ts in hist_country.items()
        if name in baselines
    }

    # ── Scenario runs ──────────────────────────────────────────────────────────
    regions_out: dict[str, dict] = {}
    models_used = {"historical": hist_model}

    for scenario in SCENARIO_EXPERIMENTS:
        log(f"\nStep 4 — Loading {scenario}…")
        scen_ds, scen_model = get_dataset(df, variable, scenario)
        models_used[scenario] = scen_model

        if scen_ds is None:
            log(f"  WARNING: skipping {scenario} — no data found.")
            continue

        scen_ds  = wrap_lon(scen_ds)
        scen_var = scen_ds[variable].sortby("time").sel(time=SCENARIO_SLICE)
        scen_var = convert_units(scen_var, variable)
        log(f"  Shape: {dict(scen_var.sizes)}")

        log(f"  Computing country annual means ({scenario})…")
        scen_country = country_annual_means(scen_var)

        for name, ts in scen_country.items():
            if name not in baselines:
                continue
            scen_records = to_records(ts, baselines[name])
            full = hist_records.get(name, []) + scen_records

            if name not in regions_out:
                regions_out[name] = {}
            regions_out[name][scenario] = full

        log(f"  {scenario}: {len(scen_country)} countries processed")

    return regions_out, models_used


# ── Entry point ────────────────────────────────────────────────────────────────

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    df = load_catalog()

    all_models: dict[str, dict] = {}
    output_files: dict[str, str] = {}

    for variable in VARIABLES:
        regions_out, models_used = process_variable(df, variable)
        all_models[variable] = models_used

        if not regions_out:
            log(f"WARNING: no output for {variable}, skipping JSON write.")
            continue

        payload = {
            "variable": variable,
            "baseline_period": "1995-2014",
            "regions": regions_out,
        }
        out_path = f"{OUTPUT_DIR}/{variable}_anomalies.json"
        with open(out_path, "w") as f:
            json.dump(payload, f, separators=(",", ":"))
        size_kb = os.path.getsize(out_path) / 1024
        log(f"\nWrote {out_path} ({size_kb:.0f} KB)")
        output_files[variable] = out_path

    country_names = list(regions_out.keys()) if regions_out else []
    metadata = {
        "run_date": date.today().isoformat(),
        "catalog_csv": CATALOG_CSV,
        "primary_model": PRIMARY_MODEL,
        "fallback_model": FALLBACK_MODEL,
        "models_used": all_models,
        "variables": VARIABLES,
        "experiments": ["historical"] + SCENARIO_EXPERIMENTS,
        "country_count": len(country_names),
        "countries": sorted(country_names),
        "baseline_period": "1995-2014",
        "historical_slice": "1980-2014",
        "scenario_slice": "2015-2100",
        "units": {
            "tas": "°C anomaly from 1995-2014 baseline",
            "pr":  "mm/day anomaly from 1995-2014 baseline",
        },
        "output_files": output_files,
    }
    meta_path = f"{OUTPUT_DIR}/metadata.json"
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)
    log(f"Wrote {meta_path}")
    log("\nPipeline complete.")


if __name__ == "__main__":
    main()
