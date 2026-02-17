"use client";

import { useEffect, useMemo, useState } from "react";
import type { LectureQuiz, MCQQuestion } from "@/lib/types";

type QuizAppProps = {
  lectures: LectureQuiz[];
};

function formatTime(totalSeconds: number): string {
  const safeSeconds = Math.max(totalSeconds, 0);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function findOptionText(question: MCQQuestion, optionId: string | undefined): string {
  if (!optionId) {
    return "Not answered";
  }

  const found = question.options.find((option) => option.id === optionId);
  return found ? found.text : "Not answered";
}

export default function QuizApp({ lectures }: QuizAppProps) {
  const [selectedLectureId, setSelectedLectureId] = useState(lectures[0]?.id ?? "");
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(lectures[0]?.durationSeconds ?? 0);

  const selectedLecture = useMemo(
    () => lectures.find((lecture) => lecture.id === selectedLectureId),
    [lectures, selectedLectureId],
  );

  const selectedLectureIndex = lectures.findIndex((lecture) => lecture.id === selectedLectureId);

  const currentQuestion = selectedLecture?.questions[activeQuestionIndex];

  function switchLecture(lectureId: string): void {
    const lecture = lectures.find((item) => item.id === lectureId);
    if (!lecture) {
      return;
    }

    setSelectedLectureId(lectureId);
    setActiveQuestionIndex(0);
    setAnswers({});
    setSubmitted(false);
    setAutoSubmitted(false);
    setTimeLeft(lecture.durationSeconds);
  }

  useEffect(() => {
    if (!selectedLecture || submitted) {
      return;
    }

    const timerId = window.setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          setAutoSubmitted(true);
          setSubmitted(true);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [selectedLecture, submitted]);

  const answeredCount = useMemo(() => {
    if (!selectedLecture) {
      return 0;
    }

    return selectedLecture.questions.filter((question) => answers[question.id]).length;
  }, [answers, selectedLecture]);

  const score = useMemo(() => {
    if (!selectedLecture) {
      return { correct: 0, total: 0 };
    }

    const correct = selectedLecture.questions.reduce((count, question) => {
      if (answers[question.id] === question.correctOptionId) {
        return count + 1;
      }
      return count;
    }, 0);

    return {
      correct,
      total: selectedLecture.questions.length,
    };
  }, [answers, selectedLecture]);

  const percentage = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  const timeChipClassName =
    timeLeft <= 60 ? "chip chip-time danger" : timeLeft <= 180 ? "chip chip-time warn" : "chip chip-time";

  function moveLecture(offset: number): void {
    const nextIndex = selectedLectureIndex + offset;
    if (nextIndex < 0 || nextIndex >= lectures.length) {
      return;
    }
    switchLecture(lectures[nextIndex].id);
  }

  function selectAnswer(questionId: string, optionId: string): void {
    if (submitted) {
      return;
    }

    setAnswers((previous) => ({
      ...previous,
      [questionId]: optionId,
    }));
  }

  function submitQuiz(): void {
    setSubmitted(true);
    setAutoSubmitted(false);
  }

  function retakeLecture(): void {
    if (!selectedLecture) {
      return;
    }

    setAnswers({});
    setSubmitted(false);
    setAutoSubmitted(false);
    setActiveQuestionIndex(0);
    setTimeLeft(selectedLecture.durationSeconds);
  }

  if (!selectedLecture) {
    return (
      <main className="page-shell">
        <section className="panel">
          <h1 className="hero-title">Lecture MCQ Hub</h1>
          <p className="hero-subtitle">No lecture data is available yet.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="panel">
        <h1 className="hero-title">Lecture MCQ Hub</h1>
        <p className="hero-subtitle">Pick a lecture, answer all MCQs, and review exactly where you went right or wrong.</p>

        <div className="control-grid">
          <label className="control-label">
            <span>Choose Lecture</span>
            <select
              className="lecture-select"
              value={selectedLectureId}
              onChange={(event) => switchLecture(event.target.value)}
            >
              {lectures.map((lecture) => (
                <option key={lecture.id} value={lecture.id}>
                  {lecture.title}
                </option>
              ))}
            </select>
          </label>

          <div className="lecture-switch">
            <button className="btn" onClick={() => moveLecture(-1)} disabled={selectedLectureIndex <= 0}>
              Previous Lecture
            </button>
            <button className="btn" onClick={() => moveLecture(1)} disabled={selectedLectureIndex >= lectures.length - 1}>
              Next Lecture
            </button>
          </div>
        </div>

        <p className="lecture-topic">{selectedLecture.topic}</p>

        <div className="status-row">
          <span className={timeChipClassName}>Time Left: {formatTime(timeLeft)}</span>
          <span className="chip">
            Answered: {answeredCount}/{selectedLecture.questions.length}
          </span>
          <span className="chip">{submitted ? "Submitted" : "In Progress"}</span>
        </div>
      </section>

      {!submitted ? (
        <section className="panel">
          <div className="question-head">
            <h2>
              Question {activeQuestionIndex + 1} / {selectedLecture.questions.length}
            </h2>
          </div>

          <div className="question-grid">
            {selectedLecture.questions.map((question, index) => (
              <button
                key={question.id}
                className={`question-dot ${index === activeQuestionIndex ? "current" : ""} ${answers[question.id] ? "answered" : ""}`}
                onClick={() => setActiveQuestionIndex(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {currentQuestion && (
            <>
              <h3 className="question-title">{currentQuestion.question}</h3>
              <div className="options">
                {currentQuestion.options.map((option) => (
                  <button
                    key={option.id}
                    className={`option-btn ${answers[currentQuestion.id] === option.id ? "selected" : ""}`}
                    onClick={() => selectAnswer(currentQuestion.id, option.id)}
                  >
                    <strong>{option.id.toUpperCase()}.</strong>
                    {option.text}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="row-actions">
            <button className="btn" onClick={() => setActiveQuestionIndex((prev) => Math.max(prev - 1, 0))} disabled={activeQuestionIndex === 0}>
              Previous Question
            </button>
            <button
              className="btn"
              onClick={() =>
                setActiveQuestionIndex((prev) => Math.min(prev + 1, selectedLecture.questions.length - 1))
              }
              disabled={activeQuestionIndex >= selectedLecture.questions.length - 1}
            >
              Next Question
            </button>
            <button className="btn btn-primary" onClick={submitQuiz}>
              Submit Quiz
            </button>
          </div>
        </section>
      ) : (
        <section className="panel">
          <h2>Results</h2>
          <div className="result-summary">
            <p className="score-line">
              {score.correct}/{score.total} ({percentage}%)
            </p>
            <p>
              Correct: {score.correct} | Wrong: {score.total - score.correct}
            </p>
            {autoSubmitted ? (
              <p className="autoflag">Time is up. The quiz was auto-submitted.</p>
            ) : null}
          </div>
          <button className="btn btn-primary" onClick={retakeLecture}>
            Retake This Lecture
          </button>

          <div className="review-list">
            {selectedLecture.questions.map((question, index) => {
              const selectedOptionId = answers[question.id];
              const isCorrect = selectedOptionId === question.correctOptionId;
              return (
                <article key={question.id} className={`review-card ${isCorrect ? "correct" : "wrong"}`}>
                  <h3>
                    Q{index + 1}. {question.question}
                  </h3>
                  <p>
                    <strong>Your answer:</strong> {findOptionText(question, selectedOptionId)}
                  </p>
                  <p>
                    <strong>Correct answer:</strong> {findOptionText(question, question.correctOptionId)}
                  </p>
                  {question.explanation ? (
                    <p>
                      <strong>Why:</strong> {question.explanation}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
