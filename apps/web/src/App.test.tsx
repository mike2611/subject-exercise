import { describe, expect, it } from "vitest"
import App from "./App"

describe("web scaffold", () => {
  it("exports the app component", () => {
    expect(typeof App).toBe("function")
  })
})
