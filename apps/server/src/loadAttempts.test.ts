import { join } from "node:path"
import { describe, expect, it } from "vitest"

import { loadDataset } from "./loadAttempts"

const fixtures = join(import.meta.dirname, "fixtures")

describe("loadDataset", () => {
  it("keeps the first occurrence and counts conflicting duplicates and invalid records as dropped", () => {
    const dataset = loadDataset(join(fixtures, "mixed-validity.json"))

    expect(dataset.attempts).toEqual([
      {
        attemptId: "a1",
        studentId: "stu1",
        skillId: "s1",
        itemId: "i1",
        isCorrect: true,
        hintUsed: false,
        secondsSpent: 30,
        submittedAt: "2026-08-01T10:00:00Z",
      },
    ])
    expect(dataset.dropped).toBe(2)
  })

  it("turns null and absent seconds_spent into an absent optional field, keeping accuracy evidence", () => {
    const dataset = loadDataset(join(fixtures, "null-seconds.json"))

    expect(dataset.dropped).toBe(0)
    for (const attempt of dataset.attempts) {
      expect("secondsSpent" in attempt).toBe(false)
      expect(attempt.isCorrect).toBe(true)
    }
  })

  it("throws on a missing or unparseable file", () => {
    expect(() => loadDataset(join(fixtures, "does-not-exist.json"))).toThrow()
    expect(() => loadDataset(join(fixtures, "malformed.json"))).toThrow()
  })

  it("matches the known-data check on the real export", () => {
    const dataset = loadDataset()

    expect(dataset.attempts).toHaveLength(68)
    expect(dataset.dropped).toBe(0)
    expect(dataset.attempts.filter((a) => a.attemptId === "att_5026")).toHaveLength(1)
    expect(dataset.attempts.find((a) => a.attemptId === "att_5010")?.secondsSpent).toBeUndefined()
    expect(dataset.attempts.find((a) => a.attemptId === "att_5065")?.secondsSpent).toBe(4211)
  })
})
