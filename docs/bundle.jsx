// ============================================================
// bundle.jsx — Degrees of Consequence
// Real CMIP6 data from MPI-ESM1-2-LR via NOAA/Google Cloud.
// Historical 1980-2024 from CMIP6 historical experiment.
// Projections 2025-2100: SSP1-2.6, SSP2-4.5, SSP5-8.5.
// CO2 + sea level: IPCC AR6-consistent parametric curves.
// ============================================================

// ============================================================
// ── SECTION 1: DATA
// ============================================================

const SSP_NAMES = { '1-2.6': 'Sustainable', '2-4.5': 'Middle Road', '5-8.5': 'Fossil-Fueled' };

const KNOB_DEFS = [
  { id: 'fossil',  short: 'Fossil fuel',    color: '#B4633A', img: '../images/coal_mine_cart.png',   desc: 'How heavily the framework keeps investing in extracting and burning oil, gas, and coal.' },
  { id: 'renew',   short: 'Renewables',     color: '#4E7558', img: '../images/solar_panel.png',      desc: 'How fast new wind, solar, and clean energy gets built and funded.' },
  { id: 'carbon',  short: 'Carbon pricing', color: '#4E7558', img: '../images/capitol_building.png', desc: 'Whether burning carbon costs money, and how much.' },
  { id: 'forest',  short: 'Forests & land', color: '#82A78A', img: '../images/rainforest.png',       desc: 'How much land gets protected from deforestation and degradation.' },
  { id: 'coop',    short: 'Cooperation',    color: '#82A78A', img: '../images/handshake.png',        desc: 'Whether countries work together or compete on climate action.' },
  { id: 'consume', short: 'Consumption',    color: '#82A78A', img: '../images/recycling.png',        desc: 'How much the framework tries to reduce overall demand for energy and goods.' },
];

const PERSONAS = [
  { id: 'tycoon', keywords: 'ENERGY · EXTRACTION · GROWTH', name: 'The Oil Tycoon', label: 'Drill, baby, drill',
    tag: 'Oil built the modern world, and he plans to keep it that way. Future costs are someone else\'s problem.',
    img: '../images/oil_baron_floating.png',
    values: { fossil: 92, renew: 12, carbon: 6, forest: 18, coop: 18, consume: 8 } },
  { id: 'politician', keywords: 'POLITICS · COMPROMISE · OPTICS', name: 'The Politician', label: 'Split the difference',
    tag: 'He talks green and votes convenient. Every choice is filtered through the next election.',
    img: '../images/parliament_debate.png',
    values: { fossil: 58, renew: 48, carbon: 38, forest: 42, coop: 50, consume: 32 } },
  { id: 'scientist', keywords: 'PATHWAY · PROJECTION · EVIDENCE', name: 'The Climate Scientist', label: 'Follow the data',
    tag: 'The IPCC data guides her decisions. Decarbonize by 2050 or the projections do not work.',
    img: '../images/stressed_researcher.png',
    values: { fossil: 8, renew: 92, carbon: 84, forest: 86, coop: 88, consume: 76 } },
];

const PERSONA_THOUGHTS = {
  tycoon: {
    fossil: 'Oil and gas are treated as essential infrastructure. Any phase-out is deferred to a later decade.',
    renew: 'Renewables are a supplement, funded where unavoidable, then quietly deprioritized.',
    carbon: 'There is no carbon tax in this framework. That conversation ends before it begins.',
    forest: 'Protected areas get lip service. Where they conflict with extraction rights, extraction wins.',
    coop: 'International agreements are PR exercises. Real decisions happen at home, for domestic benefit.',
    consume: 'Asking people to consume less is politically unpopular. Demand is allowed to grow unchecked.',
  },
  politician: {
    fossil: 'Fossil fuels cannot be eliminated overnight without losing the next election. The decline is managed slowly.',
    renew: 'Renewables get funded because costs have come down and the optics are good. But the pace tracks the news cycle, not the science.',
    carbon: 'A carbon price gets discussed, watered down, and passed in a form that satisfies no one. Progress on paper.',
    forest: 'Conservation gets announced in election years. Enforcement is inconsistent.',
    coop: 'Summits get attended, agreements get signed, targets get set for 2050. Accountability is weak.',
    consume: 'Consumption reduction does not poll well. It gets quietly dropped from every platform.',
  },
  scientist: {
    fossil: 'New extraction halts this decade; existing wells phase out on a set schedule. No 1.5°C pathway includes new oil.',
    renew: 'The grid can run on renewables by 2035. This framework funds it.',
    carbon: 'A price on carbon is the most effective lever available. Every tonne costs something; revenue is rebated.',
    forest: 'Tropical forests sequester 2.6 Gt of CO₂ a year. Every hectare that is protected matters.',
    coop: 'The Paris Agreement sets minimum commitments. Shared grids and common carbon markets are the primary mechanisms.',
    consume: 'Absolute consumption must decline in wealthy countries. Efficiency gains alone are not enough.',
  },
};

const METRICS = [
  { id: 'co2',    label: 'CO₂',          unit: 'ppm', dark: false, chapter: 'Chapter Three · A', title: 'The atmosphere',
    chartTitle: 'Atmospheric CO₂ concentration',
    blurb: 'Every tonne emitted lingers in the atmosphere for centuries.',
    fmt: v => Math.round(v), dom: [300, 900] },
  { id: 'temp',   label: 'Temperature',  unit: '°C',  dark: true,  chapter: 'Chapter Three · B', title: 'The heat',
    chartTitle: 'Global mean temperature anomaly',
    blurb: 'A few degrees of average warming separates manageable impacts from severe and widespread disruption.',
    fmt: v => (v >= 0 ? '+' : '') + v.toFixed(1), dom: [-0.2, 5.5] },
  { id: 'sea',    label: 'Sea level',    unit: 'cm',  dark: false, chapter: 'Chapter Three · C', title: 'The rising sea',
    chartTitle: 'Projected sea level rise',
    blurb: 'Thermal expansion and ice melt raise sea levels, permanently altering coastlines.',
    fmt: v => (v >= 0 ? '+' : '') + Math.round(v), dom: [0, 150] },
  { id: 'drought', label: 'Precipitation', unit: '%', dark: false, chapter: 'Chapter Three · D', title: 'Precipitation',
    chartTitle: 'Drought-affected land area',
    blurb: 'Warming redistributes rainfall across biomes. Mediterranean regions dry out while savannas and boreal forests see increased precipitation. Click a biome to explore.',
    fmt: v => v.toFixed(1), dom: [20, 40] },
];

const BEATS = {
  co2: {
    '1-2.6': [
      { year: 2030, title: 'Concentration peaks', body: 'Three climate bills and a decade of market pressure bring CO₂ to a peak. Concentration stabilizes but does not fall immediately.', note: 'Concentration peaks near 434 ppm.' },
      { year: 2055, title: 'Net zero reached', body: 'Net emissions reach zero. The grid runs on wind and solar. Atmospheric concentration plateaus and starts, slowly, to fall.', note: 'First sustained decline since 1850.' },
      { year: 2100, title: 'Concentration falling', body: 'For the first time since the Industrial Revolution, humanity pulls more carbon out of the atmosphere than it puts in. Net emissions are now negative.', note: '≈ 422 ppm · and falling.' },
    ],
    '2-4.5': [
      { year: 2030, title: 'Concentration climbing', body: 'Emissions flatten as renewables scale, but fossil infrastructure is too entrenched to decline quickly. Concentration keeps climbing.', note: 'Past 443 ppm.' },
      { year: 2055, title: 'Delayed peak', body: 'Emissions finally begin to fall, after CO₂ surpasses a level not seen in three million years. The descent will be slow.', note: 'Nearing 500 ppm.' },
      { year: 2100, title: 'Concentration stabilizes', body: 'Concentration holds near 577 ppm, roughly double the pre-industrial baseline. Significant damage has already occurred.', note: '≈ 577 ppm · holding.' },
    ],
    '5-8.5': [
      { year: 2030, title: 'Emissions accelerate', body: 'New coal and gas plants outpace retirements worldwide. Concentration climbs faster than at any point in human history.', note: 'Past 449 ppm, accelerating.' },
      { year: 2055, title: 'Unprecedented levels', body: 'Earth has not had an atmosphere like this in 50 million years. Natural carbon sinks are struggling to absorb emissions at this rate.', note: 'Past 560 ppm.' },
      { year: 2100, title: 'Carbon sinks become sources', body: 'The Amazon and Arctic tundra have stopped absorbing carbon and started releasing it. Feedback loops are now driving further warming, not just projecting it.', note: '≈ 882 ppm · rising.' },
    ],
  },
  temp: {
    '1-2.6': [
      { year: 2030, title: 'Warming rate slows', body: 'Hot summers still set records. But the rate of warming begins to ease for the first time in decades, visible in the data.', note: 'Anomaly near +1.1°C.' },
      { year: 2055, title: 'Warming plateaus', body: 'The anomaly holds near +1.3°C. Heatwaves intensify regionally, but the most severe warming scenarios are avoided.', note: 'Peak warming, then decline.' },
      { year: 2100, title: 'Warming stabilized', body: 'Coral systems are stressed but largely intact. The Arctic thins but retains summer sea ice. The warming is significant but within the range of human adaptation.', note: '≈ +1.1°C · stabilized.' },
    ],
    '2-4.5': [
      { year: 2030, title: 'Records keep falling', body: 'Each decade sets new heat records. Adaptation becomes a permanent budget line: seawalls, cooling centers, crop adjustments.', note: 'Anomaly near +1.1°C.' },
      { year: 2055, title: 'Dangerous heat thresholds crossed', body: 'Wet-bulb temperatures cross dangerous thresholds in South Asia and the Gulf for weeks at a time. Outdoor labor gets legally restricted.', note: 'Past +1.6°C.' },
      { year: 2100, title: 'Warming locked in', body: 'Air conditioning has become critical infrastructure. Insurance markets have withdrawn from whole coastlines. The warming will persist for centuries.', note: '≈ +2.6°C · climbing.' },
    ],
    '5-8.5': [
      { year: 2030, title: 'Warming accelerates', body: 'No abatement. Each summer is hotter than the last. Wildfires double across the boreal north. Warming shows no sign of slowing.', note: 'Anomaly near +1.1°C, steepening.' },
      { year: 2055, title: 'Lethal heat', body: 'Multiple regions exceed 35°C wet-bulb for weeks at a time. At that threshold, the human body cannot cool itself outdoors, even in shade.', note: 'Past +2.2°C.' },
      { year: 2100, title: 'Near +5°C', body: 'Permafrost thaw is now releasing stored carbon. Feedback loops have engaged. Warming is accelerating beyond human control.', note: '≈ +4.9°C · accelerating.' },
    ],
  },
  sea: {
    '1-2.6': [
      { year: 2040, title: 'Gradual rise', body: 'Sea level rises about 4 mm a year, slow enough that cities can plan. Seawalls get funded and managed retreat begins in the most exposed neighborhoods.', note: '≈ 18 cm.' },
      { year: 2070, title: 'Adaptation holds', body: 'Most large coastal cities are protected. Some low-lying communities have relocated inland. The ice sheets continue thinning.', note: '≈ 30 cm.' },
      { year: 2100, title: 'Forty-two centimeters', body: 'Manageable with preparation. Cities that invested in coastal defenses in the 2030s remain viable.', note: '≈ +42 cm.' },
    ],
    '2-4.5': [
      { year: 2040, title: 'Rise accelerates', body: 'Greenland\'s ice sheet becomes a significant contributor to sea level rise. Insurance markets in low-lying regions begin to fail, starting with private insurers and then public backstops.', note: '≈ 23 cm.' },
      { year: 2070, title: 'Selective retreat', body: 'Whole neighborhoods of Miami, Jakarta, and Lagos have been abandoned. Retreat is now accepted; the dispute is over who pays for it.', note: '≈ 50 cm.' },
      { year: 2100, title: 'Eighty-two centimeters', body: 'Climate-driven migration is reshaping where people can live. Coastal boundaries are being redrawn.', note: '≈ +82 cm.' },
    ],
    '5-8.5': [
      { year: 2040, title: 'West Antarctic ice melt accelerates', body: 'The West Antarctic ice sheet enters an accelerating melt phase. The rate of rise doubles. Coastal planning transitions to emergency response.', note: '≈ 28 cm.' },
      { year: 2070, title: 'Coastlines lost', body: 'Multiple island nations have ceased to exist as legal territories. Cumulative rise approaches 75 cm.', note: '≈ 75 cm.' },
      { year: 2100, title: 'Past a meter', body: '142 centimeters of rise. Sea level is one of the primary forces reshaping where people can live. It will not stop in 2100.', note: '≈ +142 cm · rising.' },
    ],
  },
  drought: {
    '1-2.6': [
      { year: 2040, title: 'Rain shifts poleward', body: 'Mediterranean coasts lose about 0.1 mm/day of precipitation while boreal forests gain. Rainfall shifts poleward and the subtropical fringe dries first.', note: 'Med −0.11 · Boreal +0.09 mm/day.' },
      { year: 2070, title: 'Boreal zones gain precipitation', body: 'Boreal and tundra zones receive more rain as warmth redistributes moisture northward. The Mediterranean briefly stabilizes as the shift slows.', note: 'Boreal +0.09 · Med +0.04 mm/day.' },
      { year: 2100, title: 'Biome patterns shift', body: 'Temperate forests grow wetter and deserts drier. The biome map has shifted, but in this pathway, adaptation keeps pace with the change.', note: 'Temperate +0.13 · Desert −0.03 mm/day.' },
    ],
    '2-4.5': [
      { year: 2040, title: 'Mediterranean dries', body: 'Southern Europe and California lose rainfall as moisture shifts north. Savannas see heavier seasonal pulses, increasing the gap between wet and dry periods.', note: 'Med −0.11 · Savanna +0.11 mm/day.' },
      { year: 2070, title: 'Divergence widens', body: 'Mediterranean drought shifts from seasonal to structural. Boreal zones gain 0.1 mm/day, snowmelt timing shifts, and rivers peak months earlier than historical norms.', note: 'Med −0.10 · Boreal +0.11 mm/day.' },
      { year: 2100, title: 'Permanent divergence', body: 'Mediterranean coasts have lost nearly 0.2 mm/day from baseline. Boreal and Arctic zones absorb the moisture that the subtropics have lost. The divergence is now permanent.', note: 'Med −0.17 · Boreal +0.18 mm/day.' },
    ],
    '5-8.5': [
      { year: 2040, title: 'Monsoons intensify', body: 'Savanna and boreal belts gain 0.1 mm/day as warming intensifies convection. Mediterranean summers grow drier with each passing year.', note: 'Savanna +0.12 · Med −0.05 mm/day.' },
      { year: 2070, title: 'Storm tracks shift', body: 'Mediterranean rainfall collapses by 0.2 mm/day as boreal zones approach tropical rainfall levels. Storm tracks have physically relocated.', note: 'Med −0.21 · Savanna +0.25 mm/day.' },
      { year: 2100, title: 'Rainfall redistributed', body: 'Mediterranean regions lose a third of their baseline rainfall. Savannas and boreal zones receive substantially more moisture. Precipitation patterns have fundamentally shifted.', note: 'Med −0.34 · Savanna +0.31 mm/day.' },
    ],
  },
};

function computeScore(v) {
  return Math.round(((100 - v.fossil) + v.renew + v.carbon + v.forest + v.coop + v.consume) / 6);
}
function classify(score) {
  if (score >= 65) return { code: 'SSP1-2.6', key: '1-2.6', name: 'Sustainable',   delta: 1.1, swatch: 'var(--tw-low)' };
  if (score >= 35) return { code: 'SSP2-4.5', key: '2-4.5', name: 'Middle Road',   delta: 2.6, swatch: 'var(--tw-mid)' };
  return               { code: 'SSP5-8.5', key: '5-8.5', name: 'Fossil-Fueled', delta: 4.9, swatch: 'var(--tw-high)' };
}

// Raw climate-data.json is populated after fetch
let _CLIMATE = null;
const _FULL_CACHE = {};

function generateFullCurve(metric, ssp) {
  const key = metric + ssp;
  if (_FULL_CACHE[key]) return _FULL_CACHE[key];
  if (!_CLIMATE) return [];

  const hist = _CLIMATE.historical[metric] || [];
  const proj = (_CLIMATE.metrics[metric] || {})[ssp] || [];
  const offset = (hist.length && proj.length) ? hist[hist.length - 1].val - proj[0].val : 0;
  const adjustedProj = offset !== 0 ? proj.map(p => ({ ...p, val: p.val + offset })) : proj;
  const out = [...hist, ...adjustedProj];
  _FULL_CACHE[key] = out;
  return out;
}

function valAt(metric, ssp, year) {
  const curve = generateFullCurve(metric, ssp);
  if (!curve.length) return 0;
  const pt = curve.find(d => d.year === year);
  if (pt) return pt.val;
  return curve[curve.length - 1].val;
}

function smoothedValAt(metric, ssp, year, window = 10) {
  const curve = generateFullCurve(metric, ssp);
  const pts = curve.filter(x => x.year > year - window && x.year <= year);
  if (!pts.length) return valAt(metric, ssp, year);
  return pts.reduce((s, x) => s + x.val, 0) / pts.length;
}

function smoothSeries(data, window = 10) {
  return data.map(pt => {
    const pts = data.filter(x => x.year > pt.year - window && x.year <= pt.year);
    const val = pts.length ? pts.reduce((s, x) => s + x.val, 0) / pts.length : pt.val;
    return { year: pt.year, val };
  });
}

function initDOC(climateData) {
  _CLIMATE = climateData;
  Object.keys(_FULL_CACHE).forEach(k => delete _FULL_CACHE[k]);
  window.DOC = { SSP_NAMES, PERSONAS, KNOB_DEFS, PERSONA_THOUGHTS, METRICS, BEATS,
    computeScore, classify, generateFullCurve, valAt };
}

// ============================================================
// ── SECTION 2: VIZ
// ============================================================

const PATH_VARS = { '1-2.6': 'var(--tw-low)', '2-4.5': 'var(--tw-mid)', '5-8.5': 'var(--tw-high)' };

function lerp(a, b, t) { return a + (b - a) * t; }

// ── Read-only policy dial ───────────────────────────────────
function Dial({ value, color = '#E08D5C', active }) {
  const minA = -135, maxA = 135;
  const angle = minA + value / 100 * (maxA - minA);
  const cx = 60, cy = 60, r = 44;
  const pol = (a) => [cx + r * Math.cos((a - 90) * Math.PI / 180), cy + r * Math.sin((a - 90) * Math.PI / 180)];
  const arc = (s, e) => {
    const [sx, sy] = pol(s), [ex, ey] = pol(e);
    const large = e - s > 180 ? 1 : 0;
    return `M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`;
  };
  const ticks = [];
  for (let i = 0; i <= 10; i++) {
    const a = (minA + i / 10 * (maxA - minA) - 90) * Math.PI / 180;
    ticks.push(<line key={i} x1={cx + 50 * Math.cos(a)} y1={cy + 50 * Math.sin(a)}
      x2={cx + 55 * Math.cos(a)} y2={cy + 55 * Math.sin(a)}
      stroke="rgba(236,230,206,0.5)" strokeWidth="1" opacity={i % 5 === 0 ? 0.8 : 0.35} />);
  }
  return (
    <svg viewBox="0 0 120 120">
      <path d={arc(minA, maxA)} stroke="rgba(236,230,206,0.12)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d={arc(minA, angle)} stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
      {ticks}
      <circle cx={cx} cy={cy} r={33} fill="rgba(7,18,10,0.9)" stroke={active ? color : 'rgba(236,230,206,0.18)'} strokeWidth="1.25" />
      <g transform={`rotate(${angle} ${cx} ${cy})`}>
        <line x1={cx} y1={cy - 6} x2={cx} y2={cy - 25} stroke="rgba(236,230,206,0.92)" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx={cx} cy={cy - 28} r="3" fill={color} />
      </g>
    </svg>
  );
}

