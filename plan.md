# Project Plan

## Goal
Maintain a simple Next.js MCQ website that consumes externally prepared MCQ JSON data and preserves quiz continuity safely.

## Current Status

### Web App (Completed)

1. Next.js app with TypeScript and App Router.
2. Typed lecture/MCQ schema in `lib/types.ts`.
3. Quiz UI with lecture selection, collapsible top controls, question navigation, timer, scoring, and review.
4. Per-question `Check Answer` feedback and flag-for-review flow.
5. Keyboard shortcuts (`ArrowLeft`/`ArrowRight`) for previous/next question navigation.
6. Time management UX: auto-submit at timeout, plus one-time `+5 min` and `+10 min` boosts.
7. Results statistics panel with answer-key distribution and user-choice distribution.
8. Custom in-app confirmation modal (replacing native browser confirm).
9. Progress-loss guards:
   - confirmation before switching sets when current set has progress
   - confirmation before submitting with unanswered questions
   - confirmation before restarting a set
10. Theme mode toggle (dark/light) with localStorage persistence.
11. App version display sourced from `package.json`.
12. Quiz state persistence in localStorage (`mcq-hub-quiz-state-v1`) with safe hydration on mount.
13. Persisted state sanitization and numeric clamping to protect against stale/invalid snapshots.
14. Local git hook support for automatic patch-version bump on commit (`.githooks/pre-commit`).
15. Responsive styling and working build/lint setup.
16. Next route types reference aligned in `next-env.d.ts` (`.next/types/routes.d.ts`).
17. Sticky disclaimer banner in root layout for answer quality caution.
18. Welcome modal with `Do not show this again` persistence (`mcq-hub-hide-welcome-v1`).
19. In-app confetti celebration effect on welcome close and quiz submission.

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
2. Add automated tests for persistence/hydration, timer/boost behavior, keyboard shortcuts, and confirmation flows.
3. Add automated tests for welcome modal persistence and confetti trigger points.
4. Add a lightweight data lint command to validate external MCQ files against the required schema.
5. Add an in-app "clear saved progress" action for troubleshooting or manual reset.
