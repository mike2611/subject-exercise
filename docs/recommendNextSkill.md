# Design: recommendNextSkill (selection logic)

Status: design only, not implemented.
Scope: the pure decision function that answers "what should this student practice next, and why."
It selects and aggregates evidence.
It never talks to an LLM, the filesystem, or the network.

## Purpose

The algorithm is ours, not the AI's.
This function reads the clean dataset from `loadAttempts` and picks the skill.
The LLM only turns that pick into a warm explanation, and the hardcoded fallback uses the same output.
Every number a student sees in the explanation originates here, in testable code.

## Signature

```ts
recommendNextSkill(dataset: Dataset, studentId: string): Recommendation | null
```

Pure: same inputs, same output, every call.
Returns `null` when the student is not in the dataset; the route maps that to a 404.
Pure functions do not own HTTP semantics.

## Ranking formula

One primary signal, Laplace-smoothed accuracy:

```
score = (correct + 1) / (attempts + 2)
```

Recommend the skill with the lowest score.
The smoothing is the entire low-evidence policy:

- A proven disaster (0/5) scores 14%.
- A single lucky attempt (1/1) scores 67%: uncertain, not mastered.
- A never-tried skill scores 50%: unexplored territory, below proven weaknesses, above mastered ones.
- Thin evidence lands in the middle by construction, with no special cases and no thresholds.

Hints, time, and recency never touch the score.
With at most 5 attempts per skill they are anecdotes, not statistics.

## Tie-break chain

When two skills have equal scores, break the tie in this order:

1. Oldest last-practice date first.
   A stale result is trusted less than a fresh one.
   This is the poor man's forgetting curve and the only recency treatment this slice needs.
2. More hints first.
   Needing help is weaker mastery, even on correct answers.
3. Slower median seconds first.
   Median, not mean, so one idle tab (the 4211s outlier) cannot distort the signal.
   A skill with no time data at all loses this comparison and the chain moves on.
4. Alphabetical `skill_id`.
   The absolute fallback that makes the function deterministic for tests even when every signal is identical.

## Zero-attempt skills

Included, scoring exactly the 50% Laplace prior.
No branch, no flag.
A student who aced everything they tried is automatically pointed at the one skill they never met, which is the right product behavior.

## Evidence card

The return value carries the numbers the prompt and fallback need, so aggregation lives in exactly one place:

```ts
type Recommendation = {
  skillId: string
  skillName: string
  score: number                    // Laplace-smoothed accuracy
  evidence: {
    attempts: number
    correct: number
    hintUsed: number
    medianSeconds?: number         // absent when no time data
    lastPracticed?: string         // absent when never attempted
  }
  runnerUp: {
    skillId: string
    skillName: string
    score: number
  }
}
```

The runner-up exists because it exercises the tie-break chain and gives the route a "what's next after this" if ever needed.

## Worked examples on the current dataset

Expected outputs once implemented; these double as test fixtures.

**Ana (stu_1041)** - winner: `exponents`, score 1/7 = 0.143 (0 of 5 correct, all 5 with hints, last 08/13).
Runner-up: `lin_eq_1`, score 2/5 = 0.4 (1 of 3).

**Beto (stu_2277)** - winner: `frac_add`, score 1/7 = 0.143 (0 of 5 correct, last 08/13).
Runner-up decided by tie-break: `ratio_basic` and `word_prob` both smooth to 2/6 = 0.333.
`ratio_basic` was last practiced 08/10, older than `word_prob`'s 08/16, so `ratio_basic` wins.

**Citlali (stu_3390)** - winner: `integers`, score 3/6 = 0.5 (2 of 4 correct, last 08/11).
Runner-up decided by tie-break: `frac_add` and `lin_eq_1` both smooth to 3/5 = 0.6 and were both last practiced on 08/18.
At timestamp granularity `lin_eq_1` (17:53) is older than `frac_add` (21:50), so `lin_eq_1` wins.
Note her `word_prob` at 1/1 smooths to 2/3 = 0.667 and correctly does not rank as her best skill despite 100% raw accuracy.

## Testing intent

The two or three most deserving tests in the repo, per the brief:

1. Beto's fixture: lowest Laplace score wins, and the runner-up tie exercises recency.
2. Citlali's fixture: a 1/1 skill must not outrank proven mediocrity, and the median tames the 4211s outlier (median 58s vs mean 1093s).
3. Unknown student returns null; the route, not this function, decides what that means.

## Decisions and rationale

| Decision | Chosen | Rejected because |
| --- | --- | --- |
| Ranking signal | Laplace-smoothed accuracy | Wilson lower bound outranks barely-touched skills and demands math defense in Q&A; a minimum evidence floor hides thin skills; an accuracy x confidence blend needs a magic weight |
| Hints and time | Tie-breaks and evidence card only | At n <= 5 they are anecdotes, and mean time is corrupted by the idle-tab outlier |
| Recency | First tie-break, oldest first | A decay formula needs a retention constant no 69-attempt export can fit |
| Ebbinghaus | Considered, kept as tie-break reasoning | The recency tie-break captures the honest version; a real decay model is a "with more data" README item, not code |
| Zero attempts | Included at the 50% prior | Excluding fails the aced-everything student; a mastery threshold adds a magic number Laplace makes redundant |
| Unknown student | Return null, route 404s | Throwing makes tests assert throws and routes catch a non-exception; a cohort-wide fallback fabricates personal advice from other people's data |

## Open items

None.
Every branch of this function's design tree was resolved in review.
