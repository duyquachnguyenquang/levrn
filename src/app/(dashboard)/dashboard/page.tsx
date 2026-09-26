"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Clock,
  Timer,
  CheckSquare,
  CalendarCheck,
  BookOpen,
  Folder,
  ExternalLink,
  MapPin,
  Calendar as CalendarIcon,
  ArrowRight,
  GraduationCap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSubjects } from "@/hooks/useSubjects";
import { useStudyPlans } from "@/hooks/useStudyPlans";
import { useCourseGrades } from "@/hooks/useCourseGrades";
import { useAttendance } from "@/hooks/useAttendance";
import { useNotifications } from "@/hooks/useNotifications";
import { getSubjectCheckinStatus } from "@/lib/checkinUtils";
import { CheckCircle2 } from "lucide-react";
import {
  ScheduleCalendar,
  toDateKey,
  calculateAllSessions,
} from "@/components/dashboard/ScheduleCalendar";

import { cn } from "@/lib/utils";
import { MarqueeText } from "@/components/ui/marquee-text";

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

// Định dạng ngày ngắn gọn (VD: 23/09 hoặc Hôm nay)
function formatShortDate(dateStr: string, todayKey: string): string {
  if (!dateStr) return "";
  if (dateStr === todayKey) return "Hôm nay";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  return dateStr;
}

