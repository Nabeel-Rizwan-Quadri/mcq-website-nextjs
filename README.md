# Lecture MCQ Hub (Next.js)

Simple MCQ website for showing and evaluating pre-made lecture MCQs.

## Website Features

- Lecture set dropdown selector
- Previous/next set navigation
- Question navigator and option selection
- Per-question "Check Answer" feedback during attempt
- Quiz timer with auto-submit when time ends
- Submit and score view
- Detailed review:
  - your answer
  - correct answer
  - explanation
- Restart current set (with confirmation)
- Confirmation before switching sets when progress exists
- Theme toggle (dark/light), persisted in localStorage
- Quiz progress auto-save and resume across refreshes/reopens:
  - selected set
  - active question
  - selected answers
  - checked answers
  - submitted/auto-submitted status
  - remaining time

## Local Persistence Notes

- Quiz snapshot key: `mcq-hub-quiz-state-v1`
- Persisted values are sanitized against the current lecture/question/option structure before use.
- If quiz data changes significantly, stale persisted progress may be ignored and reset safely.

## Run the Website

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Provide MCQ Data (External Workflow)

This project does not convert lecture files to MCQs.
Prepare MCQ JSON externally, then place it in:

- `data/lectures.generated.json` (preferred by the app)
- fallback: `data/lectures.json`

For required schema and validation rules, see `data structure.md`.
