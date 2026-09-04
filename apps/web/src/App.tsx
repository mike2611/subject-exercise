import { useEffect, useState } from "react"
import type { NextPracticeResponse } from "@subject-exercise/shared"
import { getRecommendation } from "./fixture"
import "./App.css"

const students = [
  { id: "stu_1041", name: "Ana" },
  { id: "stu_2277", name: "Beto" },
  { id: "stu_3390", name: "Citlali" },
]
const defaultStudentId = "stu_1041"

function studentFromUrl() {
  const studentId = new URLSearchParams(window.location.search).get("student_id")
  return students.some((student) => student.id === studentId) ? studentId! : defaultStudentId
}

export default function App() {
  const [studentId, setStudentId] = useState(studentFromUrl)
  const [recommendation, setRecommendation] = useState<NextPracticeResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showScopeNote, setShowScopeNote] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const selectedStudent = students.find((student) => student.id === studentId)
    if (!selectedStudent) return

    window.history.replaceState({}, "", `?student_id=${selectedStudent.id}`)
    setIsLoading(true)
    setError(false)
    setRecommendation(null)
    setShowScopeNote(false)
    getRecommendation(studentId)
      .then(setRecommendation)
      .catch(() => setError(true))
      .finally(() => setIsLoading(false))
  }, [studentId, retryCount])

  function retry() {
    setRetryCount((current) => current + 1)
  }

  return (
    <main className="app-shell">
      <div className="app-content">
        <p className="eyebrow">Practice coach</p>
        <h1>What should I practice next?</h1>
        <p className="intro">A small next step can make a big difference. Let&apos;s find yours.</p>

        <label className="picker-label" htmlFor="student">I&apos;m practicing as</label>
        <select
          className="student-picker"
          id="student"
          value={studentId}
          onChange={(event) => setStudentId(event.target.value)}
        >
          {students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}
        </select>

        {isLoading && (
          <section className="status-card" aria-label="Loading recommendation" aria-busy="true">
            <div className="skeleton short" />
            <div className="skeleton title" />
            <div className="skeleton" />
            <div className="skeleton" />
          </section>
        )}
        {!isLoading && error && (
          <section className="status-card" role="alert">
            <p>We couldn&apos;t load your recommendation. Check your connection and try again.</p>
            <button className="retry-button" type="button" onClick={retry}>Try again</button>
          </section>
        )}
        {!isLoading && !error && recommendation && (
          <section className="recommendation-card" aria-live="polite">
            <p className="card-label">Your next focus</p>
            <h2 className="skill-name">{recommendation.skillName}</h2>
            <p className="explanation">{recommendation.explanation}</p>
            <div className="evidence" aria-label="Practice evidence">
              <div className="evidence-item"><span className="evidence-value">{recommendation.evidence.attempts}</span><span className="evidence-label">attempts</span></div>
              <div className="evidence-item"><span className="evidence-value">{recommendation.evidence.correct}/{recommendation.evidence.attempts}</span><span className="evidence-label">correct</span></div>
              <div className="evidence-item"><span className="evidence-value">{recommendation.evidence.hintUsed}</span><span className="evidence-label">hints used</span></div>
            </div>
            <button className="start-button" type="button" onClick={() => setShowScopeNote(true)}>Start practicing</button>
            {showScopeNote && <p className="scope-note">practice content lives in the full product - this slice is the recommendation</p>}
          </section>
        )}
      </div>
    </main>
  )
}
