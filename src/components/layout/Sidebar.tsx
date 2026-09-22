"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Timer,
  Target,
  BarChart3,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/ui/brand-logo";
import { useSidebar } from "./SidebarContext";

// Danh sách menu điều hướng chính
export const navigationItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Môn học",
    href: "/subjects",
    icon: BookOpen,
  },
  {
    name: "Phiên học",
    href: "/sessions",
    icon: Timer,
  },
  {
    name: "Mục tiêu",
    href: "/goals",
    icon: Target,
  },
  {
    name: "Thống kê",
    href: "/stats",
    icon: BarChart3,
  },
];

interface SidebarProps {
  className?: string;
}

/**
 * Sidebar dọc chuẩn vibe công nghệ:
 * - Thu gọn: 72px, chỉ hiện icon, hover hiện floating tooltip
 * - Mở rộng: 240px, hiện đầy đủ icon + chữ
 * - Nút mũi tên chuyển đổi mượt mà
 * - Các box giảm bo tròn (~5-10%), chuẩn cứng cáp tech
 */
export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col bg-[#13151B] text-white h-screen sticky top-0 z-30 select-none border-r border-[#1F222C] shadow-2xl justify-between transition-[width] duration-300 ease-in-out relative group/sidebar",
        isCollapsed ? "w-[72px]" : "w-[240px]",
        className
      )}
    >
      {/* Nút mũi tên chuyển đổi giữa rút gọn và đầy đủ (Floating Edge Button) */}
      <button
        onClick={toggleSidebar}
        aria-label={isCollapsed ? "Mở rộng thanh menu" : "Thu gọn thanh menu"}
        title={isCollapsed ? "Mở rộng thanh menu" : "Thu gọn thanh menu"}
        className={cn(
          "absolute -right-3 top-7 z-40 h-6 w-6 rounded-md bg-[#1F222C] border border-white/20 flex items-center justify-center text-zinc-300 hover:text-black hover:bg-[#C6FF33] hover:border-[#C6FF33] shadow-md transition-all duration-200 cursor-pointer active:scale-90",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF33]"
        )}
      >
        {isCollapsed ? (
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
        )}
      </button>

      <div>
        {/* Header Logo:
            - Rút gọn: Hiển thị icon mark nhỏ gọn
            - Mở rộng: Hiển thị wordmark 'LEVRN' nguyên bản
        */}
        <div
          className={cn(
            "h-20 flex items-center transition-all duration-300 overflow-hidden",
            isCollapsed ? "justify-center px-2" : "justify-between px-5"
          )}
        >
          {isCollapsed ? (
            <BrandLogo
              variant="icon"
              asLink
              priority
              className="h-10 w-10 shadow-md shadow-[#C6FF33]/15 transition-transform hover:scale-105"
              alt="LEVRN"
            />
          ) : (
            <div className="flex items-center gap-2 animate-in fade-in-50 duration-200 w-full">
              <BrandLogo
                variant="wordmark"
                asLink
                priority
                className="h-10 px-3.5 py-1.5 shadow-md shadow-[#C6FF33]/15"
                alt="LEVRN"
              />
            </div>
          )}
        </div>

        {/* Navigation Menu Links */}
        <nav className={cn("py-4 space-y-1.5", isCollapsed ? "px-2.5" : "px-3")}>
          {navigationItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <div key={item.href} className="relative group/nav">
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-lg text-sm font-semibold transition-all duration-200 relative group overflow-hidden",
                    isCollapsed
                      ? "justify-center h-11 w-full"
                      : "gap-3.5 px-3.5 py-2.5",
                    isActive
                      ? "bg-[#C6FF33] text-black shadow-md shadow-[#C6FF33]/20 font-bold scale-[1.02]"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-transform duration-200 group-hover:scale-115 shrink-0",
                      isActive
                        ? "text-black"
                        : "text-zinc-400 group-hover:text-white"
                    )}
                  />

                  {/* Tên mục menu khi mở rộng */}
                  {!isCollapsed && (
                    <span className="truncate animate-in fade-in-50 duration-150">
                      {item.name}
                    </span>
                  )}
                </Link>

                {/* Floating Tooltip khi Navbar ở chế độ rút gọn (Lia chuột vào mới hiện tên) */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#1F222C] text-white text-xs font-bold rounded-md shadow-xl border border-white/10 whitespace-nowrap opacity-0 -translate-x-2 pointer-events-none group-hover/nav:opacity-100 group-hover/nav:translate-x-0 transition-all duration-200 z-50 flex items-center gap-2">
                    <span>{item.name}</span>
                    {isActive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#C6FF33] animate-pulse" />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Card Banner ở chân Sidebar */}
      <div className={cn("p-3 transition-all duration-300", isCollapsed && "px-2")}>
        {isCollapsed ? (
          // Chế độ rút gọn: icon badge nhỏ kèm tooltip
          <div className="relative group/footer flex justify-center">
            <div className="h-11 w-11 rounded-lg bg-gradient-to-br from-[#C6FF33] to-[#A8E817] p-2 flex items-center justify-center text-black shadow-md transition-transform hover:scale-105 cursor-pointer">
              <BrandLogo
                variant="icon-transparent"
                className="h-6 w-6"
                alt="LEVRN Mobile"
              />
            </div>
            {/* Tooltip */}
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#1F222C] text-white text-xs font-bold rounded-md shadow-xl border border-white/10 whitespace-nowrap opacity-0 -translate-x-2 pointer-events-none group-hover/footer:opacity-100 group-hover/footer:translate-x-0 transition-all duration-200 z-50">
              LEVRN Mobile App
            </div>
          </div>
        ) : (
          // Chế độ đầy đủ: Box phong cách tech cứng cáp (bo góc 5-10%)
          <div className="relative rounded-lg bg-gradient-to-br from-[#C6FF33] to-[#A8E817] p-3.5 text-black overflow-hidden shadow-lg group cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[#C6FF33]/20 animate-in fade-in-50">
            {/* Họa tiết trang trí sọc tech */}
            <div className="absolute -right-4 -bottom-4 w-16 h-16 opacity-15 pointer-events-none">
              <div className="w-full h-1 border-b-2 border-black rotate-45 mb-1.5" />
              <div className="w-full h-1 border-b-2 border-black rotate-45 mb-1.5" />
              <div className="w-full h-1 border-b-2 border-black rotate-45 mb-1.5" />
            </div>

            <div className="flex items-start justify-between mb-2">
              <div className="h-7 w-7 rounded-md bg-black/10 flex items-center justify-center p-1">
                <BrandLogo
                  variant="icon-transparent"
                  className="h-4 w-4"
                  alt="LEVRN Icon"
                />
              </div>
              <div className="h-6 w-6 rounded-md bg-black flex items-center justify-center text-[#C6FF33] transition-transform group-hover:rotate-45 duration-200">
                <ArrowUpRight className="h-3.5 w-3.5" />
              </div>
            </div>

            <p className="font-extrabold text-xs leading-tight mb-0.5">
              Ứng dụng LEVRN Mobile
            </p>
            <p className="text-[10px] text-black/80 font-medium leading-tight">
              Theo dõi phiên học mọi lúc mọi nơi
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
