import { afterEach, describe, expect, it, vi } from "vitest"
import type { Recommendation } from "@subject-exercise/shared"
import { explainRecommendation } from "./explain"
import { buildFallbackExplanation } from "./fallback"
import { buildMessages } from "./prompt"
import { isValidExplanation } from "./validation"

const attemptedRec: Recommendation = {
  skillId: "exponents",
  skillName: "Integer exponents",
  score: 1 / 7,
  evidence: {
    attempts: 5,
    correct: 0,
    hintUsed: 5,
    medianSeconds: 55,
    lastPracticed: "2025-08-13T17:45:00Z",
  },
  runnerUp: { skillId: "lin_eq_1", skillName: "Solving one-step linear equations", score: 0.4 },
}

const neverTriedRec: Recommendation = {
  skillId: "word_prob",
  skillName: "Multi-step word problems",
  score: 0.5,
  evidence: { attempts: 0, correct: 0, hintUsed: 0 },
  runnerUp: { skillId: "integers", skillName: "Operations with negative integers", score: 0.6 },
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })
}

describe("isValidExplanation", () => {
  it("rejects every failure class we defined as unusable", () => {
    expect(isValidExplanation("You are close on this one - a focused round will unlock it.")).toBe(true)
    expect(isValidExplanation("")).toBe(false)
    expect(isValidExplanation("   \n  ")).toBe(false)
    expect(isValidExplanation("too short")).toBe(false)
    expect(isValidExplanation("x".repeat(301))).toBe(false)
    expect(isValidExplanation("```\npractice exponents a little every day\n```")).toBe(false)
    expect(isValidExplanation("# You should practice exponents next because it helps")).toBe(false)
    expect(isValidExplanation("you did **great** work on the last few practice sets, keep it up")).toBe(false)
  })
})

describe("buildFallbackExplanation", () => {
  it("renders both branches from the same facts and passes validation itself", () => {
    const attempted = buildFallbackExplanation(attemptedRec, "Ana")
    expect(attempted).toContain("Ana")
    expect(attempted).toContain("Integer exponents")
    expect(attempted).toContain("0 of 5")
    expect(isValidExplanation(attempted)).toBe(true)

    const neverTried = buildFallbackExplanation(neverTriedRec, "Beto")
    expect(neverTried).toContain("Beto")
    expect(neverTried).toContain("haven't tried Multi-step word problems")
    expect(isValidExplanation(neverTried)).toBe(true)
  })
})

describe("buildMessages", () => {
  it("phrases accuracy as human words and leaks no internals into the user prompt", () => {
    const [, attempted] = buildMessages(attemptedRec, "Ana")
    expect(attempted).toBeDefined()
    expect(attempted?.content).toContain("Ana got 0 of 5 questions right on Integer exponents")
    expect(attempted?.content).not.toMatch(/score|hint|median|seconds|2025|runner/i)

    const [, neverTried] = buildMessages(neverTriedRec, "Beto")
    expect(neverTried).toBeDefined()
    expect(neverTried?.content).toContain("Beto hasn't tried Multi-step word problems")
  })
})

describe("explainRecommendation", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it("serves the fallback without touching the network when the key is missing or empty", async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal("fetch", fetchSpy)
    vi.stubEnv("GROQ_API_KEY", undefined)
    await expect(explainRecommendation(attemptedRec, "Ana")).resolves.toBe(
      buildFallbackExplanation(attemptedRec, "Ana"),
    )
    vi.stubEnv("GROQ_API_KEY", "")
    await expect(explainRecommendation(neverTriedRec, "Beto")).resolves.toBe(
      buildFallbackExplanation(neverTriedRec, "Beto"),
    )
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("returns trimmed groq output when it passes validation", async () => {
    const good = "You are close on Integer exponents - one focused round will unlock it. Ready?"
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ choices: [{ message: { content: `  ${good}  ` } }] })))
    await expect(explainRecommendation(attemptedRec, "Ana", "valid-key")).resolves.toBe(good)
  })

  it("falls back on every failure arm: rejection, non-200, empty body, unusable output", async () => {
    const expected = buildFallbackExplanation(attemptedRec, "Ana")

    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("network down"))))
    await expect(explainRecommendation(attemptedRec, "Ana", "some-key")).resolves.toBe(expected)

    vi.stubGlobal("fetch", vi.fn(async () => new Response("rate limit hit", { status: 429 })))
    await expect(explainRecommendation(attemptedRec, "Ana", "some-key")).resolves.toBe(expected)

    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ choices: [] })))
    await expect(explainRecommendation(attemptedRec, "Ana", "some-key")).resolves.toBe(expected)

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({ choices: [{ message: { content: "**Awesome job!** You nailed it, legend of math class!" } }] }),
      ),
    )
    await expect(explainRecommendation(attemptedRec, "Ana", "some-key")).resolves.toBe(expected)
  })

  it("aborts a hanging groq call at 5s and still serves the fallback", async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: unknown, init?: { signal?: AbortSignal }) =>
        new Promise<Response>((_, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new Error("aborted")))
        }),
      ),
    )
    const expected = buildFallbackExplanation(attemptedRec, "Ana")
    const pending = expect(explainRecommendation(attemptedRec, "Ana", "some-key")).resolves.toBe(expected)
    await vi.advanceTimersByTimeAsync(5000)
    await pending
  })
})
