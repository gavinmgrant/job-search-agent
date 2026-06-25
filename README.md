# Job Search Agent

A durable [eve](https://eve.dev) agent that searches job boards, ranks matches for a frontend engineer profile, and emails a daily digest. Built for deployment on [Vercel](https://vercel.com).

## What it does

On weekdays at 10:00 AM Pacific time, the agent:

1. Searches [Adzuna](https://www.adzuna.com/) for frontend roles in San Diego and remote
2. Searches [Remotive](https://remotive.com/) for remote frontend roles
3. Combines results, deduplicates, and picks the top 10 most relevant listings
4. Emails the digest via [Resend](https://resend.com/)

You can also chat with the agent interactively in the dev terminal UI or over the HTTP API.

## Prerequisites

- **Node.js 24** or newer (required by eve)
- **OpenAI API key** — the agent uses `gpt-4o` via `@ai-sdk/openai`
- **Adzuna API credentials** — free at [developer.adzuna.com](https://developer.adzuna.com/)
- **Resend API key** — for sending digest emails; requires a [verified sending domain](https://resend.com/docs/dashboard/domains/introduction)
- **Vercel account** (optional) — for production deployment and cron schedules

## Quick start

```bash
# Install dependencies
npm install

# Copy environment variables and fill in your keys
cp .env.example .env.local

# Start the local dev server and interactive terminal UI
npm run dev
```

Type a message in the terminal UI to test the agent. For example:

> Search for senior frontend engineer roles in San Diego and remote, then email me the top matches.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `OPENAI_API_KEY` | Yes | OpenAI API key for the agent model |
| `ADZUNA_APP_ID` | Yes | Adzuna application ID |
| `ADZUNA_APP_KEY` | Yes | Adzuna application key |
| `RESEND_API_KEY` | Yes | Resend API key for sending emails |
| `DIGEST_EMAIL` | Yes | Recipient address for the daily digest |

Store these in `.env.local` for local development. On Vercel, add them under **Project Settings → Environment Variables**.

## Project structure

```text
job-search-agent/
├── agent/
│   ├── agent.ts              # Model and runtime config
│   ├── instructions.md       # System prompt (identity and behavior)
│   ├── channels/
│   │   └── eve.ts            # HTTP channel and auth
│   ├── schedules/
│   │   └── daily_digest.ts   # Weekday cron job (10:00 AM Pacific)
│   └── tools/
│       ├── search_adzuna.ts  # Search Adzuna job listings
│       ├── search_remotive.ts # Search Remotive remote jobs
│       └── send_digest.ts    # Email the compiled digest
├── package.json
└── tsconfig.json
```

### Agent config

`agent/agent.ts` sets the model:

```ts
import { openai } from "@ai-sdk/openai"
import { defineAgent } from "eve"

export default defineAgent({
  model: openai("gpt-4o"),
})
```

`agent/instructions.md` defines the agent's personality and filtering rules — strong matches only, concise output, honest when nothing fits.

### Tools

| Tool | Source | Description |
| --- | --- | --- |
| `search_adzuna` | Adzuna API | Search by role, location, and experience level |
| `search_remotive` | Remotive API | Search remote jobs by role keyword |
| `send_digest` | Resend | Email the formatted digest to `DIGEST_EMAIL` |

Tools run in the app runtime with full access to `process.env`. The filename becomes the tool name the model sees.

Before going to production, update the `from` address in `agent/tools/send_digest.ts` to an email on a domain you have verified in Resend.

### Schedule

`agent/schedules/daily_digest.ts` runs Monday through Friday at 10:00 AM Pacific (`0 17 * * 1-5` during PDT). Vercel evaluates cron expressions in UTC, so the hour shifts by one when daylight saving ends — use `0 18 * * 1-5` during PST.

To trigger the schedule manually during local development:

```bash
curl -X POST http://localhost:3000/eve/v1/dev/schedules/daily_digest
```

This dev-only route does not run in production. See the [eve schedules docs](https://eve.dev/docs/schedules) for details.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local runtime and interactive terminal UI |
| `npm run build` | Compile the agent and build the host output |
| `npm run start` | Serve the built output (`.output/`) |
| `npm run typecheck` | Run TypeScript type checking |

## HTTP API

Every eve app exposes a stable HTTP API. Create a session:

```bash
curl -X POST http://127.0.0.1:3000/eve/v1/session \
  -H 'content-type: application/json' \
  -d '{"message":"Search for frontend roles in San Diego and email me the results."}'
```

The response includes a `continuationToken` and an `x-eve-session-id` header. Stream the session:

```bash
curl http://127.0.0.1:3000/eve/v1/session/<sessionId>/stream
```

See the [eve getting started guide](https://eve.dev/docs/getting-started) for the full session and streaming contract.

## Deploy to Vercel

1. Push the repository to GitHub (or connect your preferred Git provider)
2. Import the project in the [Vercel dashboard](https://vercel.com/new)
3. Add all environment variables from `.env.example`
4. Deploy

```bash
vercel deploy
```

On Vercel, the daily digest schedule becomes a [Vercel Cron Job](https://vercel.com/docs/cron-jobs). Confirm it under **Settings → Cron Jobs** and monitor runs under **Observability → Cron Jobs**.

Smoke-test a deployment from the CLI:

```bash
npx eve dev https://your-app.vercel.app
```

## Authentication

`agent/channels/eve.ts` configures three auth providers:

- **`localDev()`** — allows unauthenticated access on localhost during `eve dev`
- **`vercelOidc()`** — lets the eve TUI and Vercel deployments reach the agent
- **`placeholderAuth()`** — rejects browser requests in production (fails closed)

Replace `placeholderAuth()` with your app's real auth provider (Auth.js, Clerk, etc.) before exposing the agent to end users. See the [eve auth guide](https://eve.dev/docs/guides/auth-and-route-protection).

## Customization

**Search criteria** — edit the prompt in `agent/schedules/daily_digest.ts`, or ask the agent interactively with different role, location, or experience level parameters.

**Filtering behavior** — update `agent/instructions.md` to change how aggressively the agent filters and ranks results.

**Schedule cadence** — change the `cron` expression in `agent/schedules/daily_digest.ts`. Cron uses UTC on Vercel.

**Model** — swap the model in `agent/agent.ts`. Any provider supported by the [Vercel AI SDK](https://sdk.vercel.ai/docs) works with eve.

## Learn more

- [eve documentation](https://eve.dev/docs) — framework reference
- [eve getting started](https://eve.dev/docs/getting-started) — install, scaffold, and run locally
- [eve tools](https://eve.dev/docs/tools) — define typed agent actions
- [eve schedules](https://eve.dev/docs/schedules) — cron-based automation
- [eve deployment](https://eve.dev/docs/guides/deployment) — production hosting

Bundled docs are also available locally at `node_modules/eve/docs/` after installing dependencies.
