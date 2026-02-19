# Architecture

## 1. System Overview

The project has one runtime responsibility:

1. Web App (Next.js)
- Loads MCQ JSON data from local files in `data/`.
- Renders quiz UI, timer, scoring, and answer review.
- Persists quiz snapshot and theme preference in browser localStorage.

MCQ generation is out of scope for this repository.
Data is expected to be prepared by an external process and dropped into the expected JSON file(s).

## 2. Directory-Level Architecture

- `app/`
  - `app/page.tsx`: server component that reads quiz data JSON.
  - `app/layout.tsx`: root layout, metadata, and font setup.
  - `app/globals.css`: global styles.
- `components/`
  - `components/QuizApp.tsx`: client-side quiz logic and UI.
- `lib/`
  - `lib/types.ts`: TypeScript types for lecture quiz data.
- `data/`
  - `data/lectures.generated.json`: preferred dataset.
  - `data/lectures.json`: fallback dataset.
- Root typing artifact:
  - `next-env.d.ts`: Next type references (including route types from `.next/types/routes.d.ts`).

## 3. Runtime Data Flow

1. `app/page.tsx` checks JSON files in order:
   - `data/lectures.generated.json`
   - `data/lectures.json`
2. It uses the first non-empty valid array.
3. Data is passed into `components/QuizApp.tsx`.
4. On mount, `QuizApp` hydrates:
   - theme mode from `theme-mode`
   - quiz snapshot from `mcq-hub-quiz-state-v1`
5. Hydrated quiz snapshot is sanitized against the current lecture/question/option graph and numeric values are clamped.
6. After hydration, quiz state changes are re-persisted continuously.
7. Timer, submission, scoring, navigation, and review run on top of hydrated in-memory state.

## 4. Data Contract

Required JSON structure is documented in:

- `data structure.md`

External MCQ producers should target that format exactly.
Stable IDs are important for smooth resume behavior.

## 5. External Integration Boundary

1. External service/script/tool generates MCQ JSON.
2. Output is copied to `data/lectures.generated.json`.
3. App is run (`npm run dev`) or rebuilt/redeployed for production.

## 6. Build Notes

- Current build pre-renders `/` as static.
- If quiz content changes in production, deployment should include refreshing JSON and rebuilding/redeploying.
- Next route type references are expected at `.next/types/routes.d.ts` in `next-env.d.ts`.

## 7. Current Constraints

1. No runtime schema validation before casting loaded JSON to app types.
2. No automated tests yet for persistence/hydration and confirmation flows.
