"""
Biome-level precipitation anomaly pipeline
Reads WWF terrestrial biomes shapefile, masks CMIP6 pr grid cells by biome,
computes area-weighted annual mean anomalies per biome per scenario.

Usage:
    python fetch_biome_precip.py --shapefile data/wwf_biomes/wwf_terr_ecos.shp

Output:
    data/biome_precip.json
"""

import os, ssl, certifi
os.environ.setdefault("SSL_CERT_FILE", certifi.where())
os.environ.setdefault("REQUESTS_CA_BUNDLE", certifi.where())

import argparse, json, warnings
from datetime import date
from pathlib import Path

import numpy as np
import pandas as pd
import xarray as xr
import geopandas as gpd
import regionmask
import gcsfs

warnings.filterwarnings("ignore")

# Collapse 14 WWF codes → 7 simplified biomes
BIOME_MERGE = {
    1:  "Tropical Forest",   # Tropical Moist Broadleaf
    2:  "Tropical Forest",   # Tropical Dry Broadleaf
    3:  "Tropical Forest",   # Tropical Conifer
    14: "Tropical Forest",   # Mangroves
    7:  "Savanna",           # Tropical Grassland / Savanna
    9:  "Savanna",           # Flooded Grassland
    13: "Desert",            # Desert & Xeric Shrubland
    10: "Desert",            # Montane (grouped with desert for dryness story)
    12: "Mediterranean",     # Mediterranean Scrub
    4:  "Temperate Forest",  # Temperate Broadleaf & Mixed
    5:  "Temperate Forest",  # Temperate Conifer
    8:  "Steppe / Grassland",# Temperate Grassland
    6:  "Boreal / Taiga",    # Boreal Forest
    11: "Tundra & Arctic",   # Tundra
}

SIMPLIFIED_BIOMES = list(dict.fromkeys(BIOME_MERGE.values()))  # order-preserving unique

CATALOG_CSV = "https://storage.googleapis.com/cmip6/cmip6-zarr-consolidated-stores.csv"
PRIMARY_MODEL = "MPI-ESM1-2-LR"
FALLBACK_MODEL = "CESM2"
SCENARIOS = ["ssp126", "ssp245", "ssp585"]
BASELINE_SLICE = slice("1995", "2014")
HISTORICAL_SLICE = slice("1980", "2014")
SCENARIO_SLICE = slice("2015", "2100")

gcs = gcsfs.GCSFileSystem(token="anon")


def log(msg):
    print(f"[biome] {msg}", flush=True)


def load_catalog():
    log("Downloading CMIP6 catalog…")
    return pd.read_csv(CATALOG_CSV)


def find_zstore(df, experiment, model, member="r1i1p1f1"):
    q = (f"variable_id == 'pr' & experiment_id == '{experiment}' & "
         f"source_id == '{model}' & table_id == 'Amon'")
    sub = df.query(q)
    if sub.empty:
        return None
    pref = sub[sub.member_id == member]
    row = pref.iloc[0] if not pref.empty else sub.iloc[0]
    return row.zstore


def open_zarr(zstore):
    try:
        return xr.open_zarr(gcs.get_mapper(zstore), consolidated=True)
    except Exception as e:
        log(f"  WARNING: {e}")
        return None


def get_pr(df, experiment):
    for model in [PRIMARY_MODEL, FALLBACK_MODEL]:
        zs = find_zstore(df, experiment, model)
        if zs:
            log(f"  Opening {model}/{experiment}…")
            ds = open_zarr(zs)
            if ds is not None:
                return ds, model
    return None, ""


def wrap_lon(ds):
    if float(ds["lon"].max()) > 180:
        ds = ds.assign_coords(lon=(ds["lon"] + 180) % 360 - 180).sortby("lon")
    return ds


def build_biome_masks(shapefile_path, lon, lat):
    """
    Dissolve WWF ecoregions → 7 simplified biomes, build regionmask.
    Returns mask DataArray where value = simplified biome index (0-based),
    plus ordered list of simplified biome names.
    """
    log(f"Loading shapefile: {shapefile_path}")
    gdf = gpd.read_file(shapefile_path)
    gdf = gdf[gdf["BIOME_NUM"].notna()].copy()
    gdf["BIOME_NUM"] = gdf["BIOME_NUM"].astype(int)
    gdf["simplified"] = gdf["BIOME_NUM"].map(BIOME_MERGE)
    gdf = gdf[gdf["simplified"].notna()]

    log(f"  Dissolving {len(gdf)} ecoregions → {gdf['simplified'].nunique()} simplified biomes…")
    dissolved = gdf.dissolve(by="simplified", as_index=False)[["simplified", "geometry"]]

    # Assign stable integer codes 0..N-1 in a fixed order
    ordered = [b for b in SIMPLIFIED_BIOMES if b in dissolved["simplified"].values]
    name_to_code = {name: i for i, name in enumerate(ordered)}
    dissolved["code"] = dissolved["simplified"].map(name_to_code)
    dissolved = dissolved.sort_values("code")

    regions = regionmask.Regions(
        outlines=list(dissolved.geometry),
        numbers=list(dissolved["code"]),
        names=list(dissolved["simplified"]),
        name="Simplified Biomes",
    )

    log("  Creating grid mask…")
    mask = regions.mask(lon, lat)
    return mask, list(dissolved["code"]), list(dissolved["simplified"])


