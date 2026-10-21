import React from "react";
import { motion } from "framer-motion";
import { ClipboardList } from "lucide-react";
import TestCard from "./TestCard";
import { TestType, TestResult } from "../types";
import { TEST_DESCRIPTIONS } from "@/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TestSelectionProps {
  onStartTest: (type: TestType) => void;
  onViewResult: (type: TestType) => void;
  completedTests?: TestType[];
  testResults?: Partial<Record<TestType, TestResult>>;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};
const itemVariant = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const TestSelection: React.FC<TestSelectionProps> = ({
  onStartTest,
  onViewResult,
  completedTests = [],
  testResults = {},
}) => {
  const completedCount = completedTests.length;

  return (
    <div className="space-y-8">
      <Card className="rounded-2xl border border-border shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border bg-gradient-to-r from-violet-500/10 via-primary/10 to-sky-500/10 px-6 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400 shadow-sm">
                <ClipboardList className="size-5 shrink-0" aria-hidden />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold m-0 leading-tight flex items-center gap-2">
                  Khám phá bản thân
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  MBTI, GRIT và Holland – chọn bài test để bắt đầu.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Hoàn thành:{" "}
                <span className="font-semibold text-primary">
                  {completedCount}/3
                </span>
              </span>
              {completedCount > 0 && (
                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`w-2.5 h-2.5 rounded-full ${i <= completedCount ? "bg-emerald-500" : "bg-muted"}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 sm:p-6">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            variants={container}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={itemVariant}>
              <TestCard
                title={TEST_DESCRIPTIONS.MBTI.title}
                description={TEST_DESCRIPTIONS.MBTI.desc}
                colorClass={TEST_DESCRIPTIONS.MBTI.color}
                iconType="MBTI"
                onClick={() => onStartTest("MBTI")}
                onViewResult={() => onViewResult("MBTI")}
                isCompleted={completedTests.includes("MBTI")}
                result={testResults["MBTI"]}
              />
            </motion.div>
            <motion.div variants={itemVariant}>
              <TestCard
                title={TEST_DESCRIPTIONS.GRIT.title}
                description={TEST_DESCRIPTIONS.GRIT.desc}
                colorClass={TEST_DESCRIPTIONS.GRIT.color}
                iconType="GRIT"
                onClick={() => onStartTest("GRIT")}
                onViewResult={() => onViewResult("GRIT")}
                isCompleted={completedTests.includes("GRIT")}
                result={testResults["GRIT"]}
              />
            </motion.div>
            <motion.div variants={itemVariant}>
              <TestCard
                title={TEST_DESCRIPTIONS.RIASEC.title}
                description={TEST_DESCRIPTIONS.RIASEC.desc}
                colorClass={TEST_DESCRIPTIONS.RIASEC.color}
                iconType="RIASEC"
                onClick={() => onStartTest("RIASEC")}
                onViewResult={() => onViewResult("RIASEC")}
                isCompleted={completedTests.includes("RIASEC")}
                result={testResults["RIASEC"]}
              />
            </motion.div>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestSelection;
