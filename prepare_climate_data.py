"""
Preprocessing script: reads tas_anomalies.json + pr_anomalies.json,
computes global (country-average) annual means for each SSP,
smooths with polynomial fitting to remove single-model interannual noise,
adds IPCC AR6-consistent CO₂ + sea-level curves,
and writes data/climate-data.json for the UI.

Temp baseline conversion: 1995-2014 → 1850-1900 = +0.65°C
(IPCC AR6 WG1 Ch. 2: 1995-2014 is ~0.65°C above 1850-1900)
"""

import json, math, os, statistics

PROJ = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(PROJ, "data")

TEMP_BASELINE_OFFSET = 0.65  # °C to convert 1995-2014 → 1850-1900 baseline

# IPCC AR6-consistent CO₂ parametric curves (ppm)
CO2_PARAMS = {
    "1-2.6": lambda x: 420 + 40*x - 50*x*x,      # peaks ~445 then ~410 by 2100
    "2-4.5": lambda x: 420 + 170*x - 25*x*x,      # ~565 by 2100
    "5-8.5": lambda x: 420 + 240*x + 210*x*x,     # ~870 by 2100
}

# IPCC AR6 Chapter 9 sea level rise (cm above 2025 baseline)
SEA_PARAMS = {
    "1-2.6": lambda x: 5 + 30*x,                  # ~35 cm by 2100
    "2-4.5": lambda x: 5 + 50*x + 20*x*x,         # ~75 cm by 2100
    "5-8.5": lambda x: 5 + 65*x + 65*x*x,         # ~135 cm by 2100
}

SSP_MAP = {"ssp126": "1-2.6", "ssp245": "2-4.5", "ssp585": "5-8.5"}

def load_json(path):
    with open(path) as f:
        return json.load(f)

def global_mean_by_year(regions, ssp_key):
    """Unweighted average anomaly across all countries for each year."""
    year_vals = {}
    for country_data in regions.values():
        series = country_data.get(ssp_key)
        if series is None:
            continue
        for rec in series:
            yr = rec["year"]
            year_vals.setdefault(yr, []).append(rec["anomaly"])
    return {yr: statistics.mean(vals) for yr, vals in year_vals.items() if vals}

def polyfit(xs, ys, degree):
    """Simple polynomial regression without numpy. Returns coefficients (highest power first)."""
    n = degree + 1
    # Build Vandermonde matrix and solve via Gaussian elimination
    # Use numpy if available for stability, else fall back to simple approach
    try:
        import numpy as np
        coeffs = np.polyfit(xs, ys, degree)
        return coeffs.tolist()
    except ImportError:
        pass
    # Fallback: least-squares via normal equations (degree ≤ 3 only)
    # Build A^T A and A^T y
    mat = [[sum(x**(i+j) for x in xs) for j in range(n)] for i in range(n)]
    rhs = [sum(y * x**i for x, y in zip(xs, ys)) for i in range(n)]
    # Gaussian elimination
    for col in range(n):
        pivot = mat[col][col]
        for row in range(col+1, n):
            f = mat[row][col] / pivot
            mat[row] = [mat[row][k] - f*mat[col][k] for k in range(n)]
            rhs[row] -= f * rhs[col]
    coeffs = [0.0] * n
    for i in range(n-1, -1, -1):
        coeffs[i] = (rhs[i] - sum(mat[i][j]*coeffs[j] for j in range(i+1, n))) / mat[i][i]
    return coeffs[::-1]  # highest power first

def polyval(coeffs, x):
    result = 0.0
    for c in coeffs:
        result = result * x + c
    return result

def smooth_curve(year_mean_map, years_out, degree=2):
    """Fit a polynomial to the available data and evaluate at years_out."""
    years_in = sorted(year_mean_map.keys())
    vals_in  = [year_mean_map[y] for y in years_in]
    # Normalize x to [0, 1] for numerical stability
    y0, y1 = years_in[0], years_in[-1]
    xs = [(y - y0) / (y1 - y0) for y in years_in]
    coeffs = polyfit(xs, vals_in, degree)
    result = []
    for yr in years_out:
        x = (yr - y0) / (y1 - y0)
        result.append({"year": yr, "val": round(polyval(coeffs, x), 3)})
    return result