// ── Carbon blocks — one cell per ppm CO₂ ───────────────────
const CARBON_MILESTONES = {
  280: 'Pre-industrial baseline · 1750',
  315: 'First Keeling measurement · 1958',
  350: "Hansen's safe upper limit",
  400: 'First time in 3 million years · 2013',
  420: 'Today · 2024',
  430: '≈1.5°C committed warming',
  450: '≈2°C threshold',
  500: 'Pliocene-era level',
  600: 'Eocene-era level',
  882: 'SSP5-8.5 worst case · 2100',
};

function carbonExcessColor(i) {
  const t = Math.min(1, Math.max(0, (i - 280) / (882 - 280)));
  const stops = [[160,160,160],[120,120,120],[70,70,70],[20,20,20]];
  const seg = Math.min(2, Math.floor(t * 3));
  const loc = t * 3 - seg;
  const [r1,g1,b1] = stops[seg], [r2,g2,b2] = stops[seg+1];
  return `rgb(${Math.round(r1+(r2-r1)*loc)},${Math.round(g1+(g2-g1)*loc)},${Math.round(b1+(b2-b1)*loc)})`;
}

function nearestCarbonMilestone(ppm) {
  let best = null, bestD = Infinity;
  for (const k of Object.keys(CARBON_MILESTONES)) {
    const d = Math.abs(ppm - +k);
    if (d < bestD && d <= 8) { bestD = d; best = +k; }
  }
  return best != null ? CARBON_MILESTONES[best] : null;
}

function CarbonBlocks({ value = 420, year = 2025 }) {
  const { useState, useEffect, useRef, useMemo, useCallback } = React;
  const COLS = 50, ROWS = 18, BASE = 280, TOTAL = COLS * ROWS;
  const W = 480, padX = 22, top = 42, bot = 50;
  const cell = (W - padX * 2) / COLS;
  const H = top + ROWS * cell + bot;
  const ppm = Math.round(value);
  const fg = '42,51,36';
  const border = `rgba(${fg},0.14)`;
  const empty = `rgba(${fg},0.05)`;
  const baseC = '#A7AB8C';

  // Animated ppm — fills/drains cells smoothly on year change
  const [animPpm, setAnimPpm] = useState(ppm);
  const rafRef = useRef(null);
  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const tick = () => {
      setAnimPpm(cur => {
        const d = ppm - cur;
        if (Math.abs(d) < 0.8) return ppm;
        return cur + Math.sign(d) * Math.max(2, Math.abs(d) * 0.18);
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [ppm]);
  const dispPpm = Math.round(animPpm);

  // Hover state
  const [hover, setHover] = useState(null);
  const onMouseMove = useCallback((e) => {
    const svg = e.currentTarget;
    const r = svg.getBoundingClientRect();
    const mx = (e.clientX - r.left) / r.width * W;
    const my = (e.clientY - r.top) / r.height * H;
    const col = Math.floor((mx - padX) / cell);
    const row = Math.floor((my - top) / cell);
    if (col >= 0 && col < COLS && row >= 0 && row < ROWS) setHover(row * COLS + col);
    else setHover(null);
  }, []);
  const onLeave = useCallback(() => setHover(null), []);

  // Cells — gradient on excess zone, animated dispPpm
  const cells = useMemo(() => {
    const out = [];
    for (let i = 0; i < TOTAL; i++) {
      const col = i % COLS, row = Math.floor(i / COLS);
      const x = padX + col * cell, y = top + row * cell, sz = cell - 1.7;
      const filled = i < dispPpm;
      const fill = filled ? (i < BASE ? baseC : carbonExcessColor(i)) : empty;
      out.push(<rect key={i} x={x.toFixed(1)} y={y.toFixed(1)} width={sz.toFixed(1)} height={sz.toFixed(1)} rx="1" fill={fill} stroke={border} strokeWidth="0.7" />);
    }
    return out;
  }, [dispPpm]);

  // Hover highlight + tooltip
  let highlight = null, tip = null;
  if (hover !== null) {
    const hc = hover % COLS, hr = Math.floor(hover / COLS);
    const hx = padX + hc * cell, hy = top + hr * cell, sz = cell - 1.7;
    highlight = (
      <rect x={hx.toFixed(1)} y={hy.toFixed(1)} width={sz.toFixed(1)} height={sz.toFixed(1)}
        rx="1" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.6" pointerEvents="none" />
    );
    const cx = hx + cell / 2, cellPpm = hover + 1;
    const isBase = hover < BASE;
    const zoneLabel = isBase ? 'PRE-INDUSTRIAL BASELINE' : 'HUMAN-ADDED EXCESS';
    const zoneColor = isBase ? '#8A9070' : carbonExcessColor(hover);
    const ms = nearestCarbonMilestone(cellPpm);
    const tipW = 182, tipH = ms ? 54 : 40;
    let tx = cx - tipW / 2, ty = hy - tipH - 8;
    tx = Math.max(padX, Math.min(W - padX - tipW, tx));
    if (ty < top + 4) ty = hy + sz + 8;
    tip = (
      <g pointerEvents="none">
        <rect x={tx} y={ty} width={tipW} height={tipH} rx="3"
          fill="rgba(248,246,238,0.97)" stroke={`rgba(${fg},0.2)`} strokeWidth="0.8" />
        <text x={tx+9} y={ty+13} fontFamily="var(--mono)" fontSize="8" letterSpacing="0.1em"
          fill={zoneColor} fontWeight="bold">{zoneLabel}</text>
        <text x={tx+9} y={ty+27} fontFamily="var(--mono)" fontSize="11.5"
          fill={`rgba(${fg},0.9)`}>{cellPpm} PPM CO₂</text>
        {ms && <text x={tx+9} y={ty+42} fontFamily="var(--mono)" fontSize="8.5" letterSpacing="0.04em"
          fill={`rgba(${fg},0.55)`}>{ms}</text>}
      </g>
    );
  }

  // Inline legend
  const legY = H - 16, swSz = 7;
  const legend = (
    <g fontFamily="var(--mono)" fontSize="11" letterSpacing="0.07em">
      <rect x={padX} y={legY-7} width={swSz} height={swSz} rx="1" fill={baseC} />
      <text x={padX+swSz+4} y={legY} fill={`rgba(${fg},0.45)`}>PRE-INDUSTRIAL</text>
      <rect x={padX+130} y={legY-7} width={swSz} height={swSz} rx="1" fill={carbonExcessColor(310)} />
      <text x={padX+138} y={legY} fill={`rgba(${fg},0.45)`}>HUMAN ADDITIONS</text>
    </g>
  );

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto"
      onMouseMove={onMouseMove} onMouseLeave={onLeave} style={{ cursor: 'crosshair' }}>
      <text x={padX} y="24" fontFamily="var(--mono)" fontSize="14" letterSpacing="0.14em"
        fill={`rgba(${fg},0.62)`}>EACH CELL = 1 PPM CO₂</text>
      {cells}
      {highlight}
      {tip}
      {legend}
      <text x={W-padX} y={H-16} textAnchor="end" fontFamily="var(--mono)" fontSize="13"
        letterSpacing="0.1em" fill={`rgba(${fg},0.72)`}>{year} · {ppm} PPM</text>
    </svg>
  );
}

// ── Line chart 1980–2100 with info-dense tooltip ────────────
function LineChart({ metric, activeKey, year, dark, dom, unit, fmt, onClickYear, seriesOverride = null, titleOverride = null, smooth = false, xStart = 1980 }) {
  const { useState, useRef, useMemo, useCallback } = React;
  const W = 1100, H = 284, pad = { t: 34, r: 22, b: 46, l: 72 };
  const [hoverYear, setHoverYear] = useState(null);
  const [cursorY, setCursorY] = useState(null);
  const fg = dark ? '236,230,206' : '42,51,36';
  const accent = dark ? '#E08D5C' : 'var(--tw-accent)';

  const X0 = xStart, X1 = 2100, SPAN = X1 - X0;
  const xs = (y) => pad.l + (y - X0) / SPAN * (W - pad.l - pad.r);
  const ys = (v) => H - pad.b - (v - dom[0]) / (dom[1] - dom[0]) * (H - pad.t - pad.b);

  const data = useMemo(() => {
    const raw = seriesOverride ? seriesOverride : generateFullCurve(metric, activeKey);
    return (smooth && !seriesOverride) ? smoothSeries(raw) : raw;
  }, [metric, activeKey, seriesOverride, smooth]);

  const seg = (a, b) => {
    let d = '';
    for (const p of data) {
      if (p.year < a || p.year > b) continue;
      d += (d ? ' L ' : 'M ') + xs(p.year).toFixed(1) + ' ' + ys(p.val).toFixed(1);
    }
    return d;
  };

  const xticks = X0 <= 1980 ? [1980, 2000, 2025, 2050, 2075, 2100] : [2025, 2050, 2075, 2100];
  const yticks = useMemo(() => {
    const out = []; const steps = 4;
    for (let i = 0; i <= steps; i++) out.push(dom[0] + i / steps * (dom[1] - dom[0]));
    return out;
  }, [dom]);

  const valOf = (yr) => { const p = data.find(d => d.year === yr); return p ? p.val : (data[data.length - 1] || {}).val || 0; };
  const curVal = valOf(Math.min(2100, year));
  const v1980 = data.length ? data[0].val : 0;
  const v2025 = valOf(2025);
  const vEnd = data.length ? data[data.length - 1].val : 0;
  const dfmt = (x) => (x >= 0 ? '+' : '−') + (Math.abs(x) >= 10 ? Math.round(Math.abs(x)) : Math.abs(x).toFixed(1));

  const yearFromEvent = useCallback((e) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * W;
    return Math.round(X0 + Math.max(0, Math.min(1, (x - pad.l) / (W - pad.l - pad.r))) * SPAN);
  }, []);

  const onMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCursorY((e.clientY - rect.top) / rect.height * H);
    setHoverYear(Math.max(X0, Math.min(X1, yearFromEvent(e))));
  }, [yearFromEvent]);

  const onClick = useCallback((e) => {
    if (onClickYear) onClickYear(Math.max(X0, Math.min(X1, yearFromEvent(e))));
  }, [onClickYear, yearFromEvent]);

  const tip = useMemo(() => {
    if (hoverYear == null) return null;
    const px = xs(hoverYear) / W * 100;
    return { px, flip: px > 62, val: valOf(hoverYear), hist: hoverYear < 2025 };
  }, [hoverYear, data]);

  const metricObj = METRICS.find(m => m.id === metric) || {};
  const metricLabel = metricObj.label || metric;
  const metricChartTitle = metricObj.chartTitle || metricLabel;
  const SSP_CODE = { '1-2.6': 'SSP1-2.6', '2-4.5': 'SSP2-4.5', '5-8.5': 'SSP5-8.5' };
  const chartMidY = pad.t + (H - pad.t - pad.b) / 2;

  return (
    <div className="chart-wrap">
      <div className="lc-title">{titleOverride || metricChartTitle} · {SSP_NAMES[activeKey]} pathway</div>
      <svg viewBox={`0 0 ${W} ${H}`} onMouseMove={onMove} onMouseLeave={() => { setHoverYear(null); setCursorY(null); }} onClick={onClick} style={{ cursor: onClickYear ? 'pointer' : 'default' }}>
        <text x={18} y={chartMidY + 6} textAnchor="middle" fontFamily="var(--mono)" fontSize="16" fill={`rgba(${fg},0.55)`}
          transform={`rotate(-90, 18, ${chartMidY + 6})`}>{unit}</text>
        {yticks.map((v, i) =>
          <g key={i}>
            <line x1={pad.l} y1={ys(v)} x2={W - pad.r} y2={ys(v)} stroke={`rgba(${fg},0.10)`} strokeWidth="1" />
            <text x={pad.l - 8} y={ys(v) + 4} textAnchor="end" fontFamily="var(--mono)" fontSize="13" fill={`rgba(${fg},0.5)`}>{fmt(v)}</text>
          </g>
        )}
        {xticks.map(t =>
          <text key={t} x={xs(t)} y={H - pad.b + 18} textAnchor="middle" fontFamily="var(--mono)" fontSize="13" fill={`rgba(${fg},0.5)`}>{t}</text>
        )}
        <text x={(pad.l + W - pad.r) / 2} y={H - 6} textAnchor="middle" fontFamily="var(--mono)" fontSize="13" letterSpacing="0.08em" fill={`rgba(${fg},0.4)`}>YEAR</text>
        {X0 < 2025 && <>
          <line x1={xs(2025)} y1={pad.t - 2} x2={xs(2025)} y2={H - pad.b} stroke={`rgba(${fg},0.32)`} strokeWidth="1" strokeDasharray="3 3" />
          <text x={xs(2025)} y={pad.t - 6} textAnchor="middle" fontFamily="var(--mono)" fontSize="12" letterSpacing="0.1em" fill={`rgba(${fg},0.5)`}>2025</text>
          <path d={seg(X0, 2025)} fill="none" stroke={`rgba(${fg},0.55)`} strokeWidth="2" strokeLinecap="round" />
        </>}
        <path d={seg(2025, X1)} fill="none" stroke={PATH_VARS[activeKey]} strokeWidth="1.5" opacity="0.3" />
        <path d={seg(2025, Math.min(2100, year))} fill="none" stroke={PATH_VARS[activeKey]} strokeWidth="3" strokeLinecap="round" />
        <circle cx={xs(Math.min(2100, year))} cy={ys(curVal)} r="5" fill={PATH_VARS[activeKey]} stroke={dark ? '#0E1A0B' : '#FAF9F3'} strokeWidth="2" />
        {hoverYear != null &&
          <line x1={xs(hoverYear)} y1={pad.t} x2={xs(hoverYear)} y2={H - pad.b} stroke={accent} strokeWidth="1" opacity="0.6" />
        }
        {dom[0] <= 0 && dom[1] >= 0 && (
          <g>
            <line x1={pad.l} y1={ys(0)} x2={W - pad.r} y2={ys(0)} stroke={`rgba(${fg},0.28)`} strokeWidth="1.5" strokeDasharray="4 3" />
            <text x={W - pad.r - 2} y={ys(0) - 5} textAnchor="end" fontFamily="var(--mono)" fontSize="10" fill={`rgba(${fg},0.35)`}>BASELINE</text>
          </g>
        )}
      </svg>
      {(() => {
        const nearZero = cursorY != null && dom[0] <= 0 && dom[1] >= 0 && Math.abs(cursorY - ys(0)) < 12;
        if (nearZero) return (
          <div className="tip" style={{ left: '50%', transform: 'translateX(-50%)', top: 8 }}>
            <div className="tip-year"><span>BASELINE</span><span>1995–2014</span></div>
            <div className="tip-hero"><span className="n">0</span><span className="u">{unit}</span></div>
            <div className="tip-rows">
              <div className="tip-row"><span className="lab">means</span><span className="num">no change from baseline</span></div>
            </div>
          </div>
        );
        return tip ? (
        <div className="tip" style={{
          left: tip.flip ? 'auto' : `calc(${tip.px}% + 14px)`,
          right: tip.flip ? `calc(${100 - tip.px}% + 14px)` : 'auto',
          top: 8,
        }}>
          <div className="tip-year"><span>{hoverYear}</span><span>{tip.hist ? 'OBSERVED' : SSP_NAMES[activeKey]}</span></div>
          <div className="tip-hero"><span className="n">{fmt(tip.val)}</span><span className="u">{unit}</span></div>
          <div className="tip-rows">
            <div className="tip-row"><span className="lab">vs 2025</span><span className="num">{dfmt(tip.val - v2025)} {unit}</span></div>
            <div className="tip-row"><span className="lab">vs 1980</span><span className="num">{dfmt(tip.val - v1980)} {unit}</span></div>
            <div className="tip-row me"><span className="lab">2100 outcome</span><span className="num">{fmt(vEnd)} {unit}</span></div>
          </div>
        </div>
        ) : null;
      })()}
    </div>
  );
}

