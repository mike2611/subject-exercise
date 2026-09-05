# subject-exercise

## Requirements

Use Node.js 20.6 or newer so the backend can load `.env` with Node's built-in `--env-file-if-exists` option.

## Run Locally

Install dependencies from the repository root:

```bash
npm install
```

Create the backend environment file:

```bash
cp apps/server/.env.example apps/server/.env
```

Create the frontend environment file:

```bash
cp apps/web/.env.example apps/web/.env
```

Start the API with `npm run dev:server`.

The API listens on the fixed port `3000` at `http://localhost:3000`.

In a second terminal, start the web app with `npm run dev:web` and open `http://localhost:5173`.

The web app listens on the fixed port `5173`.

Vite fails to start if port `5173` is already in use instead of selecting another port.

During local development, Vite proxies `/api` requests to `http://localhost:3000`.

This keeps browser API requests same-origin and avoids local development CORS issues.

### Using Different Local Ports

The ports are configured through the environment files.

For example, to run the backend on port `4000` and the frontend on port `8080`, set:

`apps/server/.env`:

```env
PORT=4000
WEB_ORIGIN=http://localhost:8080
```

`apps/web/.env`:

```env
WEB_PORT=8080
API_PROXY_TARGET=http://localhost:4000
VITE_API_URL=
```

Restart both development servers after changing these values.

Keep `VITE_API_URL` empty for local development so requests use the Vite proxy.
If the frontend calls a separately hosted backend directly, set it to that backend origin, for example `VITE_API_URL=https://api.example.com`, and set `WEB_ORIGIN` to the frontend origin.

## Environment Variables

Backend variables belong in `apps/server/.env`.

`WEB_ORIGIN` configures the allowed origin for direct cross-origin API requests and defaults to `http://localhost:5173`.

`PORT` configures the backend port and defaults to `3000`.

`GROQ_API_KEY` enables the Groq-backed explanation when set.

The backend always has a fallback explanation if the key is missing or the LLM request fails.

Frontend variables belong in `apps/web/.env`.

`VITE_API_URL` is optional.

`WEB_PORT` configures the Vite development server port and defaults to `5173`.

`API_PROXY_TARGET` configures the Vite `/api` proxy target and defaults to `http://localhost:3000`.

Leave it empty to use the Vite proxy, or set it to a different API origin for deployments where the API is hosted separately.

Do not commit either `.env` file.

The `.env.example` files contain safe placeholders for local setup.

## API

`GET /api/next-practice?student_id=<student-id>` returns the recommended skill and a short student-facing explanation.

The API reads and normalizes `attempts.json` at startup.

The recommendation prioritizes smoothed accuracy and uses recency, hint usage, and median time as tie-breakers.

The endpoint validates LLM output and falls back to a deterministic explanation when the model is unavailable or returns unusable content.


## Web Screen

The student picker is kept in the `student_id` query parameter so each recommendation has a shareable deep link.

The screen shows the recommended skill, a warm explanation, and a single action to start practicing.

The loading state is shown during the single recommendation request, and a failed request offers an in-place retry.

The page uses a system font stack, no images, and no webfont requests to keep the payload and network work small on an unreliable 3G connection.

Student performance metrics are used internally for recommendation logic but are not displayed in the student-facing screen.

## Verification

Run type checks with `npm run typecheck`.

Run tests with `npm test -- --run`.

Build the frontend with `npm run build`.
