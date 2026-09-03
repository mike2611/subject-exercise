# Design: loadAttempts (dataset loader)

Status: design only, not implemented.
Scope: the single boundary between the raw `attempts.json` export and the rest of the app.

## Purpose

One function owns all contact with the dirty export file.
It reads, validates, dedupes, and returns a clean, typed dataset.
Everything downstream (the recommendation logic, the LLM prompt builder, the fallback string builder) trusts its output completely and never sees raw JSON, null checks, or duplicates.

The raw file is never modified or rewritten.
Cleaning is a function call, not a preprocessing step that produces a second artifact.

## Signature

```ts
loadDataset(path?: string): Dataset
```

- Pure function: reads the file, returns a value, no caching, no hidden state.
- `path` defaults to the repo's `attempts.json` and exists so tests can pass fixture files without mocking `fs`.
- The route layer memoizes the result so the disk is touched once per process, not per request.
- Throws only if the file is missing or the JSON cannot be parsed.
  With memoization at the call site, that failure happens at boot, not mid-request, which is the honest time to fail.

## Return type

The whole normalized export, not just the attempts, because the recommendation needs skill names and the LLM prompt can use the student's first name.

```ts
type Dataset = {
  skills: Skill[]        // { skillId, name }
  students: Student[]    // { studentId, firstName }
  attempts: Attempt[]    // validated, deduped
  dropped: number        // records rejected by validation, incl. conflicting duplicates
}

type Attempt = {
  attemptId: string
  studentId: string
  skillId: string
  itemId: string
  isCorrect: boolean
  hintUsed: boolean
  secondsSpent?: number  // absent when the export had null
  submittedAt: string    // ISO 8601, parseability verified by validation
}
```

Small call made while writing: output fields are camelCase (idiomatic TS) even though the export is snake_case.
The mapping lives here, at the boundary, and nowhere else.
Flag it if you would rather keep the export's names verbatim.

## Validation rules

A record is kept only if all of the following hold.
Anything else is dropped and counted in `dropped`.

- `attempt_id`, `student_id`, `skill_id`, `item_id` are non-empty strings.
- `is_correct` is a boolean (not "true", not 1, not null).
- `hint_used` is a boolean.
- `submitted_at` parses as a date.
- `seconds_spent` is a number or null or absent.
  Null and absent become the optional field being absent.
- `student_id` exists in the export's `students` list.
- `skill_id` exists in the export's `skills` list.

Referential checks matter even though today's export passes them.
A future export with a typo'd skill id would otherwise produce a recommendation for a skill that does not exist.

Values are otherwise untouched.
In particular, the 4211s outlier in `att_5065` passes through as-is: the loader validates structure, not statistics.
Deciding what seconds *mean* (outliers, medians, trust) belongs to the selection function.

## Dedupe policy

Group by `attempt_id`, keep the first occurrence.

- Byte-identical duplicates collapse to one record with no fuss.
  `att_5026` (Beto, ratio_basic, duplicated in the current export) is the known case.
- A same-id duplicate with conflicting content is ambiguous export data.
  Keep the first occurrence, count the extra as dropped.
  Never guess which row is the correction.

## Known data quality inputs

The current export produces, by these rules:

- 69 raw attempt rows -> 68 kept.
- 1 identical duplicate collapsed (`att_5026`).
- 2 attempts with null `seconds_spent` kept, with the field absent (`att_5010`, `att_5020`).
- 1 statistical outlier passed through untouched (`att_5065`, 4211s).
- 0 records dropped for structural invalidity.

## Testing intent

This function is one of the two most testable, most deserving parts of the repo.
Planned tests (2-3, per the brief's guidance against exhaustive coverage):

1. A fixture with a conflicting duplicate and a structurally invalid record: kept set correct, `dropped` counts both.
2. Null `seconds_spent` becomes an absent optional field without losing the attempt's accuracy evidence.
3. Unreadable file throws, so the failure surfaces at boot.

## Decisions and rationale

| Decision | Chosen | Rejected because |
| --- | --- | --- |
| Output | Whole dataset | Attempts-only scatters skill/student loading and validation into a second place |
| Invalid records | Drop and count | Silent dropping hides future export rot; throwing lets one bad row kill a student-facing endpoint |
| Duplicates | Keep first, count conflicts | Last-wins silently guesses on identical timestamps; throwing turns a benign re-export artifact into an outage |
| Timing | Pure fn + memo at call site | Self-caching hides state and complicates tests; per-request reads cost disk I/O for a static export |
| seconds_spent | Optional field, untouched | Clipping outliers bakes statistics silently into the data layer; dropping null-time records throws away good accuracy evidence |

## Open items

None.
Every branch of this function's design tree was resolved in review.
