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

- Pure function: reads the file, returns a value, no caching, no hidden state.
- `path` defaults to the repo's `attempts.json` and exists so tests can pass fixture files without mocking `fs`.
- The route layer memoizes the result so the disk is touched once per process, not per request.
- Throws only if the file is missing or the JSON cannot be parsed.
  With memoization at the call site, that failure happens at boot, not mid-request.

