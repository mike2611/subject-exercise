import { describe, expect, it } from "vitest"
import { loadDataset } from "./loadAttempts"
import { recommendNextSkill } from "./recommendNextSkill"

const dataset = loadDataset()

describe("recommendNextSkill", () => {
  it("selects Beto's weakest skill and breaks the runner-up tie by recency", () => {
    const recommendation = recommendNextSkill(dataset, "stu_2277")

    expect(recommendation).toMatchObject({
      skillId: "frac_add",
      score: 1 / 7,
      runnerUp: { skillId: "ratio_basic", score: 1 / 3 },
    })
  })

  it("uses smoothed accuracy and median time for Citlali", () => {
    const recommendation = recommendNextSkill(dataset, "stu_3390")

    expect(recommendation).toMatchObject({
      skillId: "integers",
      score: 1 / 2,
      evidence: { attempts: 4, correct: 2, medianSeconds: 58 },
      runnerUp: { skillId: "lin_eq_1", score: 3 / 5 },
    })
  })

  it("returns null for an unknown student", () => {
    expect(recommendNextSkill(dataset, "stu_missing")).toBeNull()
  })
})
