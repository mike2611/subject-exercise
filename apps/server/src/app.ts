import express from "express"
import type { NextPracticeResponse } from "@subject-exercise/shared"
import { loadDataset } from "./loadAttempts"
import { explainRecommendation } from "./llm/explain"
import { recommendNextSkill } from "./recommendNextSkill"

export const app = express()
const dataset = loadDataset()
const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:5173"

app.use((_req, res, next) => {
  console.info(`[http] ${_req.method} ${_req.originalUrl}`)
  res.setHeader("Access-Control-Allow-Origin", webOrigin)
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")
  if (_req.method === "OPTIONS") {
    res.sendStatus(204)
    return
  }
  next()
})

app.get("/health", (_req, res) => {
  res.json({ ok: true })
})

app.get("/api/next-practice", async (req, res) => {
  const studentId = req.query.student_id
  if (typeof studentId !== "string" || studentId.length === 0) {
    res.status(400).json({ error: "student_id is required" })
    return
  }

  const student = dataset.students.find((candidate) => candidate.studentId === studentId)
  const recommendation = recommendNextSkill(dataset, studentId)
  if (student === undefined || recommendation === null) {
    res.status(404).json({ error: "student not found" })
    return
  }

  const response: NextPracticeResponse = {
    skillId: recommendation.skillId,
    skillName: recommendation.skillName,
    explanation: await explainRecommendation(recommendation, student.firstName),
    evidence: recommendation.evidence,
  }
  res.json(response)
})
