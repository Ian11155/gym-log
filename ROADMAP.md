# SquadLift Roadmap

Last updated: 2026-06-09

## Product Target

SquadLift is a private Hevy-style workout tracker for a squad of 4 friends. It should work well on iOS and Android, cost $0 to run where possible, and focus on fast gym logging, shared routines, squad feed activity, comments, fist bumps, streaks, and a collaborative exercise library.

## Current State

- React + Vite + TypeScript PWA prototype, cleaned up from the original AI Studio export.
- Tailwind CSS dark gym UI is already heavily implemented.
- Core prototype screens exist:
  - Home/squad feed
  - Workout/routine launcher
  - New routine builder
  - Active workout overlay
  - Rest timer
  - Profile/stats view
  - Exercise library with custom exercise creation
  - Workout detail modal
- Seed data exists for 4 squad members, routines, workouts, comments, reactions, and exercises.
- Data is currently persisted with `localStorage`.
- Supabase schema text exists in `src/types.ts`, but there is no live Supabase client or real backend integration yet.
- The app uses a mobile-first shell with developer tools moved into a separate drawer.
- PWA install support is implemented with Vite PWA, app manifest, service worker, and generated icons.
- iOS/PWA shell polish has been applied:
  - opaque iOS standalone status bar with `black` status-bar mode
  - small custom black top safe-area cover to prevent scroll bleed
  - hidden scrollbars
  - fixed bottom navigation
  - compact 51px bottom nav height
- Machoke profile badge assets are optimized and kept lightweight, with the current RGBA background/alpha preserved.

## Known Gaps

- Real authentication/user identity is not implemented.
- Cross-device/shared data is not implemented.
- The app still stores all real user changes on the current device only.
- The app does not yet have a storage adapter between UI state and persistence.
- Local data is not hardened against corrupted or stale `localStorage`.
- `DashboardTab.tsx` and `FeedTab.tsx` appear to be legacy/unused components.
- The Machoke badge assets may need to be replaced if the app should avoid copyrighted or joke-brand visuals.
- Some image/avatar URLs are remote and may be unreliable offline.
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

4. Convert the experience to mobile-first:
   - Completed: the fake phone frame was removed.
   - Completed: the main app now renders as a centered mobile-first viewport.
   - Completed: simulator and schema tools live in a separate developer drawer.
   - Completed: iOS top safe-area protection and fixed 51px bottom navigation have been patched.
   - Current status: continue real-device QA and small layout fixes as found.

5. Add PWA support:
   - Completed: add app manifest.
   - Completed: add icons.
   - Completed: add service worker / Vite PWA support.
   - Completed: verify local installability and standalone PWA behavior.
   - Current status: continue testing updates on installed iPhone/Android PWAs.

6. Introduce a storage adapter:
   - Create a local data adapter around the existing localStorage behavior.
   - Keep UI components independent from the storage backend.
   - Later swap or extend the adapter with Supabase.
   - Status: next recommended code task.

7. Implement Supabase:
   - Add Supabase client setup.
   - Create real tables using a reviewed migration.
   - Add CRUD for workouts, routines, exercises, comments, and reactions.
   - Add realtime listeners for feed/comment/reaction updates.

8. Add real friend identity:
   - Choose login method: Supabase Auth, invite-code gate, or fixed 4-user login.
   - Replace simulator user switching with real active user resolution.

9. Harden workout flows:
   - Validate numeric inputs.
   - Protect against corrupted localStorage.
   - Prevent duplicate custom exercises.
   - Add safer delete confirmations for routines/exercises.
   - Ensure finishing/cancelling workout works reliably on mobile.

10. Polish and test:
    - Test on desktop and mobile viewport sizes.
    - Check touch target sizes.
    - Verify no text overlap or clipped controls.
    - Run `npm run lint` and `npm run build`.
    - Use the in-app browser for visual QA after UI changes.
    - Repeat installed-PWA testing after any meta, manifest, service-worker, or shell layout change.

## Immediate Next Task

Next recommended task: introduce a storage adapter around the current `localStorage` behavior. Keep the app local-first for now, but stop wiring persistence directly through `App.tsx` so Supabase can be added later without rewriting the UI.
