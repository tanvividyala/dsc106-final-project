"""
fetch_soil_moisture.py
Fetches mrso (total soil moisture, kg/m²) from CMIP6 via Pangeo GCS.
Global land-weighted mean only — no country breakdown needed.

Outputs data/soil_moisture.json:
  historical: 1980-2024, {year, mrso, drought}
  ssp126/245/585: 2025-2100, {year, mrso, drought}

mrso_anom = anomaly vs 1995-2014 land-mean baseline (kg/m²)
drought    = % of land where mrso < 20th-pct of 1980-2014 per-cell distribution
"""

import os, json, warnings
import certifi
os.environ.setdefault("SSL_CERT_FILE", certifi.where())
os.environ.setdefault("REQUESTS_CA_BUNDLE", certifi.where())

import numpy as np
import pandas as pd
import xarray as xr
import gcsfs

warnings.filterwarnings("ignore")

CATALOG_CSV = "https://storage.googleapis.com/cmip6/cmip6-zarr-consolidated-stores.csv"
# Try these models in order; pick whichever has all four experiments
MODELS   = ["MPI-ESM1-2-LR", "CESM2", "IPSL-CM6A-LR", "MIROC6"]
VARIABLE = "mrso"
TABLE    = "Lmon"
SCENARIOS = ["ssp126", "ssp245", "ssp585"]
OUTPUT   = "data/soil_moisture.json"

gcs = gcsfs.GCSFileSystem(token="anon")


def log(msg): print(f"[soil] {msg}", flush=True)


def find_store(df, experiment, model):
    q = df.query(
        f"variable_id=='{VARIABLE}' & experiment_id=='{experiment}' & "
        f"source_id=='{model}' & table_id=='{TABLE}'"
    )
    if q.empty:
        return None
    pref = q[q.member_id == "r1i1p1f1"]
    row  = pref.iloc[0] if not pref.empty else q.iloc[0]
    return row.zstore


def open_store(zstore):
    try:
        return xr.open_zarr(gcs.get_mapper(zstore), consolidated=True)
    except Exception as e:
        log(f"  WARNING: {e}")
        return None


def pick_model(df):
    """Return the first model that has historical + all three SSPs."""
    needed = ["historical"] + SCENARIOS
    for model in MODELS:
        stores = {exp: find_store(df, exp, model) for exp in needed}
        if all(stores.values()):
            log(f"Using model: {model}")
            return model, stores
    # Fallback: take first model with at least historical + ssp585
    for model in MODELS:
        h = find_store(df, "historical", model)
        s = find_store(df, "ssp585", model)
        if h and s:
            log(f"Partial fallback model: {model} (missing some SSPs)")
            stores = {exp: find_store(df, exp, model) for exp in needed}
            return model, stores
    raise RuntimeError("No model with mrso historical + SSPs found in catalog")


def annual_mean_land(da, time_slice, land_w, total_w, sub_w, sub_total_w,
                     drought_thr=None, ref_global=None):
    """
    Compute global land-mean mrso anomaly and subtropical drought area % per year.
    mrso: weighted mean over all land (global signal)
    drought: % of subtropical land (15-50°) below per-cell 20th-pct threshold
    Returns list of {year, mrso, drought}.
    """
    ann = da.sortby("time").sel(time=time_slice).resample(time="YE").mean().load()
    years = ann.time.dt.year.values
    vals  = ann.values  # (time, lat, lon)

    out = []
    for i, yr in enumerate(years):
        v       = vals[i]                                        # (lat, lon)
        v_clean = np.where(np.isnan(v), 0.0, v)
        gm      = float((v_clean * land_w).sum() / total_w)
        anom    = round(gm - ref_global, 2) if ref_global is not None else round(gm, 2)

        if drought_thr is not None and sub_total_w > 0:
            in_drought = (v < drought_thr).astype(float)        # NaN<thr → False → 0
            dpct = round(float((in_drought * sub_w).sum() / sub_total_w) * 100, 2)
        else:
            dpct = None

        out.append({"year": int(yr), "mrso": anom, "drought": dpct})
    return out


