---
name: ultravalidate
description: >
  Adversarial validation of a claim. Invoke on any result, number, comparison, finding, conclusion,
  or PR claim BEFORE trusting or reporting it. Refutes rather than confirms; reconciles claims against
  source data; hunts confounds; labels the weakest defensible restatement. Use when a wrong-but-
  confident answer would be costly.
---

# ultravalidate: adversarial validation of a claim

Building rigor (green tests, "it ran", "it compiled") is NOT the same as claim rigor (the number
means what you said, the comparison was fair, the conclusion follows). The first silently
masquerades as the second. ultravalidate spends maximum effort deciding whether a claim is actually
true and a result actually valid.

## The one rule

**Refute, do not confirm. Under-claim by default.** Your job is to find the strongest reason the
claim is wrong, not to bless it. A claim survives only by surviving attack. The machine being green
tells you nothing about whether the conclusion is valid.

## When to invoke

Run this before you would otherwise report a finding, state a metric, draw a causal conclusion
("X beats Y", "this helps"), declare a thesis supported, or ready a PR whose description makes
claims. If a wrong-but-confident answer is cheap to retract, a quick inline pass is fine; if it would
mislead a decision, run the full workflow.

## The five checks (every claim, every time)

1. **Reconcile from source.** Independently recompute the number from the rawest available data
   (per-run records, raw logs, the primary table), never from a derived summary, and never from your
   own prior prose. If a ledger or aggregate exists, recompute it and assert it matches. A number you
   have not re-derived is unverified.
2. **Fairness.** Was the comparison apples-to-apples? Same conditions, budget, inputs, and n across
   everything compared? An adaptive or exploratory tool driving a head-to-head is a confound. Name
   what differed.
3. **Power.** What is n? One seed, one sample, or one model is **exploratory**, not a finding; label
   it so. Is there a significance gate, and did the result clear it? Does the claim's *strength* match
   the evidence's strength?
4. **Confound and alternative explanation.** What else could produce this result besides the stated
   cause: a bug in the new code, an artifact of the harness, selection? Default to "there is a
   confound" until you have ruled the obvious ones out.
5. **Falsifier.** What experiment would DISPROVE this claim, and has it actually run? If the
   falsifying experiment never executed, the claim is **unproven**; say "unproven", not "getting
   evidence". If the deliverable artifact (the file, the run, the table) is not on disk, the claim
   outran the artifacts.

## How to run it (scale with effort)

**Full (a costly or load-bearing claim):** run an adversarial pass, independent agents that each try
to *break* the claim, one per check above, each tasked to REFUTE (reconcile-and-find-drift;
find-the-unfair-comparison; find-the-underpowered-claim; find-the-confound; prove-the-falsifier-never-
ran). Each reads the actual artifacts (raw data, git, code) and returns evidence, not opinion. Add a
skeptic whose only job is to ask "is this validation itself too kind?" Then synthesize.

**Quick (a cheap claim):** do the five checks inline yourself, but still recompute from source and
still state the weakest defensible restatement.

## Output contract (always)

- **Verdict**, with a plain gloss so the reader never decodes jargon. One of:
  - **supported** (the evidence holds up under attack)
  - **exploratory-only** (an early signal, too little data to conclude)
  - **confounded** (something else could explain the result, so the comparison does not prove the claimed cause; name the something else)
  - **unproven** (the experiment that would prove it has not been run)
  - **refuted** (the evidence points the other way)
- **Weakest defensible restatement**, the strongest claim the evidence actually licenses, leading
  with the uncertainty rather than footnoting it. (For example, not "structure hurts capable models"
  but "under an unequal-budget exploratory run with a known orchestrator bug, the structural scaffold
  scored lower for one model: confounded, directional only".)
- **Checks run and results**, which of the five passed or failed, with evidence (`file:line`,
  recomputed-vs-reported, the confound found).
- **What would upgrade the verdict**, the specific experiment, control, or n that would move it
  toward `supported`.

## What this is not

Not a code review. Not a rubber stamp; a clean `supported` is earned only after a genuine attempt to
refute failed. If you find yourself confirming rather than attacking, you are not running this skill.

ultravalidate is also one of four disciplines fused into
[flint](https://github.com/jah2488/flint), where this reflex runs before every reported result.
