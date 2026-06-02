// ============================================================
// bundle.jsx,Degrees of Consequence
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
// Data layer,loaded from climate-data.json
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
let WORLD_TOPO = null;
let REGIONAL_TEMP = null;
let PR_ANOMALIES = null;
let WORLD_PATHS_CACHE = null;
const TOPO_CBS = [];
function onTopoReady(cb) {
  if (WORLD_TOPO) cb(); else TOPO_CBS.push(cb);
}
function fireTopoReady() {
  TOPO_CBS.forEach(cb => cb());
  TOPO_CBS.length = 0;
}
function buildWorldPaths() {
  if (WORLD_PATHS_CACHE || !WORLD_TOPO) return WORLD_PATHS_CACHE;
  const d3 = window.d3, topo = window.topojson;
  const proj = d3.geoNaturalEarth1().scale(153).translate([480, 250]);
  const pathFn = d3.geoPath().projection(proj);
  const countries = topo.feature(WORLD_TOPO, WORLD_TOPO.objects.countries);
  const borders = topo.mesh(WORLD_TOPO, WORLD_TOPO.objects.countries, (a, b) => a !== b);
  WORLD_PATHS_CACHE = {
    countries: countries.features.map(f => ({ id: +f.id, d: pathFn(f) || '' })),
    borders: pathFn(borders) || '',
    sphere: pathFn({ type: 'Sphere' }) || '',
  };
  return WORLD_PATHS_CACHE;
}

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

// ── CMIP scenario cards,values from real data ──
// Ranges from IPCC AR6 multi-model uncertainty bands

const METRICS = [
  { id: 'temp',   label: 'Temperature',   unit: '°C',  short: 'Surface anomaly' },
  { id: 'co2',    label: 'CO₂',           unit: 'ppm', short: 'Atmospheric concentration' },
  { id: 'sea',    label: 'Sea level',     unit: 'cm',  short: 'Cumulative rise' },
  { id: 'precip', label: 'Precipitation', unit: '%',   short: 'Anomaly vs. 2025' },
];

const METRIC_THEMES = {
  co2:    { bg: '#ECE6CE', fg: '#2A3324', accent: '#2A3324', soft: 'rgba(42,51,36,0.6)',      faint: 'rgba(42,51,36,0.15)',    label: 'CO₂',                   unit: 'ppm', chapter: 'Three · A', title: 'The Atmosphere',  icon: 'co2',    img: '../images/urban_air_pollution.png' },
  temp:   { bg: '#2A3324', fg: '#ECE6CE', accent: '#E08D5C', soft: 'rgba(236,230,206,0.6)',  faint: 'rgba(236,230,206,0.15)', label: 'Temperature',           unit: '°C',  chapter: 'Three · B', title: 'The Heat',        icon: 'temp',   img: '../images/smoggy_sun.png' },
  sea:    { bg: '#2E4A35', fg: '#ECE6CE', accent: '#82A78A', soft: 'rgba(236,230,206,0.6)',  faint: 'rgba(236,230,206,0.15)', label: 'Sea level rise',        unit: 'cm',  chapter: 'Three · C', title: 'The Rising Sea',  icon: 'sea',    img: '../images/coastal_flooding.png' },
  precip: { bg: '#D4D2BB', fg: '#2A3324', accent: '#4E7558', soft: 'rgba(42,51,36,0.6)',      faint: 'rgba(42,51,36,0.15)',    label: 'Precipitation anomaly', unit: '%',   chapter: 'Three · D', title: 'The Water',       icon: 'precip', img: '../images/typhoon.png' },
};

