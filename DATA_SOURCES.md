# Data Sources

## Primary Dataset

All climate projections come from **CMIP6 (Coupled Model Intercomparison Project Phase 6)** using the **MPI-ESM1-2-LR** model, accessed via NOAA / Google Cloud (Pangeo CMIP6 Zarr catalog). Data spans 1980–2100, with 1980–2024 from the CMIP6 historical experiment and 2025–2100 from three shared socioeconomic pathways: SSP1-2.6, SSP2-4.5, and SSP5-8.5. Data was processed using xarray and regionmask.

---

## Visualizations

### Carbon Blocks — Atmospheric CO₂

**Source:** IPCC AR6-consistent parametric curves

CO₂ concentrations are derived from IPCC Sixth Assessment Report (AR6) scenario-consistent trajectories rather than raw CMIP6 model output. Each cell in the grid represents 1 ppm of CO₂, with pre-industrial baseline (280 ppm) shaded separately from human-added excess.

---

### Line Charts — CO₂, Temperature, Sea Level, Precipitation

**Source:** CMIP6 / MPI-ESM1-2-LR via NOAA / Google Cloud

- **CO₂**: IPCC AR6-consistent parametric curves (see above)
- **Temperature** (`tas`): Global mean surface temperature anomaly relative to 1995–2014 baseline
- **Sea Level**: IPCC AR6-consistent parametric curves for thermal expansion and ice melt contributions
- **Precipitation** (`pr`): Drought-affected land area derived from soil moisture and precipitation fields

---

### Warming Stripes

**Source:** CMIP6 / MPI-ESM1-2-LR — `tas` (surface temperature anomaly)

Each stripe represents one year of global mean temperature anomaly from 1980 to 2100. The color scale maps from cool blue (near 0°C anomaly) to deep red (+5.5°C).

---

### Thermometer

**Source:** CMIP6 / MPI-ESM1-2-LR — `tas` (surface temperature anomaly)

Displays the smoothed global mean temperature anomaly at a given year. Milestone annotations (coral bleaching thresholds, wet-bulb limits, etc.) are drawn from IPCC AR6 and peer-reviewed literature.

---

### Sea Level Cross-Section

**Source:** IPCC AR6-consistent parametric sea level curves

The visual cross-section shows cumulative sea level rise in centimeters above the 2025 baseline. Ocean surface temperature anomaly is estimated at ~72% of the land warming rate, consistent with observed ocean-atmosphere coupling.

---

### Arctic Sea Ice Disc

**Source:** CMIP6 / MPI-ESM1-2-LR — `siconc` (sea ice concentration)

Displays projected September Arctic sea ice minimum extent in millions of km². The disc radius is scaled relative to the approximate 1979 satellite-era baseline of 7.5 million km². Raw CMIP6 `siconc` data drives the value directly. Data was fetched via `fetch_sea_ice.py` and stored in `data/sea_ice_extent.json`.

---

### Vegetation / Grass Field

**Source:** CMIP6 / MPI-ESM1-2-LR — `tas` (surface temperature anomaly)

Vegetation health and heat stress levels are derived from the CMIP6 surface temperature anomaly using a heat stress proxy model. Higher temperature anomalies translate to increased soil moisture loss and vegetation wilting. This is a derived visualization, not a direct measurement of vegetation cover.

---

### Soil Moisture Gauge

**Source:** CMIP6 / MPI-ESM1-2-LR — `mrso` (total column soil moisture)

The gauge displays a normalized soil moisture index (0–100) and drought-affected land percentage derived from the `mrso` variable. Anomalies are shown in kg/m² relative to the 1995–2014 baseline. Data was fetched via `fetch_soil_moisture.py` and stored in `data/soil_moisture.json`.

---

### Biome Precipitation Bar Chart

**Source:** CMIP6 / MPI-ESM1-2-LR — `pr` (precipitation), masked by WWF terrestrial biomes

Precipitation anomalies (% change vs. 1995–2014 baseline) are computed per biome using area-weighted annual means, smoothed with a 10-year trailing mean. Biome boundaries come from the WWF Terrestrial Ecoregions shapefile. Data was processed by `fetch_biome_precip.py` and stored in `data/biome_precip.json`.

---

## Tools & Processing

| Tool | Purpose |
|------|---------|
| xarray | Reading and processing CMIP6 Zarr datasets |
| regionmask | Masking CMIP6 grid cells by country and biome |
| gcsfs | Accessing CMIP6 data on Google Cloud Storage |
| pandas | Catalog management and CSV I/O |
