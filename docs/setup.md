# Setup

Mittens uses a React frontend, an Express API, Prisma with MariaDB, Google OAuth for sign-in and Gmail access, and Agent Router for model requests.

## Requirements

- Node.js 20.19+ and npm or pnpm
- MariaDB 10.0+ and an empty database
- Google Cloud OAuth credentials with Gmail API enabled
- An Agent Router API key and a model available to that key
- An SMTP service for password recovery emails

## Install and configure

From `mittens-saas/`, install dependencies and create your local environment file:

```bash
cp .env.example .env
```

The example contains local development values. Replace credentials and database details before starting the app. Never commit `.env` or put server secrets in a `REACT_APP_` variable. The complete template is [mittens-saas/.env.example](../mittens-saas/.env.example).

### Variable reference

| Variable | Required | Purpose |
| --- | --- | --- |
| `REACT_APP_API_URL` | Yes | Browser address of the API, including `/api`. |
| `CLIENT_URL` | Yes | Frontend origin for CORS and OAuth/password-reset redirects. |
| `PORT` | No | API port; defaults to `5000`. |
| `NODE_ENV` | No | Set to `production` for secure production cookies and production rate limits. |
| `DATABASE_URL` | Yes | MariaDB URL in `mysql://user:password@host:3306/database` form. URL-encode special characters in credentials. |
| `SESSION_SECRET` | Yes | Private random signing key for session cookies. Generate with `openssl rand -base64 32`. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth application credentials. |
| `GOOGLE_REDIRECT_URI` | Yes | Backend callback URL registered in Google Cloud. |
| `AGENTROUTER_API_KEY` | Yes | Server-side Agent Router key. |
| `AGENTROUTER_BASE_URL` | No | Defaults to `https://co.agentrouter.org/v1`. |
| `AGENTROUTER_MODEL` | No | Defaults to `gpt-5.5`; choose a model available to your Agent Router key. |
| `SMTP_URL` | For password recovery | SMTP connection URL used to deliver reset links. |
| `MAIL_FROM` | No | Sender shown on reset emails; defaults to a local placeholder. |

Keep Agent Router, Google client-secret, SMTP, database, and session credentials on the backend. Do not prefix them with `REACT_APP_`.

When updating an existing `.env`, remove the old `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `PAYSTACK_SECRET_KEY` entries. They are no longer used.

In Google Cloud, add the exact `GOOGLE_REDIRECT_URI` as an authorized redirect URI and enable the Gmail API. OAuth requests Gmail read, modify, labels, contacts, profile, and email scopes.

## Initialize and run

```bash
npx prisma generate
npx prisma db push
npm run dev
```

The frontend uses `http://localhost:3000`; the API uses `http://localhost:5000`. For production, use HTTPS and set `CLIENT_URL` and the Google redirect URI to the deployed origins.

## Migrate an existing Supabase export

The existing Supabase password hashes are not imported. Users can regain access by signing in with the same verified Google account or by using the password reset flow; configure SMTP for reset emails.

In the Supabase SQL editor, run this query and save the returned JSON as `supabase-export.json`. Then apply the MariaDB schema before importing:

```sql
select json_build_object(
  'User', coalesce((select json_agg(row_to_json(u)) from public."User" u), '[]'::json),
  'Trial', coalesce((select json_agg(row_to_json(t)) from public."Trial" t), '[]'::json),
  'EmailLog', coalesce((select json_agg(row_to_json(e)) from public."EmailLog" e), '[]'::json)
);
```

The importer expects these table arrays:

```json
{
  "User": [],
  "Trial": [],
  "EmailLog": []
}
```

```bash
node scripts/import-supabase-export.js /path/to/supabase-export.json
```

The importer preserves profile fields, Gmail tokens, onboarding settings, active trial dates, and email history. It does not import subscriptions or old passwords.

## Behavior notes

- New accounts start a seven-day trial at signup. Email processing is blocked after expiry.
- The model ID is configured by `AGENTROUTER_MODEL`; the API key and endpoint are only used by the backend.
- Google OAuth sign-in also stores the granted Gmail tokens for email access.
- Password recovery tokens expire after one hour and can only be used once.
- The backend health endpoint is `GET /api/health`.
