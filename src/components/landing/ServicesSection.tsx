"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ShieldCheck, Zap, Clock, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import { BRAND_COLORS } from "../../lib/data";
import { LeadGenerationButton } from "./LeadGenerationModal";
import Link from "next/link";

export default function ServicesSection() {
  const [showComparison, setShowComparison] = useState(false);

  return (
    <section id="dich-vu" className="py-20 scroll-mt-24 bg-white bg-[linear-gradient(to_right,rgba(148,163,184,0.14)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.10)_1px,transparent_1px)] bg-[size:32px_32px]">
      <div className="container mx-auto px-4">
        <SectionHeading subtitle="Giải Pháp Của Chúng Tôi" dark={true}>
          Dịch Vụ Cung Cấp
        </SectionHeading>

        <div className="mx-auto max-w-7xl pt-4">

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* CÁC GÓI DỊCH VỤ */}
            <div className="w-full">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 text-slate-900 max-w-6xl mx-auto">

                {/* Gói Free */}
                <article className="relative flex flex-col rounded-[2.5rem] border border-slate-200/60 bg-white/70 backdrop-blur-xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="mb-6">
                    <h4 className="font-extrabold text-xl mb-3 text-slate-800">GÓI FREE: HOLIE MATE LÀM QUEN</h4>
                    <p className="text-sm text-slate-500 mb-6 min-h-[40px]">Dành cho bạn mới bắt đầu hành trình. Hãy để Holie Mate giúp bạn khám phá những tiềm năng ẩn giấu.</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-slate-900 tracking-tight">0 VNĐ</span>
                    </div>
                    <p className="text-xs font-medium text-slate-400 mt-2">(Trải nghiệm không giới hạn thời gian)</p>
                  </div>

                  <div className="flex-1 mt-4">
                    <p className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Cùng Holie Mate khởi động:</p>
                    <ul className="space-y-4 text-sm text-slate-600">
                      {[
                        "Holie Mate phân tích điểm mạnh/yếu (SWOT) cơ bản.",
                        "Holie Mate hướng dẫn thực hiện 3 bài trắc nghiệm khám phá bản thân.",
                        "Holie Mate gợi ý nhanh 3 ngành & 5 trường tiềm năng.",
                        "2 lần Holie Mate sửa CV & Bài luận ứng tuyển."
                      ].map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <Link href="/login" className="w-full py-4 px-4 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all active:scale-[0.98] flex justify-center items-center gap-2">
                      Chào Holie Mate và bắt đầu ngay
                    </Link>
                  </div>
                </article>

                {/* Gói Plus */}
                <article className="relative flex flex-col rounded-[2.5rem] border-2 border-[#fce041] bg-white shadow-xl shadow-yellow-400/10">
                  <div className="mb-6 mt-4 px-8">
                    <h4 className="font-extrabold text-xl mb-3 text-slate-900">GÓI PLUS: HOLIE MATE TẬN TÂM</h4>
                    <p className="text-sm text-slate-500 mb-6 min-h-[40px]">Holie Mate trở thành trợ lý riêng của bạn trong suốt 6 tháng, đánh giá mọi chi tiết trong hồ sơ.</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-slate-900 tracking-tight">399.000 VNĐ</span>
                    </div>
                    <p className="text-xs font-medium text-slate-500 mt-2">/ 6 THÁNG ĐỒNG HÀNH <br />(Hoặc 699.000 VNĐ/ 1 năm đồng hành)</p>
                  </div>

                  <div className="flex-1 px-8 mt-4">
                    <p className="text-sm font-bold text-primary mb-4 uppercase tracking-wider">Bứt phá hồ sơ trong 6 tháng:</p>
                    <ul className="space-y-4 text-sm text-slate-700">
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="leading-relaxed"><strong>Thấu hiểu hồ sơ:</strong> 5 lần cùng Holie Mate phân tích Profile chuyên sâu.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="leading-relaxed"><strong>Biết mình biết ta:</strong> Holie Mate gợi ý 10 ngành & đo lường điểm tương thích tới 30 trường.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="leading-relaxed"><strong>Nâng tầm ngòi bút:</strong> 5 lần Holie Mate trực tiếp phân tích và sửa bản thảo Luận/CV.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="leading-relaxed"><strong>Lưu trữ trọn vẹn:</strong> Holie Mate tự động xuất báo cáo chiến lược PDF không giới hạn.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-8 p-8 pt-6 border-t border-slate-100 bg-slate-50/50 rounded-b-[2.3rem]">
                    <Link href="/login" className="w-full py-4 px-4 rounded-2xl font-bold text-white bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all active:scale-[0.98] flex justify-center items-center gap-2">
                      Nhận trợ lý Holie Mate ngay <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </article>

                {/* Gói Premium */}
                <article className="relative flex flex-col rounded-[2.5rem] border-2 border-sky-400 bg-gradient-to-b from-[#f8fafc]/90 to-[#eff6ff]/90 backdrop-blur-xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="mb-6">
                    <h4 className="font-extrabold text-xl mb-3 text-transparent bg-clip-text bg-gradient-to-r from-[#0f4c81] to-sky-400">GÓI PREMIUM: HOLIE MATE & LIÊN MINH CỐ VẤN</h4>
                    <p className="text-sm text-slate-600 mb-6 min-h-[40px]">Kết hợp không giới hạn giữa trí tuệ của Holie Mate và sự đồng hành 1-1 cùng Ban cố vấn trong suốt 1 năm.</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#0f4c81] to-sky-400 tracking-tight">Liên hệ</span>
                    </div>
                    <p className="text-xs font-medium text-slate-500 mt-2">(Theo lộ trình Phụ thuộc vào Vùng và Số lượng trường ứng tuyển)</p>
                  </div>

                  <div className="flex-1 mt-4">
                    <p className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#0f4c81] to-sky-400 mb-4 uppercase tracking-wider">ĐẶC QUYỀN VIP:</p>
                    <ul className="space-y-4 text-sm text-slate-700">
                      {[
                        "MIỄN PHÍ sự đồng hành của Holie Mate xuyên suốt lộ trình.",
                        "Đồng hành cùng Đội ngũ gồm 3 Cố vấn với chuyên môn riêng biệt.",
                        "Đội ngũ Cố vấn cùng Holie Mate thiết kế lộ trình cá nhân hóa.",
                        "Chiến lược hoạt động ngoại khóa, học bổng & hồ sơ cá nhân hóa.",
                        "Chỉnh sửa luận & CV chuyên sâu chuẩn.",
                        "Luyện phỏng vấn thực chiến và cam kết hỗ trợ thủ tục Visa.",
                        "Holie Mate & Ban cố vấn hỗ trợ sửa hồ sơ không giới hạn."
                      ].map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-blue-500/60 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8 pt-6 border-t border-blue-100/50 bg-transparent">
                    <LeadGenerationButton className={`w-full py-4 px-4 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-[0.98] flex justify-center items-center gap-2 ${BRAND_COLORS.primaryGradient}`}>
                      Gặp gỡ Holie Mate & Ban Cố vấn
                    </LeadGenerationButton>
                  </div>
                </article>

                </div>
              
                {/* Nút Toggle So Sánh Chi Tiết */}
                <div className="mt-12 flex justify-center">
                  <button
                    onClick={() => setShowComparison(!showComparison)}
                    className="group flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-primary"
                  >
                    {showComparison ? "Ẩn so sánh chi tiết" : "Xem so sánh chi tiết các gói"}
                    {showComparison ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>

                {/* BẢNG SO SÁNH CHI TIẾT (Có thể ẩn/hiện) */}
                {showComparison && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-8 overflow-hidden"
                  >
                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                      <div className="overflow-x-auto">
                  <table className="w-full min-w-[1000px] text-left text-sm text-slate-800">
                    <thead className="bg-slate-50 text-slate-900 border-b border-slate-200">
                      <tr>
                        <th className="p-5 font-bold w-[35%] text-base">Danh mục Hỗ trợ của Holie Mate</th>
                        <th className="p-5 font-bold w-[20%] text-base">Gói Free</th>
                        <th className="p-5 font-bold w-[20%] text-base text-amber-600">Gói Plus (6 tháng)</th>
                        <th className="p-5 font-bold w-[25%] text-base text-transparent bg-clip-text bg-gradient-to-r from-[#0f4c81] to-sky-400">Gói Premium</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">

                      {/* Dòng 1 */}
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-5">
                          <p className="font-bold text-slate-900">1. Đánh giá Năng lực Cạnh tranh</p>
                          <p className="text-xs text-slate-500 mt-1 italic leading-relaxed">Holie Mate rà soát toàn diện, nhận diện thế mạnh cốt lõi và đề xuất chiến lược khắc phục điểm yếu trên hồ sơ</p>
                        </td>
                        <td className="p-5 align-top pt-6">
                          <p className="font-semibold text-slate-900">1 Lần</p>
                          <p className="text-xs text-slate-500">(Báo cáo rút gọn)</p>
                        </td>
                        <td className="p-5 align-top pt-6">
                          <p className="font-semibold text-slate-900">5 Lần</p>
                          <p className="text-xs text-slate-500">(Báo cáo phân tích chuyên sâu)</p>
                        </td>
                        <td className="p-5 align-top pt-6">
                          <p className="font-semibold text-slate-900">Không giới hạn</p>
                          <p className="text-xs text-slate-500">(Báo cáo phân tích chuyên sâu)</p>
                        </td>
                      </tr>

                      {/* Dòng 2 */}
                      <tr className="hover:bg-slate-50/50 transition-colors bg-slate-50/30">
                        <td className="p-5">
                          <p className="font-bold text-slate-900">2. Phân tích Năng lực & Định hướng</p>
                          <p className="text-xs text-slate-500 mt-1 italic leading-relaxed">Sử dụng hệ thống đánh giá chuẩn quốc tế, Holie Mate cung cấp cơ sở dữ liệu tâm lý học để định vị lộ trình nghề nghiệp</p>
                        </td>
                        <td className="p-5 align-top pt-6">
                          <p className="font-semibold text-slate-900">3 Bài Khám phá bản thân</p>
                          <p className="text-xs text-slate-500">(Kết quả tổng quan)</p>
                        </td>
                        <td className="p-5 align-top pt-6">
                          <p className="font-semibold text-slate-900">3 Bài Khám phá bản thân</p>
                          <p className="text-xs text-slate-500">(Phân tích và giải thích chi tiết)</p>
                        </td>
                        <td className="p-5 align-top pt-6">
                          <p className="font-semibold text-slate-900">3 Bài Khám phá bản thân</p>
                          <p className="text-xs text-slate-500">(Phân tích và giải thích chi tiết)</p>
                        </td>
                      </tr>

                      {/* Dòng 3 */}
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-5">
                          <p className="font-bold text-slate-900">3. Đề xuất Ngành học Mục tiêu</p>
                          <p className="text-xs text-slate-500 mt-1 italic leading-relaxed">Dựa trên thuật toán đối chiếu dữ liệu cá nhân, Holie Mate phác thảo các ngành học có mức độ phù hợp cao nhất với năng lực</p>
                        </td>
                        <td className="p-5 align-top pt-6">
                          <p className="font-semibold text-slate-900">1 Lần</p>
                          <p className="text-xs text-slate-500">(Gợi ý 3 ngành)</p>
                        </td>
                        <td className="p-5 align-top pt-6">
                          <p className="font-semibold text-slate-900">5 Lần</p>
                          <p className="text-xs text-slate-500">(Gợi ý 10 ngành, <span className="font-bold text-slate-700">minh bạch tỷ lệ %</span>)</p>
                        </td>
                        <td className="p-5 align-top pt-6">
                          <p className="font-semibold text-slate-900">Không giới hạn</p>
                          <p className="text-xs text-slate-500">(Gợi ý 10 ngành, <span className="font-bold text-slate-700">minh bạch tỷ lệ %</span>)</p>
                        </td>
                      </tr>

                      {/* Dòng 4 */}
                      <tr className="hover:bg-slate-50/50 transition-colors bg-slate-50/30">
                        <td className="p-5">
                          <p className="font-bold text-slate-900">4. Phân loại Trường & Đo lường Tỷ lệ Đỗ</p>
                          <p className="text-xs text-slate-500 mt-1 italic leading-relaxed">Xây dựng danh sách trường chiến lược: An toàn - Vừa sức - Thử thách, kèm dự báo xác suất trúng tuyển dựa trên điểm tương thích</p>
                        </td>
                        <td className="p-5 align-top pt-6">
                          <p className="font-semibold text-slate-900">2 Lần</p>
                          <p className="text-xs text-slate-500">(Gợi ý 5 trường)</p>
                        </td>
                        <td className="p-5 align-top pt-6">
                          <p className="font-semibold text-slate-900">5 Lần</p>
                          <p className="text-xs text-slate-500">(Gợi ý 30 trường, <span className="font-bold text-slate-700">cung cấp điểm tương thích chi tiết</span>)</p>
                        </td>
                        <td className="p-5 align-top pt-6">
                          <p className="font-semibold text-slate-900">Không giới hạn</p>
                          <p className="text-xs text-slate-500">(Gợi ý 30 trường, <span className="font-bold text-slate-700">cung cấp điểm tương thích chi tiết</span>)</p>
                        </td>
                      </tr>

                      {/* Dòng 5 */}
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-5">
                          <p className="font-bold text-slate-900">5. Cố vấn Tối ưu Hóa Bài Luận</p>
                          <p className="text-xs text-slate-500 mt-1 italic leading-relaxed">Holie Mate rà soát cấu trúc, tính logic và ngữ pháp, đưa ra gợi ý học thuật giúp bài luận sắc bén và mang tính thuyết phục cao</p>
                        </td>
                        <td className="p-5 align-top pt-6">
                          <p className="font-semibold text-slate-900">2 Lần</p>
                          <p className="text-xs text-slate-500">(Đánh giá và gợi ý cơ bản)</p>
                        </td>
                        <td className="p-5 align-top pt-6">
                          <p className="font-semibold text-slate-900">5 Lần</p>
                          <p className="text-xs text-slate-500">(Đánh giá và chỉnh sửa chuyên sâu)</p>
                        </td>
                        <td className="p-5 align-top pt-6">
                          <p className="font-semibold text-slate-900">10 Lần</p>
                          <p className="text-xs text-slate-500">(Đánh giá và chỉnh sửa chuyên sâu)</p>
                        </td>
                      </tr>

                      {/* Dòng 6 */}
                      <tr className="hover:bg-slate-50/50 transition-colors bg-slate-50/30">
                        <td className="p-5">
                          <p className="font-bold text-slate-900">6. Nâng tầm Hồ sơ Ngoại khóa & CV</p>
                          <p className="text-xs text-slate-500 mt-1 italic leading-relaxed">Chuyển hóa danh sách hoạt động thành điểm nhấn chiến lược, làm nổi bật tố chất lãnh đạo và tư duy cốt lõi của ứng viên</p>
                        </td>
                        <td className="p-5 align-top pt-6">
                          <p className="font-semibold text-slate-900">2 Lần</p>
                          <p className="text-xs text-slate-500">(Đánh giá và gợi ý cơ bản)</p>
                        </td>
                        <td className="p-5 align-top pt-6">
                          <p className="font-semibold text-slate-900">5 Lần</p>
                          <p className="text-xs text-slate-500">(Đánh giá và chỉnh sửa chuyên sâu)</p>
                        </td>
                        <td className="p-5 align-top pt-6">
                          <p className="font-semibold text-slate-900">10 Lần</p>
                          <p className="text-xs text-slate-500">(Đánh giá và chỉnh sửa chuyên sâu)</p>
                        </td>
                      </tr>

                      {/* Dòng 7 */}
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-5">
                          <p className="font-bold text-slate-900">7. Báo cáo Kế hoạch Hành động (PDF)</p>
                          <p className="text-xs text-slate-500 mt-1 italic leading-relaxed">Đóng gói toàn bộ phân tích, điểm số và lộ trình từ Holie Mate thành một tài liệu chiến lược chuyên nghiệp để lưu trữ và thực thi</p>
                        </td>
                        <td className="p-5 align-top pt-6">
                          <p className="font-semibold text-slate-900">1 Lần</p>
                          <p className="text-xs text-slate-500">(Bản xem trước bị làm mờ)</p>
                        </td>
                        <td className="p-5 align-top pt-6">
                          <p className="font-semibold text-slate-900">Không giới hạn</p>
                          <p className="text-xs text-slate-500">(Báo cáo chi tiết, độ phân giải cao)</p>
                        </td>
                        <td className="p-5 align-top pt-6">
                          <p className="font-semibold text-slate-900">Không giới hạn</p>
                          <p className="text-xs text-slate-500">(Báo cáo chi tiết, độ phân giải cao)</p>
                        </td>
                      </tr>

                      {/* Dòng 8 */}
                      <tr className="hover:bg-slate-50/50 transition-colors bg-slate-50/30">
                        <td className="p-5">
                          <p className="font-bold text-slate-900">8. Tra cứu Dữ liệu Tuyển sinh Toàn cầu</p>
                          <p className="text-xs text-slate-500 mt-1 italic leading-relaxed">Hỗ trợ truy cập trực tiếp vào hệ thống thông tin tuyển sinh của mạng lưới các trường Đại học quốc tế</p>
                        </td>
                        <td className="p-5 align-top pt-6">
                          <p className="font-semibold text-slate-900">Truy cập tự do</p>
                        </td>
                        <td className="p-5 align-top pt-6">
                          <p className="font-semibold text-slate-900">Truy cập tự do</p>
                        </td>
                        <td className="p-5 align-top pt-6">
                          <p className="font-semibold text-slate-900">Truy cập tự do</p>
                        </td>
                      </tr>

                    </tbody>
                  </table>
                </div>
              </div>
                  </motion.div>
                )}
              </div>

            {/* ĐỒNG HÀNH CÁ NHÂN HÓA - ROADMAP */}
            <div className="w-full mx-auto mt-24">
              <div className="text-center mb-16">
                <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
                  Gói Tư Vấn Toàn Diện 1-1
                </h3>
                <p className="text-slate-600 max-w-2xl mx-auto leading-relaxed">
                  Đồng hành 1-1 cùng Ban cố vấn trong vòng 1 năm (8 - 16 tháng) cho 1 kỳ tuyển sinh.
                  <br/><span className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-2 block">Áp dụng cho: Vùng A (Mỹ), Vùng B (Châu Á), Vùng C (Âu, Úc, Canada)</span>
                </p>
              </div>

              <div className="relative max-w-4xl mx-auto">
                {/* Vertical Line */}
                <div className="absolute left-[31px] md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-sky-400 to-cyan-500 md:-translate-x-1/2 rounded-full opacity-20"></div>

                {/* Phase 1 */}
                <div className="relative flex flex-col md:flex-row items-start md:justify-between mb-16 group">
                  <div className="absolute left-[16px] md:left-1/2 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm shadow-[0_0_0_6px_white] z-10 md:-translate-x-1/2 mt-1 transition-transform group-hover:scale-110">1</div>
                  
                  <div className="w-full md:w-[45%] pl-20 md:pl-0 md:text-right">
                    <h4 className="text-xl font-bold text-blue-600 mb-1 mt-1">Giai đoạn 1</h4>
                    <p className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider">Định vị & Khởi tạo</p>
                  </div>
                  
                  <div className="w-full md:w-[45%] pl-20 md:pl-0 mt-2 md:mt-0">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 group-hover:shadow-lg group-hover:-translate-y-1 transition-all duration-300">
                      <ul className="space-y-3">
                        {[
                          "Thời gian tư vấn 1-1 (45-60 phút/buổi)",
                          "Khai thác và đánh giá tổng quan bộ hồ sơ",
                          "Bài kiểm tra sở thích, tính cách, định hướng",
                          "Định hướng ngành và quốc gia du học",
                          "Xây dựng danh sách trường mục tiêu",
                          "Tìm kiếm học bổng/chương trình",
                          "Xây dựng lộ trình cải thiện hồ sơ",
                          "Thiết kế kế hoạch học tập và hoạt động"
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-3 text-slate-700 text-sm">
                            <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                            <span className="leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Phase 2 */}
                <div className="relative flex flex-col md:flex-row items-start md:justify-between mb-16 group">
                  <div className="absolute left-[16px] md:left-1/2 w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold text-sm shadow-[0_0_0_6px_white] z-10 md:-translate-x-1/2 mt-1 transition-transform group-hover:scale-110">2</div>
                  
                  <div className="w-full md:w-[45%] pl-20 md:pl-0 order-1 md:order-2 md:text-left">
                    <h4 className="text-xl font-bold text-sky-600 mb-1 mt-1">Giai đoạn 2</h4>
                    <p className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider">Thực thi & Hoàn thiện</p>
                  </div>
                  
                  <div className="w-full md:w-[45%] pl-20 md:pl-0 order-2 md:order-1 mt-2 md:mt-0">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 group-hover:shadow-lg group-hover:-translate-y-1 transition-all duration-300">
                      <ul className="space-y-3">
                        {[
                          "Chuẩn bị hoạt động ngoại khóa/dự án/Portfolio",
                          "Bài tập tư duy, phản tư làm tiền đề bài luận",
                          "Hỗ trợ bài luận chính & bài luận phụ",
                          "Hướng dẫn thư giới thiệu",
                          "Hỗ trợ chứng minh tài chính",
                          "Luyện phỏng vấn tuyển sinh thử",
                          "Hoàn thiện đơn ứng tuyển"
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-3 text-slate-700 text-sm">
                            <CheckCircle2 className="w-5 h-5 text-sky-500 shrink-0" />
                            <span className="leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Phase 3 */}
                <div className="relative flex flex-col md:flex-row items-start md:justify-between group">
                  <div className="absolute left-[16px] md:left-1/2 w-8 h-8 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold text-sm shadow-[0_0_0_6px_white] z-10 md:-translate-x-1/2 mt-1 transition-transform group-hover:scale-110">3</div>
                  
                  <div className="w-full md:w-[45%] pl-20 md:pl-0 md:text-right">
                    <h4 className="text-xl font-bold text-cyan-600 mb-1 mt-1">Giai đoạn 3</h4>
                    <p className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider">Hạ cánh & Khởi hành</p>
                  </div>
                  
                  <div className="w-full md:w-[45%] pl-20 md:pl-0 mt-2 md:mt-0">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 group-hover:shadow-lg group-hover:-translate-y-1 transition-all duration-300">
                      <ul className="space-y-3">
                        {[
                          "Tư vấn chọn trường theo học sau khi đỗ",
                          "Hỗ trợ chuẩn bị thủ tục visa",
                          "Hỗ trợ đặt vé máy bay",
                          "Hướng dẫn và dặn dò trước khi bay"
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-3 text-slate-700 text-sm">
                            <CheckCircle2 className="w-5 h-5 text-cyan-500 shrink-0" />
                            <span className="leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

                {/* Phần mở rộng: TẠI SAO NÊN CHỌN ĐỒNG HÀNH CÙNG CỐ VẤN & TRỢ LÝ HOLIE MATE? */}
                <div className="mt-16 max-w-5xl mx-auto">
                  <h3 className="text-2xl md:text-3xl font-extrabold mb-12 text-center uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500">
                    Tại sao nên chọn đồng hành cùng<br className="hidden md:block"/> Cố vấn & Trợ lý Holie Mate?
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {/* Card 1 */}
                    <div className="relative p-8 rounded-[2rem] bg-white border border-slate-200/60 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-6 rotate-3">
                        <Zap className="w-8 h-8" />
                      </div>
                      <h4 className="font-bold text-xl text-slate-900 mb-4">Sự kết hợp hoàn hảo</h4>
                      <p className="text-slate-600 leading-relaxed text-sm">
                        Bạn nhận được sự nhạy bén về dữ liệu của Holie Mate để chọn trường đúng mục tiêu, cùng sự thấu cảm và tư vấn chiến lược từ các Cố vấn để kể câu chuyện cá nhân ấn tượng nhất.
                      </p>
                    </div>

                    {/* Card 2 */}
                    <div className="relative p-8 rounded-[2rem] bg-white border border-slate-200/60 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-6 -rotate-3">
                        <ShieldCheck className="w-8 h-8" />
                      </div>
                      <h4 className="font-bold text-xl text-slate-900 mb-4">Minh bạch & Cam kết</h4>
                      <p className="text-slate-600 leading-relaxed text-sm">
                        Lộ trình được thiết kế rõ ràng theo từng giai đoạn, giúp phụ huynh và học sinh luôn kiểm soát được tiến độ và chất lượng hồ sơ.
                      </p>
                    </div>

                    {/* Card 3 */}
                    <div className="relative p-8 rounded-[2rem] bg-white border border-slate-200/60 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-6 rotate-3">
                        <Clock className="w-8 h-8" />
                      </div>
                      <h4 className="font-bold text-xl text-slate-900 mb-4">Tiết kiệm thời gian</h4>
                      <p className="text-slate-600 leading-relaxed text-sm">
                        Với sự hỗ trợ của công nghệ, các thủ tục rườm rà được tối giản, tập trung tối đa thời gian cho việc xây dựng năng lực cốt lõi.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-center flex-col sm:flex-row items-center gap-4">
                    <LeadGenerationButton className={`inline-flex items-center justify-center px-8 py-4 rounded-2xl font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] gap-2 ${BRAND_COLORS.primaryGradient}`}>
                      Đăng ký nhận tư vấn lộ trình cá nhân hóa <ArrowRight className="w-5 h-5 ml-1" />
                    </LeadGenerationButton>
                  </div>
                </div>

              </div>

          </motion.div>
        </div>
      </div>
    </section>
  );
}