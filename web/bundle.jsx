// ============================================================
// bundle.jsx — Degrees of Consequence
// Real CMIP6 data from MPI-ESM1-2-LR via NOAA/Google Cloud.
// Temp: global country-mean anomaly vs 1850-1900 baseline.
// Precip: global linear trend, re-anchored to 2025.
// CO₂ + sea level: IPCC AR6-consistent parametric curves.
// ============================================================

// ── Continent polygons (lat/lon) for the halftone globe ──
const CONTINENTS = [
  [[72,-156],[72,-100],[60,-60],[45,-55],[35,-75],[25,-80],[15,-92],[18,-105],[28,-115],[40,-125],[60,-140],[72,-156]],
  [[18,-92],[15,-88],[10,-83],[8,-78],[12,-72],[18,-92]],
  [[12,-72],[8,-58],[5,-50],[-5,-35],[-23,-40],[-35,-56],[-55,-67],[-50,-75],[-20,-78],[-5,-78],[8,-78],[12,-72]],
  [[35,-10],[35,12],[32,22],[30,33],[12,42],[10,51],[-12,40],[-26,33],[-35,18],[-22,12],[-5,8],[8,-10],[20,-17],[30,-12],[35,-10]],
  [[70,-10],[70,30],[60,30],[55,12],[42,9],[36,-9],[50,-9],[70,-10]],
  [[70,30],[75,100],[72,140],[60,165],[50,160],[40,140],[30,125],[20,110],[10,100],[8,78],[20,68],[35,55],[42,50],[55,42],[60,55],[68,55],[70,30]],
  [[5,95],[2,105],[-5,118],[-8,135],[-3,140],[5,130],[5,95]],
  [[-12,135],[-15,145],[-25,153],[-38,148],[-37,140],[-32,118],[-20,115],[-12,128],[-12,135]],
  [[-66,-180],[-66,-90],[-70,0],[-66,90],[-66,180],[-90,180],[-90,-180],[-66,-180]],
  [[83,-30],[78,-15],[60,-42],[70,-55],[83,-30]],
];

