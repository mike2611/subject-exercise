const MIN_LENGTH = 20
const MAX_LENGTH = 400 // LLM prompt targets 300, tolerate what is still usable.
const HEADING = /^#{1,6}\s/m

export function isValidExplanation(raw: string): boolean {
  const text = raw.trim()
  if (text.length < MIN_LENGTH || text.length > MAX_LENGTH) return false
  if (text.includes("```")) return false
  if (text.includes("*")) return false
  if (HEADING.test(text)) return false
  return true
}
