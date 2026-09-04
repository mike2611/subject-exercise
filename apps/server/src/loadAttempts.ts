import { readFileSync } from "node:fs"
import { join } from "node:path"

import type { Attempt, Dataset } from "@subject-exercise/shared"

type RawExport = {
  skills: Array<{ skill_id: string; name: string }>
  students: Array<{ student_id: string; first_name: string }>
  attempts: Array<Record<string, unknown>>
}

const defaultPath = join(import.meta.dirname, "..", "..", "..", "attempts.json")

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0
}

function isValid(raw: Record<string, unknown>, studentIds: Set<string>, skillIds: Set<string>): boolean {
  return (
    isNonEmptyString(raw.attempt_id) &&
    isNonEmptyString(raw.student_id) &&
    isNonEmptyString(raw.skill_id) &&
    isNonEmptyString(raw.item_id) &&
    typeof raw.is_correct === "boolean" &&
    typeof raw.hint_used === "boolean" &&
    typeof raw.submitted_at === "string" &&
    !Number.isNaN(Date.parse(raw.submitted_at)) &&
    (raw.seconds_spent === undefined || raw.seconds_spent === null || typeof raw.seconds_spent === "number") &&
    studentIds.has(raw.student_id) &&
    skillIds.has(raw.skill_id)
  )
}

function toAttempt(raw: Record<string, unknown>): Attempt {
  const secondsSpent = raw.seconds_spent
  return {
    attemptId: raw.attempt_id as string,
    studentId: raw.student_id as string,
    skillId: raw.skill_id as string,
    itemId: raw.item_id as string,
    isCorrect: raw.is_correct as boolean,
    hintUsed: raw.hint_used as boolean,
    submittedAt: raw.submitted_at as string,
    ...(typeof secondsSpent === "number" ? { secondsSpent } : {}),
  }
}

function sameAttempt(a: Attempt, b: Attempt): boolean {
  return (
    a.attemptId === b.attemptId &&
    a.studentId === b.studentId &&
    a.skillId === b.skillId &&
    a.itemId === b.itemId &&
    a.isCorrect === b.isCorrect &&
    a.hintUsed === b.hintUsed &&
    a.secondsSpent === b.secondsSpent &&
    a.submittedAt === b.submittedAt
  )
}

export function loadDataset(path = defaultPath): Dataset {
  const raw = JSON.parse(readFileSync(path, "utf8")) as RawExport

  const skills = raw.skills.map((s) => ({ skillId: s.skill_id, name: s.name }))
  const students = raw.students.map((s) => ({ studentId: s.student_id, firstName: s.first_name }))
  const studentIds = new Set(students.map((s) => s.studentId))
  const skillIds = new Set(skills.map((s) => s.skillId))

  const attempts: Attempt[] = []
  const seen = new Map<string, Attempt>()
  let dropped = 0

  for (const record of raw.attempts) {
    if (!isValid(record, studentIds, skillIds)) {
      dropped++
      continue
    }
    const attempt = toAttempt(record)
    const first = seen.get(attempt.attemptId)
    if (first === undefined) {
      seen.set(attempt.attemptId, attempt)
      attempts.push(attempt)
    } else if (!sameAttempt(first, attempt)) {
      dropped++
    }
  }

  return { skills, students, attempts, dropped }
}
