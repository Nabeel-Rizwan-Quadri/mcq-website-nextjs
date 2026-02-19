"use client";

import { useEffect, useMemo, useState } from "react";
import type { LectureQuiz, MCQQuestion } from "@/lib/types";

type QuizAppProps = {
  lectures: LectureQuiz[];
};
type ThemeMode = "dark" | "light";

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
  const [hasMounted, setHasMounted] = useState(false);
  const [selectedLectureId, setSelectedLectureId] = useState(lectures[0]?.id ?? "");
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checkedAnswers, setCheckedAnswers] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(lectures[0]?.durationSeconds ?? 0);
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");

  const selectedLecture = useMemo(
    () => lectures.find((lecture) => lecture.id === selectedLectureId),
    [lectures, selectedLectureId],
  );

  const selectedLectureIndex = lectures.findIndex((lecture) => lecture.id === selectedLectureId);

  const currentQuestion = selectedLecture?.questions[activeQuestionIndex];
  const currentSelectedOptionId = currentQuestion ? answers[currentQuestion.id] : undefined;
  const currentAnswerChecked = currentQuestion ? Boolean(checkedAnswers[currentQuestion.id]) : false;
  const currentAnswerIsCorrect =
    currentQuestion && currentSelectedOptionId
      ? currentSelectedOptionId === currentQuestion.correctOptionId
      : false;

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setHasMounted(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("theme-mode");
    if (storedTheme !== "light" && storedTheme !== "dark") {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setThemeMode(storedTheme);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeMode);
    window.localStorage.setItem("theme-mode", themeMode);
  }, [themeMode]);

  function switchLecture(lectureId: string): void {
    const lecture = lectures.find((item) => item.id === lectureId);
    if (!lecture) {
      return;
    }

    setSelectedLectureId(lectureId);
    setActiveQuestionIndex(0);
    setAnswers({});
    setCheckedAnswers({});
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
    setCheckedAnswers((previous) => {
      if (!previous[questionId]) {
        return previous;
      }

      const next = { ...previous };
      delete next[questionId];
      return next;
    });
  }

  function checkCurrentAnswer(): void {
    if (!currentQuestion || submitted) {
      return;
    }

    if (!answers[currentQuestion.id]) {
      return;
    }

    setCheckedAnswers((previous) => ({
      ...previous,
      [currentQuestion.id]: true,
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
    setCheckedAnswers({});
    setSubmitted(false);
    setAutoSubmitted(false);
    setActiveQuestionIndex(0);
    setTimeLeft(selectedLecture.durationSeconds);
  }

  function toggleThemeMode(): void {
    setThemeMode((previous) => (previous === "dark" ? "light" : "dark"));
  }

  if (!hasMounted) {
    return null;
  }

  if (!selectedLecture) {
    return (
      <main className="page-shell">
        <section className="panel">
          <div className="hero-header">
            <h1 className="hero-title">MCQ Hub</h1>
            <button
              className="theme-switch"
              role="switch"
              aria-checked={themeMode === "dark"}
              aria-label={`Switch to ${themeMode === "dark" ? "light" : "dark"} mode`}
              onClick={toggleThemeMode}
            >
              <span className="theme-switch-label">{themeMode === "dark" ? "Dark" : "Light"}</span>
              <span className={`theme-switch-track ${themeMode === "dark" ? "on" : ""}`}>
                <span className="theme-switch-thumb" />
              </span>
            </button>
          </div>
          <p className="hero-subtitle">No quiz data is available yet.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="panel">
        <div className="hero-header">
          <h1 className="hero-title">MCQ Hub</h1>
          <button
            className="theme-switch"
            role="switch"
            aria-checked={themeMode === "dark"}
            aria-label={`Switch to ${themeMode === "dark" ? "light" : "dark"} mode`}
            onClick={toggleThemeMode}
          >
            <span className="theme-switch-label">{themeMode === "dark" ? "Dark" : "Light"}</span>
            <span className={`theme-switch-track ${themeMode === "dark" ? "on" : ""}`}>
              <span className="theme-switch-thumb" />
            </span>
          </button>
        </div>
        <p className="hero-subtitle">Pick a set, answer all MCQs, and review exactly where you went right or wrong.</p>

        <div className="control-grid">
          <label className="control-label">
            <span>Choose Set</span>
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
              Previous Set
            </button>
            <button className="btn" onClick={() => moveLecture(1)} disabled={selectedLectureIndex >= lectures.length - 1}>
              Next Set
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
            {selectedLecture.questions.map((question, index) => {
              const selectedOptionId = answers[question.id];
              const answerChecked = Boolean(checkedAnswers[question.id]);
              const answerIsCorrect = selectedOptionId === question.correctOptionId;
              const questionDotClassName = [
                "question-dot",
                index === activeQuestionIndex ? "current" : "",
                selectedOptionId
                  ? answerChecked
                    ? answerIsCorrect
                      ? "checked-correct"
                      : "checked-wrong"
                    : "attempted"
                  : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <button key={question.id} className={questionDotClassName} onClick={() => setActiveQuestionIndex(index)}>
                  {index + 1}
                </button>
              );
            })}
          </div>

          {currentQuestion && (
            <>
              <h3 className="question-title">{currentQuestion.question}</h3>
              <div className="options">
                {currentQuestion.options.map((option) => {
                  const isSelected = currentSelectedOptionId === option.id;
                  const isCorrectOption = option.id === currentQuestion.correctOptionId;
                  const optionClassName = [
                    "option-btn",
                    isSelected ? "selected" : "",
                    currentAnswerChecked && isCorrectOption ? "correct" : "",
                    currentAnswerChecked && isSelected && !isCorrectOption ? "wrong" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <button key={option.id} className={optionClassName} onClick={() => selectAnswer(currentQuestion.id, option.id)}>
                      <strong>{option.id.toUpperCase()}.</strong>
                      {option.text}
                    </button>
                  );
                })}
              </div>
              {currentAnswerChecked ? (
                <div className={`answer-feedback ${currentAnswerIsCorrect ? "correct" : "wrong"}`}>
                  <p>
                    <strong>{currentAnswerIsCorrect ? "Correct." : "Incorrect."}</strong> Your answer:{" "}
                    {findOptionText(currentQuestion, currentSelectedOptionId)}
                  </p>
                  <p>
                    <strong>Correct answer:</strong> {findOptionText(currentQuestion, currentQuestion.correctOptionId)}
                  </p>
                  {currentQuestion.explanation ? (
                    <p>
                      <strong>Why:</strong> {currentQuestion.explanation}
                    </p>
                  ) : null}
                </div>
              ) : null}
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
            <button
              className="btn btn-check"
              onClick={checkCurrentAnswer}
              disabled={!currentQuestion || !currentSelectedOptionId}
            >
              Check Answer
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
            Retake This Set
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
                  <div className="options">
                    {question.options.map((option) => {
                      const isSelected = selectedOptionId === option.id;
                      const isCorrectOption = option.id === question.correctOptionId;
                      const optionClassName = [
                        "option-btn",
                        isSelected ? "selected" : "",
                        isCorrectOption ? "correct" : "",
                        isSelected && !isCorrectOption ? "wrong" : "",
                      ]
                        .filter(Boolean)
                        .join(" ");

                      return (
                        <div key={option.id} className={optionClassName}>
                          <strong>{option.id.toUpperCase()}.</strong>
                          {option.text}
                        </div>
                      );
                    })}
                  </div>
                  <div className={`answer-feedback ${isCorrect ? "correct" : "wrong"}`}>
                    <p>
                      <strong>{isCorrect ? "Correct." : "Incorrect."}</strong> Your answer:{" "}
                      {findOptionText(question, selectedOptionId)}
                    </p>
                    <p>
                      <strong>Correct answer:</strong> {findOptionText(question, question.correctOptionId)}
                    </p>
                    {question.explanation ? (
                      <p>
                        <strong>Why:</strong> {question.explanation}
                      </p>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
