import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  ClipboardList,
  FileBarChart,
  Sparkles,
  MessageCircle,
  CalendarClock,
  Video,
  FileUp,
  FileUser,
  Mic,
  Users,
} from "lucide-react";

const STUDENT_BASE = "/student";

export type NavFeature = {
  name: string;
  href: string;
  icon: LucideIcon;
  description: string;
  tier: "free" | "premium";
};

export type NavFeatureGroup = {
  id: string;
  label: string;
  items: NavFeature[];
};

/** Công cụ AI — cột Phân tích */
export const aiAnalyzeFeatures: NavFeature[] = [
  {
    name: "Phân tích hồ sơ",
    href: `${STUDENT_BASE}/profile-analysis`,
    icon: BarChart3,
    description: "Điểm mạnh – điểm yếu hồ sơ ứng tuyển",
    tier: "free",
  },
  {
    name: "Báo cáo",
    href: `${STUDENT_BASE}/reports`,
    icon: FileBarChart,
    description: "Tổng hợp tiến độ và kết quả",
    tier: "free",
  },
  {
    name: "Trắc nghiệm ngành",
    href: `${STUDENT_BASE}/tests`,
    icon: ClipboardList,
    description: "RIASEC / MBTI / Grit hỗ trợ định hướng",
    tier: "free",
  },
];

/** Công cụ AI — cột Cải thiện */
export const aiImproveFeatures: NavFeature[] = [
  {
    name: "Cải thiện CV",
    href: `${STUDENT_BASE}/cv-improve`,
    icon: FileUser,
    description: "Gợi ý chỉnh sửa CV theo rubric du học",
    tier: "free",
  },
  {
    name: "Cải thiện luận",
    href: `${STUDENT_BASE}/essay-improve`,
    icon: Sparkles,
    description: "Phân tích và chỉnh sửa bài luận",
    tier: "free",
  },
  {
    name: "Phỏng vấn thử",
    href: `${STUDENT_BASE}/mock-interview`,
    icon: Mic,
    description: "Luyện phỏng vấn tiếng Anh với AI",
    tier: "free",
  },
  {
    name: "Quản lý tài liệu",
    href: `${STUDENT_BASE}/manage-upload`,
    icon: FileUp,
    description: "Lưu trữ và sắp xếp tài liệu hồ sơ",
    tier: "free",
  },
];

export const aiToolGroups: NavFeatureGroup[] = [
  { id: "analyze", label: "Phân tích", items: aiAnalyzeFeatures },
  { id: "improve", label: "Cải thiện", items: aiImproveFeatures },
];

/** Alias cũ — flatten tất cả công cụ AI */
export const mainFeatures: NavFeature[] = [
  ...aiAnalyzeFeatures,
  ...aiImproveFeatures,
];

/** Với Cố vấn (gói Premium) */
export const mentorFeatures: NavFeature[] = [
  {
    name: "Trao đổi với Cố vấn",
    href: `${STUDENT_BASE}/chat`,
    icon: MessageCircle,
    description: "Chat trực tiếp với Cố vấn và Holie Mate",
    tier: "premium",
  },
  {
    name: "Đặt lịch tư vấn",
    href: `${STUDENT_BASE}/meeting`,
    icon: Video,
    description: "Đặt lịch gặp 1-1 với Cố vấn",
    tier: "premium",
  },
  {
    name: "Tiến độ",
    href: `${STUDENT_BASE}/checklist`,
    icon: ClipboardList,
    description: "Theo dõi công việc cần hoàn thành",
    tier: "premium",
  },
  {
    name: "Hạn chót",
    href: `${STUDENT_BASE}/deadlines`,
    icon: CalendarClock,
    description: "Hạn nộp hồ sơ và mốc quan trọng",
    tier: "premium",
  },
];

/** Alias cũ cho import hiện có */
export const premiumFeatures = mentorFeatures;

export const MENTOR_HUB_LABEL = "Với Cố vấn";
export const MENTOR_HUB_ICON = Users;
export const AI_TOOLS_LABEL = "Công cụ AI";
