#!/usr/bin/env node
// Checks the source for the copy rules the site owner enforces: no em or en dashes, no comma
// before "and" or "or", no emojis and no filler words. Comments are scanned too, except by the
// word list. Usage: node scripts/check-copy.mjs (or pnpm check:copy). Exits 1 on any failure.
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const files = ['index.html', 'README.md', ...walk('src').filter((f) => /\.(ts|tsx|html)$/.test(f))];

const rules = [
  { label: 'no em or en dashes', test: /[\u2014\u2013]/ },
  { label: 'no comma before and/or', test: /, (and|or) / },
  { label: 'no emojis', test: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u },
  {
    label: 'no banned words',
    test: /\b(excited|thrilled|passionate|leverage|leveraging|seamless|robust|cutting-edge|innovative|game-changing|journey|empower|elevate|unlock|delve|synergy|spearheaded|rockstar|ninja|guru|dynamic|results-driven|detail-oriented|fast-paced|revolutionize|disrupt|crafting)\b|digital experiences|bringing ideas to life|at the intersection of/i,
    skipComments: true,
  },
];

let status = 0;
for (const rule of rules) {
  const hits = [];
  for (const file of files) {
    const lines = readFileSync(path.join(root, file), 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (rule.skipComments && /^\s*(\/\/|\*|\/\*)/.test(line)) return;
      if (rule.test.test(line)) hits.push(`${file}:${i + 1}: ${line.trim()}`);
    });
  }
  if (hits.length) {
    status = 1;
    console.log(`FAIL: ${rule.label}`);
    for (const hit of hits) console.log(hit);
    console.log();
  } else {
    console.log(`ok: ${rule.label}`);
  }
}
process.exit(status);

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(rel));
    else out.push(rel);
  }
  return out;
}
