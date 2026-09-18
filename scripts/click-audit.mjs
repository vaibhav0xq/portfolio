// Checks that every link and button on the page can actually be hit with the mouse.
// For each control it asks the browser what sits at the control's centre point (an overlay that
// swallows clicks shows up here) and then really clicks the hero buttons and the nav links through
// the input layer and checks that the page moved.
// Usage: node scripts/click-audit.mjs [--url http://localhost:5173/] [--width 1440] [--height 900] [--wait 9000] [--nogl]
// Needs a Chromium binary: the first one on PATH, or the path in the CHROME environment variable.
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, arg, i, all) => {
    if (arg.startsWith('--')) {
      const next = all[i + 1];
      acc.push([arg.slice(2), next && !next.startsWith('--') ? next : 'true']);
    }
    return acc;
  }, []),
);

const url = args.url ?? `http://localhost:${process.env.PORT ?? '5173'}/`;
const width = Number(args.width ?? 1440);
const height = Number(args.height ?? 900);
const wait = Number(args.wait ?? 9000);
const debugPort = 9300 + Math.floor(Math.random() * 500);

// Chromium keeps its profile and cert store in a throwaway directory, so the workspace stays clean.
const scratch = mkdtempSync(join(tmpdir(), 'click-audit-'));
const flags = [
  '--headless=new',
  '--no-sandbox',
  `--user-data-dir=${scratch}`,
  '--disable-gpu-sandbox',
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
  '--hide-scrollbars',
  `--remote-debugging-port=${debugPort}`,
  `--window-size=${width},${height}`,
];
if (args.nogl === 'true') flags.splice(-1, 0, '--disable-webgl', '--disable-webgl2');

const chrome = spawn(process.env.CHROME ?? 'chromium', flags, { stdio: 'ignore', env: { ...process.env, HOME: scratch } });
let chromeGone = null;
chrome.on('error', (err) => (chromeGone = `Chromium failed to start: ${err.message}`));
chrome.on('exit', (code) => (chromeGone ??= `Chromium exited early (code ${code})`));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getTarget() {
  for (let i = 0; i < 50; i++) {
    if (chromeGone) throw new Error(chromeGone);
    try {
      const res = await fetch(`http://127.0.0.1:${debugPort}/json`);
      const page = (await res.json()).find((t) => t.type === 'page');
      if (page) return page;
    } catch {
      // Chrome is still starting.
    }
    await sleep(200);
  }
  throw new Error('Chrome did not expose a page target');
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const pending = new Map();
    let id = 0;
    const logs = [];
    ws.addEventListener('open', () => resolve({ send, logs, close: () => ws.close() }));
    ws.addEventListener('error', reject);
    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
      } else if (msg.method === 'Runtime.exceptionThrown') {
        logs.push(`exception: ${msg.params.exceptionDetails.text} ${msg.params.exceptionDetails.exception?.description ?? ''}`);
      }
    });
    function send(method, params = {}) {
      return new Promise((res, rej) => {
        pending.set(++id, { res, rej });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }
  });
}

// Runs in the page: lists every control whose centre is not covered by itself.
const auditExpr = `(() => {
  const out = { covered: [], total: 0, inert: !!document.querySelector('.sheet[inert]'), stopped: document.documentElement.classList.contains('lenis-stopped') };
  const controls = [...document.querySelectorAll('a[href], button, [role="button"]')];
  for (const el of controls) {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue;
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    if (cx < 0 || cx > innerWidth || cy < 0 || cy > innerHeight) continue;
    out.total++;
    const hit = document.elementFromPoint(cx, cy);
    if (!hit || !(el === hit || el.contains(hit))) {
      const label = (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40);
      out.covered.push({ control: el.tagName.toLowerCase() + ' ' + label, hit: hit ? hit.tagName.toLowerCase() + '.' + [...hit.classList].slice(0, 3).join('.') : 'nothing', cursor: cs.cursor.slice(0, 40) });
    }
  }
  return JSON.stringify(out);
})()`;

async function evaluate(cdp, expression) {
  const { result } = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  return result.value;
}

async function clickAt(cdp, x, y) {
  for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) {
    await cdp.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
  }
}

