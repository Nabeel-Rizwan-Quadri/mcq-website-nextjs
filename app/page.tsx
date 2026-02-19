import { readFile } from "node:fs/promises";
import path from "node:path";
import QuizApp from "@/components/QuizApp";
import type { LectureQuiz } from "@/lib/types";
import packageJson from "@/package.json";

async function loadLectures(): Promise<LectureQuiz[]> {
  const candidateFiles = [
    path.join(process.cwd(), "data", "lectures.generated.json"),
    path.join(process.cwd(), "data", "lectures.json"),
  ];

  for (const filePath of candidateFiles) {
    try {
      const raw = await readFile(filePath, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as LectureQuiz[];
      }
    } catch {
      // Fall through to the next candidate file.
    }
  }

  return [];
}

export default async function Home() {
  const lectures = await loadLectures();
  return <QuizApp lectures={lectures} appVersion={packageJson.version} />;
}
