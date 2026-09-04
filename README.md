# subject-exercise

## Run locally

Start the API with `npm run dev:server`.

In a second terminal, start the web app with `npm run dev:web` and open the Vite URL.

The web app uses `http://localhost:3000` for the API by default.
Set `VITE_API_URL` when the API runs at another origin.

The API accepts `WEB_ORIGIN` to configure the allowed web origin, defaulting to `http://localhost:5173`.

## Web screen

The student picker is kept in the `student_id` query parameter so each recommendation has a shareable deep link.

The screen uses a local `NextPracticeResponse` fixture until the API route is available.

The loading state is shown during the single recommendation request, and a failed request offers an in-place retry.

The page uses a system font stack, no images, and no webfont requests to keep the payload and network work small on an unreliable 3G connection.

React.lazy and code splitting were rejected because one screen has nothing meaningful to split, while another chunk request costs more on 3G.

useMemo and React.memo were rejected because changing the picker intentionally triggers a new request and there is no derived state worth caching.
