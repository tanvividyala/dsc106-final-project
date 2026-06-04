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
    tag: 'The IPCC curves are her north star. Decarbonize by 2050 or the math does not work.',
    img: '../images/stressed_researcher.png',
    values: { fossil: 8, renew: 92, carbon: 84, forest: 86, coop: 88, consume: 76 } },
];

const PERSONA_THOUGHTS = {
  tycoon: {
    fossil: 'Oil and gas are not optional here; they are civilization\'s scaffolding. Any phase-out is a problem for a later decade.',
    renew: 'Renewables are a supplement, not a replacement — funded where unavoidable, then quietly deprioritized.',
    carbon: 'There is no carbon tax in this framework. That conversation ends before it begins.',
    forest: 'Protected areas get lip service. Where they conflict with extraction rights, extraction wins.',
    coop: 'International agreements are PR exercises. Real decisions happen at home, for domestic benefit.',
    consume: 'Asking people to consume less is political suicide. Demand is allowed to grow unchecked.',
  },
  politician: {
    fossil: 'Fossil fuels can\'t be killed overnight without losing the next election. The decline is managed slowly.',
    renew: 'Renewables get funded — the optics are good and costs have come down. But the pace tracks the news cycle, not the atmosphere.',
    carbon: 'A carbon price gets discussed, watered down, and passed in a form that satisfies no one. Progress on paper.',
    forest: 'Conservation gets announced in election years. Enforcement is inconsistent.',
    coop: 'Summits get attended, agreements get signed, targets get set for 2050. Someone else\'s problem.',
    consume: 'Consumption reduction does not poll well. It gets quietly dropped from every platform.',
  },
  scientist: {
    fossil: 'New extraction halts this decade; existing wells phase out on a set schedule. No 1.5°C pathway includes new oil.',
    renew: 'The grid can run on renewables by 2035 — an engineering reality, not an aspiration. This framework funds it.',
    carbon: 'A price on carbon is the most powerful lever in the toolkit. Every tonne costs something; revenue is rebated.',
    forest: 'Tropical forests sequester 2.6 Gt of CO₂ a year. Every hectare is treated as load-bearing infrastructure.',
    coop: 'The Paris Agreement is the floor, not the ceiling. Shared grids and common carbon markets are the mechanisms.',
    consume: 'Absolute consumption must decline in wealthy countries. Efficiency is necessary but not sufficient.',
  },
};

const METRICS = [
  { id: 'co2',    label: 'CO₂',          unit: 'ppm', dark: false, chapter: 'Chapter Three · A', title: 'The atmosphere',
    chartTitle: 'Atmospheric CO₂ concentration',
    blurb: 'Every tonne we emit lingers for centuries. The sky keeps a perfect ledger.',
    fmt: v => Math.round(v), dom: [300, 900] },
  { id: 'temp',   label: 'Temperature',  unit: '°C',  dark: true,  chapter: 'Chapter Three · B', title: 'The heat',
    chartTitle: 'Global mean temperature anomaly',
    blurb: 'A few degrees of average is the difference between a warm world and an unlivable one.',
    fmt: v => (v >= 0 ? '+' : '') + v.toFixed(1), dom: [-0.2, 5.5] },
  { id: 'sea',    label: 'Sea level',    unit: 'cm',  dark: false, chapter: 'Chapter Three · C', title: 'The rising sea',
    chartTitle: 'Projected sea level rise',
    blurb: 'Warm water expands and ice melts. Coastlines are quietly redrawn.',
    fmt: v => (v >= 0 ? '+' : '') + Math.round(v), dom: [0, 150] },
  { id: 'precip', label: 'Drying', unit: '%',  dark: false, chapter: 'Chapter Three · D', title: 'The drying',
    chartTitle: 'Global mean precipitation change',
    blurb: 'The global average barely shifts. What shifts is where rain stops — dry regions grow drier, extremes intensify.',
    fmt: v => (v >= 0 ? '+' : '') + v.toFixed(1), dom: [-2.5, 3.5] },
];

