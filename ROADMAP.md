# SquadLift Roadmap

Last updated: 2026-06-10

## Product Target

SquadLift is a private Hevy-style workout tracker for a small friend squad. The target is a React/Vite PWA hosted on Vercel, used on iPhone through Safari and Add to Home Screen. The app should cost $0 to run where possible and focus on fast workout logging, reusable routines, workout history, profile stats, and a shared exercise library.

## Current State

- React + Vite + TypeScript PWA restored as the active product direction.
- Vercel hosting is live at `https://gym-log-six-zeta.vercel.app`.
- GitHub `main` is connected to Vercel project `gym-log`.
- Tailwind CSS dark gym UI is already heavily implemented.
- Core prototype screens exist:
  - Home/history
  - Workout/routine launcher
  - New routine builder
  - Active workout overlay
  - Rest timer
  - Profile/stats view
  - Exercise library with custom exercise creation
  - Workout detail modal
- Seed data exists for 4 squad members, routines, workouts, and exercises.
- Data is persisted through a versioned local storage adapter backed by browser `localStorage`.
- Supabase backend foundation is now live in a real Supabase project:
  - reviewed migration exists in `supabase/migrations/0001_initial_schema.sql`
  - membership-based RLS is enabled
  - anonymous workout access is blocked
  - two authenticated squad users can read shared workout data
  - local RLS smoke test exists at `npm run test:supabase`
- Supabase app integration is active:
  - Supabase client is configured with persistent sessions
  - email/password sign-in now appears as a first-run app entry screen, with developer-tool sign-in retained as a fallback
  - the app header shows cloud/local sign-in status
  - cloud connection/RLS check works
  - manual local-to-cloud upload works
  - read-only cloud preview works
  - explicit restore-from-cloud with confirmation works
  - auto-push after supported local saves is enabled for the signed-in active user
  - failed auto-push attempts are queued locally and retry on app open/reconnect
  - automatic cloud pull runs on app open/sign-in/reconnect when there are no pending local sync retries
- The app uses a mobile-first shell with developer tools moved into a separate drawer.
- PWA install support is implemented with Vite PWA, app manifest, service worker, and generated icons.
- iOS/PWA shell polish has been applied:
  - opaque iOS standalone status bar with `black` status-bar mode
  - small custom black top safe-area cover to prevent scroll bleed
  - hidden scrollbars
  - fixed bottom navigation
  - compact 51px bottom nav height
- Developer tools include visible build/source info, local JSON export/import/reset controls, and manual Supabase cloud checks.
- Core squad avatars are local generated SVG assets instead of remote image URLs.
- Machoke profile badge assets are optimized and kept lightweight, with the current RGBA background/alpha preserved.
- Expo/native mobile work has been discarded for now. The active path is React/Vite PWA only.
- Workout-flow hardening is implemented:
  - numeric set/routine inputs are sanitized
  - duplicate custom exercise names are blocked
  - duplicate routine/active workout movements are blocked
  - routine and active-exercise deletes have confirmations
  - completed workout saves ignore invalid/incomplete sets
  - set completion targets the exact logged exercise row
- Workout history/detail and profile stats have been upgraded:
  - history cards show completed set counts
  - workout detail shows completed sets and per-exercise volume
  - profile shows total workouts, total volume, completed sets, training time, average duration, and latest workout date

## Known Gaps

- Email/password authentication is now part of the normal app entry flow, but account creation is still managed manually in Supabase.
- Cross-device/shared data is partially implemented through manual Supabase upload and read-only preview.
- The app still loads and writes local storage first; auto-push is best-effort after supported local saves.
- Supabase-backed restore/pull into local app state now runs automatically when safe, with the manual restore button still available.
- Failed auto-push attempts have a local retry queue with automatic retry on app open/reconnect.
- Conflict handling is still simple: pending local sync retries pause automatic cloud pull until local changes push successfully.
- Local data has basic versioning, corrupted-data fallback, legacy migration, and a lightweight `npm run test:storage` verification script.
- A shared domain layer exists only as a thin local service; more workout validation/business logic still lives in UI state handlers.
- The Machoke badge assets may need to be replaced if the app should avoid copyrighted or joke-brand visuals.
- Custom exercise image URLs can still be remote and may be unreliable offline.
- Installed PWAs may need close/reopen or reinstall after shell/meta/service-worker updates because browsers cache PWA assets aggressively.
- iOS may require removing and re-adding the home-screen PWA after status-bar or manifest changes.

