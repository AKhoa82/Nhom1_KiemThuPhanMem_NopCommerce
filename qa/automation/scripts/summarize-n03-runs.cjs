#!/usr/bin/env node
'use strict';
// SCRUM-91 / N03: build the before/after table and frequency summary from a series folder
// produced by run-n03-series.ps1.   usage: node summarize-n03-runs.cjs <seriesDir> [--md <file>]
// The SQL verdict is computed here from SQL alone and then compared with the Playwright
// attempt (n03-attempt.json), so a tab-level claim never replaces the data check.
const fs = require('node:fs');
const path = require('node:path');

const args = process.argv.slice(2);
const dir = args[0];
if (!dir || !fs.existsSync(dir)) { console.error('usage: summarize-n03-runs.cjs <seriesDir> [--md <file>]'); process.exit(2); }
const mdIndex = args.indexOf('--md');
const mdOut = mdIndex >= 0 ? args[mdIndex + 1] : path.join(dir, 'summary.md');

const EXPECTED = { qty: 4, stockBefore: 5, stockAfterOneOrder: 1, sku: 'PW-SHIRT' };

function parseSnapshot(text) {
  const out = { orders: [], items: [], settings: {}, raw: text };
  for (const line of text.split(/\r?\n/)) {
    const [key, ...rest] = line.split('|');
    const kv = Object.fromEntries(rest.filter(s => s.includes('=')).map(s => [s.slice(0, s.indexOf('=')), s.slice(s.indexOf('=') + 1)]));
    switch (key) {
      case 'N03_SNAPSHOT_UTC': out.utc = rest[0]; break;
      case 'N03_CUSTOMER': out.customerId = kv.id; break;
      case 'N03_ORDER_COUNT': out.orderCount = Number(rest[0]); break;
      case 'N03_ORDER': out.orders.push(kv); break;
      case 'N03_ORDER_ITEM': out.items.push({ ...kv, qty: Number(kv.qty) }); break;
      case 'N03_DUP_ORDERGUID': out.dupGuidGroups = Number(kv.groups); break;
      case 'N03_STOCK_RED_S': out.stock = Number(rest[0]); break;
      case 'N03_CART': out.cartRows = Number(kv.rows); out.cartQty = Number(kv.qty); break;
      case 'N03_PAYMENT_REQUEST': out.paymentRequest = Number(kv.present); break;
      case 'N03_SETTING': out.settings[rest[0]] = rest[1]; break;
      default: break;
    }
  }
  return out;
}

function findAttempt(resultsFile, runDir) {
  if (!fs.existsSync(resultsFile)) return null;
  const json = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
  const stack = [...(json.suites || [])];
  while (stack.length) {
    const node = stack.pop();
    stack.push(...(node.suites || []));
    for (const spec of node.specs || []) {
      for (const t of spec.tests || []) {
        for (const r of t.results || []) {
          for (const a of r.attachments || []) {
            if (a.name !== 'n03-attempt.json') continue;
            if (a.body) return JSON.parse(Buffer.from(a.body, 'base64').toString('utf8'));
            if (a.path) {
              const candidates = [a.path, path.join(runDir, 'artifacts', path.basename(a.path))];
              const hit = candidates.find(p => fs.existsSync(p));
              if (hit) return JSON.parse(fs.readFileSync(hit, 'utf8'));
            }
          }
        }
      }
    }
  }
  return null;
}

function wilson(k, n, z = 1.96) {
  if (n === 0) return [NaN, NaN];
  const p = k / n, d = 1 + z * z / n;
  const c = p + z * z / (2 * n), m = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));
  return [Math.max(0, (c - m) / d), Math.min(1, (c + m) / d)];
}
const pct = x => Number.isNaN(x) ? 'n/a' : `${(x * 100).toFixed(0)}%`;

