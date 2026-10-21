"use client";

import { useState } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { DISPLAY_PLANS, type SubscriptionPlan } from "@/lib/subscription";
import { StudentPageContainer } from "@/components/student";
import RoleGuard from "@/components/auth/RoleGuard";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LeadGenerationButton } from "@/components/landing/LeadGenerationModal";
import { toast } from "sonner";
import { Lock, Check, ChevronDown, ChevronUp } from "lucide-react";

type BillingCycle = "6months" | "1year";

const PLUS_PRICE = {
  "6months": { amount: 399000, label: "399.000đ", period: "/6 tháng" },
  "1year": { amount: 599000, label: "699.000đ", period: "/năm" },
} as const;

const PLANS: {
  key: SubscriptionPlan;
  name: string;
  priceLabel: string;
  pricePeriod?: string;
  description: string;
  badge?: string;
  contactSales?: boolean;
}[] = [
    {
      key: "FREE",
      name: "Gói miễn phí",
      priceLabel: "0 đồng",
      description:
        "Dùng thử cơ bản với một lần cho mỗi tính năng phân tích bằng trí tuệ nhân tạo, kết quả hiển thị ở dạng rút gọn.",
    },
    {
      key: "PLUS",
      name: "Gói Plus (Holie Mate)",
      priceLabel: PLUS_PRICE["6months"].label,
      pricePeriod: PLUS_PRICE["6months"].period,
      description:
        "Mở khóa đầy đủ chi tiết phân tích bằng Holie Mate cho hồ sơ và gợi ý ngành học.",
      badge: "Phổ biến",
    },
    {
      key: "PREMIUM",
      name: "Gói Premium (Holie Mate + Cố vấn)",
      priceLabel: "Liên hệ",
      description:
        "Đồng hành cùng các Cố vấn chuyên môn và sử dụng các tính năng của hệ thống thông minh",
      badge: "Tốt nhất",
      contactSales: true,
    },
  ];

const CHECK = "✓";

