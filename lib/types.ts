export type MCQOption = {
  id: string;
  text: string;
};

export type MCQQuestion = {
  id: string;
  question: string;
  options: MCQOption[];
  correctOptionId: string;
  explanation?: string;
};

export type LectureQuiz = {
  id: string;
  title: string;
  topic: string;
  durationSeconds: number;
  questions: MCQQuestion[];
};
