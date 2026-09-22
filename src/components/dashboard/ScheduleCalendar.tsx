"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Folder,
  ExternalLink,
  GraduationCap,
  Sparkles,
  CalendarCheck,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Subject } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ScheduleCalendarProps {
  subjects: Subject[];
}

interface ClassSession {
  subject: Subject;
  dateStr: string;
  weekNumber: number;
}

// Chuyển đối tượng Date thành định dạng YYYY-MM-DD
function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Định dạng ngày hiển thị tiếng Việt (VD: Thứ Năm, 19/09/2024)
function formatFullDateVi(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (isNaN(date.getTime())) return dateStr;

  const dayNames = [
    "Chủ Nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
  ];
  const dayName = dayNames[date.getDay()];
  const formattedDay = String(d).padStart(2, "0");
  const formattedMonth = String(m).padStart(2, "0");

  return `${dayName}, ${formattedDay}/${formattedMonth}/${y}`;
}

export function ScheduleCalendar({ subjects }: ScheduleCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => toDateKey(today), [today]);

  // Tháng/năm đang xem
  // Nếu có môn học nhưng hôm nay chưa tới hoặc đã qua, vẫn mặc định ngày hôm nay hoặc tháng có môn học
  const initialDate = useMemo(() => {
    // Nếu có môn học và ngày hiện tại không trùng tháng nào của môn học, ưu tiên tháng bắt đầu của môn đầu tiên nếu có
    if (subjects.length > 0) {
      const firstWithDate = subjects.find((s) => s.startDate);
      if (firstWithDate && firstWithDate.startDate) {
        const [sy, sm] = firstWithDate.startDate.split("-").map(Number);
        // Kiểm tra xem năm hiện tại có chênh lệch lớn không (ví dụ dữ liệu demo 2024 so với 2026)
        if (Math.abs(today.getFullYear() - sy) >= 1) {
          return new Date(sy, sm - 1, 1);
        }
      }
    }
    return new Date();
  }, [subjects, today]);

  const [viewDate, setViewDate] = useState<Date>(initialDate);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    // Nếu ngày hôm nay nằm trong tháng ban đầu thì chọn hôm nay, ngược lại chọn ngày 1 của tháng
    const initKey = toDateKey(initialDate);
    return initKey;
  });

  // Tính toán toàn bộ các buổi học của tất cả môn học
  const sessionsByDate = useMemo(() => {
    const map = new Map<string, ClassSession[]>();

    subjects.forEach((subject) => {
      if (!subject.startDate) return;

      const [sy, sm, sd] = subject.startDate.split("-").map(Number);
      const start = new Date(sy, sm - 1, sd);
      if (isNaN(start.getTime())) return;

      const totalWeeks = subject.totalWeeks || 15;
      const scheduledDays =
        subject.scheduleDays && subject.scheduleDays.length > 0
          ? subject.scheduleDays
          : [start.getDay()];

      // Ngày kết thúc
      let endTimestamp = start.getTime() + totalWeeks * 7 * 86400000;
      if (subject.endDate) {
        const [ey, em, ed] = subject.endDate.split("-").map(Number);
        const end = new Date(ey, em - 1, ed, 23, 59, 59);
        if (!isNaN(end.getTime())) {
          endTimestamp = end.getTime();
        }
      }

      // Tạo lịch cho từng tuần
      for (let week = 0; week < totalWeeks; week++) {
        scheduledDays.forEach((dayOfWeek) => {
          // Tính độ lệch ngày so với ngày bắt đầu trong tuần đầu tiên
          const dayDiff = (dayOfWeek - start.getDay() + 7) % 7;
          const sessionTime = start.getTime() + (week * 7 + dayDiff) * 86400000;

          if (sessionTime <= endTimestamp) {
            const sessionDate = new Date(sessionTime);
            const dateKey = toDateKey(sessionDate);

            const session: ClassSession = {
              subject,
              dateStr: dateKey,
              weekNumber: week + 1,
            };

            const existing = map.get(dateKey) || [];
            map.set(dateKey, [...existing, session]);
          }
        });
      }
    });

    return map;
  }, [subjects]);

  // Điều hướng tháng
  const handlePrevMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleGoToday = () => {
    const now = new Date();
    setViewDate(now);
    setSelectedDateStr(toDateKey(now));
  };

  // Thông số của tháng đang xem
  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  // Lịch theo chuẩn T2 đến CN (Thứ 2 = 0 khoảng trống, CN = 6 khoảng trống)
  const leadingDays = (firstDayOfWeek + 6) % 7;

  // Ngày của tháng trước để lấp đầy hàng đầu
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  // Danh sách các ô ngày trong tháng (Grid)
  const calendarCells = useMemo(() => {
    const cells: Array<{
      day: number;
      dateKey: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      sessions: ClassSession[];
    }> = [];

    // Các ngày cuối tháng trước
    for (let i = leadingDays - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const prevDate = new Date(viewYear, viewMonth - 1, day);
      const dateKey = toDateKey(prevDate);
      cells.push({
        day,
        dateKey,
        isCurrentMonth: false,
        isToday: dateKey === todayKey,
        isSelected: dateKey === selectedDateStr,
        sessions: sessionsByDate.get(dateKey) || [],
      });
    }

    // Các ngày trong tháng hiện tại
    for (let day = 1; day <= daysInMonth; day++) {
      const curDate = new Date(viewYear, viewMonth, day);
      const dateKey = toDateKey(curDate);
      cells.push({
        day,
        dateKey,
        isCurrentMonth: true,
        isToday: dateKey === todayKey,
        isSelected: dateKey === selectedDateStr,
        sessions: sessionsByDate.get(dateKey) || [],
      });
    }

    // Các ngày đầu tháng sau để đủ bội số 7
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
      const nextDate = new Date(viewYear, viewMonth + 1, day);
      const dateKey = toDateKey(nextDate);
      cells.push({
        day,
        dateKey,
        isCurrentMonth: false,
        isToday: dateKey === todayKey,
        isSelected: dateKey === selectedDateStr,
        sessions: sessionsByDate.get(dateKey) || [],
      });
    }

    return cells;
  }, [viewYear, viewMonth, daysInMonth, leadingDays, prevMonthDays, todayKey, selectedDateStr, sessionsByDate]);

  // Các buổi học của ngày được chọn
  const selectedDaySessions = useMemo(() => {
    return sessionsByDate.get(selectedDateStr) || [];
  }, [selectedDateStr, sessionsByDate]);

  // Tổng số buổi học trong tháng đang xem
  const totalMonthSessions = useMemo(() => {
    let count = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const curDate = new Date(viewYear, viewMonth, day);
      const dateKey = toDateKey(curDate);
      const s = sessionsByDate.get(dateKey);
      if (s) count += s.length;
    }
    return count;
  }, [viewYear, viewMonth, daysInMonth, sessionsByDate]);

  const monthNames = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];

  const weekdayHeaders = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  return (
    <Card className="rounded-xl border border-border/80 bg-card shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
      <CardContent className="p-4 sm:p-6">
        {/* Header Widget Lịch học */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#7D39EB]/15 flex items-center justify-center text-[#7D39EB] shrink-0 shadow-xs">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg sm:text-xl text-foreground tracking-tight">
                  Lịch học
                </h3>
                <Badge
                  variant="outline"
                  className="bg-[#C6FF33]/15 text-[#1F3E00] dark:text-[#C6FF33] border-[#C6FF33]/30 font-bold text-[11px] px-2"
                >
                  {monthNames[viewMonth]} {viewYear}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Đồng bộ tự động từ ngày bắt đầu và lịch học của từng môn
              </p>
            </div>
          </div>

          {/* Cụm điều hướng tháng */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGoToday}
              className="text-xs font-bold h-8 px-2.5 rounded-md border-border/80 hover:border-[#7D39EB] hover:text-[#7D39EB] active:scale-95 transition-all"
            >
              Hôm nay
            </Button>
            <div className="flex items-center gap-1 border border-border/80 rounded-md p-0.5 bg-background">
              <button
                onClick={handlePrevMonth}
                aria-label="Tháng trước"
                className="h-7 w-7 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors active:scale-90"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNextMonth}
                aria-label="Tháng sau"
                className="h-7 w-7 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors active:scale-90"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Thân Lịch: Grid 12 cột (7 cột Calendar + 5 cột Chi tiết ngày) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5">
          {/* CỘT TRÁI (lg:col-span-7): Lịch Tháng */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
            <div>
              {/* Hàng tiêu đề thứ trong tuần */}
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {weekdayHeaders.map((d, idx) => (
                  <div
                    key={d}
                    className={cn(
                      "text-[11px] font-bold py-1",
                      idx >= 5 ? "text-amber-500/80 dark:text-amber-400/80" : "text-muted-foreground"
                    )}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Lưới các ô ngày */}
              <div className="grid grid-cols-7 gap-1.5 text-center">
                {calendarCells.map((cell, idx) => {
                  const hasSessions = cell.sessions.length > 0;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedDateStr(cell.dateKey)}
                      className={cn(
                        "relative h-11 sm:h-12 w-full rounded-lg flex flex-col items-center justify-between p-1.5 transition-all duration-200 cursor-pointer text-xs font-semibold select-none group",
                        // Ngày được chọn
                        cell.isSelected
                          ? "bg-[#7D39EB] text-white font-extrabold shadow-md shadow-[#7D39EB]/30 scale-[1.03] z-10"
                          : cell.isToday
                          ? "border-2 border-[#C6FF33] text-foreground font-black bg-[#C6FF33]/10"
                          : cell.isCurrentMonth
                          ? "text-foreground hover:bg-muted/80 hover:scale-102"
                          : "text-muted-foreground/30 hover:bg-muted/30"
                      )}
                    >
                      {/* Số ngày */}
                      <span className="text-xs leading-none">
                        {cell.day}
                      </span>

                      {/* Chấm chỉ báo môn học diễn ra trong ngày */}
                      <div className="flex items-center justify-center gap-1 mt-auto">
                        {hasSessions ? (
                          cell.sessions.slice(0, 3).map((ses, sIdx) => (
                            <span
                              key={sIdx}
                              className={cn(
                                "h-1.5 w-1.5 rounded-full transition-transform group-hover:scale-125",
                                cell.isSelected ? "bg-white" : ""
                              )}
                              style={{
                                backgroundColor: cell.isSelected
                                  ? "#FFFFFF"
                                  : ses.subject.color || "#C6FF33",
                              }}
                              title={`${ses.subject.code} - ${ses.subject.name}`}
                            />
                          ))
                        ) : (
                          <span className="h-1.5 w-1.5" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chú thích & Tóm tắt tháng */}
            <div className="pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full border border-[#C6FF33] bg-[#C6FF33]/40" />
                  Hôm nay
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#7D39EB]" />
                  Có lịch học
                </span>
              </div>
              <span className="font-medium">
                Tháng này có <strong className="text-foreground">{totalMonthSessions}</strong> buổi học
              </span>
            </div>
          </div>

          {/* CỘT PHẢI (lg:col-span-5): Chi tiết lịch học của ngày được chọn */}
          <div className="lg:col-span-5 flex flex-col justify-between p-4 rounded-lg bg-muted/30 border border-border/70 space-y-4">
            <div>
              {/* Header chi tiết ngày */}
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div>
                  <h4 className="font-extrabold text-sm text-foreground">
                    {formatFullDateVi(selectedDateStr)}
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    {selectedDateStr === todayKey ? "Hôm nay" : "Lịch học chi tiết"}
                  </p>
                </div>
                <Badge
                  className={cn(
                    "text-xs font-bold rounded-md px-2 py-0.5",
                    selectedDaySessions.length > 0
                      ? "bg-[#7D39EB]/15 text-[#7D39EB] border border-[#7D39EB]/30"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {selectedDaySessions.length > 0
                    ? `${selectedDaySessions.length} buổi học`
                    : "Nghỉ học"}
                </Badge>
              </div>

              {/* Danh sách các môn học trong ngày */}
              <div className="pt-3 space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {selectedDaySessions.length > 0 ? (
                  selectedDaySessions.map((session, idx) => {
                    const sub = session.subject;
                    const subColor = sub.color || "#7D39EB";

                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-card border border-border/70 shadow-xs hover:border-[#7D39EB]/50 transition-all duration-200 hover:-translate-y-0.5 relative overflow-hidden group"
                      >
                        {/* Vạch màu nhận diện bên trái */}
                        <div
                          className="absolute left-0 top-0 bottom-0 w-1 transition-all group-hover:w-1.5"
                          style={{ backgroundColor: subColor }}
                        />

                        <div className="pl-2">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-1.5 truncate">
                              <span
                                className="font-mono font-black text-[10px] px-1.5 py-0.5 rounded-sm tracking-wider"
                                style={{
                                  backgroundColor: `${subColor}20`,
                                  color: subColor,
                                }}
                              >
                                {sub.code}
                              </span>
                              {sub.category && (
                                <span className="text-[10px] font-semibold text-muted-foreground truncate">
                                  {sub.category}
                                </span>
                              )}
                            </div>

                            <span className="text-[10px] font-bold text-foreground bg-muted px-1.5 py-0.5 rounded-sm shrink-0">
                              Buổi {session.weekNumber}/{sub.totalWeeks || 15}
                            </span>
                          </div>

                          <h5 className="font-bold text-xs text-foreground group-hover:text-[#7D39EB] transition-colors line-clamp-1">
                            {sub.name}
                          </h5>

                          {/* Phím tắt liên kết LMS Course & Drive nếu có */}
                          {(sub.courseUrl || sub.driveUrl) && (
                            <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-border/50 text-[10px]">
                              {sub.courseUrl && (
                                <a
                                  href={sub.courseUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 font-semibold text-[#7D39EB] hover:underline"
                                  title="Mở LMS Course"
                                >
                                  <BookOpen className="h-3 w-3" />
                                  <span>LMS Course</span>
                                  <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                              )}
                              {sub.driveUrl && (
                                <a
                                  href={sub.driveUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 font-semibold text-muted-foreground hover:text-foreground hover:underline"
                                  title="Mở Google Drive"
                                >
                                  <Folder className="h-3 w-3" />
                                  <span>Drive</span>
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 flex flex-col items-center justify-center text-center space-y-2 text-muted-foreground">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground/60">
                      <CalendarCheck className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-semibold text-foreground/80">
                      Không có lịch học vào ngày này
                    </p>
                    <p className="text-[11px] text-muted-foreground max-w-[220px]">
                      Bạn có thể chọn các ngày có dấu chấm màu trên lịch để xem môn học tương ứng.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Thông tin môn học tổng quan */}
            <div className="pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5 text-[#7D39EB]" />
                <span>{subjects.length} môn học đã lưu</span>
              </span>
              <a
                href="/subjects"
                className="text-xs font-bold text-[#7D39EB] hover:underline hover:text-[#9A5CF8] transition-colors"
              >
                Quản lý môn học →
              </a>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