def main():
    os.makedirs("data", exist_ok=True)

    log("Downloading catalog (~80 MB)...")
    df = pd.read_csv(CATALOG_CSV)
    log(f"Catalog loaded — {len(df):,} rows")

    model, stores = pick_model(df)

    # ── Historical (1980-2014) ────────────────────────────────────────────────────
    log("Opening historical mrso...")
    hist_ds = open_store(stores["historical"])
    if hist_ds is None:
        raise RuntimeError("Could not open historical mrso store")

    log("Computing annual means 1980-2014 (this loads data from GCS)...")
    hist_raw = hist_ds[VARIABLE].sortby("time").sel(time=slice("1980", "2014"))
    hist_ann = hist_raw.resample(time="YE").mean().load()
    log(f"  Grid: {dict(hist_ann.sizes)}")

    lat_vals = hist_ann.lat.values                                    # (lat,)

    # Global land mask: cells with 1980-2014 mean mrso > 1 kg/m²
    land_mask  = hist_ann.mean("time") > 1.0
    lat_w_col  = np.cos(np.deg2rad(lat_vals))[:, None]               # (lat, 1)
    land_w     = (land_mask.values.astype(float)) * lat_w_col        # (lat, lon)
    total_w    = land_w.sum()
    log(f"  Land cells: {int(land_mask.sum())}, total weight: {total_w:.1f}")

    # Subtropical mask (15-50°N/S) for drought area — robust drying signal
    subtrop    = (np.abs(lat_vals) >= 15) & (np.abs(lat_vals) <= 50) # (lat,)
    sub_mask   = land_mask.values & subtrop[:, None]                  # (lat, lon)
    sub_w      = sub_mask.astype(float) * lat_w_col
    sub_total_w = sub_w.sum()
    log(f"  Subtropical land cells (15-50°): {int(sub_mask.sum())}, weight: {sub_total_w:.1f}")

    # Per-cell 20th-percentile drought threshold over 1980-2014
    log("Computing drought thresholds (20th pct per subtropical cell)...")
    drought_thr = np.nanpercentile(hist_ann.values, 20, axis=0)      # (lat, lon)

    # Reference: 1995-2014 global land-mean (nan_to_num — NaN*0=NaN in numpy)
    ref_ann    = hist_ann.sel(time=slice("1995", "2014")).values
    ref_mean   = np.nan_to_num(np.nanmean(ref_ann, axis=0))           # (lat, lon), NaN→0
    ref_global = float((ref_mean * land_w).sum() / total_w)
    log(f"  Reference mrso (1995-2014): {ref_global:.1f} kg/m²")

    log("Building historical timeseries (1980-2014)...")
    hist_ts = annual_mean_land(
        hist_ds[VARIABLE], slice("1980", "2014"),
        land_w, total_w, sub_w, sub_total_w, drought_thr, ref_global
    )

    # Extend 2015-2024 with ssp126 (scenarios diverge negligibly before 2030)
    if stores.get("ssp126"):
        log("Extending to 2015-2024 using ssp126...")
        ssp126_ds = open_store(stores["ssp126"])
        if ssp126_ds is not None:
            ext = annual_mean_land(
                ssp126_ds[VARIABLE], slice("2015", "2024"),
                land_w, total_w, sub_w, sub_total_w, drought_thr, ref_global
            )
            hist_ts += ext

    # ── Scenario projections ──────────────────────────────────────────────────────
    ssp_out = {}
    for ssp in SCENARIOS:
        if not stores.get(ssp):
            log(f"Skipping {ssp} — no store found")
            continue
        log(f"Opening {ssp}...")
        ssp_ds = open_store(stores[ssp])
        if ssp_ds is None:
            log(f"  Could not open {ssp}, skipping")
            continue
        ssp_out[ssp] = annual_mean_land(
            ssp_ds[VARIABLE], slice("2025", "2100"),
            land_w, total_w, sub_w, sub_total_w, drought_thr, ref_global
        )
        last = ssp_out[ssp][-1]
        log(f"  {ssp} @ 2100: mrso={last['mrso']:+.1f} kg/m², drought={last['drought']:.1f}%")

    payload = {"model": model, "historical": hist_ts, **ssp_out}
    with open(OUTPUT, "w") as f:
        json.dump(payload, f, separators=(",", ":"))
    log(f"\nWrote {OUTPUT} ({os.path.getsize(OUTPUT)/1024:.1f} KB)")


if __name__ == "__main__":
    main()
