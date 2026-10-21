// filepath: d:\holyann-ai-web\src\hooks\useTestProgress.ts
'use client';

import {useState, useEffect, useCallback} from 'react';
import {TestType, TestResult} from '@/components/types';

export interface TestProgress {
    completedTests: TestType[];
    results: Partial<Record<TestType, TestResult>>;
    allCompleted: boolean;
}

export function useTestProgress(studentId?: string | null) {
    const [progress, setProgress] = useState<TestProgress>({
        completedTests: [],
        results: {},
        allCompleted: false
    });
    const [isLoaded, setIsLoaded] = useState(false);

    const loadProgressFromDB = useCallback(async () => {
        if (!studentId || studentId === 'undefined' || studentId === 'null' || studentId.trim() === '') {
            setIsLoaded(true);
            return;
        }
        try {
            const res = await fetch(`/api/tests/results?student_id=${studentId}`);
            const data = await res.json();
            if (!data.success) {
                console.error('Failed to load progress:', data.error);
                setIsLoaded(true);
                return;
            }
            const completedTests: TestType[] = [];
            const results: Partial<Record<TestType, TestResult>> = {};
            if (data.results?.mbti) {
                completedTests.push('MBTI');
                results['MBTI'] = {
                    type: 'MBTI',
                    scores: data.results.mbti.scores || {},
                    rawLabel: data.results.mbti.result_type,
                    description: data.results.mbti.result_description || '',
                    detailTestExplain: data.results.mbti.detail_test_explain || undefined,
                };
            }
            if (data.results?.riasec) {
                completedTests.push('RIASEC');
                results['RIASEC'] = {
                    type: 'RIASEC',
                    scores: data.results.riasec.scores || {},
                    rawLabel: data.results.riasec.result_code,
                    description: data.results.riasec.result_description || '',
                    detailTestExplain: data.results.riasec.detail_test_explain || undefined,
                };
            }
            if (data.results?.grit) {
                completedTests.push('GRIT');
                results['GRIT'] = {
                    type: 'GRIT',
                    scores: {
                        Grit: data.results.grit.total_score,
                        'Kiên trì': data.results.grit.perseverance_score,
                        'Đam mê': data.results.grit.passion_score
                    },
                    rawLabel: data.results.grit.level,
                    description: data.results.grit.description || '',
                    detailTestExplain: data.results.grit.detail_test_explain || undefined,
                };
            }
            setProgress({
                completedTests,
                results,
                allCompleted: data.progress?.all_completed || false
            });
        } catch (e) {
            console.error('Failed to load test progress from DB:', e);
        } finally {
            setIsLoaded(true);
        }
    }, [studentId]);

    useEffect(() => {
        loadProgressFromDB();
    }, [loadProgressFromDB]);

    const refreshProgress = useCallback(async () => {
        setIsLoaded(false);
        await loadProgressFromDB();
    }, [loadProgressFromDB]);

    const saveTestResult = useCallback((testType: TestType, result: TestResult) => {
        setProgress(prev => {
            const newCompletedTests = prev.completedTests.includes(testType)
                ? prev.completedTests
                : [...prev.completedTests, testType];

            const newResults = {
                ...prev.results,
                [testType]: result
            };

            return {
                completedTests: newCompletedTests,
                results: newResults,
                allCompleted: newCompletedTests.length >= 3
            };
        });

        // Note: Actual saving to DB is handled by the API calls in the page component
        // This hook now primarily serves as a client-side cache
    }, []);

    const isTestCompleted = useCallback((testType: TestType): boolean => {
        return progress.completedTests.includes(testType);
    }, [progress.completedTests]);

    const getTestResult = useCallback((testType: TestType): TestResult | undefined => {
        return progress.results[testType];
    }, [progress.results]);

    const getRemainingTests = useCallback((): TestType[] => {
        const allTests: TestType[] = ['MBTI', 'GRIT', 'RIASEC'];
        return allTests.filter(t => !progress.completedTests.includes(t));
    }, [progress.completedTests]);

    const getCompletedCount = useCallback((): number => {
        return progress.completedTests.length;
    }, [progress.completedTests]);

    const resetProgress = useCallback(async () => {
        // Reset local state immediately
        setProgress({
            completedTests: [],
            results: {},
            allCompleted: false
        });

        // Note: If you want to reset in DB, you'll need to add an API endpoint for that
        // For now, this just clears the client-side cache
    }, []);

    return {
        progress,
        isLoaded,
        saveTestResult,
        refreshProgress,
        isTestCompleted,
        getTestResult,
        getRemainingTests,
        getCompletedCount,
        resetProgress
    };
}

