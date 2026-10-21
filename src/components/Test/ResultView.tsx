import React from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Briefcase, Brain, Activity } from 'lucide-react';
import { TestResult, TestType } from '../types';
import ResultChart from './ResultChart';
import { Card, CardContent } from '@/components/ui/card';

interface ResultViewProps {
    result: TestResult | null;
    onBackToDashboard: () => void;
    remainingTests?: TestType[];
    onStartNextTest?: (type: TestType) => void;
    allTestsCompleted?: boolean;
}

const ResultView: React.FC<ResultViewProps> = ({
                                                   result,
                                                   onBackToDashboard,
                                                   remainingTests = [],
                                                   onStartNextTest,
                                                   allTestsCompleted = false,
                                               }) => {
    if (!result) return null;

    const getTestIcon = (type: TestType) => {
        switch (type) {
            case 'MBTI':
                return <Brain className="w-5 h-5"/>;
            case 'GRIT':
                return <Activity className="w-5 h-5"/>;
            case 'RIASEC':
                return <Briefcase className="w-5 h-5"/>;
        }
    };

    const getTestColor = (type: TestType) => {
        switch (type) {
            case 'MBTI':
                return 'bg-blue-500 hover:bg-blue-600';
            case 'GRIT':
                return 'bg-purple-500 hover:bg-purple-600';
            case 'RIASEC':
                return 'bg-emerald-500 hover:bg-emerald-600';
        }
    };

    return (
        <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <button
                type="button"
                onClick={onBackToDashboard}
                className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm font-medium transition-colors rounded-lg px-2 py-1 -ml-2 hover:bg-muted/50"
            >
                <RotateCcw size={16} /> Quay về danh sách bài test
            </button>

            <Card className="rounded-2xl border border-border shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    <ResultChart result={result} />
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default ResultView;