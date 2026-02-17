# Lecture MCQ Hub (Next.js)

Simple MCQ website for showing and evaluating pre-made lecture MCQs.

## Website Features

- Lecture dropdown selector
- Previous/next lecture navigation
- Question navigator and option selection
- Quiz timer with auto-submit when time ends
- Submit and score view
- Detailed review:
  - your answer
  - correct answer
  - explanation

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
