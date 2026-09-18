import type { HeroPrint } from '@/content/site';

/*
 * The faces of the hero prints, drawn on a 2D canvas. Everything is laid out on a 280 unit wide
 * page and scaled to whatever size the print gets, so a small print is a smaller copy of the same
 * page and text never collides with its neighbours. The same painters feed the WebGL textures and
 * the DOM fallback prints.
 */

export const REF = 280;

/** Height over width of each face. */
export const FACE_RATIO: Record<HeroPrint['kind'], number> = {
  code: 0.9,
  sketch: 0.86,
  note: 0.6,
};

const INK = '#1d1a16';
const PENCIL = '#8f887b';
const RED = '#d13b2c';
const HAND = '"Caveat Variable", cursive';
const TYPE = '"Courier Prime", "Courier New", monospace';

export function loadPrintFonts() {
  return Promise.all([
    document.fonts.load(`500 20px ${HAND}`).catch(() => []),
    document.fonts.load(`12.5px ${TYPE}`).catch(() => []),
  ]);
}

/** Small deterministic noise so the pen wobble is the same on every repaint. */
function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

type Pen = { ctx: CanvasRenderingContext2D; rand: () => number };

/** A pen stroke from a to b with a slight hand wobble. */
function stroke(pen: Pen, x1: number, y1: number, x2: number, y2: number, amp = 0.55) {
  const { ctx, rand } = pen;
  const len = Math.hypot(x2 - x1, y2 - y1);
  const steps = Math.max(3, Math.round(len / 9));
  const nx = -(y2 - y1) / len;
  const ny = (x2 - x1) / len;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const j = i === steps ? 0 : (rand() - 0.5) * 2 * amp;
    ctx.lineTo(x1 + (x2 - x1) * t + nx * j, y1 + (y2 - y1) * t + ny * j);
  }
  ctx.stroke();
}

/** A box drawn as four strokes, corners slightly overshot the way a quick sketch does. */
function box(pen: Pen, x: number, y: number, w: number, h: number) {
  const o = 1.2;
  stroke(pen, x - o, y, x + w + o, y);
  stroke(pen, x + w, y - o, x + w, y + h + o);
  stroke(pen, x + w + o, y + h, x - o, y + h);
  stroke(pen, x, y + h + o, x, y - o);
}

function arrow(pen: Pen, x1: number, y1: number, x2: number, y2: number) {
  stroke(pen, x1, y1, x2, y2);
  const a = Math.atan2(y2 - y1, x2 - x1);
  const s = 6;
  stroke(pen, x2, y2, x2 - s * Math.cos(a - 0.5), y2 - s * Math.sin(a - 0.5), 0.2);
  stroke(pen, x2, y2, x2 - s * Math.cos(a + 0.5), y2 - s * Math.sin(a + 0.5), 0.2);
}

