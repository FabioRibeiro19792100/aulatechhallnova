# CLAUDE.md — Tech Hall AI Lab

Guidance for working in this repository. Read this before making changes.

## What this is

**Tech Hall AI Lab** is an educational, classroom-oriented web app for running guided AI
workshops. There are two roles:

- **Facilitador** (instructor): creates **eventos**, manages **times**, unlocks **missões**,
  broadcasts **anúncios**, runs the **cronômetro**, fields **ajuda** requests, and shares
  their screen.
- **Participante** (student): joins an evento, picks a **time/aluno**, executes **missões**
  against an LLM, and answers a **reflexão** questionnaire at the end.

It's a single-page React app backed by a thin serverless API that proxies OpenAI, mints
LiveKit tokens, extracts text from attachments, and persists shared state to Supabase.

## Language & conventions (IMPORTANT)

- **UI is Brazilian Portuguese (`pt-BR`).** All user-facing strings, labels, placeholders,
  and even backend error messages are in Portuguese. **Preserve accents exactly** — e.g.
  `Missão`, `Avaliação`, `Configurações`, `Execução`, `Reflexão`, `Anúncio`, `Não permitido`.
  When adding UI text, write it in correct, accented Portuguese.
- **Code and identifiers are in English** (variable/function/class names). Keep it that way.
- **Commit messages are in English.**
- **No code comments** unless explicitly requested (existing comments may stay).
- There is **no i18n framework** — strings are hardcoded inline. Adding locale support would
  require extracting strings; don't assume a `t()` helper exists.

## Tech stack

| Layer | Tech |
|---|---|
| Build / dev | Vite 5 (`@vitejs/plugin-react`) |
| Frontend | React 18 (single-file SPA), `lucide-react` icons |
| Backend (local) | Express (`server.mjs`) on port **8787** |
| Backend (prod) | Vercel serverless functions in `api/**` |
| Shared logic | `lib/backend.mjs` (used by both runtimes) |
| LLM | OpenAI Chat Completions + Responses API (streaming) |
| Realtime A/V | LiveKit (`livekit-client` + `livekit-server-sdk`) — facilitator screen share |
| Persistence | Supabase (per-team schema: 6 tables) + browser `localStorage` |
| Doc extraction | `mammoth` (.docx), `pdfjs-dist` (.pdf) — server-side |

No TypeScript, no test framework, no linter config present.

## Repository layout

```
.
├── index.html                 # Vite entry (lang="pt-BR"), mounts /src/main.jsx
├── src/
│   ├── main.jsx               # React mount (StrictMode → <App/>), imports styles.css
│   ├── App.jsx                # ENTIRE app — ~8.5k lines, all screens/logic/components
│   └── styles.css             # ~2.9k lines, all styling (no CSS modules)
├── server.mjs                 # Local Express dev server; wraps lib/backend.mjs
├── lib/
│   ├── backend.mjs            # Shared business logic (OpenAI/LiveKit/Supabase/extract/config)
│   └── api-response.mjs       # readJsonBody(req), sendError(res, err)
├── api/                       # Vercel serverless handlers — thin wrappers over lib/backend.mjs
│   ├── health.js              # GET  /api/health
│   ├── config/index.js        # GET  /api/config
│   ├── config/openai.js       # GET/POST/DELETE /api/config/openai (dev only; 501 on Vercel)
│   ├── openai/chat.js         # POST /api/openai/chat
│   ├── openai/responses.js    # POST /api/openai/responses
│   ├── openai/responses/stream.js  # POST /api/openai/responses/stream (SSE)
│   ├── livekit/token.js       # POST /api/livekit/token
│   └── attachments/extract.js # POST /api/attachments/extract
├── supabase/per_team_schema.sql  # DB schema (6-table per-team layout + open RLS)
├── supabase/drop_app_state.sql   # Run manually after soak period to drop legacy table
├── tech_hall_branding/        # Logos, icons, Pixeled.ttf font
├── vite.config.js             # Dev proxy /api → http://localhost:8787
├── vercel.json                # framework: vite; SPA rewrite to /index.html
├── .env.example               # Required env vars
└── techhall.html              # LEGACY standalone prototype — NOT served (see below)
```

## Running locally

Two processes (env vars must be set, e.g. via a local `.env` — see `.env.example`):

```bash
npm install
npm run dev:server   # terminal 1 → Express API on http://localhost:8787
npm run dev          # terminal 2 → Vite SPA on http://localhost:5173, proxies /api → :8787
```

Build / preview / deploy:

```bash
npm run build        # vite build → dist/
npm run preview      # serve the production build locally
```

