"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  TrendingUp,
  Clock,
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  ArrowUpRight,
  CheckCircle2,
  BookOpen,
  Plus,
  Star,
  Layers,
  Palette,
  Code2,
  FileText,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useSubjects } from "@/hooks/useSubjects";
import { BrandLogo } from "@/components/ui/brand-logo";

/**
 * Trang Dashboard tổng quan thiết kế theo phong cách Eduplex
 * Bảng màu: Black (#000000), Violet (#7D39EB), Lime (#C6FF33), White (#FFFFFF)
 */
export default function DashboardPage() {
  const { subjects } = useSubjects();
  const [selectedDay, setSelectedDay] = useState("We");

  // Dữ liệu biểu đồ số giờ học các ngày trong tuần (Hours Activity)
  const weeklyHours = [
    { day: "Su", hours: 2.5, height: "35%" },
    { day: "Mo", hours: 5.5, height: "70%" },
    { day: "Tu", hours: 4.0, height: "55%" },
    { day: "We", hours: 6.8, height: "88%", active: true, label: "6h 45m" },
    { day: "Th", hours: 5.0, height: "65%" },
    { day: "Fr", hours: 2.0, height: "30%" },
    { day: "Sa", hours: 4.5, height: "60%" },
  ];

  // Lịch học trong ngày (Daily Schedule)
  const dailySchedules = [
    {
      title: "Giải Tích & Đại Số",
      type: "Lecture - Class",
      time: "08:00 - 10:30",
      color: "bg-[#7D39EB]/15 text-[#7D39EB]",
      icon: Code2,
    },
    {
      title: "Cấu Trúc Dữ Liệu",
      type: "Group - Test",
      time: "10:45 - 12:15",
      color: "bg-[#C6FF33]/25 text-[#2B4B00] dark:text-[#C6FF33]",
      icon: Layers,
    },
    {
      title: "Tiếng Anh Chuyên Ngành",
      type: "Lecture - Presentation",
      time: "13:30 - 15:00",
      color: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
      icon: FileText,
    },
    {
      title: "Thiết Kế Giao Diện UI/UX",
      type: "Studio - Lab",
      time: "15:30 - 17:00",
      color: "bg-pink-500/15 text-pink-600 dark:text-pink-400",
      icon: Palette,
    },
  ];

  // Nhiệm vụ & Deadline (Assignments)
  const assignments = [
    {
      title: "Bài tập lớn Giải tích",
      due: "22 Tháng 9, 10:30 AM",
      status: "In progress",
      badgeClass: "bg-[#7D39EB]/15 text-[#7D39EB] border-[#7D39EB]/30",
    },
    {
      title: "Thuyết trình Tiếng Anh",
      due: "24 Tháng 9, 08:00 AM",
      status: "Completed",
      badgeClass: "bg-[#C6FF33]/30 text-[#1F3E00] dark:text-[#C6FF33] border-[#C6FF33]/40",
    },
    {
      title: "Đồ án Cấu trúc dữ liệu",
      due: "28 Tháng 9, 11:59 PM",
      status: "Upcoming",
      badgeClass: "bg-muted text-muted-foreground border-border",
    },
  ];

  // Dữ liệu ngày trong tháng (Calendar Grid)
  const calendarDays = [
    { day: 28, currentMonth: false },
    { day: 29, currentMonth: false },
    { day: 30, currentMonth: false },
    { day: 1, currentMonth: true },
    { day: 2, currentMonth: true },
    { day: 3, currentMonth: true },
    { day: 4, currentMonth: true },
    { day: 5, currentMonth: true },
    { day: 6, currentMonth: true },
    { day: 7, currentMonth: true },
    { day: 8, currentMonth: true },
    { day: 9, currentMonth: true },
    { day: 10, currentMonth: true },
    { day: 11, currentMonth: true },
    { day: 12, currentMonth: true },
    { day: 13, currentMonth: true },
    { day: 14, currentMonth: true },
    { day: 15, currentMonth: true },
    { day: 16, currentMonth: true },
    { day: 17, currentMonth: true, isToday: true }, // Highlighted in Lime!
    { day: 18, currentMonth: true },
    { day: 19, currentMonth: true },
    { day: 20, currentMonth: true },
    { day: 21, currentMonth: true },
    { day: 22, currentMonth: true },
    { day: 23, currentMonth: true },
    { day: 24, currentMonth: true },
    { day: 25, currentMonth: true },
    { day: 26, currentMonth: true },
    { day: 27, currentMonth: true },
    { day: 28, currentMonth: true },
    { day: 29, currentMonth: true },
    { day: 30, currentMonth: true },
    { day: 31, currentMonth: true },
    { day: 1, currentMonth: false },
  ];

  return (
    <div className="space-y-7 animate-in fade-in-50 duration-300">
      {/* 1. Greeting Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
            <span>Welcome back Taylor</span>
            <span className="text-2xl">👋</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Hôm nay bạn có 4 phiên học và 2 mục tiêu cần hoàn thành.
          </p>
        </div>

        <Button
          asChild
          className="gap-2 bg-[#7D39EB] hover:bg-[#682BCA] text-white rounded-md shadow-md font-semibold self-start sm:self-center transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
        >
          <Link href="/subjects">
            <BookOpen className="h-4 w-4 transition-transform group-hover:scale-110" />
            <span>Xem Môn Học Của Tôi</span>
          </Link>
        </Button>
      </div>

      {/* 2. Top Row: 3 Khóa học / Môn học tiêu biểu + 1 Card Promo Dark "Go Premium" */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* 3 Course Cards (chiếm 3 cột trên lg) */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <span>Môn Học Đang Quan Tâm</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#C6FF33] animate-pulse" />
            </h3>
            <Link
              href="/subjects"
              className="text-xs font-semibold text-[#7D39EB] hover:underline transition-colors hover:text-[#9A5CF8]"
            >
              Xem tất cả →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Card 1 */}
            <Card className="rounded-lg border-border/70 hover:shadow-xl hover:border-[#7D39EB]/50 transition-all duration-300 hover:-translate-y-1 bg-card/90 group cursor-pointer">
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                <div className="flex items-start justify-between">
                  <div className="h-10 w-10 rounded-md bg-orange-500/15 flex items-center justify-center text-orange-600 transition-transform group-hover:scale-110 duration-200">
                    <FileText className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                    12 Buổi học
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground mb-1 line-clamp-1 group-hover:text-[#7D39EB] transition-colors">
                    Content Writing
                  </h4>
                  <p className="text-[11px] text-muted-foreground">Kỹ năng viết học thuật</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px]">
                  <span className="flex items-center gap-1 font-bold text-foreground">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    4.8
                  </span>
                  <span className="font-medium text-muted-foreground">Research</span>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Lime Accent */}
            <Card className="rounded-lg border-border/70 hover:shadow-xl hover:border-[#C6FF33]/60 transition-all duration-300 hover:-translate-y-1 bg-card/90 relative overflow-hidden group cursor-pointer">
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                <div className="flex items-start justify-between">
                  <div className="h-10 w-10 rounded-md bg-[#C6FF33]/30 flex items-center justify-center text-[#1E3B00] dark:text-[#C6FF33] transition-transform group-hover:scale-110 duration-200">
                    <Palette className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                    15 Buổi học
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground mb-1 line-clamp-1 group-hover:text-[#C6FF33] transition-colors">
                    Usability Testing
                  </h4>
                  <p className="text-[11px] text-muted-foreground">Trải nghiệm người dùng</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px]">
                  <span className="flex items-center gap-1 font-bold text-foreground">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    5.0
                  </span>
                  <span className="font-medium text-muted-foreground">UI/UX Design</span>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Violet Accent */}
            <Card className="rounded-lg border-border/70 hover:shadow-xl hover:border-[#7D39EB]/50 transition-all duration-300 hover:-translate-y-1 bg-card/90 group cursor-pointer">
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                <div className="flex items-start justify-between">
                  <div className="h-10 w-10 rounded-md bg-[#7D39EB]/15 flex items-center justify-center text-[#7D39EB] transition-transform group-hover:scale-110 duration-200">
                    <Video className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                    8 Buổi học
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground mb-1 line-clamp-1 group-hover:text-[#7D39EB] transition-colors">
                    Photography &amp; Media
                  </h4>
                  <p className="text-[11px] text-muted-foreground">Nhiếp ảnh &amp; Dựng phim</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px]">
                  <span className="flex items-center gap-1 font-bold text-foreground">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    4.6
                  </span>
                  <span className="font-medium text-muted-foreground">Art &amp; Design</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 1 Dark Card Promo (chuẩn Go Premium phong cách tech) */}
        <div className="lg:col-span-1 flex flex-col justify-end">
          <Card className="rounded-lg bg-[#13151B] text-white border border-[#232734] shadow-xl overflow-hidden relative transition-all duration-300 hover:-translate-y-1 hover:border-[#C6FF33]/40 group">
            <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BrandLogo
                    variant="icon"
                    className="h-6 w-6 rounded-md shadow-xs transition-transform group-hover:scale-105"
                    alt="LEVRN Pro"
                  />
                  <span className="text-xs font-bold tracking-wide">LEVRN Pro</span>
                </div>
                <Badge className="bg-[#C6FF33]/20 text-[#C6FF33] border-0 text-[10px] font-bold rounded-md">
                  2024
                </Badge>
              </div>

              <div>
                <h4 className="font-extrabold text-base leading-tight mb-1 text-white group-hover:text-[#C6FF33] transition-colors">
                  Mục Tiêu Học Kỳ
                </h4>
                <p className="text-xs text-zinc-400 leading-snug">
                  Mở khóa tính năng tính điểm GPA tự động và lập lịch Pomodoro.
                </p>
              </div>

              <Button
                asChild
                className="w-full bg-[#C6FF33] hover:bg-[#B5F51B] text-black font-extrabold rounded-md shadow-md text-xs h-9 transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
              >
                <Link href="/goals">
                  Khám phá ngay
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 3. Middle Row: Hours Activity (Biểu đồ số giờ) + Daily Schedule (Lịch hôm nay) + Calendar (Lịch tháng) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Widget 1: Hours Activity */}
        <Card className="rounded-lg border-border/70 bg-card p-5 shadow-xs flex flex-col justify-between transition-all duration-300 hover:border-border/90 hover:shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-foreground">Hours Activity</h3>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-[#C6FF33] font-semibold mt-0.5">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>+3% so với tuần trước</span>
              </div>
            </div>
            <div className="text-xs px-2.5 py-1 rounded-md bg-muted font-medium text-foreground">
              Weekly
            </div>
          </div>

          {/* Biểu đồ cột */}
          <div className="h-44 flex items-end justify-between gap-2 pt-6 px-2 relative">
            {/* Tooltip active trên cột Wednesday */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#13151B] text-white text-[10px] font-bold px-3 py-1.5 rounded-md shadow-lg flex items-center gap-1.5 border border-[#2B3040] animate-bounce">
              <span className="h-2 w-2 rounded-full bg-[#C6FF33] animate-pulse" />
              <span>6h 45 min • Thứ Tư</span>
            </div>

            {weeklyHours.map((item) => (
              <div
                key={item.day}
                className="flex-1 flex flex-col items-center gap-2 group cursor-pointer"
                onClick={() => setSelectedDay(item.day)}
              >
                <div className="w-full flex items-end justify-center h-32">
                  <div
                    className={`w-3.5 sm:w-4 rounded-sm transition-all duration-300 group-hover:scale-y-105 ${
                      item.day === selectedDay
                        ? "bg-[#C6FF33] shadow-md shadow-[#C6FF33]/40"
                        : "bg-zinc-800 dark:bg-zinc-700 group-hover:bg-[#7D39EB]"
                    }`}
                    style={{ height: item.height }}
                  />
                </div>
                <span
                  className={`text-xs font-semibold transition-colors ${
                    item.day === selectedDay
                      ? "text-foreground font-extrabold"
                      : "text-muted-foreground group-hover:text-foreground"
                  }`}
                >
                  {item.day}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Widget 2: Daily Schedule */}
        <Card className="rounded-lg border-border/70 bg-card p-5 shadow-xs flex flex-col justify-between transition-all duration-300 hover:border-border/90 hover:shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-base text-foreground">Daily Schedule</h3>
            <span className="text-xs font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">Hôm nay</span>
          </div>

          <div className="space-y-2">
            {dailySchedules.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-md hover:bg-muted/70 transition-all duration-200 hover:translate-x-1 group cursor-pointer border border-transparent hover:border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${item.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-foreground group-hover:text-[#7D39EB] transition-colors line-clamp-1">
                        {item.title}
                      </h4>
                      <p className="text-[10px] text-muted-foreground">
                        {item.type} • {item.time}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </div>
              );
            })}
          </div>
        </Card>

        {/* Widget 3: Mini Calendar Widget */}
        <Card className="rounded-lg border-border/70 bg-card p-5 shadow-xs flex flex-col justify-between transition-all duration-300 hover:border-border/90 hover:shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-[#7D39EB]" />
              <span className="font-bold text-sm text-foreground">Tháng 9, 2024</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <button className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center transition-colors active:scale-90">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center transition-colors active:scale-90">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Lịch ngày */}
          <div>
            <div className="grid grid-cols-7 gap-1 text-center mb-1 text-[11px] font-bold text-muted-foreground">
              <span>S</span>
              <span>M</span>
              <span>T</span>
              <span>W</span>
              <span>T</span>
              <span>F</span>
              <span>S</span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {calendarDays.slice(0, 28).map((d, i) => (
                <div
                  key={i}
                  className={`h-7 w-7 mx-auto rounded-md flex items-center justify-center text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    d.isToday
                      ? "bg-[#C6FF33] text-black font-extrabold shadow-sm scale-105"
                      : d.currentMonth
                      ? "text-foreground hover:bg-muted hover:scale-105"
                      : "text-muted-foreground/30"
                  }`}
                >
                  {d.day}
                </div>
              ))}
            </div>
          </div>

          {/* Ghi chú nhỏ dưới lịch */}
          <div className="pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#C6FF33] animate-pulse" />
              Hôm nay (17/09)
            </span>
            <span className="font-semibold text-[#7D39EB]">4 phiên học</span>
          </div>
        </Card>
      </div>

      {/* 4. Bottom Row: Course You're Taking + Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Khóa học đang học (Course You're Taking) */}
        <Card className="lg:col-span-2 rounded-lg border-border/70 bg-card p-5 shadow-xs transition-all duration-300 hover:shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-foreground">
              Môn Học Đang Theo Đuổi (Course You're Taking)
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded-md bg-muted font-medium text-foreground">
                Active
              </span>
              <Button asChild size="icon" className="h-7 w-7 rounded-md bg-[#C6FF33] hover:bg-[#B5F51B] text-black transition-transform hover:rotate-90 duration-200 active:scale-90">
                <Link href="/subjects">
                  <Plus className="h-3.5 w-3.5 stroke-[3]" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {/* Item 1 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-muted/30 border border-border/50 hover:border-[#7D39EB]/50 transition-all duration-200 hover:-translate-y-0.5 group">
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-md bg-[#7D39EB]/15 text-[#7D39EB] flex items-center justify-center font-bold text-xs transition-transform group-hover:scale-105">
                  3D
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground group-hover:text-[#7D39EB] transition-colors">
                    3D Design &amp; Modeling Course
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Giảng viên: TS. Michael Andrew • Còn 8h 45 min
                  </p>
                </div>
              </div>

              {/* Tiến độ % */}
              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                <div className="w-28 h-2 rounded-sm bg-muted overflow-hidden">
                  <div className="h-full rounded-sm bg-[#C6FF33] transition-all duration-500" style={{ width: "45%" }} />
                </div>
                <span className="text-xs font-bold text-foreground w-9 text-right font-mono">
                  45%
                </span>
              </div>
            </div>

            {/* Item 2 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-muted/30 border border-border/50 hover:border-[#7D39EB]/50 transition-all duration-200 hover:-translate-y-0.5 group">
              <div className="flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-md bg-pink-500/15 text-pink-600 flex items-center justify-center font-bold text-xs transition-transform group-hover:scale-105">
                  DEV
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground group-hover:text-pink-600 transition-colors">
                    Fullstack Development Basics
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Giảng viên: ThS. Natalia Vaman • Còn 18h 12 min
                  </p>
                </div>
              </div>

              {/* Tiến độ % */}
              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                <div className="w-28 h-2 rounded-sm bg-muted overflow-hidden">
                  <div className="h-full rounded-sm bg-[#7D39EB] transition-all duration-500" style={{ width: "75%" }} />
                </div>
                <span className="text-xs font-bold text-foreground w-9 text-right font-mono">
                  75%
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Nhiệm vụ & Deadlines (Assignments) */}
        <Card className="lg:col-span-1 rounded-lg border-border/70 bg-card p-5 shadow-xs flex flex-col justify-between transition-all duration-300 hover:shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-foreground">Assignments</h3>
              <button className="h-7 w-7 rounded-md bg-[#C6FF33] hover:bg-[#B5F51B] text-black flex items-center justify-center transition-transform hover:rotate-90 duration-200 active:scale-90">
                <Plus className="h-3.5 w-3.5 stroke-[3]" />
              </button>
            </div>

            <div className="space-y-2.5">
              {assignments.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-md bg-muted/40 border border-border/40 hover:border-border transition-all duration-200 hover:-translate-y-0.5 group"
                >
                  <div>
                    <h4 className="font-bold text-xs text-foreground group-hover:text-[#7D39EB] transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {item.due}
                    </p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] font-bold rounded-md px-2 py-0.5 ${item.badgeClass}`}>
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-border/50 text-center">
            <Link
              href="/goals"
              className="text-xs font-bold text-[#7D39EB] hover:underline transition-colors hover:text-[#9A5CF8]"
            >
              Xem toàn bộ danh sách hạn nộp →
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
