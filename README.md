# Mittens

Mittens is an AI email assistant for Gmail. It stores application data in MariaDB, handles authentication in the Express backend, and sends model requests through Agent Router.

The app lives in `mittens-saas/`. See [the setup guide](docs/setup.md) for database, Google OAuth, Agent Router, and email configuration.

See the [changelog](CHANGELOG.md) for the integration and configuration changes.

## Prerequisites

- Node.js 20.19+ and npm or pnpm
- A MariaDB server and database
- A Google Cloud OAuth client with Gmail API enabled
- An Agent Router API key and model ID
- An SMTP URL for password recovery emails

## Run locally

```bash
cd mittens-saas
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run dev
```

The development frontend runs at `http://localhost:3000` and the API at `http://localhost:5000`.

Accounts receive a seven-day trial. Email processing is disabled when it expires. The app does not currently accept payments.
