#!/usr/bin/env node
// Screenshots the running dev server through the Chrome DevTools Protocol so the page can be
// scrolled to any section before capture. Uses software WebGL so the 3D scene renders.
//
// Usage: node scripts/snap.mjs [--url http://localhost:5173/] [--width 1440] [--height 900] [--scroll "#products"]
//        [--out /tmp/shot.png] [--wait 2500] [--static] [--eval "<js expression>"]
// Needs a Chromium binary: the first one on PATH, or the path in the CHROME environment variable.
// --scroll takes a CSS selector (scrolled into view) or a number of pixels.
// --static renders with prefers-reduced-motion so entrance animations are skipped.
// --nogl disables WebGL so the DOM fallback path can be checked on a wide viewport.
// --block "*.png,*.webp" blocks matching requests, which is how the image placeholders are checked.

import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, arg, i, all) => {
    if (arg.startsWith('--')) {
      const next = all[i + 1];
      acc.push([arg.slice(2), next && !next.startsWith('--') ? next : 'true']);
    }
    return acc;
  }, []),
);

const width = Number(args.width ?? 1440);
const height = Number(args.height ?? 900);
const out = args.out ?? `/tmp/portfolio-${width}x${height}.png`;
const wait = Number(args.wait ?? 2500);
const port = process.env.PORT ?? '5173';
const url = args.url ?? `http://localhost:${port}/`;
const debugPort = 9333 + Math.floor(Math.random() * 500);

const flags = [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu-sandbox',
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
  '--hide-scrollbars',
  `--remote-debugging-port=${debugPort}`,
  `--window-size=${width},${height}`,
  'about:blank',
];
if (args.static === 'true') flags.splice(-1, 0, '--force-prefers-reduced-motion');
if (args.nogl === 'true') flags.splice(-1, 0, '--disable-webgl', '--disable-webgl2');

const chrome = spawn(process.env.CHROME ?? 'chromium', flags, { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getTarget() {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${debugPort}/json`);
      const list = await res.json();
      const page = list.find((t) => t.type === 'page');
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
      } else if (msg.method === 'Runtime.consoleAPICalled') {
        logs.push(`${msg.params.type}: ${msg.params.args.map((a) => a.value ?? a.description ?? '').join(' ')}`);
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

try {
  const target = await getTarget();
  const cdp = await connect(target.webSocketDebuggerUrl);
  await cdp.send('Runtime.enable');
  await cdp.send('Page.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 800,
  });
  if (args.block) {
    await cdp.send('Network.enable');
    await cdp.send('Network.setBlockedURLs', { urls: args.block.split(',') });
  }
  await cdp.send('Page.navigate', { url });
  await sleep(wait);

  if (args.scroll) {
    const expr = /^\d+$/.test(args.scroll)
      ? `window.scrollTo(0, ${args.scroll})`
      : `document.querySelector(${JSON.stringify(args.scroll)})?.scrollIntoView({ block: 'start' })`;
    await cdp.send('Runtime.evaluate', { expression: expr });
    await sleep(Math.max(1500, wait * 0.6));
  }

  if (args.eval) {
    const { result: evalResult } = await cdp.send('Runtime.evaluate', { expression: args.eval, returnByValue: true, awaitPromise: true });
    console.log('eval:', JSON.stringify(evalResult.value));
  }

  const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  await writeFile(out, Buffer.from(shot.data, 'base64'));
  const { result } = await cdp.send('Runtime.evaluate', {
    expression: 'JSON.stringify({ scrollY: window.scrollY, height: document.documentElement.scrollHeight })',
    returnByValue: true,
  });
  console.log(out, result.value);
  if (cdp.logs.length) console.log(cdp.logs.join('\n'));
  cdp.close();
} finally {
  chrome.kill('SIGKILL');
}