Production runs on **Vercel**: `dist/` served statically with SPA fallback, and `api/**`
deployed as serverless functions. Env vars come from Vercel project settings.

## Architecture notes

### Frontend (`src/App.jsx`)
- **One monolithic file.** A single `App()` component (~line 2359) holds all top-level state
  via many `useState` hooks; helper functions and sub-components are defined above/below it.
  Sub-components (`Topbar`, `ProcessingPipeline`, `FacilitatorToolsDrawer`,
  screen-share components, etc.) live in the same file.
- **Navigation is state-based**, not a router. A `screen` state variable switches between:
  `"home"` → `"entry"` (escolher evento) → `"team"` (escolher time/aluno) → `"workspace"`,
  plus `"facilitador"`. The Vercel SPA rewrite exists only so deep links resolve to index.html.
- **State persistence is dual:** the `store` object (events, apiKey, model, planningMode) is
  saved to `localStorage` under `techhall:v3`, and — if Supabase is configured — events sync
  to the per-team backend via the `/api/event/*` routes with optimistic concurrency (OCC).
  The hooks (`useEventState`, `useTeamState`, etc.) drive all remote reads and writes.
- **No `useMemo`/`useReducer` discipline:** many derived values recompute every render.

### Backend (dual runtime)
- `lib/backend.mjs` is the **single source of truth** for business logic. Both `server.mjs`
  (Express, local) and the `api/**` handlers (Vercel) are thin wrappers that call the same
  exported functions. **When changing backend behavior, edit `lib/backend.mjs`** and only
  touch the wrappers for routing/headers.
- `isVercelRuntime()` (checks `process.env.VERCEL`) gates behavior that needs a writable
  filesystem (the local OpenAI-key file).