const METRIC_BEATS = {
  temp: {
    '1-2.6': [
      { year: 2030, title: 'The rate bends', body: 'Hot summers still set records. But for the first time in decades, the rate of warming starts to ease. Not enough to feel yet, butenough to show in the data.' },
      { year: 2050, title: 'A plateau', body: 'The anomaly holds near +1.3°C. Heatwaves intensify regionally. But the worst of what the models projected, the runaway scenarios, are off the table.' },
      { year: 2080, title: 'Held', body: 'Under 1.5°C. Coral systems are stressed but largely intact. The Arctic thins but doesn\'t disappear in summer. It\'s a warmer world. But it\'s one people can navigate.' },
    ],
    '2-4.5': [
      { year: 2030, title: 'The records keep falling', body: 'Each decade sets new heat records. Climate adaptation becomes a permanent budget line: seawalls, cooling centers, crop adjustments.' },
      { year: 2050, title: 'Chronic heat', body: 'Wet-bulb temperatures cross dangerous thresholds in South Asia and the Gulf for weeks at a time. Outdoor labor becomes legally restricted in dozens of countries.' },
      { year: 2080, title: 'Locked in', body: 'The anomaly approaches +2.7°C. Air conditioning is infrastructure, not comfort. Insurance markets have abandoned the Gulf Coast. The warming will persist for centuries.' },
    ],
    '5-8.5': [
      { year: 2030, title: 'Vertical', body: 'No abatement. Each summer eclipses the last. Wildfires double across the boreal north. The thermometer does not plateau.' },
      { year: 2050, title: 'The survivability line', body: 'Multiple regions exceed 35°C wet-bulb for weeks at a stretch. At that threshold, the human body cannot cool itself outdoors, even in the shade.' },
      { year: 2080, title: 'Near +5°C', body: 'Permafrost thaw is now releasing its own carbon. The feedback loops have engaged. The question is no longer whether this accelerates. It\'s how fast.' },
    ],
  },
  co2: {
    '1-2.6': [
      { year: 2030, title: 'The curve bends', body: 'It took three consecutive climate bills and a decade of market pressure to get here. The CO₂ curve crests. Not enough to erase what\'s already in the air, butenough to change where this goes.' },
      { year: 2050, title: 'Zeroed out', body: 'Net-zero. The machines running the grid are wind and solar. Atmospheric concentration plateaus near 430 ppm and starts, slowly, to fall.' },
      { year: 2080, title: 'The air starts to clear', body: 'For the first time since the Industrial Revolution, humanity pulls more carbon out of the air than it puts in. A slow exhale, 150 years in the making. The heat is still here, butit stops compounding.' },
    ],
    '2-4.5': [
      { year: 2030, title: 'Slowing, not stopping', body: 'Emissions flatten as renewables scale, but the fossil infrastructure is too entrenched to retreat quickly. The concentration keeps climbing, just not as fast.' },
      { year: 2050, title: 'Half-measures compound', body: 'Emissions finally start to fall. CO₂ has already passed 520 ppm, a level the atmosphere hasn\'t seen in three million years. The descent will be slow.' },
      { year: 2080, title: 'What didn\'t happen', body: 'The concentration holds near 565 ppm, roughly double the pre-industrial baseline. The world is stable. It\'s just a different world than the one that was possible.' },
    ],
    '5-8.5': [
      { year: 2030, title: 'All throttle', body: 'New coal and gas plants outpace retirements worldwide. The concentration climbs faster than at any point in human history.' },
      { year: 2050, title: 'Uncharted air', body: '630 ppm. Earth hasn\'t seen an atmosphere like this in 50 million years. The carbon sinks, the forests and oceans, are straining to keep up.' },
      { year: 2080, title: 'The sinks give out', body: '870 ppm. The Amazon and Arctic tundra have stopped absorbing carbon and started releasing it. The feedback loops are no longer a projection. They\'re the weather.' },
    ],
  },
  sea: {
    '1-2.6': [
      { year: 2040, title: 'A steady climb', body: 'Sea level rises at roughly 4 mm per year, slow enough that cities can plan. Seawalls get funded. Managed retreat begins in the most exposed neighborhoods.' },
      { year: 2070, title: 'Adaptation holds', body: 'Most large coastal cities are protected. Some low-lying communities have relocated inland. The ice caps are thinning, contributing to what comes next.' },
      { year: 2090, title: '35 centimeters', body: 'Difficult. But adaptable. The cities that prepared in the 2030s are the ones still standing.' },
    ],
    '2-4.5': [
      { year: 2040, title: 'The rate picks up', body: 'Greenland\'s ice sheet is now a meaningful contributor. The rise accelerates. Insurance markets in low-lying regions begin to buckle: first the private market, then the public backstop.' },
      { year: 2070, title: 'Selective retreat', body: 'Whole neighborhoods of Miami, Jakarta, and Lagos have been abandoned. The question is no longer whether to retreat, but who pays for it.' },
      { year: 2090, title: '75 centimeters', body: 'Climate-driven migration is reshaping borders. The word \'coastal\' is being redefined.' },
    ],
    '5-8.5': [
      { year: 2040, title: 'The Antarctic wakes up', body: 'The West Antarctic ice sheet enters runaway melt. The rate of rise doubles. What was a planning problem becomes an emergency.' },
      { year: 2070, title: 'Coastlines erased', body: 'Multiple island nations have ceased to exist as legal territories. Cumulative rise approaches 90 cm.' },
      { year: 2090, title: 'Past a meter', body: '135 centimeters of rise. Sea level is now one of the primary forces reshaping where people can live. It will not stop in 2100.' },
    ],
  },
  precip: {
    '1-2.6': [
      { year: 2040, title: 'A slow redistribution', body: 'Wet regions get slightly wetter. Dry ones, slightly drier. The global mean rises a little. The bigger story is regional. Watch the map.' },
      { year: 2070, title: 'Crop belts shift', body: 'Agricultural zones move north by 200 to 400 km. The transitions are mostly orderly. Some regions gain arable land. Others lose it.' },
      { year: 2090, title: 'Manageable variance', body: 'The hydrology is changed but not broken. Flood and drought frequencies stay within the range that infrastructure was built to handle.' },
    ],
    '2-4.5': [
      { year: 2040, title: 'The global mean is misleading', body: 'The average precipitation change looks modest. What it hides: intensifying monsoons in some places, the Colorado and Ganges running low in others.' },
      { year: 2070, title: 'Regional divergence', body: 'Wet regions amplify. Dry regions dry further. The map is where the story is. The global number tells you almost nothing.' },
      { year: 2090, title: 'Whiplash', body: 'Drying in the subtropics. Flooding in the tropics. The average stays near zero. The extremes are anything but.' },
    ],
    '5-8.5': [
      { year: 2040, title: 'Oscillating', body: 'Extreme floods and extreme droughts begin alternating in the same river basins. The Amazon is already showing early tipping signals.' },
      { year: 2070, title: 'More moisture, more violence', body: 'A warmer atmosphere holds more water vapor. When it rains, it deluges. When it doesn\'t, the soil bakes. The global mean tells you little about what\'s happening on the ground.' },
      { year: 2090, title: 'The cycle, stressed', body: '+2.9% globally. Behind that number: agricultural collapse in parts of West Africa and Central America, catastrophic flooding in South and Southeast Asia. The average is not the story.' },
    ],
  },
};

// ── Shared world map (D3 Natural Earth, country paths cached) ──
function WorldMap({ getColor, borderColor = 'rgba(255,255,255,0.1)', bg = null }) {
  const W = 960, H = 500;
  const [paths, setPaths] = React.useState(() => buildWorldPaths());
  React.useEffect(() => {
    if (!paths) onTopoReady(() => setPaths(buildWorldPaths()));
  }, []);
  if (!paths) return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto">
      <text x={W/2} y={H/2} textAnchor="middle" fill="rgba(255,255,255,0.2)"
        fontFamily="var(--mono)" fontSize="10" letterSpacing="0.12em">LOADING MAP…</text>
    </svg>
  );
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto">
      {bg && <path d={paths.sphere} fill={bg}/>}
      {paths.countries.map(c => (
        <path key={c.id} d={c.d} fill={getColor(c.id)} stroke={borderColor} strokeWidth="0.4"/>
      ))}
      <path d={paths.borders} fill="none" stroke={borderColor} strokeWidth="0.4"/>
    </svg>
  );
}

