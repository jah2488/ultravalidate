#!/usr/bin/env node
// Score the ultravalidate detection benchmark. On flawed cases, a flaw is "caught" if the assessment
// matches every regex in its `need`. On valid cases, an "over-flag" is the assessment wrongly calling
// a sound claim untrustworthy (matches OVERFLAG). Reports per arm: flaw-catch recall, over-flag rate,
// and recall by flaw type. Writes <snap>.scored.json for the chart.
//
// Usage: node measure.mjs [snapshots/results-<date>.json]

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { CASES } from "./cases.mjs";

// On a valid claim, an "over-flag" is concluding it should NOT be trusted. We score the CONCLUSION
// (does the assessment land on trust/supported?), not the presence of words like "confound" (which
// appear as check headers in a structured assessment even when the verdict is "supported"). The
// earlier keyword metric mistook that vocabulary for rejection.
const TRUST = /(verdict[:*\s]*\**\s*(supported|sound|valid|trustworthy))|trust(worthy)?\b|holds up|well[- ]supported|is (sound|reliable|valid|credible|solid|trustworthy)|(would|'d|can|reasonable to) (trust|accept|believe|act)|no (significant )?(flaw|problem|issue)|appears (sound|valid|correct)|reconciles|matches( the| up)?|adds up|checks out|the (math|number|total|sum)s? (is |are |all )?(correct|right|check)/i;

const HERE = dirname(fileURLToPath(import.meta.url));
const byId = Object.fromEntries(CASES.map((c) => [c.id, c]));
const newest = () => {
  const dir = join(HERE, "snapshots");
  const f = readdirSync(dir).filter((x) => x.startsWith("results-") && x.endsWith(".json")).sort();
  if (!f.length) throw new Error("no snapshot");
  return join(dir, f[f.length - 1]);
};
const SNAP = process.argv[2] || newest();
const snap = JSON.parse(readFileSync(SNAP, "utf8"));
const arms = snap.metadata.arms;

const scored = snap.records.map((r) => {
  const c = byId[r.case];
  const text = r.result || "";
  if (c.flaw == null) return { ...r, valid: true, overflag: !r.error && !TRUST.test(text) };
  return { ...r, valid: false, caught: !r.error && c.need.every((rx) => rx.test(text)) };
});

const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);
function recall(arm) {
  const rows = scored.filter((s) => s.arm === arm && !s.valid);
  const hit = rows.filter((s) => s.caught).length;
  return { hit, n: rows.length, pct: pct(hit, rows.length) };
}
function overflag(arm) {
  const rows = scored.filter((s) => s.arm === arm && s.valid);
  const f = rows.filter((s) => s.overflag).length;
  return { f, n: rows.length, pct: pct(f, rows.length) };
}
const flaws = [...new Set(CASES.filter((c) => c.flaw).map((c) => c.flaw))];
function flawRecall(arm, flaw) {
  const rows = scored.filter((s) => s.arm === arm && byId[s.case].flaw === flaw);
  return { hit: rows.filter((s) => s.caught).length, n: rows.length, pct: pct(rows.filter((s) => s.caught).length, rows.length) };
}

const L = [];
const p = (s = "") => L.push(s);
p(`# ultravalidate detection benchmark`);
p(`_Model: \`${snap.metadata.model}\` · reps: ${snap.metadata.reps} · ${CASES.filter((c) => c.flaw).length} flawed + ${CASES.filter((c) => !c.flaw).length} valid claims_`);
p();
p(`## Flaw-catch recall (higher = catches more), over-flag rate on valid claims (lower = fewer false alarms)`);
p(`| arm | flaw-catch recall | caught/flawed | over-flags valid claims |`);
p(`|-----|--:|--:|--:|`);
for (const arm of arms) {
  const rc = recall(arm), of = overflag(arm);
  p(`| ${arm === "ultravalidate" ? "**ultravalidate**" : arm} | ${rc.pct}% | ${rc.hit}/${rc.n} | ${of.pct}% (${of.f}/${of.n}) |`);
}
p();
p(`## Recall by flaw type`);
p(`| flaw | ${arms.join(" | ")} |`);
p(`|------|${arms.map(() => "--:").join("|")}|`);
for (const fl of flaws) p(`| ${fl} | ${arms.map((a) => flawRecall(a, fl).pct + "%").join(" | ")} |`);
console.log(L.join("\n"));

writeFileSync(SNAP.replace(/\.json$/, ".scored.json"), JSON.stringify({
  arms, flaws,
  recall: Object.fromEntries(arms.map((a) => [a, recall(a)])),
  overflag: Object.fromEntries(arms.map((a) => [a, overflag(a)])),
  byFlaw: Object.fromEntries(arms.map((a) => [a, Object.fromEntries(flaws.map((fl) => [fl, flawRecall(a, fl)]))])),
}, null, 2));
