# ICARUS

ICARUS is an AI-powered personal progression system inspired by ancient ruins, gothic ritual calendars, and living character sheets. It turns goals into campaigns, daily work into vows, and long-term growth into visible progression through dynamic skill discovery, procedural monuments, and generated avatars.

---

## Features

- **Campaign-Based Growth**: Transform aspirations and habits into structured 4-phase, 40-day campaigns with staged milestones and task generation.
- **Atmospheric Daily Path**: Conduct daily planning, habit tracking, and reflection using an ancient ruin-inspired layout, bonfire screensaver, and interactive calendar.
- **Dynamic Skill Discovery**: Discover and unlock new skill trees and traits based on quests completed and active campaigns.
- **Living Character Sheet**: Track XP, level up attributes, earn gothic titles, unlock achievements, and browse a searchable journal of your personal chronicles.
- **Procedural Artwork**: Fully dynamic visualizers including generated avatars, custom SVG emblems, atmospheric ruin banners, and monument visualizers that evolve with your character.
- **Client-Side AI Oracle**: Get gothic/souls-like task name translations, campaign plans, periodic character audits, and habit evolution proposals.

---

## Setup

### 1. Install Dependencies
Ensure you have Node.js installed, then run:
```bash
npm install
```

### 2. Configure Environment Variables
Copy the example environment file:
```bash
cp .env.example .env
```

Configure your environment variables in `.env`. The project uses Expo environment variable loading, which requires the `EXPO_PUBLIC_` prefix for client-side access:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Required for AI translations, campaign plans, coaching, and assessments
EXPO_PUBLIC_AI_API_KEY=your-gemini-api-key
EXPO_PUBLIC_AI_MODEL=gemini-2.5-flash
```

---

## Supabase Database Setup

1. **Create a Supabase Project** at [supabase.com](https://supabase.com).
2. **Enable Email/Password signups** in the Supabase Dashboard under `Authentication -> Providers`.
   - *Optional:* Disable "Confirm email" during local development for a smoother onboarding experience.
3. **Initialize Database Tables**:
   - Apply the SQL migration file in [supabase/migrations/001_icarus_schema.sql](file:///home/alfredreijophilominf/Basic/code/Icarus/supabase/migrations/001_icarus_schema.sql) through the Supabase SQL Editor.
   - Alternatively, you can copy the contents of the root [dbSchema.sql](file:///home/alfredreijophilominf/Basic/code/Icarus/dbSchema.sql) file.
4. **Retrieve and Save Credentials**:
   - Copy the project URL and anon public key from Supabase's `Project Settings -> API` page into your `.env` file.

---

## Development & Run Scripts

Start the app locally on your platform of choice using Expo:

- **Web (Browser)**:
  ```bash
  npm run web
  ```
- **Expo Developer Dashboard**:
  ```bash
  npm run dev:app
  ```
- **Android Emulator**:
  ```bash
  npm run android
  ```
- **iOS Simulator**:
  ```bash
  npm run ios
  ```
- **Type-check TypeScript**:
  ```bash
  npm run ts:check
  ```

---

## Architecture & Codebase

ICARUS runs completely client-side as a high-fidelity standalone application powered by React Native and Expo.

- **Frontend**: Written in TypeScript using **React Native (Expo)** with SVG rendering (`react-native-svg`), custom dark gothic themed UI palettes, motion effects, and icons powered by `lucide-react-native`.
- **Database (Supabase PostgreSQL)**: Stores profiles, quests, goals, campaign stages, skill nodes, achievements, chronicles, and earned titles. Row Level Security (RLS) is fully configured for multi-tenant data isolation.
- **Client-Side AI Integration**: Utilizes the official `@google/genai` SDK to speak directly with Google Gemini models (defaulting to `gemini-2.5-flash`), featuring fallback deterministic generators for offline or non-API usage.
- **Native Web Support**: Ready for mobile and web responsive styling layout options.
