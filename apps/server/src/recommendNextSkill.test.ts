import { describe, expect, it } from "vitest"
import rawDataset from "../../../attempts.json"
import type { Attempt, Dataset } from "@subject-exercise/shared"
import { recommendNextSkill } from "./recommendNextSkill"

const dataset: Dataset = {
  skills: rawDataset.skills.map(({ skill_id, name }) => ({ skillId: skill_id, name })),
  students: rawDataset.students.map(({ student_id, first_name }) => ({
    studentId: student_id,
    firstName: first_name,
  })),
  attempts: rawDataset.attempts.filter(
    (attempt, index, all) => all.findIndex(({ attempt_id }) => attempt_id === attempt.attempt_id) === index,
  ).map((attempt): Attempt => ({
    attemptId: attempt.attempt_id,
    studentId: attempt.student_id,
    skillId: attempt.skill_id,
    itemId: attempt.item_id,
    isCorrect: attempt.is_correct,
    hintUsed: attempt.hint_used,
    ...(attempt.seconds_spent === null ? {} : { secondsSpent: attempt.seconds_spent }),
    submittedAt: attempt.submitted_at,
  })),
  dropped: 1,
}

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
