# Supabase Plan

Last updated: 2026-06-09

## Goal

Add Supabase as the shared backend for the React/Vite PWA without changing the app's current local-first workout experience. The first useful backend slice is private squad sync across iPhones: users, squad membership, exercise library, routines, workout logs, logged exercises, and logged sets.

Comments, reactions, fist-bumps, and feed behavior are out of scope.

## Current App Boundary

- The production app is the React/Vite PWA hosted on Vercel.
- Local data is loaded and saved through `squadDataService`.
- The persistence source today is browser `localStorage`.
- `src/types.ts` contains Supabase SQL as a reference only.
- There is no live Supabase client, auth session, migration folder, or remote sync path yet.

## Recommended Architecture

Keep the existing local adapter as the offline/source-of-truth layer for this first pass. Add Supabase behind a second adapter, then sync only after local save succeeds.

Suggested flow:

1. App loads local data immediately.
2. If signed in, app fetches the user's squad snapshot from Supabase.
3. Remote data is normalized into the same app shape used by local storage.
4. Finishing a workout writes locally first, then upserts to Supabase.
5. Manual backup export/import stays available while sync stabilizes.

This keeps the PWA usable at the gym even with weak iPhone signal.

## Phase 1: Supabase Project Setup

- Create one Supabase project on the free tier.
- Enable email auth.
- Add environment variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Add `.env.local` for local development.
- Keep real keys out of Git.
- Add the Supabase client dependency only when integration starts.

## Phase 2: Schema Design

Replace the embedded reference SQL with a reviewed migration before applying anything.

Core tables:

- `profiles`
- `squads`
- `squad_members`
- `exercises`
- `routines`
- `routine_exercises`
- `routine_sets`
- `workout_logs`
- `logged_exercises`
- `logged_sets`

Recommended rules:

- Use `auth.users.id` as the profile id.
- Use `uuid` primary keys with `gen_random_uuid()`.
- Add `created_at` and `updated_at` timestamps to user-created rows.
- Store workout log hierarchy in normalized child tables, not as one large JSON blob.
- Keep `total_volume` and `duration_seconds` on `workout_logs` as denormalized summary fields for fast history/profile reads.
- Avoid comments/reactions tables for now.

## Phase 3: RLS And Access

The current reference SQL uses broad policies. The real migration should use membership-based RLS.

Policy shape:

- A user can read a squad only if they are in `squad_members`.
- A user can read workouts, routines, and exercises only for squads they belong to.
- A user can insert/update their own workout logs.
- Shared custom exercises can be inserted by squad members.
- Destructive deletes should start narrow: own routines only, no workout deletes in the first cloud slice.

Indexes to include:

- Foreign-key indexes on every child table reference.
- `squad_members(user_id)`.
- `squad_members(squad_id)`.
- `workout_logs(squad_id, end_time desc)`.
- `workout_logs(user_id, end_time desc)`.
- `routines(user_id, created_at desc)`.
- `exercises(squad_id, lower(name))` with a uniqueness rule for duplicate prevention.

## Phase 4: App Integration

Small implementation order:

1. Completed: install `@supabase/supabase-js`.
2. Completed: add `src/services/supabaseClient.ts`.
3. Completed: add environment validation with a clear local-only fallback.
4. Completed: add developer-tool email/password sign-in state.
5. Add `src/services/supabaseSquadDataService.ts`.
6. Keep `squadDataService` as the app-facing adapter boundary.
7. Completed: add a manual developer-tool cloud connection/RLS check before automatic sync.
8. After manual sync is reliable, add background pull-on-load and push-on-save.

## Phase 5: Migration From Local Data

First migration path should be manual and reversible:

1. User exports local backup.
2. User signs in.
3. App offers "Upload this device's data to squad cloud".
4. App upserts exercises first, routines second, workout logs third.
5. App keeps the local backup tools visible until cloud sync has been tested on both iPhones.

## Validation Checklist

- `npm run lint`
- `npm run build`
- Local sign-in succeeds.
- App still loads without Supabase env vars.
- Existing local workouts still appear before sign-in.
- Custom exercise names survive local-to-cloud upload.
- Workout history is identical after reload on another iPhone.
- RLS blocks access when signed out.
- RLS blocks users outside the squad.
- Duplicate custom exercise names are blocked locally and by the database.

## First Implementation Task

Completed: create the reviewed migration file and a manual app-side cloud connection check.

The first Supabase foundation commit added:

- `supabase/migrations/0001_initial_schema.sql`
- `supabase/README.md`
- `src/services/supabaseClient.ts`
- `scripts/verify-supabase-rls.ts`
- Updated roadmap status

Next implementation task: add a manual "upload local data to cloud" action. Keep local storage as the first load/write path.