let failures = 0;
try {
  const target = await getTarget();
  const cdp = await connect(target.webSocketDebuggerUrl);
  await cdp.send('Runtime.enable');
  await cdp.send('Page.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 800 });
  await cdp.send('Page.navigate', { url });
  // Wait for the preloader to finish (it takes its time on purpose), up to `wait` ms after load.
  await sleep(2000);
  for (let i = 0; i < wait / 500; i++) {
    if (await evaluate(cdp, "!document.querySelector('.loader') && !!document.querySelector('.cta')")) break;
    await sleep(500);
  }
  await sleep(1500);

  // 1. Hit test every visible control at a few scroll positions.
  const stops = ['#top', '#work', '#projects', '#about', '#hire', '#contact'];
  for (const stop of stops) {
    await evaluate(cdp, `document.querySelector(${JSON.stringify(stop)})?.scrollIntoView({ block: 'start' })`);
    await sleep(1200);
    const res = JSON.parse(await evaluate(cdp, auditExpr));
    const state = `${res.inert ? 'INERT ' : ''}${res.stopped ? 'LENIS-STOPPED ' : ''}`;
    if (res.covered.length || res.inert) failures++;
    console.log(`${stop}: ${res.total} controls, ${res.covered.length} covered ${state}`);
    for (const c of res.covered) console.log(`   covered: ${c.control} <- ${c.hit} (cursor ${c.cursor})`);
  }

  // 2. Real clicks through the input layer: hero buttons and a nav link.
  await evaluate(cdp, 'window.scrollTo(0, 0)');
  await sleep(1200);
  // Centre of the first visible match for a selector, or null.
  const centre = (sel) =>
    evaluate(
      cdp,
      `(() => { for (const el of document.querySelectorAll(${JSON.stringify(sel)})) { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); if (r.width < 2 || cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue; if (r.top < 0 || r.bottom > innerHeight) continue; return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; } return null; })()`,
    );
  const clicks = [
    { sel: '.cta a:nth-child(1)', expectId: 'projects' },
    { sel: '.cta a:nth-child(2)', expectId: 'contact' },
    { sel: '[data-nav] a[href="#about"], #menu a[href="#about"]', expectId: 'about', menu: 'button[aria-controls="menu"]' },
  ];
  for (const c of clicks) {
    await evaluate(cdp, 'window.scrollTo(0, 0)');
    await sleep(1500);
    let box = await centre(c.sel);
    if (!box && c.menu) {
      // Narrow layout: the link lives in the phone menu, so open it first.
      const menu = await centre(c.menu);
      if (menu) {
        await clickAt(cdp, menu.x, menu.y);
        await sleep(900);
        box = await centre(c.sel);
      }
    }
    if (!box) {
      console.log(`click ${c.sel}: no visible control`);
      failures++;
      continue;
    }
    await clickAt(cdp, box.x, box.y);
    await sleep(2200);
    const where = JSON.parse(
      await evaluate(cdp, `(() => { const t = document.getElementById(${JSON.stringify(c.expectId)}); return JSON.stringify({ scrollY: Math.round(window.scrollY), targetTop: t ? Math.round(t.getBoundingClientRect().top) : null }); })()`),
    );
    const ok = where.scrollY > 200 && where.targetTop !== null && where.targetTop < 400;
    if (!ok) failures++;
    console.log(`click ${c.sel}: ${ok ? 'ok' : 'FAILED'} scrollY=${where.scrollY} target top=${where.targetTop}`);
  }
  // 3. The community board opens the lightbox and its close button closes it.
  await evaluate(cdp, "document.querySelector('.board')?.scrollIntoView({ block: 'center' })");
  await sleep(1500);
  const tile = await centre('.board button');
  if (tile) {
    await clickAt(cdp, tile.x, tile.y);
    await sleep(900);
    const opened = await evaluate(cdp, "!!document.querySelector('.lightbox')");
    let closed = false;
    if (opened) {
      const close = await centre('.lightbox button');
      if (close) {
        await clickAt(cdp, close.x, close.y);
        await sleep(900);
        closed = await evaluate(cdp, "!document.querySelector('.lightbox')");
      }
    }
    if (!opened || !closed) failures++;
    console.log(`lightbox: open ${opened ? 'ok' : 'FAILED'}, close ${closed ? 'ok' : 'FAILED'}`);
  } else {
    console.log('lightbox: no visible board tile');
    failures++;
  }
  // 4. Anything the page threw counts as a failure too.
  if (cdp.logs.length) {
    failures += cdp.logs.length;
    console.log(cdp.logs.join('\n'));
  }
  cdp.close();
} finally {
  chrome.kill('SIGKILL');
  rmSync(scratch, { recursive: true, force: true });
}
console.log(failures ? `FAIL (${failures})` : 'all clickable');
process.exit(failures ? 1 : 0);
