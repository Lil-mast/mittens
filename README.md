# Mittens

Mittens is an AI-powered email assistant that connects Gmail, AWS Bedrock, Supabase, and Paystack to help manage inbox activity, trial/pro subscription flows, and automated email categorization.

The actual application code lives in the `mittens-saas/` folder. The repository root mainly wraps the workspace and keeps shared config and docs together.

## Project structure

- `mittens-saas/` — React frontend, Express API, Prisma schema, and app configuration
- `config/openclaw.template.json` — OpenClaw configuration template used for local tool integrations
- `agent/agent.md` — operating rules for the Gmail agent workflow
- `scripts/triage.sh` — helper script for triage/workflow tasks
- `docs/` — setup and project documentation

## Prerequisites

Before you start, make sure you have:

- Node.js 18+ and npm or pnpm
- A Postgres database (or a Supabase Postgres instance)
- A Google Cloud project with Gmail OAuth configured
- An AWS account with Bedrock access enabled
- A Paystack account and secret key for subscriptions
- A Supabase project for auth and session handling

## Quick start

1. Open the app directory:

   ```bash
   cd mittens-saas
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

   If you prefer pnpm:

   ```bash
   pnpm install
   ```

3. Create your environment file:

   ```bash
   cp .env.example .env
   ```

   Then fill in the values described in [docs/setup.md](docs/setup.md).

4. Apply the Prisma schema to your database:

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Start the app in development mode:

   ```bash
   npm run dev
   ```

   This starts:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Useful scripts

From `mittens-saas/`:

- `npm run dev` — runs the frontend and backend together
- `npm run server` — starts only the Express API
- `npm start` — starts only the React frontend
- `npm run build` — builds the production bundle
- `npm test` — runs the CRA test suite

## Environment variables

The app reads a mix of frontend and backend variables:

- `REACT_APP_API_URL` — frontend API base URL
- `REACT_APP_SUPABASE_URL` — Supabase project URL used by the frontend
- `REACT_APP_SUPABASE_ANON_KEY` — public Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — server-side Supabase key
- `SERVER_URL` — backend origin used in OAuth callback URLs
- `CLIENT_URL` — frontend origin used for redirects
- `DATABASE_URL` — Postgres connection string for Prisma
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` — Gmail OAuth configuration
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` — Bedrock credentials
- `PAYSTACK_SECRET_KEY` — Paystack API secret
- `NODE_ENV` — `development` or `production`

See the detailed setup guide in [docs/setup.md](docs/setup.md).

## Notes

- The frontend is a Create React App app.
- The backend is an Express service mounted under `/api`.
- Auth is handled through Supabase, while Gmail OAuth scopes are requested in the backend.
- Subscription verification and billing hooks rely on Paystack webhooks and callbacks.

For full setup instructions, including required environment values and troubleshooting, see [docs/setup.md](docs/setup.md).