// % of national land in Low Elevation Coastal Zone (<10m) · Source: CIESIN LECZ Database
const LECZ_SHARE = {
  462:1.0, 798:1.0, 584:1.0, 296:1.0, 520:0.98, 585:0.85, 882:0.75, 548:0.5,
  90:0.35, 626:0.3, 528:0.26, 740:0.22, 116:0.11, 328:0.15, 704:0.12,
  764:0.09, 392:0.09, 608:0.07, 104:0.08, 50:0.06, 702:0.06, 196:0.06,
  818:0.04, 566:0.04, 360:0.04, 840:0.05, 156:0.03, 356:0.03, 586:0.02,
  288:0.03, 404:0.02, 710:0.02, 716:0.01,
};

// ── Metric visualizations ──

function ThermometerViz({ value, year, color, fg, faint, soft, curve, beats }) {
  const TMAX = 5.5;
  const W = 400, H = 420;
  const tx = 88, tw = 22, tt = 20, tb = 360;
  const bulbCx = tx + tw / 2, bulbCy = tb + 34, bulbR = 26;
  const yFor = t => tb - Math.max(0, Math.min(1, t / TMAX)) * (tb - tt);
  const mercY = yFor(value);

  const zones = [
    { lo: 0,    hi: 1.5,  fill: '#4CAF6F', label: '< 1.5°  SAFE'     },
    { lo: 1.5,  hi: 2.0,  fill: '#F5C842', label: '1.5–2°  CAUTION'  },
    { lo: 2.0,  hi: 3.0,  fill: '#E08D5C', label: '2–3°  WARNING'    },
    { lo: 3.0,  hi: TMAX, fill: '#D95828', label: '> 3°  CRITICAL'   },
  ];

  const beatMarkers = (curve && beats)
    ? beats.map(b => { const pt = curve.find(d => d.year === b.year); return pt ? { year: b.year, temp: pt.val } : null; }).filter(Boolean)
    : [];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto">
      {zones.map((z, i) => {
        const y1 = yFor(z.hi), y2 = yFor(z.lo);
        return <g key={i}>
          <rect x={tx-3} y={y1} width={tw+6} height={Math.max(1, y2-y1)} fill={z.fill} opacity="0.18" rx="2"/>
          <text x={tx+tw+10} y={(y1+y2)/2+3} fontSize="8" fontFamily="var(--mono)"
            fill={z.fill} opacity="0.6" letterSpacing="0.08em">{z.label}</text>
        </g>;
      })}
      <rect x={tx} y={tt} width={tw} height={tb-tt} fill={faint} opacity="0.3" rx={tw/2}/>
      <rect x={tx+2} y={mercY} width={tw-4} height={Math.max(0, tb-mercY)} fill={color} rx={(tw-4)/2}/>
      <circle cx={bulbCx} cy={bulbCy} r={bulbR} fill={faint} opacity="0.3"/>
      <circle cx={bulbCx} cy={bulbCy} r={bulbR-3} fill={color}/>
      {[0,1,2,3,4,5].map(t => {
        const y = yFor(t);
        return <g key={t}>
          <line x1={tx-6} y1={y} x2={tx} y2={y} stroke={soft} strokeWidth="1" opacity="0.5"/>
          <text x={tx-9} y={y+3.5} textAnchor="end" fontSize="9" fontFamily="var(--mono)"
            fill={soft} opacity="0.6">{t}°</text>
        </g>;
      })}
      {beatMarkers.map((b, i) => {
        const y = yFor(b.temp);
        return <g key={i}>
          <line x1={tx} y1={y} x2={tx+tw} y2={y} stroke={fg} strokeWidth="1" opacity="0.25" strokeDasharray="2 3"/>
          <text x={tx-9} y={y-4} textAnchor="end" fontSize="7" fontFamily="var(--mono)"
            fill={fg} opacity="0.45">{b.year}</text>
        </g>;
      })}
      <text x={W-16} y={75} textAnchor="end" fontFamily="var(--serif)"
        fontSize="52" fill={color}>+{value.toFixed(1)}</text>
      <text x={W-16} y={95} textAnchor="end" fontFamily="var(--mono)"
        fontSize="9" fill={soft} letterSpacing="0.14em">°C SURFACE ANOMALY</text>
      <text x={W-16} y={111} textAnchor="end" fontFamily="var(--mono)"
        fontSize="9" fill={soft} letterSpacing="0.14em">IN {year}</text>
    </svg>
  );
}

