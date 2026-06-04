"""
Fetch CMIP6 Arctic sea-ice extent (NH September minimum) from MPI-ESM1-2-LR.
Variable: siconc (SImon table) — sea ice area fraction (%, 0–100)
Cell area: areacello (Ofx table) in m²
Extent = Σ areacello where siconc > 15% and lat > 0°N, per September year.
Output: data/sea_ice_extent.json
  {
    "historical": [{"year": 1979, "val": 6.8}, ...],  # million km²
    "ssp126": [{"year": 2015, "val": 4.9}, ...],
    "ssp245": [...],
    "ssp585": [...]
  }
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
MODEL = "MPI-ESM1-2-LR"
FALLBACK_MODEL = "CESM2"
HISTORICAL_SLICE = slice("1979", "2014")
SCENARIO_SLICE = slice("2015", "2100")
OUTPUT = "data/sea_ice_extent.json"

gcs = gcsfs.GCSFileSystem(token="anon")


def log(msg):
    print(f"[sea-ice] {msg}", flush=True)


def find_zstore(df, variable, experiment, table, model=MODEL, member="r1i1p1f1"):
    q = (f"variable_id == '{variable}' & experiment_id == '{experiment}' & "
         f"source_id == '{model}' & table_id == '{table}'")
    sub = df.query(q)
    if sub.empty:
        return None
    pref = sub[sub.member_id == member]
    row = pref.iloc[0] if not pref.empty else sub.iloc[0]
    return row.zstore


def open_zarr(zstore):
    try:
        mapper = gcs.get_mapper(zstore)
        return xr.open_zarr(mapper, consolidated=True)
    except Exception as e:
        log(f"  WARNING: could not open zarr — {e}")
        return None


def get_lat(da):
    """Return latitude coordinate, handling 1D and 2D curvilinear grids."""
    for name in ["lat", "latitude", "nav_lat"]:
        if name in da.coords:
            return da.coords[name]
    return None


def approximate_cell_area(da):
    """
    Fallback: approximate grid cell areas (m²) from 1D lat/lon coordinates.
    Only works for regular grids.
    """
    lat = get_lat(da)
    lon = da.coords.get("lon", da.coords.get("longitude"))
    if lat is None or lon is None or lat.ndim != 1:
        raise ValueError("Cannot approximate cell area: non-regular grid")
    dlat_deg = float(np.abs(np.diff(lat.values)).mean())
    dlon_deg = float(np.abs(np.diff(lon.values)).mean())
    R = 6.371e6  # Earth radius in metres
    # (lat,) shape — will broadcast with (time, lat, lon)
    area = R**2 * np.cos(np.deg2rad(lat)) * np.deg2rad(dlat_deg) * np.deg2rad(dlon_deg)
    return area  # xr.DataArray with lat dimension


def compute_sept_extent(da, cell_area):
    """
    Compute annual September Arctic sea-ice extent in million km².
    da        : siconc DataArray (%, 0–100), dims include 'time'
    cell_area : grid cell area in m² (xr.DataArray or np.ndarray)
    Returns   : list of {"year": int, "val": float}
    """
    sept = da.sel(time=da.time.dt.month == 9)

    lat = get_lat(sept)
    if lat is None:
        raise ValueError("No latitude coordinate found in siconc")

    nh_mask = lat > 0           # Northern Hemisphere
    ice_mask = sept > 15.0      # standard 15% concentration threshold

    # spatial dims (everything except time)
    spatial_dims = [d for d in sept.dims if d != "time"]

    # sum: cell_area where (ice AND NH)
    extent_m2 = (ice_mask * nh_mask * cell_area).sum(dim=spatial_dims)
    extent_mkm2 = extent_m2 / 1e12  # m² → million km²

    years = sept.time.dt.year.values
    vals = extent_mkm2.values
    return [{"year": int(y), "val": round(float(v), 3)} for y, v in zip(years, vals)]


def load_cell_area(df):
    """Try to load areacello from Ofx table; fall back to None."""
    for experiment in ["piControl", "historical"]:
        for model in [MODEL, FALLBACK_MODEL]:
            zstore = find_zstore(df, "areacello", experiment, "Ofx", model=model)
            if zstore:
                log(f"  Found areacello ({model}, {experiment})")
                ds = open_zarr(zstore)
                if ds is not None and "areacello" in ds:
                    area = ds["areacello"].load()
                    log(f"  areacello shape: {dict(area.sizes)}")
                    return area
    log("  WARNING: areacello not found in catalog")
    return None


def process_slice(df, variable, experiment, table, time_slice, cell_area, model=MODEL):
    """Load siconc for one experiment+model and compute September extent."""
    for m in [model, FALLBACK_MODEL]:
        zstore = find_zstore(df, variable, experiment, table, model=m)
        if not zstore:
            log(f"  {m}: no catalog entry for {variable}/{experiment}")
            continue
        log(f"  Opening {m}/{variable}/{experiment}…")
        ds = open_zarr(zstore)
        if ds is None:
            continue
        if variable not in ds:
            log(f"  WARNING: {variable} not in dataset")
            continue
        da = ds[variable].sortby("time").sel(time=time_slice)
        log(f"  Shape: {dict(da.sizes)}")

        area = cell_area
        if area is None:
            log("  Approximating cell area from coordinates…")
            try:
                area = approximate_cell_area(da)
            except ValueError as e:
                log(f"  ERROR: {e}")
                continue

        log("  Computing September extent…")
        try:
            records = compute_sept_extent(da, area)
            log(f"  {len(records)} annual values  "
                f"(range: {min(r['val'] for r in records):.2f}–"
                f"{max(r['val'] for r in records):.2f} M km²)")
            return records
        except Exception as e:
            log(f"  ERROR computing extent: {e}")
            continue
    return None


def main():
    os.makedirs("data", exist_ok=True)

    log("Downloading catalog CSV (~80 MB)…")
    df = pd.read_csv(CATALOG_CSV)
    log(f"Catalog loaded — {len(df):,} rows, {df.source_id.nunique()} models")

    log("Loading cell areas (areacello)…")
    cell_area = load_cell_area(df)

    output = {}

    log("\n── Historical (1979–2014) ──")
    hist = process_slice(df, "siconc", "historical", "SImon", HISTORICAL_SLICE, cell_area)
    if hist:
        output["historical"] = hist

    for scenario in ["ssp126", "ssp245", "ssp585"]:
        log(f"\n── {scenario} (2015–2100) ──")
        records = process_slice(df, "siconc", scenario, "SImon", SCENARIO_SLICE, cell_area)
        if records:
            output[scenario] = records

    if not output:
        log("ERROR: no data collected — check catalog access and model availability")
        return

    with open(OUTPUT, "w") as f:
        json.dump(output, f, separators=(",", ":"))
    size_kb = os.path.getsize(OUTPUT) / 1024
    log(f"\nWrote {OUTPUT} ({size_kb:.1f} KB)")
    log("Done.")


if __name__ == "__main__":
    main()
