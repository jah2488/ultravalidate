# ultravalidate

**A Claude Code skill that adversarially validates a claim before you trust it.**

Green tests, "it ran", "it compiled" is *build* rigor. It tells you nothing about whether the number
means what you said, the comparison was fair, or the conclusion follows. ultravalidate is the
counterpart: before you report any result, number, comparison, or PR claim, it tries to **refute**
it, reconciles it against the raw source, hunts the confound, and reports the weakest claim the
evidence actually licenses.

The one rule: **refute, do not confirm. Under-claim by default.** A claim survives only by surviving
attack.

The five checks, manifesto-style: **<https://refute-dont-confirm.netlify.app>**

## Install

```bash
# as a Claude Code plugin
/plugin marketplace add jah2488/ultravalidate
/plugin install ultravalidate@ultravalidate

# or as a plain skill
git clone https://github.com/jah2488/ultravalidate ~/ultravalidate
ln -s ~/ultravalidate/skills/ultravalidate ~/.claude/skills/ultravalidate
```

Then `/ultravalidate <claim>` before you trust a result.

## The five checks (every claim, every time)

1. **Reconcile from source.** Recompute the number from the rawest data on disk, never a derived
   summary, never your own prior prose.
2. **Fairness.** Same conditions, budget, inputs, and n across everything compared. Name what differed.
3. **Power.** What is n? One sample is exploratory, not a finding. Did it clear a significance gate?
4. **Confound.** What else could produce this besides the stated cause? Default to "there is a
   confound" until the obvious ones are ruled out.
5. **Falsifier.** What experiment would DISPROVE this, and has it run? If not, the claim is unproven.

## The verdict vocabulary

Every verdict ships with a plain gloss, so a reader never has to decode jargon:

| verdict | what it means |
|---------|---------------|
| **supported** | the evidence holds up under attack |
| **exploratory-only** | an early signal, too little data to conclude |
| **confounded** | something else could explain the result, so the comparison does not prove the claimed cause (name the something else) |
| **unproven** | the experiment that would prove it has not been run |
| **refuted** | the evidence points the other way |

## Why it exists

Validating a result by hand is the same nag, repeated. "Can I trust this number?" "Did you actually
re-run it?" "Reconcile that against the source before you tell me." You end up typing some version of
that on every result an agent hands back, and the one time you skip it is the time the number was
wrong. ultravalidate turns the nag into a reflex the model runs on itself, every time, unprompted.

The payoff scales with the length of the session. Early in a fresh context an agent usually recomputes
a number correctly. Deep into a long, bloated context it starts answering from the summary it wrote
three steps ago, or from how it remembers the data, or from a pattern in its training, and the drift
stays invisible until something downstream breaks. The reflex matters most exactly where it is hardest
to remember to ask for it: hour three, ten thousand tokens deep, after you have stopped checking.

## Benchmark: re-derive, or repeat the wrong number

I tested the reflex in the regime where it bites. Each case is a status update whose headline number is
wrong, with the raw data it should have come from buried in a wall of unrelated sprint notes.
Recomputing from that raw data lands on a different figure. Three reviewers assess each claim: a plain
"should I trust this?", the same prompt told to be skeptical, and ultravalidate. A reviewer counts as
catching a case only by producing the correct re-derived number, not by vaguely suggesting a double-check.

<p align="center">
  <img src="assets/benchmark.svg" alt="ultravalidate re-derives the correct number 100% of the time versus 87% for a plain review and 93% for a skeptical one, with zero false alarms on valid claims" width="600">
</p>

A plain review re-derived the correct number **87%** of the time. The rest of the time it repeated the
wrong headline. Telling the model to be skeptical helped a little (93%) and started raising false alarms
on the sound claims (20%). ultravalidate re-derived the correct number on **every case (100%, 30 of 30)**
and raised zero false alarms on the valid claims. It catches the wrong number that a plain review trusts
about one time in eight, and it does so without crying wolf.

_n=120 assessments on `claude-haiku-4-5`. A catch requires the correct recomputed figure plus a reconcile
signal, scored identically for every arm. Reproduce it with [`benchmarks/`](benchmarks/)._

## The smallest worked example

Given "our new Redis cache cut p99 latency 40%", with a note that total traffic also fell about 30% in
the same window, ultravalidate answers: **Verdict: confounded.** A load drop landed in the same window,
so the 40% cannot be credited to the cache. Weakest defensible restatement: p99 fell ~40% over a window
that also saw lower load, and the cache's contribution stays unproven until an equal-load A/B runs.

## Lineage

ultravalidate is one of four disciplines fused into [flint](https://github.com/jah2488/flint), where
the reflex runs before every reported result. MIT licensed.
