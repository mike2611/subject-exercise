import { createServer, type Server } from "node:http"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import type { NextPracticeResponse } from "@subject-exercise/shared"
import { app } from "./app"

let server: Server
let baseUrl: string
const originalApiKey = process.env.GROQ_API_KEY

beforeAll(async () => {
  delete process.env.GROQ_API_KEY
  server = createServer(app)
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve())
  })
  const address = server.address()
  if (address === null || typeof address === "string") throw new Error("test server did not start")
  baseUrl = `http://127.0.0.1:${address.port}`
})

afterAll(async () => {
  if (originalApiKey === undefined) {
    delete process.env.GROQ_API_KEY
  } else {
    process.env.GROQ_API_KEY = originalApiKey
  }
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
})

describe("GET /api/next-practice", () => {
  it.each([
    ["stu_1041", "exponents"],
    ["stu_2277", "frac_add"],
    ["stu_3390", "integers"],
  ])("selects %s's expected skill", async (studentId, skillId) => {
    const response = await fetch(`${baseUrl}/api/next-practice?student_id=${studentId}`)
    const body = await response.json() as NextPracticeResponse

    expect(response.status).toBe(200)
    expect(body).toMatchObject({ skillId, evidence: expect.any(Object) })
    expect(body.explanation).toEqual(expect.any(String))
    expect(body.explanation.length).toBeGreaterThan(0)
    expect(response.headers.get("access-control-allow-origin")).toBe("http://localhost:5173")
  })

  it("returns 400 when student_id is missing", async () => {
    const response = await fetch(`${baseUrl}/api/next-practice`)

    expect(response.status).toBe(400)
  })

  it("returns 404 for an unknown student", async () => {
    const response = await fetch(`${baseUrl}/api/next-practice?student_id=stu_missing`)

    expect(response.status).toBe(404)
  })

  it("uses the fallback explanation without an API key", async () => {
    const response = await fetch(`${baseUrl}/api/next-practice?student_id=stu_3390`)
    const body = await response.json() as NextPracticeResponse

    expect(response.status).toBe(200)
    expect(body.explanation).toContain("Hi Citlali")
  })
})
