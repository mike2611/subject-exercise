import type { NextPracticeResponse } from "@subject-exercise/shared"

const recommendations: Record<string, NextPracticeResponse> = {
  stu_1041: {
    skillId: "exponents",
    skillName: "Integer exponents",
    explanation: "You have a great place to grow here. Let's practice integer exponents together.",
    evidence: { attempts: 5, correct: 0, hintUsed: 5, medianSeconds: 89, lastPracticed: "2026-08-13T08:02:00Z" },
  },
  stu_2277: {
    skillId: "frac_add",
    skillName: "Adding fractions with unlike denominators",
    explanation: "Fractions are your next best step. A little focused practice can build your confidence.",
    evidence: { attempts: 5, correct: 0, hintUsed: 2, medianSeconds: 69, lastPracticed: "2026-08-13T17:26:00Z" },
  },
  stu_3390: {
    skillId: "integers",
    skillName: "Operations with negative integers",
    explanation: "You are close to having this down. Let's sharpen your skills with negative integers.",
    evidence: { attempts: 4, correct: 2, hintUsed: 0, medianSeconds: 58, lastPracticed: "2026-08-11T18:15:00Z" },
  },
}

export function getRecommendation(studentId: string): Promise<NextPracticeResponse> {
  const recommendation = recommendations[studentId]
  if (!recommendation) return Promise.reject(new Error("Student not found"))

  return new Promise((resolve) => {
    window.setTimeout(() => resolve(recommendation), 120)
  })
}
