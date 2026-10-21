import React from "react";
import { Sparkles } from "lucide-react";
import TestCard from "./TestCard";
import { TestType, TestResult } from "@/components/types";
import { TEST_DESCRIPTIONS } from "@/constants";

interface TestSelectionProps {
  onStartTest: (type: TestType) => void;
  onViewResult: (type: TestType) => void;
  onResetTest?: (type: TestType) => void;
  completedTests?: TestType[];
  testResults?: Partial<Record<TestType, TestResult>>;
}

const TestSelection: React.FC<TestSelectionProps> = ({
  onStartTest,
  onViewResult,
  onResetTest,
  completedTests = [],
  testResults = {},
}) => {
  const completedCount = completedTests.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 dark:text-yellow-400 flex-shrink-0" />
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: `linear-gradient(to right, #0052FF, #4D7CFF)`,
            }}
          >
            Khám phá bản thân
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Hoàn thành:{" "}
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {completedCount}/3
            </span>
          </span>
          {completedCount > 0 && (
            <div className="flex gap-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full ${i <= completedCount ? "bg-green-500 dark:bg-green-400" : "bg-gray-200 dark:bg-gray-700"}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-8">
        <TestCard
          title={TEST_DESCRIPTIONS.MBTI.title}
          description={TEST_DESCRIPTIONS.MBTI.desc}
          colorClass={TEST_DESCRIPTIONS.MBTI.color}
          iconType="MBTI"
          onClick={() => onStartTest("MBTI")}
          onViewResult={() => onViewResult("MBTI")}
          onReset={onResetTest ? () => onResetTest("MBTI") : undefined}
          isCompleted={completedTests.includes("MBTI")}
          result={testResults["MBTI"]}
        />
        <TestCard
          title={TEST_DESCRIPTIONS.GRIT.title}
          description={TEST_DESCRIPTIONS.GRIT.desc}
          colorClass={TEST_DESCRIPTIONS.GRIT.color}
          iconType="GRIT"
          onClick={() => onStartTest("GRIT")}
          onViewResult={() => onViewResult("GRIT")}
          onReset={onResetTest ? () => onResetTest("GRIT") : undefined}
          isCompleted={completedTests.includes("GRIT")}
          result={testResults["GRIT"]}
        />
        <TestCard
          title={TEST_DESCRIPTIONS.RIASEC.title}
          description={TEST_DESCRIPTIONS.RIASEC.desc}
          colorClass={TEST_DESCRIPTIONS.RIASEC.color}
          iconType="RIASEC"
          onClick={() => onStartTest("RIASEC")}
          onViewResult={() => onViewResult("RIASEC")}
          onReset={onResetTest ? () => onResetTest("RIASEC") : undefined}
          isCompleted={completedTests.includes("RIASEC")}
          result={testResults["RIASEC"]}
        />
      </div>
    </div>
  );
};

export default TestSelection;
