import React from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, RadarChart, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, BarChart, Bar,
    XAxis, YAxis, CartesianGrid
} from 'recharts';
import {TestResult} from '../types';

interface ResultChartProps {
    result: TestResult;
}

const ResultChart: React.FC<ResultChartProps> = ({ result }) => {
    // --- Data Preparation Logic ---

    // 1. RIASEC Data (server-ai may return 0-1; scale to 0-25 for chart)
    const riasecData = result.type === 'RIASEC'
        ? Object.entries(result.scores).map(([key, value]) => {
            const v = typeof value === 'number' ? value : 0;
            const chartVal = v <= 1 && v >= 0 ? v * 25 : v;
            return { subject: key, A: chartVal, fullMark: 25 };
          })
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
        { name: 'Kiên trì', score: result.scores['Kiên trì'] || result.scores.Perseverance || 0, fill: 'var(--primary)' },
        { name: 'Đam mê', score: result.scores['Đam mê'] || result.scores.Passion || 0, fill: 'var(--secondary)' },
    ] : [];

    const GRIT_COLORS = ['var(--primary)', 'var(--muted)'];

    return (
        <div className="p-6 flex flex-col items-center min-h-[400px]">
            <h3 className="text-lg font-bold text-foreground mb-6 self-start w-full border-b border-border/60 pb-3">
                Biểu đồ phân tích
            </h3>

            {/* --- RIASEC RADAR CHART --- */}
            {result.type === 'RIASEC' && (
                <div className="w-full space-y-6">
                    <div className="rounded-xl p-6 border border-border/60 bg-muted/20">
                        <div className="text-center">
                            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                Mã Holland của bạn
                            </p>
                            <h2 className="text-4xl font-bold text-primary mb-3 tracking-tight">
                                {result.rawLabel}
                            </h2>
                            <div className="grid grid-cols-6 gap-2 max-w-2xl mx-auto">
                                {Object.entries(result.scores).map(([key, value]) => (
                                    <div key={key} className="rounded-lg p-3 bg-card border border-border/60">
                                        <p className="text-xs text-muted-foreground font-medium mb-1">{key}</p>
                                        <p className="text-xl font-bold text-primary">
                                            {typeof value === 'number' ? Math.round(value) : value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Radar Chart */}
                    <div className="w-full h-[350px]">
                        <h4 className="text-sm font-semibold text-foreground mb-3 text-center">
                            Biểu đồ radar - Xu hướng nghề nghiệp
                        </h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={riasecData}>
                                <PolarGrid stroke="var(--border)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--muted-foreground)', fontSize: 13, fontWeight: 600 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 25]} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
                                <Radar name="Điểm của bạn" dataKey="A" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.4} strokeWidth={2} />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="rounded-lg p-4 bg-muted/20 border border-border/60 text-xs text-muted-foreground">
                        <div className="grid grid-cols-2 gap-3">
                            <div><p className="font-semibold text-primary">R - Realistic (Thực tế):</p><p>Làm việc với vật thể, máy móc, công cụ</p></div>
                            <div><p className="font-semibold text-primary">I - Investigative (Nghiên cứu):</p><p>Giải quyết vấn đề, phân tích, khoa học</p></div>
                            <div><p className="font-semibold text-primary">A - Artistic (Nghệ thuật):</p><p>Sáng tạo, biểu đạt, nghệ thuật</p></div>
                            <div><p className="font-semibold text-primary">S - Social (Xã hội):</p><p>Giúp đỡ, chăm sóc, làm việc với người</p></div>
                            <div><p className="font-semibold text-primary">E - Enterprising (Kinh doanh):</p><p>Lãnh đạo, thuyết phục, kinh doanh</p></div>
                            <div><p className="font-semibold text-primary">C - Conventional (Hành chính):</p><p>Tổ chức, dữ liệu, quy trình rõ ràng</p></div>
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
                                            <Cell key={`cell-${index}`} fill={GRIT_COLORS[index % GRIT_COLORS.length]} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-end h-full pb-2 pointer-events-none">
                                <span className="text-4xl font-bold text-primary">{gritScore}</span>
                                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tổng điểm / 5.0</span>
                            </div>
                        </div>
                    </div>

                    {/* Bar Chart (Breakdown) */}
                    <div className="w-full h-[200px]">
                        <h4 className="text-sm font-semibold text-foreground mb-2 text-center">Chi tiết thành phần</h4>
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

                    <div className="text-xs text-muted-foreground bg-muted/20 p-3 rounded-lg border border-border/60">
                        <p><span className="font-semibold text-primary">Kiên trì:</span> Khả năng làm việc chăm chỉ trước thử thách.</p>
                        <p className="mt-1"><span className="font-semibold text-primary">Đam mê:</span> Tính nhất quán trong sở thích và mục tiêu qua thời gian dài.</p>
                    </div>
                </div>
            )}

            {/* --- MBTI STACKED BAR CHART --- */}
            {result.type === 'MBTI' && (
                <div className="w-full space-y-6">
                    <div className="rounded-xl p-6 border border-border/60 bg-muted/20">
                        <div className="text-center">
                            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                Kiểu tính cách của bạn
                            </p>
                            <h2 className="text-4xl font-bold text-primary mb-3 tracking-tight">
                                {result.rawLabel}
                            </h2>
                            <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
                                {[
                                    { dim: 'E/I', a: 'E', b: 'I' },
                                    { dim: 'S/N', a: 'S', b: 'N' },
                                    { dim: 'T/F', a: 'T', b: 'F' },
                                    { dim: 'J/P', a: 'J', b: 'P' },
                                ].map(({ dim, a, b }) => (
                                    <div key={dim} className="rounded-lg p-2 bg-card border border-border/60">
                                        <p className="text-xs text-muted-foreground font-medium">{dim}</p>
                                        <p className="text-lg font-bold text-primary">
                                            {(result.scores[a] || 0) > (result.scores[b] || 0) ? a : b}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {Math.round(Math.max(result.scores[a] || 0, result.scores[b] || 0))}%
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Bar Chart */}
                    <div className="w-full h-[320px]">
                        <h4 className="text-sm font-semibold text-foreground mb-3 text-center">
                            Phân tích chi tiết các chiều kích tính cách
                        </h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={mbtiChartData} margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                                <XAxis type="number" domain={[0, 100]} hide />
                                <YAxis dataKey="name" type="category" width={50} tick={{ fontSize: 13, fontWeight: 600, fill: 'var(--foreground)' }} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                    content={({ active, payload }) => {
                                        if (active && payload?.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="p-3 rounded-lg text-sm">
                                                    <p className="text-primary font-semibold mb-1">{data.labelA}: {Math.round(data.A)}%</p>
                                                    <p className="text-muted-foreground font-medium">{data.labelB}: {Math.round(data.B)}%</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="A" stackId="a" fill="var(--primary)" radius={[4, 0, 0, 4]} />
                                <Bar dataKey="B" stackId="a" fill="var(--muted)" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="rounded-lg p-4 bg-muted/20 border border-border/60 text-xs text-muted-foreground">
                        <div className="grid grid-cols-2 gap-3">
                            <div><p className="font-semibold text-primary">E - Extraversion (Hướng ngoại):</p><p>Năng lượng từ tương tác xã hội</p></div>
                            <div><p className="font-semibold text-foreground">I - Introversion (Hướng nội):</p><p>Năng lượng từ thời gian riêng tư</p></div>
                            <div><p className="font-semibold text-primary">S - Sensing (Cảm giác):</p><p>Tập trung vào thực tế, chi tiết</p></div>
                            <div><p className="font-semibold text-foreground">N - Intuition (Trực giác):</p><p>Tập trung vào ý tưởng, tương lai</p></div>
                            <div><p className="font-semibold text-primary">T - Thinking (Suy nghĩ):</p><p>Quyết định dựa trên logic</p></div>
                            <div><p className="font-semibold text-foreground">F - Feeling (Cảm xúc):</p><p>Quyết định dựa trên giá trị cá nhân</p></div>
                            <div><p className="font-semibold text-primary">J - Judging (Nguyên tắc):</p><p>Thích cấu trúc, kế hoạch rõ ràng</p></div>
                            <div><p className="font-semibold text-foreground">P - Perceiving (Linh hoạt):</p><p>Thích sự linh hoạt, tự phát</p></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResultChart;