function pointInPoly(lat, lon, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [yi, xi] = poly[i]; const [yj, xj] = poly[j];
    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lon < (xj - xi) * (lat - yi) / ((yj - yi) || 1e-9) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function isLand(lat, lon) {
  for (const poly of CONTINENTS) if (pointInPoly(lat, lon, poly)) return true;
  return false;
}

// ── Halftone globe ──
function HalftoneGlobe({ size = 480, rotation = 0, density = 38, color = '#2A3324' }) {
  const r = size / 2 - 4;
  const cx = size / 2, cy = size / 2;
  const dots = [];
  const N = density * density;
  const tilt = 0.32;
  const cosT = Math.cos(tilt), sinT = Math.sin(tilt);

  for (let i = 0; i < N; i++) {
    const phi = Math.acos(1 - 2 * (i + 0.5) / N);
    const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
    const lat = 90 - (phi * 180 / Math.PI);
    let lon = ((theta * 180 / Math.PI + rotation * 180 / Math.PI) % 360);
    if (lon > 180) lon -= 360; if (lon < -180) lon += 360;
    const latR = lat * Math.PI / 180, lonR = lon * Math.PI / 180;
    let x = Math.cos(latR) * Math.sin(lonR);
    let y = -Math.sin(latR);
    let z = Math.cos(latR) * Math.cos(lonR);
    const ty = y * cosT - z * sinT; const tz = y * sinT + z * cosT;
    y = ty; z = tz;
    if (z < -0.05) continue;
    const land = isLand(lat, lon);
    const px = cx + x * r, py = cy + y * r;
    const baseSz = land ? 2.4 : 1.1;
    const sz = baseSz * (0.55 + (z + 1) * 0.32);
    const op = land ? 0.55 + Math.max(0, z) * 0.45 : 0.18 + Math.max(0, z) * 0.18;
    dots.push({ px, py, sz, op });
  }

  return (
    <svg viewBox={`0 0 ${size} ${size}`}>
      <defs><clipPath id="globe-clip"><circle cx={cx} cy={cy} r={r}/></clipPath></defs>
      <g clipPath="url(#globe-clip)">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeOpacity="0.12" strokeWidth="1"/>
        {dots.map((d, i) => <circle key={i} cx={d.px} cy={d.py} r={d.sz} fill={color} opacity={d.op}/>)}
      </g>
    </svg>
  );
}

// ── Knob ──
function Knob({ value, onChange, color = '#4E7558', label, img }) {
  const ref = React.useRef(null);
  const dragRef = React.useRef(null);

  const handleDown = (e) => {
    e.preventDefault();
    const startY = e.touches ? e.touches[0].clientY : e.clientY;
    dragRef.current = { startY, startVal: value };
    const onMove = (ev) => {
      const y = ev.touches ? ev.touches[0].clientY : ev.clientY;
      const delta = (dragRef.current.startY - y) * 0.8;
      onChange(Math.max(0, Math.min(100, Math.round(dragRef.current.startVal + delta))));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
  };

  const minA = -135, maxA = 135;
  const angle = minA + (value / 100) * (maxA - minA);
  const cx = 60, cy = 60, r = 46;
  const a0 = (minA - 90) * Math.PI / 180;
  const a1 = (angle - 90) * Math.PI / 180;
  const a2 = (maxA - 90) * Math.PI / 180;
  const arc = (start, end) => {
    const sx = cx + r * Math.cos(start), sy = cy + r * Math.sin(start);
    const ex = cx + r * Math.cos(end), ey = cy + r * Math.sin(end);
    const large = (end - start) > Math.PI ? 1 : 0;
    return `M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`;
  };

  const ticks = [];
  for (let i = 0; i <= 10; i++) {
    const t = minA + (i / 10) * (maxA - minA);
    const rad = (t - 90) * Math.PI / 180;
    ticks.push(
      <line key={i}
        x1={cx + 50 * Math.cos(rad)} y1={cy + 50 * Math.sin(rad)}
        x2={cx + 56 * Math.cos(rad)} y2={cy + 56 * Math.sin(rad)}
        stroke="currentColor" strokeWidth="1" opacity={i % 5 === 0 ? 0.7 : 0.3}
      />
    );
  }

  return (
    <div className="knob">
      {img && <img src={img} alt="" className="knob-img"/>}
      <div className="knob-dial" ref={ref} onMouseDown={handleDown} onTouchStart={handleDown} aria-label={label}>
        <svg viewBox="0 0 120 120">
          <path d={arc(a0, a2)} stroke="rgba(42,51,36,0.18)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          <path d={arc(a0, a1)} stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          <g style={{ color: '#2A3324' }}>{ticks}</g>
          <circle cx={cx} cy={cy} r={32} fill="#ECE6CE" stroke="#2A3324" strokeWidth="1.25"/>
          <g transform={`rotate(${angle} ${cx} ${cy})`}>
            <line x1={cx} y1={cy - 8} x2={cx} y2={cy - 26} stroke="#2A3324" strokeWidth="2" strokeLinecap="round"/>
            <circle cx={cx} cy={cy - 28} r="3" fill={color}/>
          </g>
        </svg>
      </div>
      <div className="knob-label">{label}</div>
      <div className="knob-value">{value.toString().padStart(2, '0')} / 100</div>
    </div>
  );
}

// ── Persona icons ──
function PersonaIcon({ kind }) {
  const p = { width: 36, height: 36, viewBox: '0 0 36 36', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (kind) {
    case 'tycoon': return <svg {...p}><rect x="6" y="14" width="24" height="16" rx="1.5"/><path d="M 10 14 L 10 8 L 22 8 L 22 14"/><path d="M 14 20 L 14 24 M 18 20 L 18 24 M 22 20 L 22 24"/></svg>;
    case 'politician': return <svg {...p}><circle cx="18" cy="12" r="4.5"/><path d="M 8 30 Q 8 20 18 20 Q 28 20 28 30"/><path d="M 13 15 L 23 15"/></svg>;
    case 'scientist': return <svg {...p}><path d="M 14 6 L 14 14 L 8 28 Q 8 30 10 30 L 26 30 Q 28 30 28 28 L 22 14 L 22 6"/><path d="M 12 6 L 24 6"/><circle cx="15" cy="22" r="1"/><circle cx="20" cy="25" r="1"/></svg>;
    case 'custom': return <svg {...p}><circle cx="18" cy="18" r="10"/><path d="M 18 12 L 18 18 L 22 22"/><path d="M 8 8 L 11 11 M 28 8 L 25 11 M 8 28 L 11 25 M 28 28 L 25 25"/></svg>;
    default: return null;
  }
}

function ArrowIcon() {
  return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="8" x2="14" y2="8"/><polyline points="10 4 14 8 10 12"/></svg>;
}

function DotsDecoration() {
  const dots = [];
  for (let i = 0; i < 18; i++) {
    for (let j = 0; j < 18; j++) {
      const dx = i - 8.5, dy = j - 8.5;
      const d = Math.sqrt(dx*dx + dy*dy);
      if (d < 9) dots.push(<circle key={`${i}-${j}`} cx={i*16+8} cy={j*16+8} r={Math.max(0.5, 3.5 - d*0.25)} fill="currentColor"/>);
    }
  }
  return <svg viewBox="0 0 300 300" className="dots-bg"><g>{dots}</g></svg>;
}

// ============================================================
// Data layer — loaded from climate-data.json
// ============================================================

// Fallback synthetic curves used during data loading
function syntheticCurve(metric, ssp) {
  const params = {
    temp:   { '1-2.6': x => 1.1 + 0.2*x + 0.1*x*x, '2-4.5': x => 1.1 + 1.62*x, '5-8.5': x => 1.1 + 1.8*x + 2.1*x*x },
    co2:    { '1-2.6': x => 420 + 40*x - 50*x*x,     '2-4.5': x => 420 + 170*x - 25*x*x, '5-8.5': x => 420 + 240*x + 210*x*x },
    sea:    { '1-2.6': x => 5 + 30*x,                 '2-4.5': x => 5 + 50*x + 20*x*x,    '5-8.5': x => 5 + 65*x + 65*x*x },
    precip: { '1-2.6': x => 2.38*x,                   '2-4.5': x => 1.58*x,                '5-8.5': x => 2.88*x },
  };
  const result = [];
  for (let yr = 2025; yr <= 2100; yr++) {
    const x = (yr - 2025) / 75;
    result.push({ year: yr, val: params[metric][ssp](x) });
  }
  return result;
}

// CLIMATE is populated once data loads; components re-render via React state
let CLIMATE = null;

function generateCurve(metric, ssp) {
  if (CLIMATE && CLIMATE.metrics[metric] && CLIMATE.metrics[metric][ssp]) {
    return CLIMATE.metrics[metric][ssp];
  }
  return syntheticCurve(metric, ssp);
}

// ============================================================
// Data-driven constants (updated to match real CMIP6 output)
// MPI-ESM1-2-LR single-model ensemble member r1i1p1f1
// ============================================================

// Real values from prepare_climate_data.py summary2100:
//   SSP1-2.6: temp +1.27°C, co2 410 ppm, sea 35 cm, precip +2.38%
//   SSP2-4.5: temp +2.73°C, co2 565 ppm, sea 75 cm, precip +1.58%
//   SSP5-8.5: temp +4.99°C, co2 870 ppm, sea 135 cm, precip +2.88%
// NOTE: SSP1-2.6 temp is lower than multi-model mean (+1.8°C) because this model
// has modest ECS. SSP5-8.5 is higher (+5.0°C) reflecting its high-end response.
// Precip values are smaller than multi-model means (single-model natural variability).

function getSSPData(sspShort) {
  if (CLIMATE && CLIMATE.summary2100 && CLIMATE.summary2100[sspShort]) {
    return CLIMATE.summary2100[sspShort];
  }
  const fallback = {
    '1-2.6': { temp: { val: 1.27 }, co2: { val: 410 }, sea: { val: 35 }, precip: { val: 2.38 } },
    '2-4.5': { temp: { val: 2.73 }, co2: { val: 565 }, sea: { val: 75 }, precip: { val: 1.58 } },
    '5-8.5': { temp: { val: 4.99 }, co2: { val: 870 }, sea: { val: 135 }, precip: { val: 2.88 } },
  };
  return fallback[sspShort];
}

// ── Knob / persona definitions ──
const KNOB_DEFS = [
  { id: 'fossil',  label: 'Fossil-fuel\ninvestment',   shortLabel: 'Fossil fuel',    description: 'How heavily the framework keeps investing in extracting and burning oil, gas, and coal.', color: '#B4633A', invert: true, img: '../images/coal_mine_cart.png' },
  { id: 'renew',   label: 'Renewable\nbuildout',        shortLabel: 'Renewables',     description: 'How fast new wind, solar, and clean energy gets built and funded.',                        color: '#4E7558',               img: '../images/solar_panel.png' },
  { id: 'carbon',  label: 'Carbon\npricing',            shortLabel: 'Carbon pricing', description: 'Whether burning carbon costs money, and how much.',                                       color: '#4E7558',               img: '../images/capitol_building.png' },
  { id: 'forest',  label: 'Forest &\nland protection',  shortLabel: 'Forests & land', description: 'How much land gets protected from deforestation and degradation.',                          color: '#82A78A',               img: '../images/rainforest.png' },
  { id: 'coop',    label: 'International\ncooperation', shortLabel: 'Cooperation',    description: 'Whether countries work together or compete when it comes to climate action.',               color: '#82A78A',               img: '../images/handshake.png' },
  { id: 'consume', label: 'Consumption\nreduction',     shortLabel: 'Consumption',    description: 'How much the framework tries to reduce overall demand for energy and goods.',              color: '#82A78A',               img: '../images/recycling.png' },
];

const PERSONAS = [
  { id: 'tycoon',     keywords: 'ENERGY · EXTRACTION · GROWTH',      name: 'The Oil Tycoon',        label: 'Drill, baby, drill',    tag: 'Oil built the modern world, and he plans to keep it that way. Future costs are someone else\'s problem.',       img: '../images/oil_baron_floating.png',  values: { fossil: 92, renew: 12, carbon: 6,  forest: 18, coop: 18, consume: 8  } },
  { id: 'politician', keywords: 'POLITICS · COMPROMISE · OPTICS',    name: 'The Politician',        label: 'Split the difference',  tag: 'He talks green and votes convenient. Every choice is filtered through the next election.',      img: '../images/parliament_debate.png',   values: { fossil: 58, renew: 48, carbon: 38, forest: 42, coop: 50, consume: 32 } },
  { id: 'scientist',  keywords: 'PATHWAY · PROJECTION · EVIDENCE',   name: 'The Climate Scientist', label: 'Follow the data',       tag: 'The IPCC curves are her north star. Decarbonize by 2050 or the math does not work.',            img: '../images/stressed_researcher.png', values: { fossil: 8,  renew: 92, carbon: 84, forest: 86, coop: 88, consume: 76 } },
];

const PERSONA_THOUGHTS = {
  tycoon: {
    fossil:  'In this framework, oil and gas are not optional; they are civilization\'s scaffolding. Expansion continues, and any phase-out is treated as a problem for a later decade.',
    renew:   'Renewables are a supplement, not a replacement. They get funded where politically unavoidable, then quietly deprioritized.',
    carbon:  'There is no carbon tax in this framework. That conversation ends before it begins.',
    forest:  'Protected areas get lip service. Where they conflict with extraction rights, extraction wins.',
    coop:    'International agreements are PR exercises. Real decisions happen at home, for domestic benefit.',
    consume: 'Asking people to consume less is political suicide. Demand is allowed to grow unchecked.',
  },
  politician: {
    fossil:  'Fossil fuels cannot be killed overnight, not without losing the next election. This framework manages the decline slowly enough that no one constituency feels the pain all at once.',
    renew:   'Renewables get funded, because the optics are good and the costs have come down. But the pace is calibrated to the news cycle, not the atmosphere.',
    carbon:  'A carbon price gets discussed, watered down, and passed in a form that satisfies no one. Progress on paper.',
    forest:  'Conservation gets announced in election years. Enforcement is inconsistent.',
    coop:    'International climate summits get attended, agreements get signed, and targets get set for 2050. Someone else\'s problem.',
    consume: 'Consumption reduction does not poll well. It gets quietly dropped from every platform.',
  },
  scientist: {
    fossil:  'New extraction halts this decade. Existing wells phase out on a schedule the IEA has already drawn. There is no pathway to 1.5 degrees C that includes new oil.',
    renew:   'The grid can run on renewables by 2035. Not as an aspiration, but as an engineering reality. This framework funds it accordingly.',
    carbon:  'A price on carbon is the most powerful lever in the toolkit. Every tonne costs something. Revenue gets rebated to households.',
    forest:  'Tropical forests sequester 2.6 billion tonnes of CO2 per year. This framework treats every hectare as load-bearing infrastructure.',
    coop:    'The Paris Agreement is the floor, not the ceiling. Technology transfer, shared grids, and common carbon markets are the actual mechanisms.',
    consume: 'Absolute material consumption must decline in wealthy countries. Efficiency is necessary but not sufficient. Demand must also fall.',
  },
};

function computeScore(v) {
  return Math.round(((100 - v.fossil) + v.renew + v.carbon + v.forest + v.coop + v.consume) / 6);
}

function classify(score) {
  const d = getSSPData;
  if (score >= 65) return { code: 'SSP1-2.6', name: 'Sustainable',    delta: +(d('1-2.6').temp.val).toFixed(1), swatch: '#82A78A' };
  if (score >= 35) return { code: 'SSP2-4.5', name: 'Middle Road',    delta: +(d('2-4.5').temp.val).toFixed(1), swatch: '#C49B5E' };
  return                   { code: 'SSP5-8.5', name: 'Fossil-Fueled', delta: +(d('5-8.5').temp.val).toFixed(1), swatch: '#B4633A' };
}

// ── CMIP scenario cards — values from real data ──
// Ranges from IPCC AR6 multi-model uncertainty bands

const METRICS = [
  { id: 'temp',   label: 'Temperature',   unit: '°C',  short: 'Surface anomaly' },
  { id: 'co2',    label: 'CO₂',           unit: 'ppm', short: 'Atmospheric concentration' },
  { id: 'sea',    label: 'Sea level',     unit: 'cm',  short: 'Cumulative rise' },
  { id: 'precip', label: 'Precipitation', unit: '%',   short: 'Anomaly vs. 2025' },
];

const METRIC_THEMES = {
  temp:   { bg: '#2A3324', fg: '#ECE6CE', accent: '#E08D5C', soft: 'rgba(236,230,206,0.6)',  faint: 'rgba(236,230,206,0.15)', label: 'Temperature',           unit: '°C',  chapter: 'Three · A', title: 'The Heat',        icon: 'temp',   img: '../images/smoggy_sun.png' },
  co2:    { bg: '#ECE6CE', fg: '#2A3324', accent: '#2A3324', soft: 'rgba(42,51,36,0.6)',      faint: 'rgba(42,51,36,0.15)',    label: 'CO₂',              unit: 'ppm', chapter: 'Three · B', title: 'The Atmosphere',  icon: 'co2',    img: '../images/urban_air_pollution.png' },
  sea:    { bg: '#2E4A35', fg: '#ECE6CE', accent: '#82A78A', soft: 'rgba(236,230,206,0.6)',  faint: 'rgba(236,230,206,0.15)', label: 'Sea level rise',        unit: 'cm',  chapter: 'Three · C', title: 'The Rising Sea',  icon: 'sea',    img: '../images/coastal_flooding.png' },
  precip: { bg: '#D4D2BB', fg: '#2A3324', accent: '#4E7558', soft: 'rgba(42,51,36,0.6)',      faint: 'rgba(42,51,36,0.15)',    label: 'Precipitation anomaly', unit: '%',   chapter: 'Three · D', title: 'The Rains',       icon: 'precip', img: '../images/typhoon.png' },
};

// ── Narrative beats (verbatim from design handoff) ──
const METRIC_BEATS = {
  temp: {
    '1-2.6': [
      { year: 2030, title: 'Peak heat, by the skin of our teeth', body: 'Hot summers still set records, but the rate of warming starts to bend. EVs overtake combustion in every G20 market.' },
      { year: 2050, title: 'Warming stabilizes', body: 'Net-zero arrives. Temperature anomaly plateaus near +1.3°C. Heatwaves intensify regionally but the worst projections are off the table.' },
      { year: 2080, title: 'A new normal', body: 'Anomaly holds under 1.5°C. Coral systems are stressed but largely intact. The Arctic ice cap thins but persists in summer.' },
    ],
    '2-4.5': [
      { year: 2030, title: 'The records keep falling', body: 'Each decade sets new heat records. Climate adaptation becomes a budget line item in every advanced economy.' },
      { year: 2050, title: 'Heatwaves go chronic', body: 'Wet-bulb temperatures cross dangerous thresholds in South Asia and the Gulf for weeks at a time.' },
      { year: 2080, title: 'A warmer world locked in', body: 'Anomaly approaches 2.7°C. Air conditioning is the new running water. Insurance markets retreat from the Gulf Coast.' },
    ],
    '5-8.5': [
      { year: 2030, title: 'The thermometer goes vertical', body: 'No abatement. Each summer eclipses the last. Wildfires double in the boreal north.' },
      { year: 2050, title: 'Wet-bulb survivability fails', body: 'Multiple regions exceed 35°C wet-bulb for weeks. Outdoor work bans expand. Lethal heat events become routine.' },
      { year: 2080, title: 'Approaching +5°C', body: 'This model shows higher warming than the multi-model mean, near 5°C. Permafrost methane breaches the carbon budget. Feedback loops engage.' },
    ],
  },
  co2: {
    '1-2.6': [
      { year: 2030, title: 'Emissions peak', body: 'Coal plants close ahead of schedule. CO₂ growth slows dramatically.' },
      { year: 2050, title: 'Net zero achieved', body: 'Atmospheric concentration plateaus near 430 ppm and begins to inch down.' },
      { year: 2080, title: 'Net negative emissions', body: 'For the first time in the industrial era, humanity pulls more carbon from the air than it emits.' },
    ],
    '2-4.5': [
      { year: 2030, title: 'Plateau, not decline', body: 'Emissions flatten as renewables grow, but fossil fuels do not retreat. Concentration climbs steadily.' },
      { year: 2050, title: 'Slow descent begins', body: 'Emissions finally start to fall by mid-century. CO₂ passes 520 ppm.' },
      { year: 2080, title: 'Locked-in carbon', body: 'Despite cuts, accumulated CO₂ approaches 565 ppm, roughly double the pre-industrial baseline.' },
    ],
    '5-8.5': [
      { year: 2030, title: 'Coal comes back', body: 'New gas and coal plants outpace retirements. Emissions accelerate.' },
      { year: 2050, title: 'CO₂ doubles', body: 'Concentration crosses 630 ppm, a level Earth has not seen in 50 million years.' },
      { year: 2080, title: 'Off-the-charts atmosphere', body: 'CO₂ approaches 870 ppm. The carbon sinks (forests and oceans) saturate and begin to leak.' },
    ],
  },
  sea: {
    '1-2.6': [
      { year: 2040, title: 'Linear, predictable rise', body: 'Sea level climbs steadily at approximately 4-5 mm per year. Coastal cities retain sufficient time to plan and adapt.' },
      { year: 2070, title: 'Retrofits hold', body: 'Seawalls and managed retreat protect most large cities. Some low-lying communities relocate.' },
      { year: 2090, title: 'Manageable rise', body: 'Cumulative rise approaches 35 cm. Difficult, but adaptable.' },
    ],
    '2-4.5': [
      { year: 2040, title: 'The rate accelerates', body: 'Greenland ice sheet contributions ramp up. Insurance markets buckle in low-lying regions.' },
      { year: 2070, title: 'Selective retreat', body: 'Whole neighborhoods of Miami, Jakarta, and Lagos abandoned. Rise approaches 50 cm.' },
      { year: 2090, title: 'Coastal redraw', body: 'Sea level rise hits 75 cm. Climate-driven migration redraws political maps.' },
    ],
    '5-8.5': [
      { year: 2040, title: 'Antarctic ice destabilizes', body: 'West Antarctic ice sheet enters runaway melt. Rate of rise doubles.' },
      { year: 2070, title: 'Coastlines erased', body: 'Multiple island nations dissolved. Cumulative rise approaches 90 cm.' },
      { year: 2090, title: 'Over a meter', body: 'Cumulative rise approaches 135 cm. Sea level becomes one of the dominant political forces of the century.' },
    ],
  },
  precip: {
    '1-2.6': [
      { year: 2040, title: 'Subtle shifts', body: 'Wet regions get slightly wetter, dry ones slightly drier. In this model, global mean precipitation rises modestly, approximately +1% above 2025 levels.' },
      { year: 2070, title: 'Crop belts adjust', body: 'Agricultural zones shift north by 200 to 400 km. Mostly orderly transitions in this low-warming scenario.' },
      { year: 2090, title: 'Stable hydrology', body: 'Global precipitation anomaly settles around +2.4% vs 2025. Drought and flood frequencies remain manageable.' },
    ],
    '2-4.5': [
      { year: 2040, title: 'Muted global signal', body: 'This model shows smaller global precipitation change under SSP2-4.5 than the multi-model mean, though regional disruptions can still be severe.' },
      { year: 2070, title: 'Regional divergence', body: 'While the global mean stays near the 2025 baseline, major river basins face stress. The Colorado and Ganges run low.' },
      { year: 2090, title: 'Wet/dry extremes', body: 'The global average masks large regional swings: drying in the subtropics, intensifying monsoons elsewhere.' },
    ],
    '5-8.5': [
      { year: 2040, title: 'Hydrologic whiplash', body: 'Extreme floods and droughts begin oscillating. The Amazon hits early tipping points. Global precip creeps above the 2025 baseline.' },
      { year: 2070, title: 'Intensifying cycle', body: 'Greater atmospheric moisture drives more extreme events, even where the global mean change appears modest in this model.' },
      { year: 2090, title: 'A stressed cycle', body: 'Global anomaly ~+2.9% vs 2025. Behind that number: mega-droughts in some regions, catastrophic flooding in others.' },
    ],
  },
};

// ── Metric visualizations ──

function TempViz({ value, year, color, fg, faint }) {
  const intensity = Math.max(0, Math.min(1, (value - 0.8) / 5.0));
  const orbColor = `oklch(${0.78 - intensity*0.32} ${0.06 + intensity*0.12} ${50 - intensity*15})`;
  const haloColor = `oklch(${0.6 - intensity*0.25} ${0.08 + intensity*0.14} ${50 - intensity*15})`;

  return (
    <svg viewBox="0 0 400 400" width="100%" height="auto">
      <defs>
        <radialGradient id="heatGrad">
          <stop offset="0%" stopColor={orbColor} stopOpacity="0.9"/>
          <stop offset="60%" stopColor={haloColor} stopOpacity="0.4"/>
          <stop offset="100%" stopColor={haloColor} stopOpacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="200" cy="200" r={120 + intensity * 40} fill="url(#heatGrad)"/>
      <circle cx="200" cy="200" r="175" fill="none" stroke={faint} strokeWidth="1"/>
      {Array.from({ length: 76 }).map((_, i) => {
        const ang = (i / 75) * Math.PI * 2 - Math.PI / 2;
        const isMile = (2025 + i) % 10 === 0;
        const r1 = 170, r2 = isMile ? 180 : 176;
        return <line key={i}
          x1={200 + r1 * Math.cos(ang)} y1={200 + r1 * Math.sin(ang)}
          x2={200 + r2 * Math.cos(ang)} y2={200 + r2 * Math.sin(ang)}
          stroke={faint} strokeWidth={isMile ? 1.5 : 1}/>;
      })}
      <path
        d={`M ${200 + 175 * Math.cos(-Math.PI/2)} ${200 + 175 * Math.sin(-Math.PI/2)} A 175 175 0 ${((year-2025)/75) > 0.5 ? 1 : 0} 1 ${200 + 175 * Math.cos(-Math.PI/2 + (year-2025)/75 * Math.PI*2)} ${200 + 175 * Math.sin(-Math.PI/2 + (year-2025)/75 * Math.PI*2)}`}
        stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round"
      />
      {(() => {
        const ang = -Math.PI/2 + (year-2025)/75 * Math.PI*2;
        return <circle cx={200 + 175 * Math.cos(ang)} cy={200 + 175 * Math.sin(ang)} r="6" fill={color}/>;
      })()}
      <circle cx="200" cy="200" r="80" fill={orbColor}/>
      <circle cx="200" cy="200" r="80" fill="none" stroke={fg} strokeWidth="1.5" opacity="0.3"/>
      <text x="200" y="195" textAnchor="middle" fontFamily="var(--serif)" fontSize="54" fill={fg}>+{value.toFixed(1)}</text>
      <text x="200" y="222" textAnchor="middle" fontFamily="var(--mono)" fontSize="11" letterSpacing="0.2em" fill={fg} opacity="0.7">°C ANOMALY</text>
      <text x="200" y="14" textAnchor="middle" fontFamily="var(--mono)" fontSize="9" letterSpacing="0.16em" fill={fg} opacity="0.55">2025</text>
      <text x="394" y="204" textAnchor="end" fontFamily="var(--mono)" fontSize="9" letterSpacing="0.16em" fill={fg} opacity="0.55">2050</text>
      <text x="200" y="396" textAnchor="middle" fontFamily="var(--mono)" fontSize="9" letterSpacing="0.16em" fill={fg} opacity="0.55">2075</text>
      <text x="6" y="204" fontFamily="var(--mono)" fontSize="9" letterSpacing="0.16em" fill={fg} opacity="0.55">2100</text>
    </svg>
  );
}

function CO2Viz({ value, year, color, fg, faint, soft }) {
  const cells = 900;
  const filled = Math.round(((value - 280) / 600) * cells);
  const baselineFilled = 140;
  const cellSize = 11, gap = 1;
  const dots = [];
  for (let i = 0; i < cells; i++) {
    const r = Math.floor(i / 30), c = i % 30;
    const x = 20 + c * (cellSize + gap), y = 30 + r * (cellSize + gap);
    let kind = i < baselineFilled ? 'baseline' : i < filled ? 'added' : 'empty';
    dots.push({ x, y, kind });
  }
  return (
    <svg viewBox="0 0 400 420" width="100%" height="auto">
      <text x="20" y="22" fontFamily="var(--mono)" fontSize="10" letterSpacing="0.16em" fill={soft}>EACH DOT ≈ 1 PPM CO₂</text>
      {dots.map((d, i) => d.kind === 'empty'
        ? <rect key={i} x={d.x} y={d.y} width={cellSize} height={cellSize} fill="none" stroke={faint} strokeWidth="0.6" rx="1"/>
        : <rect key={i} x={d.x} y={d.y} width={cellSize} height={cellSize} fill={d.kind === 'baseline' ? soft : color} rx="1.5"/>
      )}
      <text x="20" y="412" fontFamily="var(--mono)" fontSize="10" letterSpacing="0.16em" fill={soft}>1750 BASELINE 280 PPM</text>
      <text x="380" y="412" textAnchor="end" fontFamily="var(--mono)" fontSize="10" letterSpacing="0.16em" fill={color}>{year} · {Math.round(value)} PPM</text>
    </svg>
  );
}

function SeaViz({ value, year, color, fg, faint, soft, bg }) {
  const w = 400, h = 420;
  const seaY = h - 60 - Math.min(value, 200) * 1.4;
  const baselineY = h - 60;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="auto">
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={fg} stopOpacity="0.08"/>
          <stop offset="1" stopColor={fg} stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.85"/>
          <stop offset="1" stopColor={color} stopOpacity="1"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={w} height={h} fill="url(#skyGrad)"/>
      {[0, 50, 100, 150, 200].map(cm => {
        const y = baselineY - cm * 1.4;
        return <g key={cm}>
          <line x1="350" y1={y} x2="370" y2={y} stroke={faint} strokeWidth="1"/>
          <text x="376" y={y + 3} fontFamily="var(--mono)" fontSize="9" letterSpacing="0.08em" fill={soft}>{cm}cm</text>
        </g>;
      })}
      <path d={`M 0 ${baselineY} L 60 ${baselineY} L 80 ${baselineY - 4} L 140 ${baselineY - 4} L 170 ${baselineY - 30} L 230 ${baselineY - 30} L 250 ${baselineY - 12} L 340 ${baselineY - 12} L 340 ${h} L 0 ${h} Z`} fill={fg} opacity="0.18"/>
      <g transform={`translate(190 ${baselineY - 30})`}>
        <path d="M -6 0 L 6 0 L 4 -52 L -4 -52 Z" fill={fg} opacity="0.9"/>
        <rect x="-7" y="-58" width="14" height="6" fill={fg} opacity="0.9"/>
        <circle cx="0" cy="-66" r="4" fill={color}/>
      </g>
      <g transform={`translate(80 ${baselineY - 4})`}>
        <rect x="0" y="-44" width="22" height="44" fill={fg} opacity="0.85"/>
        {[[4,-38],[14,-38],[4,-26],[14,-26],[4,-14],[14,-14]].map(([ox,oy],k) => <rect key={k} x={ox} y={oy} width="4" height="4" fill={bg}/>)}
      </g>
      <g transform={`translate(110 ${baselineY - 4})`}>
        <rect x="0" y="-28" width="18" height="28" fill={fg} opacity="0.75"/>
        {[[3,-22],[12,-22],[3,-10],[12,-10]].map(([ox,oy],k) => <rect key={k} x={ox} y={oy} width="3" height="4" fill={bg}/>)}
      </g>
      <g transform={`translate(260 ${baselineY - 12})`}>
        <rect x="0" y="-32" width="20" height="32" fill={fg} opacity="0.85"/>
        {[[3,-26],[13,-26],[3,-14],[13,-14]].map(([ox,oy],k) => <rect key={k} x={ox} y={oy} width="4" height="4" fill={bg}/>)}
      </g>
      <line x1="0" y1={baselineY} x2="340" y2={baselineY} stroke={fg} strokeWidth="0.8" opacity="0.35" strokeDasharray="3 3"/>
      <text x="6" y={baselineY - 4} fontFamily="var(--mono)" fontSize="9" letterSpacing="0.12em" fill={soft}>2025 BASELINE</text>
      <rect x="0" y={seaY} width={340} height={h - seaY} fill="url(#waterGrad)"/>
      <path d={`M 0 ${seaY} Q 20 ${seaY-3} 40 ${seaY} T 80 ${seaY} T 120 ${seaY} T 160 ${seaY} T 200 ${seaY} T 240 ${seaY} T 280 ${seaY} T 320 ${seaY} L 340 ${seaY}`} stroke={fg} strokeWidth="0.8" fill="none" opacity="0.4"/>
      <text x="6" y="22" fontFamily="var(--mono)" fontSize="10" letterSpacing="0.16em" fill={soft}>{year} · CUMULATIVE RISE</text>
      <text x="6" y="56" fontFamily="var(--serif)" fontSize="36" fill={fg}>+{Math.round(value)}<tspan fontSize="14" fill={soft}> cm</tspan></text>
    </svg>
  );
}

function PrecipViz({ value, year, color, fg, faint, soft }) {
  const w = 400, h = 420;
  // value is % anomaly vs 2025, range ~0-3% for this model
  // Show both global change and contextual extremes
  const absVal = Math.abs(value);
  const droughtFrac = 0.40 + absVal * 0.025;
  const numDrops = Math.round(80 + absVal * 15);
  const drops = [];
  for (let i = 0; i < numDrops; i++) {
    const seed = (i * 9973) % 1000 / 1000, seed2 = (i * 1597) % 1000 / 1000;
    drops.push({ x: 20 + seed * 360, y: 240 + seed2 * 150, len: 4 + ((i * 31) % 100) / 100 * 6 });
  }
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="auto">
      <g>
        <rect x="20" y="20" width="360" height="190" fill={faint} rx="6"/>
        <text x="32" y="42" fontFamily="var(--mono)" fontSize="10" letterSpacing="0.16em" fill={soft}>DROUGHT SHARE OF LAND AREA</text>
        <text x="32" y="100" fontFamily="var(--serif)" fontSize="48" fill={fg}>{Math.round(droughtFrac * 100)}<tspan fontSize="16" fill={soft}>%</tspan></text>
        {Array.from({ length: 8 }).map((_, i) => (
          <g key={i}>
            <path d={`M ${50 + i * 40} 130 L ${60 + i * 40} 150 L ${50 + i * 40} 170 L ${65 + i * 40} 190`} stroke={color} strokeWidth="1.2" fill="none" opacity={0.4 + absVal*0.06}/>
            <path d={`M ${36 + i * 40} 145 L ${44 + i * 40} 165`} stroke={color} strokeWidth="0.8" fill="none" opacity={0.25 + absVal*0.04}/>
          </g>
        ))}
      </g>
      <g>
        <rect x="20" y="220" width="360" height="190" fill="none" stroke={faint} strokeWidth="1" rx="6"/>
        <text x="32" y="242" fontFamily="var(--mono)" fontSize="10" letterSpacing="0.16em" fill={soft}>EXTREME-RAINFALL DAYS / YR</text>
        <text x="32" y="300" fontFamily="var(--serif)" fontSize="48" fill={fg}>{Math.round(10 + absVal * 3)}<tspan fontSize="16" fill={soft}> days</tspan></text>
        {drops.map((d, i) => <line key={i} x1={d.x} y1={d.y} x2={d.x - 2} y2={d.y + d.len} stroke={color} strokeWidth="1" opacity="0.65"/>)}
      </g>
      <text x="32" y="416" fontFamily="var(--mono)" fontSize="10" letterSpacing="0.18em" fill={soft}>{year} · GLOBAL ANOMALY {value >= 0 ? '+' : ''}{value.toFixed(1)}% VS 2025</text>
      <text x="380" y="416" textAnchor="end" fontFamily="var(--mono)" fontSize="9" letterSpacing="0.1em" fill={soft} opacity="0.6">MPI-ESM1-2-LR</text>
    </svg>
  );
}

const METRIC_VIZ = { temp: TempViz, co2: CO2Viz, sea: SeaViz, precip: PrecipViz };

function historicalCurve(metric) {
  const anchors = {
    temp:   [[1900,0],[1940,0.2],[1960,0.1],[1975,0.25],[1985,0.4],[1995,0.55],[2005,0.8],[2015,1.0],[2025,1.12]],
    co2:    [[1900,296],[1950,311],[1960,317],[1970,325],[1980,338],[1990,354],[2000,369],[2010,389],[2020,413],[2025,420]],
    sea:    [[1900,0],[1950,2],[1980,3.2],[2000,4],[2015,4.7],[2025,5]],
    precip: [[1900,0],[2025,0]],
  };
  const pts = anchors[metric];
  const out = [];
  for (let yr = 1900; yr <= 2025; yr++) {
    let lo = pts[0], hi = pts[pts.length-1];
    for (let i = 0; i < pts.length-1; i++) {
      if (yr >= pts[i][0] && yr <= pts[i+1][0]) { lo = pts[i]; hi = pts[i+1]; break; }
    }
    const t = lo[0] === hi[0] ? 0 : (yr - lo[0]) / (hi[0] - lo[0]);
    out.push({ year: yr, val: lo[1] + t*(hi[1]-lo[1]) });
  }
  return out;
}

// ── Mini chart ──
function MetricMiniChart({ metric, year, ssp, theme }) {
  const SSPS_L = [
    { id: '1-2.6', color: '#82A78A' },
    { id: '2-4.5', color: '#C49B5E' },
    { id: '5-8.5', color: '#B4633A' },
  ];
  const W = 1000, H = 220;
  const pad = { l: 56, r: 28, t: 60, b: 32 };

  const hist = historicalCurve(metric);
  const projCurves = SSPS_L.map(s => ({ ...s, data: generateCurve(metric, s.id) }));
  const allProj = projCurves.flatMap(c => c.data.map(d => d.val));

  const RANGE = {
    temp:   { min: 0,    max: Math.max(...allProj) + 0.3 },
    co2:    { min: 280,  max: Math.max(...allProj) + 20  },
    sea:    { min: 0,    max: Math.max(...allProj) + 5   },
    precip: { min: -0.5, max: Math.max(...allProj) + 0.3 },
  };
  const TICKS = {
    temp:   [0,1,2,3,4,5],
    co2:    [300,400,500,600,700,800,900],
    sea:    [0,25,50,75,100,125],
    precip: [0,1,2,3],
  };

  const { min: minV, max: maxV } = RANGE[metric];
  const ticks = TICKS[metric].filter(t => t >= minV && t <= maxV);

  const xScale = yr => pad.l + ((yr - 1900) / 200) * (W - pad.l - pad.r);
  const yScale = v => pad.t + (1 - (v - minV) / (maxV - minV)) * (H - pad.t - pad.b);

  const sspKey = ssp.code.replace('SSP', '');
  const activeCurve = projCurves.find(c => c.id === sspKey);
  const pt = activeCurve.data.find(d => d.year === year) || activeCurve.data[activeCurve.data.length-1];

  const histPath = hist.map((d,i) => `${i===0?'M':'L'} ${xScale(d.year).toFixed(1)} ${yScale(d.val).toFixed(1)}`).join(' ');
  const projPath = (data, upto) => data.filter(d => d.year <= upto).map((d,i) => `${i===0?'M':'L'} ${xScale(d.year).toFixed(1)} ${yScale(d.val).toFixed(1)}`).join(' ');

  const visProj = activeCurve.data.filter(d => d.year <= year);
  const areaPath = visProj.length >= 2 ? (() => {
    const top = visProj.map((d,i) => `${i===0?'M':'L'} ${xScale(d.year).toFixed(1)} ${yScale(d.val).toFixed(1)}`).join(' ');
    return `${top} L ${xScale(visProj[visProj.length-1].year).toFixed(1)} ${yScale(minV).toFixed(1)} L ${xScale(2025).toFixed(1)} ${yScale(minV).toFixed(1)} Z`;
  })() : '';

  const showSign = metric !== 'co2';
  const isInt = metric === 'co2' || metric === 'sea';
  const fmtVal = v => `${showSign && v >= 0 ? '+' : ''}${isInt ? Math.round(v) : v.toFixed(1)}`;
  const unitLabel = metric === 'temp' ? '°C' : metric === 'co2' ? 'ppm' : metric === 'sea' ? 'cm' : '%';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto">
      {ticks.map(tick => (
        <g key={tick}>
          <line x1={pad.l} y1={yScale(tick)} x2={W-pad.r} y2={yScale(tick)}
            stroke={theme.faint} strokeWidth="1" strokeDasharray="3 5"/>
          <text x={pad.l-8} y={yScale(tick)+3.5} fontSize="9" textAnchor="end"
            fill={theme.soft} fontFamily="var(--mono)" letterSpacing="0.06em">
            {tick}{metric==='temp'?'°':metric==='precip'?'%':''}
          </text>
        </g>
      ))}
      <line x1={pad.l} y1={H-pad.b} x2={W-pad.r} y2={H-pad.b} stroke={theme.faint} strokeWidth="1"/>
      {[1900,1950,2000,2025,2050,2075,2100].map(yr => (
        <text key={yr} x={xScale(yr)} y={H-8} fontSize="9" textAnchor="middle"
          fill={yr===2025?theme.accent:theme.soft} fontFamily="var(--mono)" letterSpacing="0.1em">
          {yr}
        </text>
      ))}
      <path d={histPath} stroke={theme.soft} strokeWidth="1.5" fill="none" opacity="0.6"/>
      <line x1={xScale(2025)} y1={pad.t-20} x2={xScale(2025)} y2={H-pad.b}
        stroke={theme.faint} strokeWidth="1" strokeDasharray="4 4"/>
      <text x={xScale(2025)+8} y={pad.t-8} fontSize="8" fill={theme.soft}
        fontFamily="var(--mono)" letterSpacing="0.12em">2025 · PROJECTION</text>
      {projCurves.filter(c => c.id !== sspKey).map(c => (
        <path key={c.id} d={projPath(c.data, 2100)} stroke={c.color} strokeWidth="1" fill="none" opacity="0.25"/>
      ))}
      {areaPath && <path d={areaPath} fill={theme.accent} opacity="0.10"/>}
      <path d={projPath(activeCurve.data, year)} stroke={theme.accent} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <circle cx={xScale(pt.year)} cy={yScale(pt.val)} r="4.5" fill={theme.accent} stroke={theme.bg} strokeWidth="2"/>
      {year > 2025 && <line x1={xScale(year)} y1={pad.t} x2={xScale(year)} y2={H-pad.b}
        stroke={theme.accent} strokeWidth="1" strokeDasharray="3 4" opacity="0.4"/>}
      <text x={pad.l} y={20} fontSize="9" fill={theme.soft} fontFamily="var(--mono)" letterSpacing="0.16em">
        {theme.label.toUpperCase()} · 1900 → 2100
      </text>
      <text x={W-pad.r} y={28} fontSize="30" textAnchor="end" fill={theme.accent}
        fontFamily="var(--serif)" letterSpacing="-0.02em">
        {fmtVal(pt.val)}<tspan fontSize="13" fill={theme.soft}> {unitLabel}</tspan>
      </text>
      <text x={W-pad.r} y={44} fontSize="8" textAnchor="end" fill={theme.soft}
        fontFamily="var(--mono)" letterSpacing="0.14em">IN {year}</text>
    </svg>
  );
}


