# Data Structure

This project expects MCQ data as JSON in this format.

## File Location

Use one of these files:

1. `data/lectures.generated.json` (preferred)
2. `data/lectures.json` (fallback)

The app tries `lectures.generated.json` first, then falls back to `lectures.json`.

## Root Shape

Top-level value must be an array of lecture objects:

```json
[
  {
    "id": "lecture-id",
    "title": "Lecture Title",
    "topic": "Short description",
    "durationSeconds": 600,
    "questions": []
  }
]
```

## Lecture Object

Required fields:

- `id` (string): unique lecture id.
- `title` (string): display title.
- `topic` (string): short subtitle/summary.
- `durationSeconds` (number): quiz duration for this lecture.
- `questions` (array): list of MCQ question objects.

Rules:

1. `id` should be unique across all lectures.
2. `durationSeconds` should be a positive integer.
3. `questions` can be empty, but non-empty is expected for actual quizzes.

## Question Object

Each entry in `questions` must be:

```json
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
  "explanation": "Why this option is correct"
}
```

Required fields:

- `id` (string): unique question id (globally unique recommended).
- `question` (string): question prompt.
- `options` (array): list of answer option objects.
- `correctOptionId` (string): id of the correct option.

Optional fields:

- `explanation` (string): shown in review mode.

Rules:

1. `options` should contain at least 2 options (4 recommended).
2. Every option `id` must be unique within the question.
3. `correctOptionId` must match one existing option id.
4. `question` and option texts should be non-empty strings.

## Option Object

Each option must be:

- `id` (string): short identifier (commonly `a`, `b`, `c`, `d`).
- `text` (string): option content shown to users.

## Complete Example

```json
[
  {
    "id": "os-basics",
    "title": "Lecture 1: Operating System Basics",
    "topic": "Processes, scheduling, and synchronization fundamentals.",
    "durationSeconds": 540,
    "questions": [
      {
        "id": "os-q1",
        "question": "What is the main role of an operating system?",
        "options": [
          { "id": "a", "text": "To compile high-level code into machine code" },
          { "id": "b", "text": "To manage hardware resources and provide services to applications" },
          { "id": "c", "text": "To replace all user applications" },
          { "id": "d", "text": "To encrypt internet traffic by default" }
        ],
        "correctOptionId": "b",
        "explanation": "The OS manages hardware and provides services to running applications."
      }
    ]
  }
]
```

## External Generation Checklist

1. Output valid JSON (UTF-8).
2. Ensure required fields exist for every lecture/question/option.
3. Ensure IDs are unique and references are valid.
4. Save to `data/lectures.generated.json`.
