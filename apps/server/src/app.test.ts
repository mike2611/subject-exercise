import { describe, expect, it } from "vitest"
import { app } from "./app"

describe("server scaffold", () => {
  it("builds the express app", () => {
    expect(app).toBeDefined()
  })
})
