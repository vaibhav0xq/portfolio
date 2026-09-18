#!/usr/bin/env node
// Renders the social card (public/og.png, 1200 x 630) from a small HTML page that uses the site's
// own fonts, colours and hero copy, so the card matches the page it links to.
//
// Usage: node scripts/og-card.mjs [--out public/og.png] [--keep-html]
//
// Needs a Chromium binary (the first one on PATH, or the path in the CHROME environment variable) and
// Node 22.18 or newer, which imports src/content/site.ts directly. Run it again after changing the hero copy.

import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(name);
  return i === -1 ? fallback : args[i + 1];
};
const out = path.resolve(ROOT, flag('--out', 'public/og.png'));
const keepHtml = args.includes('--keep-html');

const { hero } = await import(pathToFileURL(path.join(ROOT, 'src/content/site.ts')).href).catch((error) => {
  console.error(`Could not load src/content/site.ts (${error.message}). Node 22.18 or newer strips the types itself.`);
  process.exit(1);
});

const code = hero.prints.find((p) => p.kind === 'code');
const note = hero.prints.find((p) => p.kind === 'note');

const font = (pkg, file) => pathToFileURL(path.join(ROOT, 'node_modules', pkg, 'files', file)).href;
const doodle = (name) => pathToFileURL(path.join(ROOT, 'public/doodles', `${name}.webp`)).href;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// The print is narrower than the hero's, so the indentation is halved to keep the long lines whole.
const codeLines = code.lines
  .slice(0, 12)
  .map((full, i) => {
    const indent = full.match(/^ */)[0].length / 2;
    const line = full.slice(indent);
    if (i !== code.mark.line) return esc(line);
    const start = code.mark.start - indent;
    const end = start + code.mark.length;
    return `${esc(line.slice(0, start))}<span class="ring">${esc(line.slice(start, end))}</span>${esc(line.slice(end))}`;
  })
  .join('\n');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<style>
  @font-face { font-family: 'Fraunces Variable'; font-style: normal; font-weight: 100 900; src: url('${font('@fontsource-variable/fraunces', 'fraunces-latin-full-normal.woff2')}') format('woff2'); }
  @font-face { font-family: 'Fraunces Variable'; font-style: italic; font-weight: 100 900; src: url('${font('@fontsource-variable/fraunces', 'fraunces-latin-full-italic.woff2')}') format('woff2'); }
  @font-face { font-family: 'Caveat Variable'; font-weight: 400 700; src: url('${font('@fontsource-variable/caveat', 'caveat-latin-wght-normal.woff2')}') format('woff2'); }
  @font-face { font-family: 'Courier Prime'; font-weight: 400; src: url('${font('@fontsource/courier-prime', 'courier-prime-latin-400-normal.woff2')}') format('woff2'); }

  :root {
    --paper: #f3eee4; --card: #fffdf8; --ink: #1d1a16; --ink-2: rgba(29, 26, 22, 0.72);
    --pencil: #8f887b; --red: #d13b2c; --tape: rgba(255, 226, 140, 0.55);
    --sans: 'Fraunces Variable', Georgia, serif; --hand: 'Caveat Variable', cursive; --type: 'Courier Prime', monospace;
  }
  * { box-sizing: border-box; margin: 0; }
  html, body { width: 1200px; height: 630px; overflow: hidden; }
  body {
    position: relative; color: var(--ink); font-family: var(--sans);
    background-color: var(--paper);
    background-image: radial-gradient(rgba(29, 26, 22, 0.16) 1px, transparent 1.2px);
    background-size: 26px 26px; background-position: 13px 13px;
    -webkit-font-smoothing: antialiased;
  }
  body::before { content: ''; position: absolute; top: 0; bottom: 0; left: 58px; width: 1px; background: rgba(209, 59, 44, 0.45); }
  .abs { position: absolute; }

  .logo { left: 90px; top: 34px; font-family: var(--hand); font-weight: 600; font-size: 36px; line-height: 1; }
  .logo svg { display: block; width: 190px; height: 12px; margin: 2px 0 0 2px; }
  .status { left: 90px; top: 92px; font-family: var(--type); font-size: 15px; color: var(--ink-2); display: flex; align-items: center; gap: 9px; }
  .dot { width: 9px; height: 9px; border-radius: 50%; background: var(--red); box-shadow: 0 0 0 3px rgba(209, 59, 44, 0.18); }

  .display {
    left: 86px; top: 120px; width: 560px;
    font-weight: 380; font-variation-settings: 'opsz' 144, 'SOFT' 40, 'WONK' 1;
    font-size: 78px; letter-spacing: -0.02em; line-height: 0.96;
  }
  .display em { font-style: italic; font-weight: 340; }
  .mark { position: relative; display: inline-block; color: var(--red); }
  .mark svg { position: absolute; left: -2%; right: -2%; bottom: -8px; width: 104%; height: 18px; }

  .lede { left: 90px; top: 446px; width: 580px; font-size: 19px; line-height: 1.4; color: var(--ink-2); font-variation-settings: 'opsz' 14, 'SOFT' 50, 'WONK' 0; }
  .lede b { font-weight: 560; color: var(--ink); }
  .pen { left: 92px; top: 540px; font-family: var(--hand); font-weight: 500; font-size: 24px; line-height: 1.05; color: var(--red); transform: rotate(-2.5deg); transform-origin: left center; }
  .url { left: 90px; bottom: 28px; font-family: var(--type); font-size: 15px; color: var(--pencil); }
  .url b { font-weight: 400; color: var(--ink); }
  .now { right: 42px; bottom: 30px; font-family: var(--type); font-size: 14px; color: var(--ink-2); display: flex; align-items: center; gap: 9px; }

  .print { position: absolute; background: var(--card); padding: 10px 10px 40px;
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.06), 0 14px 30px rgba(40, 30, 10, 0.18), 0 40px 60px rgba(40, 30, 10, 0.1); }
  .print .face { border: 1px solid rgba(0, 0, 0, 0.08); background: var(--card); }
  .print .cap { position: absolute; left: 12px; right: 12px; bottom: 8px; display: flex; justify-content: space-between; align-items: baseline; gap: 10px;
    font-family: var(--hand); font-weight: 500; font-size: 19px; }
  .print .cap span { font-family: var(--type); font-size: 11px; color: var(--pencil); white-space: nowrap; }
  .tape { position: absolute; width: 96px; height: 26px; background: var(--tape); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08); }
  .tape.tl { left: -30px; top: -10px; transform: rotate(-40deg); }
  .tape.tr { right: -30px; top: -10px; transform: rotate(40deg); }
  .tape.tc { left: 50%; top: -12px; transform: translateX(-50%) rotate(-2deg); }

  .code { left: 640px; top: 56px; width: 300px; transform: rotate(-3.5deg); z-index: 2; }
  .code pre { font-family: var(--type); font-size: 10.5px; line-height: 15.5px; padding: 12px 9px; white-space: pre; overflow: hidden; }
  .ring { position: relative; display: inline-block; padding: 0 3px; }
  .ring::after { content: ''; position: absolute; inset: -3px -4px; border: 1.6px solid var(--red); border-radius: 60% 40% 55% 45% / 50% 60% 40% 50%; }
  .code .side { position: absolute; right: -34px; top: 74px; font-family: var(--hand); font-size: 17px; color: var(--red); transform: rotate(-12deg); white-space: nowrap; }

  .note { left: 858px; top: 338px; width: 300px; transform: rotate(2.5deg); z-index: 3; }
  .note .face { padding: 16px 16px 12px; }
  .note q { font-family: var(--hand); font-weight: 500; font-size: 20px; line-height: 1.15; quotes: '\\201C' '\\201D'; }
  .note .who { margin-top: 10px; display: flex; justify-content: space-between; font-family: var(--type); font-size: 10px; color: var(--pencil); }
  .note .who b { font-family: var(--hand); font-weight: 500; font-size: 14px; color: var(--red); }

  img.doodle { position: absolute; display: block; }