// ── MetricBlock ──
function MetricBlock({ id, ssp, idx }) {
  const theme = METRIC_THEMES[id];
  const sspKey = ssp.code.replace('SSP', '');
  const blockRef = React.useRef(null);
  const [year, setYear] = React.useState(2025);

  React.useEffect(() => {
    const onScroll = () => {
      const el = blockRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const p = Math.max(0, Math.min(1, -rect.top / total));
      setYear(Math.round(2025 + p * 75));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const curve = generateCurve(id, sspKey);
  const point = curve.find(d => d.year === year) || curve[0];
  const value = point.val;
  const beats = METRIC_BEATS[id][sspKey];
  const activeBeat = [...beats].reverse().find(b => b.year <= year) || beats[0];
  const Viz = METRIC_VIZ[id];

  return (
    <div className="metric-block" data-screen-label={`04${String.fromCharCode(65+idx)} ${theme.title}`} ref={blockRef} style={{ background: theme.bg, color: theme.fg }}>
      <div className="metric-scroller">
        <div className="metric-sticky">
          <div className="metric-row">
            <div className="metric-narrative">
              <div className="metric-chapter" style={{ color: theme.soft }}>{theme.chapter} · {theme.label}</div>
              {theme.img && <img src={theme.img} alt="" className="metric-decor-img"/>}
              <div className="metric-year" style={{ color: theme.accent }}>{year}</div>
              <h3 style={{ color: theme.fg }}>{activeBeat.title}</h3>
              <p style={{ color: theme.soft }}>{activeBeat.body}</p>
              <div className="metric-pathway-tag" style={{ color: theme.soft }}>
                Your pathway · <span style={{ color: ssp.swatch }}>{ssp.code}</span> · {ssp.name}
              </div>
            </div>
            <div className="metric-viz">
              <Viz value={value} year={year} color={theme.accent} fg={theme.fg} faint={theme.faint} soft={theme.soft} bg={theme.bg}/>
            </div>
          </div>
          <div className="metric-chart" style={{ borderColor: theme.faint, color: theme.fg }}>
            <MetricMiniChart metric={id} year={year} ssp={ssp} theme={theme}/>
          </div>
        </div>
        {[0,1,2,3,4].map(i => <div key={i} className="metric-frame"/>)}
      </div>
    </div>
  );
}

// ── Timeline section ──
function TimelineSection({ ssp }) {
  return (
    <>
      <div className="timeline-intro" data-screen-label="04 Timeline Intro">
        <div className="wrap">
          <div className="eyebrow" style={{ marginBottom: 22 }}>Chapter Three · What Comes Next</div>
          <h2>This is the world<br/>your framework builds.</h2>
          <p className="lede">
            Scroll forward in time, from 2025 to 2100, through four lenses: how hot it gets,
            how much carbon we leave in the sky, how high the seas rise, and how the rains shift.
            Your pathway is highlighted. Watch how much it diverges from the others.
          </p>
          <p style={{ fontSize: 14, fontFamily: 'var(--mono)', letterSpacing: '0.1em', color: 'var(--ink-soft)', marginTop: 20 }}>
            DATA · MPI-ESM1-2-LR · CMIP6 · r1i1p1f1 · NOAA/Google Cloud
          </p>
        </div>
      </div>
      <MetricBlock id="temp"   ssp={ssp} idx={0}/>
      <MetricBlock id="co2"    ssp={ssp} idx={1}/>
      <MetricBlock id="sea"    ssp={ssp} idx={2}/>
      <MetricBlock id="precip" ssp={ssp} idx={3}/>
    </>
  );
}

// ── Intro ──
function Intro() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [rot, setRot] = React.useState(0);
  React.useEffect(() => {
    if (prefersReduced) return;
    let raf;
    const tick = () => { setRot(r => r + 0.0015); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <section className="hero" data-screen-label="01 Intro">
      <div className="left">
        <div className="eyebrow" style={{ marginBottom: 22 }}>An interactive story · 75 years of choices</div>
        <h1>Degrees of<br/><span className="acc">Consequence</span></h1>
        <p className="lede">Somewhere in the next few years, the decisions that shape the next century will be made. Not by nature. Not by accident. By people: in votes, in boardrooms, in budgets. Pick a seat at the table and see what your choices leave behind.</p>
        <div className="meta">
          <div>Reading time<span>~ 6 minutes</span></div>
          <div>Dataset<span>CMIP6 · SSPs</span></div>
          <div>Issue<span>Vol. 01 · 2026</span></div>
        </div>
      </div>
      <div className="right">
        <div className="halftone-globe"><HalftoneGlobe size={560} rotation={rot} density={28}/></div>
      </div>
      <div className="scroll-hint"><span>Scroll to begin</span><span className="bar"/></div>
    </section>
  );
}

// ── DialDisplay (read-only, dark-panel themed) ──
function DialDisplay({ value, color, label, img }) {
  const minA = -135, maxA = 135;
  const angle = minA + (value / 100) * (maxA - minA);
  const cx = 60, cy = 60, r = 46;
  const a0 = (minA - 90) * Math.PI / 180;
  const a1 = (angle - 90) * Math.PI / 180;
  const a2 = (maxA - 90) * Math.PI / 180;
  const arc = (start, end) => {
    const sx = cx + r * Math.cos(start), sy = cy + r * Math.sin(start);
    const ex = cx + r * Math.cos(end), ey = cy + r * Math.sin(end);
    const large = (end - start) > Math.PI ? 1 : 0;
    return `M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`;
  };
  const imgSize = 28;
  return (
    <div className="dial-display">
      <div className="dial-display-dial">
        <svg viewBox="0 0 120 120">
          <path d={arc(a0, a2)} stroke="rgba(236,230,206,0.08)" strokeWidth="3" fill="none" strokeLinecap="round"/>
          <path d={arc(a0, a1)} stroke={color} strokeWidth="3" fill="none" strokeLinecap="round"/>
          <circle cx={cx} cy={cy} r={34} fill="rgba(10,16,8,0.85)" stroke="rgba(236,230,206,0.12)" strokeWidth="1"/>
          {img && <image href={img} x={cx - imgSize/2} y={cy - imgSize/2} width={imgSize} height={imgSize} preserveAspectRatio="xMidYMid meet" opacity="0.82"/>}
          <g transform={`rotate(${angle} ${cx} ${cy})`}>
            <line x1={cx} y1={cy - 18} x2={cx} y2={cy - 29} stroke="rgba(236,230,206,0.9)" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx={cx} cy={cy - 32} r="3.5" fill={color}/>
          </g>
        </svg>
      </div>
      <div className="dial-display-label">{label}</div>
      <div className="dial-display-value">{value.toString().padStart(2, '0')}<span className="dial-display-max"> / 100</span></div>
    </div>
  );
}

// ── CalibDialDisplay (animated needle for calibration overlay) ──
function CalibDialDisplay({ value, color, label, wobbling }) {
  const minA = -135, maxA = 135;
  const angle = minA + (value / 100) * (maxA - minA);
  const cx = 60, cy = 60, r = 46;
  const a0 = (minA - 90) * Math.PI / 180;
  const a1 = (angle - 90) * Math.PI / 180;
  const a2 = (maxA - 90) * Math.PI / 180;
  const arc = (start, end) => {
    const sx = cx + r * Math.cos(start), sy = cy + r * Math.sin(start);
    const ex = cx + r * Math.cos(end), ey = cy + r * Math.sin(end);
    const large = (end - start) > Math.PI ? 1 : 0;
    return `M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`;
  };
  const needleTrans = wobbling
    ? 'transform 160ms cubic-bezier(0.34, 1.56, 0.64, 1)'
    : 'transform 1.1s cubic-bezier(0.34, 1.56, 0.64, 1)';
  return (
    <div className="dial-display">
      <div className="dial-display-dial">
        <svg viewBox="0 0 120 120">
          <path d={arc(a0, a2)} stroke="rgba(236,230,206,0.08)" strokeWidth="3" fill="none" strokeLinecap="round"/>
          <path d={arc(a0, a1)} stroke={color} strokeWidth="3" fill="none" strokeLinecap="round"/>
          <circle cx={cx} cy={cy} r={34} fill="rgba(10,16,8,0.85)" stroke="rgba(236,230,206,0.12)" strokeWidth="1"/>
          <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: `${cx}px ${cy}px`, transition: needleTrans }}>
            <line x1={cx} y1={cy - 10} x2={cx} y2={cy - 26} stroke="rgba(236,230,206,0.9)" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx={cx} cy={cy - 29} r="3.5" fill={color}/>
          </g>
        </svg>
      </div>
      <div className="dial-display-label">{label}</div>
      <div className="dial-display-value" style={{ color }}>{value.toString().padStart(2, '0')}<span className="dial-display-max"> / 100</span></div>
    </div>
  );
}

// ── Calibration overlay ──
function CalibrationOverlay({ character, onDone }) {
  const randomVals = () => ({
    fossil: Math.round(Math.random() * 100),
    renew:  Math.round(Math.random() * 100),
    carbon: Math.round(Math.random() * 100),
    forest: Math.round(Math.random() * 100),
    coop:   Math.round(Math.random() * 100),
    consume:Math.round(Math.random() * 100),
  });

  const [phase, setPhase] = React.useState('wobble');
  const [vals, setVals] = React.useState(randomVals);

  React.useEffect(() => {
    const churn = setInterval(() => setVals(randomVals()), 140);
    const t1 = setTimeout(() => { clearInterval(churn); setPhase('settle'); setVals({ ...character.values }); }, 1800);
    const t2 = setTimeout(() => setPhase('exit'), 3000);
    const t3 = setTimeout(() => onDone?.(), 3700);
    return () => { clearInterval(churn); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const wobbling = phase === 'wobble';
  const ssp = classify(computeScore(character.values));

  const eyebrow = wobbling
    ? 'Calibrating: framework parameters'
    : phase === 'settle' ? `${character.name}: settings locked` : 'Entering the policy console';

  const caption = wobbling
    ? 'Six knobs, no fixed answer. Searching the space.'
    : phase === 'settle' ? 'Settings locked in. Inspect each knob on the next screen.' : 'Continuing.';

  const footer = wobbling ? '. . .' : `${ssp.code} · ${ssp.name} · +${ssp.delta.toFixed(1)}°C`;
  const readout = wobbling ? 'Live · adjusting' : 'Live · holding';

  return (
    <div className={`calibration-overlay${phase === 'exit' ? ' phase-exit' : ''}`}>
      <div className="calibration-inner">
        <div className="calibration-eyebrow">
          <span className="calibration-pulse-dot"/>
          {eyebrow}
        </div>
        <div className={`calibration-panel-wrap calibration-${phase}`}>
          <div className="policy-right" style={{ margin: 0 }}>
            <div className="policy-console-header-row">
              <div className="policy-console-title">Policy console</div>
              <div className="policy-console-hint">{readout}</div>
            </div>
            <div className="policy-dials-grid">
              {KNOB_DEFS.map(k => (
                <div key={k.id} className="policy-dial-cell">
                  <CalibDialDisplay value={vals[k.id] || 0} color="#E08D5C" label={k.shortLabel} wobbling={wobbling}/>
                </div>
              ))}
            </div>
            <div className="policy-footer-row">
              <div className="policy-footer-label">PROJECTED PATHWAY</div>
              <div className="calibration-footer-result">{footer}</div>
            </div>
          </div>
        </div>
        <p className="calibration-caption">{caption}</p>
      </div>
    </div>
  );
}

// ── Character select screen ──
function CharacterSelectScreen({ onPick }) {
  const [hovered, setHovered] = React.useState(null);
  return (
    <section className="char-select" data-screen-label="03 The Choice">
      <div className="wrap">
        <div className="eyebrow" style={{ marginBottom: 18 }}>Chapter Two · Take a Seat</div>
        <h2>Who are you<br/>at the table?</h2>
        <p className="char-select-lede">
          Three people walk into the room. Each holds a different vision of what the next decade should look like.
          Pick one and watch the world their choices build.
        </p>
        <div className="char-cards">
          {PERSONAS.map(p => (
            <button key={p.id}
              className={`char-card${hovered === p.id ? ' char-card--hovered' : ''}`}
              onMouseEnter={() => setHovered(p.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onPick(p)}>
              <div className="char-card-img-wrap">
                <img src={p.img} alt={p.name} className="char-card-img"/>
              </div>
              <div className="char-card-body">
                <div className="char-card-role">{p.label}</div>
                <div className="char-card-name">{p.name}</div>
                <p className="char-card-tag">{p.tag}</p>
                <div className="char-card-cta">Take this seat →</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Policy console (shown after calibration) ──
function PolicyConsole({ persona, values, bucket, onSubmit, activeThought, setActiveThought, onChangeCharacter }) {
  const thought = PERSONA_THOUGHTS[persona.id] || {};
  const currentKnob = KNOB_DEFS[activeThought];

  const handleKnobClick = (i) => { setActiveThought(i); };

  return (
    <section className="policy-console-section" data-screen-label="03 The Choice">
      <div className="wrap">
        <button className="policy-back-btn" onClick={onChangeCharacter}>Choose a different character</button>
        <div className="policy-console">

          {/* Left: character card + priority card */}
          <div className="policy-left">
            <div className="policy-char-card">
              <img src={persona.img} alt={persona.name} className="policy-char-img"/>
              <div className="policy-char-info">
                <div className="policy-char-name">{persona.name}</div>
                <div className="policy-char-role">{persona.keywords}</div>
              </div>
            </div>

            <div className="policy-priority-card">
              <div className="policy-priority-eyebrow">
                <span className="policy-priority-dot"/>
                PRIORITY {String(activeThought + 1).padStart(2, '0')} OF 06
              </div>
              {currentKnob.img && <img src={currentKnob.img} alt="" className="policy-priority-img" key={currentKnob.id + '-img'}/>}
              <div className="policy-priority-title" key={currentKnob.id + '-t'}>{currentKnob.shortLabel}</div>
              <p className="policy-priority-desc" key={currentKnob.id + '-d'}>{currentKnob.description}</p>
              <hr className="policy-priority-rule"/>
              <p className="policy-priority-thought" key={currentKnob.id + '-q'}>{thought[currentKnob.id]}</p>
              <div className="policy-priority-bars">
                {KNOB_DEFS.map((k, i) => (
                  <button key={k.id}
                    className={`policy-bar${i === activeThought ? ' policy-bar--active' : ''}`}
                    onClick={() => handleKnobClick(i)}
                    aria-label={k.shortLabel}/>
                ))}
              </div>
              <div className="policy-priority-hint">CLICK ANY KNOB TO INSPECT HOW THIS FRAMEWORK TREATS IT.</div>
            </div>
          </div>

          {/* Right: dark console */}
          <div className="policy-right">
            <div className="policy-console-header-row">
              <div className="policy-console-title">Policy console</div>
              <div className="policy-console-hint">
                <span className="policy-console-hint-dot"/>SIX KNOBS · CLICK ANY
              </div>
            </div>
            <div className="policy-dials-grid">
              {KNOB_DEFS.map((k, i) => (
                <button key={k.id}
                  className={`policy-dial-cell${i === activeThought ? ' policy-dial-cell--active' : ''}`}
                  onClick={() => handleKnobClick(i)}>
                  {k.img && <img src={k.img} alt="" className="policy-dial-icon"/>}
                  <DialDisplay value={values[k.id] || 0} color="#E08D5C" label={k.shortLabel}/>
                </button>
              ))}
            </div>
            <div className="policy-footer-row">
              <div className="policy-footer-label">PROJECTED PATHWAY</div>
              <div className="policy-footer-result" style={{ color: bucket.swatch }}>
                {bucket.code} · {bucket.name.toUpperCase()} · +{bucket.delta.toFixed(1)}°C
              </div>
            </div>
            <button className="policy-submit" onClick={onSubmit}>
              Apply this framework <ArrowIcon/>
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}

// ── Choice section (orchestrates select → calibrate → console) ──
function ChoiceSection({ values, setValues, persona, setPersona, onSubmit }) {
  const [phase, setPhase] = React.useState('select');
  const [activeThought, setActiveThought] = React.useState(0);

  React.useEffect(() => {
    if (persona === null) { setPhase('select'); setActiveThought(0); }
  }, [persona]);

  const pickPersona = (p) => {
    setPersona(p.id);
    setValues({ ...p.values });
    setPhase('calibrating');
    setActiveThought(0);
  };

  const selectedPersona = PERSONAS.find(p => p.id === persona);
  const score = computeScore(values);
  const bucket = classify(score);

  if (phase === 'select' || !selectedPersona) {
    return <CharacterSelectScreen onPick={pickPersona}/>;
  }

  if (phase === 'calibrating') {
    return (
      <>
        <PolicyConsole
          persona={selectedPersona}
          values={values}
          bucket={bucket}
          onSubmit={onSubmit}
          activeThought={activeThought}
          setActiveThought={setActiveThought}
          onChangeCharacter={() => { setPhase('select'); setPersona(null); }}
        />
        <CalibrationOverlay character={selectedPersona} onDone={() => setPhase('console')}/>
      </>
    );
  }

  return (
    <PolicyConsole
      persona={selectedPersona}
      values={values}
      bucket={bucket}
      onSubmit={onSubmit}
      activeThought={activeThought}
      setActiveThought={setActiveThought}
      onChangeCharacter={() => { setPhase('select'); setPersona(null); }}
    />
  );
}

// ── Outro ──
function Outro({ onRestart }) {
  return (
    <section className="outro" data-screen-label="06 Outro">
      <div className="wrap">
        <div className="row">
          <div>
            <div className="eyebrow" style={{ marginBottom: 22 }}>Chapter Five · The Real Dials</div>
            <h2>The dials that matter most are not in your hands.</h2>
            <p style={{ fontSize: 18, color: 'var(--ink-soft)', maxWidth: '54ch', marginTop: 24 }}>
              Just 57 corporations are responsible for 80 percent of global emissions since 2016.
              The CMIP6 pathways diverge not on individual choices but on policy: binding carbon
              pricing, ending fossil fuel subsidies, regulating methane, and mandating a managed
              phase-out of extraction. Demanding that governments enact these policies, and holding
              them to account when they don't, is the lever that actually moves the models.
            </p>
            <button className="restart" onClick={onRestart}>Restart your future <ArrowIcon/></button>
            <div className="outro-decor-imgs">
              <img src="../images/handshake.png" alt="" className="outro-decor-img"/>
              <img src="../images/wind_turbines.png" alt="" className="outro-decor-img"/>
            </div>
          </div>
          <div className="credits">
            <b>Team</b>
            Tanvi Vidyala<br/>
            Nithya Nair<br/>
            Viela Lansangam<br/>
            <b>Data</b>
            CMIP6 / MPI-ESM1-2-LR<br/>
            via NOAA / Google Cloud<br/>
            Processed with xarray + regionmask
            <b>Vol. 01 · 2026</b>
            UCSD · DSC 106
          </div>
        </div>
      </div>
    </section>
  );
}

// ── TimeJump ──
function TimeJump({ onComplete }) {
  const clampVal = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  const DURATION = 8500;
  const LINES = [
    { from: 0.00, to: 0.18, text: 'The room empties. The decisions begin to settle.' },
    { from: 0.18, to: 0.38, text: 'A decade passes. Then another.' },
    { from: 0.38, to: 0.62, text: 'Children born during the meeting are now writing the headlines.' },
    { from: 0.62, to: 0.84, text: 'The atmosphere keeps a perfect ledger.' },
    { from: 0.84, to: 1.01, text: 'The future arrives. On schedule.' },
  ];

  const CORNER_IMGS = [
    { src: '../images/drought.png',       threshold: 0.18, cls: 'timejump-img timejump-img--1' },
    { src: '../images/melting_ice.png',   threshold: 0.38, cls: 'timejump-img timejump-img--2' },
    { src: '../images/typhoon.png',       threshold: 0.62, cls: 'timejump-img timejump-img--3' },
    { src: '../images/polluted_earth.png',threshold: 0.84, cls: 'timejump-img timejump-img--4' },
  ];

  const sectionRef = React.useRef(null);
  const [p, setP] = React.useState(0);
  const startedRef = React.useRef(false);
  const doneRef = React.useRef(false);
  const startTimeRef = React.useRef(null);

  // Build 76 radial ticks SVG
  const ticks = [];
  for (let i = 0; i < 76; i++) {
    const ang = (i / 76) * Math.PI * 2 - Math.PI / 2;
    const lit = i / 76 <= p;
    const r1 = 88, r2 = lit ? 96 : 93;
    ticks.push(
      <line key={i}
        x1={100 + r1 * Math.cos(ang)} y1={100 + r1 * Math.sin(ang)}
        x2={100 + r2 * Math.cos(ang)} y2={100 + r2 * Math.sin(ang)}
        stroke={lit ? '#E08D5C' : 'rgba(236,230,206,0.25)'}
        strokeWidth={lit ? 2 : 1}
        strokeLinecap="round"
      />
    );
  }

  React.useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const checkVisibility = () => {
      if (startedRef.current) return;
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      if (rect.top < vh * 0.6 && rect.bottom > vh * 0.4) {
        startedRef.current = true;
        startTimeRef.current = performance.now();
        requestAnimationFrame(animate);
      }
    };

    const animate = (now) => {
      const elapsed = now - startTimeRef.current;
      const rawP = clampVal(elapsed / DURATION, 0, 1);
      setP(rawP);

      if (rawP < 1) {
        requestAnimationFrame(animate);
      } else if (!doneRef.current) {
        doneRef.current = true;
        setTimeout(() => { onComplete(); }, 900);
      }
    };

    window.addEventListener('scroll', checkVisibility, { passive: true });
    checkVisibility();
    return () => window.removeEventListener('scroll', checkVisibility);
  }, [onComplete]);

  const eased = 1 - Math.pow(1 - clampVal(p / 0.85, 0, 1), 1.6);
  const year = Math.round(2025 + 75 * eased);
  const activeLine = [...LINES].reverse().find(l => p >= l.from) || LINES[0];

  return (
    <div className="timejump-wrap" data-screen-label="04 Time Jump" ref={sectionRef}>
      <div className="timejump-sticky">
        {/* Background radial ticks SVG */}
        <div className="timejump-bg-svg">
          <svg viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(236,230,206,0.15)" strokeWidth="1"/>
            {ticks}
          </svg>
        </div>

        {/* Corner climate images */}
        <div className="timejump-img-strip">
          {CORNER_IMGS.map((img, i) => (
            <img key={i} src={img.src} alt="" className={img.cls}
              style={{ opacity: p >= img.threshold ? 1 : 0 }}/>
          ))}
        </div>

        <div className="timejump-inner">
          <div className="timejump-eyebrow">Time passing</div>
          <div className="timejump-year">{year}</div>
          <div key={activeLine.text} className="timejump-line">{activeLine.text}</div>
          <div className="timejump-ticker">
            <span>2025</span>
            <span className="timejump-ticker-now">{year}</span>
            <span>2100</span>
          </div>
          <div className="timejump-progress">
            <div className="timejump-progress-fill" style={{ width: `${p * 100}%` }}/>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Loading screen ──
function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(32px,5vw,64px)', color: 'var(--ink)', lineHeight: 1 }}>
        Degrees of<br/><span style={{ color: 'var(--forest)' }}>Consequence</span>
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>
        Loading CMIP6 data…
      </div>
    </div>
  );
}

// ── App ──
function App() {
  const [values, setValues] = React.useState({ fossil: 58, renew: 48, carbon: 38, forest: 42, coop: 50, consume: 32 });
  const [persona, setPersona] = React.useState(null);
  const [submitted, setSubmitted] = React.useState(false);
  const [timeJumpDone, setTimeJumpDone] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [chapter, setChapter] = React.useState('Cover');
  const [dataReady, setDataReady] = React.useState(false);

  // Load real CMIP6 data
  React.useEffect(() => {
    fetch('/data/climate-data.json')
      .then(r => r.json())
      .then(data => {
        CLIMATE = data;
        setDataReady(true);
      })
      .catch(err => {
        console.warn('[app] climate-data.json load failed, using synthetic fallback:', err);
        setDataReady(true);
      });
  }, []);

  // Scroll tracking
  React.useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? window.scrollY / max : 0);
      const labeled = Array.from(document.querySelectorAll('[data-screen-label]'));
      let current = labeled[0];
      for (const el of labeled) {
        if (el.getBoundingClientRect().top < window.innerHeight * 0.5) current = el;
      }
      if (current) setChapter(current.getAttribute('data-screen-label'));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const onSubmit = () => {
    setSubmitted(true);
    setTimeJumpDone(false);
    requestAnimationFrame(() => {
      const el = document.querySelector('[data-screen-label="04 Time Jump"]');
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 10, behavior: 'smooth' });
    });
  };

  const handleTimeJumpComplete = () => {
    setTimeJumpDone(true);
    setTimeout(() => {
      const el = document.querySelector('[data-screen-label="04 Timeline Intro"]');
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 10, behavior: 'smooth' });
    }, 240);
  };

  const onRestart = () => {
    setSubmitted(false);
    setTimeJumpDone(false);
    setPersona(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const score = computeScore(values);
  const ssp = classify(score);

  if (!dataReady) return <LoadingScreen/>;

  return (
    <>
      <div className="topbar">
        <div className="brand">Degrees of Consequence</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div className="chapter">{chapter}</div>
            <div className="progress"><i style={{ width: `${progress * 100}%` }}/></div>
            <div className="chapter">{Math.round(progress * 100).toString().padStart(2,'0')}%</div>
          </div>
          <a href="writeup.html" className="topbar-writeup">Write-up</a>
        </div>
      </div>
      <Intro/>
      <ChoiceSection values={values} setValues={setValues} persona={persona} setPersona={setPersona} onSubmit={onSubmit}/>
      {submitted && !timeJumpDone && <TimeJump onComplete={handleTimeJumpComplete}/>}
      {timeJumpDone && <TimelineSection ssp={ssp}/>}
      {timeJumpDone && <Outro onRestart={onRestart}/>}
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
