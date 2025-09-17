# Copilot Instructions for AI Agents

## Project Overview
- This is a Next.js SaaS starter template with authentication, Stripe payments, and a dashboard for logged-in users.
- Key features: marketing landing page, pricing with Stripe Checkout, dashboard with CRUD for users/teams, RBAC, subscription management, activity logging.
- Tech stack: Next.js (app router), Drizzle ORM (Postgres), Stripe, shadcn/ui.

## Architecture & Key Patterns
- **App Directory Structure**: Uses Next.js app directory (`/app`).
  - `/app/(dashboard)/dashboard/` contains main dashboard pages and subroutes (e.g., `/activity`, `/general`, `/security`).
  - `/app/(login)/` handles authentication (sign-in, sign-up, actions).
  - `/app/api/stripe/` and `/app/api/team/`, `/app/api/user/` are API routes for backend logic.
- **Database**: Drizzle ORM with schema and queries in `lib/db/`. Migrations in `lib/db/migrations/`.
- **Authentication**: Session and middleware logic in `lib/auth/`.
- **UI Components**: Shared UI in `components/ui/` (button, card, input, etc.).
- **Payments**: Stripe logic in `lib/payments/` and API routes under `/app/api/stripe/`.

## Developer Workflows
- **Install dependencies**: `pnpm install`
- **Setup environment**: `pnpm db:setup` (creates `.env`)
- **Migrate DB**: `pnpm db:migrate`
- **Seed DB**: `pnpm db:seed` (creates test user/team)
- **Run dev server**: `pnpm dev`
- **Stripe webhooks (local)**: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

## Project Conventions
- **RBAC**: Owner/Member roles are enforced in dashboard routes and API logic.
- **Middleware**: Global middleware in `middleware.ts` for route protection; local middleware for server actions and Zod validation.
- **Activity Logging**: User events are logged for auditability (see dashboard activity pages).
- **UI**: Uses shadcn/ui for consistent design; add new UI elements to `components/ui/`.
- **API**: Use `/app/api/` for backend logic; keep business logic in `lib/` when possible.

## Integration Points
- **Stripe**: All payment and subscription logic is in `lib/payments/` and `/app/api/stripe/`.
- **Database**: Schema and queries in `lib/db/`; migrations in `lib/db/migrations/`.
- **Authentication**: Session and middleware in `lib/auth/`.

## Examples
- To add a new dashboard section: create a folder in `/app/(dashboard)/dashboard/` and add a `page.tsx`.
- To add a new API route: add a file under `/app/api/` and implement route handlers.
- To add a new UI component: add to `components/ui/` and import where needed.

## References
- See `README.md` for setup and deployment instructions.
- See `lib/db/schema.ts` for database structure.
- See `lib/auth/session.ts` for session logic.
- See `/app/(dashboard)/dashboard/activity/` for activity logging example.

---

If you are unsure about a pattern or workflow, check the referenced files or ask for clarification.
