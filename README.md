# Lecture MCQ Hub (Next.js)

Simple MCQ website for showing and evaluating pre-made lecture MCQs.

## Website Features

- Collapsible top controls (`Show Controls` / `Hide Controls`) for reduced distraction while solving.
- Lecture set selector with previous/next set navigation.
- Per-set timer with auto-submit when time runs out.
- One-time time boosts per set: `Add 5 More Minutes` and `Add 10 More Minutes`.
- Question number navigator with attempted/correct/wrong/flag indicators.
- Option selection, flag-for-review, and per-question `Check Answer` feedback during attempt.
- Keyboard navigation with left/right arrow keys for previous/next question.
- Submit flow with unanswered-question warning.
- Results view with score summary, per-question detailed review, and optional stats panel (`See Stats`).
- Stats panel includes:
  - answer-key distribution by option (how many questions have each option as correct)
  - your selected-option distribution
  - most-chosen option(s)
- Modern in-app confirmation dialogs for:
  - switching set with unsaved progress
  - submitting with unanswered questions
  - restarting a set
- Theme toggle (dark/light), persisted in localStorage.
- App version display pulled directly from `package.json`.

## Local Persistence Notes

- Quiz snapshot key: `mcq-hub-quiz-state-v1`
- Theme preference key: `theme-mode`
- Persisted quiz values include:
  - selected set
  - active question index
  - selected answers
  - checked answers
  - flagged questions
  - submitted / auto-submitted status
  - remaining time
  - one-time boost usage flags (`+5`, `+10`)
- Persisted values are sanitized against the current lecture/question/option structure before use.
- If quiz data changes significantly, stale persisted progress may be ignored/reset safely.

## Run the Website

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Versioning

- The app now shows the current version directly from `package.json` in the UI.
- Commit-time version bump automation is available via a git hook.

### Enable auto version bump on commit

Run once in this repo:

```bash
npm run hooks:install
```

After this, every commit automatically bumps patch version and stages:

- `package.json`
- `package-lock.json`

Manual bump (if needed):

```bash
npm run version:bump:patch
```

## Provide MCQ Data (External Workflow)

This project does not convert lecture files to MCQs.
Prepare MCQ JSON externally, then place it in:

- `data/lectures.generated.json` (preferred by the app)
- fallback: `data/lectures.json`

For required schema and validation rules, see `data structure.md`.
