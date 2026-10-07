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
  CalendarSync,
  CheckCircle2,
  CalendarCheck,
  Check,
  AlertCircle,
} from "lucide-react";
import { Subject, StudyTask, StudyTaskFormData, AttendanceRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TaskAssignModal } from "./TaskAssignModal";
import { GoogleCalendarModal } from "@/components/calendar/GoogleCalendarModal";
import { useStudyPlans } from "@/hooks/useStudyPlans";
import { useAttendance } from "@/hooks/useAttendance";
import { cn } from "@/lib/utils";
import { calculateAttendedCount, hasValidAttendanceCheckin } from "@/lib/checkinUtils";

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

// Định dạng ngày tiếng Việt: Thứ Hai, 05/10/2026
export function formatDateVi(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3) return dateStr;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  if (isNaN(d.getTime())) return dateStr;
  const dayNames = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  const dayName = dayNames[d.getDay()];
  const dd = String(parts[2]).padStart(2, "0");
  const mm = String(parts[1]).padStart(2, "0");
  const yyyy = parts[0];
  return `${dayName}, ${dd}/${mm}/${yyyy}`;
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
  attendanceRecords?: AttendanceRecord[];
  onCheckinDate?: (
    dateStr: string,
    subjectsToMark: Subject[]
  ) => Promise<{ success: boolean; message?: string }>;
  onCancelCheckinDate?: (
    dateStr: string,
    subjectsToCancel: Subject[]
  ) => Promise<{ success: boolean; message?: string }>;
}

