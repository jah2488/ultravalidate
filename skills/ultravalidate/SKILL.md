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

**A flagged imprecision is an unproven claim, not a wording problem.** When a check comes back
"overclaimed / imprecise / roughly right", you do NOT resolve it by softening the sentence. Downgrade
the verdict and pull the thread to ground truth. Rewording a flagged claim until it reads true is the
single most seductive way to confirm instead of refute; treat the urge to edit the prose as a signal
you have not finished validating.

## When to invoke

Run this before you would otherwise report a finding, state a metric, draw a causal conclusion
("X beats Y", "this helps"), declare a thesis supported, or ready a PR whose description makes
claims. If a wrong-but-confident answer is cheap to retract, a quick inline pass is fine; if it would
mislead a decision, run the full workflow.

## Decompose first (before any check)

Most validation failures are a missing sub-claim, not a mischecked one. Before you check anything,
restate the claim as an explicit conjunction of **atomic, independently falsifiable assertions**, and
for each name the **observable end state** that would confirm or break it. Expand loaded phrases into
their consequences:

> "Internal Builder = create own project only" is NOT one claim. It asserts: (a) the role assigned is
> Internal Builder, AND (b) they cannot edit or deploy others' projects, AND (c) they have NO access
> to existing projects. Each is checked separately; (c) is the load-bearing one and the easiest to
> forget.

The verdict is only as trustworthy as this list. A refuter aimed at the wrong sub-claim confirms the
wrong thing with high confidence, so the decomposition IS the validation. If you skip it you will
validate the dimension you happened to think of and miss the one that matters. Run the five checks
against every atom, not against the sentence.

## The five checks (every claim, every time)

1. **Reconcile from source.** Independently recompute the number from the rawest available data
   (per-run records, raw logs, the primary table), never from a derived summary, and never from your
   own prior prose. If a ledger or aggregate exists, recompute it and assert it matches. A number you
   have not re-derived is unverified. For a claim about what a record or user *becomes* (not a
   number), reconcile to the RESOLVED end-state, not the mechanism: follow the code through defaults,
   callbacks, and normalization to the final persisted or effective value. "The setter is called" or
   "X is passed in" is not evidence that X is what it resolves to; trace to where the field actually
   settles (a `nil` that falls back to a role or config default is exactly where these hide).
2. **Fairness.** Was the comparison apples-to-apples? Same conditions, budget, inputs, and n across
   everything compared? An adaptive or exploratory tool driving a head-to-head is a confound. Name
   what differed.
3. **Power.** What is n? One seed, one sample, or one model is **exploratory**, not a finding; label
   it so. Is there a significance gate, and did the result clear it? Does the claim's *strength* match
   the evidence's strength?
4. **Confound and alternative explanation.** What else could produce this result besides the stated
   cause: a bug in the new code, an artifact of the harness, selection? Default to "there is a
   confound" until you have ruled the obvious ones out. For access, permission, or provisioning
   claims, hunt the **default and negative space** specifically: what happens when the caller
   specifies *nothing* (what default applies)? and what can the subject reach that it should not?
   These claims fail in the unspecified path and in what is *not* restricted, never in the happy path
   you tested.
5. **Falsifier.** What experiment would DISPROVE this claim, and has it actually run? If the
   falsifying experiment never executed, the claim is **unproven**; say "unproven", not "getting
   evidence". If the deliverable artifact (the file, the run, the table) is not on disk, the claim
   outran the artifacts. Every atom needs its OWN falsifier, executed. **Confidence does not transfer
   between claims:** a live confirmation of atom A raises the verdict of A only, never of B, even when
   they sit in the same feature, PR, or message. Name the specific experiment that breaks each atom
   and confirm it ran against THAT atom, not an adjacent one.

## How to run it (scale with effort)

**Full (a costly or load-bearing claim):** run an adversarial workflow of independent agents that
each try to *break* the claim, then a skeptic, then a synthesis. Template:

- Phase **Decompose**: split the claim into atoms (see "Decompose first"), and name each atom's
  observable end-state and its falsifier. Everything downstream runs per-atom; a clean whole-claim
  verdict is impossible if an atom went unlisted.
- Phase **Attack** (parallel): one agent per (atom x check) that matters, each tasked to REFUTE
  (reconcile-to-the-resolved-end-state-and-find-drift; find-the-unfair-comparison;
  find-the-underpowered-claim; find-the-confound-and-default/negative-space;
  prove-the-falsifier-never-ran-for-this-atom). Each reads the actual artifacts (raw data, git, code)
  and returns evidence, not opinion. Give each agent ONE atom; a refuter aimed at the wrong sub-claim
  confirms the wrong thing.
- Phase **Skeptic**: an agent whose only job is to ask "is this validation itself too kind, is any
  verdict a dodge?" and to surface the most uncomfortable true weakness.
- Phase **Verdict**: synthesize into the output contract below.

**Quick (a cheap claim):** do the five checks inline yourself, but still recompute from source and
still state the weakest defensible restatement.

## Output contract (always)

- **Claim decomposition**, the atoms the claim was split into, with a verdict per atom. The
  whole-claim verdict is capped at its weakest atom; one `unproven` atom makes the whole claim
  `unproven`, however solid the others.
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
