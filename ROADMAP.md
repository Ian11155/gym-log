# SquadLift Roadmap

Last updated: 2026-06-09

## Product Target

SquadLift is a private Hevy-style workout tracker for a squad of 4 friends. It should work well on iOS and Android, cost $0 to run where possible, and focus on fast gym logging, shared routines, squad feed activity, comments, fist bumps, streaks, and a collaborative exercise library.

## Current State

- React + Vite + TypeScript prototype exported from AI Studio.
- Tailwind CSS dark "Cosmic Slate" UI is already heavily implemented.
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
- The app now uses a mobile-first shell with developer tools moved into a separate drawer.

## Known Gaps

- Dependencies are installed and `package-lock.json` is generated.
- `package.json`, `README.md`, and `index.html` have been renamed/rewritten for SquadLift.
- UI copy has been relabeled so Supabase is presented as a future backend reference, not active sync.
- Real authentication/user identity is not implemented.
- Cross-device/shared data is not implemented.
- PWA install support is not implemented.
- Gemini/Express-related dependencies have been removed from the baseline.
- `DashboardTab.tsx` and `FeedTab.tsx` appear to be legacy/unused components.
- The Machoke badge assets may need to be replaced if the app should avoid copyrighted or joke-brand visuals.
- Some image/avatar URLs are remote and may be unreliable offline.

## Recommended Build Order

1. Install dependencies and run baseline checks:
   - `npm install`
   - `npm run lint`
   - `npm run build`
   - `npm run dev`

2. Clean project scaffold:
   - Rename package metadata to SquadLift.
   - Update `index.html` title and metadata.
   - Replace the AI Studio README with real local setup instructions.
   - Remove unused dependencies after confirming they are not needed.

3. Make the prototype honest:
   - Replace "Supabase synced" labels with "Local Demo Mode" until real sync exists.
   - Keep the Supabase schema viewer only as a dev/admin reference or remove it from the main product surface.

4. Convert the experience to mobile-first:
   - Completed: the fake phone frame was removed.
   - Completed: the main app now renders as a centered mobile-first viewport.
   - Completed: simulator and schema tools live in a separate developer drawer.

5. Add PWA support:
   - Add app manifest.
   - Add icons.
   - Add service worker or Vite PWA support.
   - Verify installability on iOS Safari and Android Chrome.

6. Introduce a storage adapter:
   - Create a local data adapter around the existing localStorage behavior.
   - Keep UI components independent from the storage backend.
   - Later swap or extend the adapter with Supabase.

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

## Immediate Next Task

Next recommended task: add PWA install support so the mobile-first web app can be saved to iOS and Android home screens.
