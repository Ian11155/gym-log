# SquadLift Supabase

This folder contains the planned Supabase backend for SquadLift. The production app is still local-first until this schema is applied, reviewed, and tested in a fresh Supabase project.

## Current Status

- Initial migration drafted: `supabase/migrations/0001_initial_schema.sql`
- App code has manual developer-tool cloud connection, email sign-in, local upload, read-only cloud preview, restore-from-cloud checks, and best-effort auto-push after supported local saves.
- Supabase environment variables are optional; without them, the PWA stays local-only.
- Comments, reactions, fist-bumps, and social feed behavior are intentionally out of scope.

## Schema Scope

The first migration creates:

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

It also adds:

- membership-based RLS policies
- helper functions for squad membership checks
- explicit authenticated-role grants for API access
- foreign-key indexes for joins
- history/profile query indexes
- uniqueness rules for duplicate custom exercise names inside a squad
- basic check constraints for reps, weight, duration, ordering, and non-empty names

## Apply In Supabase

Use a fresh Supabase project first.

1. Open the Supabase dashboard.
2. Go to SQL Editor.
3. Paste `supabase/migrations/0001_initial_schema.sql`.
4. Run the migration.
5. Create two test auth users.
6. Insert matching `profiles`.
7. Create one squad and add both users to `squad_members`.
8. Test that each user can read the squad's shared data.
9. Test that a signed-out request cannot read protected rows.
10. Test that a user outside the squad cannot read protected rows.

## Local Development Notes

Supabase app integration should happen in a later step.

When that starts, add local-only env vars:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Do not commit real keys.

## RLS Smoke Test

The repo includes a local REST/Auth smoke test:

```bash
npm run test:supabase
```

With only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, the test confirms anonymous access to `workout_logs` is blocked.

To also confirm both squad users can read the shared test workout, add temporary local-only test credentials:

```bash
SUPABASE_TEST_EMAIL_1=
SUPABASE_TEST_PASSWORD_1=
SUPABASE_TEST_EMAIL_2=
SUPABASE_TEST_PASSWORD_2=
```

Then rerun:

```bash
npm run test:supabase
```

## Next App Step

Next, add a retry queue for failed auto-push attempts. Keep local storage as the first load path and first write path until cloud sync is boringly reliable.