## Recommended Build Order

1. Install dependencies and run baseline checks:
   - `npm install`
   - `npm run lint`
   - `npm run build`
   - `npm run dev`
   - Status: completed

2. Clean project scaffold:
   - Rename package metadata to SquadLift.
   - Update `index.html` title and metadata.
   - Replace the AI Studio README with real local setup instructions.
   - Remove unused dependencies after confirming they are not needed.
   - Status: completed

3. Make the prototype honest:
   - Replace "Supabase synced" labels with "Local Demo Mode" until real sync exists.
   - Keep the Supabase schema viewer only as a dev/admin reference or remove it from the main product surface.
   - Status: completed

4. Keep the experience mobile-first:
   - Completed: the fake phone frame was removed.
   - Completed: the main app now renders as a centered mobile-first viewport.
   - Completed: simulator and schema tools live in a separate developer drawer.
   - Completed: iOS top safe-area protection and fixed 51px bottom navigation have been patched.
   - Current status: continue real iPhone Safari and home-screen PWA QA.

5. Keep PWA support production-ready:
   - Completed: add app manifest.
   - Completed: add icons.
   - Completed: add service worker / Vite PWA support.
   - Completed: verify local installability and standalone PWA behavior.
   - Current status: test each deployed Vercel build on iPhone Safari and installed PWA.

6. Deploy with Vercel:
   - Connect `Ian11155/gym-log` to Vercel.
   - Use `npm run build` as the production build command.
   - Use Vite's default `dist` output directory.
   - Verify the Vercel URL on desktop and iPhone Safari.
   - Add the Vercel app to the iPhone Home Screen.
   - Status: completed
   - Production URL: `https://squadlift-beta.vercel.app`

7. Introduce a storage adapter:
   - Completed: create a local data adapter around the existing localStorage behavior.
   - Completed: add versioned local snapshot loading, legacy-key migration, corrupted-data fallback, and JSON backup import/export/reset tools.
   - Current status: expand the service layer with more domain validation before Supabase.

8. Harden workout flows:
   - Validate numeric inputs.
   - Prevent duplicate custom exercises.
   - Improve empty and not-found states.
   - Add safer delete confirmations for routines/exercises.
   - Ensure finishing/cancelling workout works reliably on mobile Safari.
   - Status: completed

9. Improve history and stats:
   - Make saved workouts easy to reopen from history.
   - Show useful workout detail data.
   - Add simple profile aggregates from local data.
   - Keep completed workout history read-only until the core flow is stable.
   - Status: completed

10. Implement Supabase sync:
    - Completed: create the first reviewed migration before connecting the app.
    - Completed: add Supabase client setup behind a manual developer-tool connection check.
    - Completed: verify anonymous RLS blocking and two-user shared workout reads.
    - Completed: add persistent email/password sign-in in developer tools.
    - Completed: add manual local-to-cloud upload in developer tools.
    - Completed: add read-only cloud pull preview in developer tools.
    - Completed: add explicit restore-from-cloud with confirmation.
    - Completed: add best-effort auto-push after workout/routine/exercise saves.
   - Completed: add local retry queue for failed auto-push attempts.
   - Completed: add automatic retry on app open/reconnect.
   - Completed: add automatic cloud pull on app open/sign-in/reconnect when there is no pending local sync retry.
    - Completed: add first-run cloud sign-in screen and header cloud status.
    - Use membership-based RLS instead of broad public policies.
    - Start with auth, squad membership, exercises, routines, workout logs, logged exercises, and logged sets.
    - Keep comments, reactions, fist-bumps, and feed behavior out of scope.
    - Add cross-device sync after local-first behavior remains stable.
    - Current status: test the full cloud loop on iPhone and laptop browser, then refine conflict behavior if needed.

11. Polish and test:
    - Test on desktop and mobile viewport sizes.
    - Check touch target sizes.
    - Verify no text overlap or clipped controls.
    - Run `npm run lint` and `npm run build`.
    - Use the in-app browser for visual QA after UI changes.
    - Repeat installed-PWA testing after any meta, manifest, service-worker, or shell layout change.

## Immediate Next Task

Next recommended task: test the full cloud loop on iPhone and laptop browser: sign in, pull, finish workout, auto-push, open the other device, auto-pull.