export default function StudentPricingPage() {
  const { plan: currentPlan } = useSubscription();
  const [loadingPlan, setLoadingPlan] = useState<SubscriptionPlan | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("6months");
  const [isUpgradeNoticeOpen, setIsUpgradeNoticeOpen] = useState(false);
  const [isTableOpen, setIsTableOpen] = useState(false);

  const plusPrice = PLUS_PRICE[billingCycle];

  async function handleUpgrade(targetPlan: SubscriptionPlan) {
    if (targetPlan === "FREE") return;
    if (targetPlan === "PREMIUM") {
      // Liên hệ bán hàng: dùng modal LeadGeneration giống landing
      // (đã được handle bằng LeadGenerationButton trong JSX, nên không làm gì ở đây)
      return;
    }
    // Tạm thời chưa mở nâng cấp trên server: show modal thông báo
    setIsUpgradeNoticeOpen(true);
    return;
    /*
    setLoadingPlan(targetPlan);
    try {
      const res = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: targetPlan, billingCycle }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        toast.error(data?.error || 'Không thể nâng cấp gói, vui lòng thử lại');
        return;
      }
      toast.success(`Đã nâng cấp lên gói ${targetPlan}`);
    } catch (error) {
      console.error(error);
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoadingPlan(null);
    }
    */
  }

  return (
    <RoleGuard allowedRoles={["user", "student", "STUDENT"]}>
      <StudentPageContainer>
        <div className="max-w-6xl mx-auto pb-10 space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Gói đăng ký Holyann cho học sinh
            </h1>
          </div>

          {/* 6‑month cycle callout */}
          <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-center text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              Tất cả gói được tính theo chu kỳ 6 tháng
            </span>
            {": "}
            Tính năng và lượt dùng sẽ được làm mới mỗi 6 tháng.
          </div>

          {/* Billing toggle for Plus (6‑month vs 1‑year) */}
          <div className="flex justify-center">
            <Tabs
              value={billingCycle}
              onValueChange={(v) => setBillingCycle(v as BillingCycle)}
            >
              <TabsList className="grid w-full max-w-[280px] grid-cols-2">
                <TabsTrigger value="6months">6 tháng</TabsTrigger>
                <TabsTrigger value="1year">1 năm</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Hand-crafted Plan Cards */}
          <div className="grid gap-6 md:grid-cols-3 items-stretch mt-4 md:mt-8 px-2">
            {/* FREE PLAN */}
            <Card className="flex flex-col relative overflow-hidden transition-all hover:shadow-md bg-white border-gray-200 text-slate-800">
              <CardHeader className="space-y-2 pb-4">
                <CardTitle className="text-xl">Gói miễn phí</CardTitle>
                <div className="flex items-baseline gap-1 min-h-[36px]">
                  {/* <span className="text-3xl font-bold">0đ</span> */}
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 min-h-8">
                  Dùng thử cơ bản với một lần cho mỗi tính năng phân tích Holie Mate.
                </p>
              </CardHeader>
              <CardContent className="flex-1 pb-4 flex flex-col">
                <div className="h-px bg-gray-200 w-full mb-4"></div>
                <ul className="space-y-3 text-sm text-slate-700 w-full flex-1">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>1 lần Phân tích Profile (kết quả rút gọn, bị làm mờ)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>3 bài trắc nghiệm (MBTI/GRIT/RIASEC)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Gợi ý tối đa 3 ngành (tỷ lệ bị làm mờ)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>2 lần Holie Mate Match (5 trường 1R-2M-2S)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Lock className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-slate-500">Khóa xem Match score chi tiết</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>1 lần Đánh giá & Cải thiện Profile (mờ)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>2 lần phân tích & cải thiện Luận/CV</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Xem danh sách trường miễn phí</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Lock className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-slate-500">1 lần xuất Báo cáo tổng hợp (PDF)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>1 buổi phỏng vấn thử tiếng Anh (Feature 8)</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="pt-2 mt-auto">
                {currentPlan === "FREE" ? (
                  <Button className="w-full bg-gray-100 text-slate-500 hover:bg-gray-100 border-none" disabled>
                    Gói hiện tại
                  </Button>
                ) : (
                  <Button className="w-full border-slate-300 text-slate-700 hover:bg-slate-50" variant="outline">
                    Bắt đầu miễn phí
                  </Button>
                )}
              </CardFooter>
            </Card>

            {/* PLUS PLAN */}
            <Card className="flex flex-col relative overflow-hidden transition-all shadow-lg bg-amber-50 border-amber-400 text-amber-950 scale-100 md:-translate-y-2 ring-1 ring-amber-400/50">
              <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                Phổ biến
              </div>
              <CardHeader className="space-y-2 pb-4 pt-6">
                <CardTitle className="text-xl">Gói Plus</CardTitle>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">
                    {plusPrice.label}
                  </span>
                  <span className="text-xs text-amber-700/80 font-medium">
                    {plusPrice.period}
                  </span>
                </div>
                <p className="text-xs text-amber-800 line-clamp-2 min-h-8">
                  Mở khóa đầy đủ chi tiết phân tích Holie Mate cho học tập và ngành nghề.
                </p>
              </CardHeader>
              <CardContent className="flex-1 pb-4 flex flex-col">
                <div className="h-px bg-amber-200 w-full mb-4"></div>
                <ul className="space-y-3 text-sm text-amber-900 w-full flex-1">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>5 lần Phân tích Profile đầy đủ</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>3 bài trắc nghiệm (kết quả chi tiết)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>5 lần Gợi ý tối đa 10 ngành (đầy đủ tỷ lệ)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>5 lần Holie Mate Match (30 trường 10R-10M-10S)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Xem chi tiết Match score</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>5 lần Đánh giá & Cải thiện Profile chi tiết</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>5 lần phân tích & cải thiện Luận/CV</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Xem danh sách trường miễn phí</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Xuất Báo cáo tổng hợp không giới hạn</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Phỏng vấn thử: 1 buổi / ngày (tối đa 60 buổi / 6 tháng)</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="pt-2 mt-auto">
                {currentPlan === "PLUS" ? (
                  <Button className="w-full border-amber-600 text-amber-700 hover:bg-amber-100" variant="outline" disabled>
                    Gói hiện tại
                  </Button>
                ) : (
                  <Button
                    className="w-full font-semibold shadow-sm bg-amber-500 hover:bg-amber-600 text-white"
                    onClick={() => handleUpgrade("PLUS")}
                    disabled={loadingPlan === "PLUS"}
                  >
                    {loadingPlan === "PLUS"
                      ? "Đang xử lý..."
                      : "Nâng cấp gói Plus"}
                  </Button>
                )}
              </CardFooter>
            </Card>

            {/* PREMIUM PLAN */}
            <Card className="flex flex-col relative overflow-hidden transition-all shadow-xl bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 text-white md:scale-105 border-0">
              <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider shadow-sm z-10">
                Lựa chọn tốt nhất
              </div>
              <CardHeader className="space-y-2 pb-4">
                <CardTitle className="text-xl text-white">Gói Premium</CardTitle>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">Liên hệ</span>
                </div>
                <p className="text-xs text-blue-100 line-clamp-2 min-h-8">
                  Sử dụng mọi tính năng Holie Mate và đồng hành cùng chuyên gia thực thụ.
                </p>
              </CardHeader>
              <CardContent className="flex-1 pb-4 flex flex-col">
                <div className="h-px bg-blue-400/30 w-full mb-4"></div>
                <ul className="space-y-3 text-sm text-white w-full flex-1">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-blue-300 shrink-0 mt-0.5" />
                    <span>Không giới hạn Phân tích Profile</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-blue-300 shrink-0 mt-0.5" />
                    <span>3 bài trắc nghiệm (kết quả chi tiết)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-blue-300 shrink-0 mt-0.5" />
                    <span>Không giới hạn Gợi ý ngành & Holie Mate Match</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-blue-300 shrink-0 mt-0.5" />
                    <span>Xem chi tiết Match score</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-blue-300 shrink-0 mt-0.5" />
                    <span>Không giới hạn Đánh giá & Cải thiện Profile</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-blue-300 shrink-0 mt-0.5" />
                    <span>10 lần phân tích & cải thiện Luận/CV</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-blue-300 shrink-0 mt-0.5" />
                    <span>Xem danh sách trường miễn phí</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-blue-300 shrink-0 mt-0.5" />
                    <span>Xuất Báo cáo tổng hợp không giới hạn</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-blue-300 shrink-0 mt-0.5" />
                    <span>Phỏng vấn thử: 1 buổi / ngày (tối đa 60 buổi / 6 tháng)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <span className="font-medium text-amber-100">Đồng hành cùng Cố vấn chuyên môn 1-1</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="pt-2 mt-auto">
                {currentPlan === "PREMIUM" ? (
                  <Button className="w-full bg-white/20 text-white border-none hover:bg-white/30" disabled>
                    Gói hiện tại
                  </Button>
                ) : (
                  <LeadGenerationButton className="w-full bg-white hover:bg-gray-100 text-[#1E3A8A] font-bold border-none transition-colors">
                    Liên hệ tư vấn ngay
                  </LeadGenerationButton>
                )}
              </CardFooter>
            </Card>
          </div>

          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={() => setIsTableOpen(!isTableOpen)}
              className="gap-2 font-medium bg-background hover:bg-muted"
            >
              {isTableOpen
                ? "Ẩn bảng cấu hình chi tiết"
                : "Xem bảng so sánh chi tiết tính năng"}
              {isTableOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>

          {/* Comparison table */}
          {isTableOpen && (
            <div className="space-y-4 animate-in slide-in-from-top-4 fade-in-20 duration-300">
              <h2 className="text-lg font-semibold">
                So sánh chi tiết Gói dịch vụ
              </h2>
              <div className="overflow-x-auto rounded-lg border">
                <Table className="min-w-[1000px] text-sm">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[40%] font-bold text-slate-900 border-r bg-slate-50 align-middle">Danh mục Hỗ trợ của Holie Mate</TableHead>
                      <TableHead className="w-[20%] font-bold text-slate-800 border-r bg-gradient-to-b from-slate-200 to-slate-300 align-middle">
                        Gói Free
                      </TableHead>
                      <TableHead className="w-[20%] font-bold text-white border-r bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 align-middle shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-amber-200 text-amber-900 text-[9px] font-bold px-2 py-0.5 rounded-bl-md uppercase tracking-wider shadow-sm">Phổ biến</div>
                        Gói Plus (6 tháng)
                      </TableHead>
                      <TableHead className="w-[20%] font-bold text-white bg-gradient-to-br from-blue-400 via-blue-500 to-blue-700 align-middle shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-md uppercase tracking-wider">Tốt nhất</div>
                        Gói Premium
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Item 1 */}
                    <TableRow className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="border-r bg-white">
                        <div className="font-semibold text-slate-800">1. Đánh giá Năng lực Cạnh tranh</div>
                        <div className="text-xs text-slate-500 mt-1 italic">(Holie Mate rà soát toàn diện, nhận diện thế mạnh cốt lõi và đề xuất chiến lược khắc phục điểm yếu trên hồ sơ)</div>
                      </TableCell>
                      <TableCell className="border-r align-top bg-white">
                        <div>1 Lần</div>
                        <div className="text-xs text-slate-500 italic mt-1">(Báo cáo rút gọn)</div>
                      </TableCell>
                      <TableCell className="border-r align-top" style={{ backgroundColor: "#FFF3CD" }}>
                        <div className="font-bold" style={{ color: "#7A4F00" }}>5 Lần</div>
                        <div className="text-xs italic mt-1" style={{ color: "#7A4F00", opacity: 0.8 }}>(Báo cáo phân tích chuyên sâu)</div>
                      </TableCell>
                      <TableCell className="align-top" style={{ backgroundColor: "#D6E8FA" }}>
                        <div className="font-bold" style={{ color: "#0D3B6E" }}>Không giới hạn</div>
                        <div className="text-xs italic mt-1" style={{ color: "#0D3B6E", opacity: 0.8 }}>(Báo cáo phân tích chuyên sâu)</div>
                      </TableCell>
                    </TableRow>

                    {/* Item 2 */}
                    <TableRow className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="border-r bg-slate-50 border-y-slate-100">
                        <div className="font-semibold text-slate-800">2. Phân tích Năng lực & Định hướng</div>
                        <div className="text-xs text-slate-500 mt-1 italic">(Sử dụng hệ thống đánh giá chuẩn quốc tế, Holie Mate cung cấp cơ sở dữ liệu tâm lý học để định vị lộ trình nghề nghiệp)</div>
                      </TableCell>
                      <TableCell className="border-r align-top bg-slate-100 border-y-slate-200/50">
                        <div>3 Bài Khám phá bản thân</div>
                        <div className="text-xs text-slate-500 italic mt-2">(Kết quả tổng quan)</div>
                      </TableCell>
                      <TableCell className="border-r align-top" style={{ backgroundColor: "#FCEBBC" }}>
                        <div className="font-bold" style={{ color: "#7A4F00" }}>3 Bài Khám phá bản thân</div>
                        <div className="text-xs italic mt-2" style={{ color: "#7A4F00", opacity: 0.8 }}>(Phân tích và giải thích chi tiết)</div>
                      </TableCell>
                      <TableCell className="align-top" style={{ backgroundColor: "#C4DEF8" }}>
                        <div className="font-bold" style={{ color: "#0D3B6E" }}>3 Bài Khám phá bản thân</div>
                        <div className="text-xs italic mt-2" style={{ color: "#0D3B6E", opacity: 0.8 }}>(Phân tích và giải thích chi tiết)</div>
                      </TableCell>
                    </TableRow>

                    {/* Item 3 */}
                    <TableRow className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="border-r bg-white">
                        <div className="font-semibold text-slate-800">3. Đề xuất Ngành học Mục tiêu</div>
                        <div className="text-xs text-slate-500 mt-1 italic">(Dựa trên thuật toán đối chiếu dữ liệu cá nhân, Holie Mate phác thảo các ngành học có mức độ phù hợp cao nhất với năng lực).</div>
                      </TableCell>
                      <TableCell className="border-r align-top bg-white">
                        <div>1 Lần</div>
                        <div className="text-xs text-slate-500 italic mt-1">(Gợi ý 3 ngành)</div>
                      </TableCell>
                      <TableCell className="border-r align-top" style={{ backgroundColor: "#FFF3CD" }}>
                        <div className="font-bold" style={{ color: "#7A4F00" }}>5 Lần</div>
                        <div className="text-xs italic mt-1" style={{ color: "#7A4F00", opacity: 0.8 }}>(Gợi ý 10 ngành, <span className="font-bold">minh bạch tỷ lệ %</span>)</div>
                      </TableCell>
                      <TableCell className="align-top" style={{ backgroundColor: "#D6E8FA" }}>
                        <div className="font-bold" style={{ color: "#0D3B6E" }}>Không giới hạn</div>
                        <div className="text-xs italic mt-1" style={{ color: "#0D3B6E", opacity: 0.8 }}>(Gợi ý 10 ngành, <span className="font-bold">minh bạch tỷ lệ %</span>)</div>
                      </TableCell>
                    </TableRow>

                    {/* Item 4 */}
                    <TableRow className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="border-r bg-slate-50 border-y-slate-100">
                        <div className="font-semibold text-slate-800">4. Phân loại Trường & Đo lường Tỷ lệ Đỗ</div>
                        <div className="text-xs text-slate-500 mt-1 italic">(Xây dựng danh sách trường chiến lược: An toàn - Vừa sức - Thử thách, kèm dự báo xác suất trúng tuyển dựa trên điểm tương thích)</div>
                      </TableCell>
                      <TableCell className="border-r align-top bg-slate-100 border-y-slate-200/50">
                        <div>2 Lần</div>
                        <div className="text-xs text-slate-500 italic mt-1">(Gợi ý 5 trường)</div>
                      </TableCell>
                      <TableCell className="border-r align-top" style={{ backgroundColor: "#FCEBBC" }}>
                        <div className="font-bold" style={{ color: "#7A4F00" }}>5 Lần</div>
                        <div className="text-xs italic mt-1" style={{ color: "#7A4F00", opacity: 0.8 }}>(Gợi ý 30 trường, <span className="font-bold">cung cấp điểm tương thích chi tiết</span>)</div>
                      </TableCell>
                      <TableCell className="align-top" style={{ backgroundColor: "#C4DEF8" }}>
                        <div className="font-bold" style={{ color: "#0D3B6E" }}>Không giới hạn</div>
                        <div className="text-xs italic mt-1" style={{ color: "#0D3B6E", opacity: 0.8 }}>(Gợi ý 30 trường, <span className="font-bold">cung cấp điểm tương thích chi tiết</span>)</div>
                      </TableCell>
                    </TableRow>

                    {/* Item 5 */}
                    <TableRow className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="border-r bg-white">
                        <div className="font-semibold text-slate-800">5. Cố vấn Tối ưu Hóa Bài Luận</div>
                        <div className="text-xs text-slate-500 mt-1 italic">(Holie Mate rà soát cấu trúc, tính logic và ngữ pháp, đưa ra gợi ý học thuật giúp bài luận sắc bén và mang tính thuyết phục cao)</div>
                      </TableCell>
                      <TableCell className="border-r align-top bg-white">
                        <div>2 Lần</div>
                        <div className="text-xs text-slate-500 italic mt-2">(Đánh giá và gợi ý cơ bản)</div>
                      </TableCell>
                      <TableCell className="border-r align-top" style={{ backgroundColor: "#FFF3CD" }}>
                        <div className="font-bold" style={{ color: "#7A4F00" }}>5 Lần</div>
                        <div className="text-xs italic mt-2" style={{ color: "#7A4F00", opacity: 0.8 }}>(Đánh giá và chỉnh sửa chuyên sâu)</div>
                      </TableCell>
                      <TableCell className="align-top" style={{ backgroundColor: "#D6E8FA" }}>
                        <div className="font-bold" style={{ color: "#0D3B6E" }}>10 Lần</div>
                        <div className="text-xs italic mt-2" style={{ color: "#0D3B6E", opacity: 0.8 }}>(Đánh giá và chỉnh sửa chuyên sâu)</div>
                      </TableCell>
                    </TableRow>

                    {/* Item 6 */}
                    <TableRow className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="border-r bg-slate-50 border-y-slate-100">
                        <div className="font-semibold text-slate-800">6. Nâng tầm Hồ sơ Ngoại khóa & CV</div>
                        <div className="text-xs text-slate-500 mt-1 italic">(Chuyển hóa danh sách hoạt động thành điểm nhấn chiến lược, làm nổi bật tố chất lãnh đạo và tư duy cốt lõi của ứng viên)</div>
                      </TableCell>
                      <TableCell className="border-r align-top bg-slate-100 border-y-slate-200/50">
                        <div>2 Lần</div>
                        <div className="text-xs text-slate-500 italic mt-2">(Đánh giá và gợi ý cơ bản)</div>
                      </TableCell>
                      <TableCell className="border-r align-top" style={{ backgroundColor: "#FCEBBC" }}>
                        <div className="font-bold" style={{ color: "#7A4F00" }}>5 Lần</div>
                        <div className="text-xs italic mt-2" style={{ color: "#7A4F00", opacity: 0.8 }}>(Đánh giá và chỉnh sửa chuyên sâu)</div>
                      </TableCell>
                      <TableCell className="align-top" style={{ backgroundColor: "#C4DEF8" }}>
                        <div className="font-bold" style={{ color: "#0D3B6E" }}>10 Lần</div>
                        <div className="text-xs italic mt-2" style={{ color: "#0D3B6E", opacity: 0.8 }}>(Đánh giá và chỉnh sửa chuyên sâu)</div>
                      </TableCell>
                    </TableRow>

                    {/* Item 7 */}
                    <TableRow className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="border-r bg-white">
                        <div className="font-semibold text-slate-800">7. Báo cáo Kế hoạch Hành động (PDF)</div>
                        <div className="text-xs text-slate-500 mt-1 italic">(Đóng gói toàn bộ phân tích, điểm số và lộ trình từ Holie Mate thành một tài liệu chiến lược chuyên nghiệp để lưu trữ và thực thi)</div>
                      </TableCell>
                      <TableCell className="border-r align-top bg-white">
                        <div>1 Lần</div>
                        <div className="text-xs text-slate-500 italic mt-1">(Bản xem trước bị làm mờ)</div>
                      </TableCell>
                      <TableCell className="border-r align-top" style={{ backgroundColor: "#FFF3CD" }}>
                        <div className="font-bold" style={{ color: "#7A4F00" }}>Không giới hạn</div>
                        <div className="text-xs italic mt-1" style={{ color: "#7A4F00", opacity: 0.8 }}>(Báo cáo chi tiết, độ phân giải cao)</div>
                      </TableCell>
                      <TableCell className="align-top" style={{ backgroundColor: "#D6E8FA" }}>
                        <div className="font-bold" style={{ color: "#0D3B6E" }}>Không giới hạn</div>
                        <div className="text-xs italic mt-1" style={{ color: "#0D3B6E", opacity: 0.8 }}>(Báo cáo chi tiết, độ phân giải cao)</div>
                      </TableCell>
                    </TableRow>

                    {/* Item 8 — Feature 8 mock interview */}
                    <TableRow className="hover:bg-slate-50/50 transition-colors bg-slate-50">
                      <TableCell className="border-r border-t-slate-100">
                        <div className="font-semibold text-slate-800">8. Phỏng vấn thử tiếng Anh (Feature 8)</div>
                        <div className="text-xs text-slate-500 mt-1 italic">(Holie Mate chấm câu trả lời theo rubric phỏng vấn; luyện 7 câu / phiên)</div>
                      </TableCell>
                      <TableCell className="border-r align-top bg-slate-100 border-t-slate-200/50">
                        <div>1 buổi trải nghiệm</div>
                        <div className="text-xs text-slate-500 italic mt-1">(Tổng cộng 1 phiên hoàn thành)</div>
                      </TableCell>
                      <TableCell className="border-r align-top font-bold" style={{ backgroundColor: "#FCEBBC", color: "#7A4F00" }}>
                        <div>1 buổi / ngày (giờ VN)</div>
                        <div className="text-xs italic mt-1 font-normal" style={{ color: "#7A4F00", opacity: 0.85 }}>Tối đa 60 buổi trong 6 tháng lăn</div>
                      </TableCell>
                      <TableCell className="align-top font-bold" style={{ backgroundColor: "#C4DEF8", color: "#0D3B6E" }}>
                        <div>1 buổi / ngày (giờ VN)</div>
                        <div className="text-xs italic mt-1 font-normal" style={{ color: "#0D3B6E", opacity: 0.85 }}>Tối đa 60 buổi trong 6 tháng lăn</div>
                      </TableCell>
                    </TableRow>

                    {/* Item 9 */}
                    <TableRow className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="border-r rounded-bl-lg">
                        <div className="font-semibold text-slate-800">9. Tra cứu Dữ liệu Tuyển sinh Toàn cầu</div>
                        <div className="text-xs text-slate-500 mt-1 italic">(Hỗ trợ truy cập trực tiếp vào hệ thống thông tin tuyển sinh của mạng lưới các trường Đại học quốc tế)</div>
                      </TableCell>
                      <TableCell className="border-r align-middle bg-white font-medium">Truy cập tự do</TableCell>
                      <TableCell className="border-r align-middle font-bold" style={{ backgroundColor: "#FFF3CD", color: "#7A4F00" }}>Truy cập tự do</TableCell>
                      <TableCell className="align-middle font-bold rounded-br-lg" style={{ backgroundColor: "#D6E8FA", color: "#0D3B6E" }}>Truy cập tự do</TableCell>
                    </TableRow>

                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Modal thông báo nâng cấp đang được cập nhật trên server */}
          <Dialog
            open={isUpgradeNoticeOpen}
            onOpenChange={setIsUpgradeNoticeOpen}
          >
            <DialogContent className="sm:max-w-[420px] p-4">
              <DialogHeader>
                <DialogTitle>Hệ thống nâng cấp đang được cập nhật</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Tính năng nâng cấp gói sẽ sớm được mở trên server. Trong thời
                  gian này, nếu bạn cần tư vấn nâng cấp, hãy dùng nút &quot;Liên
                  hệ bán hàng&quot; để để lại thông tin cho đội ngũ Holyann.
                </p>
                <LeadGenerationButton className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors py-2 rounded-md">
                  Liên hệ bán hàng
                </LeadGenerationButton>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </StudentPageContainer>
    </RoleGuard>
  );
}
