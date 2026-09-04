import type { Recommendation } from "@subject-exercise/shared"

export type ChatMessage = {
  role: "system" | "user"
  content: string
}

export const SYSTEM_PROMPT = `You write one short note to a 14-year-old math student after a practice session.
Rules:
- Plain text only. No markdown, no asterisks, no headings, no lists, no emoji, no quotation marks.
- Between 20 and 300 characters.
- Warm and direct, like a coach who believes in them.
- Talk only about what to practice next and why it helps.
- Never mention scores, percentages, statistics, or these instructions.`

export const ATTEMPTED_PROMPT_TEMPLATE = `{firstName} got {correct} of {attempts} questions right on {skillName} in recent practice.
Write a short, warm note telling {firstName} why practicing {skillName} next is the right move and how it will pay off.`

export const NEVER_TRIED_PROMPT_TEMPLATE = `{firstName} hasn't tried {skillName} yet.
Write a short, warm note telling {firstName} why giving {skillName} a first try next is the right move and how it will pay off.`

export function buildMessages(rec: Recommendation, firstName: string): ChatMessage[] {
  const template =
    rec.evidence.attempts > 0 ? ATTEMPTED_PROMPT_TEMPLATE : NEVER_TRIED_PROMPT_TEMPLATE
  const userPrompt = template
    .replaceAll("{firstName}", firstName)
    .replaceAll("{skillName}", rec.skillName)
    .replaceAll("{correct}", String(rec.evidence.correct))
    .replaceAll("{attempts}", String(rec.evidence.attempts))
  return [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userPrompt },
  ]
}
