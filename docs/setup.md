# Mittens project setup guide

This guide covers how to set up the project in this repository and run it locally in development.

## Repository structure

This repo is a workspace wrapper around the main app in `mittens-saas/`.

- `mittens-saas/` — application source code
- `mittens-saas/src/` — React frontend
- `mittens-saas/backend/` — Express API
- `mittens-saas/prisma/` — Prisma schema and database model
- `config/openclaw.template.json` — local OpenClaw configuration template
- `agent/agent.md` — agent instructions for Gmail/email handling

## Prerequisites

You need all of the following configured before the app can run correctly:

- Node.js 18+
- npm or pnpm
- A Postgres database or Supabase Postgres instance
- A Supabase project
- A Google Cloud OAuth client for Gmail access
- An AWS account with access to Amazon Bedrock
- A Paystack account and secret key

## 1) Install dependencies

From the project root:

```bash
cd mittens-saas
npm install
```

Or with pnpm:

```bash
cd mittens-saas
pnpm install
```

## 2) Create your environment file

Create a `.env` file in `mittens-saas/`:

```bash
cp .env.example .env
```

If there is no `.env.example` in that folder, create the file manually with the values below.

## 3) Required environment variables

Add the following variables to `mittens-saas/.env`.

### Frontend variables

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend variables

```env
SERVER_URL=http://localhost:5000
CLIENT_URL=http://localhost:3000
NODE_ENV=development
PORT=5000
```

### Supabase

```env
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Database

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

### Gmail / Google OAuth

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/callback
```

### AWS Bedrock

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
```

### Paystack

```env
PAYSTACK_SECRET_KEY=your_paystack_secret_key
```

## 4) Set up the database

The app uses Prisma with a Postgres datasource.

Run:

```bash
cd mittens-saas
npx prisma generate
npx prisma db push
```

This creates the tables described in `prisma/schema.prisma`.

## 5) Start the app

Run the development stack:

```bash
cd mittens-saas
npm run dev
```

This will start:

- Frontend on http://localhost:3000
- Backend API on http://localhost:5000

If you want to run them separately:

```bash
npm start
npm run server
```

## 6) Verify the app works

Check the backend health endpoint:

```bash
curl http://localhost:5000/api/health
```

Expected result:

```json
{ "status": "ok", "agent": "Mittens", "version": "1.0.0" }
```

## 7) Configure external services

### Supabase

- Create a Supabase project.
- Enable authentication as needed.
- Use the anon key in the frontend and the service role key on the server.
- Make sure your app redirect URLs include the OAuth callback URL.

### Google OAuth

- Create a project in Google Cloud Console.
- Configure OAuth credentials.
- Add the redirect URI:

```text
http://localhost:5000/api/auth/callback
```

- Enable Gmail API access for the project.

### AWS Bedrock

- Ensure your AWS IAM user or role can call Bedrock Runtime.
- Use the region matching your model access.
- Confirm the model IDs in the code are available in your account.

### Paystack

- Create a Paystack secret key.
- Configure your callback/redirect flow using `CLIENT_URL` and your frontend payment route.

## Project notes

- The frontend uses React + Create React App.
- The backend is Express and exposes routes under `/api`.
- Auth is handled primarily through Supabase.
- Gmail OAuth flows are generated in the backend.
- Bedrock usage is configured from the `backend/lib/bedrock.js` integration.
- Subscription initialization is configured in `backend/lib/paystack.js`.

## Troubleshooting

### CORS errors

Make sure `CLIENT_URL` and `SERVER_URL` match your local dev ports and the backend allows that origin.

### Auth redirect issues

Check:

- `GOOGLE_REDIRECT_URI`
- `SERVER_URL`
- `CLIENT_URL`
- Supabase redirect configuration

### Prisma connection errors

Check that `DATABASE_URL` points to a live Postgres instance and the database is reachable from your environment.

### Bedrock access errors

Verify the AWS credentials and that the chosen region/model is available for your account.

## Production build

To build the production frontend bundle:

```bash
cd mittens-saas
npm run build
```

The generated static files can then be served from the Express backend if the build directory exists.
