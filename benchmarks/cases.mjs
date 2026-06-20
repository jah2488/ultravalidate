// ultravalidate detection benchmark: each "flawed" case is a claim + context with ONE deliberately
// planted validation flaw. Two tiers: OBVIOUS flaws (the confound is spelled out in the context)
// and SUBTLE statistical traps (regression to the mean, survivorship, multiple comparisons, an
// incomplete metric) that a plain reader tends to nod along to. "valid" cases are clean, powered,
// reconciled claims (to measure over-flagging). A flaw is "caught" if the assessment matches every
// regex in `need`. The same detector scores every arm, so the between-arm comparison is fair.

export const ARMS = {
  baseline: "You are reviewing a teammate's claim. Assess the claim below: should it be trusted?",
  skeptical:
    "You are reviewing a teammate's claim. Assess the claim below: should it be trusted? " +
    "Be skeptical and look hard for reasons it might be wrong.",
  ultravalidate: "ULTRAVALIDATE_SKILL", // built at runtime: baseline + the SKILL.md body
};

export const CASES = [
  {
    id: "cache-p99",
    flaw: "confounded",
    scenario:
      "Claim: 'Our new Redis cache cut p99 latency 40%.'\nContext: the cache shipped Tuesday. p99 " +
      "dropped 40% that day. Tuesday was also a public holiday and total request volume was down about 30%.",
    need: [/confound|traffic|load|volume|holiday|other (cause|factor|explanation)|coincid|not (just|only) the cache|can('|no)?t (credit|attribute)|drop in (traffic|requests|load)/i],
  },
  {
    id: "algo-speed",
    flaw: "underpowered",
    scenario:
      "Claim: 'Algorithm B is 33% faster than A.'\nContext: B finished in 1.2s and A in 1.8s. Each " +
      "was run exactly once on a shared laptop.",
    need: [/once|single (run|sample|measurement)|n ?= ?1|variance|noise|repeat|more (runs|samples|trials)|not significant|underpowered|one (data ?point|run)/i],
  },
  {
    id: "tests-pass",
    flaw: "unproven",
    scenario:
      "Claim: 'All tests pass, so the CSV export feature works.'\nContext: the suite has no test that " +
      "exercises the export path with quoted fields, empty files, or non-ASCII data.",
    need: [/no test|do(es)?n('|o)?t (cover|exercise|test)|coverage|untested|edge case|pass(ing|es)? .* (not|does ?n'?t) (mean|prove|guarantee)|unproven/i],
  },
  {
    id: "conversion-math",
    flaw: "unreconciled",
    scenario:
      "Claim: 'Conversion rose to 12%.'\nContext: the source table shows 47 conversions out of 500 " +
      "visitors for the period.",
    need: [/9\.4|9%|47 ?\/ ?500|does ?n('|o)?t match|recompute|reconcile|actually (about )?9|the (math|number) (is|does)|recalc|not 12/i],
  },
  {
    id: "model-eval",
    flaw: "unfair",
    scenario:
      "Claim: 'Model X beat model Y on our eval, so X is the better model.'\nContext: X was given a 3x " +
      "larger token budget than Y, and the eval questions were chosen by the team that built X.",
    need: [/unfair|3x|budget|more (tokens|compute|budget)|apples|equal (conditions|budget|footing)|selection|chose|picked|same (budget|conditions)|not a fair/i],
  },
  {
    id: "retention-feature",
    flaw: "confounded",
    scenario:
      "Claim: 'Users of feature F retain twice as well, so F drives retention.'\nContext: F is opt-in, " +
      "and the users who turn it on are already the most active power users.",
    need: [/select|self[- ]?select|correlation|causation|confound|power users|already (active|engaged)|opt-?in|reverse|cause|the kind of user/i],
  },
  {
    id: "refactor-perf",
    flaw: "unproven",
    scenario:
      "Claim: 'This refactor will make the endpoint faster.'\nContext: no benchmark or profile has " +
      "been run before or after the change.",
    need: [/no (benchmark|profile|measurement|data)|have ?n('|o)?t (measured|benchmarked|profiled)|measure (it|first)|profile|unproven|without (data|evidence)|before .* (claim|conclude)|prediction/i],
  },
  {
    id: "prompt-vibes",
    flaw: "exploratory",
    scenario:
      "Claim: 'The new prompt is better, let's ship it.'\nContext: it was tried on one example and the " +
      "output looked nicer.",
    need: [/one example|single|anecdot|exploratory|vibes?|not enough|too (early|soon|few)|more (data|examples|testing)|cherry|n ?= ?1|sample of (one|1)/i],
  },
  // --- subtle statistical traps: the context does NOT name the flaw; a plain reader tends to agree ---
  {
    id: "rep-coaching",
    flaw: "regression to the mean",
    scenario:
      "Claim: 'We coached our 10 lowest-scoring support reps and their CSAT rose 15 points the next " +
      "quarter, so the coaching worked.'\nContext: the 10 reps were picked precisely because they " +
      "scored at the very bottom that quarter.",
    need: [/regress(ion)?( to (the )?(mean|average))?|mean reversion|lowest.{0,40}(improve|rise|rebound|go up|recover).{0,20}(anyway|regardless|on their own|without)|extreme.{0,30}(return|revert|bounce)|(picked|chosen|selected) because.{0,30}(low|bottom|worst)|would have (improved|risen|gone up)|not (necessarily )?(due to |from )?the coaching/i],
  },
  {
    id: "tenure-satisfaction",
    flaw: "survivorship bias",
    scenario:
      "Claim: '95% of customers who have been with us 3+ years say they are satisfied, so our product " +
      "builds loyalty.'\nContext: customers who were unhappy churned in their first year and are not " +
      "in the 3-year group.",
    need: [/survivor(ship)?|churn(ed)?|(unhappy|dissatisfied|unsatisfied).{0,30}(left|gone|churn|excluded|not (counted|included))|only (those|the ones|customers) (who )?(stayed|remained|survived)|self[- ]?select|those who left|drop(ped)? out|biased sample|selection (bias|effect)/i],
  },
  {
    id: "button-variants",
    flaw: "multiple comparisons",
    scenario:
      "Claim: 'We A/B tested 20 button variants and the green one reached p < 0.05, so we should ship " +
      "green.'\nContext: only that one of the 20 crossed p < 0.05, and no correction was applied for " +
      "running 20 tests at once.",
    need: [/multiple comparison|20 (test|variant|hypothes|arm)|bonferroni|(false positive|one).{0,25}(expect|chance)|by chance|correction|p-?hack|family[- ]?wise|at least one.{0,25}(significant|cross|p ?<)|testing (many|so many|20)|1 (in|of|out of) 20|cherry/i],
  },
  {
    id: "fraud-recall",
    flaw: "incomplete metric",
    scenario:
      "Claim: 'Our fraud model catches 98% of fraud, so it is reliable enough to auto-block accounts.'" +
      "\nContext: the 98% is recall only; the false-positive rate and the base rate of fraud were not " +
      "reported.",
    need: [/false[- ]?positive|base rate|precision|specificity|(legitimate|genuine|real|good|innocent).{0,30}(flag|block|caught|account)|recall (alone|only|by itself|isn'?t|does ?n'?t|without)|how many.{0,30}(wrongly|incorrectly|legit)|denominator|both (metric|rate|number)|miss(ing|es)?.{0,20}(false|precision|positive)/i],
  },
  {
    id: "valid-ab",
    flaw: null,
    scenario:
      "Claim: 'Checkout errors fell from 3.1% to 2.4%.'\nContext: a randomized A/B test with 10,000 " +
      "users per arm over two weeks, difference significant at p < 0.01.",
  },
  {
    id: "valid-reconciled",
    flaw: null,
    scenario:
      "Claim: 'Q3 revenue was $48,210.'\nContext: recomputed from the raw ledger (sum of 1,204 " +
      "transactions = $48,210) and it matches the dashboard total exactly.",
  },
];