// ── Multi-scenario line chart (all 3 SSPs at once) ──────────
function MultiLineChart({ metric, dark, dom, unit, fmt, hideTitle = false }) {
  const { useState, useMemo, useRef } = React;
  const W = 960, H = 290, pad = { t: 36, r: 24, b: 48, l: 62 };
  const [hoverYear, setHoverYear] = useState(null);
  const [cursorPos, setCursorPos] = useState(null);
  const containerRef = useRef(null);
  const fg = dark ? '236,230,206' : '42,51,36';
  const X0 = 1980, X1 = 2100, SPAN = 120;
  const xs = y => pad.l + (y - X0) / SPAN * (W - pad.l - pad.r);
  const ys = v => H - pad.b - (v - dom[0]) / (dom[1] - dom[0]) * (H - pad.t - pad.b);
  const SSPS = ['1-2.6', '2-4.5', '5-8.5'];

  const histData = useMemo(() => generateFullCurve(metric, '2-4.5').filter(d => d.year <= 2025), [metric]);
  const histSeg = useMemo(() => {
    let d = '';
    for (const p of histData) d += (d ? ' L ' : 'M ') + xs(p.year).toFixed(1) + ' ' + ys(p.val).toFixed(1);
    return d;
  }, [histData]);

  const projSegs = useMemo(() => SSPS.map(k => {
    const data = generateFullCurve(metric, k);
    let d = '';
    for (const p of data) {
      if (p.year < 2025) continue;
      d += (d ? ' L ' : 'M ') + xs(p.year).toFixed(1) + ' ' + ys(p.val).toFixed(1);
    }
    return d;
  }), [metric]);

  const xticks = [1980, 2000, 2025, 2050, 2075, 2100];
  const yticks = useMemo(() => {
    const out = [];
    for (let i = 0; i <= 4; i++) out.push(dom[0] + i / 4 * (dom[1] - dom[0]));
    return out;
  }, [dom]);

  const valOf = (k, yr) => {
    const data = generateFullCurve(metric, k);
    const pt = data.find(d => d.year === yr);
    return pt ? pt.val : (data[data.length - 1] || {}).val || 0;
  };

  const onMove = (e) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * W;
    const yr = Math.round(X0 + Math.max(0, Math.min(1, (x - pad.l) / (W - pad.l - pad.r))) * SPAN);
    setHoverYear(Math.max(X0, Math.min(X1, yr)));
    if (containerRef.current) {
      const cRect = containerRef.current.getBoundingClientRect();
      setCursorPos({ x: e.clientX - cRect.left, y: e.clientY - cRect.top });
    }
  };

  const SSP_COLORS = { '1-2.6': 'var(--tw-low)', '2-4.5': 'var(--tw-mid)', '5-8.5': 'var(--tw-high)' };
  const SSP_LABELS = { '1-2.6': 'Sustainable', '2-4.5': 'Middle Road', '5-8.5': 'Fossil-Fueled' };

  const metricObj2 = METRICS.find(m => m.id === metric) || {};
  const metricLabel = metricObj2.label || metric;
  const metricChartTitle2 = metricObj2.chartTitle || metricLabel;
  const multiMidY = pad.t + (H - pad.t - pad.b) / 2;

  return (
    <div className="chart-wrap" style={{ position: 'relative' }} ref={containerRef}>
      {!hideTitle && <div className="lc-title">{metricChartTitle2} · all three pathways</div>}
      <svg viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%', height: 'auto' }}
        onMouseMove={onMove} onMouseLeave={() => { setHoverYear(null); setCursorPos(null); }}>
        <text x={11} y={multiMidY} textAnchor="middle" fontFamily="var(--mono)" fontSize="13" fill={`rgba(${fg},0.45)`}
          transform={`rotate(-90, 11, ${multiMidY})`}>{unit}</text>
        {yticks.map((v, i) => (
          <g key={i}>
            <line x1={pad.l} y1={ys(v)} x2={W - pad.r} y2={ys(v)} stroke={`rgba(${fg},0.09)`} strokeWidth="1" />
            <text x={pad.l - 8} y={ys(v) + 4} textAnchor="end" fontFamily="var(--mono)" fontSize="13" fill={`rgba(${fg},0.5)`}>{fmt(v)}</text>
          </g>
        ))}
        {xticks.map(t => (
          <text key={t} x={xs(t)} y={H - pad.b + 20} textAnchor="middle" fontFamily="var(--mono)" fontSize="13" fill={`rgba(${fg},0.5)`}>{t}</text>
        ))}
        <line x1={xs(2025)} y1={pad.t - 4} x2={xs(2025)} y2={H - pad.b} stroke={`rgba(${fg},0.3)`} strokeWidth="1.5" strokeDasharray="4 3" />
        <text x={xs(2025)} y={pad.t - 8} textAnchor="middle" fontFamily="var(--mono)" fontSize="12" letterSpacing="0.1em" fill={`rgba(${fg},0.45)`}>2025</text>
        {/* Historical — grey, single path */}
        <path d={histSeg} fill="none" stroke={`rgba(${fg},0.55)`} strokeWidth="2.5" strokeLinecap="round" />
        {/* Projections — one per SSP */}
        {SSPS.map((k, i) => (
          <path key={k} d={projSegs[i]} fill="none" stroke={SSP_COLORS[k]} strokeWidth="3" strokeLinecap="round" opacity="0.92" />
        ))}
        {/* 2100 endpoint dots */}
        {SSPS.map(k => {
          const v = valOf(k, 2100);
          return <circle key={k} cx={xs(2100)} cy={ys(v)} r="5" fill={SSP_COLORS[k]} stroke={dark ? '#0E1A0B' : '#FAF9F3'} strokeWidth="2" />;
        })}
        {/* Hover crosshair */}
        {hoverYear != null && (
          <line x1={xs(hoverYear)} y1={pad.t} x2={xs(hoverYear)} y2={H - pad.b} stroke={`rgba(${fg},0.35)`} strokeWidth="1.5" />
        )}
        {/* Inline legend — bigger and more readable */}
        {SSPS.map((k, i) => (
          <g key={k} transform={`translate(${W - 200}, ${pad.t + i * 22})`}>
            <rect x="0" y="-7" width="22" height="4" rx="2" fill={SSP_COLORS[k]} />
            <text x="30" y="0" fontFamily="var(--mono)" fontSize="13" fill={`rgba(${fg},0.7)`}>{SSP_LABELS[k]}</text>
          </g>
        ))}
      </svg>
      {/* Hover values tooltip — follows cursor */}
      {hoverYear != null && cursorPos && (() => {
        const TIP_W = 242;
        const containerW = containerRef.current?.offsetWidth || 600;
        const flipLeft = cursorPos.x + TIP_W + 18 > containerW;
        const tipLeft = flipLeft ? cursorPos.x - TIP_W - 8 : cursorPos.x + 16;
        const tipTop = Math.max(8, cursorPos.y - 60);
        return (
          <div style={{ position: 'absolute', top: tipTop, left: tipLeft, background: 'rgba(250,249,247,0.98)', border: '1px solid rgba(42,51,36,0.14)', borderRadius: 10, padding: '10px 16px', pointerEvents: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', color: 'rgba(42,51,36,0.5)', marginBottom: 8 }}>{hoverYear}</div>
            {SSPS.map(k => (
              <div key={k} style={{ display: 'flex', gap: 16, justifyContent: 'space-between', minWidth: 210, marginBottom: 4, alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'rgba(42,51,36,0.55)' }}>{SSP_LABELS[k]}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: SSP_COLORS[k], fontWeight: 600 }}>{fmt(valOf(k, hoverYear))} {unit}</span>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}

// ── Mercury thermometer ─────────────────────────────────────
const THERMO_TIPS = {
  0:   { label: '+0°C', body: 'Pre-industrial baseline. Earth\'s climate in relative equilibrium.' },
  0.5: { label: '+0.5°C', body: 'More frequent heat extremes and heavier rainfall events globally.' },
  1:   { label: '+1°C', body: 'Where we are today. Coral reefs stressed; Arctic sea ice retreating rapidly.' },
  1.5: { label: '+1.5°C', body: 'Paris Agreement target. Ice-free Arctic summers likely. ~10% of species face very high extinction risk.' },
  2:   { label: '+2°C', body: 'Deadly heat waves 3× more frequent. 90% of coral reefs bleached. ~400M more face water scarcity.' },
  2.5: { label: '+2.5°C', body: 'Global crop yields drop 10–20%. Hundreds of millions face food insecurity.' },
  3:   { label: '+3°C', body: 'Beyond any previous human experience. Major ecosystems begin to collapse. 3–10% GDP loss projected.' },
  3.5: { label: '+3.5°C', body: 'Sea level rise accelerates sharply. Large swaths of tropics become uninhabitable.' },
  4:   { label: '+4°C', body: 'Up to 1 billion people displaced. Amazon dieback begins. Near year-round ice-free Arctic.' },
  4.5: { label: '+4.5°C', body: 'Agriculture fails across vast regions. Existential stress on global civilization.' },
  5:   { label: '+5°C', body: 'Earth last this warm 50+ million years ago. Mass extinction event underway. No modern precedent.' },
};

function Thermometer({ value, dark }) {
  const { useState, useRef } = React;
  const [tipDeg, setTipDeg] = useState(null);
  const [tipPos, setTipPos] = useState({ x: 0, y: 0 });
  const wrapRef = useRef(null);

  const W = 200, H = 380, TMAX = 5.5;
  const cx = 105, tubeW = 30, innerW = 15;
  const tt = 24, bulbCy = 330, bulbR = 30;
  const scaleTop = tt + 16, scaleBot = bulbCy - 10;
  const yFor = (t) => scaleBot - Math.max(0, Math.min(1, t / TMAX)) * (scaleBot - scaleTop);
  const mercY = yFor(value);
  const fg = dark ? '236,230,206' : '42,51,36';
  const red = value < 1.5 ? '#5C9468' : value < 2 ? '#C9923E' : value < 3 ? '#E0773C' : '#D33C28';
  const glass = dark ? 'rgba(248,246,236,0.93)' : 'rgba(255,255,255,0.96)';
  const outline = `rgba(${fg},0.38)`;
  const MARKS = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

  const onSvgMove = (e) => {
    const svg = e.currentTarget;
    const svgRect = svg.getBoundingClientRect();
    const svgY = ((e.clientY - svgRect.top) / svgRect.height) * H;
    const svgX = ((e.clientX - svgRect.left) / svgRect.width) * W;
    if (svgX > cx + tubeW / 2 - 10) {
      let closest = null, minDist = Infinity;
      for (const t of MARKS) {
        const dist = Math.abs(svgY - yFor(t));
        if (dist < minDist) { minDist = dist; closest = t; }
      }
      if (minDist < 18) {
        const wrap = wrapRef.current;
        if (wrap) {
          const wrapRect = wrap.getBoundingClientRect();
          setTipPos({ x: e.clientX - wrapRect.left, y: e.clientY - wrapRect.top });
        }
        setTipDeg(closest);
        return;
      }
    }
    setTipDeg(null);
  };

  const tip = tipDeg !== null ? THERMO_TIPS[tipDeg] : null;

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto"
        onMouseMove={onSvgMove} onMouseLeave={() => setTipDeg(null)} style={{ display: 'block' }}>
        <rect x={cx - tubeW / 2} y={tt} width={tubeW} height={bulbCy - tt + 6} rx={tubeW / 2} fill={glass} stroke={outline} strokeWidth="2" />
        <circle cx={cx} cy={bulbCy} r={bulbR} fill={glass} stroke={outline} strokeWidth="2" />
        <circle cx={cx} cy={bulbCy} r={bulbR - 5} fill={red} />
        <rect x={cx - innerW / 2} y={mercY} width={innerW} height={bulbCy - mercY} fill={red} rx={innerW / 2} />
        <circle cx={cx} cy={mercY} r={innerW / 2 + 1} fill={red} />
        <rect x={cx - tubeW / 2 + 5} y={tt + 8} width="4" height={bulbCy - tt - 34} rx="2" fill="rgba(255,255,255,0.5)" />
        {MARKS.map(t => {
          const major = Number.isInteger(t);
          const isActive = tipDeg === t;
          return <g key={t}>
            <line x1={cx + tubeW / 2 + 2} y1={yFor(t)} x2={cx + tubeW / 2 + (major ? 12 : 7)} y2={yFor(t)}
              stroke={isActive ? red : `rgba(${fg},0.5)`} strokeWidth={isActive ? 2 : 1} />
            {major && <text x={cx + tubeW / 2 + 17} y={yFor(t) + 5} fontFamily="var(--mono)" fontSize="15"
              fill={isActive ? red : `rgba(${fg},0.6)`} fontWeight={isActive ? 'bold' : 'normal'}>{t}°</text>}
          </g>;
        })}
        <line x1={cx - tubeW / 2 - 14} y1={mercY} x2={cx - tubeW / 2 - 2} y2={mercY} stroke={red} strokeWidth="2" />
        <text x={cx - tubeW / 2 - 18} y={mercY + 4} textAnchor="end" fontFamily="var(--mono)" fontSize="15" fill={red}>{value >= 0 ? '+' : ''}{value.toFixed(1)}°</text>
      </svg>
      {tip && (
        <div style={{
          position: 'absolute',
          left: Math.min(tipPos.x + 14, (wrapRef.current?.offsetWidth || 300) - 210),
          top: tipPos.y - 44,
          background: dark ? 'rgba(20,22,18,0.96)' : 'rgba(251,247,236,0.97)',
          border: `1px solid rgba(${fg},0.18)`,
          borderRadius: 8,
          padding: '8px 12px',
          pointerEvents: 'none',
          boxShadow: '0 3px 14px rgba(42,51,36,0.16)',
          minWidth: 190,
          maxWidth: 200,
          zIndex: 20,
        }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: red, marginBottom: 4 }}>{tip.label}</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: `rgba(${fg},0.75)`, lineHeight: 1.55 }}>{tip.body}</div>
        </div>
      )}
    </div>
  );
}

// ── Warming stripes (Ed Hawkins motif) ──────────────────────
function WarmingStripes({ sspKey, year, dark }) {
  const { useMemo } = React;
  const data = useMemo(() => generateFullCurve('temp', sspKey), [sspKey]);
  const fg = dark ? '236,230,206' : '42,51,36';
  const W = 660, H = 64;
  const bw = data.length ? W / data.length : 1;
  const colFor = (v) => {
    const t = Math.max(0, Math.min(1, (v - 0.0) / 5.5));
    const r = Math.round(lerp(58, 215, t)), g = Math.round(lerp(150, 58, t)), b = Math.round(lerp(213, 40, t));
    return `rgb(${r},${g},${b})`;
  };
  return (
    <svg viewBox={`0 0 ${W} ${H + 18}`} width="100%" height="auto">
      {data.map((d, i) =>
        <rect key={i} x={i * bw} y={0} width={bw + 0.6} height={H} fill={colFor(d.val)} opacity={d.year <= year ? 1 : 0.18} />
      )}
      <line x1={(Math.min(2100, year) - 1980) / 120 * W} y1={0} x2={(Math.min(2100, year) - 1980) / 120 * W} y2={H} stroke={dark ? '#fff' : '#0E1A0B'} strokeWidth="1.5" opacity="0.8" />
      {[1980, 2000, 2025, 2050, 2075, 2100].map(t =>
        <text key={t} x={Math.min(W - 14, Math.max(14, (t - 1980) / 120 * W))} y={H + 14} textAnchor="middle" fontFamily="var(--mono)" fontSize="9" fill={`rgba(${fg},0.55)`}>{t}</text>
      )}
    </svg>
  );
}

// ── Sea level cross-section ─────────────────────────────────
function SeaLevel({ value, year, dark, tempValue = 1.2 }) {
  const { useState, useRef } = React;
  const [showWaterTip, setShowWaterTip] = useState(false);
  const [tipPos, setTipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const w = 430, h = 320;
  const fg = '42,51,36';
  const soft = `rgba(${fg},0.6)`, faint = `rgba(${fg},0.42)`;
  const bg = '#FAF9F3';
  // Water starts as clear blue, gets murky brown as temperature rises
  const waterT = Math.min(1, tempValue / 5);
  const waterR = Math.round(lerp(55, 110, waterT));
  const waterG = Math.round(lerp(110, 88, waterT));
  const waterB = Math.round(lerp(175, 70, waterT));
  const water = `rgb(${waterR},${waterG},${waterB})`;
  const baselineY = h - 44;
  const seaY = baselineY - Math.min(value, 200) * 1.1;

  const onWaterMove = (e) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setTipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setShowWaterTip(true);
  };
  const SST_ANOMALY = (tempValue * 0.72).toFixed(1); // ocean warms ~72% of land warming rate

  return (
    <div style={{ position: 'relative', width: '100%' }} ref={containerRef}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="auto">
        <defs>
          <linearGradient id="seaG2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={water} stopOpacity="0.78" />
            <stop offset="1" stopColor={water} stopOpacity="0.96" />
          </linearGradient>
        </defs>
        {[0, 50, 100, 150, 200].map(cm => {
          const y = baselineY - cm * 1.1;
          return <g key={cm}>
            <line x1="350" y1={y} x2="370" y2={y} stroke={faint} strokeWidth="1" />
            <text x="376" y={y + 3} fontFamily="var(--mono)" fontSize="11" letterSpacing="0.08em" fill={soft}>{cm}cm</text>
          </g>;
        })}
        <path d={`M 0 ${baselineY} L 60 ${baselineY} L 80 ${baselineY - 4} L 140 ${baselineY - 4} L 170 ${baselineY - 30} L 230 ${baselineY - 30} L 250 ${baselineY - 12} L 340 ${baselineY - 12} L 340 ${h} L 0 ${h} Z`} fill={`rgba(${fg},0.16)`} />
        <g transform={`translate(190 ${baselineY - 30})`}>
          <path d="M -6 0 L 6 0 L 4 -52 L -4 -52 Z" fill={`rgba(${fg},0.85)`} />
          <rect x="-7" y="-58" width="14" height="6" fill={`rgba(${fg},0.85)`} />
          <circle cx="0" cy="-66" r="4" fill="#E0773C" />
        </g>
        <g transform={`translate(80 ${baselineY - 4})`}>
          <rect x="0" y="-44" width="22" height="44" fill={`rgba(${fg},0.82)`} />
          {[[4,-38],[14,-38],[4,-26],[14,-26],[4,-14],[14,-14]].map(([ox,oy],k) => <rect key={k} x={ox} y={oy} width="4" height="4" fill={bg} />)}
        </g>
        <g transform={`translate(110 ${baselineY - 4})`}>
          <rect x="0" y="-28" width="18" height="28" fill={`rgba(${fg},0.72)`} />
          {[[3,-22],[12,-22],[3,-10],[12,-10]].map(([ox,oy],k) => <rect key={k} x={ox} y={oy} width="3" height="4" fill={bg} />)}
        </g>
        <g transform={`translate(260 ${baselineY - 12})`}>
          <rect x="0" y="-32" width="20" height="32" fill={`rgba(${fg},0.82)`} />
          {[[3,-26],[13,-26],[3,-14],[13,-14]].map(([ox,oy],k) => <rect key={k} x={ox} y={oy} width="4" height="4" fill={bg} />)}
        </g>
        {/* visible 2025 baseline */}
        <line x1="0" y1={baselineY} x2="340" y2={baselineY} stroke="#E08D5C" strokeWidth="2" opacity="0.85" strokeDasharray="5 3" />
        <rect x="0" y={baselineY - 16} width="88" height="14" rx="3" fill="#E08D5C" opacity="0.85" />
        <text x="6" y={baselineY - 4} fontFamily="var(--mono)" fontSize="10" letterSpacing="0.10em" fill="#fff">2025 BASELINE</text>
        {/* interactive water area */}
        <rect x="0" y={seaY} width="340" height={h - seaY} fill="url(#seaG2)"
          onMouseMove={onWaterMove} onMouseLeave={() => setShowWaterTip(false)} style={{ cursor: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='30' viewBox='0 0 18 30'%3E%3Crect x='7' y='2' width='4' height='20' rx='2' fill='white' stroke='rgba(0,0,0,0.6)' stroke-width='1.5'/%3E%3Crect x='8.5' y='12' width='1' height='10' fill='%23E0773C'/%3E%3Ccircle cx='9' cy='25' r='5' fill='%23E0773C' stroke='rgba(0,0,0,0.5)' stroke-width='1.5'/%3E%3C/svg%3E") 9 25, crosshair` }} />
        <path d={`M 0 ${seaY} Q 20 ${seaY - 3} 40 ${seaY} T 80 ${seaY} T 120 ${seaY} T 160 ${seaY} T 200 ${seaY} T 240 ${seaY} T 280 ${seaY} T 320 ${seaY} L 340 ${seaY}`} stroke="#fff" strokeWidth="0.8" fill="none" opacity="0.45" style={{ pointerEvents: 'none' }} />
        <text x="6" y="22" fontFamily="var(--mono)" fontSize="12" letterSpacing="0.16em" fill={soft}>{year} · CUMULATIVE RISE</text>
        <text x="6" y="56" fontFamily="var(--serif)" fontSize="36" fill="#0E1A0B">+{Math.round(value)}<tspan fontFamily="var(--mono)" fontSize="14" fill={soft}> cm</tspan></text>
        {/* thermometer sst indicator */}
        <text x="6" y="76" fontFamily="var(--mono)" fontSize="11" letterSpacing="0.1em" fill={`rgba(${fg},0.5)`}>OCEAN SURFACE: +{SST_ANOMALY}°C VS 1980</text>
      </svg>
      {showWaterTip && (
        <div className="sea-water-tip" style={{ left: tipPos.x, top: tipPos.y }}>
          <div className="tip-year"><span>OCEAN CONDITIONS</span><span>{year}</span></div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 700, margin: '4px 0 2px' }}>+{SST_ANOMALY}°C</div>
          <div style={{ fontSize: 10, opacity: 0.6, fontFamily: 'var(--mono)', letterSpacing: '0.06em' }}>SEA SURFACE TEMPERATURE ANOMALY</div>
          <div style={{ borderTop: '1px solid rgba(42,51,36,0.12)', marginTop: 8, paddingTop: 8, fontSize: 10, fontFamily: 'var(--mono)', opacity: 0.55 }}>
            Oceans absorb ~90% of excess heat.<br />
            Warmer water expands, adding to rise.<br />
            Rise: +{Math.round(value)} cm above 2025.
          </div>
        </div>
      )}
    </div>
  );
}

// ── Arctic sea-ice disc ─────────────────────────────────────
// MAX_HIST_ICE: approximate NH September extent at 1979 start of satellite record (~7.5 M km²).
// Used to scale the disc radius — raw CMIP6 siconc data drives the number, not a formula.
const MAX_HIST_ICE = 7.5;
function IceCaps({ sspKey, year = 2025, dark }) {
  const fg = '42,51,36';
  const soft = `rgba(${fg},0.62)`;
  const W = 300, H = 330, CX = 150, CY = 122, MAX_R = 94;
  const rawExtent = valAt('ice', sspKey, year);
  const extentMk = Math.max(0.1, rawExtent).toFixed(1);
  const iceExtent = Math.max(0.04, Math.sqrt(rawExtent / MAX_HIST_ICE));
  const ANG = Array.from({ length: 24 }, (_, i) => ({ a: i / 24 * Math.PI * 2, w: 1 + 0.08 * Math.sin(i * 3.7) + 0.05 * Math.cos(i * 5.2) }));
  const poly = (sc) => ANG.map(({ a, w }) => `${(CX + Math.cos(a) * MAX_R * iceExtent * w * sc).toFixed(1)},${(CY + Math.sin(a) * MAX_R * iceExtent * w * sc).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto">
      <text x={CX} y="17" textAnchor="middle" fontFamily="var(--mono)" fontSize="12" letterSpacing="0.14em" fill={soft}>ARCTIC SEA-ICE MINIMUM</text>
      <circle cx={CX} cy={CY} r={MAX_R} fill="#12304A" />
      {[1/3, 2/3, 1].map((f, i) => <circle key={i} cx={CX} cy={CY} r={MAX_R * f} fill="none" stroke="rgba(218,234,245,0.45)" strokeWidth="0.6" strokeDasharray="3 4" opacity="0.5" />)}
      <polygon points={poly(1)} fill="#DAEAF5" opacity="0.94" />
      <polygon points={poly(0.6)} fill="#fff" opacity="0.45" />
      <circle cx={CX} cy={CY} r={MAX_R} fill="none" stroke="rgba(218,234,245,0.4)" strokeWidth="1.5" />
      <circle cx={CX} cy={CY} r="3" fill="rgba(218,234,245,0.6)" />
      <text x={CX} y="264" textAnchor="middle" fontFamily="var(--serif)" fontSize="46" fill="#0E1A0B">{extentMk}</text>
      <text x={CX} y="287" textAnchor="middle" fontFamily="var(--mono)" fontSize="12" letterSpacing="0.08em" fill={soft}>MILLION KM²</text>
      <text x={CX} y="312" textAnchor="middle" fontFamily="var(--mono)" fontSize="11" fill={soft} opacity="0.75">{year}</text>
    </svg>
  );
}

// ── Grass field (precip / heat stress) ─────────────────────
function GrassField({ tempValue = 1.2 }) {
  const { useMemo, useState } = React;
  const [hovering, setHovering] = useState(false);
  const W = 660, H = 230, baseY = H - 30;
  const dry = Math.max(0, Math.min(0.96, tempValue / 5.0));
  const fg = '42,51,36';
  const stressLabel = dry < 0.2 ? 'NONE' : dry < 0.4 ? 'LOW' : dry < 0.6 ? 'MODERATE' : dry < 0.8 ? 'SEVERE' : 'EXTREME';
  const stressColor = dry < 0.2 ? '#4E7558' : dry < 0.4 ? '#7A9B4A' : dry < 0.6 ? '#C9923E' : dry < 0.8 ? '#D05E2A' : '#B83020';
  const mix = (a, b, t) => `rgb(${Math.round(lerp(a[0],b[0],t))},${Math.round(lerp(a[1],b[1],t))},${Math.round(lerp(a[2],b[2],t))})`;
  const soil = mix([74,86,48], [156,131,80], dry);
  const blades = useMemo(() => {
    let seed = 99;
    const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    const N = 150, out = [];
    for (let i = 0; i < N; i++) {
      const x = (i + 0.5) / N * W + (rnd() - 0.5) * 5;
      const localDry = Math.max(0, Math.min(1, dry + (rnd() - 0.5) * 0.5));
      const ht = lerp(74, 40, localDry) * (0.7 + rnd() * 0.5);
      const sway = rnd() - 0.5;
      const droop = localDry * 34 * (sway >= 0 ? 1 : -1) + sway * 8;
      const tipX = x + droop, tipY = baseY - ht + localDry * 10;
      const cpX = x + droop * 0.5 + (rnd() - 0.5) * 6, cpY = baseY - ht * 0.55;
      const col = mix([92,143,58], [150,104,46], localDry);
      out.push({ x, tipX, tipY, cpX, cpY, col, wdt: lerp(2.6, 1.8, localDry), z: rnd() });
    }
    out.sort((a, b) => a.z - b.z);
    return out;
  }, [dry]);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto"
        onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}
        style={{ cursor: 'help' }}>
        <rect x="0" y={baseY} width={W} height={H - baseY} fill={soil} />
        <rect x="0" y={baseY} width={W} height="3" fill={`rgba(${fg},0.12)`} />
        {blades.map((b, i) =>
          <path key={i} d={`M ${b.x.toFixed(1)} ${baseY} Q ${b.cpX.toFixed(1)} ${b.cpY.toFixed(1)} ${b.tipX.toFixed(1)} ${b.tipY.toFixed(1)}`} stroke={b.col} strokeWidth={b.wdt.toFixed(1)} fill="none" strokeLinecap="round" />
        )}
        <text x="6" y="20" fontFamily="var(--mono)" fontSize="13" letterSpacing="0.14em" fill={`rgba(${fg},0.55)`}>VEGETATION HEALTH</text>
        <text x="6" y="37" fontFamily="var(--mono)" fontSize="12" letterSpacing="0.08em" fill={stressColor}>HEAT STRESS: {stressLabel} · {Math.round((1 - dry) * 100)}% HEALTHY COVER</text>
        {/* stress bar */}
        <rect x="6" y="46" width="120" height="4" rx="2" fill={`rgba(${fg},0.1)`} />
        <rect x="6" y="46" width={Math.round(dry * 120)} height="4" rx="2" fill={stressColor} />
      </svg>
      {hovering && (
        <div className="grass-tip">
          <div className="tip-year"><span>VEGETATION HEAT STRESS</span></div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 700, margin: '4px 0 2px', color: stressColor }}>{stressLabel} STRESS</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, opacity: 0.65, margin: '4px 0 8px', letterSpacing: '0.06em' }}>+{tempValue.toFixed(1)}°C surface anomaly</div>
          <div style={{ borderTop: '1px solid rgba(42,51,36,0.12)', paddingTop: 8, fontSize: 11, lineHeight: 1.6, opacity: 0.8 }}>
            As temperatures rise, soil moisture drops and vegetation wilts. Each blade represents local variability.
          </div>
        </div>
      )}
    </div>
  );
}

// ── Biome precipitation anomaly chart ───────────────────────
function BiomePrecipChart({ sspKey = '5-8.5', year = 2025, selectedBiome = null, onBiomeSelect }) {
  const { useState, useEffect, useMemo } = React;
  const [biomeData, setBiomeData] = useState(null);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    fetch('data/biome_precip.json')
      .then(r => r.json())
      .then(d => setBiomeData(d))
      .catch(() => {});
  }, []);

  const SSP_MAP = { '1-2.6': 'ssp126', '2-4.5': 'ssp245', '5-8.5': 'ssp585' };
  const ssp = SSP_MAP[sspKey] || 'ssp585';
  const bars = useMemo(() => {
    if (!biomeData) return [];
    return Object.values(biomeData.biomes).map(b => {
      const records = b.scenarios[ssp] || [];
      // 10-year trailing mean ending at current year — removes interannual noise
      const window = records.filter(r => r.year > year - 10 && r.year <= year);
      const anomaly = window.length
        ? window.reduce((s, r) => s + r.anomaly, 0) / window.length
        : (records.find(r => r.year === year) || records[records.length - 1] || { anomaly: 0 }).anomaly;
      return { name: b.name, anomaly };
    });
  }, [biomeData, ssp, year]);

  // Abbreviated labels
  const abbrev = name => ({
    'Tropical Forest': 'TROPICAL 🌴', 'Savanna': 'SAVANNA 🦓', 'Desert': 'DESERT 🏜️',
    'Mediterranean': 'MEDITERR. 🫒', 'Temperate Forest': 'TEMPERATE 🌲',
    'Steppe / Grassland': 'STEPPE 🌾', 'Boreal / Taiga': 'BOREAL 🐺', 'Tundra & Arctic': 'TUNDRA ❄️',
  }[name] || name.toUpperCase().slice(0, 8));

  // Chart geometry — dynamic scale for % data
  const ML = 76, MR = 10, MT = 32, MB = 80;
  const W = 500, H = 240;
  const cW = W - ML - MR, cH = H - MT - MB;
  const maxAbs = 50;
  const zeroY = MT + cH * 0.5;
  const toY = v => MT + cH * (1 - (v + maxAbs) / (2 * maxAbs));
  const bW = Math.floor(cW / Math.max(bars.length, 1));
  const barW = bW - 6;

  if (!biomeData) return (
    <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(42,51,36,0.4)' }}>
      Loading…
    </div>
  );

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto" style={{ display: 'block' }}>
        {/* Chart title */}
        <text x={ML + cW / 2} y={17} textAnchor="middle"
              fontFamily="var(--mono)" fontSize="9" letterSpacing="0.08em"
              fill="rgba(42,51,36,0.65)">
          PRECIPITATION ANOMALY · BY BIOME
        </text>
        {/* Y-axis label — inside SVG for exact scaling */}
        <text x={22} y={MT + cH / 2} textAnchor="middle" dominantBaseline="central"
              transform={`rotate(-90, 22, ${MT + cH / 2})`}
              fontFamily="var(--mono)" fontSize="9" letterSpacing="0.1em"
              fill="rgba(42,51,36,0.65)">
          % CHANGE
        </text>
        {/* Grid lines — fixed ticks at ±25% and ±50% */}
        {[maxAbs * 0.5, maxAbs * -0.5].map(v => (
          <line key={v} x1={ML} y1={toY(v)} x2={W - MR} y2={toY(v)}
                stroke="rgba(42,51,36,0.07)" strokeWidth="1" />
        ))}
        {/* Y-axis tick labels */}
        {[-maxAbs, -maxAbs * 0.5, 0, maxAbs * 0.5, maxAbs].map(v => (
          <text key={v} x={ML - 4} y={toY(v) + 3} textAnchor="end"
                fontFamily="var(--mono)" fontSize="8" fill="rgba(42,51,36,0.38)">
            {v > 0 ? '+' : ''}{Math.round(v)}%
          </text>
        ))}
        {/* Zero line */}
        <line x1={ML} y1={zeroY} x2={W - MR} y2={zeroY}
              stroke="#C0584A" strokeWidth="1.5" />

        {/* Bars */}
        {bars.map((b, i) => {
          const bx = ML + i * bW + (bW - barW) / 2;
          const isSel = selectedBiome === b.name;
          const isHov = hovered === b.name;
          const isActive = isSel || (!selectedBiome && !isHov);
          const dimmed = selectedBiome && !isSel && !isHov;
          const pos = b.anomaly >= 0;
          const barCol = pos ? '#2B6CB0' : '#B4542F';
          const y1 = pos ? toY(b.anomaly) : zeroY;
          const barH = Math.abs(toY(b.anomaly) - zeroY);
          return (
            <g key={b.name} style={{ cursor: 'pointer' }}
               onClick={() => onBiomeSelect(isSel ? null : b.name, b.anomaly)}
               onMouseEnter={() => setHovered(b.name)}
               onMouseLeave={() => setHovered(null)}>
              <rect x={bx} y={y1} width={barW} height={Math.max(barH, 1)}
                    fill={barCol}
                    opacity={dimmed ? 0.22 : isHov ? 1 : isSel ? 0.95 : 0.72}
                    rx="2" />
              {(isSel || isHov) && (
                <rect x={bx - 1} y={Math.min(y1, zeroY) - 1}
                      width={barW + 2} height={barH + 2}
                      fill="none" stroke={barCol} strokeWidth="1.5" rx="3" opacity="0.9" />
              )}
              {/* X label */}
              <text
                x={bx + barW / 2} y={H - MB + 10}
                textAnchor="end"
                fontFamily="var(--mono)" fontSize="7.5"
                fill={dimmed ? 'rgba(42,51,36,0.25)' : isSel ? '#2A3324' : 'rgba(42,51,36,0.55)'}
                transform={`rotate(-55, ${bx + barW / 2}, ${H - MB + 10})`}>
                {abbrev(b.name)}
              </text>
              {/* Value label on bar */}
              {(isHov || isSel) && (
                <text x={bx + barW / 2} y={pos ? y1 - 4 : y1 + barH + 11}
                      textAnchor="middle" fontFamily="var(--mono)" fontSize="8"
                      fill={barCol} fontWeight="600">
                  {b.anomaly > 0 ? '+' : ''}{b.anomaly.toFixed(1)}%
                </text>
              )}
            </g>
          );
        })}

        {/* Wetter / Drier labels */}
        <text x={W - MR} y={MT - 5} textAnchor="end"
              fontFamily="var(--mono)" fontSize="7.5" fill="#2B6CB0" opacity="0.7">▲ WETTER</text>
        <text x={W - MR} y={H - MB - 4} textAnchor="end"
              fontFamily="var(--mono)" fontSize="7.5" fill="#B4542F" opacity="0.7">▼ DRIER</text>

        {/* Tooltip */}
        {hovered && (() => {
          const b = bars.find(x => x.name === hovered);
          if (!b) return null;
          const i = bars.indexOf(b);
          const bx = ML + i * bW + (bW - barW) / 2;
          const tx = Math.min(bx + barW / 2, W - 130);
          const ty = b.anomaly >= 0 ? toY(b.anomaly) - 38 : toY(b.anomaly) + 18;
          return (
            <g>
              <rect x={tx} y={ty} width={124} height={44} rx="6"
                    fill="rgba(251,247,236,0.97)" stroke="rgba(42,51,36,0.14)" strokeWidth="1" />
              <text x={tx + 8} y={ty + 14} fontFamily="var(--mono)" fontSize="8"
                    fill="rgba(42,51,36,0.55)">{b.name.toUpperCase()}</text>
              <text x={tx + 8} y={ty + 30} fontFamily="var(--mono)" fontSize="10"
                    fontWeight="700" fill={b.anomaly >= 0 ? '#4E7558' : '#B4542F'}>
                {b.anomaly > 0 ? '+' : ''}{b.anomaly.toFixed(1)}% change
              </text>
            </g>
          );
        })()}

      </svg>
    </div>
  );
}

// ── Old gauge (kept for reference, replaced above) ───────────
function SoilMoisture({ droughtPct = 22, mrsoAnom = 0 }) {
  const { useMemo, useState } = React;

  // Map droughtPct [22, 34] → moisture [80, 26]
  const moisture = Math.max(0, Math.min(100, 80 - ((droughtPct - 22) / 12) * 54));
  const dry = 1 - moisture / 100;
  const m   = moisture / 100;

  // Gauge geometry — hub at (cx, cy), arc radius R
  const cx = 180, cy = 122, R = 42;
  const pt = (v, rad) => {
    const phi = Math.PI - v * Math.PI; // v=0 → left (WET), v=1 → right (DRY)
    return [cx + rad * Math.cos(phi), cy - rad * Math.sin(phi)];
  };
  const zonePath = (a, b, rad) => {
    const [x1, y1] = pt(a, rad), [x2, y2] = pt(b, rad);
    return `M${x1.toFixed(2)} ${y1.toFixed(2)} A${rad} ${rad} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  };

  // Needle: low moisture → swing right toward DRY
  const [nx, ny] = pt(1 - m, R - 9);

  const lerpC = (a, b, t) => {
    const h = s => [0, 2, 4].map(i => parseInt(s.slice(1 + i, 3 + i), 16));
    const [pa, pb] = [h(a), h(b)];
    return `rgb(${pa.map((x, i) => Math.round(x + (pb[i] - x) * t)).join(',')})`;
  };
  const soilCol  = lerpC('#5C462C', '#AE926A', dry);
  const dryColor = dry > 0.6 ? '#B83020' : dry > 0.3 ? '#D05E2A' : '#C9923E';
  const zone     = moisture > 65 ? 'WET' : moisture > 35 ? 'MOIST' : 'DRY';
  const zoneCol  = moisture > 65 ? '#7E9C72' : moisture > 35 ? '#C49B5E' : '#B4542F';

  // Tick marks around the arc
  const ticks = useMemo(() => {
    const out = [];
    for (let i = 0; i <= 10; i++) {
      const phi = Math.PI - (i / 10) * Math.PI;
      out.push({
        x1: (cx + (R - 8) * Math.cos(phi)).toFixed(2), y1: (cy - (R - 8) * Math.sin(phi)).toFixed(2),
        x2: (cx + (R - 1) * Math.cos(phi)).toFixed(2), y2: (cy - (R - 1) * Math.sin(phi)).toFixed(2),
        major: i % 5 === 0,
      });
    }
    return out;
  }, []);

  // Branching soil cracks — appear past ~45% dry
  const cracks = useMemo(() => {
    if (dry <= 0.45) return [];
    let seed = 99;
    const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    const n = Math.round((dry - 0.45) * 12) + 2;
    const paths = [];
    for (let i = 0; i < n; i++) {
      const sx = 28 + rnd() * 304, sy = 217 + rnd() * 17;
      const mainLen = 18 + rnd() * 28, mainAngle = (rnd() - 0.5) * 0.55;
      let mx = sx, my = sy;
      const nSegs = 3 + Math.floor(rnd() * 2), segLen = mainLen / nSegs;
      let d = `M ${sx.toFixed(1)} ${sy.toFixed(1)}`;
      let brX = mx, brY = my;
      for (let j = 0; j < nSegs; j++) {
        mx += Math.sin(mainAngle + (rnd() - 0.5) * 0.3) * segLen;
        my += Math.cos(mainAngle) * segLen * 0.18;
        d += ` L ${mx.toFixed(1)} ${my.toFixed(1)}`;
        if (j === Math.floor(nSegs / 2)) { brX = mx; brY = my; }
      }
      paths.push({ d, w: 1.1 });
      // Y-branch off mid-point
      if (rnd() > 0.3) {
        const brAngle = mainAngle + (rnd() > 0.5 ? 1 : -1) * (0.55 + rnd() * 0.65);
        const bl = 8 + rnd() * 14;
        let bx = brX, by = brY;
        let bd = `M ${bx.toFixed(1)} ${by.toFixed(1)}`;
        const nb = 2 + Math.floor(rnd() * 2);
        for (let j = 0; j < nb; j++) {
          bx += Math.sin(brAngle + (rnd() - 0.5) * 0.28) * (bl / nb);
          by += Math.cos(brAngle) * (bl / nb) * 0.16;
          bd += ` L ${bx.toFixed(1)} ${by.toFixed(1)}`;
        }
        paths.push({ d: bd, w: 0.65 });
      }
    }
    return paths;
  }, [dry]);
  const crackOpacity = Math.max(0, (dry - 0.45) * 1.5);

  // Grass blades rooted at soil surface — droop + shorten as drought worsens
  const lean = dry * 26;
  const bladeRoots = [130, 143, 155, 165, 176, 188, 199, 211, 223];
  const blades = bladeRoots.map((bx, i) => {
    const lDry = Math.max(0, Math.min(1, dry + ((i % 3) - 1) * 0.12));
    const ht   = lerp(30, 13, lDry) * (i % 2 === 0 ? 1.15 : 0.88);
    const sway = ((i % 5) - 2) * 4 + lean * 0.85;
    return {
      bx, col: lerpC('#4E7A33', '#A89A4C', lDry),
      tipX: (bx + sway).toFixed(1),
      tipY: (215 - ht).toFixed(1),
      cpX:  (bx + sway * 0.42).toFixed(1),
      cpY:  (215 - ht * 0.56).toFixed(1),
      w:    lerp(2.0, 1.3, lDry).toFixed(1),
    };
  });

  const [gaugeHover, setGaugeHover] = useState(false);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg viewBox="0 0 360 248" width="100%" height="auto">

        {/* SOIL MOISTURE title — centered above the teardrop */}
        <text x={cx} y="17" textAnchor="middle"
              fontFamily="var(--mono)" fontSize="9" letterSpacing="2"
              fill="rgba(42,51,36,0.48)">SOIL MOISTURE</text>

        {/* Probe shaft */}
        <rect x="175" y="210" width="10" height="28" rx="2.5" fill="#3E5236" opacity="0.9" />

        {/* Soil strip */}
        <rect x="16" y="215" width="328" height="30" rx="4" fill={soilCol} />

        {/* Branching cracks */}
        {cracks.map((c, i) => (
          <path key={i} d={c.d} fill="none" stroke="rgba(32,20,8,0.7)"
                strokeWidth={c.w} opacity={crackOpacity} strokeLinecap="round" />
        ))}

        {/* Grass blades growing from soil surface */}
        {blades.map((b, i) => (
          <path key={i}
                d={`M ${b.bx} 216 Q ${b.cpX} ${b.cpY} ${b.tipX} ${b.tipY}`}
                stroke={b.col} strokeWidth={b.w} fill="none" strokeLinecap="round" opacity="0.88" />
        ))}

        {/* Meter body — teardrop */}
        <path d="M180 30 C 138 30 104 66 104 104 C 104 146 150 184 180 214
                 C 210 184 256 146 256 104 C 256 66 222 30 180 30 Z"
              fill="#587049" stroke="#3E5236" strokeWidth="2" />

        {/* Dial face */}
        <circle cx={cx} cy={cy - 18} r="56" fill="#FBF7EC" stroke="#3E5236" strokeWidth="1.5" />

        {/* Zone arcs: WET · MOIST · DRY */}
        <path d={zonePath(0.02, 0.32, R)} fill="none" stroke="#7E9C72" strokeWidth="11" strokeLinecap="butt" />
        <path d={zonePath(0.35, 0.65, R)} fill="none" stroke="#C49B5E" strokeWidth="11" strokeLinecap="butt" />
        <path d={zonePath(0.68, 0.98, R)} fill="none" stroke="#B4542F" strokeWidth="11" strokeLinecap="butt" />

        {/* Ticks */}
        {ticks.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                stroke="rgba(42,51,36,0.35)" strokeWidth={t.major ? 1.5 : 0.8} />
        ))}

        {/* Scale labels */}
        <text x={cx - R - 4} y={cy + 14} textAnchor="start"
              fontFamily="var(--mono)" fontSize="8.5" fill="#7E9C72">WET</text>
        <text x={cx} y={cy - R - 7} textAnchor="middle"
              fontFamily="var(--mono)" fontSize="8.5" fill="#C49B5E">MOIST</text>
        <text x={cx + R + 4} y={cy + 14} textAnchor="end"
              fontFamily="var(--mono)" fontSize="8.5" fill="#B4542F">DRY</text>

        {/* Needle — dark base + thin rust overlay */}
        <line x1={cx} y1={cy} x2={nx.toFixed(2)} y2={ny.toFixed(2)}
              stroke="#2A3324" strokeWidth="3" strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={nx.toFixed(2)} y2={ny.toFixed(2)}
              stroke="#B4542F" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="4.5" fill="#2A3324" />

        {/* Soil moisture chip — upper-left whitespace beside teardrop */}
        <rect x="8" y="32" width="90" height="52" rx="8"
              fill="white" fillOpacity="0.93" stroke="rgba(42,51,36,0.13)" strokeWidth="1" />
        <text x="16" y="47" fontFamily="var(--mono)" fontSize="7.5" letterSpacing="1.2"
              fill="rgba(56,66,50,0.62)">SOIL MOISTURE</text>
        <text x="16" y="74" fontFamily="'Bricolage Grotesque', system-ui, sans-serif"
              fontSize="26" fontWeight="700" letterSpacing="-0.02em" fill={dryColor}>{moisture.toFixed(0)}</text>
        <text x={moisture >= 100 ? 56 : moisture >= 10 ? 46 : 36} y="74"
              fontFamily="var(--mono)" fontSize="10" fill="rgba(42,51,36,0.42)">/100</text>

        {/* Invisible hit-area for gauge hover */}
        <ellipse cx={cx} cy={104} rx="80" ry="92" fill="transparent"
                 onMouseEnter={() => setGaugeHover(true)}
                 onMouseLeave={() => setGaugeHover(false)}
                 style={{ cursor: 'crosshair' }} />

      </svg>

      {/* Gauge tooltip on hover */}
      {gaugeHover && (
        <div style={{
          position: 'absolute', top: '26%', left: '50%', transform: 'translate(-50%, -50%)',
          background: 'rgba(251,247,236,0.97)', border: '1px solid rgba(42,51,36,0.18)',
          borderRadius: 10, padding: '10px 14px', pointerEvents: 'none',
          boxShadow: '0 2px 10px rgba(42,51,36,0.13)', minWidth: 168, zIndex: 10,
        }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '0.12em', color: 'rgba(42,51,36,0.48)', marginBottom: 5 }}>GAUGE READING</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginBottom: 4 }}>
            <span style={{ fontFamily: "'Bricolage Grotesque', system-ui", fontSize: 24, fontWeight: 700, color: dryColor }}>{moisture.toFixed(0)}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(42,51,36,0.45)' }}>/100</span>
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: zoneCol, fontWeight: 600, marginBottom: 7 }}>● {zone}</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'rgba(42,51,36,0.62)', lineHeight: 1.7 }}>
            <div>Land in drought: <strong>{droughtPct.toFixed(1)}%</strong></div>
            <div>mrso anomaly: {mrsoAnom >= 0 ? '+' : ''}{Math.round(mrsoAnom)} kg/m²</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Crops backdrop — reacts to selected biome anomaly ────────