function judge(before, after, attempt) {
  const notes = [];
  const delta = after.orderCount - before.orderCount;
  const beforeIds = new Set(before.orders.map(o => o.id));
  const newOrders = after.orders.filter(o => !beforeIds.has(o.id));
  const guids = after.orders.map(o => o.guid);
  const guidUnique = new Set(guids).size === guids.length && !after.dupGuidGroups;
  const newItems = after.items.filter(i => newOrders.some(o => o.id === i.order));
  const itemsOk = newOrders.length > 0 && newOrders.every(o => {
    const its = newItems.filter(i => i.order === o.id);
    return its.length === 1 && its[0].sku === EXPECTED.sku && its[0].qty === EXPECTED.qty;
  });
  const stockExpected = EXPECTED.stockBefore - EXPECTED.qty * delta;
  const stockOk = after.stock === stockExpected;
  const cartOk = delta >= 1 ? after.cartRows === 0 : after.cartRows === before.cartRows && after.cartQty === before.cartQty;
  const preOk = before.stock === EXPECTED.stockBefore && before.cartRows === 1 && before.cartQty === EXPECTED.qty;
  if (!preOk) notes.push(`precondition not met (stock=${before.stock}, cart=${before.cartRows}x${before.cartQty})`);
  if (!guidUnique) notes.push('duplicate OrderGuid');
  if (delta >= 1 && !itemsOk) notes.push('OrderItem is not exactly one PW-SHIRT line of 4');
  if (!stockOk) notes.push(`stock ${after.stock}, expected ${stockExpected}`);
  if (!cartOk) notes.push(`cart after = ${after.cartRows} rows / qty ${after.cartQty}`);

  const leak = attempt ? Boolean(attempt.leakedSql) : null;
  const timingValid = attempt ? attempt.dispatchGapMs != null && attempt.dispatchGapMs <= attempt.maxDispatchGapMs
    && attempt.tabs && attempt.tabs.A && attempt.tabs.B && attempt.tabs.A.startedAtMs != null && attempt.tabs.B.startedAtMs != null : false;
  if (attempt && attempt.orderDelta !== delta) notes.push(`Playwright orderDelta ${attempt.orderDelta} differs from SQL delta ${delta}`);

  let verdict;
  if (!preOk) verdict = 'BLOCKED';
  else if (delta >= 2 || !guidUnique) verdict = 'FAIL_DOUBLE_ORDER';
  else if (!attempt) verdict = 'INCONCLUSIVE_NO_ATTEMPT_LOG';
  else if (!timingValid) verdict = 'INCONCLUSIVE_TIMING';
  else if (delta === 0) verdict = 'INCONCLUSIVE_NO_ORDER';
  else if (!itemsOk || !stockOk || !cartOk) verdict = 'FAIL_DATA_MISMATCH';
  else if (leak) verdict = 'REPRODUCED_B02';
  else verdict = 'NOT_REPRODUCED_THIS_RUN';
  return { delta, newOrderIds: newOrders.map(o => o.id), newGuids: newOrders.map(o => o.guid), itemsOk, stockOk, cartOk, guidUnique, leak, timingValid, verdict, notes };
}

const series = fs.existsSync(path.join(dir, 'series.json')) ? JSON.parse(fs.readFileSync(path.join(dir, 'series.json'), 'utf8').replace(/^﻿/, '')) : {};
const runDirs = fs.readdirSync(dir).filter(n => /^run\d+$/.test(n)).sort();
const rows = [];
for (const name of runDirs) {
  const rd = path.join(dir, name);
  const read = f => fs.readFileSync(path.join(rd, f), 'utf8').replace(/^﻿/, '');
  if (!fs.existsSync(path.join(rd, 'sql-before.txt')) || !fs.existsSync(path.join(rd, 'sql-after.txt'))) {
    rows.push({ name, verdict: 'INCOMPLETE_RUN', notes: ['missing SQL snapshot'] });
    continue;
  }
  const before = parseSnapshot(read('sql-before.txt'));
  const after = parseSnapshot(read('sql-after.txt'));
  const attempt = findAttempt(path.join(rd, 'results.json'), rd);
  rows.push({ name, before, after, attempt, ...judge(before, after, attempt) });
}