const BEATS = {
  co2: {
    '1-2.6': [
      { year: 2030, title: 'The curve bends', body: 'Three climate bills and a decade of market pressure. The CO₂ curve crests — not enough to erase what\'s up there, but enough to change where this goes.', note: 'Concentration peaks near 428 ppm.' },
      { year: 2055, title: 'Zeroed out', body: 'Net-zero. The grid runs on wind and solar. Atmospheric concentration plateaus and starts, slowly, to fall.', note: 'First sustained decline since 1850.' },
      { year: 2100, title: 'The air starts to clear', body: 'For the first time since the Industrial Revolution, humanity pulls more carbon out of the air than it puts in. A slow exhale, 150 years in the making.', note: '≈ 410 ppm · and falling.' },
    ],
    '2-4.5': [
      { year: 2030, title: 'Slowing, not stopping', body: 'Emissions flatten as renewables scale, but fossil infrastructure is too entrenched to retreat quickly. The concentration keeps climbing.', note: 'Past 430 ppm.' },
      { year: 2055, title: 'Half-measures compound', body: 'Emissions finally start to fall — after CO₂ passes a level the atmosphere hasn\'t seen in three million years. The descent will be slow.', note: 'Past 500 ppm.' },
      { year: 2100, title: 'A different world', body: 'The concentration holds near 565 ppm, roughly double the pre-industrial baseline. Stable. Just not the world that was possible.', note: '≈ 565 ppm · holding.' },
    ],
    '5-8.5': [
      { year: 2030, title: 'All throttle', body: 'New coal and gas plants outpace retirements worldwide. The concentration climbs faster than at any point in human history.', note: 'Past 437 ppm, accelerating.' },
      { year: 2055, title: 'Uncharted air', body: 'Earth hasn\'t seen an atmosphere like this in 50 million years. The forests and oceans are straining to keep up.', note: 'Past 600 ppm.' },
      { year: 2100, title: 'The sinks give out', body: 'The Amazon and Arctic tundra have stopped absorbing carbon and started releasing it. The feedback loops are no longer a projection — they\'re the weather.', note: '≈ 870 ppm · rising.' },
    ],
  },
  temp: {
    '1-2.6': [
      { year: 2030, title: 'The rate bends', body: 'Hot summers still set records. But for the first time in decades, the rate of warming starts to ease — not enough to feel, but enough to show in the data.', note: 'Anomaly near +1.4°C.' },
      { year: 2055, title: 'A plateau', body: 'The anomaly holds near +1.5°C. Heatwaves intensify regionally, but the runaway scenarios are off the table.', note: 'Peak warming, then decline.' },
      { year: 2100, title: 'Held', body: 'Coral systems are stressed but largely intact. The Arctic thins but doesn\'t vanish in summer. A warmer world — one people can navigate.', note: '≈ +1.3°C · stabilized.' },
    ],
    '2-4.5': [
      { year: 2030, title: 'Records keep falling', body: 'Each decade sets new heat records. Adaptation becomes a permanent budget line: seawalls, cooling centers, crop adjustments.', note: 'Anomaly near +1.3°C.' },
      { year: 2055, title: 'Chronic heat', body: 'Wet-bulb temperatures cross dangerous thresholds in South Asia and the Gulf for weeks at a time. Outdoor labor gets legally restricted.', note: 'Past +1.8°C.' },
      { year: 2100, title: 'Locked in', body: 'Air conditioning is infrastructure, not comfort. Insurance markets have abandoned whole coastlines. The warming will persist for centuries.', note: '≈ +2.7°C · climbing.' },
    ],
    '5-8.5': [
      { year: 2030, title: 'Vertical', body: 'No abatement. Each summer eclipses the last. Wildfires double across the boreal north. The thermometer does not plateau.', note: 'Anomaly near +1.3°C, steepening.' },
      { year: 2055, title: 'The survivability line', body: 'Multiple regions exceed 35°C wet-bulb for weeks. At that threshold, the human body cannot cool itself outdoors, even in shade.', note: 'Past +2.3°C.' },
      { year: 2100, title: 'Near +5°C', body: 'Permafrost thaw is now releasing its own carbon. The feedback loops have engaged. The question is no longer whether this accelerates — it\'s how fast.', note: '≈ +5.0°C · accelerating.' },
    ],
  },
  sea: {
    '1-2.6': [
      { year: 2040, title: 'A steady climb', body: 'Sea level rises about 4 mm a year — slow enough that cities can plan. Seawalls get funded; managed retreat begins in the most exposed neighborhoods.', note: '≈ 11 cm above 2025.' },
      { year: 2070, title: 'Adaptation holds', body: 'Most large coastal cities are protected. Some low-lying communities have relocated inland. The ice caps thin, feeding what comes next.', note: '≈ 23 cm.' },
      { year: 2100, title: 'Thirty-five centimeters', body: 'Difficult, but adaptable. The cities that prepared in the 2030s are the ones still standing.', note: '≈ +35 cm.' },
    ],
    '2-4.5': [
      { year: 2040, title: 'The rate picks up', body: 'Greenland\'s ice sheet becomes a meaningful contributor. Insurance markets in low-lying regions begin to buckle — first the private market, then the public backstop.', note: '≈ 16 cm.' },
      { year: 2070, title: 'Selective retreat', body: 'Whole neighborhoods of Miami, Jakarta, and Lagos have been abandoned. The question is no longer whether to retreat, but who pays for it.', note: '≈ 42 cm.' },
      { year: 2100, title: 'Seventy-five centimeters', body: 'Climate-driven migration is reshaping borders. The word "coastal" is being redefined.', note: '≈ +75 cm.' },
    ],
    '5-8.5': [
      { year: 2040, title: 'The Antarctic wakes', body: 'The West Antarctic ice sheet enters runaway melt. The rate of rise doubles. What was a planning problem becomes an emergency.', note: '≈ 21 cm.' },
      { year: 2070, title: 'Coastlines erased', body: 'Multiple island nations have ceased to exist as legal territories. Cumulative rise approaches 90 cm.', note: '≈ 67 cm.' },
      { year: 2100, title: 'Past a meter', body: '135 centimeters of rise. Sea level is now one of the primary forces reshaping where people can live. It will not stop in 2100.', note: '≈ +135 cm · rising.' },
    ],
  },
  precip: {
    '1-2.6': [
      { year: 2040, title: 'Drying at the margins', body: 'Wet regions get a little wetter, dry ones a little drier. The drought belt expands slowly. The bigger story is regional, not the global mean.', note: 'Global mean +0.5%.' },
      { year: 2070, title: 'Crop belts shift', body: 'Agricultural zones move north by 200–400 km. Some regions gain arable land; arid zones grow modestly at the subtropics.', note: 'Global mean +1.4%.' },
      { year: 2100, title: 'Manageable drying', body: 'The hydrology is changed but not broken. Drought frequencies stay within the range infrastructure was built to handle.', note: '≈ +2.4%.' },
    ],
    '2-4.5': [
      { year: 2040, title: 'The mean misleads', body: 'Average change looks modest. What it hides: drought stress intensifying in the Colorado Basin, the Ganges running low, Sahel growing drier.', note: 'Global mean +0.3%.' },
      { year: 2070, title: 'Dry regions grow drier', body: 'Wet regions amplify; dry regions lose more soil moisture than the global mean suggests. The map is the story.', note: 'Global mean +1.0%.' },
      { year: 2100, title: 'Whiplash', body: 'Drying in the subtropics, flooding in the tropics. Chronic drought reshapes agriculture across three continents.', note: '≈ +1.6%.' },
    ],
    '5-8.5': [
      { year: 2040, title: 'Droughts and deluges', body: 'Extreme floods and droughts alternate in the same river basins. The Amazon shows early tipping signals as rainfall patterns destabilize.', note: 'Global mean +0.6%.' },
      { year: 2070, title: 'Soil bakes', body: 'A warmer atmosphere holds more water vapor. When it rains, it deluges. When it doesn\'t, the soil dries to record depths.', note: 'Global mean +1.7%.' },
      { year: 2100, title: 'The drying accelerates', body: 'Agricultural collapse in West Africa, catastrophic drought across South Asia. The global mean is not the story — the extremes are.', note: '≈ +2.9%.' },
    ],
  },
};