function CarbonSummaryCard({ value, year, color, fg, faint, soft, bg, ssp }) {
  const sspKey = ssp ? ssp.code.replace('SSP', '') : '2-4.5';
  const tempCurve = generateCurve('temp', sspKey);
  const seaCurve = generateCurve('sea', sspKey);
  const tempPt = tempCurve.find(d => d.year === year) || { val: 0 };
  const seaPt = seaCurve.find(d => d.year === year) || { val: 0 };

  const smogLevel = Math.max(0, Math.min(1, (value - 420) / 450));
  const skyTop = ssp && ssp.code === 'SSP1-2.6' ? '#4A7A9B' : ssp && ssp.code === 'SSP2-4.5' ? '#8B6940' : '#6B2A18';
  const skyBot = ssp && ssp.code === 'SSP1-2.6' ? '#88BBD4' : ssp && ssp.code === 'SSP2-4.5' ? '#C4A070' : '#A04828';
  const sunColor = ssp && ssp.code === 'SSP1-2.6' ? '#FFE080' : ssp && ssp.code === 'SSP2-4.5' ? '#E89040' : '#D04020';
  const W = 440, H = 200;

  return (
    <div style={{ width: '100%' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto">
        <defs>
          <linearGradient id="co2SkyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={skyTop} stopOpacity={0.35 + smogLevel * 0.5}/>
            <stop offset="1" stopColor={skyBot} stopOpacity={0.12 + smogLevel * 0.4}/>
          </linearGradient>
        </defs>
        <rect width={W} height={H} fill="url(#co2SkyGrad)" rx="6"/>
        {smogLevel > 0.1 && [0.3, 0.55, 0.78].map((yFrac, i) => (
          <ellipse key={i} cx={W/2} cy={H * yFrac}
            rx={W * (0.45 + i * 0.08)} ry={10 + i * 4}
            fill={skyBot} opacity={smogLevel * (0.28 - i * 0.06)}/>
        ))}
        <circle cx={W * 0.82} cy={H * 0.28} r={20}
          fill={sunColor} opacity={0.9 - smogLevel * 0.55}/>
        <text x={W/2} y={H * 0.48} textAnchor="middle"
          fontFamily="var(--serif)" fontSize="50" fill={fg}>
          {Math.round(value)}<tspan fontFamily="var(--mono)" fontSize="15" fill={soft}> ppm CO₂</tspan>
        </text>
        <text x={W/2} y={H * 0.63} textAnchor="middle"
          fontFamily="var(--mono)" fontSize="8" letterSpacing="0.18em" fill={soft}>
          ATMOSPHERIC CONCENTRATION · {year}
        </text>
        {[
          { label: 'WARMING', val: `+${tempPt.val.toFixed(1)}°C`, x: W/2 - 88 },
          { label: 'SEA RISE', val: `+${Math.round(seaPt.val)} cm`, x: W/2 + 88 },
        ].map(({ label, val, x }) => (
          <g key={label}>
            <rect x={x - 58} y={H * 0.72} width="116" height="44" fill={fg} opacity="0.07" rx="5"/>
            <text x={x} y={H * 0.72 + 14} textAnchor="middle"
              fontFamily="var(--mono)" fontSize="8" letterSpacing="0.12em" fill={soft}>{label}</text>
            <text x={x} y={H * 0.72 + 34} textAnchor="middle"
              fontFamily="var(--serif)" fontSize="20" fill={color}>{val}</text>
          </g>
        ))}
        <text x={W/2} y={H - 8} textAnchor="middle"
          fontFamily="var(--mono)" fontSize="7.5" letterSpacing="0.14em" fill={soft} opacity="0.5">
          {ssp ? `${ssp.code} · ${ssp.name.toUpperCase()} PATHWAY` : 'CMIP6 MPI-ESM1-2-LR'}
        </text>
      </svg>
      <CO2MapViz value={value} year={year} color={color} fg={fg} faint={faint} soft={soft} ssp={ssp}/>
    </div>
  );
}

function CO2MapViz({ value, year, color, fg, faint, soft, ssp }) {
  const [ready, setReady] = React.useState(!!WORLD_TOPO);
  React.useEffect(() => { if (!ready) onTopoReady(() => setReady(true)); }, []);
  const rtKey = ssp.code === 'SSP1-2.6' ? '126' : ssp.code === 'SSP2-4.5' ? '245' : '585';

  const getColor = React.useCallback((cid) => {
    if (!REGIONAL_TEMP) return faint + '30';
    const country = REGIONAL_TEMP.countries[String(cid)];
    if (!country || !country[rtKey]) return faint + '30';
    const idx = Math.max(0, Math.min(75, year - 2025));
    const anom = country[rtKey][idx] || 0;
    const t = Math.max(0, Math.min(1, anom / 5.5));
    const r = Math.round(120 + t * 130), g = Math.round(110 - t * 100), b = Math.round(70 - t * 70);
    return `rgba(${r},${Math.max(0,g)},${Math.max(0,b)},${(0.25 + t * 0.7).toFixed(2)})`;
  }, [year, rtKey, ready]);

  return (
    <div style={{ width: '100%' }}>
      <WorldMap getColor={getColor} borderColor="rgba(255,255,255,0.08)" bg={faint + '18'}/>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6,
        fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', color: soft }}>
        <span>REGIONAL WARMING · CMIP6 MPI-ESM1-2-LR</span>
        <span>CO₂ {Math.round(value)} PPM · {year}</span>
      </div>
    </div>
  );
}

function SeaMapViz({ value, year, color, fg, faint, soft }) {
  const [ready, setReady] = React.useState(!!WORLD_TOPO);
  React.useEffect(() => { if (!ready) onTopoReady(() => setReady(true)); }, []);
  const riseNorm = Math.max(0, Math.min(1, value / 150));

  const getColor = React.useCallback((cid) => {
    const share = LECZ_SHARE[cid] || 0;
    const intensity = share * riseNorm;
    if (intensity < 0.02) return faint + '25';
    const r = Math.round(20 + intensity * 10);
    const g = Math.round(80 + intensity * 90);
    const b = Math.round(190 + intensity * 55);
    return `rgba(${r},${Math.min(255,g)},${Math.min(255,b)},${(0.2 + intensity * 0.7).toFixed(2)})`;
  }, [riseNorm, ready]);

  return (
    <div style={{ width: '100%' }}>
      <WorldMap getColor={getColor} borderColor="rgba(255,255,255,0.08)" bg={faint + '18'}/>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6,
        fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', color: soft }}>
        <span>COASTAL VULNERABILITY · CIESIN LECZ DATA</span>
        <span>+{Math.round(value)} CM RISE · {year}</span>
      </div>
    </div>
  );
}

function wiltSVG(dl, cx, baseY) {
  dl = Math.max(0, Math.min(1, dl));
  const potH = 26, potW = 42;
  const potTop = baseY - potH;
  const sR = Math.round(60 + dl * 80), sG = Math.round(115 - dl * 70), sB = 30;
  const stemColor = `rgb(${sR},${Math.max(0,sG)},${sB})`;
  const leafColor = `rgb(${Math.round(50+dl*110)},${Math.max(0,Math.round(145-dl*105))},${sB})`;
  const droop = dl * 38;
  const stemH = 80;
  const sx = cx + droop * 0.3, sy = potTop - stemH;
  const cpX = cx + droop * 0.75, cpY = potTop - stemH * 0.55;
  const lmX = cx + droop * 0.5, lmY = potTop - stemH * 0.5;
  const ang = (-40 + dl * 115) * Math.PI / 180;
  const ll = 26;
  const rx = lmX + Math.cos(ang) * ll, ry = lmY + Math.sin(ang) * ll;
  const lx = lmX - Math.cos(ang) * ll, ly = lmY + Math.sin(Math.abs(ang)) * ll;
  return (
    <g key={cx}>
      <path d={`M ${cx-potW/2} ${potTop} L ${cx-potW*0.38} ${baseY} L ${cx+potW*0.38} ${baseY} L ${cx+potW/2} ${potTop} Z`}
        fill={`rgb(${130+Math.round(dl*25)},${90-Math.round(dl*20)},50)`} opacity="0.85"/>
      <ellipse cx={cx} cy={potTop} rx={potW*0.44} ry={5}
        fill={`rgb(${105+Math.round(dl*45)},${72-Math.round(dl*28)},38)`} opacity="0.9"/>
      {dl > 0.25 && <g opacity={Math.min(1,(dl-0.25)*2.5)}>
        <line x1={cx-7} y1={potTop} x2={cx-3} y2={potTop+3} stroke="rgb(75,52,28)" strokeWidth="0.7"/>
        <line x1={cx+4} y1={potTop} x2={cx+2} y2={potTop+4} stroke="rgb(75,52,28)" strokeWidth="0.7"/>
      </g>}
      <path d={`M ${cx} ${potTop-2} Q ${cpX} ${cpY} ${sx} ${sy}`}
        stroke={stemColor} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d={`M ${lmX} ${lmY} Q ${(lmX+lx)/2-6} ${(lmY+ly)/2} ${lx} ${ly}`}
        fill={leafColor} stroke={leafColor} strokeWidth="1.5" opacity="0.85"/>
      <path d={`M ${lmX} ${lmY} Q ${(lmX+rx)/2+6} ${(lmY+ry)/2} ${rx} ${ry}`}
        fill={leafColor} stroke={leafColor} strokeWidth="1.5" opacity="0.85"/>
      {dl < 0.9 && <circle cx={sx} cy={sy} r={Math.max(1, 5.5-dl*4)} fill={leafColor} opacity={1-dl*0.4}/>}
    </g>
  );
}

function DroughtViz({ value, year, color, fg, faint, soft, ssp }) {
  const sspKey = ssp.code.replace('SSP', '');
  const tempCurve = generateCurve('temp', sspKey);
  const tempPt = tempCurve.find(d => d.year === year) || { val: 0 };
  const droughtLevel = Math.min(0.95, tempPt.val / 5.2);

  const [hoverPlant, setHoverPlant] = React.useState(null);

  const PW = 440, PH = 200;
  const plantXs = [56, 138, 220, 302, 385];

  return (
    <svg viewBox={`0 0 ${PW} ${PH}`} width="100%" height="auto"
      onMouseLeave={() => setHoverPlant(null)}>
      <rect width={PW} height={PH} fill={faint} opacity="0.06" rx="6"/>
      <text x="14" y="20" fontFamily="var(--mono)" fontSize="9" letterSpacing="0.14em" fill={soft}>
        HEAT STRESS ON VEGETATION · {year}
      </text>
      {plantXs.map((px, i) => {
        const plantStress = Math.max(0, droughtLevel - i * 0.04);
        const stressLabel = plantStress > 0.6 ? 'SEVERE' : plantStress > 0.3 ? 'MODERATE' : plantStress > 0.05 ? 'LOW' : 'NONE';
        return (
          <g key={px}
            onMouseEnter={() => setHoverPlant(i)}
            style={{ cursor: 'default' }}>
            {wiltSVG(plantStress, px, PH - 18)}
            {hoverPlant === i && (() => {
              const tipW = 118, tipH = 36;
              const tx = Math.max(tipW / 2 + 4, Math.min(px, PW - tipW / 2 - 4));
              return (
                <g pointerEvents="none">
                  <rect x={tx - tipW/2} y={16} width={tipW} height={tipH}
                    fill={fg} opacity="0.93" rx="3"/>
                  <text x={tx} y={30} textAnchor="middle"
                    fontFamily="var(--mono)" fontSize="8.5" fill={faint} letterSpacing="0.08em">
                    {stressLabel} STRESS
                  </text>
                  <text x={tx} y={44} textAnchor="middle"
                    fontFamily="var(--mono)" fontSize="8" fill={faint} opacity="0.75">
                    +{tempPt.val.toFixed(1)}°C · CMIP6
                  </text>
                </g>
              );
            })()}
          </g>
        );
      })}
      <text x="14" y={PH - 6} fontFamily="var(--mono)" fontSize="8" letterSpacing="0.1em" fill={soft} opacity="0.55">
        +{tempPt.val.toFixed(1)}°C ABOVE BASELINE · {droughtLevel > 0.6 ? 'SEVERE' : droughtLevel > 0.3 ? 'MODERATE' : 'LOW'} STRESS
      </text>
    </svg>
  );
}
function SeaViz({ value, year, color, fg, faint, soft, bg, ssp }) {
  const w = 430, h = 320;
  const seaY = h - 44 - Math.min(value, 200) * 1.1;
  const baselineY = h - 44;

  const [hover, setHover] = React.useState({ x: 0, y: 0, visible: false });
  const sspKey = ssp ? ssp.code.replace('SSP', '') : '2-4.5';
  const tempCurve = generateCurve('temp', sspKey);
  const tempPt = tempCurve.find(d => d.year === year) || { val: 0 };
  const tempAnomaly = tempPt.val;
  const isHot = tempAnomaly >= 2.0;


  const onWaterMove = (e) => {
    const svg = e.currentTarget.closest('svg');
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (w / rect.width);
    const y = (e.clientY - rect.top) * (h / rect.height);
    setHover({ x, y, visible: true });
  };

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
        const y = baselineY - cm * 1.1;
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
      <rect x="0" y={seaY} width={340} height={h - seaY} fill="url(#waterGrad)"
        style={{ cursor: 'none' }}
        onMouseMove={onWaterMove}
        onMouseLeave={() => setHover(prev => ({ ...prev, visible: false }))}/>
      <path d={`M 0 ${seaY} Q 20 ${seaY-3} 40 ${seaY} T 80 ${seaY} T 120 ${seaY} T 160 ${seaY} T 200 ${seaY} T 240 ${seaY} T 280 ${seaY} T 320 ${seaY} L 340 ${seaY}`} stroke={fg} strokeWidth="0.8" fill="none" opacity="0.4"/>
      <text x="6" y="22" fontFamily="var(--mono)" fontSize="10" letterSpacing="0.16em" fill={soft}>{year} · CUMULATIVE RISE</text>
      <text x="6" y="56" fontFamily="var(--serif)" fontSize="36" fill={fg}>+{Math.round(value)}<tspan fontSize="14" fill={soft}> cm</tspan></text>
      {hover.visible && (() => {
        const tx = Math.max(12, Math.min(hover.x, 320));
        const ty = Math.max(80, Math.min(hover.y, h - 20));
        const bubX = Math.max(52, Math.min(tx, 288));
        const bubY = ty - 38;
        return (
          <g pointerEvents="none">
            <rect x={tx - 3} y={ty - 30} width="6" height="18" rx="3" fill={fg} opacity="0.9"/>
            <circle cx={tx} cy={ty - 8} r="6" fill={isHot ? '#E05020' : color} opacity="0.9"/>
            {isHot ? (
              <g>
                <path d={`M ${bubX-44} ${bubY-28} Q ${bubX-44} ${bubY-44} ${bubX-30} ${bubY-44} L ${bubX+30} ${bubY-44} Q ${bubX+44} ${bubY-44} ${bubX+44} ${bubY-28} Q ${bubX+44} ${bubY-12} ${bubX+30} ${bubY-12} L ${bubX+6} ${bubY-12} L ${bubX} ${bubY-4} L ${bubX-10} ${bubY-12} Q ${bubX-44} ${bubY-12} ${bubX-44} ${bubY-28} Z`}
                  fill={fg} opacity="0.92"/>
                <text x={bubX} y={bubY-30} textAnchor="middle" fontFamily="var(--mono)" fontSize="9.5" fill={bg} letterSpacing="0.08em">Youch! 🌡️</text>
                <text x={bubX} y={bubY-17} textAnchor="middle" fontFamily="var(--mono)" fontSize="8" fill={bg} opacity="0.75">+{tempAnomaly.toFixed(1)}°C above baseline</text>
              </g>
            ) : (
              <g>
                <rect x={bubX-42} y={bubY-28} width="84" height="20" fill={fg} opacity="0.88" rx="4"/>
                <text x={bubX} y={bubY-14} textAnchor="middle" fontFamily="var(--mono)" fontSize="8.5" fill={bg}>+{tempAnomaly.toFixed(1)}°C above 1995–2014</text>
              </g>
            )}
          </g>
        );
      })()}
    </svg>
  );
}

function IceCapsViz({ year, color, fg, faint, soft, ssp }) {
  const sspKey = ssp ? ssp.code.replace('SSP', '') : '2-4.5';
  const tempCurve = generateCurve('temp', sspKey);
  const tempPt = tempCurve.find(d => d.year === year) || { val: 0 };
  const tempAnomaly = tempPt.val;
  const iceExtent = Math.max(0.05, 1 - tempAnomaly / 3.8);

  // Landscape: 560×200 so rendered height stays ~200px at full column width
  const W = 560, H = 200;
  const CX = 100, CY = 100, MAX_R = 88;

  const ICE_ANGLES = Array.from({ length: 24 }, (_, i) => ({
    angle: (i / 24) * Math.PI * 2,
    wobble: 1 + 0.08 * Math.sin(i * 3.7) + 0.05 * Math.cos(i * 5.2),
  }));

  const iceOuter = ICE_ANGLES.map(({ angle, wobble }) => {
    const r = MAX_R * iceExtent * wobble;
    return `${(CX + Math.cos(angle) * r).toFixed(1)},${(CY + Math.sin(angle) * r).toFixed(1)}`;
  }).join(' ');

  const iceInner = ICE_ANGLES.map(({ angle, wobble }) => {
    const r = MAX_R * iceExtent * wobble * 0.6;
    return `${(CX + Math.cos(angle) * r).toFixed(1)},${(CY + Math.sin(angle) * r).toFixed(1)}`;
  }).join(' ');

  const extentMk = (4.7 * iceExtent).toFixed(1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto">
      <circle cx={CX} cy={CY} r={MAX_R} fill="#12304A"/>
      {[1/3, 2/3, 1].map((frac, i) => (
        <circle key={i} cx={CX} cy={CY} r={MAX_R * frac}
          fill="none" stroke={faint} strokeWidth="0.5" strokeDasharray="3 4" opacity="0.3"/>
      ))}
      <circle cx={CX} cy={CY} r={MAX_R * 0.88}
        fill="none" stroke={soft} strokeWidth="0.8" strokeDasharray="4 6" opacity="0.3"/>
      <text x={CX + MAX_R * 0.88 + 3} y={CY - 1}
        fontFamily="var(--mono)" fontSize="6" fill={soft} opacity="0.4">1980</text>
      <polygon points={iceOuter} fill="#DAEAF5" opacity="0.92"/>
      <polygon points={iceInner} fill="white" opacity="0.4"/>
      <circle cx={CX} cy={CY} r={MAX_R} fill="none" stroke={faint} strokeWidth="1.5" opacity="0.6"/>
      <circle cx={CX} cy={CY} r="3" fill={soft} opacity="0.5"/>
      {/* Labels in the right-hand space */}
      <text x="208" y="22" fontFamily="var(--mono)" fontSize="9" letterSpacing="0.14em" fill={soft}>
        ARCTIC SEA ICE · SEPTEMBER MINIMUM · {year}
      </text>
      <text x="208" y="70" fontFamily="var(--serif)" fontSize="32" fill={color}>
        {extentMk}
      </text>
      <text x="208" y="86" fontFamily="var(--mono)" fontSize="10" fill={soft}>million km²</text>
      <text x="208" y="110" fontFamily="var(--mono)" fontSize="8" letterSpacing="0.05em" fill={soft} opacity="0.55" style={{ maxWidth: 300 }}>
        estimated · cmip6 temperature · mpi-esm1-2-lr
      </text>
      <text x="208" y="128" fontFamily="var(--mono)" fontSize="8" fill={soft} opacity="0.55">
        {ssp ? ssp.code : ''} · +{tempAnomaly.toFixed(1)}°C above 1995–2014
      </text>
    </svg>
  );
}

function SeaComboViz(props) {
  return (
    <div style={{ width: '100%' }}>
      <IceCapsViz {...props}/>
      <div style={{ marginTop: 10 }}/>
      <SeaViz {...props}/>
    </div>
  );
}

const METRIC_VIZ = { temp: ThermometerViz, co2: CarbonSummaryCard, sea: SeaComboViz, precip: DroughtViz };

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
function MetricMiniChart({ metric, year, ssp, theme, onSeek }) {
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

  const [hoverYear, setHoverYear] = React.useState(null);

  const svgYearFromEvent = (e) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const svgX = (e.clientX - rect.left) * (W / rect.width);
    const raw = 1900 + (svgX - pad.l) / (W - pad.l - pad.r) * 200;
    return Math.max(2025, Math.min(2100, Math.round(raw)));
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto" style={{ cursor: 'crosshair' }}
      onMouseMove={e => { if (e.clientX) setHoverYear(svgYearFromEvent(e)); }}
      onMouseLeave={() => setHoverYear(null)}
      onClick={e => { const yr = svgYearFromEvent(e); if (onSeek) onSeek(yr); }}>
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
        {theme.label.toUpperCase()} · 1900 → 2100 · CLICK TO SEEK
      </text>
      <text x={W-pad.r} y={28} fontSize="30" textAnchor="end" fill={theme.accent}
        fontFamily="var(--serif)" letterSpacing="-0.02em">
        {fmtVal(pt.val)}<tspan fontSize="13" fill={theme.soft}> {unitLabel}</tspan>
      </text>
      <text x={W-pad.r} y={44} fontSize="8" textAnchor="end" fill={theme.soft}
        fontFamily="var(--mono)" letterSpacing="0.14em">IN {year}</text>
      {hoverYear && hoverYear >= 2025 && (() => {
        const hx = xScale(hoverYear);
        const tipX = hx + 8;
        const tipW = 96, tipH = 16 + projCurves.length * 13;
        const ax = tipX + tipW > W - pad.r ? hx - tipW - 8 : tipX;
        return (
          <g pointerEvents="none">
            <line x1={hx} y1={pad.t} x2={hx} y2={H-pad.b}
              stroke={theme.fg} strokeWidth="1" opacity="0.3" strokeDasharray="3 3"/>
            <rect x={ax} y={pad.t+2} width={tipW} height={tipH}
              fill={theme.bg} stroke={theme.faint} strokeWidth="0.8" rx="3" opacity="0.95"/>
            <text x={ax+6} y={pad.t+13} fontFamily="var(--mono)" fontSize="8"
              fill={theme.accent} letterSpacing="0.1em">{hoverYear}</text>
            {projCurves.map((c, i) => {
              const hpt = c.data.find(d => d.year === hoverYear);
              if (!hpt) return null;
              return <text key={c.id} x={ax+6} y={pad.t+13+(i+1)*13}
                fontFamily="var(--mono)" fontSize="8"
                fill={c.id === sspKey ? theme.accent : c.color}
                opacity={c.id === sspKey ? 1 : 0.65} letterSpacing="0.04em">
                {fmtVal(hpt.val)} {unitLabel}
              </text>;
            })}
            {(() => {
              const hp = activeCurve.data.find(d => d.year === hoverYear);
              return hp ? <circle cx={hx} cy={yScale(hp.val)} r="4"
                fill={theme.accent} stroke={theme.bg} strokeWidth="1.5"/> : null;
            })()}
          </g>
        );
      })()}
    </svg>
  );
}


