```markdown
# Paddle Partner — Copilot instructions (concise)

This file is targeted at automated coding assistants to help contributors be productive quickly. Keep suggestions and edits specific to files and patterns mentioned below.

Core facts
- Frontend: Vue 3 + TypeScript + Vite (entry: `src/main.ts`, root component: `src/App.vue`).
- Router: `src/router/index.ts` controls routes; protected pages (e.g. `src/views/Activities.vue`) rely on auth state.
- Backend: Node/Express API in `server/` (entry: `server/index.js`) exposing `/api/*` and Strava endpoints (`server/routes/strava.js`).
- Persistence: MongoDB via Mongoose models in `server/models/` (`User.js`, `Activity.js`).

What to change and how (concrete)
- Frontend components use the Composition API. Prefer adding composables or small components under `src/components/` (examples: `GoogleAuth.vue`, `HelloWorld.vue`).
- For new routes, update `src/router/index.ts` and add view under `src/views/`.
- Server-side: add models in `server/models/`, route handlers in `server/routes/`, and register routes in `server/index.js`.

Auth & tokens (important integration points)
- Google OAuth is used on the client (`VITE_GOOGLE_CLIENT_ID`) and the server accepts POST `/api/auth/google`. See `server/routes/auth.js` and `src/components/GoogleAuth.vue` for flow.
- Strava tokens: client has `VITE_STRAVA_*` env vars for dev; server exposes `/api/strava/*` to exchange/refresh tokens — prefer server-side handling for secrets.

Developer workflows (commands & quick checks)
- Frontend dev server: `npm run dev` (project root). App served on http://localhost:5173 by default.
- Server (API): `cd server && npm run dev` (server listens on http://localhost:3001).
- Reinstall deps: `npm install` (root) and `cd server && npm install` for the API.
- Health check: `curl http://localhost:3001/health` after starting server.

Conventions and patterns to follow
- TypeScript in frontend: add types to `src/types/` (there is `google-auth.d.ts`). Follow existing file/module patterns.
- Use `server/middleware/*` (`auth.js`, `errorHandler.js`) for cross-cutting concerns; register middleware in `server/index.js`.
- Data shapes: rely on Mongoose schemas in `server/models/`. When extending, keep schema names and field conventions consistent (camelCase, explicit subdocuments for `preferences`, `stats`, `location`).

Examples (copyable snippets)
- Client fetch with auth header (used across services in `src/services/*.ts`):
	- Example: requests include `Authorization: Bearer <token>` when hitting `/api/*` endpoints.
- Strava sync (server): `POST /api/strava/sync-activities` — server pulls activities and writes `server/models/Activity.js` documents. Prefer server endpoints over direct Strava calls from the client.

Files to inspect first when debugging
- `src/main.ts`, `src/router/index.ts`, `src/views/Activities.vue`, `src/components/GoogleAuth.vue`
- `server/index.js`, `server/routes/strava.js`, `server/routes/auth.js`, `server/models/User.js`, `server/models/Activity.js`

Do not change
- Do not commit `.env` or `.env.local` files. Secrets and Strava client secrets belong on the server in production.

If uncertain
- Open the files listed above and prefer server APIs for secret-bearing operations. Ask for missing env values and intended deployment target (Vercel, Netlify + separate API host, etc.).
```