'use client';

import React from 'react';
import { FileText } from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, RadarChart, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, BarChart, Bar,
    XAxis, YAxis, CartesianGrid
} from 'recharts';
import { TestResult } from '@/components/types';

interface ResultChartProps {
    result: TestResult;
}

const ResultChart: React.FC<ResultChartProps> = ({result}) => {
    // Debug log

    // --- Data Preparation Logic ---

    // 1. RIASEC Data
    const riasecData = result.type === 'RIASEC'
        ? Object.entries(result.scores).map(([key, value]) => ({subject: key, A: value, fullMark: 25}))
        : [];

    // 2. MBTI Data
    const mbtiChartData = result.type === 'MBTI' ? [
        {name: 'E/I', A: result.scores.E || 0, B: result.scores.I || 0, labelA: 'Extraversion (E)', labelB: 'Introversion (I)'},
        {name: 'S/N', A: result.scores.S || 0, B: result.scores.N || 0, labelA: 'Sensing (S)', labelB: 'Intuition (N)'},
        {name: 'T/F', A: result.scores.T || 0, B: result.scores.F || 0, labelA: 'Thinking (T)', labelB: 'Feeling (F)'},
        {name: 'J/P', A: result.scores.J || 0, B: result.scores.P || 0, labelA: 'Judging (J)', labelB: 'Perceiving (P)'},
    ] : [];

    // 3. Grit Data
    const gritScore = result.type === 'GRIT' ? result.scores.Grit : 0;
    const gritChartData = [
        {name: 'Score', value: gritScore},
        {name: 'Remaining', value: parseFloat((5 - gritScore).toFixed(2))}
    ];

    // Grit Breakdown Data (Passion vs Perseverance)
    // Note: result.scores uses Vietnamese keys from GRIT_COMPONENTS
    const gritBreakdownData = result.type === 'GRIT' ? [
        {name: 'Kiên trì', score: result.scores['Kiên trì'] || result.scores.Perseverance || 0, fill: 'var(--grit-perseverance)'},
        {name: 'Đam mê', score: result.scores['Đam mê'] || result.scores.Passion || 0, fill: 'var(--grit-consistency)'},
    ] : [];

    const GRIT_COLORS = ['var(--grit-strong)', 'var(--muted-light)']; // Purple and Gray

    const hasExplain = Boolean(result.detailTestExplain?.trim());
    const hasSummary = Boolean(result.description?.trim());

    return (
        <div
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center min-h-[400px]">
            <div className="self-start w-full border-b border-gray-100 pb-3 mb-6">
                <h3 className="text-lg font-bold text-gray-800 tracking-tight">
                    Biểu đồ phân tích
                </h3>
            </div>

            {/* --- RIASEC RADAR CHART --- */}
            {result.type === 'RIASEC' && (
                <div className="w-full space-y-6">
                    {/* RIASEC Code Result Card */}
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
                        <div className="text-center">
                            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Mã Holland của bạn
                            </p>
                            <h2 className="text-5xl font-black text-emerald-600 mb-3 tracking-tight">
                                {result.rawLabel}
                            </h2>
                            <div className="grid grid-cols-6 gap-2 max-w-2xl mx-auto">
                                {Object.entries(result.scores).map(([key, value]) => (
                                    <div key={key} className="bg-white rounded-lg p-3 shadow-sm">
                                        <p className="text-xs text-gray-500 font-medium mb-1">{key}</p>
                                        <p className="text-2xl font-bold text-emerald-600">
                                            {Math.round(value as number)}
                                        </p>
                                        <p className="text-xs text-gray-400">điểm</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Radar Chart */}
                    <div className="w-full h-[350px]">
                        <h4 className="text-sm font-semibold text-gray-600 mb-3 text-center">
                            Biểu đồ radar - Xu hướng nghề nghiệp
                        </h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={riasecData}>
                                <PolarGrid stroke="#E5E7EB"/>
                                <PolarAngleAxis dataKey="subject" tick={{fill: '#6B7280', fontSize: 13, fontWeight: 600}}/>
                                <PolarRadiusAxis angle={30} domain={[0, 25]} tick={{fill: '#9CA3AF', fontSize: 11}}/>
                                <Radar name="Điểm của bạn" dataKey="A" stroke="#10B981" fill="#10B981"
                                       fillOpacity={0.5} strokeWidth={2}/>
                                <Tooltip 
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '8px',
                                        padding: '8px'
                                    }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Legend & Explanation */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-xs text-gray-600">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="font-bold text-emerald-600">R - Realistic (Thực tế):</p>
                                <p>Làm việc với vật thể, máy móc, công cụ</p>
                            </div>
                            <div>
                                <p className="font-bold text-emerald-600">I - Investigative (Nghiên cứu):</p>
                                <p>Giải quyết vấn đề, phân tích, khoa học</p>
                            </div>
                            <div>
                                <p className="font-bold text-emerald-600">A - Artistic (Nghệ thuật):</p>
                                <p>Sáng tạo, biểu đạt, nghệ thuật</p>
                            </div>
                            <div>
                                <p className="font-bold text-emerald-600">S - Social (Xã hội):</p>
                                <p>Giúp đỡ, chăm sóc, làm việc với người</p>
                            </div>
                            <div>
                                <p className="font-bold text-emerald-600">E - Enterprising (Kinh doanh):</p>
                                <p>Lãnh đạo, thuyết phục, kinh doanh</p>
                            </div>
                            <div>
                                <p className="font-bold text-emerald-600">C - Conventional (Hành chính):</p>
                                <p>Tổ chức, dữ liệu, quy trình rõ ràng</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- GRIT CHARTS --- */}
            {result.type === 'GRIT' && (
                <div className="flex flex-col w-full h-full gap-8">
                    {/* Gauge Chart (Total) */}
                    <div className="flex flex-col items-center justify-center">
                        <div className="w-full h-[180px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={gritChartData}
                                        cx="50%"
                                        cy="100%"
                                        startAngle={180}
                                        endAngle={0}
                                        innerRadius="75%"
                                        outerRadius="100%"
                                        paddingAngle={0}
                                        dataKey="value"
                                    >
                                        {gritChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={GRIT_COLORS[index % GRIT_COLORS.length]}/>
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div
                                className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-end h-full pb-2 pointer-events-none">
                                <span className="text-4xl font-black text-purple-600">{gritScore}</span>
                                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Tổng điểm / 5.0</span>
                            </div>
                        </div>
                    </div>

                    {/* Bar Chart (Breakdown) */}
                    <div className="w-full h-[200px]">
                        <h4 className="text-sm font-semibold text-gray-600 mb-2 text-center">Chi tiết thành phần</h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={gritBreakdownData}
                                layout="vertical"
                                margin={{top: 5, right: 30, left: 40, bottom: 5}}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false}/>
                                <XAxis type="number" domain={[0, 5]} hide/>
                                <YAxis type="category" dataKey="name" width={100} tick={{fontSize: 11}}/>
                                <Tooltip cursor={{fill: 'transparent'}}/>
                                <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
                                    {gritBreakdownData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill}/>
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                        <p><span className="font-bold text-purple-600">Kiên trì:</span> Khả năng làm việc chăm chỉ
                            trước thử thách.</p>
                        <p className="mt-1"><span className="font-bold text-pink-500">Đam mê:</span> Tính nhất quán trong sở thích và mục tiêu qua thời gian dài.</p>
                    </div>
                </div>
            )}

            {/* --- MBTI STACKED BAR CHART --- */}
            {result.type === 'MBTI' && (
                <div className="w-full space-y-6">
                    {/* MBTI Type Result Card */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                        <div className="text-center">
                            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Kiểu tính cách của bạn
                            </p>
                            <h2 className="text-5xl font-black text-blue-600 mb-3 tracking-tight">
                                {result.rawLabel}
                            </h2>
                            <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
                                <div className="bg-white rounded-lg p-2 shadow-sm">
                                    <p className="text-xs text-gray-500 font-medium">E/I</p>
                                    <p className="text-lg font-bold text-blue-600">
                                        {(result.scores.E || 0) > (result.scores.I || 0) ? 'E' : 'I'}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {Math.round(Math.max(result.scores.E || 0, result.scores.I || 0))}%
                                    </p>
                                </div>
                                <div className="bg-white rounded-lg p-2 shadow-sm">
                                    <p className="text-xs text-gray-500 font-medium">S/N</p>
                                    <p className="text-lg font-bold text-blue-600">
                                        {(result.scores.S || 0) > (result.scores.N || 0) ? 'S' : 'N'}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {Math.round(Math.max(result.scores.S || 0, result.scores.N || 0))}%
                                    </p>
                                </div>
                                <div className="bg-white rounded-lg p-2 shadow-sm">
                                    <p className="text-xs text-gray-500 font-medium">T/F</p>
                                    <p className="text-lg font-bold text-blue-600">
                                        {(result.scores.T || 0) > (result.scores.F || 0) ? 'T' : 'F'}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {Math.round(Math.max(result.scores.T || 0, result.scores.F || 0))}%
                                    </p>
                                </div>
                                <div className="bg-white rounded-lg p-2 shadow-sm">
                                    <p className="text-xs text-gray-500 font-medium">J/P</p>
                                    <p className="text-lg font-bold text-blue-600">
                                        {(result.scores.J || 0) > (result.scores.P || 0) ? 'J' : 'P'}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {Math.round(Math.max(result.scores.J || 0, result.scores.P || 0))}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bar Chart */}
                    <div className="w-full h-[320px]">
                        <h4 className="text-sm font-semibold text-gray-600 mb-3 text-center">
                            Phân tích chi tiết các chiều kích tính cách
                        </h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                layout="vertical"
                                data={mbtiChartData}
                                margin={{top: 5, right: 30, left: 50, bottom: 5}}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
                                <XAxis type="number" domain={[0, 100]} hide/>
                                <YAxis dataKey="name" type="category" width={50} tick={{fontSize: 13, fontWeight: 600}}/>
                                <Tooltip
                                    cursor={{fill: 'transparent'}}
                                    content={({active, payload}) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div
                                                    className="bg-white p-3 border border-gray-200 shadow-xl rounded-lg text-sm z-50">
                                                    <p className="text-blue-600 font-bold mb-1">
                                                        {data.labelA}: {Math.round(data.A)}%
                                                    </p>
                                                    <p className="text-gray-600 font-bold">
                                                        {data.labelB}: {Math.round(data.B)}%
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="A" stackId="a" fill="#3B82F6" radius={[4, 0, 0, 4]}/>
                                <Bar dataKey="B" stackId="a" fill="#E5E7EB" radius={[0, 4, 4, 0]}/>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Legend & Explanation */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-xs text-gray-600">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="font-bold text-blue-600">E - Extraversion (Hướng ngoại):</p>
                                <p>Năng lượng từ tương tác xã hội</p>
                            </div>
                            <div>
                                <p className="font-bold text-gray-600">I - Introversion (Hướng nội):</p>
                                <p>Năng lượng từ thời gian riêng tư</p>
                            </div>
                            <div>
                                <p className="font-bold text-blue-600">S - Sensing (Cảm giác):</p>
                                <p>Tập trung vào thực tế, chi tiết</p>
                            </div>
                            <div>
                                <p className="font-bold text-gray-600">N - Intuition (Trực giác):</p>
                                <p>Tập trung vào ý tưởng, tương lai</p>
                            </div>
                            <div>
                                <p className="font-bold text-blue-600">T - Thinking (Suy nghĩ):</p>
                                <p>Quyết định dựa trên logic</p>
                            </div>
                            <div>
                                <p className="font-bold text-gray-600">F - Feeling (Cảm xúc):</p>
                                <p>Quyết định dựa trên giá trị cá nhân</p>
                            </div>
                            <div>
                                <p className="font-bold text-blue-600">J - Judging (Nguyên tắc):</p>
                                <p>Thích cấu trúc, kế hoạch rõ ràng</p>
                            </div>
                            <div>
                                <p className="font-bold text-gray-600">P - Perceiving (Linh hoạt):</p>
                                <p>Thích sự linh hoạt, tự phát</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {(hasSummary || hasExplain) && (
                <div className="mt-8 w-full space-y-6 text-left border-t border-gray-100 pt-6">
                    {hasSummary && (
                        <div className="rounded-xl border border-gray-200/90 bg-muted/30 p-4 sm:p-5 dark:bg-muted/20 dark:border-border">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Tóm tắt kết quả
                            </p>
                            <p className="whitespace-pre-wrap text-sm sm:text-[15px] leading-relaxed text-foreground">
                                {result.description}
                            </p>
                        </div>
                    )}
                    {hasExplain && (
                        <div
                            className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50 via-white to-blue-50/40 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/5 dark:from-slate-900/50 dark:via-slate-900/30 dark:to-blue-950/20 dark:border-slate-700/80 dark:ring-white/5 overflow-hidden"
                        >
                            <div className="flex gap-0 min-h-[3px] bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500" aria-hidden />
                            <div className="p-5 sm:p-6">
                                <div className="flex flex-wrap items-center gap-3 mb-4">
                                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/25">
                                        <FileText className="h-5 w-5" strokeWidth={2} />
                                    </span>
                                    <div>
                                        <h4 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
                                            Mô tả
                                        </h4>
                                        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                                            Chi tiết phân tích
                                        </p>
                                    </div>
                                </div>
                                <div className="pl-0 sm:pl-[52px] border-l-0 sm:border-l-2 border-blue-200/80 dark:border-blue-800/60 sm:ml-0">
                                    <p className="whitespace-pre-wrap text-[15px] sm:text-base leading-[1.65] text-slate-800 dark:text-slate-100">
                                        {result.detailTestExplain}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ResultChart;
