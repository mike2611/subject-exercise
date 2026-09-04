# subject-exercise

## Web screen

Run the web app with `npm run dev:web` and open the Vite URL.

The student picker is kept in the `student_id` query parameter so each recommendation has a shareable deep link.

The screen uses a local `NextPracticeResponse` fixture until the API route is available.

The loading state is shown during the single recommendation request, and a failed request offers an in-place retry.

The page uses a system font stack, no images, and no webfont requests to keep the payload and network work small on an unreliable 3G connection.

React.lazy and code splitting were rejected because one screen has nothing meaningful to split, while another chunk request costs more on 3G.

useMemo and React.memo were rejected because changing the picker intentionally triggers a new request and there is no derived state worth caching.
