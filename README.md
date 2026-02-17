# Lecture MCQ Hub (Next.js)

Simple MCQ website with two clearly separated tracks:

1. Website track: show and evaluate pre-made MCQs.
2. Pipeline track: extract lecture text and generate MCQ JSON from files in `lectures/`.

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

Data loading order:
- `data/lectures.generated.json` (if present and non-empty)
- fallback: `data/lectures.json`

## Lecture -> MCQ Pipeline (Separate)

Put lecture files into `lectures/`.

Supported input formats:
- `.pptx`
- `.pdf`
- `.txt`
- `.md`

Install Python dependencies:

```bash
pip install -r scripts/requirements.txt
```

Extract lecture text:

```bash
npm run extract
```

This writes `data/lecture_texts.json`.

Generate MCQs:

```bash
npm run generate
```

This writes `data/lectures.generated.json` (same schema expected by the website).
The website automatically uses this file when available.

## Data Schema Used by the App

Each lecture entry:

```json
{
  "id": "lecture-id",
  "title": "Lecture Title",
  "topic": "Short description",
  "durationSeconds": 600,
  "questions": [
    {
      "id": "lecture-id-q1",
      "question": "Question text",
      "options": [
        { "id": "a", "text": "Option A" },
        { "id": "b", "text": "Option B" },
        { "id": "c", "text": "Option C" },
        { "id": "d", "text": "Option D" }
      ],
      "correctOptionId": "b",
      "explanation": "Reason the answer is correct"
    }
  ]
}
```