def annual_biome_means(da, mask, biome_codes):
    """Area-weighted annual mean for each biome."""
    ann = da.resample(time="YE").mean()
    log("    Loading into memory…")
    ann = ann.load()

    lat_w = np.cos(np.deg2rad(ann["lat"]))
    results = {}
    for code in biome_codes:
        cmask = mask == code
        w2d = lat_w * cmask
        total_w = float(w2d.sum())
        if total_w == 0:
            continue
        ts = (ann * w2d).sum(["lat", "lon"]) / total_w
        results[int(code)] = ts
    return results


def to_records(da, baseline):
    years = da["time"].dt.year.values.tolist()
    pct = ((da - baseline) / baseline * 100).values.tolist()
    return [{"year": int(y), "anomaly": round(float(v), 3)} for y, v in zip(years, pct)]


def main(shapefile_path):
    df = load_catalog()

    # ── Historical run for baseline ───────────────────────────────────────────
    log("\n── Historical run ──")
    hist_ds, _ = get_pr(df, "historical")
    if hist_ds is None:
        raise RuntimeError("No historical pr data found.")

    hist_ds = wrap_lon(hist_ds)
    hist_pr = (hist_ds["pr"] * 86400).sortby("time").sel(time=HISTORICAL_SLICE)

    # Build biome masks on this grid
    mask, biome_codes, biome_names = build_biome_masks(
        shapefile_path, hist_pr["lon"].values, hist_pr["lat"].values
    )

    log("Computing historical biome means…")
    hist_biome = annual_biome_means(hist_pr, mask, biome_codes)

    # 1995-2014 baselines
    baselines = {}
    for code, ts in hist_biome.items():
        sub = ts.sortby("time").sel(time=BASELINE_SLICE)
        if sub.sizes["time"] > 0:
            baselines[code] = float(sub.mean().values)

    hist_records = {
        code: to_records(ts, baselines[code])
        for code, ts in hist_biome.items() if code in baselines
    }

    # ── Scenarios ─────────────────────────────────────────────────────────────
    biome_out = {}  # biome_code → {scenario: [records]}

    for scenario in SCENARIOS:
        log(f"\n── {scenario} ──")
        scen_ds, _ = get_pr(df, scenario)
        if scen_ds is None:
            log(f"  Skipping {scenario} — no data.")
            continue

        scen_ds = wrap_lon(scen_ds)
        scen_pr = (scen_ds["pr"] * 86400).sortby("time").sel(time=SCENARIO_SLICE)

        # Reuse mask (same model grid)
        log(f"  Computing biome means ({scenario})…")
        scen_biome = annual_biome_means(scen_pr, mask, biome_codes)

        for code, ts in scen_biome.items():
            if code not in baselines:
                continue
            full = hist_records.get(code, []) + to_records(ts, baselines[code])
            if code not in biome_out:
                biome_out[code] = {
                    "name": biome_names[biome_codes.index(code)],
                    "baseline_mm_day": round(baselines[code], 4),
                    "scenarios": {}
                }
            biome_out[code]["scenarios"][scenario] = full

    # ── Write output ──────────────────────────────────────────────────────────
    out = {
        "variable": "pr",
        "unit": "% change from 1995-2014 baseline",
        "model": PRIMARY_MODEL,
        "run_date": date.today().isoformat(),
        "biomes": biome_out,
    }
    out_path = "data/biome_precip.json"
    with open(out_path, "w") as f:
        json.dump(out, f, separators=(",", ":"))
    log(f"\nWrote {out_path} ({Path(out_path).stat().st_size / 1024:.0f} KB)")

    # Quick summary
    log("\n── Summary (SSP5-8.5, 2100) ──")
    for code, bdata in sorted(biome_out.items()):
        rows = bdata["scenarios"].get("ssp585", [])
        r2100 = next((r for r in rows if r["year"] == 2100), None)
        if r2100:
            log(f"  {bdata['name']:<30} {r2100['anomaly']:+.3f} mm/day")


DEFAULT_SHAPEFILE = "ecoregions/Ecoregions2017.shp"

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--shapefile", default=DEFAULT_SHAPEFILE,
                        help=f"Path to WWF biome shapefile (default: {DEFAULT_SHAPEFILE})")
    args = parser.parse_args()
    main(args.shapefile)
