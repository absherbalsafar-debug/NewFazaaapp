# فزعة FAZAAH — منصة الخدمات والمهنيين

منصة رقمية متكاملة تربط العملاء بأفضل المهنيين ومقدمي الخدمات داخل اليمن بطريقة آمنة وسريعة.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/sanad run dev` — run the frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS v4, Wouter, TanStack Query, Framer Motion
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Fonts: Alexandria, Cairo, IBM Plex Arabic

## Where things live

- `artifacts/sanad/` — React+Vite frontend
- `artifacts/api-server/` — Express 5 API server
- `artifacts/api-server/src/routes/auth.ts` — all auth routes (OTP, email, Google)
- `lib/db/src/schema/` — Drizzle ORM schema (source of truth)
- `lib/api-spec/` — OpenAPI spec (generates client hooks)

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → React Query hooks + Zod schemas
- Auth: signed bearer token (HMAC with `SESSION_SECRET`) stored in localStorage
- OTP: stored in `otps` table with 10-min expiry; dev mode returns OTP in response body
- Google OAuth: gracefully degrades if `VITE_GOOGLE_CLIENT_ID` not set
- RTL-first: entire app uses `dir="rtl"` and Arabic fonts (Alexandria/Cairo/IBM Plex Arabic)
- Deep navy + white + gray + gold FAZAAH brand colors

## Product

**Three account types:** client, provider, admin

**Auth flows:**
- Phone OTP (send-otp → verify-otp → auto-register or navigate to home)
- Email/password (register with email verification, login, forgot password/reset)
- Google OAuth (one-tap via @react-oauth/google)

**Main pages:**
- `/welcome` — onboarding screen with 3 auth options
- `/` — Home dashboard (search, categories, stats, emergency quick-access, top rated, nearby)
- `/discover` — Trending services, offers, badges, newest providers
- `/providers` — Browse & filter providers
- `/providers/:id` — Provider detail with portfolio, reviews
- `/emergency` — Emergency services (electrician, plumber, locksmith) with instant request
- `/my-requests` — Client's request history with status tracking
- `/messages`, `/messages/:id` — Direct messaging
- `/notifications` — Push notifications
- `/profile` — User profile with verification badge, provider availability toggle
- `/settings` — Theme, notifications, security, support, logout
- `/admin` — Admin dashboard with user/provider management

**Provider verification system:**
- Green checkmark badge on verified providers
- Phone verification via OTP
- `isVerified` field in providers table
- Verification banner in profile page for unverified users

## User preferences

- Arabic RTL-first design
- Deep dark green + gold color scheme
- Modern, premium UI matching international app standards (2026 design trends)
- Smooth animations via Framer Motion
- Mobile-first layout with bottom navigation (5 items)
- Alexandria/Cairo/IBM Plex Arabic fonts

## Gotchas

- Always run `pnpm run typecheck:libs` after changing `lib/db` schema before checking API server
- `@workspace/db` exports must be rebuilt before leaf package checks (`pnpm run typecheck:libs`)
- Express 5: all async handlers typed `Promise<void>`, no `return res.json(...)`
- `passwordHash` is nullable (Google/OTP users have no password)
- `PORT` env var is set by the workflow; do not hard-code ports
- Proxy routes by path: frontend at `/`, API at `/api` — no custom Vite proxy needed

## Seed data

- Admin: phone `777000001`, password `admin2024`
- 3 clients (phones 777000003, 777000004, 777000005)
- 10 providers in Sana'a with realistic data
- 18 service categories

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- Auth token format: signed `base64url(userId:timestamp).signature` in `generateToken()` at `artifacts/api-server/src/lib/auth.ts`