function computeScore(v) {
  return Math.round(((100 - v.fossil) + v.renew + v.carbon + v.forest + v.coop + v.consume) / 6);
}
function classify(score) {
  if (score >= 65) return { code: 'SSP1-2.6', key: '1-2.6', name: 'Sustainable',   delta: 1.3, swatch: 'var(--tw-low)' };
  if (score >= 35) return { code: 'SSP2-4.5', key: '2-4.5', name: 'Middle Road',   delta: 2.7, swatch: 'var(--tw-mid)' };
  return               { code: 'SSP5-8.5', key: '5-8.5', name: 'Fossil-Fueled', delta: 5.0, swatch: 'var(--tw-high)' };
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
  const out = [...hist, ...proj];
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
  870: 'SSP5-8.5 worst case · 2100',
};

function carbonExcessColor(i) {
  const t = Math.min(1, Math.max(0, (i - 280) / (870 - 280)));
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
function LineChart({ metric, activeKey, year, dark, dom, unit, fmt, onClickYear }) {
  const { useState, useRef, useMemo, useCallback } = React;
  const W = 1100, H = 284, pad = { t: 34, r: 22, b: 46, l: 54 };
  const [hoverYear, setHoverYear] = useState(null);
  const fg = dark ? '236,230,206' : '42,51,36';
  const accent = dark ? '#E08D5C' : 'var(--tw-accent)';

  const X0 = 1980, X1 = 2100, SPAN = 120;
  const xs = (y) => pad.l + (y - X0) / SPAN * (W - pad.l - pad.r);
  const ys = (v) => H - pad.b - (v - dom[0]) / (dom[1] - dom[0]) * (H - pad.t - pad.b);

  const data = useMemo(() => generateFullCurve(metric, activeKey), [metric, activeKey]);

  const seg = (a, b) => {
    let d = '';
    for (const p of data) {
      if (p.year < a || p.year > b) continue;
      d += (d ? ' L ' : 'M ') + xs(p.year).toFixed(1) + ' ' + ys(p.val).toFixed(1);
    }
    return d;
  };

  const xticks = [1980, 2000, 2025, 2050, 2075, 2100];
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
      <div className="lc-title">{metricChartTitle} · {SSP_NAMES[activeKey]} pathway</div>
      <svg viewBox={`0 0 ${W} ${H}`} onMouseMove={onMove} onMouseLeave={() => setHoverYear(null)} onClick={onClick} style={{ cursor: onClickYear ? 'pointer' : 'default' }}>
        <text x={11} y={chartMidY} textAnchor="middle" fontFamily="var(--mono)" fontSize="13" fill={`rgba(${fg},0.45)`}
          transform={`rotate(-90, 11, ${chartMidY})`}>{unit}</text>
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
        <line x1={xs(2025)} y1={pad.t - 2} x2={xs(2025)} y2={H - pad.b} stroke={`rgba(${fg},0.32)`} strokeWidth="1" strokeDasharray="3 3" />
        <text x={xs(2025)} y={pad.t - 6} textAnchor="middle" fontFamily="var(--mono)" fontSize="12" letterSpacing="0.1em" fill={`rgba(${fg},0.5)`}>2025</text>
        <path d={seg(X0, 2025)} fill="none" stroke={`rgba(${fg},0.55)`} strokeWidth="2" strokeLinecap="round" />
        <path d={seg(2025, X1)} fill="none" stroke={PATH_VARS[activeKey]} strokeWidth="1.5" opacity="0.3" />
        <path d={seg(2025, Math.min(2100, year))} fill="none" stroke={PATH_VARS[activeKey]} strokeWidth="3" strokeLinecap="round" />
        <circle cx={xs(Math.min(2100, year))} cy={ys(curVal)} r="5" fill={PATH_VARS[activeKey]} stroke={dark ? '#0E1A0B' : '#FAF9F3'} strokeWidth="2" />
        {hoverYear != null &&
          <line x1={xs(hoverYear)} y1={pad.t} x2={xs(hoverYear)} y2={H - pad.b} stroke={accent} strokeWidth="1" opacity="0.6" />
        }
      </svg>
      {tip &&
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
          <div className="tip-foot">{tip.hist ? 'Observed record · CMIP6 historical' : SSP_NAMES[activeKey] + ' pathway'} · MPI-ESM1-2-LR</div>
        </div>
      }
    </div>
  );
}

