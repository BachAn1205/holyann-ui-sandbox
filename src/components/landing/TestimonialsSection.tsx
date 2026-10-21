"use client";
import React, { useState } from 'react';
import SectionHeading from '@/components/ui/SectionHeading';
import { TESTIMONIALS } from '../../lib/data';
import { AnimatePresence, motion } from 'framer-motion';

export default function TestimonialsSection() {
    const [selectedTestimonial, setSelectedTestimonial] = useState<typeof TESTIMONIALS[0] | null>(null);

    return (
        <section id="trai-nghiem" className="py-24 scroll-mt-24 bg-white text-slate-900 overflow-hidden relative">
            {/* Hiệu ứng nền lưới (Grid background) */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.1)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
            
            <div className="container mx-auto px-4 relative z-10">
                <SectionHeading subtitle="Câu Chuyện Thành Công" dark={true}>
                    Trải Nghiệm Học Viên
                </SectionHeading>

                {/* Giao diện linh hoạt:
                   - Mobile: Vuốt ngang (Snap scroll)
                   - Desktop: Lưới 3 cột (Grid) 
                */}
                <div className="flex overflow-x-auto gap-6 pb-12 snap-x snap-mandatory px-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible no-scrollbar">
                    {TESTIMONIALS.map((item, idx) => (
                        <div 
                            key={idx} 
                            className="snap-center shrink-0 w-[85vw] md:w-auto bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col h-full hover:border-blue-200 transition-all duration-300 group"
                        >
                            {/* Thông tin học viên */}
                            <div className="flex items-center gap-4 mb-5">
                                <div className="w-14 h-14 rounded-full bg-blue-50 overflow-hidden shrink-0 border border-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold transition-transform group-hover:scale-110">
                                    HV
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-bold text-base text-slate-900 truncate">{item.name}</h4>
                                    <p className="text-sm text-blue-600 font-semibold truncate">{item.school}</p>
                                </div>
                            </div>
                            
                            {/* Nội dung rút gọn (Hiển thị tối đa 4 dòng) */}
                            <p className="text-sm text-slate-600 italic leading-relaxed grow line-clamp-4 mb-4">
                                "{item.quote}"
                            </p>
                            
                            {/* Nút mở rộng nội dung */}
                            <button 
                                onClick={() => setSelectedTestimonial(item)}
                                className="text-left text-blue-600 font-bold text-sm hover:text-blue-800 transition-colors mb-6 inline-flex items-center gap-2"
                            >
                                Đọc toàn bộ câu chuyện 
                                <span className="text-lg">→</span>
                            </button>

                            {/* Đánh giá 5 sao (Dạng chấm tròn như thiết kế) */}
                            <div className="flex gap-1.5 justify-start">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm" />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* MODAL POPUP - Hiển thị chi tiết khi click */}
            <AnimatePresence>
                {selectedTestimonial && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setSelectedTestimonial(null)}
                    >
                        <motion.div 
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="bg-white rounded-[2.5rem] p-8 md:p-12 max-w-2xl w-full max-h-[85vh] overflow-y-auto relative shadow-2xl"
                            onClick={(e) => e.stopPropagation()} 
                        >
                            {/* Nút đóng Modal */}
                            <button 
                                className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors z-20"
                                onClick={() => setSelectedTestimonial(null)}
                            >
                                <span className="text-xl">✕</span>
                            </button>

                            {/* Header của Modal */}
                            <div className="flex items-center gap-5 mb-8 pr-12 relative z-10">
                                <div className="w-20 h-20 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 text-xl font-bold shrink-0">
                                    HV
                                </div>
                                <div>
                                    <h4 className="font-bold text-2xl text-slate-900 mb-1">{selectedTestimonial.name}</h4>
                                    <p className="text-lg text-blue-600 font-semibold">{selectedTestimonial.school}</p>
                                </div>
                            </div>

                            {/* Nội dung đầy đủ */}
                            <div className="relative">
                                {/* Icon nháy kép trang trí */}
                                <span className="absolute -top-4 -left-2 text-6xl text-slate-100 font-serif leading-none select-none">“</span>
                                <p className="text-base md:text-lg text-slate-700 italic leading-relaxed whitespace-pre-line relative z-10">
                                    {selectedTestimonial.quote}
                                </p>
                            </div>

                            {/* Nút đóng ở cuối để tiện lợi */}
                            <div className="mt-10 text-center relative z-10">
                                <button 
                                    onClick={() => setSelectedTestimonial(null)}
                                    className="px-8 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                                >
                                    Đóng
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}