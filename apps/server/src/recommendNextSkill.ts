import type { Attempt, Dataset, Recommendation, Skill } from "@subject-exercise/shared"

type SkillSummary = {
  skill: Skill
  attempts: number
  correct: number
  hintUsed: number
  seconds: number[]
  lastPracticed?: string
  score: number
}

function median(values: number[]): number | undefined {
  if (values.length === 0) return undefined

  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  const middleValue = sorted[middle]
  if (middleValue === undefined) return undefined
  if (sorted.length % 2 !== 0) return middleValue

  const lowerMiddleValue = sorted[middle - 1]
  return lowerMiddleValue === undefined ? undefined : (lowerMiddleValue + middleValue) / 2
}

function summarizeSkill(skill: Skill, attempts: Attempt[]): SkillSummary {
  const correct = attempts.filter((attempt) => attempt.isCorrect).length
  const seconds = attempts.flatMap((attempt) =>
    typeof attempt.secondsSpent === "number" ? [attempt.secondsSpent] : [],
  )
  const lastPracticed = attempts.reduce<string | undefined>(
    (latest, attempt) =>
      latest === undefined || attempt.submittedAt > latest ? attempt.submittedAt : latest,
    undefined,
  )

  return {
    skill,
    attempts: attempts.length,
    correct,
    hintUsed: attempts.filter((attempt) => attempt.hintUsed).length,
    seconds,
    ...(lastPracticed === undefined ? {} : { lastPracticed }),
    score: (correct + 1) / (attempts.length + 2),
  }
}

function compareSummaries(left: SkillSummary, right: SkillSummary): number {
  if (left.score !== right.score) return left.score - right.score

  if (left.lastPracticed !== undefined && right.lastPracticed !== undefined) {
    if (left.lastPracticed !== right.lastPracticed) {
      return left.lastPracticed < right.lastPracticed ? -1 : 1
    }
  }

  if (left.hintUsed !== right.hintUsed) return right.hintUsed - left.hintUsed

  const leftMedian = median(left.seconds)
  const rightMedian = median(right.seconds)
  if (leftMedian !== undefined && rightMedian !== undefined && leftMedian !== rightMedian) {
    return rightMedian - leftMedian
  }

  return left.skill.skillId < right.skill.skillId ? -1 : left.skill.skillId === right.skill.skillId ? 0 : 1
}

export function recommendNextSkill(dataset: Dataset, studentId: string): Recommendation | null {
  if (!dataset.students.some((student) => student.studentId === studentId)) return null

  const summaries = dataset.skills
    .map((skill) =>
      summarizeSkill(
        skill,
        dataset.attempts.filter(
          (attempt) => attempt.studentId === studentId && attempt.skillId === skill.skillId,
        ),
      ),
    )
    .sort(compareSummaries)

  const [winner, runnerUp] = summaries
  if (winner === undefined || runnerUp === undefined) return null

  const winnerMedian = median(winner.seconds)
  return {
    skillId: winner.skill.skillId,
    skillName: winner.skill.name,
    score: winner.score,
    evidence: {
      attempts: winner.attempts,
      correct: winner.correct,
      hintUsed: winner.hintUsed,
      ...(winnerMedian === undefined ? {} : { medianSeconds: winnerMedian }),
      ...(winner.lastPracticed === undefined ? {} : { lastPracticed: winner.lastPracticed }),
    },
    runnerUp: {
      skillId: runnerUp.skill.skillId,
      skillName: runnerUp.skill.name,
      score: runnerUp.score,
    },
  }
}
