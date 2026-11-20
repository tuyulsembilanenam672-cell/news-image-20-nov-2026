// The World in One Day — Friday 20 November 2026
// A deterministic newspaper front page drawn pixel by pixel with Node's
// standard library only. No network, no fonts, no dependencies.
// Run: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Writes entry.png (1024x1024, grayscale PNG) to the output directory.

import { writeFileSync, mkdirSync } from "node:fs";
import { deflateSync } from "node:zlib";

const W = 1024;
const H = 1024;
const PAPER = 246; // warm newsprint
const INK = 24; // near-black ink
const SOFT = 120; // grey for thin rules and secondary lines
const FAINT = 200; // light grey for hairlines

// ---------------------------------------------------------------- canvas
const px = new Uint8Array(W * H).fill(PAPER);

function set(x, y, v) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  px[y * W + x] = v;
}

function rect(x, y, w, h, v) {
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) set(i, j, v);
  }
}

function hline(x, y, w, v, thick = 1) {
  rect(x, y, w, thick, v);
}

function vline(x, y, h, v, thick = 1) {
  rect(x, y, thick, h, v);
}

// Filled circle (midpoint scan).
function disc(cx, cy, r, v) {
  for (let dy = -r; dy <= r; dy++) {
    const dx = Math.floor(Math.sqrt(r * r - dy * dy));
    for (let x = -dx; x <= dx; x++) set(cx + x, cy + dy, v);
  }
}

// Circle outline, one pixel thick.
function ring(cx, cy, r, v) {
  for (let a = 0; a < 360; a++) {
    const rad = (a * Math.PI) / 180;
    set(Math.round(cx + r * Math.cos(rad)), Math.round(cy + r * Math.sin(rad)), v);
  }
}

