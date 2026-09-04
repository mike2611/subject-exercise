export type Skill = {
  skillId: string
  name: string
}

export type Student = {
  studentId: string
  firstName: string
}

export type Attempt = {
  attemptId: string
  studentId: string
  skillId: string
  itemId: string
  isCorrect: boolean
  hintUsed: boolean
  secondsSpent?: number
  submittedAt: string
}

export type Dataset = {
  skills: Skill[]
  students: Student[]
  attempts: Attempt[]
  dropped: number
}

export type Recommendation = {
  skillId: string
  skillName: string
  score: number
  evidence: {
    attempts: number
    correct: number
    hintUsed: number
    medianSeconds?: number
    lastPracticed?: string
  }
  runnerUp: {
    skillId: string
    skillName: string
    score: number
  }
}

export type NextPracticeResponse = {
  skillId: string
  skillName: string
  explanation: string
  evidence: {
    attempts: number
    correct: number
    hintUsed: number
    medianSeconds?: number
    lastPracticed?: string
  }
}
