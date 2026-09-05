import type { Recommendation } from "@subject-exercise/shared"
import { buildFallbackExplanation } from "./fallback"
import { GROQ_MODEL, requestGroqCompletion } from "./groq"
import { buildMessages } from "./prompt"
import { isValidExplanation } from "./validation"

export async function explainRecommendation(
  rec: Recommendation,
  firstName: string,
  apiKey: string | undefined = process.env.GROQ_API_KEY,
): Promise<string> {
  const fallback = buildFallbackExplanation(rec, firstName)
  if (!apiKey) {
    console.info("[llm] Groq skipped: GROQ_API_KEY is not set")
    return fallback
  }
  try {
    console.info(`[llm] Groq request started: model=${GROQ_MODEL}`)
    const raw = await requestGroqCompletion(apiKey, buildMessages(rec, firstName))
    const valid = isValidExplanation(raw)
    console.info(
      `[llm] Groq response ${valid ? "accepted" : `rejected; using fallback (chars=${raw.trim().length})`}`,
    )
    return valid ? raw.trim() : fallback
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error"
    console.warn(`[llm] Groq request failed; using fallback: ${message}`)
    return fallback
  }
}
