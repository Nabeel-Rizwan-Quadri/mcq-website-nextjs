# Project Plan

## Goal
Maintain a simple Next.js MCQ website that consumes externally prepared MCQ JSON data.

## Current Status

### Web App (Completed)

1. Next.js app with TypeScript and App Router.
2. Typed lecture/MCQ schema in `lib/types.ts`.
3. Quiz UI with lecture selection, navigation, timer, scoring, and review.
4. Responsive styling and working build/lint setup.

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
2. Add automated tests for timer, submission, and scoring flows.
3. Add a lightweight data lint command to validate external MCQ files against the required schema.
