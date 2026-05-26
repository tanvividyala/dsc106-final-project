# Degrees of Consequence
A choose-your-own adventure style visualization of different potential futures of climate change.

### Team Members 
Tanvi Vidyala
Nithya Nair
Viela Lansangam

## Dataset Chosen
### Coupled Model Intercomparison Project (CMIP6)
The CMIP6 dataset contains global climate model simulations produced by research centers around the world under the World Climate Research Programme. These simulations include temperature, sea levels, precipitation, and greenhouse gas projections across multiple climate scenarios.
Address: NOAA Public CMIP6 Dataset on Google Cloud Marketplace

## Writeup
We want to create a choose-your-own adventure style article where the user can make policy choices that’ll land them in one of these 3 buckets. 

**SSP1-2.6:** Low GHG emissions with CO2 declining to net zero around or after 2050, followed by net negative emissions (the sustainability path, warming held below 2°C.)
**SSP2-4.5:** CO2 emissions hover around current levels before beginning to decline by mid-century, with socioeconomic factors following historical trends and no significant change, projected at 2.7°C warming by 2100.
**SSP5-8.5:** Very high GHG emissions with CO2 roughly doubling from current levels by 2050, driven by fossil-fueled development, projected at 3.3°C to 5.7°C warming by 2100.

These decisions will be done using a knob visualization (with some preset knobs: e.g. oil tycoon, politician, climate scientist). 

After being classified into a bucket, the site will take you into a timeline visualization of how the world would look based on the decisions you’ve made year-by-year, focusing on temperature, precipitation, sea level, and CO2 emissions.

Finally, at the end you can see how your world compares to the other 2 potential futures (there’ll be a more simple breakdown for this). 

## EDA
Comparing The Outcomes of Different Scenarios

### CO2 Concentration
It seems like ppm really begins to diverge among the scenarios around 2030. 


### Sea Level Rise
The sea level rises in all three scenarios, but tends to be heading in a downward trajectory for low and grows exponentially in the high scenario. 


### Precipitation
There does seem to be too much of a difference in precipitation anomaly among the three scenarios. 


### Temperature Anomaly
The temperature anomalies for each of the scenarios tends to stay the same until around 2040, when they begin to dramatically shift. 


### Global Inequality
Although the previous charts show that under SSP5-8.5, the global temperature increases by 4°C, the red density histogram below shows that this increase isn’t equal. A significant proportion of countries have a temperature increase of 5-6°C. Under SSP1-2.6 (the blue histogram), the majority of countries have only a 1°C increase in temperature. 

The distribution of countries by variation in precipitation change is similar for SSP1-2.6 and SSP2-4.5 – in other words, most countries don’t experience much change for either scenario. However, for SSP5-8.5, there are extreme outliers in both directions – in other words, there are several countries that experience extreme changes in precipitation.


## Inspiration
- https://ai-2027.com/ (Especially the small dynamic visualization on the side that changes with each year in the timeline)
- 