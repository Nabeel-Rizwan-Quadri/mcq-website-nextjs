# Project Plan

## Goal
Maintain a simple Next.js MCQ website that consumes externally prepared MCQ JSON data and preserves quiz continuity safely.

## Current Status

### Web App (Completed)

1. Next.js app with TypeScript and App Router.
2. Typed lecture/MCQ schema in `lib/types.ts`.
3. Quiz UI with lecture selection, navigation, timer, scoring, and review.
4. Theme mode toggle (dark/light) with localStorage persistence.
5. Quiz state persistence in localStorage (`mcq-hub-quiz-state-v1`) with safe hydration on mount.
6. Persisted state sanitization and numeric clamping to protect against stale/invalid snapshots.
7. Progress-loss guards:
   - confirmation before switching sets when current set has progress
   - confirmation before restarting a set
8. Responsive styling and working build/lint setup.
9. Next route types reference aligned in `next-env.d.ts` (`.next/types/routes.d.ts`).

### Data Input Model (Completed)

1. App reads pre-generated MCQ JSON from `data/`.
2. Load priority:
   - `data/lectures.generated.json`
   - fallback: `data/lectures.json`
3. Data contract documented in `data structure.md`.

## Out of Scope (Intentional)

1. Lecture-to-MCQ conversion scripts inside this repository.
2. PDF/PPT/text extraction and in-repo MCQ generation pipeline.

## Next Improvements (Recommended)

1. Add runtime schema validation for loaded JSON before app usage.
2. Add automated tests for persistence/hydration, timer auto-submit, and confirmation flows.
3. Add a lightweight data lint command to validate external MCQ files against the required schema.
4. Add an in-app "clear saved progress" action for troubleshooting or manual reset.
