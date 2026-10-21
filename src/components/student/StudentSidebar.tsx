"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Target, FileText, ChevronDown, ChevronRight,
  BrainCircuit, FileSearch, GraduationCap, PenLine, 
  FileSignature, Video, MessageSquare, Calendar, 
  CheckSquare, Clock, Settings, HelpCircle, FileBarChart,
  Crown, LayoutDashboard, LogOut, UserCircle
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useAuthSession } from "@/hooks/useAuthSession";

// Types
type NavItem = {
  name: string;
  path: string;
  icon: React.ElementType;
};

type NavGroup = {
  name: string;
  icon: React.ElementType;
  items: NavItem[];
};

// Data
const NAV_GROUPS: NavGroup[] = [
  {
    name: "Hồ sơ học thuật",
    icon: User,
    items: [
      { name: "Hồ sơ cá nhân", path: "/student/profile", icon: User },
      { name: "Mục tiêu & Nguyện vọng", path: "/student/target", icon: Target },
      { name: "Kho tài liệu cá nhân", path: "/student/manage-upload", icon: FileText },
    ]
  },
  {
    name: "Trợ lý AI",
    icon: BrainCircuit,
    items: [
      { name: "Trắc nghiệm định hướng", path: "/student/tests", icon: FileSearch },
      { name: "Phân tích & cải thiện", path: "/student/profile-analysis", icon: BrainCircuit },
      { name: "Đề xuất trường", path: "/student/universities", icon: GraduationCap },
      { name: "Tối ưu bài luận", path: "/student/essay-improve", icon: PenLine },
      { name: "Tối ưu CV", path: "/student/cv-improve", icon: FileSignature },
      { name: "Phỏng vấn thử AI", path: "/student/mock-interview", icon: Video },
    ]
  },
  {
    name: "Premium",
    icon: Crown,
    items: [
      { name: "Trao đổi cố vấn", path: "/student/chat", icon: MessageSquare },
      { name: "Đặt lịch hẹn 1-1", path: "/student/meeting", icon: Calendar },
      { name: "Nhiệm vụ theo giai đoạn", path: "/student/checklist", icon: CheckSquare },
      { name: "Lịch hạn chót", path: "/student/deadlines", icon: Clock },
    ]
  }
];

