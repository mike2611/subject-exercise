import { app } from "./app"
import { serverPort } from "./config"

console.info(`[llm] Groq API key configured: ${process.env.GROQ_API_KEY ? "yes" : "no"}`)

app.listen(serverPort, () => {
  console.log(`server listening on http://localhost:${serverPort}`)
})