/** A ring around something worth a second look. Two loose passes, like a real circling. */
function ring(pen: Pen, cx: number, cy: number, rx: number, ry: number) {
  const { ctx, rand } = pen;
  ctx.beginPath();
  const turns = 1.15;
  const steps = 64;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2 * turns - 0.4;
    const wob = 1 + (rand() - 0.5) * 0.06;
    const x = cx + Math.cos(t) * rx * wob;
    const y = cy + Math.sin(t) * ry * wob + (i / steps) * 1.5;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function penStyle(ctx: CanvasRenderingContext2D, width = 1.5) {
  ctx.strokeStyle = RED;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

function centered(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, w: number) {
  ctx.textAlign = 'center';
  ctx.fillText(text, x + w / 2, y);
  ctx.textAlign = 'left';
}

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number) {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Faint dotted grid, the same paper as the site, for pages torn from the notebook. */
function dots(ctx: CanvasRenderingContext2D, w: number, h: number, step: number) {
  ctx.fillStyle = 'rgba(40, 30, 10, 0.16)';
  for (let y = step; y < h; y += step) {
    for (let x = step; x < w; x += step) {
      ctx.fillRect(x - 0.6, y - 0.6, 1.2, 1.2);
    }
  }
}

function paintCode(ctx: CanvasRenderingContext2D, item: Extract<HeroPrint, { kind: 'code' }>, h: number) {
  ctx.fillStyle = '#fdfcf9';
  ctx.fillRect(0, 0, REF, h);
  const size = 10.1;
  const lh = 13.2;
  const x0 = 12;
  const top = 14;
  const charW = size * 0.6;
  ctx.font = `${size}px ${TYPE}`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = INK;
  item.lines.forEach((line, i) => ctx.fillText(line, x0, top + size + i * lh));

  const pen = { ctx, rand: rng(7) };
  penStyle(ctx, 1.4);
  const m = item.mark;
  const cx = x0 + (m.start + m.length / 2) * charW;
  const cy = top + size / 2 + m.line * lh + 1;
  ring(pen, cx, cy, (m.length * charW) / 2 + 7, 9.5);

  ctx.fillStyle = RED;
  ctx.font = `500 13.5px ${HAND}`;
  const noteX = 168;
  const noteY = cy + 34;
  ctx.fillText(item.note, noteX, noteY);
  arrow(pen, noteX + 24, noteY - 13, cx + 6, cy + 12);
}

function paintSketch(ctx: CanvasRenderingContext2D, item: Extract<HeroPrint, { kind: 'sketch' }>, h: number) {
  ctx.fillStyle = '#f7f2e8';
  ctx.fillRect(0, 0, REF, h);
  dots(ctx, REF, h, 14);
  const pen = { ctx, rand: rng(3) };
  penStyle(ctx, 1.5);
  const L = item.labels;

  const nodes = {
    sources: { x: 14, y: 16, w: 122, h: 30 },
    attest: { x: 160, y: 16, w: 106, h: 30 },
    indexer: { x: 14, y: 74, w: 96, h: 30 },
    api: { x: 84, y: 134, w: 118, h: 32 },
  };
  const outs = [14, 101, 188].map((x) => ({ x, y: 200, w: 78, h: 26 }));

  Object.values(nodes).forEach((n) => box(pen, n.x, n.y, n.w, n.h));
  outs.forEach((n) => box(pen, n.x, n.y, n.w, n.h));

  const { sources, attest, indexer, api } = nodes;
  arrow(pen, sources.x + sources.w / 2 - 12, sources.y + sources.h, indexer.x + indexer.w / 2, indexer.y - 1);
  arrow(pen, indexer.x + indexer.w / 2, indexer.y + indexer.h, api.x + 36, api.y - 1);
  arrow(pen, attest.x + attest.w / 2, attest.y + attest.h, api.x + api.w - 30, api.y - 1);
  outs.forEach((o) => arrow(pen, api.x + api.w / 2, api.y + api.h, o.x + o.w / 2, o.y - 1));

  ctx.fillStyle = INK;
  ctx.font = `500 14.5px ${HAND}`;
  ctx.textBaseline = 'alphabetic';
  centered(ctx, L.sources, sources.x, sources.y + 20, sources.w);
  centered(ctx, L.attest, attest.x, attest.y + 20, attest.w);
  centered(ctx, L.indexer, indexer.x, indexer.y + 20, indexer.w);
  centered(ctx, L.api, api.x, api.y + 21, api.w);
  ctx.font = `500 13.5px ${HAND}`;
  outs.forEach((o, i) => centered(ctx, L.outs[i] ?? '', o.x, o.y + 18, o.w));

  // The verdict, noted beside the api box with a short tick from it.
  ctx.fillStyle = RED;
  ctx.font = `500 13px ${HAND}`;
  L.verdict.forEach((line, i) => ctx.fillText(line, api.x + api.w + 10, api.y + 10 + i * 14));
  stroke(pen, api.x + api.w + 1, api.y + api.h / 2, api.x + api.w + 7, api.y + api.h / 2, 0.3);
}

function paintNote(ctx: CanvasRenderingContext2D, item: Extract<HeroPrint, { kind: 'note' }>, h: number) {
  // An index card: a red head rule, pale ruled lines and the words copied out by hand.
  ctx.fillStyle = '#fbf7ee';
  ctx.fillRect(0, 0, REF, h);
  const gap = 24;
  const first = 34;
  ctx.strokeStyle = 'rgba(209, 59, 44, 0.55)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, first);
  ctx.lineTo(REF, first);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(60, 80, 120, 0.16)';
  ctx.lineWidth = 1;
  for (let y = first + gap; y < h - 4; y += gap) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(REF, y + 0.5);
    ctx.stroke();
  }

  ctx.fillStyle = INK;
  ctx.font = `500 17px ${HAND}`;
  ctx.textBaseline = 'alphabetic';
  const lines = wrap(ctx, `\u201c${item.quote}\u201d`, REF - 32);
  lines.forEach((line, i) => ctx.fillText(line, 16, first + gap * (i + 1) - 6));

  const y = first + gap * (lines.length + 1) - 6;
  ctx.fillStyle = PENCIL;
  ctx.font = `10px ${TYPE}`;
  ctx.textAlign = 'right';
  ctx.fillText(item.who, REF - 16, y);
  ctx.textAlign = 'left';
  ctx.fillStyle = RED;
  ctx.font = `500 13.5px ${HAND}`;
  ctx.fillText(item.about, 16, y);
}

/**
 * Paints one face into a w by h area at the current origin. The caller sets any device pixel
 * transform; this only adds the page scale.
 */
export function paintFace(ctx: CanvasRenderingContext2D, item: HeroPrint, w: number, h: number) {
  ctx.save();
  const s = w / REF;
  ctx.scale(s, s);
  const ph = h / s;
  if (item.kind === 'code') paintCode(ctx, item, ph);
  else if (item.kind === 'sketch') paintSketch(ctx, item, ph);
  else paintNote(ctx, item, ph);
  ctx.restore();
}

/**
 * Pen caption left, typed date right. Both scale down with the print and the caption gives way
 * first, so the two never run into each other on a narrow print.
 */
export function paintCaption(ctx: CanvasRenderingContext2D, caption: string, date: string, x: number, right: number, y: number) {
  const room = right - x;
  const k = Math.min(1, room / (REF - 4));
  const dateSize = Math.max(9, 12.5 * k);
  ctx.textBaseline = 'alphabetic';
  ctx.font = `${dateSize}px ${TYPE}`;
  const dateW = ctx.measureText(date).width;
  let size = Math.max(14, 20 * k);
  ctx.font = `500 ${size}px ${HAND}`;
  while (size > 13 && ctx.measureText(caption).width + dateW + 10 > room) {
    size -= 0.5;
    ctx.font = `500 ${size}px ${HAND}`;
  }
  ctx.fillStyle = INK;
  ctx.textAlign = 'left';
  ctx.fillText(caption, x, y);
  // If there is still no room the date stays off; the caption matters more.
  if (ctx.measureText(caption).width + dateW + 10 <= room) {
    ctx.fillStyle = PENCIL;
    ctx.font = `${dateSize}px ${TYPE}`;
    ctx.textAlign = 'right';
    ctx.fillText(date, right, y);
    ctx.textAlign = 'left';
  }
}
