import type { Recommendation } from "@subject-exercise/shared"

export function buildFallbackExplanation(rec: Recommendation, firstName: string): string {
  if (rec.evidence.attempts === 0) {
    return `Hi ${firstName} - you haven't tried ${rec.skillName} yet, and it's the perfect next step. One short first session now keeps it from getting intimidating later. Ready to give it a try?`
  }
  return `Hi ${firstName} - ${rec.skillName} is where practice will help you most right now: you got ${rec.evidence.correct} of ${rec.evidence.attempts} right recently. One focused session can turn that around fast. Ready to give it a try?`
}
