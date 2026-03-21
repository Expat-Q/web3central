# Web3Central agent instructions

## Big picture architecture
- Monorepo with two Node apps: React frontend (root, CRA) and Express API (`backend/`, CommonJS).
- Deployment split: Vercel frontend rewrites `/api/*` to Render backend via [vercel.json](../vercel.json); Vercel server entry also exists at [api/index.js](../api/index.js) exporting [backend/server.js](../backend/server.js).
- Main API domains are tools, academy, auth, community spotlight, ratings, stats, AI/chat (see [backend/routes](../backend/routes)).
- `Tool` is the central entity; category pages consume `/api/tools/:category` and render metrics/rating/bookmarks from `Tool` docs.

## Data flow and source of truth
- Runtime source of truth is MongoDB models under [backend/models](../backend/models), not static frontend files.
- `/api/tools` groups DB tools by category and injects `tooltipExplanations` from [src/data/appsData.js](../src/data/appsData.js) for legacy UI compatibility.
- Frontend API layer is [src/lib/apiClient.js](../src/lib/apiClient.js) + [src/services/apiService.js](../src/services/apiService.js).
- Some legacy direct `fetch` calls still exist in auth/chat/rating flows (e.g. [src/context/AuthContext.jsx](../src/context/AuthContext.jsx), [src/pages/SubmitTool.jsx](../src/pages/SubmitTool.jsx), [src/components/ClaudeBot.jsx](../src/components/ClaudeBot.jsx)). Preserve existing style in touched area.

## Auth and authorization conventions
- JWT bearer auth via `Authorization: Bearer <token>` (`protect`) and role check (`admin`) in [backend/middleware/auth.js](../backend/middleware/auth.js).
- OAuth providers (Google/Discord/Twitter) are configured in [backend/config/passport.js](../backend/config/passport.js); callback redirects to `/oauth/callback?token=...` handled by [src/pages/auth/OAuthCallback.jsx](../src/pages/auth/OAuthCallback.jsx).
- Admin UI has two gates: actual backend role enforcement and a client-only session password gate in [src/pages/Admin.jsx](../src/pages/Admin.jsx) (`ADMIN_PASSWORD`).

## Backend patterns to follow
- Prefer route-level validation with [backend/middleware/validate.js](../backend/middleware/validate.js) schema objects (`body`/`params`/`query`).
- New backend code should use centralized error system from [backend/errors](../backend/errors): `AppError`, `asyncHandler`, global `errorHandler`, `requestId` propagation.
- Keep category IDs aligned with `VALID_CATEGORIES` in [backend/routes/tools.js](../backend/routes/tools.js) and frontend category IDs used in pages/admin forms.
- Keep route ordering in tools router: `/my-tools` must stay above `/:category`.

## External integrations and jobs
- AI chat route: Gemini primary + Grok fallback in [backend/routes/chat.js](../backend/routes/chat.js); quiz generation uses Gemini in [backend/routes/ai.js](../backend/routes/ai.js).
- Market metrics sync runs via `fetchLlamaData()` in [backend/services/llamaService.js](../backend/services/llamaService.js), triggered on server boot + 6h interval in [backend/server.js](../backend/server.js), and manually via [backend/scripts/syncMetrics.js](../backend/scripts/syncMetrics.js).
- Tool submission/review email notifications use nodemailer + Gmail SMTP in [backend/routes/tools.js](../backend/routes/tools.js).

## Critical local workflows
- Frontend dev: `npm start` (root).
- Backend dev: `cd backend && npm run dev`.
- Backend tests: `cd backend && npm test` (Jest config in [backend/jest.config.js](../backend/jest.config.js), setup in [backend/__tests__/setup.js](../backend/__tests__/setup.js)).
- Production frontend API base is `/api`; local defaults to `http://localhost:5000/api` (see [src/lib/apiClient.js](../src/lib/apiClient.js)).

## UI/security conventions worth preserving
- External links should go through [src/components/SafeLink.js](../src/components/SafeLink.js) + [src/components/ExitWarningModal.js](../src/components/ExitWarningModal.js) to show destination domain before leaving.
- Category pages expect tool metrics fields (`metrics.tvl`, `metrics.volume24h`, `metrics.chains`) and status filtering (`active` + undefined) in [src/pages/apps/CategoryPage.jsx](../src/pages/apps/CategoryPage.jsx).
- Keep Tailwind + Framer Motion visual style consistent across pages.