def synthetic_curve(param_fn):
    result = []
    for yr in range(2025, 2101):
        x = (yr - 2025) / 75
        result.append({"year": yr, "val": round(param_fn(x), 3)})
    return result

def summary_2100(curve):
    return next((r["val"] for r in curve if r["year"] == 2100), curve[-1]["val"])

def main():
    print("[prepare] Loading raw data…")
    tas = load_json(os.path.join(DATA, "tas_anomalies.json"))
    pr  = load_json(os.path.join(DATA, "pr_anomalies.json"))

    tas_regions = tas["regions"]
    pr_regions  = pr["regions"]

    years_out = list(range(2025, 2101))
    PR_BASELINE_MM = 2.6   # global mean precipitation mm/day

    metrics = {"temp": {}, "co2": {}, "sea": {}, "precip": {}}

    for ssp_key, short in SSP_MAP.items():
        print(f"[prepare]  SSP{short}…")

        # --- Temperature ---
        tas_global = global_mean_by_year(tas_regions, ssp_key)
        # Smooth with a degree-2 polynomial (removes interannual noise)
        temp_raw = smooth_curve(tas_global, years_out, degree=2)
        # Apply 1850-1900 baseline offset
        temp_curve = [{"year": r["year"], "val": round(r["val"] + TEMP_BASELINE_OFFSET, 3)}
                      for r in temp_raw]

        # --- Precipitation ---
        pr_global = global_mean_by_year(pr_regions, ssp_key)
        # Single-model precip has high interannual noise; use linear trend (degree=1)
        # to extract the forced signal cleanly
        pr_smooth = smooth_curve(pr_global, years_out, degree=1)
        # Convert mm/day → % and re-anchor to 2025
        pr_2025_val = pr_smooth[0]["val"]  # smoothed value at 2025
        precip_curve = []
        for r in pr_smooth:
            delta_mm = r["val"] - pr_2025_val  # anomaly vs 2025
            pct = (delta_mm / PR_BASELINE_MM) * 100
            precip_curve.append({"year": r["year"], "val": round(pct, 3)})

        metrics["temp"][short]   = temp_curve
        metrics["precip"][short] = precip_curve
        metrics["co2"][short]    = synthetic_curve(CO2_PARAMS[short])
        metrics["sea"][short]    = synthetic_curve(SEA_PARAMS[short])

    # --- Build summary2100 ---
    metric_ranges = {
        "temp":   {"1-2.6": [1.3, 2.4], "2-4.5": [2.1, 3.5], "5-8.5": [3.3, 5.7]},
        "co2":    {"1-2.6": [380, 450],  "2-4.5": [510, 605],  "5-8.5": [800, 950]},
        "sea":    {"1-2.6": [28, 55],    "2-4.5": [55, 98],    "5-8.5": [98, 188]},
        "precip": {"1-2.6": [1.0, 3.5],  "2-4.5": [1.5, 5.8],  "5-8.5": [3.5, 10]},
    }

    summary2100 = {}
    for ssp_short in ["1-2.6", "2-4.5", "5-8.5"]:
        summary2100[ssp_short] = {}
        for m in ["temp", "co2", "sea", "precip"]:
            val = summary_2100(metrics[m][ssp_short])
            summary2100[ssp_short][m] = {"val": val, "range": metric_ranges[m][ssp_short]}

    payload = {
        "sspNames": {"1-2.6": "Sustainable", "2-4.5": "Middle Road", "5-8.5": "Fossil-Fueled"},
        "metrics": metrics,
        "summary2100": summary2100,
    }

    out_path = os.path.join(DATA, "climate-data.json")
    with open(out_path, "w") as f:
        json.dump(payload, f, separators=(",", ":"))
    size_kb = os.path.getsize(out_path) / 1024
    print(f"[prepare] Wrote {out_path} ({size_kb:.1f} KB)")

    for ssp_short in ["1-2.6", "2-4.5", "5-8.5"]:
        t = summary2100[ssp_short]["temp"]["val"]
        c = summary2100[ssp_short]["co2"]["val"]
        s = summary2100[ssp_short]["sea"]["val"]
        p = summary2100[ssp_short]["precip"]["val"]
        print(f"  SSP{ssp_short}: temp={t:+.2f}°C  co2={c:.0f}ppm  sea={s:.0f}cm  precip={p:+.2f}%")

if __name__ == "__main__":
    main()
