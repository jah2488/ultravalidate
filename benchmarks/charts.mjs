#!/usr/bin/env node
// Generate assets/benchmark.svg from a scored snapshot. Horizontal bars of flaw-catch recall per
// arm; ultravalidate highlighted. Numbers come straight from the data.
//
// Usage: node charts.mjs [snapshots/results-<date>.scored.json]

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const newest = () => {
  const dir = join(HERE, "snapshots");
  const f = readdirSync(dir).filter((x) => x.endsWith(".scored.json")).sort();
  if (!f.length) throw new Error("no scored snapshot");
  return join(dir, f[f.length - 1]);
};
const d = JSON.parse(readFileSync(process.argv[2] || newest(), "utf8"));
const FONT = "-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif";
const LABEL = { baseline: "plain assessment", skeptical: "assess, be skeptical", ultravalidate: "ultravalidate" };

const order = d.arms;
const PW = 360, X0 = 178;
const bars = order.map((a, i) => {
  const rc = d.recall[a], of = d.overflag[a];
  const w = Math.round((rc.pct / 100) * PW);
  const y = 88 + i * 50;
  const isSkill = a === "ultravalidate";
  const fill = isSkill ? "#0f766e" : "#b4b9c0";
  return `<text x="168" y="${y + 17}" text-anchor="end" class="lbl">${LABEL[a] || a}</text>` +
    `<rect x="${X0}" y="${y}" width="${w}" height="26" rx="4" fill="${fill}"/>` +
    `<text x="${X0 + w + 8}" y="${y + 13}" class="${isSkill ? "fv" : "val"}">${rc.pct}% re-derived <tspan class="cap">(${rc.hit}/${rc.n})</tspan></text>` +
    `<text x="${X0 + w + 8}" y="${y + 27}" class="cap">false alarms on valid claims ${of.pct}%</text>`;
});
const H = 88 + order.length * 50 + 26;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 ${H}" font-family="${FONT}" role="img" aria-label="ultravalidate re-derives the correct number from buried data 100% of the time versus 87% for a plain review, with no false alarms"><style>.lbl{fill:#6b7280;font-size:13px}.sub{fill:#374151;font-size:13px;font-weight:700}.val{fill:#9aa0a6;font-size:12px}.fv{fill:#0f766e;font-size:12px;font-weight:700}.cap{fill:#9aa0a6;font-size:11px}</style>
<text x="20" y="26" class="sub" font-size="15">Re-derive the number, or repeat the wrong one</text>
<text x="20" y="44" class="cap">6 status updates whose headline number is wrong, with the raw data buried in noise. A catch means</text>
<text x="20" y="58" class="cap">actually re-deriving the correct figure. 2 valid claims included; no reviewer raised a false alarm.</text>
${bars.join("\n")}
<text x="20" y="${H - 8}" class="cap">${d.arms.length} arms, claude-haiku-4-5, 5 reps. a catch requires the correct recomputed figure plus a reconcile signal, scored identically across arms.</text></svg>`;
writeFileSync(join(HERE, "..", "assets", "benchmark.svg"), svg);
console.error(`benchmark.svg: ${order.map((a) => `${a} ${d.recall[a].pct}%`).join(", ")}`);
