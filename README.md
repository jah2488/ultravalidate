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

## The benefit a benchmark cannot capture

The largest thing ultravalidate does is make the model stop and go check. Left alone, an agent reports
a number from the middle of a long context, or from how it remembers the code working, or from a
pattern in its training data, and that number is often subtly wrong. ultravalidate forces the move
that catches this: go back to the rawest source on disk, recompute, and state the claim only after it
reconciles. It re-asserts what is actually true on disk in place of what was assumed. That habit is
the hardest part to put on a chart, because it shows up as the wrong answers you never have to see.

## What a one-shot benchmark does and does not show

I still measured it. Twelve claims each carry a planted validation flaw: confounds, an underpowered
sample, an unreconciled number, and four subtle statistical traps (regression to the mean,
survivorship, multiple comparisons, an incomplete metric). Two more claims are sound. Three reviewers
assess each one: a plain "should I trust this?", the same prompt told to be skeptical, and ultravalidate.

<p align="center">
  <img src="assets/benchmark.svg" alt="single-shot detection saturates: all three reviewers catch 100% of planted flaws; they differ only in strictness on valid claims" width="600">
</p>

The detection result is a clean null. Every reviewer caught every planted flaw, the subtle ones
included. A capable model, even asked plainly, already names the confound when the context sits in
front of it. The one axis that moves is strictness on the sound claims, where ultravalidate is the
most conservative: it withholds trust on a claim it cannot reconcile from source. At ten valid-claim
assessments per arm, that 0 to 20% spread is within noise.

This is the expected result, and it points back to the section above. Naming a flaw that is already
on screen is easy, so a single-shot test cannot separate a careful model from ultravalidate. The
discipline that earns its keep is going back to the source before reporting, on the claims where the
flaw is not written into the context and the model would otherwise trust its own memory. A detection
benchmark cannot reach that, which is exactly why the re-grounding habit is the headline and this
chart is the footnote.

_n=210 assessments on `claude-haiku-4-5`. Detection is keyword-based and applied identically to every
arm. Reproduce it with [`benchmarks/`](benchmarks/)._

## The smallest worked example

Given "our new Redis cache cut p99 latency 40%", with a note that total traffic also fell about 30% in
the same window, ultravalidate answers: **Verdict: confounded.** A load drop landed in the same window,
so the 40% cannot be credited to the cache. Weakest defensible restatement: p99 fell ~40% over a window
that also saw lower load, and the cache's contribution stays unproven until an equal-load A/B runs.

## Lineage

ultravalidate is one of four disciplines fused into [flint](https://github.com/jah2488/flint), where
the reflex runs before every reported result. MIT licensed.
