# Design: recommendNextSkill (selection logic)

Status: design only, not implemented.
Scope: the pure decision function that answers "what should this student practice next, and why."
It selects and aggregates evidence.

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
2. More hints first.
   Needing help is weaker mastery, even on correct answers.
3. Slower median seconds first.
   Median, not mean, so one idle tab (the 4211s outlier) cannot distort the signal.
4. Alphabetical `skill_id`.
   The absolute fallback that makes the function deterministic for tests even when every signal is identical.

## Zero-attempt skills

Included, scoring exactly the 50% Laplace prior.