export default function DashboardPage() {
  const { subjects } = useSubjects();
  const {
    tasks: planTasks,
    stats: planStats,
    addTask: addPlanTask,
    updateTask: updatePlanTask,
    refreshTasks: refreshPlanTasks,
  } = useStudyPlans();
  const { cumulativeGPA } = useCourseGrades();
  const [greeting, setGreeting] = useState<string>("Chào buổi sáng");

  // Điểm danh & Thông báo
  const { records: attendanceRecords, checkinSubjectToday } = useAttendance(subjects);
  const { addNotification } = useNotifications();
  const [checkinToast, setCheckinToast] = useState<string | null>(null);

  const handleCheckin = async (subject: any) => {
    const res = await checkinSubjectToday(subject);
    if (res.success) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const dateStr = now.toLocaleDateString("vi-VN");
      const status = getSubjectCheckinStatus(subject, attendanceRecords);

      await addNotification({
        title: `Điểm danh thành công: [${subject.code}] ${subject.name}`,
        message: `Bạn đã điểm danh lúc ${timeStr} ngày ${dateStr} (Buổi ${status.sessionNumber}/${status.totalWeeks}). Dữ liệu thời gian điểm danh và tiến độ ngày học đã được cập nhật vào cơ sở dữ liệu.`,
        type: "success",
        category: "attendance",
        link: "/dashboard",
      });

      setCheckinToast(`Đã điểm danh môn [${subject.code}] ${subject.name} lúc ${timeStr}!`);
      setTimeout(() => setCheckinToast(null), 4500);
    }
  };

  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => toDateKey(today), [today]);

  // Ngày đang được chọn để theo dõi lịch học trong ngày (mặc định hôm nay, hoặc ngày đầu tiên có lịch)
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    return toDateKey(today);
  });

  useEffect(() => {
    setGreeting(getTimeBasedGreeting());
  }, []);

  // Tính toàn bộ các buổi học
  const allSessionsMap = useMemo(() => {
    return calculateAllSessions(subjects);
  }, [subjects]);

  // Danh sách các buổi học của ngày được chọn
  const activeDaySessions = useMemo(() => {
    return allSessionsMap.get(selectedDateStr) || [];
  }, [allSessionsMap, selectedDateStr]);

  return (
    <div className="space-y-6 sm:space-y-7 animate-in fade-in-50 duration-300">
      {/* Toast thông báo điểm danh thành công */}
      {checkinToast && (
        <div className="p-3.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between gap-3 shadow-md animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>{checkinToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setCheckinToast(null)}
            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer font-bold"
          >
            Đóng
          </button>
        </div>
      )}

      {/* 1. Lời chào theo thời gian & Badge GPA tích lũy nhanh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
          <span>{greeting}, Taylor</span>
          <span className="text-2xl">👋</span>
        </h2>

        {cumulativeGPA.cumulativeGPA4 > 0 && (
          <Link
            href="/grades"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-border/80 bg-card hover:border-[#7D39EB]/50 hover:bg-muted/30 transition-all text-xs font-semibold shadow-xs group w-fit"
            title="Xem chi tiết bảng điểm và GPA"
          >
            <div className="h-6 w-6 rounded-lg bg-[#7D39EB]/15 text-[#7D39EB] flex items-center justify-center">
              <GraduationCap className="h-3.5 w-3.5" />
            </div>
            <span>
              GPA Tích lũy:{" "}
              <strong className="font-mono text-sm font-black text-[#7D39EB]">
                {cumulativeGPA.cumulativeGPA4.toFixed(2)}
              </strong>
              /4.0 ({cumulativeGPA.academicStanding})
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>


      {/* 2. Hàng 3 Box đồng cấp: Thời gian học tập, Bài tập, Lịch học trong ngày */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Box 1: Thời gian học tập (Đang phát triển) */}
        <Card className="rounded-lg border border-border/80 bg-card p-5 shadow-xs flex flex-col justify-between transition-all duration-300 hover:border-border/90 hover:shadow-md">
          {/* Header CHỈ CÓ Tiêu đề & Badge */}
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-[#7D39EB]/15 text-[#7D39EB] flex items-center justify-center shrink-0">
                <Clock className="h-4 w-4" />
              </div>
              <h3 className="font-extrabold text-base text-foreground leading-tight">
                Thời gian học tập
              </h3>
            </div>
            <Badge
              variant="outline"
              className="bg-[#7D39EB]/15 text-[#7D39EB] border-[#7D39EB]/30 font-bold text-[10px] px-2 py-0.5 shrink-0"
            >
              Đang phát triển
            </Badge>
          </div>

          {/* Thân Box tối giản, không văn bản dài */}
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
            <div className="h-12 w-12 rounded-lg bg-[#7D39EB]/10 flex items-center justify-center text-[#7D39EB]">
              <Timer className="h-6 w-6" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              Tính năng Pomodoro &amp; Thống kê giờ học
            </span>
          </div>
        </Card>

        {/* Box 2: Kế hoạch học tập */}
        <Link href="/plans" className="block group">
          <Card className="rounded-lg border border-border/80 bg-card p-5 shadow-xs flex flex-col justify-between transition-all duration-300 hover:border-[#C6FF33]/60 hover:shadow-md h-full cursor-pointer">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-[#C6FF33]/25 text-[#1F3E00] dark:text-[#C6FF33] flex items-center justify-center shrink-0">
                  <CheckSquare className="h-4 w-4" />
                </div>
                <h3 className="font-extrabold text-base text-foreground leading-tight">
                  Kế hoạch học tập
                </h3>
              </div>
              <Badge
                variant="outline"
                className="bg-[#C6FF33]/20 text-[#2B4B00] dark:text-[#C6FF33] border-[#C6FF33]/40 font-bold text-[10px] px-2 py-0.5 shrink-0"
              >
                Hoạt động
              </Badge>
            </div>

            {/* Thân Box */}
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-foreground">
                  {planStats.todayCount}
                </span>
                <span className="text-xs font-bold text-muted-foreground">nhiệm vụ hôm nay</span>
              </div>
              <p className="text-xs font-medium text-muted-foreground">
                Đã hoàn thành {planStats.todayCompletedCount}/{planStats.todayCount} nhiệm vụ
              </p>
              <div className="flex items-center gap-1 text-xs font-bold text-[#7D39EB] dark:text-[#C6FF33] group-hover:translate-x-0.5 transition-transform pt-1">
                <span>Xem và điều chỉnh lịch học</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </Card>
        </Link>

        {/* Box 3: Lịch học trong ngày (Đưa ra thành Box độc lập đồng cấp) */}
        <Card className="rounded-lg border border-border/80 bg-card p-5 shadow-xs flex flex-col justify-between transition-all duration-300 hover:border-border/90 hover:shadow-md">
          {/* Header CHỈ CÓ Tiêu đề & Badge ngày */}
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-[#7D39EB]/15 text-[#7D39EB] flex items-center justify-center shrink-0">
                <CalendarCheck className="h-4 w-4" />
              </div>
              <h3 className="font-extrabold text-base text-foreground leading-tight">
                Lịch học trong ngày
              </h3>
            </div>
            <Badge
              className={cn(
                "font-bold text-[10px] px-2 py-0.5 rounded-md",
                activeDaySessions.length > 0
                  ? "bg-[#7D39EB] text-white"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {formatShortDate(selectedDateStr, todayKey)} ({activeDaySessions.length})
            </Badge>
          </div>

          {/* Danh sách ca học diễn ra trong ngày */}
          <div className="py-2 space-y-2.5 max-h-[190px] overflow-y-auto pr-1">
            {activeDaySessions.length > 0 ? (
              activeDaySessions.map((ses, idx) => {
                const sub = ses.subject;
                const subColor = sub.color || "#7D39EB";
                const isToday = selectedDateStr === todayKey;
                const checkinStatus = getSubjectCheckinStatus(sub, attendanceRecords);

                return (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-muted/40 border border-border/60 relative overflow-hidden text-left"
                  >
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1"
                      style={{ backgroundColor: subColor }}
                    />
                    <div className="pl-1.5 space-y-1">
                      {/* Giờ học & Mã môn & Nút Điểm danh */}
                      <div className="flex items-center justify-between gap-1 text-[11px]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="font-mono font-black px-1.5 py-0.5 rounded-xs text-[10px]"
                            style={{
                              backgroundColor: `${subColor}20`,
                              color: subColor,
                            }}
                          >
                            {sub.code}
                          </span>

                          {(sub.startTime || sub.endTime) && (
                            <span className="font-mono font-bold text-foreground flex items-center gap-1 text-[10px]">
                              <Clock className="h-3 w-3 text-[#7D39EB]" />
                              {sub.startTime && sub.endTime
                                ? `${sub.startTime} - ${sub.endTime}`
                                : sub.startTime || sub.endTime}
                            </span>
                          )}
                        </div>

                        {/* Điểm danh cho ca học hôm nay */}
                        {isToday && (
                          <div className="shrink-0">
                            {checkinStatus.canCheckin ? (
                              <Button
                                size="sm"
                                onClick={() => handleCheckin(sub)}
                                className="h-6 px-2 bg-[#C6FF33] hover:bg-[#b2f310] text-black font-black text-[10px] rounded-md shadow-2xs transition-all active:scale-95 flex items-center gap-1"
                                title="Bấm điểm danh cho ca học này"
                              >
                                <CheckCircle2 className="h-3 w-3 stroke-[2.5]" />
                                <span>Điểm danh</span>
                              </Button>
                            ) : checkinStatus.isCheckedIn ? (
                              <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded-md">
                                <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                                <span>Đã điểm danh</span>
                              </span>
                            ) : (
                              <span className="text-[9.5px] font-medium text-amber-700 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                                Chưa tới giờ
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Tên môn với Marquee & Tiến độ */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <MarqueeText
                            text={sub.name}
                            className="font-bold text-xs text-foreground"
                          />
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                          {checkinStatus.attendedCount}/{checkinStatus.totalWeeks} buổi
                        </span>
                      </div>

                      {/* Phòng học & Cơ sở (với link Google Maps và Marquee) */}
                      {(sub.room || sub.campus) && (
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5 border-t border-border/40 gap-1">
                          <div className="flex items-center gap-1 min-w-0 flex-1 overflow-hidden">
                            <MapPin className="h-3 w-3 text-[#C6FF33] shrink-0" />
                            <div className="overflow-hidden flex-1">
                              <MarqueeText
                                text={`${sub.room ? `P.${sub.room}` : ""}${sub.room && sub.campus ? " • " : ""}${sub.campus || ""}`}
                                className="text-[10px] text-muted-foreground"
                              />
                            </div>
                          </div>

                          {(sub.mapUrl || sub.campus) && (
                            <a
                              href={sub.mapUrl || `https://maps.google.com/?q=${encodeURIComponent(sub.campus || "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-bold text-[#7D39EB] hover:underline flex items-center gap-0.5 shrink-0 ml-1"
                              title="Xem vị trí trên Google Maps"
                            >
                              <span>Bản đồ</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-7 flex flex-col items-center justify-center text-center text-muted-foreground">
                <p className="text-xs font-semibold text-foreground/80">
                  Không có lịch học trong ngày
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Nhấp chọn ngày trên Lịch học để xem ca học
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 3. Lịch học hoàn thiện (Toàn chiều rộng) */}
      <ScheduleCalendar
        subjects={subjects}
        selectedDateStr={selectedDateStr}
        onSelectDate={setSelectedDateStr}
        tasks={planTasks}
        onAddTask={addPlanTask}
        onUpdateTask={updatePlanTask}
        onRefreshTasks={refreshPlanTasks}
      />
    </div>
  );
}
