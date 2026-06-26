# Job Search Agent

A durable [eve](https://eve.dev) agent that searches job boards, ranks matches for a frontend engineer profile, and emails a daily digest. Built for deployment on [Vercel](https://vercel.com).

## What it does

On weekdays at 10:00 AM Pacific time, the agent:

1. Searches [Adzuna](https://www.adzuna.com/) for frontend roles in San Diego and remote
2. Searches [Remotive](https://remotive.com/) for remote frontend roles
3. Combines results, deduplicates, and picks the top 10 most relevant listings
4. Emails the digest via [Resend](https://resend.com/)

You can also chat with the agent in the dev terminal UI or over the HTTP API.

## Prerequisites

- **Node.js 24** or newer (required by eve) — e.g. `nvm use 24`
- **OpenAI API key** — the agent uses `gpt-4o` via `@ai-sdk/openai`
- **Adzuna API credentials** — free at [developer.adzuna.com](https://developer.adzuna.com/)
- **Resend API key** — requires a [verified sending domain](https://resend.com/docs/dashboard/domains/introduction)
- **Vercel account** (optional) — for production deployment and cron schedules

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in your keys
npm run dev
```

`npm run dev` starts the interactive terminal UI and a local HTTP server on **port 2000**. Chat in the terminal, or call the API from another shell at `http://127.0.0.1:2000`.

## Environment variables

| Variable | Description |
| --- | --- |
| `OPENAI_API_KEY` | OpenAI API key for the agent model |
| `ADZUNA_APP_ID` / `ADZUNA_APP_KEY` | Adzuna application credentials |
| `RESEND_API_KEY` | Resend API key for sending emails |
| `DIGEST_EMAIL_FROM` | Sender address (must be on a domain verified in Resend) |
| `DIGEST_EMAIL_TO` | Recipient address for the daily digest |

Store these in `.env.local` for local development. On Vercel, add them under **Project Settings → Environment Variables** for **Production**.

## Project structure

```text
agent/
├── agent.ts                 # Model config (gpt-4o)
├── instructions.md          # System prompt and filtering rules
├── channels/eve.ts          # HTTP channel and auth
├── schedules/daily_digest.ts # Weekday cron (10:00 AM Pacific)
└── tools/
    ├── search_adzuna.ts
    ├── search_remotive.ts
    └── send_digest.ts
```

## Schedule and cron

`agent/schedules/daily_digest.ts` runs Monday–Friday at 10:00 AM Pacific (`0 17 * * 1-5` during PDT). Vercel evaluates cron in UTC — use `0 18 * * 1-5` during PST.

On **Vercel Hobby**, invocations may fire anytime within the scheduled hour, not at the exact minute.

A successful cron run only means the handler started. Check **Observability → Logs** (and Resend) to confirm the agent finished and emailed the digest.

### Trigger manually

**Local** — keep `npm run dev` running, then in another terminal:

```bash
curl -X POST http://127.0.0.1:2000/eve/v1/dev/schedules/daily_digest
```

**Production** — open **Settings → Cron Jobs → Run** in the Vercel dashboard, or from a linked project:

```bash
vercel crons run   # pick the daily_digest job interactively
```

The dev schedule route does not exist in production. See the [eve schedules docs](https://eve.dev/docs/schedules).

## Deploy to Vercel

1. Import the project in the [Vercel dashboard](https://vercel.com/new)
2. Add all environment variables from `.env.example` for **Production**
3. Deploy:

```bash
vercel deploy --prod
```

Cron jobs run only on **Production** deployments. Confirm the job under **Settings → Cron Jobs** and monitor runs under **Observability → Cron Jobs**.

To smoke-test production from your machine:

```bash
vercel link   # once, so the CLI can mint a Vercel OIDC token
npx eve dev https://your-app.vercel.app
```

Set `VERCEL_AUTOMATION_BYPASS_SECRET` locally if the deployment uses Deployment Protection.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server + terminal UI (port **2000**) |
| `npm run build` | Compile the agent and build host output |
| `npm run start` | Serve built output (port **3000** by default) |
| `npm run typecheck` | TypeScript type checking |

## Authentication

`agent/channels/eve.ts` uses `localDev()` (localhost), `vercelOidc()` (remote `eve dev` and Vercel callers — requires `vercel link`), and `placeholderAuth()` (rejects unauthenticated production HTTP). **Scheduled cron runs bypass channel auth.** Replace `placeholderAuth()` before exposing the agent to end users. See the [eve auth guide](https://eve.dev/docs/guides/auth-and-route-protection).

## Learn more

- [eve getting started](https://eve.dev/docs/getting-started)
- [eve schedules](https://eve.dev/docs/schedules)
- [eve deployment](https://eve.dev/docs/guides/deployment)

Bundled docs: `node_modules/eve/docs/` after `npm install`.
