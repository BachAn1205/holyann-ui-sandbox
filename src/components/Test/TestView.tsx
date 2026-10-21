import React, {useState} from 'react';
import {RotateCcw, ChevronLeft, ChevronRight, Check, List, X} from 'lucide-react';
import {Question, TestType} from '../types';
import {TEST_DESCRIPTIONS} from '@/constants';

interface TestViewProps {
    testType: TestType;
    questions: Question[];
    onBack: () => void;
    onComplete: (answers: Record<number, string | number | boolean>) => void;
}

const ProgressBar: React.FC<{ current: number; total: number }> = ({ current, total }) => {
  const percentage = Math.round(((current + 1) / total) * 100);
  return (
    <div className="w-full bg-muted/80 rounded-full h-2.5 mb-6 overflow-hidden">
      <div
        className="h-2.5 rounded-full transition-all duration-300 ease-out bg-gradient-to-r from-violet-500 to-primary"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

const TestView: React.FC<TestViewProps> = ({testType, questions, onBack, onComplete}) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string | number | boolean>>({});
    const [showQuestionList, setShowQuestionList] = useState(false);

    const handleAnswer = (value: string | number | boolean) => {
        const question = questions[currentQuestionIndex];
        const newAnswers = {...answers, [question.id]: value};
        setAnswers(newAnswers);
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleComplete = () => {
        // Check if all questions are answered
        const unansweredCount = questions.filter(q => answers[q.id] === undefined).length;
        if (unansweredCount > 0) {
            const confirm = window.confirm(
                `Bạn còn ${unansweredCount} câu chưa trả lời. Bạn có chắc muốn nộp bài không?`
            );
            if (!confirm) return;
        }
        onComplete(answers);
    };

    const handleJumpToQuestion = (index: number) => {
        setCurrentQuestionIndex(index);
        setShowQuestionList(false);
    };

    const getAnswerDisplay = (questionId: number) => {
        const answer = answers[questionId];
        if (answer === undefined) return null;

        // Format answer based on test type
        if (testType === 'MBTI') {
            return answer; // -3 to 3
        } else if (testType === 'RIASEC' || testType === 'GRIT') {
            return answer; // 1 to 5
        }
        return answer;
    };

    const question = questions[currentQuestionIndex];
    const currentAnswer = answers[question?.id];
    const isLastQuestion = currentQuestionIndex === questions.length - 1;
    const answeredCount = Object.keys(answers).length;

    if (!question) return null;

    return (
        <div className="max-w-7xl mx-auto pt-6 px-4">
            <div className="flex gap-6">
                {/* Question List Panel */}
                <div
                    className={`
                    fixed lg:sticky top-0 left-0 h-screen lg:h-auto z-50 lg:z-auto
                    w-80 lg:w-72 shrink-0
                    rounded-2xl border border-border bg-card shadow-lg overflow-hidden
                    transition-transform duration-300 ease-in-out
                    ${showQuestionList ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    `}
                >
                    <div className="p-4 border-b border-border bg-gradient-to-r from-violet-500/10 to-primary/5">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-foreground flex items-center gap-2">
                                <List size={20} className="text-primary" />
                                Danh sách câu hỏi
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowQuestionList(false)}
                                className="lg:hidden p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                            <span className="text-primary font-semibold">✓ {answeredCount}</span>
                            {' / '}
                            <span>{questions.length} câu</span>
                        </div>
                    </div>

                    <div className="overflow-y-auto h-[calc(100vh-120px)] lg:h-[600px] p-4">
                        <div className="grid grid-cols-5 gap-2">
                            {questions.map((q, index) => {
                                const isAnswered = answers[q.id] !== undefined;
                                const isCurrent = index === currentQuestionIndex;
                                const answerValue = getAnswerDisplay(q.id);
                                return (
                                    <button
                                        key={q.id}
                                        type="button"
                                        onClick={() => handleJumpToQuestion(index)}
                                        className={`
                                            relative aspect-square rounded-xl font-semibold text-sm transition-all duration-200
                                            ${isCurrent
                                                ? 'bg-primary text-primary-foreground ring-2 ring-primary/40 scale-105 shadow-md'
                                                : isAnswered
                                                    ? 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20'
                                                    : 'bg-muted/50 text-muted-foreground border border-border/60 hover:bg-muted'
                                            }
                                        `}
                                        title={isAnswered ? `Câu ${index + 1}: Đã trả lời (${answerValue})` : `Câu ${index + 1}: Chưa trả lời`}
                                    >
                                        <span className="text-xs">{index + 1}</span>
                                        {isAnswered && !isCurrent && (
                                            <span className="text-[10px] mt-0.5 opacity-80 block">{answerValue}</span>
                                        )}
                                        {isCurrent && (
                                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary-foreground/80 rounded-full animate-pulse" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="flex-1 max-w-3xl">
                    <div className="flex items-center justify-between mb-6">
                        <button
                            type="button"
                            onClick={onBack}
                            className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm font-medium"
                        >
                            <RotateCcw size={16} /> Quay lại
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowQuestionList(true)}
                            className="lg:hidden flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                        >
                            <List size={20} />
                            Danh sách câu
                        </button>
                    </div>

                    <div className="rounded-2xl border border-border bg-card shadow-sm p-8 md:p-12">
                        <div className="flex justify-between items-center mb-4 text-sm text-muted-foreground font-medium">
                            <span>{TEST_DESCRIPTIONS[testType].title}</span>
                            <div className="flex items-center gap-4">
                                <span>Câu {currentQuestionIndex + 1} / {questions.length}</span>
                                <span className="text-primary font-medium">✓ {answeredCount} đã trả lời</span>
                            </div>
                        </div>

                        <ProgressBar current={currentQuestionIndex} total={questions.length} />

                        <h3 className="text-2xl font-bold text-foreground mb-8 leading-snug">
                            {question.text}
                        </h3>

                <div className="space-y-4">
                    {testType === 'MBTI' && (
                        <div className="space-y-6">
                            <div className="flex justify-between text-xs md:text-sm font-medium text-muted-foreground px-2">
                                <span>Rất không đồng ý</span>
                                <span>Trung lập</span>
                                <span className="text-right">Rất đồng ý</span>
                            </div>
                            <div className="flex justify-between gap-1 md:gap-2">
                                {[-3, -2, -1, 0, 1, 2, 3].map((val) => {
                                    const isSelected = currentAnswer === val;
                                    return (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => handleAnswer(val)}
                                            className={`w-full aspect-square md:aspect-auto md:h-14 rounded-xl border-2 transition-all duration-200 font-bold text-base md:text-lg
                                                ${isSelected ? 'scale-105 ring-2 ring-primary shadow-md' : 'hover:scale-[1.02]'}
                                                ${val < 0
                                                ? isSelected
                                                    ? 'bg-destructive text-destructive-foreground border-destructive'
                                                    : 'bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20'
                                                : val === 0
                                                    ? isSelected
                                                        ? 'bg-muted-foreground text-muted border-muted-foreground'
                                                        : 'bg-muted border-border text-muted-foreground hover:bg-muted/80'
                                                    : isSelected
                                                        ? 'bg-primary text-primary-foreground border-primary'
                                                        : 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
                                                }`}
                                        >
                                            {val}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground px-1">
                                <span>-3</span><span>-2</span><span>-1</span><span>0</span><span>1</span><span>2</span><span>3</span>
                            </div>
                        </div>
                    )}

                    {testType === 'RIASEC' && (
                        <div className="space-y-6">
                            <p className="text-center text-muted-foreground text-sm mb-4 font-medium">
                                Bạn thích làm công việc này ở mức độ nào?
                            </p>
                            <div className="flex justify-between text-xs md:text-sm font-medium text-muted-foreground px-2 mb-2">
                                <span>Rất không thích</span>
                                <span className="text-right">Rất thích</span>
                            </div>
                            <div className="flex justify-between gap-2">
                                {[1, 2, 3, 4, 5].map((val) => {
                                    const isSelected = currentAnswer === val;
                                    return (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => handleAnswer(val)}
                                            className={`w-full aspect-square md:aspect-auto md:h-16 rounded-xl border-2 transition-all duration-200 font-bold text-xl
                                                ${isSelected
                                                    ? 'bg-primary text-primary-foreground border-primary ring-2 ring-primary/40 scale-105 shadow-md'
                                                    : 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
                                                }`}
                                        >
                                            {val}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground px-1">
                                {['Rất không thích', 'Không thích', 'Trung lập', 'Thích', 'Rất thích'].map((label, idx) => (
                                    <span key={idx} className="text-center" style={{ width: '20%' }}>{label}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {testType === 'GRIT' && (
                        <div className="space-y-6">
                            <div className="flex justify-between text-xs md:text-sm font-medium text-muted-foreground px-2">
                                <span>Không giống tôi <br />chút nào</span>
                                <span className="text-right">Rất giống tôi</span>
                            </div>
                            <div className="flex justify-between gap-2">
                                {[1, 2, 3, 4, 5].map((val) => {
                                    const isSelected = currentAnswer === val;
                                    return (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => handleAnswer(val)}
                                            className={`w-full aspect-square md:aspect-auto md:h-14 rounded-xl border-2 transition-all font-bold text-lg
                                                ${isSelected
                                                    ? 'bg-primary text-primary-foreground border-primary ring-2 ring-primary/40 scale-105 shadow-md'
                                                    : 'bg-muted/50 border-border text-foreground hover:bg-primary/20 hover:border-primary/40 hover:text-primary'
                                                }`}
                                        >
                                            {val}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation Buttons */}
                <div className="mt-8 flex justify-between items-center gap-4">
                    <button
                        type="button"
                        onClick={handlePrevious}
                        disabled={currentQuestionIndex === 0}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all
                            ${currentQuestionIndex === 0
                                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                : 'bg-muted hover:bg-muted/80 text-foreground'
                            }`}
                    >
                        <ChevronLeft size={20} />
                        Câu trước
                    </button>

                    <div className="text-center">
                        {currentAnswer !== undefined ? (
                            <span className="text-primary text-sm font-medium flex items-center gap-1">
                                <Check size={16} />
                                Đã chọn đáp án
                            </span>
                        ) : (
                            <span className="text-muted-foreground text-sm font-medium">
                                Chưa chọn đáp án
                            </span>
                        )}
                    </div>

                    {isLastQuestion ? (
                        <button
                            type="button"
                            onClick={handleComplete}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
                        >
                            Nộp bài
                            <Check size={20} />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleNext}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
                        >
                            Câu sau
                            <ChevronRight size={20} />
                        </button>
                    )}
                </div>
                    </div>
                </div>
            </div>

            {showQuestionList && (
                <div
                    className="fixed inset-0 z-40 lg:hidden bg-[var(--overlay)]"
                    onClick={() => setShowQuestionList(false)}
                    aria-hidden
                />
            )}
        </div>
    );
};

export default TestView;
