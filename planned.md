# Project Plan

## Goal
Build a simple Next.js MCQ website that uses pre-generated lecture MCQs, and keep lecture-to-MCQ generation as a separate workflow.

## Track 1: Website (Next.js)
1. Scaffold a Next.js app with TypeScript and App Router.
2. Define a static JSON data format for lectures and MCQs.
3. Build UI features:
- Lecture selector (dropdown).
- Question navigation (next/previous and jump).
- Option selection per question.
- Countdown timer for quiz session.
- Submit quiz button.
4. Implement scoring and results view:
- Total score and percentage.
- Correct vs wrong count.
- Per-question review showing selected answer and correct answer.
5. Add basic responsive styling so it works on desktop/mobile.
6. Add sample MCQ JSON so the app runs immediately.

## Track 2: Lecture -> MCQ Pipeline (Separate from website)
1. Keep raw lecture files inside `lectures/`.
2. Create scripts under `scripts/` for processing:
- `extract-lectures` to read PPT/PDF and convert to clean text chunks.
- `generate-mcqs` to convert chunks into structured MCQ JSON.
3. Output MCQ files into `data/` using the same schema as the website.
4. Document how to run these scripts and then use the generated JSON in the app.

## Deliverables in this run
- Working Next.js MCQ site with timer, scoring, and review.
- JSON-based lecture/MCQ data model with examples.
- Separate script entry points/placeholders for lecture extraction and MCQ generation.
- README instructions for running website and generation workflow separately.
