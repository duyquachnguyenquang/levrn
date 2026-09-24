"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Bell,
  Sun,
  Moon,
  User,
  Settings,
  LogOut,
  CheckCircle2,
  BookOpen,
  Search,
  ArrowUpRight,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MobileNav } from "./MobileNav";
import { BrandLogo } from "@/components/ui/brand-logo";
import { useNotifications } from "@/hooks/useNotifications";
import Link from "next/link";
import { cn } from "@/lib/utils";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard Tổng quan",
  "/subjects": "Quản lý môn học",
  "/grades": "Quản lý điểm số & GPA",
  "/attendance": "Điểm danh & Chuyên cần",
  "/groups": "Quản lý nhóm & Đồ án",
  "/plans": "Kế hoạch học tập",
  "/sessions": "Phiên học tập",
  "/goals": "Mục tiêu học tập",
  "/stats": "Thống kê tiến độ",
  "/notifications": "Trung tâm thông báo",
};


/**
 * Topbar ngang phong cách hiện đại với thanh tìm kiếm nhanh dạng pill và widgets
 */
export function Topbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTitle =
    pageTitles[pathname] ||
    (pathname.startsWith("/subjects")
      ? "Quản lý môn học"
      : "LEVRN Study");

  return (
    <header className="h-16 sticky top-0 z-40 w-full border-b border-border/60 bg-background/95 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between transition-colors">
      {/* Cụm bên trái: Hamburger + Icon logo nhỏ (mobile) + Tiêu đề trang */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 lg:hidden">
          <MobileNav />
          <BrandLogo
            variant="icon"
            asLink
            className="h-8 w-8 rounded-xl shadow-xs"
            alt="LEVRN"
          />
        </div>
        <div>
          <h1 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight">
            {currentTitle}
          </h1>
        </div>
      </div>

      {/* Cụm bên phải: Search + Notification + Theme toggle + Avatar */}
      <div className="flex items-center gap-2 sm:gap-3.5">
        {/* Thanh tìm kiếm nhanh dạng tech pill */}
        <div className="relative hidden md:flex items-center w-56 lg:w-64 focus-within:w-72 transition-all duration-300">
          <Search className="absolute left-3 h-3.5 w-3.5 text-muted-foreground transition-colors group-focus-within:text-[#7D39EB]" />
          <Input
            placeholder="Tìm kiếm"
            className="h-9 pl-9 pr-4 text-xs rounded-lg bg-card/80 border-border/70 focus-visible:ring-[#7D39EB] focus-visible:border-[#7D39EB] transition-all"
          />
        </div>

        {/* 1. Notifications Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-lg h-9 w-9 text-muted-foreground hover:text-foreground bg-card/60 border border-border/40 hover:bg-card hover:border-[#7D39EB]/40 transition-all duration-200 active:scale-90"
              aria-label="Xem thông báo"
            >
              <Bell className="h-4 w-4 transition-transform hover:rotate-12 duration-200" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-[#C6FF33] text-black font-extrabold text-[9px] flex items-center justify-center ring-2 ring-background animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-3 rounded-lg border-border/80 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <span className="text-xs font-bold text-foreground">
                Thông báo {unreadCount > 0 ? `(${unreadCount} mới)` : ""}
              </span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllAsRead()}
                  className="text-[10px] text-[#7D39EB] font-semibold hover:underline cursor-pointer"
                >
                  Đánh dấu đã đọc
                </button>
              )}
            </div>

            <div className="mt-2 space-y-2 max-h-72 overflow-y-auto">
              {notifications.slice(0, 4).map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  className={cn(
                    "flex items-start gap-2.5 p-2 rounded-md transition-all cursor-pointer",
                    !notif.read
                      ? "bg-[#7D39EB]/10 border border-[#7D39EB]/20 hover:bg-[#7D39EB]/15"
                      : "hover:bg-muted/50 border border-transparent"
                  )}
                >
                  <div className="mt-0.5 shrink-0">
                    {notif.type === "warning" ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    ) : notif.type === "deadline" ? (
                      <Clock className="h-3.5 w-3.5 text-red-500" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#C6FF33]" />
                    )}
                  </div>
                  <div className="text-xs min-w-0 flex-1">
                    <p className="font-semibold text-foreground truncate">{notif.title}</p>
                    <p className="text-muted-foreground text-[11px] line-clamp-2 mt-0.5">
                      {notif.message}
                    </p>
                  </div>
                </div>
              ))}

              {notifications.length === 0 && (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  Không có thông báo mới
                </div>
              )}
            </div>

            <div className="pt-2 mt-2 border-t border-border/50 text-center">
              <Link
                href="/notifications"
                className="text-xs font-bold text-[#7D39EB] hover:underline inline-flex items-center gap-1"
              >
                <span>Xem tất cả thông báo</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </PopoverContent>
        </Popover>

        {/* 2. Theme Toggle Button */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-lg h-9 w-9 text-muted-foreground hover:text-foreground bg-card/60 border border-border/40 hover:bg-card hover:border-[#C6FF33]/40 transition-all duration-200 active:scale-90"
            aria-label="Chuyển đổi chế độ sáng/tối"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-[#C6FF33] transition-transform rotate-0 hover:rotate-45 duration-300" />
            ) : (
              <Moon className="h-4 w-4 text-[#7D39EB] transition-transform rotate-0 hover:-rotate-12 duration-300" />
            )}
          </Button>
        )}

        {/* 3. Account Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 rounded-lg p-0 ring-2 ring-[#7D39EB]/30 hover:ring-[#7D39EB] transition-all active:scale-95"
              aria-label="Menu tài khoản cá nhân"
            >
              <Avatar className="h-9 w-9 rounded-lg">
                <AvatarFallback className="bg-gradient-to-tr from-[#7D39EB] to-[#9A5CF8] text-white font-bold text-xs rounded-lg shadow-xs">
                  TL
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-lg p-1.5 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-xs font-bold leading-none text-foreground">
                  Taylor Sinh Viên
                </p>
                <p className="text-[11px] leading-none text-muted-foreground">
                  taylor@levrn.edu.vn
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 cursor-pointer text-xs rounded-md transition-colors hover:bg-muted/80">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Hồ sơ cá nhân</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer text-xs rounded-md transition-colors hover:bg-muted/80">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span>Cài đặt tài khoản</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive cursor-pointer text-xs rounded-md transition-colors hover:bg-destructive/10">
              <LogOut className="h-4 w-4" />
              <span>Đăng xuất</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