</style>
</head>
<body>
  <div class="abs logo">${esc('Vaibhav Gangani')}
    <svg viewBox="0 0 200 12" preserveAspectRatio="none"><path d="M2 8 C 40 2, 80 11, 120 6 S 190 4, 198 7" fill="none" stroke="#d13b2c" stroke-width="2.2" stroke-linecap="round" /></svg>
  </div>
  <div class="abs status"><span class="dot"></span>${esc(hero.status)}</div>

  <h1 class="abs display">
    ${esc(hero.titleLines[0])}<br />
    ${esc(hero.titleLines[1])} <em>${esc(hero.titleEm)}</em><br />
    ${esc(hero.titleB)}<br />
    <span class="mark">${esc(hero.titleMark)}<svg viewBox="0 0 300 20" preserveAspectRatio="none"><path d="M3 12 C 60 4, 120 16, 180 9 S 260 6, 297 11" fill="none" stroke="#d13b2c" stroke-width="5" stroke-linecap="round" opacity="0.85" /></svg></span>
  </h1>

  <p class="abs lede">A year as the Discord moderator at <b>Talus Labs, Inc.</b> Now developing my own products end to end, from Solidity contracts to the frontend. Kyro, the latest, is live on Arc mainnet.</p>
  <div class="abs pen">${esc(hero.note)}</div>
  <div class="abs url"><b>vaibhav0xq.com</b> &nbsp;·&nbsp; vaibhav0xq on GitHub &nbsp;·&nbsp; vaibhav_0xq on X</div>
  <div class="abs now"><span class="dot"></span>${esc(hero.now)}</div>

  <figure class="print code">
    <span class="tape tl"></span><span class="tape tr"></span>
    <div class="face"><pre>${codeLines}</pre></div>
    <div class="side">${esc(code.note)}</div>
    <figcaption class="cap">${esc(code.caption)} <span>${esc(code.date)}</span></figcaption>
  </figure>

  <figure class="print note">
    <span class="tape tc"></span>
    <div class="face">
      <q>${esc(note.quote)}</q>
      <div class="who"><b>${esc(note.about)}</b><span>${esc(note.who)}</span></div>
    </div>
    <figcaption class="cap">${esc(note.caption)} <span>${esc(note.date)}</span></figcaption>
  </figure>

  <img class="doodle" src="${doodle('bubble')}" style="left: 588px; top: 58px; width: 58px; transform: rotate(-8deg);" alt="" />
  <img class="doodle" src="${doodle('sparkle')}" style="left: 1064px; top: 96px; width: 62px;" alt="" />
  <img class="doodle" src="${doodle('coffee')}" style="left: 716px; top: 452px; width: 74px; transform: rotate(6deg);" alt="" />
</body>
</html>
`;

const dir = mkdtempSync(path.join(tmpdir(), 'og-card-'));
const page = path.join(dir, 'og.html');
const shot = path.join(dir, 'og.png');
writeFileSync(page, html);

const result = spawnSync(
  process.env.CHROME ?? 'chromium',
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--hide-scrollbars',
    '--allow-file-access-from-files',
    '--force-device-scale-factor=1',
    '--window-size=1200,630',
    '--virtual-time-budget=4000',
    `--screenshot=${shot}`,
    pathToFileURL(page).href,
  ],
  { stdio: 'pipe' },
);
if (result.status !== 0) {
  console.error(result.stderr.toString());
  process.exit(result.status ?? 1);
}
copyFileSync(shot, out);
if (keepHtml) console.log(`HTML kept at ${page}`);
else rmSync(dir, { recursive: true, force: true });
console.log(`Wrote ${path.relative(ROOT, out)} (1200 x 630)`);