// Straight line (Bresenham).
function line(x0, y0, x1, y1, v) {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  for (;;) {
    set(x, y, v);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

// ------------------------------------------------------------------- font
// A 5x7 bitmap font, one row per number, bit 4 on the left. Only capitals,
// digits and common punctuation: the whole page is set in capitals.
const GLYPHS = {
  A: [14, 17, 17, 31, 17, 17, 17],
  B: [30, 17, 17, 30, 17, 17, 30],
  C: [14, 17, 16, 16, 16, 17, 14],
  D: [30, 17, 17, 17, 17, 17, 30],
  E: [31, 16, 16, 30, 16, 16, 31],
  F: [31, 16, 16, 30, 16, 16, 16],
  G: [14, 17, 16, 23, 17, 17, 15],
  H: [17, 17, 17, 31, 17, 17, 17],
  I: [14, 4, 4, 4, 4, 4, 14],
  J: [7, 2, 2, 2, 2, 18, 12],
  K: [17, 18, 20, 24, 20, 18, 17],
  L: [16, 16, 16, 16, 16, 16, 31],
  M: [17, 27, 21, 21, 17, 17, 17],
  N: [17, 25, 21, 19, 17, 17, 17],
  O: [14, 17, 17, 17, 17, 17, 14],
  P: [30, 17, 17, 30, 16, 16, 16],
  Q: [14, 17, 17, 17, 21, 18, 13],
  R: [30, 17, 17, 30, 20, 18, 17],
  S: [15, 16, 16, 14, 1, 1, 30],
  T: [31, 4, 4, 4, 4, 4, 4],
  U: [17, 17, 17, 17, 17, 17, 14],
  V: [17, 17, 17, 17, 17, 10, 4],
  W: [17, 17, 17, 21, 21, 27, 17],
  X: [17, 17, 10, 4, 10, 17, 17],
  Y: [17, 17, 10, 4, 4, 4, 4],
  Z: [31, 1, 2, 4, 8, 16, 31],
  "0": [14, 17, 19, 21, 25, 17, 14],
  "1": [4, 12, 4, 4, 4, 4, 14],
  "2": [14, 17, 1, 6, 8, 16, 31],
  "3": [31, 2, 4, 2, 1, 17, 14],
  "4": [2, 6, 10, 18, 31, 2, 2],
  "5": [31, 16, 30, 1, 1, 17, 14],
  "6": [6, 8, 16, 30, 17, 17, 14],
  "7": [31, 1, 2, 4, 8, 8, 8],
  "8": [14, 17, 17, 14, 17, 17, 14],
  "9": [14, 17, 17, 15, 1, 2, 12],
  " ": [0, 0, 0, 0, 0, 0, 0],
  ".": [0, 0, 0, 0, 0, 12, 12],
  ",": [0, 0, 0, 0, 12, 4, 8],
  ":": [0, 12, 12, 0, 12, 12, 0],
  ";": [0, 12, 12, 0, 12, 4, 8],
  "'": [4, 4, 8, 0, 0, 0, 0],
  "-": [0, 0, 0, 14, 0, 0, 0],
  "!": [4, 4, 4, 4, 4, 0, 4],
  "?": [14, 17, 1, 2, 4, 0, 4],
  "(": [2, 4, 8, 8, 8, 4, 2],
  ")": [8, 4, 2, 2, 2, 4, 8],
  "/": [1, 1, 2, 4, 8, 16, 16],
  "&": [12, 18, 20, 8, 21, 18, 13],
  "%": [25, 25, 2, 4, 8, 19, 19],
  $: [4, 15, 20, 14, 5, 30, 4],
  '"': [10, 10, 10, 0, 0, 0, 0],
  "+": [0, 4, 4, 14, 4, 4, 0],
  "=": [0, 0, 31, 0, 31, 0, 0],
};

function glyphWidth(scale) {
  return 6 * scale; // 5 columns + 1 column of spacing
}

function textWidth(text, scale) {
  return text.length * glyphWidth(scale) - scale;
}

function drawChar(ch, x, y, scale, v) {
  const g = GLYPHS[ch];
  if (!g) return;
  for (let row = 0; row < 7; row++) {
    const bits = g[row];
    for (let col = 0; col < 5; col++) {
      if (bits & (16 >> col)) rect(x + col * scale, y + row * scale, scale, scale, v);
    }
  }
}

function drawText(text, x, y, scale, v = INK) {
  const upper = text.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    drawChar(upper[i], x + i * glyphWidth(scale), y, scale, v);
  }
}

function drawTextCentered(text, cx, y, scale, v = INK) {
  drawText(text, cx - Math.floor(textWidth(text, scale) / 2), y, scale, v);
}

// Word-wrap a paragraph to lines no wider than maxWidth pixels.
function wrap(text, scale, maxWidth) {
  const words = text.toUpperCase().split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    const trial = cur ? cur + " " + w : w;
    if (textWidth(trial, scale) <= maxWidth || !cur) {
      cur = trial;
    } else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function drawPara(text, x, y, scale, maxWidth, lineGap, v = INK) {
  const lines = wrap(text, scale, maxWidth);
  const lh = 7 * scale + lineGap;
  lines.forEach((ln, i) => drawText(ln, x, y + i * lh, scale, v));
  return y + lines.length * lh;
}

// ------------------------------------------------------------ PNG output
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}

function encodePNG() {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 0; // grayscale
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const raw = Buffer.alloc(H * (1 + W));
  for (let y = 0; y < H; y++) {
    raw[y * (W + 1)] = 0; // filter: none
    raw.set(px.subarray(y * W, (y + 1) * W), y * (W + 1) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ------------------------------------------------------------- the stories
// Seven stories from Friday 20 November 2026, as first reported that day.
const STORIES = [
  {
    tag: "SHENZHEN",
    icon: "dove",
    head: "TRUMP, XI AND PUTIN SIGN PEACE DECLARATION",
    body: "The three leaders end their first trilateral meeting at the APEC summit in Shenzhen with a joint peace declaration, pledging talks on nuclear risks and energy security.",
  },
  {
    tag: "WASHINGTON",
    icon: "hourglass",
    head: "TRUMP PUTS IRAN WAR DECISION OFF TO 2027",
    body: "The US president says there is no rush on Iran and he will see what happens after January 1, days after US strikes and Iranian retaliation shook the Gulf.",
  },
  {
    tag: "THE HAGUE",
    icon: "scales",
    head: "COURT RULES MYANMAR COMMITTED GENOCIDE",
    body: "The International Court of Justice finds Myanmar's military likely intended to destroy a substantial part of the Rohingya minority in its 2017 crackdown.",
  },
  {
    tag: "ODISHA",
    icon: "cyclone",
    head: "CYCLONE AKVAN SLAMS INTO INDIA'S EAST COAST",
    body: "Three hundred thousand people are evacuated and 423 rescue teams deployed as the severe storm makes landfall in Odisha, closing schools across eight districts.",
  },
  {
    tag: "KYIV",
    icon: "embassy",
    head: "RUSSIAN STRIKES HIT EMBASSIES IN KYIV",
    body: "Russian missiles damage the Austrian and Dutch embassies in the Ukrainian capital, as European leaders say they are ready for talks with Moscow on ending the war.",
  },
  {
    tag: "LOS SANTOS",
    icon: "controller",
    head: "GTA 6 SALES PASS $1.8 BILLION IN A DAY",
    body: "Rockstar's Grand Theft Auto VI overtakes the global box office run of The Odyssey on its first day, a day after its worldwide rollout began.",
  },
  {
    tag: "TOKYO",
    icon: "satellite",
    head: "ENGINE TROUBLE ENDS HAYABUSA2 LANDING PLAN",
    body: "Japan's Hayabusa2 probe abandons its asteroid landing after engine trouble, changing course in deep space instead.",
  },
];

// --------------------------------------------------------------- pictograms
// Small geometric drawings, one per story, inside a 96x96 box at (x, y).
function drawIcon(kind, x, y) {
  const cx = x + 48;
  const cy = y + 48;
  rect(x, y, 96, 96, PAPER);
  hline(x, y, 96, INK, 2);
  hline(x, y + 94, 96, INK, 2);
  vline(x, y, 96, INK, 2);
  vline(x + 94, y, 96, INK, 2);
  if (kind === "dove") {
    // Three overlapping circles: three leaders, one table.
    ring(cx - 20, cy - 8, 17, INK);
    ring(cx + 20, cy - 8, 17, INK);
    ring(cx, cy + 16, 17, INK);
    hline(x + 14, cy + 34, 68, INK, 3);
  } else if (kind === "hourglass") {
    line(x + 20, y + 16, x + 76, y + 16, INK);
    line(x + 20, y + 80, x + 76, y + 80, INK);
    line(x + 20, y + 16, cx, cy, INK);
    line(x + 76, y + 16, cx, cy, INK);
    line(x + 20, y + 80, cx, cy, INK);
    line(x + 76, y + 80, cx, cy, INK);
    disc(cx, cy + 16, 7, INK);
  } else if (kind === "scales") {
    vline(cx, y + 14, 62, INK, 3);
    hline(cx - 30, y + 22, 60, INK, 3);
    line(cx - 30, y + 22, cx - 38, y + 52, INK);
    line(cx - 30, y + 22, cx - 22, y + 52, INK);
    line(cx + 30, y + 22, cx + 22, y + 52, INK);
    line(cx + 30, y + 22, cx + 38, y + 52, INK);
    hline(cx - 42, y + 52, 20, INK, 3);
    hline(cx + 22, y + 52, 20, INK, 3);
    hline(cx - 24, y + 78, 48, INK, 3);
  } else if (kind === "cyclone") {
    ring(cx, cy, 34, INK);
    ring(cx, cy, 24, INK);
    ring(cx, cy, 14, INK);
    disc(cx, cy, 5, INK);
    line(cx - 34, cy, cx - 44, cy - 12, INK);
    line(cx + 34, cy, cx + 44, cy + 12, INK);
  } else if (kind === "embassy") {
    rect(cx - 26, cy - 6, 52, 40, INK);
    rect(cx - 20, cy + 2, 8, 10, PAPER);
    rect(cx - 4, cy + 2, 8, 10, PAPER);
    rect(cx + 12, cy + 2, 8, 10, PAPER);
    line(cx - 30, cy - 6, cx, cy - 24, INK);
    line(cx + 30, cy - 6, cx, cy - 24, INK);
    vline(cx + 30, cy - 46, 40, INK, 2);
    rect(cx + 32, cy - 46, 20, 12, INK);
  } else if (kind === "controller") {
    rect(cx - 34, cy - 16, 68, 34, INK);
    disc(cx - 34, cy + 14, 10, INK);
    disc(cx + 34, cy + 14, 10, INK);
    rect(cx - 24, cy - 6, 12, 4, PAPER);
    rect(cx - 20, cy - 10, 4, 12, PAPER);
    disc(cx + 14, cy - 4, 3, PAPER);
    disc(cx + 24, cy + 4, 3, PAPER);
  } else if (kind === "satellite") {
    rect(cx - 30, cy - 30, 16, 60, INK);
    rect(cx + 14, cy - 30, 16, 60, INK);
    rect(cx - 10, cy - 12, 20, 24, INK);
    line(cx, cy - 12, cx, cy - 34, INK);
    disc(cx, cy - 36, 3, INK);
    disc(cx - 4, cy - 2, 2, PAPER);
    disc(cx + 4, cy + 4, 2, PAPER);
  }
}

// ------------------------------------------------------------------- layout
const M = 40; // page margin
const CW = W - 2 * M; // content width

function drawMasthead() {
  let y = 44;
  drawTextCentered("THE WORLD IN ONE DAY", W / 2, y, 5);
  y += 7 * 5 + 14;
  hline(M, y, CW, INK, 4);
  y += 10;
  drawTextCentered("FRIDAY, 20 NOVEMBER 2026", W / 2, y, 3);
  y += 7 * 3 + 10;
  hline(M, y, CW, INK, 2);
  y += 8;
  drawTextCentered("SEVEN STORIES FROM AROUND THE GLOBE", W / 2, y, 2, SOFT);
  y += 7 * 2 + 16;
  hline(M, y, CW, INK, 2);
  return y + 18;
}

function drawLead(story, y) {
  drawText(story.tag + "  —  LEAD STORY", M, y, 2, SOFT);
  y += 7 * 2 + 12;
  const headLines = wrap(story.head, 4, CW);
  headLines.forEach((ln, i) => drawText(ln, M, y + i * (7 * 4 + 6), 4));
  y += headLines.length * (7 * 4 + 6) + 6;
  y = drawPara(story.body, M, y, 2, CW, 5);
  return y + 16;
}

function drawCell(story, x, y, w) {
  const iconBox = 96;
  drawIcon(story.icon, x, y);
  const tx = x + iconBox + 14;
  const tw = w - iconBox - 14;
  drawText(story.tag, tx, y + 2, 2, SOFT);
  const headLines = wrap(story.head, 2, tw);
  let hy = y + 7 * 2 + 8;
  headLines.slice(0, 3).forEach((ln, i) => drawText(ln, tx, hy + i * (7 * 2 + 3), 2));
  hy += Math.min(headLines.length, 3) * (7 * 2 + 3) + 4;
  drawPara(story.body, tx, hy, 2, tw, 4);
}

function drawPage() {
  let y = drawMasthead();
  y = drawLead(STORIES[0], y);
  hline(M, y, CW, INK, 2);
  y += 18;
  const gap = 28;
  const colW = Math.floor((CW - gap) / 2);
  const rowH = 196;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 2; c++) {
      const story = STORIES[1 + r * 2 + c];
      drawCell(story, M + c * (colW + gap), y + r * rowH, colW);
    }
    if (r < 2) hline(M, y + (r + 1) * rowH - 14, CW, FAINT, 1);
  }
  y += 3 * rowH - 8;
  hline(M, y, CW, INK, 2);
  y += 12;
  drawTextCentered("DRAWN ENTIRELY IN CODE  ·  NO PHOTOGRAPHS  ·  THE DAY IN SEVEN STORIES", W / 2, y, 2, SOFT);
}

// --------------------------------------------------------------------- main
function main() {
  const outDir = process.env.MAKEFUN_OUTPUT_DIR || "out";
  mkdirSync(outDir, { recursive: true });
  drawPage();
  const png = encodePNG();
  writeFileSync(`${outDir}/entry.png`, png);
}

main();
