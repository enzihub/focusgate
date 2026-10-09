<div align="center">

  <img src="assets/hero.png" width="1000" alt="FocusGate: Slack overload in, a morning brief out. Shown with invented Slack messages and the real brief email that the app renders from them.">

<br>

**[Demo](#see-it-work)** ·
**[Features](#features)** ·
**[How it works](#how-it-works)** ·
**[Quick start](#quick-start)** ·
**[Configuration](#configuration)**

<br>

[![Next.js 14](https://img.shields.io/badge/Next.js-14-0d0a6b?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/API-FastAPI-0d0a6b?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Celery + Redis](https://img.shields.io/badge/jobs-Celery%20%2B%20Redis-0d0a6b?logo=redis&logoColor=white)](https://docs.celeryq.dev)
[![Slack](https://img.shields.io/badge/Slack-read--only-4a154b?logo=slack&logoColor=white)](https://api.slack.com)
[![License: MIT](https://img.shields.io/badge/license-MIT-1d4de0)](LICENSE)

</div>

## Why

Executives join a dozen Slack channels and read none of them. FocusGate reads the last 24 hours of every channel a person can see and emails them one short brief at the hour they pick: what happened, what is blocked, what is due and who owns it.

## See it work

<div align="center">
  <img src="assets/demo.gif" width="960" alt="Animated walkthrough: the dashboard's 'Send me FocusGate' button, the Profile page where the delivery time is changed to 6 AM and saved, and the morning brief email.">
  <br>
  <sub>The real web app, recorded headless on 127.0.0.1 with a local Postgres. Clerk, Slack and Gemini are stubbed. Every person, company and address is invented (<code>.test</code> and <code>.example</code> domains).</sub>
</div>

<br>

<div align="center">
  <img src="assets/collage.png" width="1000" alt="Three real screenshots: the morning brief email, the Profile page with the delivery time, and the dashboard with the send-now button.">
</div>

## Features

### The morning brief

The core service pulls every message from the last 24 hours, swaps Slack user IDs for real names and sends the chat log to Gemini with one structured prompt. The answer becomes an HTML email with fixed sections: executive summary, key achievements, blockers, incidents, upcoming deadlines, team updates, recommendations and action items.

<img src="assets/screenshots/morning-brief.png" width="560" alt="The morning brief for an invented team: executive summary, achievements, blockers with owners, an incident, deadlines, team updates, recommendations and action items.">

<sub>Rendered by the real pipeline (<code>generate_newsletter_content</code> and <code>core/templates/newsletter.html</code>) from five invented Slack channels. Only Slack and the model reply were stubbed.</sub>

### Pick your hour

Each person chooses when the brief arrives. The browser's time zone is saved with the choice, and a Postgres function (`core/sql/get_scheduled_users.sql`) works out who is due in the next window.

<img src="assets/screenshots/profile.png" width="1000" alt="The Profile page for a fictional user, Dana Whitfield: profile details and a newsletter card with the delivery time set to 7:00 AM, America/New_York.">

### Send one now

New users do not have to wait until tomorrow. The dashboard button asks the core API to build and send a brief straight away.

<img src="assets/screenshots/dashboard.png" width="1000" alt="The dashboard after sign-up with the 'Send me FocusGate' button.">

### Also in the box

- **Add to Slack** OAuth with read-only history scopes. The user token is saved per user in Postgres, so FocusGate only reads what that person can already read.
- **A team brief**: set `TEAM_SLACK_CHANNEL_ID` and a Celery job posts a brief for the whole team to that channel every morning at 05:00 UTC.
- **A `/focusgate` slash command** that posts a brief into the current Slack channel on demand.
- **Stripe billing** (optional): pricing page, checkout, customer portal and a webhook that syncs subscriptions into Postgres.
- **Clerk sign-in** with a webhook that creates the user row in Postgres.

## How it works

<div align="center">
  <img src="assets/how.png" width="1000" alt="Flow: Add to Slack and pick a time, an hourly scheduler (or the send-now button) queues the user, Gemini reads and summarises the last 24 hours, and the morning brief goes out by email or to a Slack channel.">
</div>

```
web/   Next.js 14 (App Router) + Clerk + Drizzle + Stripe   sign-in, Add to Slack, delivery time, billing
core/  FastAPI + Celery + Redis                              Slack fetch, Gemini summary, email send
       ├─ app/integrations/slack   read 24 h of history, resolve names, build the brief
       ├─ app/core/ai              the morning brief prompt
       ├─ app/core/scheduler       Celery beat: produce every hour, consume every minute
       ├─ app/core/emailing        Mailtrap sending API
       └─ sql/                     get_scheduled_users() for the shared Postgres
```

Both apps share one Postgres database. The web app owns the schema (Drizzle migrations in `web/src/db/migrations/`). Every hour, Celery beat calls `get_scheduled_users()` and puts the users who are due in a Redis queue. A second job runs every minute and sends whatever is ready.

## Quick start

You need Node 18+, Python 3.12+, [Poetry](https://python-poetry.org), Docker (for Postgres and Redis), and accounts for Clerk, a Slack app, Google AI Studio (Gemini) and Mailtrap. Stripe is optional.

```bash
git clone https://github.com/enzihub/focusgate && cd focusgate
```

**1. Database.** Start Postgres and the local Neon HTTP proxy that the web app's driver talks to, then run the migrations and the scheduler function:

```bash
cd web
export POSTGRES_PASSWORD=postgres
export PG_CONNECTION_STRING=postgres://postgres:postgres@postgres:5432/main
docker compose -f src/db/docker-compose.yml up -d
cp .env.example .env.local        # fill it in (see Configuration)
npm ci
npm run db:migrate
psql postgres://postgres:postgres@localhost:5432/main -f ../core/sql/get_scheduled_users.sql
```

**2. Web app** on <http://localhost:3000>:

```bash
npm run dev
```

**3. Core service.** Copy `core/.env.example` to `core/.env.development` and fill it in, then run each of these in its own terminal:

```bash
cd ../core
poetry install --no-root
poetry run uvicorn main:app --port 8000
poetry run celery -A app.core.scheduler.job_tasks worker --loglevel=info
poetry run celery -A app.core.scheduler.job_tasks beat --loglevel=info
```

Or run the API, worker, beat and Redis together with `docker compose up` in `core/`.

The email template test needs no services: `cd core && poetry run pytest tests/test_newsletter_template.py`.

> [!NOTE]
> In your Slack app, set the OAuth redirect URL to `<SITE_URL>/auth/slack/callback` and add the user scopes `channels:history`, `groups:history`, `mpim:history`, `im:history`, `channels:read`, `groups:read`, `mpim:read`, `im:read` and `users:read`.

## Configuration

Every value in the example files is empty. Nothing personal ships with the repo.

| Variable | Where | What it is |
| --- | --- | --- |
| `SITE_URL`, `NEXT_PUBLIC_SITE_URL` | web | Public URL of the web app (Slack OAuth redirect) |
| `DATABASE_URL` | web, core | The shared Postgres database |
| `FOCUSGATE_CORE_API_URL`, `FOCUSGATE_CORE_API_KEY` | web | Where the core runs, and the key it expects in `X-API-Key` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `SIGNING_SECRET` | web | Clerk sign-in and its user webhook |
| `NEXT_PUBLIC_SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET` | web | The Slack app used for "Add to Slack" |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PAYMENT_LINK1` | web | Optional billing |
| `NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_DEMO_BOOKING_URL` | web | Optional footer contact and booking link |
| `NEXT_PUBLIC_AUTHORIZED_EMAILS` | web | Optional allow-list for internal tools |
| `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GTM_ID` | web | Optional analytics. Off when empty |
| `API_KEY` | core | Shared secret the web app sends in `X-API-Key` |
| `REDIS_URL`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND` | core | Redis for Celery and the send queue |
| `PRODUCE_INTERVAL_SECONDS`, `CONSUME_INTERVAL_SECONDS` | core | Scheduler timing (defaults 3600 and 60) |
| `GEMINI_API_KEY` | core | Writes the brief |
| `OPENAI_API_KEY` | core | Optional, not used by the default pipeline |
| `CLERK_SECRET_KEY` | core | Optional Clerk lookups |
| `SLACK_SIGNING_SECRET`, `SLACK_BOT_TOKEN`, `TEAM_SLACK_CHANNEL_ID` | core | Slash commands and the optional team brief |
| `MAILTRAP_API_TOKEN`, `FROM_EMAIL`, `FROM_NAME`, `EMAIL_SUBJECT` | core | Email sending |
| `LOGO_URL`, `APP_URL` | core | Logo and links inside the email |
| `SENTRY_DSN` | core | Optional error tracking |

## Status

FocusGate was built by Enzi Studio in 2025 and is shared as-is. It is not maintained and it is not a hosted service, so expect to update dependencies before you deploy it. The `google-generativeai` package it uses has since been deprecated in favour of `google-genai`. The old marketing site was a Framer export full of tracking scripts, so it is not included. [`docs/`](docs/) is a new page made for this release.

## Credits

Built by **Enzi Studio**. Contributors to the original repositories:
[@RukshanJS](https://github.com/RukshanJS) ·
[@sun2ii](https://github.com/sun2ii) ·
[@bb-xops](https://github.com/bb-xops) ·
[@harrythentrepreneur](https://github.com/harrythentrepreneur) ·
[@kavishkanimsara](https://github.com/kavishkanimsara) ·
[@ZainAli104](https://github.com/ZainAli104)

The web app, website and images use the [Geist](https://github.com/vercel/geist-font) typeface (SIL Open Font License 1.1).

## Licence

[MIT](LICENSE) © 2025-2026 Enzi Studio (Harry Edwards)