function CropsBackdrop({ anomaly = 0 }) {
  const { useMemo } = React;
  const W = 1000, H = 150, baseY = H - 12;
  // anomaly: negative = drought (dry), positive = flood (excess rain)
  const wetness  = Math.max(-1, Math.min(1, anomaly / 0.6));  // -1 dry … +1 flood
  const mix = (a, b, t) => `rgb(${a.map((v,i) => Math.round(v + (b[i]-v)*t)).join(',')})`;

  const soilCol = wetness > 0
    ? mix([88,96,54],[62,72,44], wetness * 0.6)   // darker/muddier when wet
    : mix([88,96,54],[148,122,72], -wetness * 0.8); // pale tan when dry

  const crops = useMemo(() => {
    let seed = 314;
    const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    const N = 55, out = [];
    for (let i = 0; i < N; i++) {
      const x = (i + 0.5) / N * W + (rnd() - 0.5) * 8;
      const localVar = (rnd() - 0.5) * 0.3;
      const localWet = Math.max(-1, Math.min(1, wetness + localVar));
      const ht = lerp(68, 42, Math.abs(localWet)) * (0.8 + rnd() * 0.38);
      // Drought: droop downward. Flood: blow sideways.
      const lean = localWet > 0
        ? localWet * 38 * (rnd() > 0.5 ? 1 : -1)  // wind-blown sideways
        : localWet * -22;                           // droop forward
      const stalkCol = localWet > 0.3
        ? mix([72,108,52],[44,68,36], localWet)       // dark olive — waterlogged
        : localWet < -0.3
          ? mix([168,148,60],[196,166,80], -localWet) // pale gold — drought
          : mix([112,152,60],[168,148,60], Math.abs(localWet)); // healthy green-gold
      const headCol = localWet < -0.3
        ? mix([188,162,72],[210,185,100], -localWet)  // bleached
        : mix([172,148,58],[124,108,44], Math.max(0, localWet));
      out.push({ x, ht, lean, stalkCol, headCol, z: rnd() });
    }
    out.sort((a, b) => a.z - b.z);
    return out;
  }, [wetness]);

  // Water puddle overlay when flooded
  const floodOpacity = Math.max(0, wetness - 0.15) * 0.55;

  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: H, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMax slice">
        {/* Soil strip */}
        <rect x="0" y={baseY} width={W} height={H - baseY} fill={soilCol} opacity="0.7" />
        {/* Flood water sheen */}
        {floodOpacity > 0 && (
          <rect x="0" y={baseY - 3} width={W} height={H - baseY + 3}
                fill="#4A7EA5" opacity={floodOpacity} />
        )}
        {crops.map((c, i) => {
          const tipX = c.x + c.lean;
          const tipY = baseY - c.ht;
          const cpX  = c.x + c.lean * 0.45;
          const cpY  = baseY - c.ht * 0.58;
          // Wheat head — 4 short grain spikes at tip
          const spikes = [[-4,-9],[-2,-12],[2,-12],[4,-9],[-1,-14],[1,-14]];
          return (
            <g key={i}>
              {/* Stalk */}
              <path d={`M ${c.x.toFixed(1)} ${baseY} Q ${cpX.toFixed(1)} ${cpY.toFixed(1)} ${tipX.toFixed(1)} ${tipY.toFixed(1)}`}
                    stroke={c.stalkCol} strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.82" />
              {/* Grain head spikes */}
              {spikes.map(([dx, dy], si) => (
                <line key={si}
                      x1={tipX.toFixed(1)} y1={tipY.toFixed(1)}
                      x2={(tipX + dx).toFixed(1)} y2={(tipY + dy).toFixed(1)}
                      stroke={c.headCol} strokeWidth="1.3" strokeLinecap="round" opacity="0.88" />
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Sun (heat section corner decoration) ───────────────────
function Sun({ tempValue = 1.2 }) {
  const { useMemo } = React;
  const intensity = Math.min(1, Math.max(0, tempValue / 5.0));
  // Color: warm amber at low temps → intense orange-red at high
  const sunG = Math.round(lerp(200, 110, intensity));
  const sunB = Math.round(lerp(50, 15, intensity));
  const col = `rgb(255,${sunG},${sunB})`;
  const coreR = lerp(50, 72, intensity);
  const rayLen = lerp(18, 65, intensity);
  const glowR = lerp(110, 200, intensity);
  const NUM = 14;
  const cx = 300, cy = 0; // sun center pinned to top-right corner
  const rays = useMemo(() => Array.from({ length: NUM }, (_, i) => {
    const a = (i / NUM) * Math.PI * 2;
    const gap = coreR + 10;
    const extra = (i % 3) * 12 * intensity;
    return {
      x1: cx + Math.cos(a) * gap, y1: cy + Math.sin(a) * gap,
      x2: cx + Math.cos(a) * (gap + rayLen + extra),
      y2: cy + Math.sin(a) * (gap + rayLen + extra),
    };
  }), [intensity, coreR, rayLen]);

  return (
    <div style={{ position: 'absolute', top: 0, right: 0, width: 340, height: 340, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <svg viewBox="0 0 340 340" width="340" height="340">
        <defs>
          <radialGradient id="sunHalo" cx="100%" cy="0%" r="80%">
            <stop offset="0%" stopColor={col} stopOpacity={lerp(0.42, 0.72, intensity)} />
            <stop offset="55%" stopColor={col} stopOpacity={lerp(0.12, 0.28, intensity)} />
            <stop offset="100%" stopColor={col} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="340" height="340" fill="url(#sunHalo)" />
        {rays.map((r, i) => (
          <line key={i} x1={r.x1.toFixed(1)} y1={r.y1.toFixed(1)} x2={r.x2.toFixed(1)} y2={r.y2.toFixed(1)}
            stroke={col} strokeWidth={lerp(2.5, 4.5, intensity).toFixed(1)} strokeLinecap="round"
            opacity={lerp(0.70, 0.95, intensity).toFixed(2)} />
        ))}
        <circle cx={cx} cy={cy} r={lerp(100, 155, intensity)} fill={col} opacity={lerp(0.14, 0.28, intensity).toFixed(2)} />
        <circle cx={cx} cy={cy} r={coreR.toFixed(1)} fill={col} opacity="0.97" />
      </svg>
    </div>
  );
}

// ── Smoke clouds (co2 section background) ──────────────────
function SmokeClouds({ co2Value = 420 }) {
  const { useMemo } = React;
  const intensity = Math.min(1, Math.max(0, (co2Value - 415) / (700 - 415)));
  const W = 1200, H = 900;
  const plumes = useMemo(() => {
    let seed = 77;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const all = [];
    for (let i = 0; i < 22; i++) {
      const scale = 0.65 + rnd() * 1.3;
      const baseOp = 0.18 + rnd() * 0.20;
      const blurId = ['smk-a', 'smk-b', 'smk-c'][Math.floor(rnd() * 3)];
      const nBlobs = 4 + Math.floor(rnd() * 4);
      const blobs = [];
      for (let j = 0; j < nBlobs; j++) {
        const frac = j / (nBlobs - 1);
        // wider in the middle, narrower at base and tip — smoke column shape
        const rx = (25 + Math.sin(frac * Math.PI) * 22 + rnd() * 16) * scale;
        const ry = (15 + rnd() * 12) * scale;
        blobs.push({ rx, ry, bx: (rnd() - 0.5) * 26 * scale, by: -frac * 108 * scale });
      }
      all.push({
        cx: 60 + rnd() * (W - 120),
        cy: 150 + rnd() * (H - 80),
        blobs, baseOp, blurId,
        dur: (14 + rnd() * 16).toFixed(1),
        opDur: (9 + rnd() * 11).toFixed(1),
        dx: (rnd() - 0.5) * 34,
        dy: -52 - rnd() * 72,
        delay: (-rnd() * 22).toFixed(1),
      });
    }
    return all;
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden',
      opacity: intensity, transition: 'opacity 1.8s ease' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="smk-a" x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence type="turbulence" baseFrequency="0.022" numOctaves="4" seed="5" result="noise"/>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="22" xChannelSelector="R" yChannelSelector="G" result="disp"/>
            <feGaussianBlur stdDeviation="2.5"/>
          </filter>
          <filter id="smk-b" x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence type="turbulence" baseFrequency="0.017" numOctaves="4" seed="12" result="noise"/>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="32" xChannelSelector="R" yChannelSelector="G" result="disp"/>
            <feGaussianBlur stdDeviation="3"/>
          </filter>
          <filter id="smk-c" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence type="turbulence" baseFrequency="0.013" numOctaves="5" seed="9" result="noise"/>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="42" xChannelSelector="R" yChannelSelector="G" result="disp"/>
            <feGaussianBlur stdDeviation="3.5"/>
          </filter>
        </defs>
        {plumes.map((c, i) => (
          <g key={i} opacity={c.baseOp} filter={`url(#${c.blurId})`}>
            <animateTransform attributeName="transform" type="translate"
              values={`${c.cx},${c.cy}; ${(c.cx+c.dx).toFixed(1)},${(c.cy+c.dy).toFixed(1)}; ${c.cx},${c.cy}`}
              keyTimes="0;0.5;1" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1"
              dur={`${c.dur}s`} repeatCount="indefinite" begin={`${c.delay}s`} />
            <animate attributeName="opacity"
              values={`${c.baseOp.toFixed(3)};${Math.min(0.52,c.baseOp*1.6).toFixed(3)};${(c.baseOp*0.38).toFixed(3)};${c.baseOp.toFixed(3)}`}
              dur={`${c.opDur}s`} repeatCount="indefinite" begin={`${c.delay}s`} />
            {c.blobs.map((b, j) => (
              <ellipse key={j} cx={b.bx} cy={b.by} rx={b.rx} ry={b.ry} fill="rgba(138,130,120,0.70)" />
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
}

window.VIZ = { Dial, CarbonBlocks, LineChart, Thermometer, WarmingStripes, SeaLevel, IceCaps, GrassField, BiomePrecipChart, CropsBackdrop };

// ============================================================
// ── SECTION 3: TWEAKS PANEL
// ============================================================

const __TWEAKS_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    background:rgba(250,249,247,.86);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;overflow-y:auto;overflow-x:hidden;min-height:0}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}
  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}
  .twk-field{appearance:none;box-sizing:border-box;width:100%;min-width:0;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");background-repeat:no-repeat;background-position:right 8px center}
  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;border-radius:999px;background:rgba(0,0,0,.12);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:14px;height:14px;border-radius:50%;background:#fff;border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}
  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;background:rgba(0,0,0,.15);transition:background .15s;cursor:default;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}
  .twk-chips{display:flex;gap:6px}
  .twk-chip{position:relative;appearance:none;flex:1;min-width:0;height:46px;padding:0;border:0;border-radius:6px;overflow:hidden;cursor:default;box-shadow:0 0 0 .5px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.06)}
  .twk-chip[data-on="1"]{box-shadow:0 0 0 1.5px rgba(0,0,0,.85),0 2px 6px rgba(0,0,0,.15)}
  .twk-chip>span{position:absolute;top:0;bottom:0;right:0;width:34%;display:flex;flex-direction:column;box-shadow:-1px 0 0 rgba(0,0,0,.1)}
  .twk-chip>span>i{flex:1}
`;

function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null ? keyOrEdits : { [keyOrEdits]: val };
    setValues(prev => ({ ...prev, ...edits }));
  }, []);
  return [values, setTweak];
}

function TweaksPanel({ title = 'Tweaks', children }) {
  const [open, setOpen] = React.useState(false);
  const dragRef = React.useRef(null);
  const offsetRef = React.useRef({ x: 16, y: 16 });

  React.useEffect(() => {
    const onMsg = (e) => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);
      else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const onDragStart = (e) => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX, sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = (ev) => {
      offsetRef.current = { x: startRight - (ev.clientX - sx), y: startBottom - (ev.clientY - sy) };
      panel.style.right = offsetRef.current.x + 'px';
      panel.style.bottom = offsetRef.current.y + 'px';
    };
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  if (!open) return null;
  return (
    <>
      <style>{__TWEAKS_STYLE}</style>
      <div ref={dragRef} className="twk-panel" style={{ right: offsetRef.current.x, bottom: offsetRef.current.y }}>
        <div className="twk-hd" onMouseDown={onDragStart}>
          <b>{title}</b>
          <button className="twk-x" onClick={() => setOpen(false)}>✕</button>
        </div>
        <div className="twk-body">{children}</div>
      </div>
    </>
  );
}

function TweakSection({ label }) { return <div className="twk-sect">{label}</div>; }
function TweakRow({ label, value, children, inline }) {
  return (
    <div className={inline ? 'twk-row twk-row-h' : 'twk-row'}>
      <div className="twk-lbl"><span>{label}</span>{value != null && <span className="twk-val">{value}</span>}</div>
      {children}
    </div>
  );
}
function TweakSlider({ label, value, min = 0, max = 100, step = 1, unit = '', onChange }) {
  return (
    <TweakRow label={label} value={`${value}${unit}`}>
      <input className="twk-slider" type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} />
    </TweakRow>
  );
}
function TweakSelect({ label, value, options, onChange }) {
  return (
    <TweakRow label={label}>
      <select className="twk-field" value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </TweakRow>
  );
}
function TweakColor({ label, value, options, onChange }) {
  const isArr = Array.isArray(value);
  return (
    <TweakRow label={label}>
      <div className="twk-chips">
        {options.map((opt, i) => {
          const isArrOpt = Array.isArray(opt);
          const on = isArr ? JSON.stringify(value) === JSON.stringify(opt) : value === opt;
          return (
            <button key={i} className="twk-chip" data-on={on ? '1' : '0'} onClick={() => onChange(opt)} style={{ background: isArrOpt ? opt[0] : opt }}>
              {isArrOpt && <span>{opt.slice(1).map((c, j) => <i key={j} style={{ background: c }} />)}</span>}
            </button>
          );
        })}
      </div>
    </TweakRow>
  );
}
function TweakRadio({ label, value, options, onChange }) {
  return (
    <TweakRow label={label}>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {options.map(o => (
          <button key={o} style={{ padding: '3px 10px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.15)', background: value === o ? 'rgba(0,0,0,0.78)' : 'rgba(255,255,255,0.6)', color: value === o ? '#fff' : 'inherit', font: 'inherit', cursor: 'default', fontSize: 11 }} onClick={() => onChange(o)}>{o}</button>
        ))}
      </div>
    </TweakRow>
  );
}

// ============================================================
// ── SECTION 4: SECTIONS
// ============================================================

function Arrow() {
  return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}><line x1="2" y1="8" x2="13" y2="8" /><polyline points="9 4 13 8 9 12" /></svg>;
}

// ── Top chrome ──────────────────────────────────────────────
function TopChrome({ progress, chapter, dark }) {
  return (
    <React.Fragment>
      <div className="readline"><i style={{ width: progress * 100 + '%' }} /></div>
      <div className={'chrome' + (dark ? ' on-dark' : '')}>
        <div className="chrome-brand">Degrees of Consequence</div>
        <div className="chrome-right">
          <span className="chrome-chapter">{chapter}</span>
          <span className="chrome-progress"><i style={{ width: progress * 100 + '%' }} /></span>
          <span className="chrome-chapter">{String(Math.round(progress * 100)).padStart(2, '0')}%</span>
        </div>
      </div>
    </React.Fragment>
  );
}

// ── Cover ───────────────────────────────────────────────────
function BrandThermo() {
  const stripes = [];
  for (let i = 0; i < 7; i++) stripes.push(<rect key={i} x={8 + i * 16} y="6" width="8" height="188" fill="#000" opacity={i % 2 ? 0.07 : 0} />);
  return (
    <svg className="cover-thermo" viewBox="0 0 120 200" aria-hidden="true">
      <rect x="2" y="2" width="116" height="196" rx="16" fill="var(--tw-accent)" />
      <g>{stripes}</g>
      <rect x="2" y="2" width="116" height="196" rx="16" fill="none" stroke="rgba(0,0,0,0.14)" strokeWidth="2" />
      <rect x="50" y="22" width="20" height="120" rx="10" fill="#fbfaf4" stroke="rgba(0,0,0,0.2)" strokeWidth="2" />
      <circle cx="60" cy="158" r="22" fill="#fbfaf4" stroke="rgba(0,0,0,0.2)" strokeWidth="2" />
      <circle cx="60" cy="158" r="16" fill="#C0392B" />
      <rect x="54" y="64" width="12" height="98" rx="6" fill="#C0392B" />
      <circle cx="60" cy="64" r="7" fill="#C0392B" />
      {[0,1,2,3,4,5,6,7].map(i => <line key={i} x1="38" y1={34 + i * 14} x2={i % 2 ? 46 : 50} y2={34 + i * 14} stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" />)}
      <rect x="53" y="28" width="3" height="100" rx="1.5" fill="rgba(255,255,255,0.6)" />
    </svg>
  );
}

function Cover() {
  return (
    <section className="scene cover" data-screen-label="01 Intro">
      <div className="col--wide">
        <div className="eyebrow reveal" style={{ marginBottom: 28 }}>An interactive story · 75 years of choices</div>
        <div className="cover-title-row reveal">
          <BrandThermo />
          <h1 className="display">Degrees <em className="of">of</em><br /><span className="acc">Consequence</span></h1>
        </div>
      </div>
      <div className="scroll-hint"><span>Scroll to begin</span><span className="bar" /></div>
    </section>
  );
}

// ── About ───────────────────────────────────────────────────
function About() {
  return (
    <section className="scene scene--alt" data-screen-label="01 About">
      <div className="col stack-28">
        <div className="eyebrow reveal">Chapter One · The premise</div>
        <p className="lede reveal" style={{ maxWidth: '44ch', fontSize: 'clamp(20px, 2.6vw, 26px)' }}>The decisions that shape the next century are being made right now, through votes, boardrooms, and budgets. Pick a seat at the table and see what your choices leave behind.</p>
        <p className="body reveal" style={{ fontSize: 19, lineHeight: 1.75, maxWidth: '58ch' }}>
          This story is built on <strong>CMIP6</strong> climate-model data, the same projections used by
          the Intergovernmental Panel on Climate Change (IPCC). We surface three plausible futures, each
          one shaped by a different set of human decisions compounded over 75 years. Pick a worldview,
          watch the model run it forward to 2100, and see the world it produces.
        </p>
        <div className="reveal" style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'center', paddingTop: 8 }}>
          {[['var(--tw-low)', 'Sustainable', '+1.1°C'], ['var(--tw-mid)', 'Middle Road', '+2.6°C'], ['var(--tw-high)', 'Fossil-Fueled', '+4.9°C']].map(([c, n, d]) =>
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <span style={{ width: 14, height: 14, borderRadius: '50%', background: c, flexShrink: 0 }} />
              <span><span className="label" style={{ display: 'block' }}>{n}</span><b style={{ fontFamily: 'var(--tw-serif)', fontSize: 26 }}>{d}</b></span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Persona select ──────────────────────────────────────────
function PersonaSelect({ persona, onPick, onContinue }) {
  const handleContinue = () => { if (onContinue) onContinue(); };
  return (
    <section className="scene scene--tall" data-screen-label="02 Take a seat">
      <div className="col--wide">
        <div className="eyebrow reveal" style={{ marginBottom: 22 }}>Chapter Two · Take a seat</div>
        <h2 className="h2 reveal">Who are you<br />at the table?</h2>
        <p className="lede reveal" style={{ maxWidth: '52ch', marginTop: 22, color: 'var(--ink-soft)' }}>Three people walk into the room, each holding a different vision of the next decade. Pick one to continue.</p>
        <div className="persona-grid">
          {PERSONAS.map((p, i) =>
            <button key={p.id} className={'persona reveal' + (persona === p.id ? ' sel' : '')} style={{ transitionDelay: i * 60 + 'ms' }} onClick={() => onPick(p.id)}>
              <div className="persona-img"><img src={p.img} alt={p.name} /></div>
              <div className="persona-body">
                <span className="persona-role">{p.label}</span>
                <span className="persona-name">{p.name}</span>
                <p className="persona-tag">{p.tag}</p>
                <span className="persona-cta">{persona === p.id ? 'Seat taken ✓' : 'Take this seat'}{persona !== p.id && <Arrow />}</span>
              </div>
            </button>
          )}
        </div>
        <div className="persona-continue-row reveal" style={{ marginTop: 40 }}>
          {persona ? (
            <button className="btn btn--primary" onClick={handleContinue}>
              Continue as {PERSONAS.find(p => p.id === persona)?.name} <Arrow />
            </button>
          ) : (
            <div className="persona-gate-hint">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--tw-accent)', display: 'inline-block', marginRight: 8 }} />
              Choose a character above to continue
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Policy console ──────────────────────────────────────────
function PolicyConsole({ persona }) {
  const { useState, useRef } = React;
  const ref = useRef(null);
  const p = PERSONAS.find(x => x.id === persona) || PERSONAS[1];
  const [knob, setKnob] = useState(0);
  const bucket = classify(computeScore(p.values));
  const thought = PERSONA_THOUGHTS[p.id] || {};
  const cur = KNOB_DEFS[knob];
  return (
    <section className="scene scene--alt" data-screen-label="02 The console" ref={ref}>
      <div className="col--wide">
        <div className="eyebrow reveal" style={{ marginBottom: 18 }}>Chapter Two · The console</div>
        <h2 className="h3 reveal" style={{ maxWidth: '24ch' }}>Six levers. One climate outcome.</h2>
        <p className="body reveal" style={{ maxWidth: '60ch', marginTop: 16 }}>
          {p.name}'s worldview sets each lever automatically. This is what their priorities look like as policy.
          Click any dial to read the logic behind the position. Higher is better for every lever <em>except</em> fossil fuels, where lower means a cleaner path.
        </p>
        <div className="reveal console-layout" style={{ marginTop: 40 }}>
          <div className="thought-card">
            <div className="label" style={{ color: 'var(--tw-accent)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--tw-accent)' }} />
              PRIORITY {String(knob + 1).padStart(2, '0')} OF 06
            </div>
            <img src={cur.img} alt="" style={{ marginTop: 16, width: 110, height: 110 }} />
            <div style={{ fontSize: 28, lineHeight: 1.0, margin: '12px 0 10px', fontFamily: 'var(--tw-serif)' }}>{cur.short}</div>
            <p className="body" style={{ fontSize: 14, margin: 0 }}>{cur.desc}</p>
            <hr style={{ border: 0, borderTop: '1px solid var(--line)', margin: '16px 0' }} />
            <p style={{ fontFamily: 'var(--mono)', fontSize: 12.5, lineHeight: 1.65, color: 'var(--ink-soft)', margin: 0 }}>{thought[cur.id]}</p>
          </div>
          <div className="console">
            <div className="console-head">
              <div className="console-who">
                <div className="fig fig--round"><img src={p.img} alt="" /></div>
                <div>
                  <div className="nm">{p.name}</div>
                  <div className="rl">{p.keywords}</div>
                </div>
              </div>
              <div className="console-classify">
                <div className="k">Projected pathway</div>
                <div className="v" style={{ color: bucket.swatch }}>{bucket.code}</div>
                <div className="k" style={{ marginTop: 4 }}>{bucket.name} · +{bucket.delta.toFixed(1)}°C</div>
              </div>
            </div>
            <div className="dial-grid">
              {KNOB_DEFS.map((k, i) => {
                const isBad = k.id === 'fossil';
                return (
                  <button key={k.id} className={'dial-cell' + (i === knob ? ' active' : '')} onClick={() => setKnob(i)}>
                    <Dial value={p.values[k.id]} color={isBad ? '#D45028' : '#E08D5C'} active={i === knob} />
                    <span className="dl">{k.short}</span>
                    <span className="dv">{String(p.values[k.id]).padStart(2, '0')} / 100</span>
                    <span className="dial-dir" style={{ color: isBad ? '#D45028' : '#82A78A' }}>
                      {isBad ? '↓ lower is better' : '↑ higher is better'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Time jump (scroll-driven) ───────────────────────────────
function TimeJump({ persona }) {
  const { useRef, useState, useEffect } = React;
  const ref = useRef(null);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = ref.current; if (!el) return;
      const total = el.offsetHeight - window.innerHeight;
      setProgress(Math.max(0, Math.min(1, -el.getBoundingClientRect().top / (total || 1))));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const LINES = [
    [0.00, 'The decisions are in motion.'],
    [0.22, 'Carbon stays in the atmosphere for centuries.'],
    [0.44, 'The effects play out over the next 75 years.'],
    [0.66, 'Carbon stays in the atmosphere for centuries.'],
    [0.86, 'The outcomes emerge.'],
  ];
  // Gate: if no persona selected, scroll back when user enters this section
  useEffect(() => {
    if (persona || !ref.current) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        const target = document.querySelector('[data-screen-label="02 Take a seat"]');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, { threshold: 0.3 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [persona]);

  const eased = 1 - Math.pow(1 - Math.min(1, progress / 0.9), 1.5);
  const year = Math.round(2025 + 75 * eased);
  const line = [...LINES].reverse().find(l => progress >= l[0]) || LINES[0];
  const ticks = [];
  for (let i = 0; i < 76; i++) {
    const a = i / 76 * Math.PI * 2 - Math.PI / 2;
    const lit = i / 76 <= eased;
    const r1 = 86, r2 = lit ? 96 : 92;
    ticks.push(<line key={i} x1={100 + r1 * Math.cos(a)} y1={100 + r1 * Math.sin(a)} x2={100 + r2 * Math.cos(a)} y2={100 + r2 * Math.sin(a)} stroke={lit ? '#E08D5C' : 'rgba(236,230,206,0.22)'} strokeWidth={lit ? 2 : 1} strokeLinecap="round" />);
  }
  return (
    <div className="timejump" ref={ref} data-screen-label="03 Time jump">
      <div className="timejump-sticky">
        <svg className="timejump-ring" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="84" fill="none" stroke="rgba(236,230,206,0.12)" strokeWidth="1" />
          {ticks}
        </svg>
        <div className="timejump-inner">
          <div className="label" style={{ color: 'var(--sage)' }}>Time passing</div>
          <div className="timejump-year">{year}</div>
          <div className="timejump-line" key={line[1]}>{line[1]}</div>
          <div className="timejump-track"><span>2025</span><span className="now">{year}</span><span>2100</span></div>
          <div className="timejump-bar"><i style={{ width: eased * 100 + '%' }} /></div>
        </div>
      </div>
    </div>
  );
}

// ── Timeline intro (dark) ───────────────────────────────────
function TimelineIntro({ bucket }) {
  return (
    <section className="scene scene--dark" data-screen-label="03 What comes next">
      <div className="col stack-28">
        <div className="eyebrow reveal">Chapter Three · What comes next</div>
        <h2 className="h2 reveal">This is the world<br />your framework builds.</h2>
        <p className="lede reveal" style={{ maxWidth: '54ch' }}>
          Scroll forward from 2025 to 2100 through four lenses: atmospheric carbon, global heat,
          rising seas, and the water cycle. Each one reflects the same underlying choice: your pathway.
        </p>
        <div className="reveal pathway-tag">
          <span className="sw" style={{ background: bucket.swatch }} />
          Your pathway · {bucket.code} · {bucket.name} · +{bucket.delta.toFixed(1)}°C by 2100
        </div>
      </div>
    </section>
  );
}

// Rough global land-area fractions for each simplified biome
const BIOME_AREA_WEIGHTS = {
  'Tropical Forest': 0.12,
  'Savanna': 0.17,
  'Desert': 0.22,
  'Mediterranean': 0.02,
  'Temperate Forest': 0.11,
  'Steppe / Grassland': 0.13,
  'Boreal / Taiga': 0.14,
  'Tundra & Arctic': 0.09,
};
const CHAPTER_SSP_MAP = { '1-2.6': 'ssp126', '2-4.5': 'ssp245', '5-8.5': 'ssp585' };

// ── Metric chapter ──────────────────────────────────────────
function Chapter({ metric, bucket }) {
  const { useRef, useState, useEffect, useMemo } = React;
  const ref = useRef(null);
  const [prog, setProg] = useState(0);
  const [selectedBiome, setSelectedBiome] = useState(null);
  const [biomeAnomaly, setBiomeAnomaly] = useState(0);
  const [biomeData, setBiomeData] = useState(null);
  const M = metric;
  const sspKey = bucket.key;

  useEffect(() => {
    if (M.id !== 'drought') return;
    fetch('data/biome_precip.json').then(r => r.json()).then(setBiomeData).catch(() => {});
  }, [M.id]);

  const biomeSeriesData = useMemo(() => {
    if (!biomeData || !selectedBiome) return null;
    const ssp = CHAPTER_SSP_MAP[sspKey] || 'ssp585';
    const biome = Object.values(biomeData.biomes).find(b => b.name === selectedBiome);
    if (!biome) return null;
    const records = biome.scenarios[ssp] || [];
    return records.map(r => {
      const w = records.filter(x => x.year > r.year - 10 && x.year <= r.year);
      const val = w.length ? w.reduce((s, x) => s + x.anomaly, 0) / w.length : r.anomaly;
      return { year: r.year, val };
    });
  }, [biomeData, selectedBiome, sspKey]);

  const precipChipVal = useMemo(() => {
    const yc2 = Math.min(2100, Math.round(2025 + Math.min(1, prog) * 75));
    if (biomeSeriesData) {
      const pt = biomeSeriesData.find(r => r.year === yc2) || biomeSeriesData[biomeSeriesData.length - 1];
      const v = pt ? pt.val : 0;
      return { str: (v >= 0 ? '+' : '') + v.toFixed(1), unit: '%' };
    }
    const v = valAt('precip', sspKey, yc2);
    return { str: (v >= 0 ? '+' : '') + v.toFixed(2), unit: '%' };
  }, [biomeSeriesData, prog, sspKey]);

  const biomeChartDom = useMemo(() => {
    if (!biomeSeriesData || !biomeSeriesData.length) return [-0.5, 3.5];
    const vals = biomeSeriesData.map(d => d.val);
    const mn = Math.min(...vals), mx = Math.max(...vals);
    const pad2 = (mx - mn || 5) * 0.15;
    return [Math.min(mn - pad2, -1), Math.max(mx + pad2, 1)];
  }, [biomeSeriesData]);

  useEffect(() => {
    const onScroll = () => {
      const el = ref.current; if (!el) return;
      const total = el.offsetHeight - window.innerHeight;
      setProg(Math.max(0, Math.min(1, -el.getBoundingClientRect().top / (total || 1))));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const beats = BEATS[M.id][sspKey];
  const year = Math.round(2025 + Math.min(1, prog) * 75);

  const handleChartClick = React.useCallback((clickedYear) => {
    const el = ref.current; if (!el) return;
    const targetProg = Math.max(0, Math.min(1, (clickedYear - 2025) / 75));
    const total = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: el.offsetTop + targetProg * total, behavior: 'smooth' });
  }, []);
  const yc = Math.min(2100, year);
  const value = valAt(M.id, sspKey, yc);
  const tempVal = valAt('temp', sspKey, yc);
  const activeStep = Math.max(0, Math.min(beats.length - 1, Math.floor(prog * beats.length * 0.999)));
  const b = beats[activeStep];

  const sceneClass = M.dark ? ' scene--dark' : M.id === 'drought' ? ' scene--alt' : '';

  if (M.id === 'co2') {
    const CO2Waffle = () => <div className="viz-box"><CarbonBlocks value={value} year={yc} /></div>;
    return (
      <section className="scene chapter chapter--tall chapter--co2" ref={ref} data-screen-label={M.chapter + ' · ' + M.title} style={{ padding: 0 }}>
        <div className="chapter-sticky2">
          <SmokeClouds co2Value={value} />
          <div className="metric-comp metric-comp--co2" style={{ position: 'relative', zIndex: 1 }}>
            <div className="mc-narr">
              <div className="eyebrow">{M.chapter}</div>
              <div className="metric-section-title">{M.title}</div>
              <div className="co2-narr-beat">
                <h3 className="co2-beat-title">{b.title}</h3>
                <p className="co2-beat-body">{b.body}</p>
              </div>
              <div className="co2-reached-wrapper">
                <div className="co2-reached-card">
                  <div className="co2-reached-label">YOU'VE REACHED</div>
                  <div className="co2-reached-year">{year}</div>
                </div>
                <div className="mc-note" style={{ marginTop: 8 }}>{b.note}</div>
              </div>
            </div>
            <div className="co2-right-card">
              <div className="co2-card-header">
                <span className="co2-card-title">{M.label} · ATMOSPHERIC CONCENTRATION</span>
                <span className="co2-card-badge">
                  <span className="co2-badge-dot" style={{ background: bucket.swatch }} />
                  {bucket.name.toUpperCase()} · {bucket.code}
                </span>
              </div>
              <div className="co2-card-viz">
                <CO2Waffle />
              </div>
              <div className="co2-value-row">
                <div className="vv co2-vv">{M.fmt(value)}<span className="u">{M.unit}</span></div>
                <div className="co2-value-label">ATMOSPHERIC CONCENTRATION<br />AS OF {year}</div>
              </div>
              <div className="co2-card-chart">
                <LineChart metric={M.id} activeKey={sspKey} year={yc} dark={M.dark} dom={M.dom} unit={M.unit} fmt={M.fmt} onClickYear={handleChartClick} />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const CARD_TITLES = { sea: 'SEA LEVEL · PROJECTED RISE', temp: 'TEMPERATURE · MEAN ANOMALY', drought: 'PRECIPITATION · BIOME ANOMALY' };
  const VALUE_LABELS = { sea: 'PROJECTED RISE', temp: 'TEMPERATURE ANOMALY', drought: 'DROUGHT AREA' };
  const mrsoAnom = M.id === 'drought' ? valAt('mrso', sspKey, yc) : 0;

  return (
    <section className={'scene chapter chapter--tall chapter--' + M.id + sceneClass} ref={ref} data-screen-label={M.chapter + ' · ' + M.title} style={{ padding: 0 }}>
      <div className="chapter-sticky2">
        {M.id === 'temp' && <Sun tempValue={tempVal} />}
        <div className="metric-comp metric-comp--co2" style={{ position: 'relative', zIndex: 1 }}>
          <div className="mc-narr">
            <div className="eyebrow">{M.chapter}</div>
            <div className="metric-section-title">{M.title}</div>
            <div className="co2-narr-beat" key={activeStep}>
              <h3 className="co2-beat-title">{b.title}</h3>
              <p className="co2-beat-body">{b.body}</p>
            </div>
            <div className="metric-year-wrapper">
              <div className="co2-reached-card">
                <div className="co2-reached-label">YOU'VE REACHED</div>
                <div className="co2-reached-year">{year}</div>
              </div>
              <div className="mc-note" style={{ marginTop: 8 }}>{b.note}</div>
            </div>
          </div>
          <div className="co2-right-card">
            <div className="co2-card-header">
              <span className="co2-card-title">{CARD_TITLES[M.id] || M.label}</span>
              <span className="co2-card-badge">
                <span className="co2-badge-dot" style={{ background: bucket.swatch }} />
                {bucket.name.toUpperCase()} · {bucket.code}
              </span>
            </div>
            <div className={`co2-card-viz metric-card-viz--${M.id}`}>
              {M.id === 'sea' && (
                <div className="sea-split">
                  <div className="sea-ice-left"><IceCaps sspKey={sspKey} year={yc} dark={false} /></div>
                  <div className="sea-level-right"><SeaLevel value={value} year={yc} dark={false} tempValue={tempVal} /></div>
                </div>
              )}
              {M.id === 'temp' && <Thermometer value={value} dark={M.dark} />}
              {M.id === 'drought' && <BiomePrecipChart
                sspKey={sspKey} year={yc}
                selectedBiome={selectedBiome}
                onBiomeSelect={(name, anomaly) => {
                  setSelectedBiome(name);
                  setBiomeAnomaly(name ? anomaly : 0);
                }}
              />}
            </div>
            {M.id === 'drought' ? (
              <div className="precip-stats-row">
                <div className="precip-stat">
                  <img src="images/drought.png" className="precip-stat-icon" alt="" />
                  <div className="precip-stat-value">{smoothedValAt('drought', sspKey, yc).toFixed(1)}<span className="precip-stat-unit">%</span></div>
                  <div className="precip-stat-label">LAND IN DROUGHT</div>
                </div>
                <div className="precip-stat">
                  <img src="images/water_drop.png" className="precip-stat-icon" alt="" />
                  <div className="precip-stat-value">{precipChipVal.str}<span className="precip-stat-unit">{precipChipVal.unit}</span></div>
                  <div className="precip-stat-label">{selectedBiome ? selectedBiome.toUpperCase() + ' ANOMALY' : 'PRECIP ANOMALY'}</div>
                </div>
              </div>
            ) : (
              <div className="co2-value-row">
                <div className="vv co2-vv">{M.fmt(value)}<span className="u">{M.unit}</span></div>
                <div className="co2-value-label">{VALUE_LABELS[M.id] || M.label}<br />AS OF {year}</div>
              </div>
            )}
            <div className="co2-card-chart">
              {M.id === 'drought' ? (
                <LineChart
                  metric="precip"
                  activeKey={sspKey}
                  year={yc}
                  dark={false}
                  dom={biomeSeriesData ? biomeChartDom : [-0.5, 3.5]}
                  unit="%"
                  fmt={v => (v >= 0 ? '+' : '') + v.toFixed(1)}
                  smooth={false}
                  seriesOverride={biomeSeriesData}
                  xStart={1980}
                  titleOverride={selectedBiome ? selectedBiome + ' · Precipitation anomaly (% vs 1995–2014)' : 'Global precipitation anomaly (% vs 1995–2014 baseline)'}
                  onClickYear={handleChartClick}
                />
              ) : (
                <LineChart metric={M.id} activeKey={sspKey} year={yc} dark={M.dark} dom={M.dom} unit={M.unit} fmt={M.fmt} onClickYear={handleChartClick} />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Summary tree ────────────────────────────────────────────
const TREE_PATHS = {
  '1-2.6': { code: 'SSP1-2.6', name: 'Sustainable',   delta: 1.1, swatch: 'var(--tw-low)' },
  '2-4.5': { code: 'SSP2-4.5', name: 'Middle Road',   delta: 2.6, swatch: 'var(--tw-mid)' },
  '5-8.5': { code: 'SSP5-8.5', name: 'Fossil-Fueled', delta: 4.9, swatch: 'var(--tw-high)' },
};

// Severity drives tree appearance: 0 = fully lush, 1 = fully barren
const TREE_SEVERITY = { '1-2.6': 0.08, '2-4.5': 0.52, '5-8.5': 0.96 };

// Canonical policy dial values per SSP pathway (for root animation)
const ROOT_SSP_VALUES = {
  '1-2.6': { fossil: 8,  renew: 90, carbon: 82, forest: 84, coop: 86, consume: 74 },
  '2-4.5': { fossil: 56, renew: 50, carbon: 40, forest: 44, coop: 50, consume: 34 },
  '5-8.5': { fossil: 90, renew: 14, carbon: 8,  forest: 18, coop: 20, consume: 10 },
};

const ROOTS_DEF = [
  { id: 'fossil',  short: 'Fossil',  bad: true },
  { id: 'renew',   short: 'Renew',   bad: false },
  { id: 'carbon',  short: 'Carbon',  bad: false },
  { id: 'forest',  short: 'Forests', bad: false },
  { id: 'coop',    short: 'Coop',    bad: false },
  { id: 'consume', short: 'Consume', bad: false },
];

// Bezier point evaluation
const bezPt = (t, p0, p1, p2, p3) => {
  const it = 1 - t;
  return [it*it*it*p0[0]+3*it*it*t*p1[0]+3*it*t*t*p2[0]+t*t*t*p3[0],
          it*it*it*p0[1]+3*it*it*t*p1[1]+3*it*t*t*p2[1]+t*t*t*p3[1]];
};

// Leaf shape path generators
// spikyLeaf: narrow pointed lance (Temperature — heat/fire)
const spikyLeaf = (cx, cy, r, ang) => {
  const ax = Math.cos(ang), ay = Math.sin(ang);
  const px = -Math.sin(ang), py = Math.cos(ang);
  const t1x = cx+ax*r, t1y = cy+ay*r;
  const t2x = cx-ax*r, t2y = cy-ay*r;
  const w = r * 0.18;
  return `M ${t1x.toFixed(1)} ${t1y.toFixed(1)} C ${(cx+ax*0.3*r+px*w).toFixed(1)} ${(cy+ay*0.3*r+py*w).toFixed(1)} ${(cx-ax*0.3*r+px*w).toFixed(1)} ${(cy-ay*0.3*r+py*w).toFixed(1)} ${t2x.toFixed(1)} ${t2y.toFixed(1)} C ${(cx-ax*0.3*r-px*w).toFixed(1)} ${(cy-ay*0.3*r-py*w).toFixed(1)} ${(cx+ax*0.3*r-px*w).toFixed(1)} ${(cy+ay*0.3*r-py*w).toFixed(1)} ${t1x.toFixed(1)} ${t1y.toFixed(1)} Z`;
};

// teardropLeaf: rounded base tapering to tip (Sea Level — water drop)
const teardropLeaf = (cx, cy, r, ang) => {
  const ax = Math.cos(ang), ay = Math.sin(ang);
  const px = -Math.sin(ang), py = Math.cos(ang);
  const tipX = cx+ax*r*0.9, tipY = cy+ay*r*0.9;
  const bsX = cx-ax*r*0.65, bsY = cy-ay*r*0.65;
  const w = r * 0.52;
  return `M ${tipX.toFixed(1)} ${tipY.toFixed(1)} C ${(cx+px*w*0.35).toFixed(1)} ${(cy+py*w*0.35).toFixed(1)} ${(bsX+px*w).toFixed(1)} ${(bsY+py*w).toFixed(1)} ${bsX.toFixed(1)} ${bsY.toFixed(1)} C ${(bsX-px*w).toFixed(1)} ${(bsY-py*w).toFixed(1)} ${(cx-px*w*0.35).toFixed(1)} ${(cy-py*w*0.35).toFixed(1)} ${tipX.toFixed(1)} ${tipY.toFixed(1)} Z`;
};

// jaggedLeaf: uses ang as a deterministic seed for irregularity (no NaN risk)
const jaggedLeaf = (cx, cy, r, ang) => {
  const N = 7;
  const pts = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const jitter = 0.38 + (Math.sin(ang * 3.7 + i * 2.1) * 0.11 + 0.11);
    const rr = (i % 2 === 0) ? r : r * jitter;
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`);
  }
  return `M ${pts.join(' L ')} Z`;
};

function SummaryTree({ bucket, knobValues }) {
  const { useState, useRef, useEffect, useMemo } = React;
  const [view, setView] = useState(bucket.key);
  const [hoveredMetric, setHoveredMetric] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [hoveredRoot, setHoveredRoot] = useState(null);
  const [rootTipPos, setRootTipPos] = useState({ x: 0, y: 0 });

  // rAF-based interpolation state
  const [displaySev, setDisplaySev] = useState(TREE_SEVERITY[bucket.key] ?? 0.52);
  const initialVals = useMemo(() => {
    const v = {};
    ['temp', 'sea', 'drought', 'co2'].forEach(id => { v[id] = valAt(id, bucket.key, 2100); });
    return v;
  }, []);
  const [displayVals, setDisplayVals] = useState(initialVals);
  const [displayRoots, setDisplayRoots] = useState(knobValues || ROOT_SSP_VALUES[bucket.key]);
  const rafRef = useRef(null);

  const switchView = (newView) => {
    if (newView === view) return;
    setView(newView);
    const targetSev = TREE_SEVERITY[newView] ?? 0.5;
    const targetVals = {};
    ['temp', 'sea', 'drought', 'co2'].forEach(id => { targetVals[id] = valAt(id, newView, 2100); });
    const targetRoots = ROOT_SSP_VALUES[newView];
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const DURATION = 700;
    const start = performance.now();
    const startSev = displaySev;
    const startVals = { ...displayVals };
    const startRoots = { ...displayRoots };
    const step = (now) => {
      const raw = Math.min(1, (now - start) / DURATION);
      const t = raw < 0.5 ? 2 * raw * raw : -1 + (4 - 2 * raw) * raw; // ease-in-out quad
      setDisplaySev(startSev + (targetSev - startSev) * t);
      const nv = {};
      Object.keys(targetVals).forEach(k => { nv[k] = startVals[k] + (targetVals[k] - startVals[k]) * t; });
      setDisplayVals(nv);
      const nr = {};
      Object.keys(targetRoots).forEach(k => { nr[k] = startRoots[k] + (targetRoots[k] - startRoots[k]) * t; });
      setDisplayRoots(nr);
      if (raw < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  };

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const meta = TREE_PATHS[view] || TREE_PATHS['2-4.5'];
  const sev = displaySev;
  const lush = 1 - sev;

  const mix = (a, b, t) => `rgb(${Math.round(lerp(a[0],b[0],t))},${Math.round(lerp(a[1],b[1],t))},${Math.round(lerp(a[2],b[2],t))})`;

  const wood = mix([85,62,38], [110,98,88], sev);
  const trunkW = lerp(22, 10, sev);
  const branchW = lerp(10, 4, sev);
  const leafCol = mix([72,148,80], [130,110,80], sev);
  const groundCol = mix([96,140,76], [168,148,110], sev);
  const skyCol = mix([240,248,240], [252,244,220], sev);

  const W = 1000, H = 600, groundY = 490, baseX = 500, forkX = 500, forkY = 310;

  // Three branches (CO₂ is now the trunk)
  const treeMetrics = [
    { id: 'temp',    label: 'Temperature', tip: [205, 205], subTips: [[278, 172]], unit: '°C',  desc: 'Surface temp anomaly by 2100',   leafShape: 'spiky',    dataId: 'temp' },
    { id: 'sea',     label: 'Sea Level',   tip: [500, 158], subTips: [[432, 178],[568,178]], unit: 'cm',  desc: 'Sea level rise above 2025',      leafShape: 'teardrop', dataId: 'sea' },
    { id: 'drought', label: 'Drought Area', tip: [795, 205], subTips: [[722, 172]], unit: '%', desc: '% of global land affected by drought in 2100', leafShape: 'jagged', dataId: 'drought' },
  ];
  const fmts = {
    temp:    v => (v >= 0 ? '+' : '') + v.toFixed(1),
    sea:     v => '+' + Math.round(v),
    drought: v => v.toFixed(1),
    co2:     v => Math.round(v),
  };

  // Per-branch lushness based on actual data (relative to best/worst scenario)
  const branchLush = treeMetrics.map(m => {
    const best  = valAt(m.dataId, '1-2.6', 2100);
    const worst = valAt(m.dataId, '5-8.5', 2100);
    const cur   = displayVals[m.dataId] ?? valAt(m.dataId, view, 2100);
    const range = worst - best;
    const bSev  = range === 0 ? 0 : Math.max(0, Math.min(1, (cur - best) / range));
    return 1 - bSev;
  });

  // Seeded random for consistent leaf placement
  let seed = 42;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;

  // Generate leaf cluster at a tip position
  const makeLeaves = (tx, ty, bl, count, radiusMult = 1) => {
    const arr = [];
    for (let i = 0; i < 55; i++) {
      const ang = rnd() * Math.PI * 2;
      const rad = (8 + rnd() * (20 + bl * 38)) * radiusMult;
      arr.push({
        lx: tx + Math.cos(ang) * rad,
        ly: ty + Math.sin(ang) * rad * 0.78,
        lr: (lerp(5, 10, bl) + rnd() * lerp(2, 6, bl)) * radiusMult,
        op: 0.5 + rnd() * 0.45,
        ang: rnd() * Math.PI * 2,
      });
    }
    return arr.slice(0, count);
  };

  // Main + subtip leaf clusters per branch
  const allLeaves = treeMetrics.map((m, mi) => {
    const bl = branchLush[mi];
    const mainCount = Math.round(8 + bl * 42);
    const subCount  = Math.round(5 + bl * 24);
    const [tx, ty] = m.tip;
    return {
      main: makeLeaves(tx, ty, bl, mainCount),
      subs: m.subTips.map(([stx, sty]) => makeLeaves(stx, sty, bl, subCount, 0.75)),
    };
  });

  // Selected metric for chart panel (including CO₂ trunk)
  const handleCardClick = (id) => setSelectedMetric(selectedMetric === id ? null : id);

  // Look up METRICS def for the chart panel
  const getMetricDef = (id) => METRICS.find(m => m.id === id) || METRICS[0];

  const co2Val = displayVals['co2'] ?? valAt('co2', view, 2100);
  const co2Delta = Math.round(co2Val) - 420;

  return (
    <section className="scene summary" data-screen-label="03 The whole picture" style={{ background: `linear-gradient(180deg, ${skyCol} 0%, var(--bg) 60%)` }}>
      <div className="col--wide">
        <div className="eyebrow reveal" style={{ marginBottom: 18 }}>Chapter Three · E · The whole picture</div>
        <h2 className="h2 reveal" style={{ maxWidth: '28ch' }}>Compare three climate futures.</h2>
        <p className="lede reveal" style={{ maxWidth: '54ch', marginTop: 10, color: 'var(--ink-soft)', fontSize: 16 }}>
          CO₂ drives all other outcomes. Every tonne emitted raises temperature, sea level, and disrupts precipitation. Click any card to see how each pathway compares.
        </p>
        <div className="tree-controls reveal">
          <span className="lbl">Compare pathway</span>
          <div className="tree-pathway-btns">
            {Object.entries(TREE_PATHS).map(([k, p]) => (
              <button key={k} className={'tree-btn' + (view === k ? ' active' : '')}
                style={{ '--btn-color': p.swatch }} onClick={() => switchView(k)}>
                <span className="tree-btn-dot" />
                <span>{p.name}</span>
                <span className="tree-btn-delta">+{p.delta.toFixed(1)}°C</span>
              </button>
            ))}
          </div>
        </div>
        <div className="summary-tree reveal">
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }} onMouseLeave={() => setHoveredMetric(null)}>
            <defs>
              <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={skyCol} stopOpacity="0.4" />
                <stop offset="1" stopColor={skyCol} stopOpacity="0" />
              </linearGradient>
              <clipPath id="underground-clip">
                <rect x="0" y={groundY} width={W} height={H - groundY} />
              </clipPath>
            </defs>
            <rect x="0" y="0" width={W} height={groundY} fill="url(#skyGrad)" />

            {/* Ground */}
            <rect x="0" y={groundY} width={W} height={H - groundY} fill={groundCol} />
            <rect x="0" y={groundY} width={W} height="4" fill={`rgba(42,51,36,${lerp(0.18, 0.08, sev)})`} />

            {/* Policy roots — underground organic curves */}
            <g clipPath="url(#underground-clip)">
              {ROOTS_DEF.map((r, i) => {
                const t = i / (ROOTS_DEF.length - 1);
                const rootEndX = 100 + t * 800;
                const dist = Math.abs(rootEndX - baseX);
                const val = displayRoots ? (displayRoots[r.id] ?? 50) : 50;
                const rootGood = r.bad ? (100 - val) / 100 : val / 100;
                const rootW = lerp(1.5, 7, rootGood);
                const rootColor = r.bad
                  ? mix([180, 99, 58], [70, 55, 42], rootGood)
                  : mix([70, 55, 42], [58, 128, 70], rootGood);
                const isHov = hoveredRoot === r.id;

                // Deterministic jitter per root for organic feel
                const jit = (Math.sin(i * 3.7 + 1.1) + 1) * 0.5; // 0–1

                // Cubic bezier: drop down near trunk then sweep outward
                const depth = 36 + dist * 0.175;
                const endX = rootEndX + (rootEndX - baseX) * 0.04;
                const endY = groundY + depth;
                const c1x = baseX + (rootEndX - baseX) * 0.12;
                const c1y = groundY + depth * 0.30 + jit * 8;
                const c2x = rootEndX + (rootEndX - baseX) * 0.06;
                const c2y = endY - depth * 0.20 + jit * 6;

                const mainD = `M ${baseX} ${groundY} C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`;

                // Small side branch off ~58% along the main curve
                const bp = bezPt(0.58, [baseX, groundY], [c1x, c1y], [c2x, c2y], [endX, endY]);
                const dir = rootEndX >= baseX ? 1 : -1;
                const brEndX = bp[0] + dir * (10 + jit * 16);
                const brEndY = bp[1] + 18 + jit * 10;
                const brD = `M ${bp[0].toFixed(1)} ${bp[1].toFixed(1)} Q ${(bp[0] + dir * 5).toFixed(1)} ${(bp[1] + 10).toFixed(1)} ${brEndX.toFixed(1)} ${brEndY.toFixed(1)}`;

                // Tiny tip tendril
                const tp = bezPt(0.82, [baseX, groundY], [c1x, c1y], [c2x, c2y], [endX, endY]);
                const tpEndX = tp[0] - dir * (6 + jit * 8);
                const tpEndY = tp[1] + 12 + jit * 6;
                const tpD = `M ${tp[0].toFixed(1)} ${tp[1].toFixed(1)} Q ${(tp[0] - dir * 3).toFixed(1)} ${(tp[1] + 7).toFixed(1)} ${tpEndX.toFixed(1)} ${tpEndY.toFixed(1)}`;

                return (
                  <g key={r.id}>
                    <path d={mainD} stroke={rootColor} strokeWidth={rootW} fill="none" strokeLinecap="round"
                      opacity={isHov ? 1 : 0.78} />
                    <path d={brD} stroke={rootColor} strokeWidth={rootW * 0.55} fill="none" strokeLinecap="round"
                      opacity={isHov ? 0.9 : 0.62} />
                    <path d={tpD} stroke={rootColor} strokeWidth={rootW * 0.35} fill="none" strokeLinecap="round"
                      opacity={isHov ? 0.8 : 0.5} />
                    {/* Wide invisible hit area */}
                    <path d={mainD} stroke="transparent" strokeWidth={Math.max(rootW + 16, 20)} fill="none" strokeLinecap="round"
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={e => { setHoveredRoot(r.id); setRootTipPos({ x: e.clientX, y: e.clientY }); }}
                      onMouseMove={e => setRootTipPos({ x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setHoveredRoot(null)} />
                  </g>
                );
              })}
            </g>

            {/* Grass blades when lush */}
            {lush > 0.4 && Array.from({ length: Math.round(lush * 60) }).map((_, i) => {
              const bx = 60 + (i / (Math.round(lush * 60) - 1)) * (W - 120) + (i % 3 - 1) * 6;
              const bh = lerp(4, 14, lush) * (0.7 + (i % 5) * 0.07);
              return <path key={i} d={`M ${bx} ${groundY} Q ${bx + (i%2 ? 2 : -2)} ${groundY - bh * 0.6} ${bx + (i%2 ? 3 : -3)} ${groundY - bh}`} stroke={leafCol} strokeWidth={lerp(1.2, 2.2, lush)} fill="none" strokeLinecap="round" />;
            })}

            {/* Main trunk (= CO₂) — with shadow for depth */}
            <path d={`M ${baseX + 4} ${groundY} C ${baseX - 6} ${groundY - 75} ${forkX + 18} ${forkY + 85} ${forkX + 3} ${forkY}`}
              stroke={mix([65,46,26],[90,80,72],sev)} strokeWidth={trunkW + 2} fill="none" strokeLinecap="round" opacity="0.35" />
            <path d={`M ${baseX} ${groundY - 2} C ${baseX - 12} ${groundY - 78} ${forkX + 14} ${forkY + 82} ${forkX} ${forkY}`}
              stroke={wood} strokeWidth={trunkW} fill="none" strokeLinecap="round" />

            {/* Branches + secondary branches + leaves + metric cards */}
            {treeMetrics.map((m, mi) => {
              const [tx, ty] = m.tip;
              const c1x = forkX + (tx - forkX) * 0.3, c1y = forkY - 50;
              const c2x = forkX + (tx - forkX) * 0.72, c2y = ty + 50;
              const rawVal = displayVals[m.dataId] ?? valAt(m.dataId, view, 2100);
              const displayId = m.id === 'drought' ? 'drought' : m.id;
              const isHov = hoveredMetric === m.id;
              const isSel = selectedMetric === m.id;

              const sp = bezPt(0.58, [forkX, forkY], [c1x, c1y], [c2x, c2y], [tx, ty]);

              const leafColBranch = m.leafShape === 'spiky'
                ? mix([105,160,78], [148,118,68], sev)
                : m.leafShape === 'teardrop'
                ? mix([55,128,155], [95,118,140], sev)
                : mix([128,158,55], [148,128,78], sev);

              const renderLeaf = (l, k, scl) => {
                const lr = l.lr * (scl || 1);
                if (m.leafShape === 'spiky')    return <path key={k} d={spikyLeaf(l.lx, l.ly, lr, l.ang)}   fill={leafColBranch} opacity={l.op.toFixed(2)} />;
                if (m.leafShape === 'teardrop') return <path key={k} d={teardropLeaf(l.lx, l.ly, lr, l.ang)} fill={leafColBranch} opacity={l.op.toFixed(2)} />;
                return                                  <path key={k} d={jaggedLeaf(l.lx, l.ly, lr, l.ang)}  fill={leafColBranch} opacity={l.op.toFixed(2)} />;
              };

              return (
                <g key={m.id}>
                  {/* Branch shadow */}
                  <path d={`M ${forkX+2} ${forkY+2} C ${c1x+2} ${c1y+2} ${c2x+2} ${c2y+2} ${tx+2} ${ty+2}`}
                    stroke={mix([65,46,26],[90,80,72],sev)} strokeWidth={branchW+2} fill="none" strokeLinecap="round" opacity="0.22" />
                  {/* Main branch */}
                  <path d={`M ${forkX} ${forkY} C ${c1x} ${c1y} ${c2x} ${c2y} ${tx} ${ty}`}
                    stroke={wood} strokeWidth={branchW} fill="none" strokeLinecap="round" />
                  {/* Secondary branches */}
                  {m.subTips.map(([stx, sty], si) => {
                    const sc1x = sp[0] + (stx - sp[0]) * 0.25;
                    const sc1y = sp[1] + (sty - sp[1]) * 0.08 - 20;
                    const sc2x = sp[0] + (stx - sp[0]) * 0.7;
                    const sc2y = sty + 24;
                    return (
                      <path key={si}
                        d={`M ${sp[0].toFixed(1)} ${sp[1].toFixed(1)} C ${sc1x.toFixed(1)} ${sc1y.toFixed(1)} ${sc2x.toFixed(1)} ${sc2y.toFixed(1)} ${stx} ${sty}`}
                        stroke={wood} strokeWidth={branchW * 0.62} fill="none" strokeLinecap="round" />
                    );
                  })}
                  {/* Leaves on main tip */}
                  {allLeaves[mi].main.map((l, k) => renderLeaf(l, k))}
                  {/* Leaves on sub-tips */}
                  {allLeaves[mi].subs.map((subArr, si) =>
                    subArr.map((l, k) => renderLeaf(l, `s${si}_${k}`, 0.8))
                  )}
                  {/* Connector to card */}
                  <line x1={tx} y1={ty - 42} x2={tx} y2={ty - 10}
                    stroke={isSel ? meta.swatch : 'rgba(42,51,36,0.18)'}
                    strokeWidth={isSel ? 1.5 : 1}
                    strokeDasharray={isSel ? 'none' : '3 3'} />
                  {/* Metric card */}
                  <g transform={`translate(${tx - 100} ${ty - 150})`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleCardClick(m.id)}
                    onMouseEnter={() => setHoveredMetric(m.id)}
                    onMouseLeave={() => setHoveredMetric(null)}>
                    <rect x="0" y="0" width="200" height="120" rx="14"
                      fill={isHov || isSel ? '#fff' : 'rgba(250,249,247,0.94)'}
                      stroke={isHov || isSel ? meta.swatch : 'rgba(42,51,36,0.14)'}
                      strokeWidth={isHov || isSel ? 2 : 1} />
                    <text x="14" y="28" fontFamily="var(--mono)" fontSize="12" letterSpacing="0.12em" fill="rgba(42,51,36,0.55)">{m.label.toUpperCase()}</text>
                    <text x="186" y="28" textAnchor="end" fontFamily="var(--mono)" fontSize="11" fill={meta.swatch}>2100</text>
                    <text x="14" y="72" fontFamily="var(--serif)" fontSize="40" fill="#0E1A0B">{fmts[displayId](rawVal)}<tspan fontFamily="var(--mono)" fontSize="15" fill="rgba(42,51,36,0.5)"> {m.unit}</tspan></text>
                    <foreignObject x="12" y="82" width="176" height="28">
                      <div xmlns="http://www.w3.org/1999/xhtml" style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'rgba(42,51,36,0.38)', lineHeight: '1.45', letterSpacing: '0.05em' }}>
                        {m.desc}
                      </div>
                    </foreignObject>
                  </g>
                </g>
              );
            })}

            {/* CO₂ trunk card — to the right of the trunk */}
            {(() => {
              const cardW = 196, cardH = 120;
              const cardX = forkX + 36;
              const cardY = forkY + 8;
              const isHov = hoveredMetric === 'co2';
              const isSel = selectedMetric === 'co2';
              return (
                <g>
                  <line x1={forkX + 12} y1={forkY + 30} x2={cardX - 4} y2={cardY + 40}
                    stroke="rgba(42,51,36,0.22)" strokeWidth="1" strokeDasharray="3 3" />
                  <g transform={`translate(${cardX} ${cardY})`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleCardClick('co2')}
                    onMouseEnter={() => setHoveredMetric('co2')}
                    onMouseLeave={() => setHoveredMetric(null)}>
                    <rect x="0" y="0" width={cardW} height={cardH} rx="14"
                      fill={isHov || isSel ? '#fff' : 'rgba(250,249,247,0.96)'}
                      stroke={isHov || isSel ? meta.swatch : 'rgba(42,51,36,0.18)'}
                      strokeWidth={isHov || isSel ? 2 : 1} />
                    <text x="14" y="28" fontFamily="var(--mono)" fontSize="12" letterSpacing="0.12em" fill="rgba(42,51,36,0.55)">CO₂ · TRUNK</text>
                    <text x={cardW - 14} y="28" textAnchor="end" fontFamily="var(--mono)" fontSize="11" fill={meta.swatch}>2100</text>
                    <text x="14" y="72" fontFamily="var(--serif)" fontSize="40" fill="#0E1A0B">{co2Delta >= 0 ? '+' : ''}{co2Delta}<tspan fontFamily="var(--mono)" fontSize="15" fill="rgba(42,51,36,0.5)"> ppm</tspan></text>
                    <foreignObject x="12" y="82" width="172" height="28">
                      <div xmlns="http://www.w3.org/1999/xhtml" style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'rgba(42,51,36,0.38)', lineHeight: '1.45', letterSpacing: '0.05em' }}>
                        CO₂ change above 2025 baseline (420 ppm)
                      </div>
                    </foreignObject>
                  </g>
                </g>
              );
            })()}


          </svg>
        </div>
      </div>

      {/* Root hover tooltip */}
      {hoveredRoot && (() => {
        const rd = ROOTS_DEF.find(r => r.id === hoveredRoot);
        const kd = KNOB_DEFS.find(k => k.id === hoveredRoot);
        const val = displayRoots?.[hoveredRoot] ?? 50;
        const rootGood = rd?.bad ? (100 - val) / 100 : val / 100;
        const tipColor = rd?.bad
          ? mix([180,99,58],[70,55,42],rootGood)
          : mix([70,55,42],[58,128,70],rootGood);
        return (
          <div style={{
            position: 'fixed',
            left: rootTipPos.x + 16,
            top: rootTipPos.y - 72,
            background: 'rgba(250,249,247,0.98)',
            border: '1px solid rgba(42,51,36,0.14)',
            borderRadius: 10,
            padding: '10px 14px',
            pointerEvents: 'none',
            boxShadow: '0 4px 18px rgba(0,0,0,0.11)',
            maxWidth: 230,
            zIndex: 200,
          }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.12em', color: tipColor, fontWeight: 700, marginBottom: 5 }}>
              {kd?.short?.toUpperCase() || rd?.short?.toUpperCase()}
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'rgba(42,51,36,0.72)', lineHeight: 1.55 }}>
              {kd?.desc}
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: tipColor, marginTop: 6, opacity: 0.8 }}>
              Setting: {Math.round(val)}/100
            </div>
          </div>
        );
      })()}

      {/* Chart modal — centered popup */}
      {selectedMetric && (() => {
        const sm = selectedMetric === 'co2'
          ? { id: 'co2', label: 'CO₂', dataId: 'co2' }
          : treeMetrics.find(m => m.id === selectedMetric);
        if (!sm) return null;
        const metricId = sm.dataId || sm.id;
        const mDef = getMetricDef(metricId);
        return (
          <div className="tree-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setSelectedMetric(null); }}>
            <div className="tree-modal">
              <div className="tree-chart-panel-head">
                <span className="tree-chart-title">{sm.label} · All three pathways · 1980–2100</span>
                <button className="tree-chart-close" onClick={() => setSelectedMetric(null)}>✕</button>
              </div>
              <MultiLineChart metric={metricId} dark={false} dom={mDef.dom} unit={mDef.unit} fmt={mDef.fmt} hideTitle={true} />
              <div className="tree-chart-outcomes">
                {['1-2.6','2-4.5','5-8.5'].map(k => {
                  const swatchKey = k === '1-2.6' ? 'low' : k === '2-4.5' ? 'mid' : 'high';
                  return (
                    <div key={k} className="tree-chart-outcome" style={{ '--c': `var(--tw-${swatchKey})` }}>
                      <span className="tco-name">{SSP_NAMES[k]}</span>
                      <span className="tco-val">{mDef.fmt(valAt(metricId, k, 2100))}<span className="tco-unit"> {mDef.unit}</span></span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}
    </section>
  );
}

// ── Outro ───────────────────────────────────────────────────
function Outro({ onRestart }) {
  return (
    <section className="scene" data-screen-label="04 The real dials">
      <div className="outro-grid">
        <div className="stack-28">
          <div className="eyebrow reveal">Chapter Four · The real dials</div>
          <h2 className="h2 reveal">The dials that matter most are not in your hands.</h2>
          <p className="body reveal" style={{ fontSize: 19, maxWidth: '54ch' }}>
            Just <strong>57 corporations</strong> are responsible for 80 percent of global emissions since 2016.
            The CMIP6 pathways diverge not on individual choices but on policy: binding carbon pricing,
            ending fossil-fuel subsidies, regulating methane, and a managed phase-out of extraction.
            Demanding those policies, and holding governments to account when they stall, is what actually moves the models.
          </p>
          <button className="btn btn--primary reveal" onClick={onRestart}>Restart your future <Arrow /></button>
          <div className="outro-illos reveal">
            <div className="fig"><img src="../images/handshake.png" alt="" /></div>
            <div className="fig"><img src="../images/wind_turbines.png" alt="" /></div>
            <div className="fig"><img src="../images/green_leaf.png" alt="" /></div>
          </div>
        </div>
        <div className="credits reveal">
          <b>Story</b>Degrees of Consequence<br />A climate adventure
          <b>Team</b>Tanvi Vidyala<br />Nithya Nair<br />Viela Lansangan
          <b>Data</b>CMIP6 / MPI-ESM1-2-LR<br />via NOAA / Google Cloud<br />Processed with xarray + regionmask
        </div>
      </div>
    </section>
  );
}

// ============================================================
// ── SECTION 5: APP
// ============================================================

const TWEAK_DEFAULTS = {
  displayFont: "'Bricolage Grotesque', system-ui, sans-serif",
  accent: '#3C7B51',
  pathways: ['#82A78A', '#C49B5E', '#B4633A'],
  columnWidth: 660,
  spacing: 'generous',
};

const SPACING_MAP = { tight: 0.72, regular: 0.86, generous: 1, airy: 1.22 };

function useReveal() {
  React.useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    const scan = () => document.querySelectorAll('.reveal:not(.in)').forEach(el => io.observe(el));
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, []);
}

function App({ climateData }) {
  const { useState, useEffect, useMemo } = React;
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [persona, setPersona] = useState(() => localStorage.getItem('doc-persona') || null);
  const [personaContinued, setPersonaContinued] = useState(false);
  const scrollToConsole = React.useRef(false);
  const [progress, setProgress] = useState(0);
  const [chapter, setChapter] = useState('01 Intro');
  const [dark, setDark] = useState(false);
  useReveal();

  useEffect(() => { initDOC(climateData); }, [climateData]);

  useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty('--tw-serif', t.displayFont);
    r.setProperty('--tw-accent', t.accent);
    const pw = t.pathways || TWEAK_DEFAULTS.pathways;
    r.setProperty('--tw-low', pw[0]);
    r.setProperty('--tw-mid', pw[1]);
    r.setProperty('--tw-high', pw[2]);
    r.setProperty('--tw-measure', t.columnWidth + 'px');
    r.setProperty('--tw-rhythm', SPACING_MAP[t.spacing] || 1);
  }, [t]);

  useEffect(() => { localStorage.setItem('doc-persona', persona); }, [persona]);

  useEffect(() => {
    if (!personaContinued || !scrollToConsole.current) return;
    scrollToConsole.current = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = document.querySelector('[data-screen-label="02 The console"]');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }, [personaContinued]);

  const handleContinue = () => {
    scrollToConsole.current = true;
    setPersonaContinued(true);
  };


  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? window.scrollY / max : 0);
      const labeled = Array.from(document.querySelectorAll('[data-screen-label]'));
      let current = labeled[0];
      for (const el of labeled) {
        if (el.getBoundingClientRect().top < window.innerHeight * 0.5) current = el;
      }
      if (current) setChapter(current.getAttribute('data-screen-label'));
      const topEl = labeled.find(el => {
        const r = el.getBoundingClientRect();
        return r.top <= 56 && r.bottom >= 56;
      });
      setDark(topEl ? (topEl.classList.contains('scene--dark') || topEl.classList.contains('timejump')) : false);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const bucket = useMemo(() => {
    const p = PERSONAS.find(x => x.id === persona) || PERSONAS[1];
    return classify(computeScore(p.values));
  }, [persona]);

  const knobValues = useMemo(() => {
    const p = PERSONAS.find(x => x.id === persona) || PERSONAS[1];
    return p.values;
  }, [persona]);

  return (
    <React.Fragment>
      <TopChrome progress={progress} chapter={chapter} dark={dark} />
      <Cover />
      <About />
      <PersonaSelect persona={persona} onPick={setPersona} onContinue={handleContinue} />
      {personaContinued && <>
        <PolicyConsole persona={persona} />
        <TimeJump persona={persona} />
        <TimelineIntro bucket={bucket} />
        {METRICS.map(m => <Chapter key={m.id} metric={m} bucket={bucket} />)}
        <SummaryTree bucket={bucket} knobValues={knobValues} />
        <Outro onRestart={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
      </>}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Type" />
        <TweakSelect label="Display font" value={t.displayFont}
          options={[
            { label: 'Bricolage (bold)', value: "'Bricolage Grotesque', system-ui, sans-serif" },
            { label: 'Instrument Serif', value: "'Instrument Serif', Georgia, serif" },
            { label: 'Georgia', value: "Georgia, 'Times New Roman', serif" },
          ]}
          onChange={v => setTweak('displayFont', v)} />
        <TweakSection label="Color" />
        <TweakColor label="Accent" value={t.accent}
          options={['#3C7B51', '#214B30', '#B4633A', '#2E4A6E', '#0E1A0B']}
          onChange={v => setTweak('accent', v)} />
        <TweakColor label="Pathways" value={t.pathways}
          options={[['#82A78A','#C49B5E','#B4633A'], ['#5E8C6A','#D98E3B','#9E3B2E'], ['#6B8F9E','#C9A24B','#A84B2F']]}
          onChange={v => setTweak('pathways', v)} />
        <TweakSection label="Layout" />
        <TweakSlider label="Column width" value={t.columnWidth} min={560} max={840} step={20} unit="px"
          onChange={v => setTweak('columnWidth', v)} />
        <TweakRadio label="Spacing" value={t.spacing} options={['tight','regular','generous','airy']}
          onChange={v => setTweak('spacing', v)} />
      </TweaksPanel>
    </React.Fragment>
  );
}

// ── Bootstrap: fetch data then render ──────────────────────
async function boot() {
  const loading = document.createElement('div');
  loading.id = '__doc_loading';
  loading.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#f8f8f6;font:14px/1 -apple-system,sans-serif;color:#888;z-index:9999';
  loading.textContent = 'Loading climate data…';
  document.body.appendChild(loading);

  try {
    const res = await fetch('data/climate-data.json');
    const climateData = await res.json();
    initDOC(climateData);
    loading.remove();
    ReactDOM.createRoot(document.getElementById('root')).render(<App climateData={climateData} />);
  } catch (err) {
    loading.textContent = 'Error loading data: ' + err.message;
    console.error('[DoC] boot error', err);
  }
}

boot();
