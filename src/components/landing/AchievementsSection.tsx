"use client";
import React, { useState } from "react";
import SectionHeading from "../ui/SectionHeading";

// Helper để lấy URL ảnh cờ (sử dụng mã ISO 3166-1 alpha-2)
const getFlagUrl = (code: string) =>
    `https://flagcdn.com/w80/${code.toLowerCase()}.png`;

// Danh sách 10 quốc gia hiển thị
const TOP_FLAGS = [
    { code: "us", name: "USA" },
    { code: "it", name: "Italy" },
    { code: "ro", name: "Romania" },
    { code: "hu", name: "Hungary" },
    { code: "sg", name: "Singapore" },
    { code: "jp", name: "Japan" },
    { code: "tw", name: "Taiwan" },
    { code: "hk", name: "Hong Kong" },
    { code: "kr", name: "South Korea" },
    { code: "vn", name: "Vietnam" },
];

const Concept1 = () => (
    <div className="py-24 bg-[#0B1120] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0B1120] to-[#0B1120]"></div>
        
        <div className="container mx-auto px-4 relative z-10">
            <div className="mb-12">
                <SectionHeading subtitle="Holie shinning stars" light={true}>
                    Dấu Ấn Thành Công năm 2024-2025
                </SectionHeading>
            </div>
            
            {/* 100% Core */}
            <div className="flex justify-center mb-20">
                <div className="relative flex flex-col items-center justify-center w-64 h-64 rounded-full border border-blue-500/30 bg-blue-500/10 backdrop-blur-xl shadow-[0_0_80px_rgba(59,130,246,0.3)]">
                    <div className="text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-yellow-500 drop-shadow-lg mb-2">100%</div>
                    <div className="text-blue-100 font-bold uppercase tracking-wider text-sm text-center">Học viên<br/>trúng tuyển</div>
                </div>
            </div>

            {/* Scholarships Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-20">
                {["Học bổng chính phủ", "Học bổng toàn phần", "Học bổng toàn học phí"].map((item, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 text-center hover:bg-white/10 transition duration-300 group cursor-default">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition">
                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        </div>
                        <h3 className="text-xl font-bold text-blue-50">{item}</h3>
                    </div>
                ))}
            </div>

            {/* Marquee Flags */}
            <div className="w-full overflow-hidden flex flex-col items-center">
                <p className="text-slate-400 font-medium mb-6 uppercase tracking-widest text-sm">Hiện diện tại đa quốc gia</p>
                <div className="flex gap-8 animate-[marquee_20s_linear_infinite] whitespace-nowrap">
                    {[...TOP_FLAGS, ...TOP_FLAGS, ...TOP_FLAGS].map((flag, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full pr-4 p-1">
                            <img src={getFlagUrl(flag.code)} alt={flag.name} className="w-10 h-10 rounded-full object-cover border border-white/20"/>
                            <span className="font-bold text-slate-200">{flag.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        <style>{`@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-33.33%); } }`}</style>
    </div>
);

const Concept2 = () => (
    <div className="py-24 bg-white text-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50"></div>
        
        <div className="container mx-auto px-4 relative z-10">
            <div className="mb-8">
                <SectionHeading subtitle="Holie shinning stars" dark={true}>
                    Dấu Ấn Thành Công năm 2024-2025
                </SectionHeading>
            </div>
            
            <div className="max-w-6xl mx-auto mt-16 flex flex-col lg:flex-row gap-12 items-center">
                
                {/* Left: 100% and text */}
                <div className="flex-1 text-center lg:text-left">
                    <div className="inline-block bg-blue-100 text-blue-700 font-bold px-4 py-2 rounded-full mb-6 text-sm tracking-wide uppercase">Đáng tự hào</div>
                    <h3 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tight mb-4 drop-shadow-sm">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-400">100%</span> Tỷ lệ
                    </h3>
                    <p className="text-2xl text-slate-600 font-medium mb-10 leading-relaxed max-w-lg mx-auto lg:mx-0">Học viên trúng tuyển và đạt thành tích ấn tượng tại các trường Đại học Top đầu thế giới.</p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                         <div className="border border-slate-200 bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <span className="font-bold text-slate-700">HB Chính phủ</span>
                         </div>
                         <div className="border border-slate-200 bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                            <span className="font-bold text-slate-700">HB Toàn phần</span>
                         </div>
                         <div className="border border-slate-200 bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                            <span className="font-bold text-slate-700">HB Toàn học phí</span>
                         </div>
                    </div>
                </div>

                {/* Right: Flags Network */}
                <div className="flex-1 w-full relative">
                    <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100 relative overflow-hidden">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Mạng lưới quốc gia vươn tầm</h4>
                        <div className="flex flex-wrap gap-3">
                            {TOP_FLAGS.map((flag, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 hover:border-blue-300 hover:shadow-md transition cursor-default">
                                    <img src={getFlagUrl(flag.code)} alt={flag.name} className="w-6 h-4 rounded-sm object-cover"/>
                                    <span className="font-bold text-slate-700 text-sm">{flag.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const Concept3 = () => (
    <div className="py-24 bg-slate-50 text-slate-900 relative">
        <div className="container mx-auto px-4 max-w-6xl">
            <div className="mb-12">
                <SectionHeading subtitle="Holie shinning stars" dark={true}>
                    Dấu Ấn Thành Công năm 2024-2025
                </SectionHeading>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6 mt-12 h-auto md:h-[500px]">
                {/* Big 100% Box */}
                <div className="md:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-10 text-white flex flex-col justify-center items-start relative overflow-hidden group shadow-lg">
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition duration-700"></div>
                    <span className="uppercase font-bold tracking-widest text-blue-200 text-sm mb-4">Tỷ lệ thành công</span>
                    <h3 className="text-8xl md:text-9xl font-black mb-4 tracking-tighter">100%</h3>
                    <p className="text-xl font-medium text-blue-100 max-w-md leading-relaxed">Tất cả học viên đều trúng tuyển và nhận được các suất học bổng danh giá nhất.</p>
                </div>

                {/* Flags Box */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm flex flex-col border border-slate-200">
                    <span className="uppercase font-bold tracking-widest text-slate-400 text-sm mb-6 text-center">Vươn tầm thế giới</span>
                    <div className="grid grid-cols-5 gap-3 mt-auto">
                        {TOP_FLAGS.map((flag, idx) => (
                            <img key={idx} src={getFlagUrl(flag.code)} alt={flag.name} title={flag.name} className="w-full aspect-[4/3] rounded-md object-cover border border-slate-100 hover:scale-110 transition"/>
                        ))}
                    </div>
                </div>

                {/* Scholarship 1 */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 flex flex-col justify-center items-center text-center hover:bg-slate-50 transition cursor-default">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 text-3xl font-black border border-blue-100">🏛️</div>
                    <h4 className="font-bold text-slate-800 text-lg">Học bổng<br/>Chính phủ</h4>
                </div>

                {/* Scholarship 2 */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 flex flex-col justify-center items-center text-center hover:bg-slate-50 transition cursor-default">
                    <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-4 text-3xl font-black border border-amber-100">🏆</div>
                    <h4 className="font-bold text-slate-800 text-lg">Học bổng<br/>Toàn phần</h4>
                </div>

                {/* Scholarship 3 */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200 flex flex-col justify-center items-center text-center hover:bg-slate-50 transition cursor-default">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-4 text-3xl font-black border border-emerald-100">🎓</div>
                    <h4 className="font-bold text-slate-800 text-lg">Học bổng<br/>Toàn học phí</h4>
                </div>
            </div>
        </div>
    </div>
);

export default function AchievementsSection() {
    const [concept, setConcept] = useState<1 | 2 | 3>(3);

    return (
        <section id="thanh-tich" className="relative">
            {/* --- MENU CHỌN CONCEPT (TẠM THỜI) --- */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[100] flex gap-2 bg-white/90 backdrop-blur-md p-2 rounded-full shadow-2xl border border-slate-200">
                <button 
                    onClick={() => setConcept(1)} 
                    className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${concept === 1 ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                    Concept 1: Bầu trời sao (Dark)
                </button>
                <button 
                    onClick={() => setConcept(2)} 
                    className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${concept === 2 ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                    Concept 2: Bản đồ (Light)
                </button>
                <button 
                    onClick={() => setConcept(3)} 
                    className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${concept === 3 ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                    Concept 3: Bento Grid
                </button>
            </div>

            {/* Render Concept tương ứng */}
            {concept === 1 && <Concept1 />}
            {concept === 2 && <Concept2 />}
            {concept === 3 && <Concept3 />}
        </section>
    );
}