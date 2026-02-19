"use client";

import { useEffect, useMemo, useState } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import type { LectureQuiz, MCQQuestion } from "@/lib/types";

type QuizAppProps = {
  lectures: LectureQuiz[];
  appVersion: string;
};
type ThemeMode = "dark" | "light";
const QUIZ_STATE_STORAGE_KEY = "mcq-hub-quiz-state-v1";
const EXTRA_TIME_SECONDS_FIVE = 5 * 60;
const EXTRA_TIME_SECONDS_TEN = 10 * 60;

type PersistedQuizState = {
  selectedLectureId: string;
  activeQuestionIndex: number;
  answers: Record<string, string>;
  checkedAnswers: Record<string, boolean>;
  flaggedQuestions: Record<string, boolean>;
  submitted: boolean;
  autoSubmitted: boolean;
  timeLeft: number;
  timeBoostFiveUsed: boolean;
  timeBoostTenUsed: boolean;
  timeBoostUsed?: boolean;
};

type ConfirmationDialogState = {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  intent: "default" | "danger";
  onConfirm: () => void;
};

function formatTime(totalSeconds: number): string {
  const safeSeconds = Math.max(totalSeconds, 0);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function findOptionText(question: MCQQuestion, optionId: string | undefined): string {
  if (!optionId) {
    return "Not answered";
  }

  const found = question.options.find((option) => option.id === optionId);
  return found ? found.text : "Not answered";
}

function shouldIgnoreQuestionHotkeys(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

function sanitizeAnswers(lecture: LectureQuiz, candidate: unknown): Record<string, string> {
  if (!candidate || typeof candidate !== "object") {
    return {};
  }

  const answerRecord = candidate as Record<string, unknown>;
  const nextAnswers: Record<string, string> = {};

  for (const question of lecture.questions) {
    const answerId = answerRecord[question.id];
    if (typeof answerId !== "string") {
      continue;
    }

    const isValidOption = question.options.some((option) => option.id === answerId);
    if (isValidOption) {
      nextAnswers[question.id] = answerId;
    }
  }

  return nextAnswers;
}

function sanitizeCheckedAnswers(lecture: LectureQuiz, candidate: unknown): Record<string, boolean> {
  if (!candidate || typeof candidate !== "object") {
    return {};
  }

  const checkedRecord = candidate as Record<string, unknown>;
  const nextCheckedAnswers: Record<string, boolean> = {};

  for (const question of lecture.questions) {
    if (checkedRecord[question.id] === true) {
      nextCheckedAnswers[question.id] = true;
    }
  }

  return nextCheckedAnswers;
}

function sanitizeFlaggedQuestions(lecture: LectureQuiz, candidate: unknown): Record<string, boolean> {
  if (!candidate || typeof candidate !== "object") {
    return {};
  }

  const flaggedRecord = candidate as Record<string, unknown>;
  const nextFlaggedQuestions: Record<string, boolean> = {};

  for (const question of lecture.questions) {
    if (flaggedRecord[question.id] === true) {
      nextFlaggedQuestions[question.id] = true;
    }
  }

  return nextFlaggedQuestions;
}

export default function QuizApp({ lectures, appVersion }: QuizAppProps) {
  const [hasMounted, setHasMounted] = useState(false);
  const [hasHydratedQuizState, setHasHydratedQuizState] = useState(false);
  const [selectedLectureId, setSelectedLectureId] = useState(lectures[0]?.id ?? "");
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checkedAnswers, setCheckedAnswers] = useState<Record<string, boolean>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(lectures[0]?.durationSeconds ?? 0);
  const [timeBoostFiveUsed, setTimeBoostFiveUsed] = useState(false);
  const [timeBoostTenUsed, setTimeBoostTenUsed] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showHeaderDetails, setShowHeaderDetails] = useState(false);
  const [confirmationDialog, setConfirmationDialog] = useState<ConfirmationDialogState | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");

  const selectedLecture = useMemo(
    () => lectures.find((lecture) => lecture.id === selectedLectureId),
    [lectures, selectedLectureId],
  );

  const selectedLectureIndex = lectures.findIndex((lecture) => lecture.id === selectedLectureId);

  const currentQuestion = selectedLecture?.questions[activeQuestionIndex];
  const currentSelectedOptionId = currentQuestion ? answers[currentQuestion.id] : undefined;
  const currentAnswerChecked = currentQuestion ? Boolean(checkedAnswers[currentQuestion.id]) : false;
  const currentQuestionFlagged = currentQuestion ? Boolean(flaggedQuestions[currentQuestion.id]) : false;
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

  useEffect(() => {
    let nextState: PersistedQuizState = {
      selectedLectureId: "",
      activeQuestionIndex: 0,
      answers: {},
      checkedAnswers: {},
      flaggedQuestions: {},
      submitted: false,
      autoSubmitted: false,
      timeLeft: 0,
      timeBoostFiveUsed: false,
      timeBoostTenUsed: false,
    };

    if (lectures.length > 0) {
      const defaultLecture = lectures[0];
      nextState = {
        selectedLectureId: defaultLecture.id,
        activeQuestionIndex: 0,
        answers: {},
        checkedAnswers: {},
        flaggedQuestions: {},
        submitted: false,
        autoSubmitted: false,
        timeLeft: defaultLecture.durationSeconds,
        timeBoostFiveUsed: false,
        timeBoostTenUsed: false,
      };

      const persistedState = window.localStorage.getItem(QUIZ_STATE_STORAGE_KEY);
      if (persistedState) {
        try {
          const parsedState = JSON.parse(persistedState) as Partial<PersistedQuizState>;
          const lectureFromStorage =
            typeof parsedState.selectedLectureId === "string"
              ? lectures.find((lecture) => lecture.id === parsedState.selectedLectureId) ?? defaultLecture
              : defaultLecture;

          const maxQuestionIndex = Math.max(lectureFromStorage.questions.length - 1, 0);
          const activeQuestionIndex =
            typeof parsedState.activeQuestionIndex === "number"
              ? clamp(Math.floor(parsedState.activeQuestionIndex), 0, maxQuestionIndex)
              : 0;

          const submitted = parsedState.submitted === true;
          const autoSubmitted = submitted && parsedState.autoSubmitted === true;
          const legacyTimeBoostUsed = parsedState.timeBoostUsed === true;
          const timeBoostFiveUsed = parsedState.timeBoostFiveUsed === true || legacyTimeBoostUsed;
          const timeBoostTenUsed = parsedState.timeBoostTenUsed === true;
          const maxTimeLeft =
            lectureFromStorage.durationSeconds +
            (timeBoostFiveUsed ? EXTRA_TIME_SECONDS_FIVE : 0) +
            (timeBoostTenUsed ? EXTRA_TIME_SECONDS_TEN : 0);
          const timeLeft =
            typeof parsedState.timeLeft === "number"
              ? clamp(Math.floor(parsedState.timeLeft), 0, maxTimeLeft)
              : lectureFromStorage.durationSeconds;

          nextState = {
            selectedLectureId: lectureFromStorage.id,
            activeQuestionIndex,
            answers: sanitizeAnswers(lectureFromStorage, parsedState.answers),
            checkedAnswers: sanitizeCheckedAnswers(lectureFromStorage, parsedState.checkedAnswers),
            flaggedQuestions: sanitizeFlaggedQuestions(lectureFromStorage, parsedState.flaggedQuestions),
            submitted,
            autoSubmitted,
            timeLeft,
            timeBoostFiveUsed,
            timeBoostTenUsed,
          };
        } catch {
          window.localStorage.removeItem(QUIZ_STATE_STORAGE_KEY);
        }
      }
    }

    const frameId = window.requestAnimationFrame(() => {
      setSelectedLectureId(nextState.selectedLectureId);
      setActiveQuestionIndex(nextState.activeQuestionIndex);
      setAnswers(nextState.answers);
      setCheckedAnswers(nextState.checkedAnswers);
      setFlaggedQuestions(nextState.flaggedQuestions);
      setSubmitted(nextState.submitted);
      setAutoSubmitted(nextState.autoSubmitted);
      setTimeLeft(nextState.timeLeft);
      setTimeBoostFiveUsed(nextState.timeBoostFiveUsed);
      setTimeBoostTenUsed(nextState.timeBoostTenUsed);
      setHasHydratedQuizState(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [lectures]);

  useEffect(() => {
    if (!hasHydratedQuizState) {
      return;
    }

    if (!selectedLecture) {
      window.localStorage.removeItem(QUIZ_STATE_STORAGE_KEY);
      return;
    }

    const snapshot: PersistedQuizState = {
      selectedLectureId,
      activeQuestionIndex,
      answers,
      checkedAnswers,
      flaggedQuestions,
      submitted,
      autoSubmitted,
      timeLeft,
      timeBoostFiveUsed,
      timeBoostTenUsed,
    };

    window.localStorage.setItem(QUIZ_STATE_STORAGE_KEY, JSON.stringify(snapshot));
  }, [
    hasHydratedQuizState,
    selectedLecture,
    selectedLectureId,
    activeQuestionIndex,
    answers,
    checkedAnswers,
    flaggedQuestions,
    submitted,
    autoSubmitted,
    timeLeft,
    timeBoostFiveUsed,
    timeBoostTenUsed,
  ]);

  function resetQuizForLecture(lecture: LectureQuiz): void {
    setActiveQuestionIndex(0);
    setAnswers({});
    setCheckedAnswers({});
    setFlaggedQuestions({});
    setSubmitted(false);
    setAutoSubmitted(false);
    setTimeLeft(lecture.durationSeconds);
    setTimeBoostFiveUsed(false);
    setTimeBoostTenUsed(false);
    setShowStats(false);
  }

  function hasProgressInLecture(lecture: LectureQuiz): boolean {
    const hasAnswers = lecture.questions.some((question) => Boolean(answers[question.id]));
    const hasChecked = lecture.questions.some(
      (question) => Boolean(checkedAnswers[question.id]) && Boolean(answers[question.id]),
    );
    const hasFlags = lecture.questions.some((question) => Boolean(flaggedQuestions[question.id]));
    return hasAnswers || hasChecked || hasFlags;
  }

  function switchLecture(lectureId: string): void {
    const lecture = lectures.find((item) => item.id === lectureId);
    if (!lecture) {
      return;
    }

    if (lecture.id === selectedLectureId) {
      return;
    }

    const applyLectureSwitch = (): void => {
      setSelectedLectureId(lectureId);
      resetQuizForLecture(lecture);
    };

    if (selectedLecture && hasProgressInLecture(selectedLecture)) {
      setConfirmationDialog({
        title: "Switch set?",
        description: "Switching sets will discard your current progress for this set.",
        confirmLabel: "Switch Set",
        cancelLabel: "Stay Here",
        intent: "danger",
        onConfirm: applyLectureSwitch,
      });
      return;
    }

    applyLectureSwitch();
  }

  useEffect(() => {
    if (!hasHydratedQuizState || !selectedLecture || submitted) {
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
  }, [hasHydratedQuizState, selectedLecture, submitted]);

  const answeredCount = useMemo(() => {
    if (!selectedLecture) {
      return 0;
    }

    return selectedLecture.questions.filter((question) => answers[question.id]).length;
  }, [answers, selectedLecture]);

  const flaggedCount = useMemo(() => {
    if (!selectedLecture) {
      return 0;
    }

    return selectedLecture.questions.filter((question) => flaggedQuestions[question.id]).length;
  }, [flaggedQuestions, selectedLecture]);

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

  const optionStats = useMemo(() => {
    if (!selectedLecture) {
      return [];
    }

    const optionIdSet = new Set<string>();
    for (const question of selectedLecture.questions) {
      for (const option of question.options) {
        optionIdSet.add(option.id);
      }

      optionIdSet.add(question.correctOptionId);
      const selectedOptionId = answers[question.id];
      if (selectedOptionId) {
        optionIdSet.add(selectedOptionId);
      }
    }

    const orderedOptionIds = [...optionIdSet].sort((left, right) =>
      left.localeCompare(right, undefined, { sensitivity: "base" }),
    );

    return orderedOptionIds.map((optionId) => {
      let keyCorrectCount = 0;
      let userChosenCount = 0;

      for (const question of selectedLecture.questions) {
        if (question.correctOptionId === optionId) {
          keyCorrectCount += 1;
        }
        if (answers[question.id] === optionId) {
          userChosenCount += 1;
        }
      }

      return {
        optionId,
        keyCorrectCount,
        userChosenCount,
      };
    });
  }, [answers, selectedLecture]);

  const mostChosenStat = useMemo(() => {
    if (optionStats.length === 0) {
      return null;
    }

    const maxChosen = Math.max(...optionStats.map((item) => item.userChosenCount));
    if (maxChosen <= 0) {
      return null;
    }

    return {
      count: maxChosen,
      optionIds: optionStats.filter((item) => item.userChosenCount === maxChosen).map((item) => item.optionId),
    };
  }, [optionStats]);

  const timeChipClassName =
    timeLeft <= 60 ? "chip chip-time danger" : timeLeft <= 180 ? "chip chip-time warn" : "chip chip-time";

  function moveLecture(offset: number): void {
    const nextIndex = selectedLectureIndex + offset;
    if (nextIndex < 0 || nextIndex >= lectures.length) {
      return;
    }
    switchLecture(lectures[nextIndex].id);
  }

  function moveToPreviousQuestion(): void {
    setActiveQuestionIndex((previous) => Math.max(previous - 1, 0));
  }

  function moveToNextQuestion(): void {
    if (!selectedLecture) {
      return;
    }

    setActiveQuestionIndex((previous) => Math.min(previous + 1, selectedLecture.questions.length - 1));
  }

  function selectAnswer(questionId: string, optionId: string): void {
    if (submitted || checkedAnswers[questionId]) {
      return;
    }

    setAnswers((previous) => ({
      ...previous,
      [questionId]: optionId,
    }));
  }

  function checkCurrentAnswer(): void {
    if (!currentQuestion || submitted || currentAnswerChecked) {
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

  function toggleFlaggedQuestion(questionId: string): void {
    if (submitted) {
      return;
    }

    setFlaggedQuestions((previous) => {
      if (previous[questionId]) {
        const nextFlags = { ...previous };
        delete nextFlags[questionId];
        return nextFlags;
      }

      return {
        ...previous,
        [questionId]: true,
      };
    });
  }

  function submitQuiz(): void {
    if (!selectedLecture) {
      return;
    }

    const completeSubmission = (): void => {
      setSubmitted(true);
      setAutoSubmitted(false);
      setShowStats(false);
    };

    const unansweredCount = selectedLecture.questions.length - answeredCount;
    if (unansweredCount > 0) {
      setConfirmationDialog({
        title: "Submit quiz?",
        description: `You still have ${unansweredCount} unanswered question${unansweredCount === 1 ? "" : "s"}.`,
        confirmLabel: "Submit Anyway",
        cancelLabel: "Keep Answering",
        intent: "danger",
        onConfirm: completeSubmission,
      });
      return;
    }

    completeSubmission();
  }

  function addFiveMoreMinutes(): void {
    if (submitted || timeBoostFiveUsed) {
      return;
    }

    setTimeLeft((previous) => previous + EXTRA_TIME_SECONDS_FIVE);
    setTimeBoostFiveUsed(true);
  }

  function addTenMoreMinutes(): void {
    if (submitted || timeBoostTenUsed) {
      return;
    }

    setTimeLeft((previous) => previous + EXTRA_TIME_SECONDS_TEN);
    setTimeBoostTenUsed(true);
  }

  function restartCurrentLecture(): void {
    if (!selectedLecture) {
      return;
    }

    setConfirmationDialog({
      title: "Restart this set?",
      description: "All current progress for this set will be lost.",
      confirmLabel: "Restart Set",
      cancelLabel: "Cancel",
      intent: "danger",
      onConfirm: () => resetQuizForLecture(selectedLecture),
    });
  }

  function toggleThemeMode(): void {
    setThemeMode((previous) => (previous === "dark" ? "light" : "dark"));
  }

  function handleConfirmationOpenChange(open: boolean): void {
    if (!open) {
      setConfirmationDialog(null);
    }
  }

  function handleConfirmationAction(): void {
    if (!confirmationDialog) {
      return;
    }

    const action = confirmationDialog.onConfirm;
    setConfirmationDialog(null);
    action();
  }

  useEffect(() => {
    if (!selectedLecture || submitted) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.defaultPrevented) {
        return;
      }

      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }

      if (confirmationDialog) {
        return;
      }

      if (shouldIgnoreQuestionHotkeys(event.target)) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setActiveQuestionIndex((previous) => Math.max(previous - 1, 0));
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        setActiveQuestionIndex((previous) =>
          Math.min(previous + 1, selectedLecture.questions.length - 1),
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedLecture, submitted, confirmationDialog]);

  if (!hasMounted || !hasHydratedQuizState) {
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
          <p className="build-meta">Version v{appVersion}</p>
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
          <div className="hero-actions">
            <button className="btn btn-with-icon" onClick={() => setShowHeaderDetails((previous) => !previous)}>
              <span className="btn-icon" aria-hidden="true">
                {showHeaderDetails ? "\u25b2" : "\u25bc"}
              </span>
              {showHeaderDetails ? "Hide Controls" : "Show Controls"}
            </button>
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
        </div>
        <p className="build-meta">Version v{appVersion}</p>
        {showHeaderDetails ? (
          <>
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
                <button
                  className="btn btn-with-icon"
                  onClick={() => moveLecture(-1)}
                  disabled={selectedLectureIndex <= 0}
                >
                  <span className="btn-icon" aria-hidden="true">
                    {"\u2190"}
                  </span>
                  Previous Set
                </button>
                <button
                  className="btn btn-with-icon"
                  onClick={() => moveLecture(1)}
                  disabled={selectedLectureIndex >= lectures.length - 1}
                >
                  Next Set
                  <span className="btn-icon" aria-hidden="true">
                    {"\u2192"}
                  </span>
                </button>
                <button className="btn btn-danger btn-with-icon" onClick={restartCurrentLecture}>
                  <span className="btn-icon" aria-hidden="true">
                    {"\u21bb"}
                  </span>
                  Restart This Set
                </button>
              </div>
            </div>

            <p className="lecture-topic">{selectedLecture.topic}</p>
          </>
        ) : null}

        <div className={`status-row ${showHeaderDetails ? "" : "compact"}`}>
          <span className={timeChipClassName}>Time Left: {formatTime(timeLeft)}</span>
          <span className="chip">
            Answered: {answeredCount}/{selectedLecture.questions.length}
          </span>
          <span className="chip chip-flag">Flagged: {flaggedCount}</span>
          <span className="chip">{submitted ? "Submitted" : "In Progress"}</span>
          {showHeaderDetails ? (
            <>
              <button className="btn" onClick={addFiveMoreMinutes} disabled={submitted || timeBoostFiveUsed}>
                {timeBoostFiveUsed ? "Extra 5 Minutes Used" : "Add 5 More Minutes"}
              </button>
              <button className="btn" onClick={addTenMoreMinutes} disabled={submitted || timeBoostTenUsed}>
                {timeBoostTenUsed ? "Extra 10 Minutes Used" : "Add 10 More Minutes"}
              </button>
            </>
          ) : null}
        </div>
      </section>

      {!submitted ? (
        <section className="panel panel-quiz">
          <div className="quiz-main">
            <div className="question-head">
              <h2>
                Question {activeQuestionIndex + 1} / {selectedLecture.questions.length}
              </h2>
              {currentQuestionFlagged ? <span className="chip chip-flag">Flagged for review</span> : null}
            </div>

            <div className="question-grid">
              {selectedLecture.questions.map((question, index) => {
                const selectedOptionId = answers[question.id];
                const answerChecked = Boolean(checkedAnswers[question.id]);
                const answerIsCorrect = selectedOptionId === question.correctOptionId;
                const isFlagged = Boolean(flaggedQuestions[question.id]);
                const questionDotClassName = [
                  "question-dot",
                  index === activeQuestionIndex ? "current" : "",
                  isFlagged ? "flagged" : "",
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
                  <button
                    key={question.id}
                    className={questionDotClassName}
                    onClick={() => setActiveQuestionIndex(index)}
                    title={isFlagged ? "Flagged for review" : undefined}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            {currentQuestion && (
              <>
                <div className="question-title-row">
                  <h3 className="question-title">{currentQuestion.question}</h3>
                  <button
                    className={`btn btn-with-icon btn-question-flag ${currentQuestionFlagged ? "btn-flag-active" : "btn-flag"}`}
                    onClick={() => toggleFlaggedQuestion(currentQuestion.id)}
                    disabled={submitted}
                  >
                    <span className="btn-icon" aria-hidden="true">
                      {"\u2691"}
                    </span>
                    {currentQuestionFlagged ? "Unflag Question" : "Flag for Review"}
                  </button>
                </div>
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
                      <button
                        key={option.id}
                        className={optionClassName}
                        onClick={() => selectAnswer(currentQuestion.id, option.id)}
                        disabled={submitted || currentAnswerChecked}
                      >
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
          </div>

          <div className="row-actions">
            <button
              className="btn btn-with-icon btn-question-nav"
              onClick={moveToPreviousQuestion}
              disabled={activeQuestionIndex === 0}
            >
              <span className="btn-icon" aria-hidden="true">
                {"\u2190"}
              </span>
              Previous Question
            </button>
            <button
              className="btn btn-check"
              onClick={checkCurrentAnswer}
              disabled={!currentQuestion || !currentSelectedOptionId || currentAnswerChecked}
            >
              Check Answer
            </button>
            <button
              className="btn btn-question-nav btn-with-icon"
              onClick={moveToNextQuestion}
              disabled={activeQuestionIndex >= selectedLecture.questions.length - 1}
            >
              Next Question
              <span className="btn-icon" aria-hidden="true">
                {"\u2192"}
              </span>
            </button>
            <button className="btn btn-primary btn-submit btn-with-icon btn-right-start" onClick={submitQuiz}>
              <span className="btn-icon" aria-hidden="true">
                {"\u2713"}
              </span>
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
          <div className="result-actions">
            <button className="btn btn-danger btn-with-icon" onClick={restartCurrentLecture}>
              <span className="btn-icon" aria-hidden="true">
                {"\u21bb"}
              </span>
              Retake This Set
            </button>
            <button className="btn btn-with-icon" onClick={() => setShowStats((previous) => !previous)}>
              <span className="btn-icon" aria-hidden="true">
                {"\u2263"}
              </span>
              {showStats ? "Hide Stats" : "See Stats"}
            </button>
          </div>

          {showStats ? (
            <section className="stats-panel" aria-label="Set statistics">
              <h3>Set Statistics</h3>
              <p className="stats-meta">
                Answered by you: {answeredCount}/{selectedLecture.questions.length} | Unanswered:{" "}
                {selectedLecture.questions.length - answeredCount}
              </p>
              <p className="stats-meta">
                {mostChosenStat
                  ? `Most chosen by you: ${mostChosenStat.optionIds
                      .map((optionId) => optionId.toUpperCase())
                      .join(", ")} (${mostChosenStat.count} time${mostChosenStat.count === 1 ? "" : "s"}).`
                  : "Most chosen by you: No selections yet."}
              </p>
              <div className="stats-table-wrap">
                <table className="stats-table">
                  <thead>
                    <tr>
                      <th>Option</th>
                      <th>Correct In Answer Key</th>
                      <th>You Chose</th>
                    </tr>
                  </thead>
                  <tbody>
                    {optionStats.map((stat) => {
                      const isMostChosen = mostChosenStat ? stat.userChosenCount === mostChosenStat.count : false;
                      return (
                        <tr key={stat.optionId} className={isMostChosen ? "most-selected" : ""}>
                          <td>
                            <strong>{stat.optionId.toUpperCase()}</strong>
                          </td>
                          <td>{stat.keyCorrectCount}</td>
                          <td>{stat.userChosenCount}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          <div className="review-list">
            {selectedLecture.questions.map((question, index) => {
              const selectedOptionId = answers[question.id];
              const isCorrect = selectedOptionId === question.correctOptionId;
              const isFlagged = Boolean(flaggedQuestions[question.id]);
              return (
                <article key={question.id} className={`review-card ${isCorrect ? "correct" : "wrong"}`}>
                  <h3>
                    Q{index + 1}. {question.question}
                    {isFlagged ? <span className="flag-badge">Flagged</span> : null}
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
      <AlertDialog.Root open={Boolean(confirmationDialog)} onOpenChange={handleConfirmationOpenChange}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="confirm-overlay" />
          <AlertDialog.Content className="confirm-content">
            <AlertDialog.Title className="confirm-title">{confirmationDialog?.title}</AlertDialog.Title>
            <AlertDialog.Description className="confirm-description">
              {confirmationDialog?.description}
            </AlertDialog.Description>
            <div className="confirm-actions">
              <AlertDialog.Cancel asChild>
                <button className="btn">{confirmationDialog?.cancelLabel ?? "Cancel"}</button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  className={`btn ${
                    confirmationDialog?.intent === "danger" ? "btn-danger" : "btn-primary"
                  } btn-with-icon`}
                  onClick={handleConfirmationAction}
                >
                  <span className="btn-icon" aria-hidden="true">
                    {"\u2713"}
                  </span>
                  {confirmationDialog?.confirmLabel ?? "Confirm"}
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </main>
  );
}
