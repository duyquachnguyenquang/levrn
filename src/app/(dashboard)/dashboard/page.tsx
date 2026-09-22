"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  Timer,
  Layers,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useSubjects } from "@/hooks/useSubjects";
import { ScheduleCalendar } from "@/components/dashboard/ScheduleCalendar";

// Tính câu chào dựa theo thời điểm trong ngày
function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) {
    return "Chào buổi sáng";
  } else if (hour >= 11 && hour < 13.5) {
    return "Chào buổi trưa";
  } else if (hour >= 13.5 && hour < 18) {
    return "Chào buổi chiều";
  } else {
    return "Chào buổi tối";
  }
}

/**
 * Trang Dashboard tổng quan thiết kế theo phong cách Eduplex
 * Bảng màu: Black (#000000), Violet (#7D39EB), Lime (#C6FF33), White (#FFFFFF)
 */
export default function DashboardPage() {
  const { subjects } = useSubjects();
  const [greeting, setGreeting] = useState<string>("Chào buổi sáng");

  useEffect(() => {
    setGreeting(getTimeBasedGreeting());
  }, []);

  return (
    <div className="space-y-6 sm:space-y-7 animate-in fade-in-50 duration-300">
      {/* 1. Lời chào theo thời gian */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
          <span>{greeting}, Taylor</span>
          <span className="text-2xl">👋</span>
        </h2>
      </div>

      {/* 2. Hai thẻ tính năng đang phát triển: Thời gian học tập & Lịch học trong ngày */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Thẻ 1: Thời gian học tập */}
        <Card className="rounded-xl border border-border/80 bg-card p-5 shadow-xs flex flex-col justify-between transition-all duration-300 hover:border-border/90 hover:shadow-md relative overflow-hidden group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-[#7D39EB]/15 text-[#7D39EB] flex items-center justify-center shrink-0">
                  <Clock className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-foreground leading-tight">
                    Thời gian học tập
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Theo dõi số giờ ôn luyện và học tập
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="bg-[#7D39EB]/15 text-[#7D39EB] border-[#7D39EB]/30 font-bold text-[11px] px-2.5 py-0.5 shrink-0"
              >
                Đang phát triển
              </Badge>
            </div>

            <div className="py-7 flex flex-col items-center justify-center text-center space-y-3 bg-muted/20 rounded-lg border border-dashed border-border/70 my-1">
              <div className="h-12 w-12 rounded-xl bg-[#7D39EB]/10 flex items-center justify-center text-[#7D39EB] relative">
                <Timer className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 text-sm animate-pulse">⚡</span>
              </div>
              <div className="space-y-1 max-w-[280px] px-2">
                <p className="text-xs font-bold text-foreground">
                  Đo lường thời lượng học tập tự động
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Tính năng theo dõi tổng giờ học, tích hợp đồng hồ bấm giờ Pomodoro và biểu đồ tiến độ đang được hoàn thiện.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-4 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#7D39EB] animate-pulse" />
              Công cụ Pomodoro &amp; Thống kê
            </span>
            <span className="font-semibold text-[#7D39EB]">Sắp ra mắt</span>
          </div>
        </Card>

        {/* Thẻ 2: Lịch học trong ngày */}
        <Card className="rounded-xl border border-border/80 bg-card p-5 shadow-xs flex flex-col justify-between transition-all duration-300 hover:border-border/90 hover:shadow-md relative overflow-hidden group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-[#C6FF33]/25 text-[#1F3E00] dark:text-[#C6FF33] flex items-center justify-center shrink-0">
                  <Layers className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-foreground leading-tight">
                    Lịch học trong ngày
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Lộ trình các phiên học diễn ra hôm nay
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="bg-[#C6FF33]/20 text-[#2B4B00] dark:text-[#C6FF33] border-[#C6FF33]/40 font-bold text-[11px] px-2.5 py-0.5 shrink-0"
              >
                Đang phát triển
              </Badge>
            </div>

            <div className="py-7 flex flex-col items-center justify-center text-center space-y-3 bg-muted/20 rounded-lg border border-dashed border-border/70 my-1">
              <div className="h-12 w-12 rounded-xl bg-[#C6FF33]/20 flex items-center justify-center text-[#2B4B00] dark:text-[#C6FF33] relative">
                <CalendarIcon className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 text-sm animate-pulse">📅</span>
              </div>
              <div className="space-y-1 max-w-[280px] px-2">
                <p className="text-xs font-bold text-foreground">
                  Lịch trình từng ca học chi tiết
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Tính năng nhắc nhở giờ vào lớp, thông báo phòng học và danh mục bài tập cần chuẩn bị trước ca học đang được phát triển.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-4 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#C6FF33] animate-pulse" />
              Lập lịch thông minh
            </span>
            <span className="font-semibold text-[#2B4B00] dark:text-[#C6FF33]">Sắp ra mắt</span>
          </div>
        </Card>
      </div>

      {/* 3. Phần Lịch Học tương tác hoàn thiện, liên kết trực tiếp với dữ liệu Quản lý môn học */}
      <ScheduleCalendar subjects={subjects} />
    </div>
  );
}
