# AGENTS.md

KanoConnect is an enterprise logistics/delivery platform: multi-role dashboards (Customer, Rider, Dispatcher, Admin, Super Admin), live GPS tracking over Socket.IO, Paystack payments, Cloudinary uploads, Nodemailer emails, Recharts reports, and a PWA.

## Repository layout

Monorepo with two **independent npm packages** (separate `package.json`, `node_modules`, and commands per folder — do not run one from the other):

- `backend/` — Express + Mongoose + Socket.IO. **ESM** (`"type": "module"`), entry `src/server.js`.
- `frontend/` — React 19 + Vite + Tailwind + React Query + Zustand + Capacitor 8. Builds to `frontend/dist` (served as a static site on Render).

Layered architecture: Routes → Controllers → Middleware → Models → Services. Auth = JWT (access + refresh) via Bearer token.

## Commands (run inside the package folder)

Backend:
- Start: `npm start` (prod), `npm run dev` (nodemon)
- Test: `npm test` (vitest run), coverage: `npm run test:coverage`
- Lint: `npm run lint` (eslint `src/`)
- Seed data: `npm run seed` → `node src/jobs/seed.js`

Frontend:
- Dev: `npm run dev`, preview: `npm run preview`
- Build: `npm run build`
- Test: `npm test` (vitest)
- Lint: `npm run lint` (eslint `.` with `--max-warnings 0`)

## Conventions to follow (documented in docs/)

- **API responses** use envelope `{ success, message, data, pagination }`; errors use `{ success: false, message, errors }`.
- **Rate limits**: general 100/15 min, auth 10/15 min, payment 20/hour.
- **WebSocket contract** (Socket.IO):
  - Client → server: `shipment:track`, `shipment:leave`, `rider:location`
  - Server → client: `shipment:update`, `location:update`, `admin:notification`
- **HTTP status codes**: 200/201/400/401/403/404/409/429/500.
- **Commits**: conventional prefixes `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`; branches named `feature/<name>`.
- When changing API routes or Socket events, update `docs/API.md` and the package READMEs.

## Configuration & deploy

- Render blueprint is `render.yaml` (services: `kanoconnect-api` node + `kanoconnect` static). Deployments build on Render, so local `.env` is dev-only.
- Env vars come from `.env` files copied from `.env.example` in each package. Never commit `.env`.
  - Backend needs: `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CLIENT_URL`, `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY` (plus `NODE_ENV`, `PORT`).
  - Frontend needs: `VITE_API_URL` (inlined at build time).
- Production locally: `docker-compose -f docker-compose.yml up -d`.

## Gotchas

- Frontend `eslint` is 8.57, backend `eslint` is 9.7 — treat them as unrelated configs.
- `@types/react` is pinned to 18.x while `react` is 19 — match existing pinning, don't "fix" it casually.
- There is no CI in `.github/` — lint/tests must be run locally before pushing.
- Paystack payments have an explicit rate limit (20/hour) — never loosen without product sign-off.
