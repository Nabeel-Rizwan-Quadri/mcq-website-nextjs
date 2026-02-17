#!/usr/bin/env python3
"""
Generate MCQ JSON from extracted lecture text.

This script intentionally keeps generation separate from the Next.js app.
It creates a compatible JSON structure at `data/lectures.generated.json`.
"""

from __future__ import annotations

import argparse
import json
import random
import re
from pathlib import Path

OPTION_IDS = ("a", "b", "c", "d")


def normalize_line(text: str) -> str:
    text = re.sub(r"^\s*[-*0-9.()]+\s*", "", text.strip())
    text = re.sub(r"\s+", " ", text)
    if text.lower().startswith(("slide ", "page ")) and ":" in text:
        text = text.split(":", 1)[1].strip()
    return text


def split_candidates(text: str) -> list[str]:
    chunks = re.split(r"(?<=[.!?])\s+|\n+", text)
    unique: list[str] = []
    seen: set[str] = set()

    for chunk in chunks:
        line = normalize_line(chunk)
        if len(line) < 35 or len(line) > 240:
            continue
        key = line.lower()
        if key in seen:
            continue
        seen.add(key)
        unique.append(line)

    return unique


def build_question(
    lecture_id: str,
    lecture_title: str,
    question_index: int,
    correct_statement: str,
    distractor_pool: list[str],
) -> dict[str, object]:
    rng = random.Random(f"{lecture_id}:{question_index}")
    rng.shuffle(distractor_pool)

    options_text = [correct_statement]
    for item in distractor_pool:
        if item != correct_statement:
            options_text.append(item)
        if len(options_text) == 4:
            break

    filler_index = 1
    while len(options_text) < 4:
        filler = f"This statement does not match a major point in {lecture_title} ({filler_index})."
        options_text.append(filler)
        filler_index += 1

    rng.shuffle(options_text)

    options = []
    correct_option_id = ""
    for idx, option_text in enumerate(options_text):
        option_id = OPTION_IDS[idx]
        options.append({"id": option_id, "text": option_text})
        if option_text == correct_statement and not correct_option_id:
            correct_option_id = option_id

    return {
        "id": f"{lecture_id}-q{question_index + 1}",
        "question": f"In {lecture_title}, which statement is correct?",
        "options": options,
        "correctOptionId": correct_option_id,
        "explanation": "This question was generated from extracted lecture text and may need manual review.",
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate MCQs from extracted lecture text.")
    parser.add_argument("--input", default="data/lecture_texts.json", help="Path to extracted lecture text JSON")
    parser.add_argument("--output", default="data/lectures.generated.json", help="Path to generated lecture MCQ JSON")
    parser.add_argument("--questions-per-lecture", type=int, default=10, help="Maximum questions generated per lecture")
    parser.add_argument("--seconds-per-question", type=int, default=60, help="Default timer weight per question")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    input_path = Path(args.input)
    output_path = Path(args.output)

    if not input_path.exists():
        print(f"Input file not found: {input_path}")
        return 1

    raw_data = json.loads(input_path.read_text(encoding="utf-8"))

    if not isinstance(raw_data, list):
        print("Invalid input: expected a list of lecture text records.")
        return 1

    output_lectures = []
    generated_questions = 0

    for lecture in raw_data:
        lecture_id = lecture.get("id", "lecture")
        lecture_title = lecture.get("title", lecture_id)
        lecture_text = lecture.get("text", "")

        candidates = split_candidates(lecture_text)
        if len(candidates) < 2:
            print(f"Skipped {lecture_title}: not enough text candidates.")
            continue

        target_count = min(args.questions_per_lecture, max(1, len(candidates)))
        questions = []

        for index in range(target_count):
            correct_statement = candidates[index % len(candidates)]
            distractor_pool = [item for item in candidates if item != correct_statement]
            question = build_question(lecture_id, lecture_title, index, correct_statement, distractor_pool)
            questions.append(question)

        generated_questions += len(questions)
        output_lectures.append(
            {
                "id": lecture_id,
                "title": lecture_title,
                "topic": f"Auto-generated from {lecture.get('sourceFile', 'lecture input')}",
                "durationSeconds": max(300, len(questions) * args.seconds_per_question),
                "questions": questions,
            }
        )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(output_lectures, indent=2), encoding="utf-8")

    print(f"Generated {generated_questions} question(s) across {len(output_lectures)} lecture(s).")
    print(f"Output written to: {output_path}")
    print("Review generated MCQs before using them in production.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
