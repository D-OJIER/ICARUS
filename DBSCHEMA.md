# ICARUS Database Schema

ICARUS uses Supabase PostgreSQL with Supabase Auth for email/password accounts. User data is tenant-isolated through Row Level Security policies that compare each row's `user_id` or profile `id` to `auth.uid()`.

## Core Tables

`users` stores the living character profile, account metadata, XP, level, title, seeds, timezone, and the rich `character_profile` JSON payload used by the frontend.

`quests` stores daily vows and tasks. Each row includes normalized fields for filtering plus a `data` JSON payload that preserves the full client-side quest object.

`goals` stores campaign-based growth plans. Each row includes normalized status, category, resources, and a `data` JSON payload for the full campaign object.

`goal_stages` and `goal_tasks` normalize campaign structure for reporting, indexing, and future analytics.

`user_stats`, `user_skill_nodes`, `user_achievements`, `user_chronicle`, and `user_earned_titles` model the RPG progression layer.

## Security

All tables have Row Level Security enabled. Authenticated users can only read, insert, update, or delete records attached to their own Supabase Auth user ID.

## Migration

Apply the schema from:

```text
supabase/migrations/001_icarus_schema.sql
```

The root `dbSchema.sql` file mirrors the same schema for review or manual SQL editor usage.
