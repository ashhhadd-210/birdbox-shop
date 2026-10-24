/* Generates the product illustrations as flat SVG files into public/img.
   Run: node tools/make-images.js  */
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'public', 'img');
fs.mkdirSync(OUT, { recursive: true });

const W = 640, H = 520;

const WOODS = {
  cedar:   { light: '#c98f5b', mid: '#b0743f', dark: '#8a5628', edge: '#6d4320' },
  pine:    { light: '#dcb887', mid: '#c69c68', dark: '#a37a48', edge: '#7f5c33' },
  fir:     { light: '#d3a877', mid: '#bb8d5c', dark: '#966b3f', edge: '#74512d' },
  oak:     { light: '#b98a55', mid: '#9d6f3f', dark: '#7a5329', edge: '#5d3e1d' },
  charred: { light: '#4d4a48', mid: '#3b3937', dark: '#2a2827', edge: '#1c1b1a' },
  ply:     { light: '#5f5346', mid: '#4b4239', dark: '#3a332c', edge: '#2a251f' },
  crete:   { light: '#b8b2a4', mid: '#9d9689', dark: '#807a6f', edge: '#635e55' },
  birch:   { light: '#e0c9a2', mid: '#cbb188', dark: '#a98f68', edge: '#846f50' },
};

/* ---------- small helpers ---------- */

const grain = (x, y, w, h, wood, seed = 1) => {
  let s = '';
  let r = seed * 9301;
  const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  const lines = Math.max(3, Math.round(h / 22));
  for (let i = 0; i < lines; i++) {
    const yy = y + (h / (lines + 1)) * (i + 1) + (rnd() - 0.5) * 4;
    const bow = 4 + rnd() * 8;
    s += `<path d="M${x + 3} ${yy.toFixed(1)} q${w / 2} ${(rnd() > 0.5 ? bow : -bow).toFixed(1)} ${w - 6} 0"
      fill="none" stroke="${wood.edge}" stroke-opacity="${(0.1 + rnd() * 0.14).toFixed(2)}" stroke-width="1.6" stroke-linecap="round"/>`;
  }
  return s;
};

const plank = (x, y, w, h, wood, seed, rx = 3) => `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="url(#face-${wood.key})"/>
  ${grain(x, y, w, h, wood, seed)}
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="none" stroke="${wood.edge}" stroke-opacity=".55" stroke-width="2"/>`;

/* entrance hole with a dark, slightly domed interior */
const hole = (cx, cy, r) => `
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#cavity)"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#2a1c0f" stroke-opacity=".5" stroke-width="2"/>
  <path d="M${cx - r * 0.72} ${cy - r * 0.45} a${r * 0.8} ${r * 0.8} 0 0 1 ${r * 1.1} ${-r * 0.15}"
    fill="none" stroke="#fff" stroke-opacity=".14" stroke-width="3" stroke-linecap="round"/>`;

const slot = (x, y, w, h) => `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="url(#cavity)"/>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="none" stroke="#2a1c0f" stroke-opacity=".45" stroke-width="1.8"/>`;

/* a perched bird, drawn as a simple silhouette */
const bird = (x, y, s, fill, flip = false) => `
  <g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})">
    <path d="M0 0 c-9 -1 -16 -8 -16 -18 0 -12 8 -22 19 -22 8 0 14 4 17 10 l14 -6 -9 10 c3 4 4 9 4 14 0 13 -11 22 -25 22 z"
      fill="${fill}"/>
    <path d="M4 -30 l11 -4 -8 8 z" fill="#e8a33d"/>
    <circle cx="6" cy="-33" r="1.9" fill="#1d1a17"/>
    <path d="M-10 -14 q10 -6 20 -2 q-8 10 -20 2 z" fill="#000" fill-opacity=".16"/>
    <path d="M-4 4 l0 7 M4 4 l0 7" stroke="#8a6a3a" stroke-width="2.2" stroke-linecap="round"/>
  </g>`;

const leaves = () => `
  <g opacity=".9">
    <path d="M52 470 q26 -52 76 -60 q-14 48 -76 60 z" fill="#4a7c4e" fill-opacity=".85"/>
    <path d="M96 476 q34 -34 84 -30 q-26 36 -84 30 z" fill="#5d9160" fill-opacity=".8"/>
    <path d="M588 468 q-30 -48 -80 -56 q16 46 80 56 z" fill="#43724a" fill-opacity=".8"/>
    <path d="M540 478 q-36 -30 -84 -26 q28 34 84 26 z" fill="#5d9160" fill-opacity=".7"/>
  </g>`;