- All `api/**` handlers use `readJsonBody(req)` (Vercel doesn't auto-parse JSON) and
  `sendError(res, err)` (reads `err.statusCode`, defaults 500).

### API catalog

| Method | Path | Purpose | Calls |
|---|---|---|---|
| GET | `/api/health` | Runtime/config flags | — |
| GET | `/api/config` | Same flags, `no-store` | — |
| GET/POST/DELETE | `/api/config/openai` | Read/save/clear OpenAI key (dev only; **501 on Vercel**) | local `.local-config.json` |
| GET | `/api/event/list` | List all events | Supabase REST |
| GET | `/api/event/:eventId` | Get event state | Supabase REST |
| PUT | `/api/event/:eventId` | Update event state (OCC) | Supabase REST |
| GET | `/api/event/:eventId/dashboard` | Full facilitador dashboard snapshot | Supabase REST |
| GET | `/api/event/:eventId/team/:teamIdx` | Get team state | Supabase REST |
| PUT | `/api/event/:eventId/team/:teamIdx` | Update team state (OCC) | Supabase REST |
| POST | `/api/event/:eventId/team/:teamIdx/presence` | Upsert team presence heartbeat | Supabase REST |
| GET | `/api/event/:eventId/team/:teamIdx/executions` | List team executions | Supabase REST |
| POST | `/api/event/:eventId/team/:teamIdx/executions` | Append execution record | Supabase REST |
| GET | `/api/event/:eventId/executions` | List all executions for event | Supabase REST |
| POST | `/api/event/:eventId/token-log` | Append token operational log entry | Supabase REST |
| GET | `/api/event/:eventId/token-log` | List token log entries | Supabase REST |
| POST | `/api/event/:eventId/help-request` | Create help request | Supabase REST |
| PUT | `/api/event/:eventId/help-request/:id` | Update help request status | Supabase REST |
| GET | `/api/event/:eventId/help-request` | List help requests | Supabase REST |
| POST | `/api/openai/chat` | Chat Completions (non-stream) | OpenAI `/v1/chat/completions` |
| POST | `/api/openai/responses` | Responses API (non-stream, `store:true`) | OpenAI `/v1/responses` |
| POST | `/api/openai/responses/stream` | Responses API streaming (SSE passthrough) | OpenAI `/v1/responses` |
| POST | `/api/attachments/extract` | `{fileName, contentBase64}` → `{text}` | `mammoth` / `pdfjs-dist` |
| POST | `/api/livekit/token` | `{roomName, identity, name?, canPublish?}` → `{token, url}` | `livekit-server-sdk` |

### Data model (Supabase)
- Six tables: `event_state`, `team_state`, `team_presence`, `executions`,
  `token_operational_logs`, `help_requests`. See
  `supabase/per_team_schema.sql`.
- State rows (`event_state`, `team_state`) use optimistic concurrency via a
  `version bigint` column — clients PUT with `expected_version`; server
  returns 409 with `current_payload`/`current_version` on mismatch.
- Append-only history rows (`executions`, `token_operational_logs`, plus
  inserts into `help_requests`) cannot collide.
- RLS remains open at the anon role; isolation is convention-based at the
  API layer. The legacy `app_state` single-row table is dropped via
  `supabase/drop_app_state.sql`.

### OpenAI model usage
- Default chat model: `gpt-4.1-mini`. Selectable: `gpt-4.1-mini`, `gpt-4.1`, `gpt-4o`,
  `gpt-4o-mini`, `gpt-5-mini`, `gpt-5` (`MODEL_OPTIONS`, with per-token pricing in
  `MODEL_PRICING`).
- **Coding missões** use `CODING_AI_MODEL = "gpt-5-mini"` via the streaming Responses API,
  with `CODING_AI_FALLBACK_MODEL = "gpt-4.1-mini"`. Technical-analysis panel uses
  `gpt-4.1-mini`.
- **The OpenAI key is server-side only.** It comes from `OPENAI_API_KEY` (env) or dev
  `.local-config.json`. **All** OpenAI calls go through the `/api/openai/*` proxy, which injects
  the key server-side — the frontend never holds the key, never persists it to `localStorage`,
  and never calls `api.openai.com` directly. The Configurações screen can *set* the key (POST
  `/api/config/openai`, write-only to the server); the input is cleared immediately and the key
  is never returned to the client. Do not reintroduce browser-side keys or direct OpenAI calls.

## Domain glossary (use these Portuguese terms in UI & domain code)

| Termo | Meaning |
|---|---|
| **Evento** | Workshop session container (status: `draft` / `open` / `closed`) |
| **Time** | Team of students within an evento |
| **Aluno / Participante** | Student / participant |
| **Missão** | A task run against the LLM. Two fixed ones: `Análise geral` (chat) and `Programação` (coding) — see `FIXED_MISSIONS_CATALOG` |
| **Execução** | One LLM response to a missão prompt; stored per `teamIdx__missionId` |
| **Reflexão** | End-of-missão questionnaire (3 Likert questions + comment) that marks it `concluída` |
| **Facilitador** | Instructor role (password-gated, see gotchas) |
| **Modo Treino / Modo Missões** | Free-chat lab vs. structured mission progression |
| **Ajuda** | Team "raise hand" request shown on the facilitator dashboard |
| **Anúncio** | Broadcast message to all times |
| **Cronômetro** | Session timer controlled by the facilitator |
| **Compartilhamento de tela** | Facilitator screen share via LiveKit (teams view read-only) |

## Environment variables (`.env.example`)

| Var | Purpose |
|---|---|
| `LIVEKIT_URL` / `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` | LiveKit token minting & connection |
| `OPENAI_API_KEY` | Server-side OpenAI key (optional; UI can supply its own) |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | Shared-state persistence |
| `PORT` | Local Express port (default `8787`) |

## Known tech debt & gotchas

- **Hardcoded facilitator password:** `FACILITATOR_PASSWORD = "camila"` in `src/App.jsx`. This
  is the only access control in the app.
- **No authentication or rate limiting anywhere.** Any client can read/write the global state,
  mint LiveKit tokens, and spend the server's OpenAI quota. State is a single shared row.
- **`express.json()` has no size limit** in `server.mjs`, but `/api/attachments/extract`
  receives base64 of files up to ~10MB. Large uploads can hit the default 100kb body limit in
  **local dev** — set a limit (e.g. `express.json({ limit: "20mb" })`) when touching uploads.
- **No CORS headers** are set; relies on same-origin (Vite proxy in dev, same domain on Vercel).
- **Backend error messages are passed through** to clients (may leak upstream API detail).
- **Monolith risk:** `src/App.jsx` (~8.5k lines) and `styles.css` (~2.9k lines) are single
  files. Prefer extracting components/helpers when adding substantial features, but keep the
  existing state-based navigation model unless asked to introduce a router.
- **Unused branding assets:** `tech_hall_branco.png`, `tech_hall_icones.png`, `ícone_1..7.png`
  are not referenced (only `tech_hall_preto.png`, `icone_8.png`, and `Pixeled.ttf` are used).

## Legacy: `techhall.html`

`techhall.html` (~933 lines) is the **original standalone vanilla-JS prototype** of the whole
app (its own embedded CSS/JS, a larger `m01`–`m11` mission catalog, mock responses,
`localStorage` only). It is **not referenced, imported, built, or served** — the live app is
`src/App.jsx`. Treat it as an archived reference, not source of truth. Don't sync changes into
it; if it causes confusion, it's a candidate for removal (confirm with the owner first).