function NarrativeBubble({ children, color, faint }) {
  return (
    <div style={{
      borderLeft: `2px solid ${color}`,
      paddingLeft: 12,
      marginTop: 14,
      marginBottom: 2,
      fontFamily: 'var(--mono)',
      fontSize: 11,
      letterSpacing: '0.05em',
      lineHeight: 1.65,
      color: faint,
    }}>
      {children}
    </div>
  );
}

function getBubble(metric, value, tempValue) {
  if (metric === 'co2') {
    if (value >= 700) return 'The ocean has absorbed 30% of all CO₂ ever emitted. Its pH has dropped 0.1 units, a 26% increase in acidity.';
    if (value >= 560) return 'We\'ve doubled the pre-industrial atmospheric baseline.';
    if (value >= 450) return 'The last time CO₂ was this high, forests grew in Antarctica.';
  }
  if (metric === 'temp') {
    if (value >= 3.5) return 'Permafrost covers 25% of the Northern Hemisphere\'s land surface. At this temperature, it\'s releasing carbon, not storing it.';
    if (value >= 2.0) return 'At this temperature, 37% of the global population is exposed to at least one severe heatwave per year.';
    if (value >= 1.5) return 'The Paris Agreement\'s aspirational ceiling. Passed.';
  }
  if (metric === 'sea') {
    if (value >= 100) return 'Over 600 million people live within 10 meters of sea level.';
    if (value >= 50) return 'Tuvalu, Kiribati, and the Marshall Islands have begun legal proceedings over national territory submerged by rising seas.';
    if (value >= 20) return 'South Florida\'s drainage system starts running in reverse during storm surges.';
  }
  if (metric === 'precip') {
    if (tempValue >= 4.0) return 'At this level of warming, the Amazon rainforest begins converting to savanna, releasing its stored carbon.';
    if (tempValue >= 2.5) return 'The Ganges, Colorado, and Yellow Rivers are projected to lose 10–30% of annual flow.';
    if (tempValue >= 1.5) return 'The area in severe drought has roughly doubled globally since 2000.';
  }
  return null;
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

  const handleChartSeek = React.useCallback((seekYear) => {
    const el = blockRef.current;
    if (!el) return;
    const frac = (seekYear - 2025) / 75;
    const total = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: el.offsetTop + frac * total, behavior: 'smooth' });
  }, []);

  const curve = generateCurve(id, sspKey);
  const point = curve.find(d => d.year === year) || curve[0];
  const value = point.val;
  const beats = METRIC_BEATS[id][sspKey];
  const activeBeat = [...beats].reverse().find(b => b.year <= year) || beats[0];
  const Viz = METRIC_VIZ[id];

  const tempCurveForBubble = generateCurve('temp', sspKey);
  const tempPtForBubble = tempCurveForBubble.find(d => d.year === year) || { val: 0 };
  const bubble = getBubble(id, value, tempPtForBubble.val);

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
              {bubble && <NarrativeBubble color={theme.accent} faint={theme.soft}>{bubble}</NarrativeBubble>}
              <div className="metric-pathway-tag" style={{ color: theme.soft }}>
                Your pathway · <span style={{ color: ssp.swatch }}>{ssp.code}</span> · {ssp.name}
              </div>
            </div>
            <div className="metric-viz">
              <Viz value={value} year={year} color={theme.accent} fg={theme.fg} faint={theme.faint} soft={theme.soft} bg={theme.bg} ssp={ssp} curve={curve} beats={beats}/>
            </div>
          </div>
          <div className="metric-chart" style={{ borderColor: theme.faint, color: theme.fg }}>
            <MetricMiniChart metric={id} year={year} ssp={ssp} theme={theme} onSeek={handleChartSeek}/>
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
            how much carbon we leave in the sky, how high the seas rise, and how the water moves.
            Your pathway is highlighted. Watch how much it diverges from the others.
          </p>
          <p style={{ fontSize: 14, fontFamily: 'var(--mono)', letterSpacing: '0.1em', color: 'var(--ink-soft)', marginTop: 20 }}>
            DATA · MPI-ESM1-2-LR · CMIP6 · r1i1p1f1 · NOAA/Google Cloud
          </p>
        </div>
      </div>
      <MetricBlock id="co2"    ssp={ssp} idx={0}/>
      <MetricBlock id="temp"   ssp={ssp} idx={1}/>
      <MetricBlock id="sea"    ssp={ssp} idx={2}/>
      <MetricBlock id="precip" ssp={ssp} idx={3}/>
    </>
  );
}

