# ICARUS

ICARUS is an AI-powered personal progression system inspired by ancient ruins, ritual calendars, and living character sheets. It turns goals into campaigns, daily work into vows, and long-term growth into visible progression through dynamic skill discovery, procedural monuments, and generated avatars.

## Features

- Campaign-based growth planning with staged milestones and task generation.
- Dynamic skill discovery from completed quests and active campaigns.
- Living character progression with XP, titles, achievements, chronicles, and stats.
- Procedural monuments, avatars, ruin banners, and atmospheric UI systems.
- Ancient ruin inspired experience for daily planning, habits, and reflection.

## Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Configure Supabase:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
AI_API_KEY=
AI_MODEL=
```

`AI_API_KEY` and `AI_MODEL` are used by the backend AI routes. The app still runs without them, but AI planning and assessment endpoints will report that AI is unavailable.

## Supabase Setup

1. Create a Supabase project.
2. In Authentication, enable email/password signups.
3. For the simplest local flow, disable email confirmation while developing.
4. Apply the SQL migration in `supabase/migrations/001_icarus_schema.sql`.
5. Copy the project URL and anon key into `.env.local`.

## Development

Run the local server:

```bash
npm run dev
```

Build the production bundle:

```bash
npm run build
```

Type-check the project:

```bash
npm run lint
```

Start the built server:

```bash
npm run start
```

## Architecture

Frontend: React, Vite, Tailwind CSS, Motion, and Lucide power the interactive ICARUS client.

Backend: Express serves the Vite app and provides AI endpoints for quest suggestions, campaign planning, coaching, reports, and profile assessment.

Database: Supabase PostgreSQL stores profiles, quests, goals, campaign stages, skill nodes, achievements, chronicles, and titles.

Authentication: Supabase Auth handles email/password registration, login, logout, and password reset.

AI Systems: Backend AI routes generate gothic task transformations, progression campaigns, coaching responses, habit evolution, and character assessments.
