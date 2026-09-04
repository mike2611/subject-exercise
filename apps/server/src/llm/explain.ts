import type { Recommendation } from "@subject-exercise/shared"
import { buildFallbackExplanation } from "./fallback"
import { requestGroqCompletion } from "./groq"
import { buildMessages } from "./prompt"
import { isValidExplanation } from "./validation"

export async function explainRecommendation(
  rec: Recommendation,
  firstName: string,
  apiKey: string | undefined = process.env.GROQ_API_KEY,
): Promise<string> {
  const fallback = buildFallbackExplanation(rec, firstName)
  if (!apiKey) return fallback
  try {
    const raw = await requestGroqCompletion(apiKey, buildMessages(rec, firstName))
    return isValidExplanation(raw) ? raw.trim() : fallback
  } catch {
    return fallback
  }
}