const frame = (woodKey, body, accent = '#8fb996') => {
  const wood = { ...WOODS[woodKey], key: woodKey };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f7f4ec"/><stop offset="1" stop-color="#e8eee3"/>
    </linearGradient>
    <radialGradient id="cavity" cx=".38" cy=".32" r=".85">
      <stop offset="0" stop-color="#4a3520"/><stop offset=".6" stop-color="#2b1e12"/><stop offset="1" stop-color="#150f09"/>
    </radialGradient>
    <linearGradient id="face-${woodKey}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${wood.light}"/><stop offset=".55" stop-color="${wood.mid}"/><stop offset="1" stop-color="${wood.dark}"/>
    </linearGradient>
    <linearGradient id="roof-${woodKey}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${wood.mid}"/><stop offset="1" stop-color="${wood.edge}"/>
    </linearGradient>
    <linearGradient id="side-${woodKey}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${wood.dark}"/><stop offset="1" stop-color="${wood.edge}"/>
    </linearGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="14"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <circle cx="${W / 2}" cy="245" r="185" fill="${accent}" fill-opacity=".22"/>
  <ellipse cx="${W / 2}" cy="452" rx="150" ry="26" fill="#3f5a3f" fill-opacity=".16" filter="url(#soft)"/>
  ${leaves()}
  ${body(wood)}
</svg>
`;
};

/* ---------- one builder per box form ---------- */

/* classic pitched-roof nest box, seen slightly from the left */
const classicBox = (holeR, opts = {}) => (wood) => {
  const x = 218, y = 168, w = 200, h = 218;
  const sideW = 34;
  return `
  <g>
    <!-- back board -->
    ${plank(x - 6, y - 14, w + 12, 16, wood, 7, 2)}
    <!-- side (depth) -->
    <path d="M${x + w} ${y + 8} l${sideW} -22 l0 ${h - 16} l${-sideW} 22 z" fill="url(#side-${wood.key})"/>
    <path d="M${x + w} ${y + 8} l${sideW} -22 l0 ${h - 16} l${-sideW} 22 z" fill="none" stroke="${wood.edge}" stroke-opacity=".5" stroke-width="2"/>
    <!-- front face -->
    ${plank(x, y + 8, w, h, wood, 3)}
    <!-- roof: pitched, overhanging -->
    <path d="M${x - 26} ${y + 14} l${w / 2 + 26} ${-58} l${w / 2 + 26 + sideW} ${58 - 22} l${-sideW} 22 z"
      fill="url(#roof-${wood.key})"/>
    <path d="M${x - 26} ${y + 14} l${w / 2 + 26} ${-58} l${w / 2 + 26 + sideW} ${58 - 22}"
      fill="none" stroke="${wood.edge}" stroke-opacity=".65" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M${x + w / 2} ${y - 44} l0 0" />
    <!-- ridge shadow under roof -->
    <rect x="${x}" y="${y + 8}" width="${w}" height="14" fill="#2a1c0f" fill-opacity=".18"/>
    ${hole(x + w / 2, y + 86, holeR)}
    ${opts.perch ? `<rect x="${x + w / 2 - 4}" y="${y + 86 + holeR + 12}" width="8" height="26" rx="4" fill="${wood.edge}"/>` : ''}
    <!-- hinge + catch on the front panel -->
    <rect x="${x + 12}" y="${y + h - 34}" width="26" height="6" rx="3" fill="${wood.edge}" fill-opacity=".7"/>
    <circle cx="${x + w - 26}" cy="${y + h - 31}" r="5" fill="#8d959b"/>
    ${bird(x + w / 2 + 4, y + 82 + holeR + 46, 1.15, '#6b7f92')}
  </g>`;
};

/* open-fronted robin box */
const openFront = () => (wood) => {
  const x = 224, y = 176, w = 194, h = 206, sideW = 32;
  return `
  <g>
    <path d="M${x + w} ${y + 8} l${sideW} -22 l0 ${h - 16} l${-sideW} 22 z" fill="url(#side-${wood.key})"/>
    ${plank(x, y + 8, w, h, wood, 5)}
    <!-- open upper front: dark cavity with a nest inside -->
    <path d="M${x + 12} ${y + 22} h${w - 24} v${h * 0.42} h${-(w - 24)} z" fill="url(#cavity)"/>
    <path d="M${x + 26} ${y + 22 + h * 0.42 - 26} q${(w - 52) / 2} -22 ${w - 52} 0 v26 h${-(w - 52)} z" fill="#7a6647"/>
    <path d="M${x + 26} ${y + 22 + h * 0.42 - 26} q${(w - 52) / 2} -22 ${w - 52} 0" fill="none" stroke="#5c4b33" stroke-width="2"/>
    <!-- front sill -->
    ${plank(x + 6, y + 22 + h * 0.42, w - 12, 30, wood, 11, 2)}
    <path d="M${x - 26} ${y + 14} l${w / 2 + 26} ${-58} l${w / 2 + 26 + sideW} ${58 - 22} l${-sideW} 22 z" fill="url(#roof-${wood.key})"/>
    <path d="M${x - 26} ${y + 14} l${w / 2 + 26} ${-58} l${w / 2 + 26 + sideW} ${58 - 22}" fill="none" stroke="${wood.edge}" stroke-opacity=".65" stroke-width="2.5"/>
    ${bird(x + w / 2 + 26, y + 26 + h * 0.42, 1.35, '#8a5a4a')}
  </g>`;
};

/* three-chamber sparrow terrace, wide and low */
const terrace = () => (wood) => {
  const x = 96, y = 200, w = 448, h = 152, sideW = 26;
  let holes = '';
  for (let i = 0; i < 3; i++) holes += hole(x + w * (0.2 + i * 0.3), y + 74, 20);
  return `
  <g>
    <path d="M${x + w} ${y + 8} l${sideW} -20 l0 ${h - 14} l${-sideW} 20 z" fill="url(#side-${wood.key})"/>
    ${plank(x, y + 8, w, h, wood, 4)}
    <!-- chamber dividers, read as shadow lines -->
    <rect x="${x + w / 3}" y="${y + 8}" width="3" height="${h}" fill="${wood.edge}" fill-opacity=".45"/>
    <rect x="${x + (2 * w) / 3}" y="${y + 8}" width="3" height="${h}" fill="${wood.edge}" fill-opacity=".45"/>
    <path d="M${x - 22} ${y + 14} l${w / 2 + 22} ${-46} l${w / 2 + 22 + sideW} ${46 - 20} l${-sideW} 20 z" fill="url(#roof-${wood.key})"/>
    <path d="M${x - 22} ${y + 14} l${w / 2 + 22} ${-46} l${w / 2 + 22 + sideW} ${46 - 20}" fill="none" stroke="${wood.edge}" stroke-opacity=".65" stroke-width="2.5"/>
    <rect x="${x}" y="${y + 8}" width="${w}" height="12" fill="#2a1c0f" fill-opacity=".16"/>
    ${holes}
    <rect x="${x + 20}" y="${y + h - 26}" width="${w - 40}" height="6" rx="3" fill="${wood.edge}" fill-opacity=".4"/>
    ${bird(x + w * 0.2 + 30, y + 132, 1.05, '#7d6a52')}
    ${bird(x + w * 0.8 + 6, y + 132, 1.05, '#8d7a60', true)}
  </g>`;
};

/* swift box: wide, flat, bottom-slot entrance, sits under an eaves line */
const swiftBox = () => (wood) => {
  const x = 118, y = 214, w = 404, h = 128;
  return `
  <g>
    <!-- soffit / eaves above -->
    <path d="M70 ${y - 44} h500 l-30 34 h-440 z" fill="#e6e0d2"/>
    <path d="M70 ${y - 44} h500 l-30 34 h-440 z" fill="none" stroke="#c3bba8" stroke-width="2"/>
    <rect x="88" y="${y - 12}" width="464" height="10" rx="3" fill="#d5cdba"/>
    ${plank(x, y, w, h, wood, 6, 4)}
    <rect x="${x}" y="${y}" width="${w}" height="16" fill="#2a1c0f" fill-opacity=".14"/>
    ${slot(x + w * 0.24, y + h - 30, 118, 18)}
    <text x="${x + w - 18}" y="${y + h - 16}" font-family="Georgia,serif" font-size="15" fill="${wood.edge}" fill-opacity=".55" text-anchor="end">woodcrete</text>
    <!-- swift in flight: scythe wings -->
    <g transform="translate(438 152) rotate(-14)">
      <path d="M0 0 c-30 -16 -58 -34 -78 -58 c26 12 52 22 76 26 l10 -6 c-2 -14 -6 -28 -12 -42 c16 20 26 40 30 58 c22 6 44 16 64 32 c-26 -8 -50 -12 -72 -12 z" fill="#4b4744"/>
    </g>
  </g>`;
};

/* deep starling box */
const deepBox = (holeR) => (wood) => {
  const x = 246, y = 128, w = 156, h = 262, sideW = 30;
  return `
  <g>
    <path d="M${x + w} ${y + 8} l${sideW} -20 l0 ${h - 14} l${-sideW} 20 z" fill="url(#side-${wood.key})"/>
    ${plank(x, y + 8, w, h, wood, 8)}
    <path d="M${x - 22} ${y + 14} l${w / 2 + 22} ${-46} l${w / 2 + 22 + sideW} ${46 - 20} l${-sideW} 20 z" fill="url(#roof-${wood.key})"/>
    <path d="M${x - 22} ${y + 14} l${w / 2 + 22} ${-46} l${w / 2 + 22 + sideW} ${46 - 20}" fill="none" stroke="${wood.edge}" stroke-opacity=".65" stroke-width="2.5"/>
    <rect x="${x}" y="${y + 8}" width="${w}" height="12" fill="#2a1c0f" fill-opacity=".16"/>
    <!-- hardwood wear plate around the entrance -->
    <rect x="${x + w / 2 - holeR - 16}" y="${y + 58}" width="${holeR * 2 + 32}" height="${holeR * 2 + 30}" rx="6" fill="${wood.edge}" fill-opacity=".35"/>
    ${hole(x + w / 2, y + 74 + holeR, holeR)}
    ${bird(x + w / 2 + 62, y + 150, 1.3, '#3f4a55')}
  </g>`;
};

/* flat-packed DIY kit: exploded panels */
const diyKit = () => (wood) => `
  <g>
    ${plank(96, 150, 168, 200, wood, 2, 3)}
    ${hole(180, 216, 20)}
    ${plank(282, 150, 118, 200, wood, 12, 3)}
    ${plank(418, 150, 118, 200, wood, 15, 3)}
    ${plank(96, 372, 194, 62, wood, 18, 3)}
    ${plank(308, 372, 228, 62, wood, 21, 3)}
    <!-- fixings pack -->
    <g transform="translate(452 96)">
      <rect x="0" y="0" width="86" height="40" rx="6" fill="#efe9dc" stroke="#c9c0ac" stroke-width="2"/>
      <g fill="#8d959b">
        <rect x="10" y="12" width="26" height="4" rx="2"/><rect x="10" y="22" width="26" height="4" rx="2"/>
        <circle cx="58" cy="14" r="5"/><circle cx="72" cy="24" r="5"/>
      </g>
    </g>
    <text x="118" y="126" font-family="Georgia,serif" font-size="17" fill="${'#6d5c44'}">pre-cut · pre-drilled</text>
  </g>`;

/* tall chimney tawny box, angled against a trunk */
const chimney = () => (wood) => `
  <g>
    <!-- trunk -->
    <path d="M470 60 q34 120 22 400 h84 q-26 -260 -46 -400 z" fill="#6f5b45"/>
    <path d="M470 60 q34 120 22 400" fill="none" stroke="#54432f" stroke-width="3" stroke-opacity=".6"/>
    <path d="M498 120 q18 130 12 330" fill="none" stroke="#54432f" stroke-width="2" stroke-opacity=".4"/>
    <g transform="translate(300 250) rotate(-14) translate(-300 -250)">
      <path d="M${300 + 130} 132 l30 -18 l0 262 l-30 18 z" fill="url(#side-${wood.key})"/>
      ${plank(300 - 8, 140, 138, 250, wood, 9, 4)}
      <path d="M${300 - 30} 146 l${69 + 30} -40 l${69 + 30 + 30} ${40 - 18} l-30 18 z" fill="url(#roof-${wood.key})"/>
      <path d="M${300 - 30} 146 l${69 + 30} -40 l${69 + 30 + 30} ${40 - 18}" fill="none" stroke="${wood.edge}" stroke-opacity=".7" stroke-width="2.5"/>
      ${slot(300 + 22, 168, 90, 60)}
      <rect x="${300 + 4}" y="336" width="128" height="7" rx="3" fill="${wood.edge}" fill-opacity=".55"/>
    </g>
    <!-- tawny owl looking out -->
    <g transform="translate(330 214)">
      <ellipse cx="0" cy="0" rx="30" ry="27" fill="#a8875f"/>
      <path d="M-30 -6 q12 -26 30 -26 q18 0 30 26 q-14 -12 -30 -12 q-16 0 -30 12 z" fill="#8e6f4b"/>
      <circle cx="-11" cy="-2" r="8.5" fill="#241d15"/><circle cx="11" cy="-2" r="8.5" fill="#241d15"/>
      <circle cx="-8.6" cy="-4.6" r="2.6" fill="#fff" fill-opacity=".8"/><circle cx="13.4" cy="-4.6" r="2.6" fill="#fff" fill-opacity=".8"/>
      
      <path d="M0 4 l-6 8 l6 6 l6 -6 z" fill="#dba24a"/>
    </g>
  </g>`;

/* big barn owl box on a pole */
const poleBox = (shelf) => (wood) => {
  const x = 190, y = 118, w = 262, h = 190, sideW = 40;
  return `
  <g>
    <!-- pole -->
    <rect x="302" y="${y + h}" width="34" height="230" fill="#7a6a55"/>
    <rect x="302" y="${y + h}" width="34" height="230" fill="url(#side-${wood.key})" fill-opacity=".35"/>
    <path d="M288 ${y + h + 8} h62 l-8 18 h-46 z" fill="#5c4f3f"/>
    <path d="M${x + w} ${y + 10} l${sideW} -24 l0 ${h - 18} l${-sideW} 24 z" fill="url(#side-${wood.key})"/>
    ${plank(x, y + 10, w, h, wood, 13, 4)}
    <path d="M${x - 30} ${y + 16} l${w / 2 + 30} ${-52} l${w / 2 + 30 + sideW} ${52 - 24} l${-sideW} 24 z" fill="url(#roof-${wood.key})"/>
    <path d="M${x - 30} ${y + 16} l${w / 2 + 30} ${-52} l${w / 2 + 30 + sideW} ${52 - 24}" fill="none" stroke="${wood.edge}" stroke-opacity=".7" stroke-width="2.5"/>
    <rect x="${x}" y="${y + 10}" width="${w}" height="16" fill="#2a1c0f" fill-opacity=".2"/>
    <!-- big square entrance -->
    <rect x="${x + 36}" y="${y + 58}" width="96" height="96" rx="6" fill="url(#cavity)"/>
    <rect x="${x + 36}" y="${y + 58}" width="96" height="96" rx="6" fill="none" stroke="#2a1c0f" stroke-opacity=".5" stroke-width="2"/>
    ${shelf ? `${plank(x + 18, y + 154, 132, 20, wood, 17, 2)}` : ''}
    <!-- inspection hatch -->
    <rect x="${x + 158}" y="${y + 62}" width="80" height="112" rx="5" fill="none" stroke="${wood.edge}" stroke-opacity=".6" stroke-width="2.5" stroke-dasharray="7 5"/>
    <circle cx="${x + 228}" cy="${y + 118}" r="5.5" fill="#8d959b"/>
    <!-- barn owl in the entrance -->
    <g transform="translate(${x + 84} ${y + 112})">
      <path d="M0 34 c-22 0 -34 -18 -34 -40 0 -24 15 -40 34 -40 19 0 34 16 34 40 0 22 -12 40 -34 40 z" fill="#f2ead9"/>
      <path d="M0 -8 c-14 0 -22 -12 -22 -26 0 -14 10 -24 22 -24 12 0 22 10 22 24 0 14 -8 26 -22 26 z" fill="#fbf7ee"/>
      <circle cx="-9" cy="-24" r="5.5" fill="#231c14"/><circle cx="9" cy="-24" r="5.5" fill="#231c14"/>
      <path d="M0 -20 l-4 10 l4 5 l4 -5 z" fill="#c9a05a"/>
      <path d="M-20 6 q20 10 40 0 q-8 22 -20 22 q-12 0 -20 -22 z" fill="#e4d6bb" fill-opacity=".7"/>
    </g>
  </g>`;
};

/* narrow bat crevice box */
const batBox = () => (wood) => {
  const x = 258, y = 132, w = 130, h = 252;
  return `
  <g>
    <!-- wall behind -->
    <rect x="120" y="60" width="400" height="380" fill="#e3ded1"/>
    <g stroke="#d2cbba" stroke-width="2">
      <path d="M120 150 h400 M120 240 h400 M120 330 h400"/>
      <path d="M220 60 v90 M320 150 v90 M420 240 v90 M220 330 v110"/>
    </g>
    <path d="M${x + w} ${y + 6} l22 -14 l0 ${h - 10} l-22 14 z" fill="url(#side-${wood.key})"/>
    ${plank(x, y + 6, w, h, wood, 14, 3)}
    <path d="M${x - 18} ${y + 12} l${w / 2 + 18} ${-32} l${w / 2 + 18 + 22} ${32 - 14} l-22 14 z" fill="url(#roof-${wood.key})"/>
    <!-- rough sawn texture: vertical scoring -->
    <g stroke="${wood.edge}" stroke-opacity=".22" stroke-width="1.4">
      ${Array.from({ length: 11 }, (_, i) => `<path d="M${x + 8 + i * 11} ${y + 20} v${h - 24}"/>`).join('')}
    </g>
    ${slot(x + 16, y + h - 8, w - 32, 14)}
    <!-- landing board below the slot -->
    ${plank(x + 10, y + h + 10, w - 20, 34, wood, 19, 2)}
    <!-- pipistrelle hanging at the slot -->
    <g transform="translate(${x + w / 2 + 40} ${y + h + 28})">
      <path d="M0 0 c-14 -4 -22 6 -30 16 q16 -4 26 2 q-4 12 4 20 q8 -8 4 -20 q10 -6 26 -2 c-8 -10 -16 -20 -30 -16 z" fill="#4a3f38"/>
      <circle cx="0" cy="-4" r="6" fill="#5a4d43"/>
      <path d="M-5 -9 l-3 -7 l6 3 z M5 -9 l3 -7 l-6 3 z" fill="#5a4d43"/>
    </g>
  </g>`;
};

/* low, wide hedgehog house with an entrance tunnel */
const hedgehogHouse = () => (wood) => {
  const x = 130, y = 244, w = 390, h = 118;
  return `
  <g>
    ${plank(x, y, w, h, wood, 16, 4)}
    <!-- felted roof -->
    <path d="M${x - 24} ${y + 6} l${w / 2 + 24} ${-52} l${w / 2 + 24 + 26} ${52 - 20} l-26 20 z" fill="#3c3a37"/>
    <path d="M${x - 24} ${y + 6} l${w / 2 + 24} ${-52} l${w / 2 + 24 + 26} ${52 - 20}" fill="none" stroke="#2a2825" stroke-width="3"/>
    <g stroke="#4d4a46" stroke-width="1.6" stroke-opacity=".8">
      ${Array.from({ length: 6 }, (_, i) => `<path d="M${x - 14 + i * 12} ${y + 2} l${60} ${-46}"/>`).join('')}
    </g>
    <!-- entrance tunnel, angled off the front-left -->
    ${plank(x - 62, y + 40, 92, 66, wood, 22, 3)}
    ${slot(x - 54, y + 58, 42, 34)}
    <rect x="${x - 62}" y="${y + 40}" width="92" height="8" fill="#2a1c0f" fill-opacity=".2"/>
    <!-- feet -->
    <rect x="${x + 20}" y="${y + h}" width="24" height="16" fill="${wood.edge}"/>
    <rect x="${x + w - 44}" y="${y + h}" width="24" height="16" fill="${wood.edge}"/>
    <!-- leaves spilling from the chamber -->
    <path d="M${x + 60} ${y + h - 6} q40 -22 90 -10 q-40 20 -90 10 z" fill="#7d6a3f" fill-opacity=".55"/>
    <!-- hedgehog at the tunnel mouth -->
    <g transform="translate(${x - 92} ${y + 96})">
      <path d="M0 0 c2 -26 22 -42 48 -42 c26 0 44 16 46 42 z" fill="#6b5a48"/>
      <g stroke="#4a3d30" stroke-width="2.4" stroke-linecap="round">
        <path d="M10 -12 l-6 -12 M22 -22 l-4 -14 M36 -28 l0 -15 M50 -28 l4 -15 M64 -22 l7 -13 M76 -12 l9 -11"/>
      </g>
      <path d="M84 0 c8 -4 14 -10 14 -16 c0 -8 -8 -12 -16 -10 z" fill="#c4ac93"/>
      <circle cx="88" cy="-14" r="2.4" fill="#241d15"/>
      <circle cx="96" cy="-12" r="2.6" fill="#3b322a"/>
    </g>
  </g>`;
};

/* tiny rear-entrance dormouse box on a hazel stem */
const dormouseBox = () => (wood) => `
  <g>
    <path d="M150 470 q30 -260 40 -420" fill="none" stroke="#6f5b45" stroke-width="22" stroke-linecap="round"/>
    <path d="M186 200 q60 -40 120 -46" fill="none" stroke="#6f5b45" stroke-width="12" stroke-linecap="round"/>
    <path d="M300 158 q28 -14 56 -12 q-24 22 -56 12 z" fill="#5d9160"/>
    <path d="M330 190 q30 -8 56 4 q-30 16 -56 -4 z" fill="#4a7c4e"/>
    <g transform="translate(60 40)">
      ${plank(190, 220, 158, 150, wood, 23, 4)}
      <path d="M172 226 l97 -34 l119 24 l-40 12 z" fill="url(#roof-${wood.key})"/>
      <path d="M172 226 l97 -34 l119 24" fill="none" stroke="${wood.edge}" stroke-opacity=".6" stroke-width="2.5"/>
      <rect x="196" y="352" width="146" height="6" rx="3" fill="${wood.edge}" fill-opacity=".5"/>
      <!-- wire tie -->
      <path d="M190 250 q-34 20 0 40" fill="none" stroke="#9aa0a6" stroke-width="3"/>
      <text x="269" y="300" font-family="Georgia,serif" font-size="15" fill="${'#efe6d4'}" text-anchor="middle" opacity=".75">rear entrance</text>
    </g>
    <!-- dormouse on the stem -->
    <g transform="translate(196 214)">
      <ellipse cx="0" cy="0" rx="26" ry="18" fill="#c99a52"/>
      <circle cx="-22" cy="-6" r="12" fill="#d6a860"/>
      <circle cx="-27" cy="-9" r="3" fill="#241d15"/>
      <circle cx="-14" cy="-16" r="5.5" fill="#c08e48"/>
      <path d="M22 4 q28 8 24 -18" fill="none" stroke="#c99a52" stroke-width="8" stroke-linecap="round"/>
    </g>
  </g>`;

/* ---------- map each product to a drawing ---------- */

const SPECS = [
  ['great-british-box',   'cedar',   classicBox(22, { perch: false }), '#9fbf9f'],
  ['songbird-sanctuary',  'pine',    openFront(),                      '#c9b98f'],
  ['sparrow-tenement',    'fir',     terrace(),                        '#b6c4a0'],
  ['swift-box',           'crete',   swiftBox(),                       '#a8bcc9'],
  ['murmuration-mansion', 'oak',     deepBox(26),                      '#bda98c'],
  ['diy-kit',             'cedar',   diyKit(),                         '#cbbf9a'],
  ['tawny-plaza',         'charred', chimney(),                        '#9db08f'],
  ['owl-field-cabin',     'ply',     poleBox(false),                   '#a9bcae'],
  ['barn-owl-homestead',  'ply',     poleBox(true),                    '#c0b79c'],
  ['bat-shack',           'cedar',   batBox(),                         '#b3aebb'],
  ['hedgehog-house',      'fir',     hedgehogHouse(),                  '#c2b48d'],
  ['dormouse-box',        'birch',   dormouseBox(),                    '#aec89d'],
];

for (const [id, wood, body, accent] of SPECS) {
  fs.writeFileSync(path.join(OUT, `${id}.svg`), frame(wood, body, accent));
}

/* a wide hero illustration: a box on a tree with a garden behind it */
const hero = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 620" width="1200" height="620" role="img">
  <defs>
    <linearGradient id="hsky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#eef3e8"/><stop offset=".6" stop-color="#e3ecdd"/><stop offset="1" stop-color="#d7e4d1"/>
    </linearGradient>
    <radialGradient id="hcav" cx=".38" cy=".32" r=".85">
      <stop offset="0" stop-color="#4a3520"/><stop offset="1" stop-color="#150f09"/>
    </radialGradient>
    <linearGradient id="hface" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#c98f5b"/><stop offset=".55" stop-color="#b0743f"/><stop offset="1" stop-color="#8a5628"/>
    </linearGradient>
    <linearGradient id="hroof" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#b0743f"/><stop offset="1" stop-color="#6d4320"/>
    </linearGradient>
    <filter id="hsoft"><feGaussianBlur stdDeviation="18"/></filter>
  </defs>
  <rect width="1200" height="620" fill="url(#hsky)"/>
  <circle cx="960" cy="120" r="70" fill="#f6f1de" fill-opacity=".9"/>
  <g fill="#8fae86" fill-opacity=".45">
    <path d="M0 470 q160 -70 330 -40 q170 30 330 -10 q160 -40 340 10 v190 H0 z"/>
  </g>
  <g fill="#6f9268" fill-opacity=".5">
    <path d="M0 530 q200 -50 420 -20 q220 30 420 -12 q180 -36 360 12 v110 H0 z"/>
  </g>
  <!-- distant trees -->
  <g fill="#5b7f57" fill-opacity=".35">
    <path d="M120 470 q30 -120 62 -140 q34 22 62 140 z"/>
    <path d="M1010 476 q26 -104 54 -122 q30 20 54 122 z"/>
  </g>
  <!-- trunk -->
  <path d="M300 620 q40 -300 20 -520 h150 q-34 226 6 520 z" fill="#77624a"/>
  <path d="M330 100 q-16 240 -8 520" fill="none" stroke="#5a4834" stroke-width="4" stroke-opacity=".55"/>
  <path d="M400 120 q22 220 34 500" fill="none" stroke="#5a4834" stroke-width="3" stroke-opacity=".4"/>
  <path d="M452 210 q120 -46 250 -30" fill="none" stroke="#77624a" stroke-width="16" stroke-linecap="round"/>
  <g fill="#5d9160">
    <path d="M690 168 q70 -34 138 -26 q-58 52 -138 26 z"/>
    <path d="M726 206 q76 -18 138 14 q-72 40 -138 -14 z"/>
    <path d="M540 148 q46 -40 106 -44 q-30 58 -106 44 z"/>
  </g>
  <!-- the box, hung on the trunk -->
  <g transform="translate(430 236)">
    <path d="M210 14 l40 -26 l0 236 l-40 26 z" fill="#6d4320"/>
    <rect x="10" y="14" width="200" height="236" rx="4" fill="url(#hface)"/>
    <g stroke="#6d4320" stroke-opacity=".18" stroke-width="2">
      <path d="M16 60 q100 10 188 0 M16 110 q100 -12 188 0 M16 160 q100 12 188 0 M16 210 q100 -10 188 0"/>
    </g>
    <rect x="10" y="14" width="200" height="236" rx="4" fill="none" stroke="#6d4320" stroke-opacity=".5" stroke-width="2.5"/>
    <path d="M-20 22 l130 -64 l170 40 l-40 26 z" fill="url(#hroof)"/>
    <path d="M-20 22 l130 -64 l170 40" fill="none" stroke="#6d4320" stroke-opacity=".7" stroke-width="3"/>
    <rect x="10" y="14" width="200" height="16" fill="#2a1c0f" fill-opacity=".2"/>
    <circle cx="110" cy="104" r="26" fill="url(#hcav)"/>
    <circle cx="110" cy="104" r="26" fill="none" stroke="#2a1c0f" stroke-opacity=".5" stroke-width="2"/>
    <rect x="30" y="216" width="30" height="7" rx="3" fill="#6d4320" fill-opacity=".7"/>
    <circle cx="182" cy="219" r="6" fill="#8d959b"/>
    <!-- blue tit at the hole -->
    <g transform="translate(150 168) scale(1.5)">
      <path d="M0 0 c-9 -1 -16 -8 -16 -18 0 -12 8 -22 19 -22 8 0 14 4 17 10 l14 -6 -9 10 c3 4 4 9 4 14 0 13 -11 22 -25 22 z" fill="#4f7fa8"/>
      <path d="M-10 -26 q10 -8 22 -4 q-10 -12 -22 4 z" fill="#f2e7c9"/>
      <path d="M4 -30 l11 -4 -8 8 z" fill="#e8a33d"/>
      <circle cx="6" cy="-33" r="2" fill="#1d1a17"/>
      <path d="M-12 -12 q12 -8 24 -2 q-10 12 -24 2 z" fill="#e8d98f"/>
      <path d="M-4 4 l0 8 M4 4 l0 8" stroke="#8a6a3a" stroke-width="2.4" stroke-linecap="round"/>
    </g>
  </g>
  <!-- second bird in flight -->
  <g transform="translate(880 330) scale(1.3) rotate(-10)">
    <path d="M0 0 c-9 -1 -16 -8 -16 -18 0 -12 8 -22 19 -22 8 0 14 4 17 10 l14 -6 -9 10 c3 4 4 9 4 14 0 13 -11 22 -25 22 z" fill="#7d6a52"/>
    <path d="M-14 -20 q18 -18 40 -14 q-18 22 -40 14 z" fill="#8d7a60"/>
    <path d="M4 -30 l11 -4 -8 8 z" fill="#e8a33d"/>
    <circle cx="6" cy="-33" r="2" fill="#1d1a17"/>
  </g>
  <g fill="#4a7c4e" fill-opacity=".75">
    <path d="M60 620 q40 -110 130 -140 q-24 104 -130 140 z"/>
    <path d="M1150 620 q-40 -100 -124 -130 q22 96 124 130 z"/>
  </g>
</svg>
`;
fs.writeFileSync(path.join(OUT, 'hero.svg'), hero);

console.log(`wrote ${SPECS.length + 1} illustrations to public/img`);