// ── Multi-scenario line chart (all 3 SSPs at once) ──────────
function MultiLineChart({ metric, dark, dom, unit, fmt, hideTitle = false }) {
  const { useState, useMemo } = React;
  const W = 960, H = 290, pad = { t: 36, r: 24, b: 48, l: 62 };
  const [hoverYear, setHoverYear] = useState(null);
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
  };

  const SSP_COLORS = { '1-2.6': 'var(--tw-low)', '2-4.5': 'var(--tw-mid)', '5-8.5': 'var(--tw-high)' };
  const SSP_LABELS = { '1-2.6': 'Sustainable', '2-4.5': 'Middle Road', '5-8.5': 'Fossil-Fueled' };

  const metricObj2 = METRICS.find(m => m.id === metric) || {};
  const metricLabel = metricObj2.label || metric;
  const metricChartTitle2 = metricObj2.chartTitle || metricLabel;
  const multiMidY = pad.t + (H - pad.t - pad.b) / 2;

  return (
    <div className="chart-wrap" style={{ position: 'relative' }}>
      {!hideTitle && <div className="lc-title">{metricChartTitle2} · all three pathways</div>}
      <svg viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%', height: 'auto' }}
        onMouseMove={onMove} onMouseLeave={() => setHoverYear(null)}>
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
      {/* Hover values tooltip */}
      {hoverYear != null && (
        <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(250,249,247,0.98)', border: '1px solid rgba(42,51,36,0.14)', borderRadius: 10, padding: '10px 16px', pointerEvents: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', color: 'rgba(42,51,36,0.5)', marginBottom: 8 }}>{hoverYear}</div>
          {SSPS.map(k => (
            <div key={k} style={{ display: 'flex', gap: 16, justifyContent: 'space-between', minWidth: 210, marginBottom: 4, alignItems: 'baseline' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'rgba(42,51,36,0.55)' }}>{SSP_LABELS[k]}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: SSP_COLORS[k], fontWeight: 600 }}>{fmt(valOf(k, hoverYear))} {unit}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Mercury thermometer ─────────────────────────────────────
function Thermometer({ value, dark }) {
  const W = 200, H = 380, TMAX = 5.5;
  const cx = 84, tubeW = 30, innerW = 15;
  const tt = 24, bulbCy = 330, bulbR = 30;
  const scaleTop = tt + 16, scaleBot = bulbCy - 10;
  const yFor = (t) => scaleBot - Math.max(0, Math.min(1, t / TMAX)) * (scaleBot - scaleTop);
  const mercY = yFor(value);
  const fg = dark ? '236,230,206' : '42,51,36';
  const red = value < 1.5 ? '#5C9468' : value < 2 ? '#C9923E' : value < 3 ? '#E0773C' : '#D33C28';
  const glass = dark ? 'rgba(248,246,236,0.93)' : 'rgba(255,255,255,0.96)';
  const outline = `rgba(${fg},0.38)`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto">
      <rect x={cx - tubeW / 2} y={tt} width={tubeW} height={bulbCy - tt + 6} rx={tubeW / 2} fill={glass} stroke={outline} strokeWidth="2" />
      <circle cx={cx} cy={bulbCy} r={bulbR} fill={glass} stroke={outline} strokeWidth="2" />
      <circle cx={cx} cy={bulbCy} r={bulbR - 5} fill={red} />
      <rect x={cx - innerW / 2} y={mercY} width={innerW} height={bulbCy - mercY} fill={red} rx={innerW / 2} />
      <circle cx={cx} cy={mercY} r={innerW / 2 + 1} fill={red} />
      <rect x={cx - tubeW / 2 + 5} y={tt + 8} width="4" height={bulbCy - tt - 34} rx="2" fill="rgba(255,255,255,0.5)" />
      {[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(t => {
        const major = Number.isInteger(t);
        return <g key={t}>
          <line x1={cx + tubeW / 2 + 2} y1={yFor(t)} x2={cx + tubeW / 2 + (major ? 12 : 7)} y2={yFor(t)} stroke={`rgba(${fg},0.5)`} strokeWidth="1" />
          {major && <text x={cx + tubeW / 2 + 17} y={yFor(t) + 4} fontFamily="var(--mono)" fontSize="13" fill={`rgba(${fg},0.6)`}>{t}°</text>}
        </g>;
      })}
      <line x1={cx - tubeW / 2 - 14} y1={mercY} x2={cx - tubeW / 2 - 2} y2={mercY} stroke={red} strokeWidth="2" />
      <text x={cx - tubeW / 2 - 18} y={mercY + 4} textAnchor="end" fontFamily="var(--mono)" fontSize="15" fill={red}>{value >= 0 ? '+' : ''}{value.toFixed(1)}°</text>
    </svg>
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
  const { useState } = React;
  const [showWaterTip, setShowWaterTip] = useState(false);
  const [tipPos, setTipPos] = useState({ x: 0, y: 0 });
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
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    setTipPos({ x: ((e.clientX - rect.left) / rect.width) * w, y: ((e.clientY - rect.top) / rect.height) * h });
    setShowWaterTip(true);
  };
  const SST_ANOMALY = (tempValue * 0.72).toFixed(1); // ocean warms ~72% of land warming rate

  return (
    <div style={{ position: 'relative', width: '100%' }}>
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
          onMouseMove={onWaterMove} onMouseLeave={() => setShowWaterTip(false)} style={{ cursor: 'crosshair' }} />
        <path d={`M 0 ${seaY} Q 20 ${seaY - 3} 40 ${seaY} T 80 ${seaY} T 120 ${seaY} T 160 ${seaY} T 200 ${seaY} T 240 ${seaY} T 280 ${seaY} T 320 ${seaY} L 340 ${seaY}`} stroke="#fff" strokeWidth="0.8" fill="none" opacity="0.45" style={{ pointerEvents: 'none' }} />
        <text x="6" y="22" fontFamily="var(--mono)" fontSize="12" letterSpacing="0.16em" fill={soft}>{year} · CUMULATIVE RISE</text>
        <text x="6" y="56" fontFamily="var(--serif)" fontSize="36" fill="#0E1A0B">+{Math.round(value)}<tspan fontFamily="var(--mono)" fontSize="14" fill={soft}> cm</tspan></text>
        {/* thermometer sst indicator */}
        <text x="6" y="76" fontFamily="var(--mono)" fontSize="11" letterSpacing="0.1em" fill={`rgba(${fg},0.5)`}>OCEAN SURFACE: +{SST_ANOMALY}°C VS 1980</text>
      </svg>
      {showWaterTip && (
        <div className="sea-water-tip" style={{ left: `${(tipPos.x / w) * 100}%`, top: `${(tipPos.y / h) * 100}%` }}>
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
  const iceExtent = Math.max(0.04, rawExtent / MAX_HIST_ICE);
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
      <text x={CX} y="312" textAnchor="middle" fontFamily="var(--mono)" fontSize="11" fill={soft} opacity="0.75">{year} · CMIP6 MPI-ESM1-2-LR siconc</text>
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
        <text x="6" y={H - 8} fontFamily="var(--mono)" fontSize="11" fill={`rgba(${fg},0.4)`}>SOURCE: CMIP6 temperature anomaly → vegetation heat stress model</text>
      </svg>
      {hovering && (
        <div className="grass-tip">
          <div className="tip-year"><span>VEGETATION HEAT STRESS</span></div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 700, margin: '4px 0 2px', color: stressColor }}>{stressLabel} STRESS</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, opacity: 0.65, margin: '4px 0 8px', letterSpacing: '0.06em' }}>+{tempValue.toFixed(1)}°C surface anomaly</div>
          <div style={{ borderTop: '1px solid rgba(42,51,36,0.12)', paddingTop: 8, fontSize: 11, lineHeight: 1.6, opacity: 0.8 }}>
            As temperatures rise, soil moisture drops and vegetation wilts. This chart shows projected vegetation health using CMIP6 surface temperature anomaly as a heat stress proxy. Each blade represents local variability.
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, opacity: 0.5, marginTop: 8, letterSpacing: '0.04em' }}>
            Data: MPI-ESM1-2-LR · CMIP6 · tas anomaly
          </div>
        </div>
      )}
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
    <div style={{ position: 'absolute', top: 0, right: 0, width: 300, height: 300, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <svg viewBox="0 0 300 300" width="300" height="300">
        <defs>
          <radialGradient id="sunHalo" cx="100%" cy="0%" r="80%">
            <stop offset="0%" stopColor={col} stopOpacity={lerp(0.18, 0.42, intensity)} />
            <stop offset="60%" stopColor={col} stopOpacity={lerp(0.04, 0.12, intensity)} />
            <stop offset="100%" stopColor={col} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="300" height="300" fill="url(#sunHalo)" />
        {rays.map((r, i) => (
          <line key={i} x1={r.x1.toFixed(1)} y1={r.y1.toFixed(1)} x2={r.x2.toFixed(1)} y2={r.y2.toFixed(1)}
            stroke={col} strokeWidth={lerp(1.8, 3.5, intensity).toFixed(1)} strokeLinecap="round"
            opacity={lerp(0.45, 0.9, intensity).toFixed(2)} />
        ))}
        <circle cx={cx} cy={cy} r={lerp(90, 140, intensity)} fill={col} opacity={lerp(0.06, 0.14, intensity).toFixed(2)} />
        <circle cx={cx} cy={cy} r={coreR.toFixed(1)} fill={col} opacity="0.95" />
      </svg>
    </div>
  );
}