export default function StudentSidebar() {
  const { session } = useAuthSession();
  const userName = session?.user?.name || "Học viên";
  const userEmail = session?.user?.email || "";

  const pathname = usePathname();
  // Mặc định mở menu đang chứa trang hiện tại
  const [expandedGroups, setExpandedGroups] = useState<string[]>(
    NAV_GROUPS.filter(g => g.items.some(i => pathname === i.path)).map(g => g.name)
  );
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      // Show indicator if there is content to scroll and we are not at the very bottom
      setShowScrollIndicator(scrollHeight > clientHeight && Math.ceil(scrollTop + clientHeight) < scrollHeight - 5);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [expandedGroups, isCollapsed, pathname]);

  const toggleGroup = (name: string) => {
    setExpandedGroups(prev => 
      prev.includes(name) ? prev.filter(g => g !== name) : [...prev, name]
    );
  };

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ ease: "easeInOut", duration: 0.3 }}
      className="h-screen sticky top-0 flex flex-col bg-white text-slate-700 border-r border-slate-200 z-50 shrink-0 overflow-x-hidden"
    >
      {/* Header */}
      <div className="h-[88px] flex items-center justify-center px-4 border-b border-slate-100 shrink-0">
        {!isCollapsed && (
          <Link href="/student/dashboard" className="relative flex items-center justify-center w-full h-[60px] focus:outline-none">
            <Image
                src="/images/logos/logo%20vien%20(1).png"
                alt="Holyann Explore logo"
                fill
                className="object-contain object-center"
                sizes="200px"
                priority
            />
          </Link>
        )}
        {isCollapsed && (
          <Link href="/student/dashboard" className="relative flex items-center justify-center w-10 h-10 mx-auto focus:outline-none">
            <Image
                src="/logo/logo%20HoEx%20(2).png"
                alt="Holyann Explore logo"
                fill
                className="object-contain object-center"
                sizes="40px"
                priority
            />
          </Link>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="relative flex-1 overflow-hidden">
        <div 
          ref={scrollRef}
          onScroll={checkScroll}
          className="h-full overflow-y-auto py-5 px-3 custom-scrollbar flex flex-col gap-1.5"
        >
        {/* Dashboard Link */}
        <Link href="/student/dashboard" className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${pathname === '/student/dashboard' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium'} ${isCollapsed ? 'justify-center' : ''}`}>
          <LayoutDashboard size={20} className="shrink-0" />
          {!isCollapsed && <span className="text-[14px] whitespace-nowrap">Tổng quan</span>}
        </Link>

        <div className="my-2 border-t border-slate-100 w-full" />

        {NAV_GROUPS.map((group) => {
          const isExpanded = expandedGroups.includes(group.name);
          const hasActiveChild = group.items.some(item => pathname === item.path);
          
          return (
            <div key={group.name} className="flex flex-col">
              {/* Parent Accordion Button */}
              <button 
                onClick={() => {
                  if (isCollapsed) setIsCollapsed(false);
                  toggleGroup(group.name);
                }}
                className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-xl transition-all ${
                  isExpanded || hasActiveChild ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium'
                } ${(isExpanded || hasActiveChild) && !isCollapsed ? 'rounded-b-none' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <group.icon size={20} className={`shrink-0 ${(isExpanded || hasActiveChild) ? 'text-slate-900' : ''}`} />
                  {!isCollapsed && <span className="text-[14px] whitespace-nowrap">{group.name}</span>}
                </div>
                {!isCollapsed && (
                  <ChevronDown size={16} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                )}
              </button>

              {/* Children (Folder Tab Style) */}
              <AnimatePresence initial={false}>
                {isExpanded && !isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="ml-[21px] w-[calc(100%-21px)] border-l border-slate-200 flex flex-col gap-0.5 pb-1 pt-1">
                      {group.items.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                          <div key={item.path} className="relative flex items-center">
                            {/* Horizontal Line */}
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[16px] h-[1px] bg-slate-200 z-0" />
                            <Link 
                              href={item.path}
                              className={`relative z-10 flex-1 flex items-center gap-3 ml-[16px] px-3 py-2 rounded-lg text-[13px] transition-all ${isActive ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium'}`}
                            >
                              <item.icon size={16} className={isActive ? 'text-slate-900' : 'text-slate-500'} />
                              <span className="whitespace-nowrap">{item.name}</span>
                            </Link>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
        </div>

        {/* Scroll Indicator */}
        <AnimatePresence>
          {showScrollIndicator && !isCollapsed && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none flex items-end justify-center pb-2 bg-gradient-to-t from-white via-white/80 to-transparent z-20"
            >
              <div className="text-slate-500 animate-bounce">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <defs>
                    <linearGradient id="arrowGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="currentColor" stopOpacity="1" />
                    </linearGradient>
                  </defs>
                  <path d="M6 9l6 6 6-6" stroke="url(#arrowGrad)"/>
                </svg>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed Footer */}
      <div className="border-t border-slate-100 p-4 shrink-0 flex flex-col gap-1">
        {!isCollapsed && session?.user?.subscriptionPlan !== 'PREMIUM' && (
          <Link href="/student/pricing" className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors mb-2">
            <Crown size={16} className="text-yellow-400 fill-yellow-400" />
            <span className="text-[14px] whitespace-nowrap">Nâng cấp Premium</span>
          </Link>
        )}
        
        <Link href="/student/reports" className={`flex items-center gap-3 px-3 py-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all font-medium ${isCollapsed ? 'justify-center' : ''}`}>
          <FileBarChart size={20} className="shrink-0" />
          {!isCollapsed && <div className="flex flex-col whitespace-nowrap"><span className="text-[14px] leading-tight text-slate-900">Hồ sơ cá nhân</span><span className="text-[11px] text-slate-400">Báo cáo tổng hợp</span></div>}
        </Link>
        <Link href="/student/settings" className={`flex items-center gap-3 px-3 py-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all text-[14px] font-medium ${isCollapsed ? 'justify-center' : ''}`}>
          <Settings size={20} className="shrink-0" />
          {!isCollapsed && <span className="whitespace-nowrap">Cài đặt</span>}
        </Link>
        <Link href="/student/support" className={`flex items-center gap-3 px-3 py-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all text-[14px] font-medium ${isCollapsed ? 'justify-center' : ''}`}>
          <HelpCircle size={20} className="shrink-0" />
          {!isCollapsed && <span className="whitespace-nowrap">Trợ giúp</span>}
        </Link>

        {/* User Profile & Logout */}
        <div className={`mt-2 flex items-center ${isCollapsed ? 'justify-center flex-col gap-3' : 'justify-between px-2'} pt-3 border-t border-slate-100`}>
          <div className="flex items-center gap-2 overflow-hidden min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
              <UserCircle size={20} />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-semibold text-slate-900 truncate block w-28" title={userName}>{userName}</span>
                <span className="text-[11px] text-slate-400 truncate block w-28" title={userEmail}>{userEmail}</span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button 
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
              title="Đăng xuất"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>

        {/* Collapse Toggle */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="mt-1 flex items-center justify-center w-full py-2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <div className="flex items-center gap-1.5 whitespace-nowrap"><ChevronRight className="rotate-180" size={14} /><span className="text-[12px] font-medium uppercase tracking-wider">Thu gọn</span></div>}
        </button>
      </div>

      <style>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .custom-scrollbar::-webkit-scrollbar {
          display: none;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        .custom-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </motion.aside>
  );
}