// ── Hero ──
function HeroTitle() {
  return (
    <section className="hero" data-screen-label="01 Intro">
      <div className="eyebrow">An interactive story · 75 years of choices</div>
      <h1>Degrees of<br/><span className="acc">Consequence</span></h1>
      <div className="scroll-hint"><span>Scroll to begin</span><span className="bar"/></div>
    </section>
  );
}

// ── Hero description slide ──
function HeroDesc() {
  return (
    <section className="hero-desc" data-screen-label="01 About">
      <div className="hero-desc-inner">
        <p className="hero-desc-lede">
          Somewhere in the next few years, the decisions that shape the next century will be made. Not by nature. Not by accident. By people, in votes, in boardrooms, in budgets. Pick a seat at the table and see what your choices leave behind.
        </p>
        <div className="hero-desc-meta">
          <div>Reading time<span>~ 6 minutes</span></div>
          <div>Dataset<span>CMIP6 · SSPs</span></div>
          <div>Issue<span>Vol. 01 · 2026</span></div>
        </div>
      </div>
      <div className="scroll-hint"><span>Continue</span><span className="bar"/></div>
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
            Viela Lansangan<br/>
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
    fetch('../data/climate-data.json')
      .then(r => r.json())
      .then(data => { CLIMATE = data; setDataReady(true); })
      .catch(err => { console.warn('[app] climate-data.json load failed:', err); setDataReady(true); });

    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(r => r.json())
      .then(d => { WORLD_TOPO = d; buildWorldPaths(); fireTopoReady(); })
      .catch(err => console.warn('[app] world-atlas load failed:', err));

    fetch('../data/regional-temp.json')
      .then(r => r.json())
      .then(d => { REGIONAL_TEMP = d; })
      .catch(err => console.warn('[app] regional-temp.json load failed:', err));

    fetch('../data/pr_anomalies.json')
      .then(r => r.json())
      .then(d => { PR_ANOMALIES = d; })
      .catch(err => console.warn('[app] pr_anomalies.json load failed:', err));
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
      <HeroTitle/>
      <HeroDesc/>
      <ChoiceSection values={values} setValues={setValues} persona={persona} setPersona={setPersona} onSubmit={onSubmit}/>
      {submitted && !timeJumpDone && <TimeJump onComplete={handleTimeJumpComplete}/>}
      {timeJumpDone && <TimelineSection ssp={ssp}/>}
      {timeJumpDone && <Outro onRestart={onRestart}/>}
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