// ── Smoke clouds (co2 section background) ──────────────────
function SmokeClouds({ co2Value = 420 }) {
  const { useMemo } = React;
  const intensity = Math.min(1, Math.max(0, (co2Value - 415) / (700 - 415)));
  const W = 1200, H = 900;
  const clouds = useMemo(() => {
    let seed = 77;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const all = [];
    for (let i = 0; i < 24; i++) {
      const scale = 0.7 + rnd() * 1.2;
      const baseOp = 0.28 + rnd() * 0.18;
      const n = 3 + Math.floor(rnd() * 3);
      const puffs = [];
      // flat base ellipse
      puffs.push({ type: 'e', x: 0, y: 12 * scale, rx: 55 * scale, ry: 18 * scale });
      // bumpy top circles spread left to right
      for (let j = 0; j < n; j++) {
        const t = (j + 0.5) / n;
        const bx = (t - 0.5) * 90 * scale;
        const br = (18 + rnd() * 28) * scale;
        puffs.push({ type: 'c', x: bx, y: -(br * 0.5 + rnd() * 8 * scale), r: br });
      }
      all.push({
        cx: 80 + rnd() * (W - 160),
        cy: 80 + rnd() * (H - 100),
        puffs, baseOp,
        dur: (8 + rnd() * 14).toFixed(1),
        opDur: (7 + rnd() * 9).toFixed(1),
        dx: (rnd() - 0.5) * 60,
        dy: -18 - rnd() * 38,
        delay: (-rnd() * 14).toFixed(1),
      });
    }
    return all;
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden',
      opacity: intensity, transition: 'opacity 1.8s ease' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
        {clouds.map((c, i) => (
          <g key={i} opacity={c.baseOp}>
            <animateTransform attributeName="transform" type="translate"
              values={`${c.cx},${c.cy}; ${(c.cx+c.dx).toFixed(1)},${(c.cy+c.dy).toFixed(1)}; ${c.cx},${c.cy}`}
              keyTimes="0;0.5;1" calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1"
              dur={`${c.dur}s`} repeatCount="indefinite" begin={`${c.delay}s`} />
            <animate attributeName="opacity"
              values={`${c.baseOp.toFixed(3)};${Math.min(0.6,c.baseOp*1.2).toFixed(3)};${(c.baseOp*0.75).toFixed(3)};${c.baseOp.toFixed(3)}`}
              dur={`${c.opDur}s`} repeatCount="indefinite" begin={`${c.delay}s`} />
            {c.puffs.map((p, j) =>
              p.type === 'c'
                ? <circle key={j} cx={p.x} cy={p.y} r={p.r} fill="rgba(195,205,215,1)" />
                : <ellipse key={j} cx={p.x} cy={p.y} rx={p.rx} ry={p.ry} fill="rgba(195,205,215,1)" />
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

window.VIZ = { Dial, CarbonBlocks, LineChart, Thermometer, WarmingStripes, SeaLevel, IceCaps, GrassField };

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
    <section className="scene cover" data-screen-label="01 Cover">
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
        <p className="lede reveal" style={{ maxWidth: '44ch', fontSize: 'clamp(20px, 2.6vw, 26px)' }}>The decisions that shape the next century are being made right now — through votes, boardrooms, and budgets. Pick a seat at the table and see what your choices leave behind.</p>
        <p className="body reveal" style={{ fontSize: 19, lineHeight: 1.75, maxWidth: '58ch' }}>
          This story is built on <strong>CMIP6</strong> climate-model data — the same projections used by
          the Intergovernmental Panel on Climate Change (IPCC). We surface three plausible futures, each
          one shaped by a different set of human decisions compounded over 75 years. Pick a worldview,
          watch the model run it forward to 2100, and see the world it produces.
        </p>
        <div className="reveal" style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'center', paddingTop: 8 }}>
          {[['var(--tw-low)', 'Sustainable', '+1.3°C'], ['var(--tw-mid)', 'Middle Road', '+2.7°C'], ['var(--tw-high)', 'Fossil-Fueled', '+5.0°C']].map(([c, n, d]) =>
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <span style={{ width: 14, height: 14, borderRadius: '50%', background: c, flexShrink: 0 }} />
              <span><span className="label" style={{ display: 'block' }}>{n}</span><b style={{ fontFamily: 'var(--tw-serif)', fontSize: 26 }}>{d}</b></span>
            </div>
          )}
        </div>
        <p className="label reveal" style={{ marginTop: 8, opacity: 0.55 }}>Data · CMIP6 · MPI-ESM1-2-LR · NOAA / Google Cloud · 1980–2100</p>
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
          {p.name}'s worldview sets each lever automatically — this is what their priorities look like as policy.
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
    [0.00, 'The room empties. The decisions begin to settle.'],
    [0.22, 'The atmosphere keeps a perfect ledger.'],
    [0.44, 'Children born during the meeting are writing the headlines.'],
    [0.66, 'The atmosphere keeps a perfect ledger.'],
    [0.86, 'The future arrives. On schedule.'],
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
          rising seas, and the water cycle. Each one reflects the same underlying choice — your pathway.
        </p>
        <div className="reveal pathway-tag">
          <span className="sw" style={{ background: bucket.swatch }} />
          Your pathway · {bucket.code} · {bucket.name} · +{bucket.delta.toFixed(1)}°C by 2100
        </div>
        <p className="label reveal" style={{ marginTop: 4, opacity: 0.5 }}>Data · MPI-ESM1-2-LR · CMIP6 · 1980–2100</p>
      </div>
    </section>
  );
}

// ── Metric chapter ──────────────────────────────────────────
function Chapter({ metric, bucket }) {
  const { useRef, useState, useEffect } = React;
  const ref = useRef(null);
  const [prog, setProg] = useState(0);
  const M = metric;
  const sspKey = bucket.key;

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

  const Viz = () => {
    if (M.id === 'temp') return <Thermometer value={value} dark={M.dark} />;
    if (M.id === 'co2') return <div className="viz-box"><CarbonBlocks value={value} year={yc} /></div>;
    if (M.id === 'sea') return <SeaLevel value={value} year={yc} dark={false} />;
    if (M.id === 'precip') return <div className="viz-box"><GrassField tempValue={tempVal} /></div>;
    return null;
  };

  const sceneClass = M.dark ? ' scene--dark' : M.id === 'precip' ? ' scene--alt' : '';

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

  return (
    <section className={'scene chapter chapter--tall chapter--' + M.id + sceneClass} ref={ref} data-screen-label={M.chapter + ' · ' + M.title} style={{ padding: 0 }}>
      <div className="chapter-sticky2">
        {M.id === 'temp' && <Sun tempValue={tempVal} />}
        {M.id === 'co2' && <SmokeClouds co2Value={value} />}
        <div className="metric-comp" style={{ position: 'relative', zIndex: 1 }}>
          <div className="mc-narr">
            <div className="eyebrow">{M.chapter}</div>
            <div className="metric-section-title">{M.title}</div>
            <div className="mc-beat" key={activeStep} style={{ marginTop: 0 }}>
              <div className="mc-year">{year}</div>
              <h3 style={{ fontFamily: 'var(--tw-serif)', margin: '8px 0 10px' }}>{b.title}</h3>
              <p style={{ margin: 0 }}>{b.body}</p>
              <div className="mc-note">{b.note}</div>
            </div>
            {M.id === 'sea' && <div className="mc-ice"><IceCaps sspKey={sspKey} year={yc} dark={false} /></div>}
          </div>
          <div className="mc-viz"><Viz /></div>
          <div className="mc-chart">
            <div className="mc-chart-head">
              <div>
                <div className="vt">{M.label} · {year}</div>
                <div className="vv">{M.fmt(value)}<span className="u">{M.unit}</span></div>
              </div>
            </div>
            <LineChart metric={M.id} activeKey={sspKey} year={yc} dark={M.dark} dom={M.dom} unit={M.unit} fmt={M.fmt} onClickYear={handleChartClick} />
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Summary tree ────────────────────────────────────────────
const TREE_PATHS = {
  '1-2.6': { code: 'SSP1-2.6', name: 'Sustainable',   delta: 1.3, swatch: 'var(--tw-low)' },
  '2-4.5': { code: 'SSP2-4.5', name: 'Middle Road',   delta: 2.7, swatch: 'var(--tw-mid)' },
  '5-8.5': { code: 'SSP5-8.5', name: 'Fossil-Fueled', delta: 5.0, swatch: 'var(--tw-high)' },
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

  // rAF-based interpolation state
  const [displaySev, setDisplaySev] = useState(TREE_SEVERITY[bucket.key] ?? 0.52);
  const initialVals = useMemo(() => {
    const v = {};
    ['temp', 'sea', 'precip', 'co2'].forEach(id => { v[id] = valAt(id, bucket.key, 2100); });
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
    ['temp', 'sea', 'precip', 'co2'].forEach(id => { targetVals[id] = valAt(id, newView, 2100); });
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

  const W = 1000, H = 700, groundY = 565, baseX = 500, forkX = 500, forkY = 350;

  // Three branches (CO₂ is now the trunk)
  const treeMetrics = [
    { id: 'temp',    label: 'Temperature', tip: [205, 205], subTips: [[278, 172]], unit: '°C',  desc: 'Surface temp anomaly by 2100',   leafShape: 'spiky',    dataId: 'temp' },
    { id: 'sea',     label: 'Sea Level',   tip: [500, 158], subTips: [[432, 178],[568,178]], unit: 'cm',  desc: 'Sea level rise above 2025',      leafShape: 'teardrop', dataId: 'sea' },
    { id: 'drought', label: 'Drying',      tip: [795, 205], subTips: [[722, 172]], unit: '%',   desc: 'Dry regions lose soil moisture',  leafShape: 'jagged',   dataId: 'precip' },
  ];
  const fmts = {
    temp:    v => (v >= 0 ? '+' : '') + v.toFixed(1),
    sea:     v => '+' + Math.round(v),
    drought: v => (v >= 0 ? '+' : '') + v.toFixed(1),
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

  // Crack lines in dry ground
  const cracks = [];
  if (sev > 0.5) {
    let cs = 12345;
    const cr = () => (cs = (cs * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    for (let i = 0; i < Math.round((sev - 0.5) * 20); i++) {
      const x = 80 + cr() * (W - 160), y = groundY + 8 + cr() * 26;
      const len = 10 + cr() * 40, angle = (cr() - 0.5) * 1.2;
      cracks.push({ x, y, len, angle });
    }
  }

  // Selected metric for chart panel (including CO₂ trunk)
  const handleCardClick = (id) => setSelectedMetric(selectedMetric === id ? null : id);

  // Look up METRICS def for the chart panel
  const getMetricDef = (id) => METRICS.find(m => m.id === id) || METRICS[0];

  const co2Val = displayVals['co2'] ?? valAt('co2', view, 2100);

  return (
    <section className="scene summary" data-screen-label="03 The whole picture" style={{ background: `linear-gradient(180deg, ${skyCol} 0%, var(--bg) 60%)` }}>
      <div className="col--wide">
        <div className="eyebrow reveal" style={{ marginBottom: 18 }}>Chapter Three · E · The whole picture</div>
        <h2 className="h2 reveal" style={{ maxWidth: '28ch' }}>Compare three climate futures.</h2>
        <p className="lede reveal" style={{ maxWidth: '54ch', marginTop: 10, color: 'var(--ink-soft)', fontSize: 16 }}>
          CO₂ is the trunk. Policy choices feed the roots — every tonne branches into temperature, sea level, and drying. Click any card to see how each pathway compares.
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
            </defs>
            <rect x="0" y="0" width={W} height={groundY} fill="url(#skyGrad)" />

            {/* Ground */}
            <rect x="0" y={groundY} width={W} height={H - groundY} fill={groundCol} />
            <rect x="0" y={groundY} width={W} height="4" fill={`rgba(42,51,36,${lerp(0.18, 0.08, sev)})`} />

            {/* Policy roots — buttress arches visible above ground surface */}
            {ROOTS_DEF.map((r, i) => {
              const t = i / (ROOTS_DEF.length - 1);
              const rootEndX = 195 + t * 610;
              const dist = Math.abs(rootEndX - baseX);
              const archH = dist * 0.14 + 10;
              const midX = (baseX + rootEndX) / 2;
              const val = displayRoots ? (displayRoots[r.id] ?? 50) : 50;
              const rootGood = r.bad ? (100 - val) / 100 : val / 100;
              const rootW = lerp(1.5, 8, rootGood);
              const rootColor = r.bad
                ? mix([180, 99, 58], [70, 55, 42], rootGood)
                : mix([70, 55, 42], [58, 128, 70], rootGood);
              return (
                <g key={r.id}>
                  <path d={`M ${baseX} ${groundY - 3} Q ${midX} ${groundY - archH} ${rootEndX} ${groundY - 3}`}
                    stroke={rootColor} strokeWidth={rootW} fill="none" strokeLinecap="round" />
                  <text x={midX} y={groundY - archH - 5}
                    textAnchor="middle" fontFamily="var(--mono)" fontSize="10"
                    letterSpacing="0.07em" fill={rootColor} opacity="0.9">{r.short.toUpperCase()}</text>
                </g>
              );
            })}

            {/* Dry cracks */}
            {cracks.map((c, i) => (
              <line key={i} x1={c.x} y1={c.y}
                x2={c.x + Math.cos(c.angle) * c.len} y2={c.y + Math.sin(c.angle) * c.len}
                stroke="rgba(42,30,16,0.35)" strokeWidth="1" />
            ))}

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
                    <text x="186" y="114" textAnchor="end" fontFamily="var(--mono)" fontSize="10" fill={meta.swatch} opacity="0.6">↗ chart</text>
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
                    <text x="14" y="72" fontFamily="var(--serif)" fontSize="40" fill="#0E1A0B">{Math.round(co2Val)}<tspan fontFamily="var(--mono)" fontSize="15" fill="rgba(42,51,36,0.5)"> ppm</tspan></text>
                    <foreignObject x="12" y="82" width="172" height="28">
                      <div xmlns="http://www.w3.org/1999/xhtml" style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'rgba(42,51,36,0.38)', lineHeight: '1.45', letterSpacing: '0.05em' }}>
                        Atmospheric CO₂ concentration
                      </div>
                    </foreignObject>
                    <text x={cardW - 14} y={cardH - 8} textAnchor="end" fontFamily="var(--mono)" fontSize="10" fill={meta.swatch} opacity="0.6">↗ chart</text>
                  </g>
                </g>
              );
            })()}

            {/* Pathway label */}
            <rect x={baseX - 200} y={groundY + 42} width="400" height="28" rx="6" fill={`rgba(42,51,36,${lerp(0.06, 0.12, sev)})`} />
            <text x={baseX} y={groundY + 61} textAnchor="middle" fontFamily="var(--mono)" fontSize="13" letterSpacing="0.14em" fill="rgba(42,51,36,0.65)">PATHWAY · {meta.code} · {meta.name.toUpperCase()} · +{meta.delta.toFixed(1)}°C BY 2100</text>

            {/* Leaf density legend — top-left sky area */}
            <rect x={8} y={8} width={192} height={46} rx={8} fill="rgba(250,249,247,0.92)" stroke="rgba(42,51,36,0.13)" strokeWidth={1} />
            <text x={20} y={29} fontFamily="var(--mono)" fontSize="9.5" letterSpacing="0.1em" fill="rgba(42,51,36,0.6)">LEAF DENSITY ENCODES</text>
            <text x={20} y={44} fontFamily="var(--mono)" fontSize="9" fill="rgba(42,51,36,0.48)">More = healthier · Fewer = stressed</text>
          </svg>
        </div>
        <p className="label reveal" style={{ marginTop: 10, opacity: 0.5 }}>Data: CMIP6 MPI-ESM1-2-LR · 2100 projections</p>
      </div>

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
            Demanding those policies — and holding governments to account when they stall — is the lever that
            actually moves the models.
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
          <b>Issue</b>Vol. 01 · 2026<br />UCSD · DSC 106
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
  const [chapter, setChapter] = useState('01 Cover');
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
      const el = document.querySelector('[data-screen-label="02 The console"]');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    const res = await fetch('../data/climate-data.json');
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
