// ultravalidate reconciliation benchmark. Each "flawed" case is a claim whose headline number is
// WRONG, paired with a noisy context that contains the raw data the number should have come from.
// Recomputing from that raw data gives a different value. A reviewer "catches" the case only by
// actually re-deriving the correct number (matching every regex in `need`: the correct figure plus
// a reconcile signal), not by vaguely suggesting a double-check. "valid" cases state a number that
// DOES reconcile, to measure false alarms. This targets the regime ultravalidate is built for: a
// long session where the model would otherwise trust a stated summary instead of going to source.
// The same detector scores every arm, so the between-arm comparison is fair.

export const ARMS = {
  baseline: "You are reviewing a teammate's status update. Assess the claim below: should it be trusted?",
  skeptical:
    "You are reviewing a teammate's status update. Assess the claim below: should it be trusted? " +
    "Be skeptical and look hard for reasons it might be wrong.",
  ultravalidate: "ULTRAVALIDATE_SKILL", // built at runtime: baseline + the SKILL.md body
};

const NOISE_TOP =
  "Sprint 41 wrap-up. Thanks everyone for a heavy two weeks. A few housekeeping notes before the " +
  "numbers: the staging migration is done, on-call rotates to the platform pod Monday, and the " +
  "design review for the new nav got pushed to next sprint. We also finally retired the legacy " +
  "cron box. Hiring is still slow; two candidates in the final round.\n\n";
const NOISE_MID =
  "\nUnrelated but worth flagging: the flaky checkout test is quarantined, not fixed, so do not read " +
  "too much into the green CI. The vendor invoice question is still open with finance. OKRs are " +
  "locked for the quarter.\n\n";
const NOISE_BOTTOM =
  "\nNext sprint we pick up the search reindex and the billing webhook retries. Ping me with " +
  "questions, otherwise see notes in the planning doc. Good work all.";
// Noise for the valid cases: irrelevant but internally consistent, with no finance/audit tension that
// a rigorous reviewer could legitimately flag (that tension is what NOISE_MID deliberately carries).
const CLEAN_NOISE =
  "\n\nElsewhere this sprint: the docs site got a refresh, we upgraded the CI runners, and the " +
  "design team shipped the new icon set. On-call was quiet. Planning for next sprint is on the " +
  "board.\n\nThanks all, see you at retro.";

export const CASES = [
  {
    id: "revenue-sum",
    flaw: "reconciliation",
    scenario:
      "Claim: 'Q3 revenue landed at $48,000, a strong quarter.'\n\nContext:\n" + NOISE_TOP +
      "Revenue by month is in the finance export: July closed at $14,200, August at $13,500, and " +
      "September at $11,300. Pipeline for Q4 looks healthier." + NOISE_MID +
      "The board deck rounds the quarter to ~$48k in the headline slide." + NOISE_BOTTOM,
    need: [/\$?39,?000|\$?39k|39 ?thousand/i, /sum|add(s|ed| up)?|recompute|reconcile|does ?n('|o)?t (match|add)|actually|14,?200.*13,?500.*11,?300|not \$?48|total(s|ed)? (to|\$)?/i],
  },
  {
    id: "conversion-pct",
    flaw: "reconciliation",
    scenario:
      "Claim: 'Trial-to-paid conversion is 25% this month, up and to the right.'\n\nContext:\n" + NOISE_TOP +
      "From the growth dashboard: 1,200 trials started this month and 216 of them upgraded to a paid " +
      "plan. Activation is steady." + NOISE_MID +
      "The weekly email summarized it as 'conversion strong at 25%'." + NOISE_BOTTOM,
    need: [/\b18 ?%|0?\.18\b/, /recompute|reconcile|does ?n('|o)?t match|actually|216 ?\/ ?1,?200|not 25|works? out to|comes? out to/i],
  },
  {
    id: "latency-mean",
    flaw: "reconciliation",
    scenario:
      "Claim: 'Average API latency is 120ms, within SLA.'\n\nContext:\n" + NOISE_TOP +
      "Per-endpoint p50 from the last hour: /search 100ms, /cart 150ms, /checkout 300ms, /profile " +
      "250ms. Traffic is roughly even across the four." + NOISE_MID +
      "The status page tile shows '~120ms avg', inherited from an old config." + NOISE_BOTTOM,
    need: [/\b200 ?ms|\b200\b/, /average|mean|recompute|reconcile|does ?n('|o)?t match|actually|not 120/i],
  },
  {
    id: "tickets-count",
    flaw: "reconciliation",
    scenario:
      "Claim: 'We closed 50 tickets this sprint, a record.'\n\nContext:\n" + NOISE_TOP +
      "Closed-ticket counts per engineer from the board: Ana 8, Ben 11, Cira 6, Dev 9, Eli 4. No one " +
      "else closed anything this sprint." + NOISE_MID +
      "Standup notes said 'roughly fifty done'." + NOISE_BOTTOM,
    need: [/\b38\b/, /sum|add(s|ed| up)?|recompute|reconcile|does ?n('|o)?t (match|add)|actually|8.*11.*6.*9.*4|not 50|total(s|ed)?/i],
  },
  {
    id: "mau-growth",
    flaw: "reconciliation",
    scenario:
      "Claim: 'Monthly active users grew 40% month over month.'\n\nContext:\n" + NOISE_TOP +
      "From the analytics export: MAU was 50,000 in May and 62,000 in June. Retention cohorts look " +
      "stable." + NOISE_MID +
      "The all-hands slide said 'MAU up ~40%'." + NOISE_BOTTOM,
    need: [/\b24 ?%|\b24\b/, /recompute|reconcile|does ?n('|o)?t match|actually|12,?000 ?\/ ?50,?000|not 40|works? out to|comes? out to/i],
  },
  {
    id: "error-rate",
    flaw: "reconciliation",
    scenario:
      "Claim: 'Error rate held at 0.5%, no regression.'\n\nContext:\n" + NOISE_TOP +
      "From the logs for the window: 12,000 errored requests out of 800,000 total. The spike on " +
      "Tuesday was a deploy, since rolled back." + NOISE_MID +
      "The dashboard annotation still reads '0.5% errors' from before the incident." + NOISE_BOTTOM,
    need: [/\b1\.5 ?%|\b1\.5\b/, /recompute|reconcile|does ?n('|o)?t match|actually|12,?000 ?\/ ?800,?000|not 0\.5|works? out to|comes? out to/i],
  },
  // valid: the headline number reconciles with the raw source, presented in-context with no internal
  // contradiction, so a correct review confirms it (uses CLEAN_NOISE, not the contradictory NOISE_MID).
  {
    id: "valid-revenue",
    flaw: null,
    scenario:
      "Claim: 'Q3 revenue landed at $39,000.'\n\nContext:\n" + NOISE_TOP +
      "From the raw ledger export, the complete set of Q3 entries: July $14,200, August $13,500, " +
      "September $11,300. These three are the only Q3 revenue rows." + CLEAN_NOISE,
  },
  {
    id: "valid-conversion",
    flaw: null,
    scenario:
      "Claim: 'Trial-to-paid conversion is 18% this month.'\n\nContext:\n" + NOISE_TOP +
      "From the raw events table for the month: 1,200 rows of trial_started and 216 rows of " +
      "trial_converted_to_paid, with no other relevant events." + CLEAN_NOISE,
  },
];