export function ScheduleCalendar({
  subjects,
  selectedDateStr,
  onSelectDate,
  tasks: propTasks,
  onAddTask: propOnAddTask,
  onUpdateTask: propOnUpdateTask,
  onRefreshTasks: propOnRefreshTasks,
  attendanceRecords: propAttendanceRecords,
  onCheckinDate: propOnCheckinDate,
  onCancelCheckinDate: propOnCancelCheckinDate,
}: ScheduleCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => toDateKey(today), [today]);

  // Hook study plans dự phòng nếu props không truyền
  const fallbackPlans = useStudyPlans();
  const tasks = propTasks ?? fallbackPlans.tasks;
  const onAddTask = propOnAddTask ?? fallbackPlans.addTask;
  const onUpdateTask = propOnUpdateTask ?? fallbackPlans.updateTask;

  // Hook attendance dự phòng nếu props không truyền
  const fallbackAttendance = useAttendance(subjects);
  const attendanceRecords = propAttendanceRecords ?? fallbackAttendance.records;
  const onCheckinDate = propOnCheckinDate;
  const onCancelCheckinDate = propOnCancelCheckinDate;

  // Trạng thái modal thêm nhiệm vụ / gán hạn chót (+)
  const [isTaskAssignOpen, setIsTaskAssignOpen] = useState(false);
  // Trạng thái modal đồng bộ Google Calendar
  const [isGCalModalOpen, setIsGCalModalOpen] = useState(false);

  // Tự động mở modal khi Google OAuth chuyển hướng về với ?gcal=connected
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("gcal") === "connected") {
        setIsGCalModalOpen(true);
        // Dọn dẹp param trên URL cho gọn
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }
    }
  }, []);

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

  // Kiểm tra 1 ca học cụ thể đã được điểm danh hay chưa
  const isSessionCheckedIn = React.useCallback(
    (ses: ClassSession) => {
      // Ngày học trong tương lai tuyệt đối không thể tính là đã điểm danh
      if (ses.dateStr > todayKey) return false;

      return attendanceRecords.some(
        (r) =>
          r.subjectId === ses.subject.id &&
          r.date === ses.dateStr &&
          (r.status === "present" || r.status === "late") &&
          hasValidAttendanceCheckin(r)
      );
    },
    [attendanceRecords, todayKey]
  );

  // Lấy số ngày đã điểm danh của môn học (chỉ tính các buổi đã hoặc đang diễn ra, đếm theo ngày duy nhất)
  const getSubjectAttendedCount = React.useCallback(
    (subjectId: string) => {
      const subRecords = attendanceRecords.filter((r) => r.subjectId === subjectId);
      return calculateAttendedCount(subRecords, todayKey);
    },
    [attendanceRecords, todayKey]
  );

  // Danh sách các ca học của ngày đang chọn
  const selectedSessions = useMemo(() => {
    return sessionsByDate.get(selectedDateStr) || [];
  }, [sessionsByDate, selectedDateStr]);

  const isSelectedPast = selectedDateStr < todayKey;
  const isSelectedToday = selectedDateStr === todayKey;
  const isSelectedFuture = selectedDateStr > todayKey;

  const isAllCheckedIn = useMemo(() => {
    if (selectedSessions.length === 0) return false;
    return selectedSessions.every((ses) => isSessionCheckedIn(ses));
  }, [selectedSessions, isSessionCheckedIn]);

  const hasUncheckedSelected = useMemo(() => {
    if (selectedSessions.length === 0) return false;
    return selectedSessions.some((ses) => !isSessionCheckedIn(ses));
  }, [selectedSessions, isSessionCheckedIn]);

  // Xử lý điểm danh / điểm danh bù cho ngày đang chọn
  const handleCheckinSelectedDate = async () => {
    if (selectedSessions.length === 0 || isSelectedFuture) return;
    const subjectsToMark = selectedSessions.map((s) => s.subject);
    if (onCheckinDate) {
      await onCheckinDate(selectedDateStr, subjectsToMark);
    } else {
      await fallbackAttendance.checkinMultipleSubjectsForDate(selectedDateStr, subjectsToMark);
    }
  };

  // Xử lý hủy điểm danh cho ngày đang chọn (khi bấm nhầm)
  const handleCancelCheckinSelectedDate = async () => {
    if (selectedSessions.length === 0) return;
    const subjectsToCancel = selectedSessions.map((s) => s.subject);
    if (onCancelCheckinDate) {
      await onCancelCheckinDate(selectedDateStr, subjectsToCancel);
    } else {
      await fallbackAttendance.cancelCheckinForDate(
        selectedDateStr,
        subjectsToCancel.map((s) => s.id)
      );
    }
  };

  // Xử lý điểm danh cho 1 môn cụ thể
  const handleCheckinSingleSubject = async (sub: Subject) => {
    if (isSelectedFuture) return;
    if (onCheckinDate) {
      await onCheckinDate(selectedDateStr, [sub]);
    } else {
      await fallbackAttendance.checkinMultipleSubjectsForDate(selectedDateStr, [sub]);
    }
  };

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
  const handleGoToday = () => {
    const now = new Date();
    setViewDate(now);
    setPickerYear(now.getFullYear());
    onSelectDate(toDateKey(now));
    setMonthPickerOpen(false);
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
          {/* Header Widget Lịch học: Ngang hàng trên cả PC & Mobile, căn phải cụm nút tính năng */}
          <div className="flex flex-row items-center justify-between gap-3 pb-3 border-b border-border/60">
            {/* Bên trái: Header */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-md bg-[#7D39EB]/15 flex items-center justify-center text-[#7D39EB] shrink-0">
                <CalendarIcon className="h-4 w-4" />
              </div>
              <h3 className="font-extrabold text-base sm:text-lg text-foreground tracking-tight truncate">
                Lịch học
              </h3>
            </div>

            {/* Bên phải: Nút Điểm danh (nếu ngày chọn có lịch học, bên trái nút Xem lịch), 1. Chọn tháng (icon Lịch), 2. Đồng bộ GCal, 3. Thêm nhiệm vụ (+) */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Nút Điểm danh / Điểm danh bù: Chỉ hiện khi ngày đang chọn có lịch học, nằm BÊN TRÁI nút Xem lịch */}
              {selectedSessions.length > 0 && (
                <>
                  {isSelectedPast && hasUncheckedSelected ? (
                    // Ngày học cũ chưa điểm danh -> Hiện nút Điểm danh bù
                    <Button
                      type="button"
                      onClick={handleCheckinSelectedDate}
                      className="min-h-[40px] min-w-[40px] h-10 w-10 sm:h-8 sm:w-auto sm:px-2.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-700 dark:text-amber-300 font-bold transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0 shadow-xs"
                      title={`Điểm danh bù ngày ${formatDateVi(selectedDateStr)}`}
                      aria-label="Điểm danh bù"
                    >
                      <CalendarCheck className="h-4 w-4 sm:mr-1.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span className="hidden sm:inline text-xs">Điểm danh bù</span>
                    </Button>
                  ) : isSelectedFuture ? (
                    // Ngày học chưa đến -> Nút Điểm danh chuyển xám, không thể bấm
                    <Button
                      type="button"
                      disabled
                      className="min-h-[40px] min-w-[40px] h-10 w-10 sm:h-8 sm:w-auto sm:px-2.5 rounded-lg bg-muted text-muted-foreground/50 border border-border/60 font-bold cursor-not-allowed flex items-center justify-center shrink-0 opacity-60 pointer-events-none"
                      title={`Chưa đến ngày học (${formatDateVi(selectedDateStr)})`}
                      aria-label="Chưa đến ngày học"
                    >
                      <CheckCircle2 className="h-4 w-4 sm:mr-1.5 text-muted-foreground/40 shrink-0" />
                      <span className="hidden sm:inline text-xs">Điểm danh</span>
                    </Button>
                  ) : hasUncheckedSelected ? (
                    // Ngày hôm nay hoặc có ca học chưa điểm danh -> Hiện nút Điểm danh
                    <Button
                      type="button"
                      onClick={handleCheckinSelectedDate}
                      className="min-h-[40px] min-w-[40px] h-10 w-10 sm:h-8 sm:w-auto sm:px-2.5 rounded-lg bg-[#7D39EB] hover:bg-[#6826d4] text-white font-bold transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0 shadow-xs"
                      title={`Điểm danh ngày ${formatDateVi(selectedDateStr)}`}
                      aria-label="Điểm danh"
                    >
                      <CheckCircle2 className="h-4 w-4 sm:mr-1.5 text-[#C6FF33] shrink-0" />
                      <span className="hidden sm:inline text-xs">Điểm danh</span>
                    </Button>
                  ) : (
                    // Đã điểm danh đầy đủ -> Trạng thái Đã điểm danh
                    <Button
                      type="button"
                      onClick={handleCancelCheckinSelectedDate}
                      variant="outline"
                      className="min-h-[40px] min-w-[40px] h-10 w-10 sm:h-8 sm:w-auto sm:px-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
                      title={`Đã điểm danh ngày ${formatDateVi(selectedDateStr)} (Nhấp để hủy nếu nhầm)`}
                      aria-label="Đã điểm danh"
                    >
                      <Check className="h-4 w-4 sm:mr-1.5 text-emerald-500 shrink-0" />
                      <span className="hidden sm:inline text-xs">Đã điểm danh</span>
                    </Button>
                  )}
                </>
              )}

              {/* 1. Chọn tháng & Chế độ xem (Nút dạng icon Lịch) */}
              <Popover
                open={monthPickerOpen}
                onOpenChange={(open) => {
                  setMonthPickerOpen(open);
                  if (open) {
                    setPickerYear(viewDate.getFullYear());
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="min-h-[40px] min-w-[40px] h-10 w-10 sm:h-8 sm:w-8 rounded-lg border-border/80 hover:border-[#7D39EB] hover:text-[#7D39EB] transition-all bg-background shrink-0 flex items-center justify-center cursor-pointer active:scale-95"
                    title={`Chọn tháng & Chế độ xem (${monthNames[viewMonth]} ${viewYear})`}
                    aria-label="Chọn tháng và chế độ xem"
                  >
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-72 p-3 rounded-lg border-border/80 shadow-2xl bg-card text-foreground z-50 animate-in fade-in-50 zoom-in-95 duration-150"
                >
                  {/* Tính năng Xem lịch theo tháng / Xem lịch theo tuần */}
                  <div className="flex items-center rounded-md bg-muted/60 p-0.5 border border-border/70 mb-2.5">
                    <button
                      type="button"
                      onClick={() => setViewMode("month")}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer",
                        viewMode === "month"
                          ? "bg-[#7D39EB] text-white shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      title="Xem lịch theo tháng"
                    >
                      <CalendarDays className="h-3.5 w-3.5" />
                      <span>Xem theo tháng</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("week")}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer",
                        viewMode === "week"
                          ? "bg-[#7D39EB] text-white shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      title="Xem lịch theo tuần"
                    >
                      <CalendarRange className="h-3.5 w-3.5" />
                      <span>Xem theo tuần</span>
                    </button>
                  </div>

                  {/* Header: Điều hướng Năm & Nút Hôm nay ngang hàng */}
                  <div className="flex items-center justify-between pb-2 border-b border-border/60 mb-2">
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => setPickerYear((y) => y - 1)}
                        className="h-7 w-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center justify-center shrink-0"
                        title="Năm trước"
                        aria-label="Năm trước"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="font-extrabold text-xs text-foreground tracking-wide font-mono px-1 select-none">
                        Năm {pickerYear}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPickerYear((y) => y + 1)}
                        className="h-7 w-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center justify-center shrink-0"
                        title="Năm sau"
                        aria-label="Năm sau"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoToday}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#7D39EB]/15 text-[#7D39EB] hover:bg-[#7D39EB]/25 text-xs font-bold transition-all cursor-pointer border border-[#7D39EB]/30 active:scale-95 shrink-0"
                      title="Về ngày hôm nay"
                      aria-label="Hôm nay"
                    >
                      <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-[#7D39EB]" />
                      <span>Hôm nay</span>
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
                          {mName}
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>

              {/* 2. Đồng bộ Google Calendar */}
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setIsGCalModalOpen(true)}
                className="min-h-[40px] min-w-[40px] h-10 w-10 sm:h-8 sm:w-8 rounded-lg border-border/80 hover:border-[#7D39EB] hover:text-[#7D39EB] text-muted-foreground transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0 bg-background"
                title="Đồng bộ Google Calendar"
                aria-label="Đồng bộ Google Calendar"
              >
                <CalendarSync className="h-4 w-4" />
              </Button>

              {/* 3. Thêm nhiệm vụ (+) */}
              <Button
                type="button"
                size="icon"
                onClick={() => setIsTaskAssignOpen(true)}
                className="min-h-[40px] min-w-[40px] h-10 w-10 sm:h-8 sm:w-8 rounded-lg bg-[#7D39EB] hover:bg-[#6826d4] text-white shadow-xs hover:shadow transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
                title="Thêm nhiệm vụ & Gán hạn chót từ Kế hoạch"
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
                  const isCellPast = cell.dateKey < todayKey;
                  const cellUncheckedSessions = cell.sessions.filter((ses) => !isSessionCheckedIn(ses));
                  const isCellPastUnchecked = isCellPast && cellUncheckedSessions.length > 0;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onSelectDate(cell.dateKey)}
                      className={cn(
                        "relative h-13 sm:h-14 w-full rounded-lg flex flex-col items-center justify-between p-1.5 transition-all duration-200 cursor-pointer text-xs font-semibold select-none group border",
                        cell.isSelected
                          ? "bg-[#7D39EB] text-white border-[#7D39EB] font-extrabold shadow-md shadow-[#7D39EB]/30 scale-[1.02] z-10"
                          : cell.isToday
                          ? "border-[#C6FF33] text-foreground font-black bg-[#C6FF33]/10"
                          : isCellPastUnchecked
                          ? "bg-rose-500/10 border-rose-500/40 text-foreground hover:border-rose-500 hover:bg-rose-500/15"
                          : cell.isCurrentMonth
                          ? "bg-card border-border/60 text-foreground hover:border-[#7D39EB]/50 hover:bg-muted/50"
                          : "bg-muted/10 border-transparent text-muted-foreground/30 hover:bg-muted/30"
                      )}
                    >
                      {/* Hàng trên: Số ngày, Dấu hiệu chưa điểm danh & Huy hiệu hạn chót */}
                      <div className="w-full flex items-center justify-between px-0.5">
                        <span className="text-xs sm:text-sm leading-none font-bold flex items-center gap-1">
                          {cell.day}
                          {isCellPastUnchecked && (
                            <span
                              className="h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-rose-500/30 animate-pulse"
                              title="Ngày học cũ chưa điểm danh bù"
                            />
                          )}
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

                      {/* Dấu chấm ca học */}
                      <div className="w-full flex flex-col items-center gap-0.5 mt-auto">
                        {hasSessions ? (
                          <div className="flex items-center justify-center gap-1">
                            {cell.sessions.slice(0, 3).map((ses, sIdx) => {
                              const checked = isSessionCheckedIn(ses);
                              const pastUnchecked = isCellPast && !checked;

                              return (
                                <span
                                  key={sIdx}
                                  className={cn(
                                    "h-1.5 w-1.5 rounded-full transition-transform group-hover:scale-125",
                                    cell.isSelected ? "bg-white" : ""
                                  )}
                                  style={{
                                    backgroundColor: cell.isSelected
                                      ? "#FFFFFF"
                                      : pastUnchecked
                                      ? "#F43F5E"
                                      : checked
                                      ? "#10B981"
                                      : ses.subject.color || "#C6FF33",
                                  }}
                                  title={
                                    pastUnchecked
                                      ? `[${ses.subject.code}] Chưa điểm danh bù`
                                      : checked
                                      ? `[${ses.subject.code}] Đã điểm danh`
                                      : `${ses.subject.code} - ${ses.subject.name}`
                                  }
                                />
                              );
                            })}
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
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full border border-[#C6FF33] bg-[#C6FF33]/40" />
                    Hôm nay
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-[#7D39EB]" />
                    Lịch học
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Đã điểm danh
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-rose-500 ring-1 ring-rose-500/40" />
                    Chưa điểm danh bù
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Hạn chót
                  </span>
                </div>
              </div>

              {/* Chi tiết ca học của ngày đang chọn */}
              <div className="pt-3 border-t border-border/60 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[#7D39EB]" />
                    <span>Ca học: {formatDateVi(selectedDateStr)}</span>
                    {selectedSessions.length > 0 && (
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono">
                        {selectedSessions.length} ca
                      </Badge>
                    )}
                  </div>
                  {isSelectedPast && hasUncheckedSelected && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Cần điểm danh bù
                    </span>
                  )}
                </div>

                {selectedSessions.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedSessions.map((ses, idx) => {
                      const isCheckedIn = isSessionCheckedIn(ses);
                      const attendedCount = getSubjectAttendedCount(ses.subject.id);
                      const totalWeeks = ses.subject.totalWeeks || 15;

                      return (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg border border-border/70 bg-card hover:border-[#7D39EB]/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {/* Mã môn cố định w-14 theo quy chuẩn 1.17 */}
                            <span
                              className="w-14 h-5 inline-flex items-center justify-center text-center shrink-0 font-mono font-black text-[10px] sm:text-[11px] rounded-xs text-white truncate"
                              style={{ backgroundColor: ses.subject.color || "#7D39EB" }}
                              title={ses.subject.code}
                            >
                              {ses.subject.code}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-xs text-foreground truncate">
                                {ses.subject.name}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                                {ses.subject.startTime && (
                                  <span>
                                    {ses.subject.startTime} - {ses.subject.endTime || ""}
                                  </span>
                                )}
                                {ses.subject.room && <span>• P.{ses.subject.room}</span>}
                                {ses.subject.campus && <span>• {ses.subject.campus}</span>}
                              </div>
                            </div>
                          </div>

                          {/* Dữ liệu cốt lõi: Đã học bao nhiêu ngày & Nút thao tác */}
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <div className="text-right">
                              <span className="text-[11px] font-bold text-foreground block">
                                Đã học:{" "}
                                <span className="text-[#7D39EB] font-black">
                                  {attendedCount}
                                </span>
                                /{totalWeeks} ngày
                              </span>
                            </div>
                            {isCheckedIn ? (
                              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-bold py-0.5">
                                <Check className="h-3 w-3 mr-1" /> Đã điểm danh
                              </Badge>
                            ) : isSelectedPast ? (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleCheckinSingleSubject(ses.subject)}
                                className="h-6 px-2 text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-md cursor-pointer active:scale-95"
                              >
                                Điểm danh bù
                              </Button>
                            ) : isSelectedFuture ? (
                              <Button
                                type="button"
                                size="sm"
                                disabled
                                className="h-6 px-2 text-[10px] font-bold bg-muted text-muted-foreground/50 border border-border/60 rounded-md cursor-not-allowed opacity-60 pointer-events-none"
                                title="Chưa đến ngày học, không thể điểm danh trước"
                              >
                                Điểm danh
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleCheckinSingleSubject(ses.subject)}
                                className="h-6 px-2 text-[10px] font-bold bg-[#7D39EB] hover:bg-[#6826d4] text-white rounded-md cursor-pointer active:scale-95"
                              >
                                Điểm danh
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-2.5 px-3 rounded-lg border border-dashed border-border/60 text-center text-xs text-muted-foreground/80 italic">
                    Không có ca học nào trong ngày này.
                  </div>
                )}
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

                                    {/* Trạng thái điểm danh & Số ngày đã học */}
                                    {(() => {
                                      const isChecked = isSessionCheckedIn(ses);
                                      const isPast = wDay.dateKey < todayKey;
                                      const attendedCount = getSubjectAttendedCount(sub.id);
                                      const totalWeeks = sub.totalWeeks || 15;

                                      return (
                                        <div className="pt-1 flex items-center justify-between text-[9px] font-bold border-t border-border/40 mt-1">
                                          <span className="text-muted-foreground font-mono">
                                            Đã học {attendedCount}/{totalWeeks} ngày
                                          </span>
                                          {isChecked ? (
                                            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-0.5">
                                              <Check className="h-2.5 w-2.5" /> Đã điểm danh
                                            </span>
                                          ) : isPast ? (
                                            <span className="text-rose-600 dark:text-rose-400 font-extrabold flex items-center gap-0.5">
                                              <AlertCircle className="h-2.5 w-2.5" /> Chưa bù
                                            </span>
                                          ) : null}
                                        </div>
                                      );
                                    })()}
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
                                          className="w-12 h-4 inline-flex items-center justify-center rounded text-[9px] font-mono font-extrabold text-white shrink-0 text-center tracking-tight truncate px-0.5"
                                          style={{ backgroundColor: sub.color || "#7D39EB" }}
                                          title={sub.code}
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

      {/* Modal Đồng bộ Google Calendar */}
      <GoogleCalendarModal
        isOpen={isGCalModalOpen}
        onClose={() => setIsGCalModalOpen(false)}
        subjects={subjects}
      />
    </>
  );
}
