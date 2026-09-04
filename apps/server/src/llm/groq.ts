import type { ChatMessage } from "./prompt"

export const GROQ_MODEL = "llama-3.1-8b-instant"

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions"
const TIMEOUT_MS = 5000

export async function requestGroqCompletion(
  apiKey: string,
  messages: ChatMessage[],
): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(GROQ_CHAT_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 120,
      }),
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`groq responded with HTTP ${res.status}`)
    const body = (await res.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>
    }
    const content = body.choices?.[0]?.message?.content
    if (typeof content !== "string") throw new Error("groq returned no message content")
    return content
  } finally {
    clearTimeout(timer)
  }
}
