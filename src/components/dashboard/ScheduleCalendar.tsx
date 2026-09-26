"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Folder,
  ExternalLink,
  MapPin,
  Clock,
  CalendarDays,
  CalendarRange,
  Plus,
} from "lucide-react";
import { Subject, StudyTask, StudyTaskFormData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TaskAssignModal } from "./TaskAssignModal";
import { useStudyPlans } from "@/hooks/useStudyPlans";
import { cn } from "@/lib/utils";

export interface ClassSession {
  subject: Subject;
  dateStr: string;
  weekNumber: number;
}

// Chuyển đối tượng Date thành định dạng YYYY-MM-DD
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Tính toán toàn bộ các buổi học của tất cả môn học
export function calculateAllSessions(subjects: Subject[]): Map<string, ClassSession[]> {
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

    let endTimestamp = start.getTime() + totalWeeks * 7 * 86400000;
    if (subject.endDate) {
      const [ey, em, ed] = subject.endDate.split("-").map(Number);
      const end = new Date(ey, em - 1, ed, 23, 59, 59);
      if (!isNaN(end.getTime())) {
        endTimestamp = end.getTime();
      }
    }

    for (let week = 0; week < totalWeeks; week++) {
      scheduledDays.forEach((dayOfWeek) => {
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
}

interface ScheduleCalendarProps {
  subjects: Subject[];
  selectedDateStr: string;
  onSelectDate: (dateStr: string) => void;
  tasks?: StudyTask[];
  onAddTask?: (
    formData: StudyTaskFormData
  ) => Promise<{ success: boolean; id: string; error?: string }>;
  onUpdateTask?: (
    id: string,
    updates: Partial<StudyTaskFormData>
  ) => Promise<{ success: boolean; error?: string }>;
  onRefreshTasks?: () => void;
}

export function ScheduleCalendar({
  subjects,
  selectedDateStr,
  onSelectDate,
  tasks: propTasks,
  onAddTask: propOnAddTask,
  onUpdateTask: propOnUpdateTask,
  onRefreshTasks: propOnRefreshTasks,
}: ScheduleCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => toDateKey(today), [today]);

  // Hook study plans dự phòng nếu props không truyền
  const fallbackPlans = useStudyPlans();
  const tasks = propTasks ?? fallbackPlans.tasks;
  const onAddTask = propOnAddTask ?? fallbackPlans.addTask;
  const onUpdateTask = propOnUpdateTask ?? fallbackPlans.updateTask;

  // Trạng thái modal thêm nhiệm vụ / gán hạn chót (+)
  const [isTaskAssignOpen, setIsTaskAssignOpen] = useState(false);

  // Chế độ xem: Tháng (M) hoặc Tuần (W)
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  // Ngày neo của lịch (viewDate)
  const [viewDate, setViewDate] = useState<Date>(() => {
    if (subjects.length > 0) {
      const firstWithDate = subjects.find((s) => s.startDate);
      if (firstWithDate && firstWithDate.startDate) {
        const [sy, sm] = firstWithDate.startDate.split("-").map(Number);
        if (Math.abs(today.getFullYear() - sy) >= 1) {
          return new Date(sy, sm - 1, 1);
        }
      }
    }
    return new Date();
  });

  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(viewDate.getFullYear());

  // Tính toàn bộ các buổi học
  const sessionsByDate = useMemo(() => {
    return calculateAllSessions(subjects);
  }, [subjects]);

  // Map các nhiệm vụ theo ngày (dateKey) dựa trên deadline hoặc date
  const tasksByDate = useMemo(() => {
    const map = new Map<string, StudyTask[]>();
    tasks.forEach((task) => {
      let dateKey: string | null = null;
      if (task.deadline) {
        if (
          task.deadline.length >= 10 &&
          task.deadline[4] === "-" &&
          task.deadline[7] === "-"
        ) {
          dateKey = task.deadline.substring(0, 10);
        } else {
          const d = new Date(task.deadline);
          if (!isNaN(d.getTime())) {
            dateKey = toDateKey(d);
          }
        }
      }
      if (!dateKey && task.date) {
        dateKey = task.date;
      }
      if (dateKey) {
        const list = map.get(dateKey) || [];
        map.set(dateKey, [...list, task]);
      }
    });
    return map;
  }, [tasks]);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  // Điều hướng
  const handlePrev = () => {
    if (viewMode === "month") {
      setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    } else {
      setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7));
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    } else {
      setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7));
    }
  };

  const handleGoToday = () => {
    const now = new Date();
    setViewDate(now);
    onSelectDate(toDateKey(now));
  };

  const handleSelectMonth = (mIndex: number) => {
    setViewDate(new Date(pickerYear, mIndex, 1));
    setMonthPickerOpen(false);
  };

  // Xử lý gán hoặc huỷ hạn chót từ modal
  const handleAssignDeadline = async (
    taskId: string,
    deadline: string,
    newDate?: string
  ) => {
    const res = await onUpdateTask(taskId, {
      deadline: deadline ? deadline : ("" as any),
      ...(newDate ? { date: newDate } : {}),
    });
    if (propOnRefreshTasks) {
      propOnRefreshTasks();
    }
    return res;
  };

  // Xử lý tạo nhiệm vụ mới từ modal
  const handleCreateTask = async (formData: StudyTaskFormData) => {
    const res = await onAddTask(formData);
    if (propOnRefreshTasks) {
      propOnRefreshTasks();
    }
    return res;
  };

  // --- TÍNH TOÁN DỮ LIỆU XEM THEO THÁNG ---
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const leadingDays = (firstDayOfWeek + 6) % 7;
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  const monthCells = useMemo(() => {
    const cells: Array<{
      day: number;
      dateKey: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      sessions: ClassSession[];
      tasks: StudyTask[];
    }> = [];

    // Tháng trước
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
        tasks: tasksByDate.get(dateKey) || [],
      });
    }

    // Tháng này
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
        tasks: tasksByDate.get(dateKey) || [],
      });
    }

    // Tháng sau
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
        tasks: tasksByDate.get(dateKey) || [],
      });
    }

    return cells;
  }, [
    viewYear,
    viewMonth,
    daysInMonth,
    leadingDays,
    prevMonthDays,
    todayKey,
    selectedDateStr,
    sessionsByDate,
    tasksByDate,
  ]);

  // --- TÍNH TOÁN DỮ LIỆU XEM THEO TUẦN ---
  const weekDays = useMemo(() => {
    const currentDay = viewDate.getDay();
    const diffToMon = (currentDay + 6) % 7;
    const monday = new Date(viewDate.getFullYear(), viewDate.getMonth(), viewDate.getDate() - diffToMon);

    const weekdayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
    const fullWeekdayNames = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const key = toDateKey(d);
      return {
        date: d,
        dateKey: key,
        dayNumber: d.getDate(),
        monthNumber: d.getMonth() + 1,
        weekdayShort: weekdayNames[i],
        weekdayFull: fullWeekdayNames[i],
        isToday: key === todayKey,
        isSelected: key === selectedDateStr,
        sessions: sessionsByDate.get(key) || [],
        tasks: tasksByDate.get(key) || [],
      };
    });
  }, [viewDate, todayKey, selectedDateStr, sessionsByDate, tasksByDate]);

  const weekdayHeaders = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  const monthNames = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
  ];

  return (
    <>
      <Card className="rounded-xl border border-border/80 bg-card shadow-xs overflow-hidden transition-all duration-300 hover:shadow-md">
        <CardContent className="p-4 sm:p-6 space-y-5">
          {/* Header Widget Lịch học: Bên trái CHỈ CÓ Header, Bên phải gồm Toàn bộ các công cụ điều khiển */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
            {/* Bên trái: CHỈ THỂ HIỆN HEADER */}
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-[#7D39EB]/15 flex items-center justify-center text-[#7D39EB] shrink-0">
                <CalendarIcon className="h-4.5 w-4.5" />
              </div>
              <h3 className="font-extrabold text-lg sm:text-xl text-foreground tracking-tight">
                Lịch học
              </h3>
            </div>

            {/* Bên phải: Nút chuyển Tháng/Tuần (M/W) + Bộ chọn Tháng, Năm + Hôm nay + Phím điều hướng (< >) + Nút thêm nhiệm vụ (+) */}
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
              {/* 1. Nút chuyển đổi xem Tháng (M) / Tuần (W) */}
              <div className="flex items-center rounded-lg bg-muted/60 p-0.5 border border-border/60">
                <button
                  type="button"
                  onClick={() => setViewMode("month")}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer",
                    viewMode === "month"
                      ? "bg-[#7D39EB] text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Chế độ xem Tháng (Month)"
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>M</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("week")}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer",
                    viewMode === "week"
                      ? "bg-[#7D39EB] text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Chế độ xem Tuần (Week)"
                >
                  <CalendarRange className="h-3.5 w-3.5" />
                  <span>W</span>
                </button>
              </div>

              {/* 2. Tính năng Chọn tháng, năm (Month & Year Picker Popover chuẩn Eduplex) */}
              <Popover open={monthPickerOpen} onOpenChange={setMonthPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 px-3 text-xs font-bold rounded-lg border-border/80 hover:border-[#7D39EB] hover:text-[#7D39EB] transition-all bg-background"
                  >
                    <span>{monthNames[viewMonth]} {viewYear}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-64 p-3 rounded-xl border-border/80 shadow-2xl bg-card text-foreground z-50 animate-in fade-in-50 zoom-in-95 duration-150"
                >
                  {/* Điều hướng Năm */}
                  <div className="flex items-center justify-between pb-2 border-b border-border/60 mb-2">
                    <button
                      type="button"
                      onClick={() => setPickerYear((y) => y - 1)}
                      className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      aria-label="Năm trước"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="font-extrabold text-xs text-foreground tracking-wide font-mono">
                      Năm {pickerYear}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPickerYear((y) => y + 1)}
                      className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      aria-label="Năm sau"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Danh sách 12 Tháng */}
                  <div className="grid grid-cols-3 gap-1.5 text-center text-xs font-semibold">
                    {monthNames.map((mName, mIdx) => {
                      const isSelected = viewMonth === mIdx && viewYear === pickerYear;
                      const isCurrent = today.getMonth() === mIdx && today.getFullYear() === pickerYear;

                      return (
                        <button
                          key={mIdx}
                          type="button"
                          onClick={() => handleSelectMonth(mIdx)}
                          className={cn(
                            "py-2 rounded-md transition-all cursor-pointer font-bold",
                            isSelected
                              ? "bg-[#7D39EB] text-white shadow-xs"
                              : isCurrent
                              ? "border border-[#C6FF33] text-[#7D39EB] dark:text-[#C6FF33] hover:bg-muted"
                              : "hover:bg-muted text-foreground/90"
                          )}
                        >
                          {mName.replace("Tháng ", "T")}
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>

              {/* 3. Nút nhảy nhanh về Hôm nay */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleGoToday}
                className="text-xs font-bold h-8 px-2.5 rounded-lg border-border/80 hover:border-[#7D39EB] hover:text-[#7D39EB] active:scale-95 transition-all bg-background"
              >
                Hôm nay
              </Button>

              {/* 4. Cụm mũi tên Trước / Sau (< >) */}
              <div className="flex items-center gap-0.5 border border-border/80 rounded-lg p-0.5 bg-background">
                <button
                  onClick={handlePrev}
                  aria-label="Trước"
                  className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors active:scale-90 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={handleNext}
                  aria-label="Sau"
                  className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors active:scale-90 cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* 5. Nút Thêm nhiệm vụ (+) bên phải 2 nút trái phải */}
              <Button
                type="button"
                size="sm"
                onClick={() => setIsTaskAssignOpen(true)}
                className="h-8 w-8 p-0 rounded-lg bg-[#7D39EB] hover:bg-[#6826d4] text-white shadow-xs hover:shadow transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
                title="Thêm nhiệm vụ &amp; Gán hạn chót từ Kế hoạch"
                aria-label="Thêm nhiệm vụ"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* NỘI DUNG 1: CHẾ ĐỘ XEM THÁNG (MONTH VIEW) */}
          {viewMode === "month" && (
            <div className="space-y-3 animate-in fade-in-50 duration-200">
              {/* Header các thứ trong tuần */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {weekdayHeaders.map((d, idx) => (
                  <div
                    key={d}
                    className={cn(
                      "text-xs font-bold py-1.5 select-none",
                      idx >= 5 ? "text-amber-500/80 dark:text-amber-400/80" : "text-muted-foreground"
                    )}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Lưới các ngày trong tháng */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
                {monthCells.map((cell, idx) => {
                  const hasSessions = cell.sessions.length > 0;
                  const hasTasks = cell.tasks.length > 0;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onSelectDate(cell.dateKey)}
                      className={cn(
                        "relative h-14 sm:h-16 w-full rounded-lg flex flex-col items-center justify-between p-1.5 transition-all duration-200 cursor-pointer text-xs font-semibold select-none group border",
                        cell.isSelected
                          ? "bg-[#7D39EB] text-white border-[#7D39EB] font-extrabold shadow-md shadow-[#7D39EB]/30 scale-[1.02] z-10"
                          : cell.isToday
                          ? "border-[#C6FF33] text-foreground font-black bg-[#C6FF33]/10"
                          : cell.isCurrentMonth
                          ? "bg-card border-border/60 text-foreground hover:border-[#7D39EB]/50 hover:bg-muted/50"
                          : "bg-muted/10 border-transparent text-muted-foreground/30 hover:bg-muted/30"
                      )}
                    >
                      {/* Hàng trên: Số ngày & Huy hiệu hạn chót nếu có */}
                      <div className="w-full flex items-center justify-between px-0.5">
                        <span className="text-xs sm:text-sm leading-none font-bold">
                          {cell.day}
                        </span>
                        {hasTasks && (
                          <span
                            className={cn(
                              "text-[9px] font-black px-1 py-0.2 rounded flex items-center gap-0.5 transition-transform group-hover:scale-110",
                              cell.isSelected
                                ? "bg-white/25 text-white"
                                : "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/35"
                            )}
                            title={`${cell.tasks.length} nhiệm vụ có hạn chót`}
                          >
                            <Clock className="h-2.5 w-2.5" />
                            <span>{cell.tasks.length}</span>
                          </span>
                        )}
                      </div>

                      {/* Dấu chấm và tên mã môn học thu nhỏ */}
                      <div className="w-full flex flex-col items-center gap-0.5 mt-auto">
                        {hasSessions ? (
                          <div className="flex items-center justify-center gap-1">
                            {cell.sessions.slice(0, 3).map((ses, sIdx) => (
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
                            ))}
                          </div>
                        ) : (
                          <span className="h-1.5" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Chú thích màu nhỏ bên dưới */}
              <div className="pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full border border-[#C6FF33] bg-[#C6FF33]/40" />
                    Hôm nay
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#7D39EB]" />
                    Có lịch học
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Có hạn chót nhiệm vụ
                  </span>
                </div>
                <span className="text-[11px]">
                  Nhấp vào bất kỳ ngày nào để xem chi tiết ở mục <strong>Lịch học trong ngày</strong> bên trên
                </span>
              </div>
            </div>
          )}

          {/* NỘI DUNG 2: CHẾ ĐỘ XEM TUẦN (WEEK VIEW - HIỂN THỊ THEO GIỜ & HẠN CHÓT) */}
          {viewMode === "week" && (
            <div className="space-y-3 animate-in fade-in-50 duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                {weekDays.map((wDay) => {
                  return (
                    <div
                      key={wDay.dateKey}
                      onClick={() => onSelectDate(wDay.dateKey)}
                      className={cn(
                        "p-3 rounded-lg border flex flex-col justify-between transition-all duration-200 cursor-pointer min-h-[260px] bg-card overflow-hidden",
                        wDay.isSelected
                          ? "bg-[#7D39EB]/10 border-[#7D39EB] shadow-xs ring-1 ring-[#7D39EB]"
                          : wDay.isToday
                          ? "bg-[#C6FF33]/10 border-[#C6FF33]"
                          : "border-border/70 hover:border-border/90"
                      )}
                    >
                      {/* Header Ngày trong tuần */}
                      <div className="flex items-center justify-between pb-2 border-b border-border/50 shrink-0">
                        <div>
                          <span className="font-extrabold text-xs text-foreground block">
                            {wDay.weekdayFull}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {String(wDay.dayNumber).padStart(2, "0")}/{String(wDay.monthNumber).padStart(2, "0")}
                          </span>
                        </div>
                        {wDay.isToday && (
                          <Badge className="bg-[#C6FF33] text-black text-[9px] font-black px-1.5 py-0 border-0">
                            Hôm nay
                          </Badge>
                        )}
                      </div>

                      {/* Thân thẻ: Ca học & Hạn chót nhiệm vụ */}
                      <div className="py-2 space-y-2 flex-1 flex flex-col justify-between">
                        {/* 1. Danh sách ca học */}
                        <div className="space-y-1.5">
                          {wDay.sessions.length > 0 ? (
                            wDay.sessions.map((ses, sIdx) => {
                              const sub = ses.subject;
                              const subColor = sub.color || "#7D39EB";

                              return (
                                <div
                                  key={sIdx}
                                  className="p-2 rounded-md bg-muted/60 border border-border/60 hover:border-[#7D39EB]/50 transition-all text-left relative overflow-hidden"
                                >
                                  <div
                                    className="absolute left-0 top-0 bottom-0 w-1"
                                    style={{ backgroundColor: subColor }}
                                  />
                                  <div className="pl-1.5 space-y-0.5">
                                    {/* Giờ học */}
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-foreground font-mono">
                                      <Clock className="h-3 w-3 text-[#7D39EB] shrink-0" />
                                      <span className="truncate">
                                        {sub.startTime && sub.endTime
                                          ? `${sub.startTime} - ${sub.endTime}`
                                          : sub.startTime
                                          ? `Từ ${sub.startTime}`
                                          : "Chưa đặt giờ"}
                                      </span>
                                    </div>

                                    {/* Tên môn & Mã môn */}
                                    <p className="font-bold text-xs text-foreground line-clamp-1">
                                      {sub.code}: {sub.name}
                                    </p>

                                    {/* Phòng học & Cơ sở */}
                                    {(sub.room || sub.campus) && (
                                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground truncate">
                                        <MapPin className="h-3 w-3 text-[#C6FF33] shrink-0" />
                                        <span className="truncate">
                                          {sub.room ? `P.${sub.room}` : ""}
                                          {sub.room && sub.campus ? " • " : ""}
                                          {sub.campus || ""}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          ) : wDay.tasks.length === 0 ? (
                            <div className="py-8 flex items-center justify-center text-center">
                              <span className="text-[11px] text-muted-foreground/60 italic">
                                Nghỉ học
                              </span>
                            </div>
                          ) : (
                            <div className="py-1.5 px-2 rounded-md bg-muted/30 border border-dashed border-border/50 text-center">
                              <span className="text-[10px] text-muted-foreground/60 italic">
                                Không có ca học
                              </span>
                            </div>
                          )}
                        </div>

                        {/* 2. Hạn chót nhiệm vụ trong ngày (Tự động thích ứng gọn gàng) */}
                        {wDay.tasks.length > 0 && (
                          <div className="mt-auto pt-2 border-t border-border/60 space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] font-bold text-amber-500 dark:text-amber-400">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Hạn chót ({wDay.tasks.length})
                              </span>
                            </div>
                            <div className="space-y-1 max-h-[110px] overflow-y-auto pr-0.5">
                              {wDay.tasks.map((t) => {
                                const dlTime = t.deadline?.includes("T")
                                  ? t.deadline.split("T")[1].substring(0, 5)
                                  : "";
                                const isAllDay = dlTime === "23:59" || !dlTime;
                                const sub = subjects.find((s) => s.id === t.subjectId);

                                return (
                                  <div
                                    key={t.id}
                                    className="p-1.5 rounded-md bg-amber-500/10 border border-amber-500/25 text-left space-y-0.5 hover:border-amber-500/40 transition-colors"
                                    title={t.title}
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      {sub && (
                                        <span
                                          className="px-1 py-0.2 rounded text-[9px] font-extrabold text-white shrink-0"
                                          style={{ backgroundColor: sub.color || "#7D39EB" }}
                                        >
                                          {sub.code}
                                        </span>
                                      )}
                                      <span className="text-[9px] font-mono font-bold text-amber-600 dark:text-amber-300 ml-auto shrink-0">
                                        {isAllDay ? "Cả ngày" : dlTime}
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-bold text-foreground line-clamp-1 block">
                                      {t.title}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer Số lượng ca học & Hạn chót */}
                      <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[10px] font-semibold text-muted-foreground shrink-0">
                        <span>
                          {wDay.sessions.length > 0 ? `${wDay.sessions.length} ca học` : "Nghỉ học"}
                        </span>
                        {wDay.tasks.length > 0 && (
                          <span className="text-amber-500 font-bold flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            {wDay.tasks.length} hạn chót
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Thêm nhiệm vụ & Gán hạn chót (+) */}
      <TaskAssignModal
        open={isTaskAssignOpen}
        onOpenChange={setIsTaskAssignOpen}
        initialDate={selectedDateStr || todayKey}
        tasks={tasks}
        subjects={subjects}
        onAssignDeadline={handleAssignDeadline}
        onCreateTask={handleCreateTask}
        onSelectDate={onSelectDate}
      />
    </>
  );
}