const tally = {};
for (const r of rows) tally[r.verdict] = (tally[r.verdict] || 0) + 1;
const valid = rows.filter(r => ['REPRODUCED_B02', 'NOT_REPRODUCED_THIS_RUN', 'FAIL_DATA_MISMATCH', 'FAIL_DOUBLE_ORDER'].includes(r.verdict));
const reproduced = valid.filter(r => r.verdict === 'REPRODUCED_B02').length;
const doubles = rows.filter(r => r.verdict === 'FAIL_DOUBLE_ORDER').length;
const [lo, hi] = wilson(reproduced, valid.length);
const tabState = (t) => !t ? '-' : `${t.responseStatus ?? '?'}${t.sqlErrorShown ? ' SQL-error' : ''}`;
const cfg = rows.find(r => r.before)?.before.settings || {};

const lines = [];
lines.push(`# N03 CHK-RACE-01 — SQL before/after and frequency (${series.label || path.basename(dir)})`);
lines.push('');
lines.push(`Source commit: \`${series.sourceCommit || 'unknown'}\`. Runs found: ${rows.length}${series.runsRequested ? ` of ${series.runsRequested} requested` : ''}. Defect: SCRUM-100 (B02).`);
lines.push(`Config read from SQL: ${Object.entries(cfg).map(([k, v]) => `${k.replace(/^.*settings\./, '')}=${v}`).join(', ') || 'not captured'}.`);
lines.push('');
lines.push('| Run | POST gap (ms) | Tab A | Tab B | Orders before→after | New OrderGuid | OrderItem | Stock before→after | Cart rows before→after | Verdict |');
lines.push('| --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- |');
for (const r of rows) {
  if (!r.before) { lines.push(`| ${r.name} | - | - | - | - | - | - | - | - | ${r.verdict} |`); continue; }
  const a = r.attempt;
  const items = r.newOrderIds.length ? (r.itemsOk ? `1×${EXPECTED.sku}×${EXPECTED.qty}` : 'MISMATCH') : '-';
  lines.push(`| ${r.name} | ${a && a.dispatchGapMs != null ? a.dispatchGapMs.toFixed(1) : '-'} | ${tabState(a && a.tabs.A)} | ${tabState(a && a.tabs.B)} | ${r.before.orderCount}→${r.after.orderCount} (Δ${r.delta}) | ${r.newGuids.join(', ') || '-'} | ${items} | ${r.before.stock}→${r.after.stock} | ${r.before.cartRows}→${r.after.cartRows} | ${r.verdict}${r.notes.length ? ' — ' + r.notes.join('; ') : ''} |`);
}
lines.push('');
lines.push('## Frequency');
lines.push('');
lines.push(`- Verdict counts: ${Object.entries(tally).map(([k, v]) => `${k}=${v}`).join(', ') || 'none'}.`);
lines.push(`- Runs with a valid concurrent dispatch and an order: **${valid.length}**. SQL error exposed (SCRUM-100 reproduced): **${reproduced}/${valid.length}** (Wilson 95% interval ${pct(lo)}–${pct(hi)}).`);
lines.push(`- Double-order runs (Δ orders ≥ 2 or duplicate OrderGuid): **${doubles}**.`);
lines.push(`- Excluded from the denominator: ${rows.length - valid.length} run(s) that were blocked, had invalid timing, created no order, or were incomplete.`);
lines.push('');
lines.push('## Limits of this evidence');
lines.push('');
lines.push('- The rate applies only to this machine, this build/commit, this configuration and this dispatch gap; it is not a general probability.');
lines.push('- `NOT_REPRODUCED_THIS_RUN` means no SQL error was seen and the data was consistent in that run. It does not prove the defect is fixed; Pass for the second tab also needs a reviewed screenshot showing a safe business message or the same order.');
lines.push('- A verdict computed from SQL alone cannot see what a tab displayed; tab columns come from Playwright\'s `n03-attempt.json`.');
lines.push('- Raw traces, HTML and screenshots stay local and are not committed.');
fs.writeFileSync(mdOut, lines.join('\n') + '\n', 'utf8');
fs.writeFileSync(path.join(dir, 'summary.json'), JSON.stringify({ series, tally, reproduced, validRuns: valid.length, wilson95: [lo, hi], doubles,
  runs: rows.map(r => ({ name: r.name, verdict: r.verdict, delta: r.delta, newOrderIds: r.newOrderIds, newGuids: r.newGuids, notes: r.notes })) }, null, 2), 'utf8');
console.log(lines.join('\n'));
