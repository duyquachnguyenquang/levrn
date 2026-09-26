"use client";

import React, { useMemo } from "react";
import {
  Clock,
  CheckCircle2,
  Circle,
  MoreVertical,
  Plus,
  Play,
  Calendar,
  Sparkles,
  BookOpen,
  ArrowRight,
  MapPin,
  Flame,
} from "lucide-react";
import Link from "next/link";
import {
  StudyTask,
  Subject,
  STUDY_CLASSIFICATIONS,
  STUDY_PRIORITIES,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { calculateAllSessions } from "@/components/dashboard/ScheduleCalendar";
import { cn } from "@/lib/utils";

interface TimeblockTimelineProps {
  dateStr: string; // YYYY-MM-DD
  tasks: StudyTask[];
  subjects: Subject[];
  onToggleComplete: (id: string) => void;
  onEditTask: (task: StudyTask) => void;
  onDeleteTask: (id: string) => void;
  onRescheduleTomorrow: (id: string) => void;
  onAddNewAtTime?: (startTime: string) => void;
}

// Giờ bắt đầu từ 07:00 đến 22:00
const TIMELINE_HOURS = Array.from({ length: 16 }, (_, i) => i + 7);

export function TimeblockTimeline({
  dateStr,
  tasks,
  subjects,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  onRescheduleTomorrow,
  onAddNewAtTime,
}: TimeblockTimelineProps) {
  // Lấy các buổi học chính khoá trên trường trong ngày này
  const classSessions = useMemo(() => {
    const map = calculateAllSessions(subjects);
    return map.get(dateStr) || [];
  }, [subjects, dateStr]);

  // Lọc các nhiệm vụ tự học thuộc ngày này có timeblock
  const timeblockTasks = useMemo(() => {
    return tasks
      .filter((t) => t.date === dateStr && t.timeblock)
      .sort((a, b) => {
        const timeA = a.timeblock?.startTime || "00:00";
        const timeB = b.timeblock?.startTime || "00:00";
        return timeA.localeCompare(timeB);
      });
  }, [tasks, dateStr]);

  // Các nhiệm vụ tự học trong ngày nhưng KHÔNG xếp timeblock cố định
  const flexibleTasks = useMemo(() => {
    return tasks.filter((t) => t.date === dateStr && !t.timeblock);
  }, [tasks, dateStr]);

  // Map subject by ID
  const subjectsMap = useMemo(() => {
    const map = new Map<string, Subject>();
    subjects.forEach((s) => map.set(s.id, s));
    return map;
  }, [subjects]);

  // Kiểm tra xem có phải ngày hôm nay không
  const isToday = useMemo(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return dateStr === `${y}-${m}-${d}`;
  }, [dateStr]);

  // Tính giờ hiện tại để vẽ đường kẻ đỏ "Bây giờ"
  const currentHourPercent = useMemo(() => {
    if (!isToday) return null;
    const now = new Date();
    const hour = now.getHours();
    const min = now.getMinutes();
    if (hour < 7 || hour > 23) return null;
    const totalMinutesSince7AM = (hour - 7) * 60 + min;
    const totalRangeMinutes = 16 * 60; // 07:00 -> 23:00
    return Math.min(100, Math.max(0, (totalMinutesSince7AM / totalRangeMinutes) * 100));
  }, [isToday]);

  // Tổng số phút học đã lên lịch hôm nay
  const totalPlannedMinutes = useMemo(() => {
    return timeblockTasks.reduce((acc, t) => acc + (t.durationMinutes || 0), 0);
  }, [timeblockTasks]);

  const completedTasksCount = useMemo(() => {
    return timeblockTasks.filter((t) => t.status === "completed").length;
  }, [timeblockTasks]);

  return (
    <div className="space-y-6">
      {/* Thanh tóm tắt nhanh ngày học */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-card border border-border/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[#7D39EB]/15 text-[#7D39EB] flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-foreground flex items-center gap-2">
              <span>Lịch trình Timeblock chi tiết</span>
              {isToday && (
                <Badge className="bg-[#C6FF33] text-black font-black text-[10px] px-1.5 py-0">
                  HÔM NAY
                </Badge>
              )}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Kết hợp giờ học trên lớp &amp; khung giờ tự học sâu (Deep Work)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-lg bg-muted/60 border border-border/60 text-right">
            <span className="text-[10px] text-muted-foreground block font-medium">Khung giờ tự học</span>
            <span className="font-black text-foreground">
              {timeblockTasks.length} ca ({(totalPlannedMinutes / 60).toFixed(1)}h)
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-[#C6FF33]/15 border border-[#C6FF33]/30 text-right">
            <span className="text-[10px] text-[#2B4B00] dark:text-[#C6FF33] block font-medium">Đã xong</span>
            <span className="font-black text-foreground">
              {completedTasksCount}/{timeblockTasks.length} ca
            </span>
          </div>
        </div>
      </div>

      {/* Thông báo buổi học chính khoá trên trường nếu có */}
      {classSessions.length > 0 && (
        <div className="p-3 rounded-lg bg-[#7D39EB]/10 border border-[#7D39EB]/25 text-xs text-foreground flex flex-col gap-2">
          <div className="flex items-center gap-2 font-bold text-[#7D39EB] dark:text-[#A78BFA]">
            <BookOpen className="h-4 w-4" />
            <span>Lịch học chính khoá trên trường trong ngày ({classSessions.length} ca học):</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {classSessions.map((ses, idx) => {
              const sub = ses.subject;
              return (
                <div
                  key={idx}
                  className="p-2.5 rounded-md bg-card/80 border border-border/70 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-black shrink-0"
                      style={{
                        backgroundColor: `${sub.color}20`,
                        color: sub.color,
                      }}
                    >
                      {sub.code}
                    </span>
                    <span className="text-xs font-semibold truncate">{sub.name}</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-muted-foreground shrink-0">
                    {sub.startTime && sub.endTime ? `${sub.startTime} - ${sub.endTime}` : "Giờ học trường"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid biểu đồ Timeblock theo từng mốc giờ (07:00 -> 22:00) */}
      <div className="relative bg-card rounded-xl border border-border/80 shadow-xs p-4 sm:p-6 overflow-hidden">
        {/* Đường kẻ giờ hiện tại nếu xem hôm nay */}
        {currentHourPercent !== null && (
          <div
            className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
            style={{ top: `${currentHourPercent}%` }}
          >
            <span className="h-2 w-2 rounded-full bg-red-500 shadow-sm ml-2 animate-ping" />
            <div className="flex-1 h-0.5 bg-red-500/80 shadow-xs" />
            <span className="px-1.5 py-0.5 bg-red-500 text-white font-mono text-[9px] font-bold rounded-l mr-0">
              Bây giờ
            </span>
          </div>
        )}

        {/* Danh sách timeblock đã xếp lịch */}
        {timeblockTasks.length > 0 ? (
          <div className="space-y-3.5">
            {timeblockTasks.map((task) => {
              const sub = subjectsMap.get(task.subjectId);
              const subColor = sub?.color || "#7D39EB";
              const clsMeta = STUDY_CLASSIFICATIONS[task.classification];
              const isCompleted = task.status === "completed";
              const priorityMeta = task.priority ? STUDY_PRIORITIES[task.priority] : null;

              return (
                <div
                  key={task.id}
                  className={cn(
                    "group relative flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border transition-all duration-200",
                    isCompleted
                      ? "bg-muted/30 border-border/60 opacity-75"
                      : "bg-card hover:border-border/90 hover:shadow-md border-border/80"
                  )}
                >
                  {/* Đường viền màu môn học bên trái */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl"
                    style={{ backgroundColor: subColor }}
                  />

                  {/* Cột trái: Giờ timeblock + Nút Checkbox hoàn thành */}
                  <div className="flex items-start sm:items-center gap-3 pl-1.5">
                    {/* Nút check hoàn thành */}
                    <button
                      onClick={() => onToggleComplete(task.id)}
                      className={cn(
                        "mt-0.5 sm:mt-0 h-6 w-6 rounded-md flex items-center justify-center transition-all cursor-pointer shrink-0 border",
                        isCompleted
                          ? "bg-[#C6FF33] border-[#C6FF33] text-black"
                          : "border-border/80 hover:border-[#C6FF33] bg-background text-transparent hover:text-muted-foreground"
                      )}
                      title={isCompleted ? "Đánh dấu chưa xong" : "Đánh dấu đã hoàn thành"}
                      aria-label="Đánh dấu hoàn thành"
                    >
                      <CheckCircle2
                        className={cn(
                          "h-4 w-4",
                          isCompleted ? "stroke-[2.5]" : "opacity-0 hover:opacity-50"
                        )}
                      />
                    </button>

                    {/* Khung giờ Timeblock */}
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 font-mono font-black text-xs sm:text-sm text-foreground">
                        <Clock className="h-3.5 w-3.5 text-[#7D39EB]" />
                        <span>
                          {task.timeblock?.startTime} - {task.timeblock?.endTime}
                        </span>
                        <span className="text-[11px] font-medium text-muted-foreground ml-1">
                          ({task.durationMinutes}p)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cột giữa: Thông tin môn học + Phân loại chiến lược + Tiêu đề nhiệm vụ */}
                  <div className="flex-1 min-w-0 pl-1.5 md:pl-4 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      {/* Badge mã môn */}
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-black"
                        style={{
                          backgroundColor: `${subColor}20`,
                          color: subColor,
                        }}
                      >
                        {sub?.code || "MÔN"}
                      </span>

                      {/* Badge phân loại chiến lược */}
                      {clsMeta && (
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold border"
                          style={{
                            backgroundColor: clsMeta.bgColor,
                            borderColor: clsMeta.borderColor,
                            color: clsMeta.color,
                          }}
                        >
                          {clsMeta.label}
                        </span>
                      )}

                      {/* Badge độ ưu tiên */}
                      {priorityMeta && (
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold border",
                            priorityMeta.badgeClass
                          )}
                        >
                          {priorityMeta.label}
                        </span>
                      )}
                    </div>

                    <h4
                      className={cn(
                        "text-sm font-extrabold text-foreground line-clamp-1 transition-all",
                        isCompleted && "line-through text-muted-foreground"
                      )}
                    >
                      {task.title}
                    </h4>

                    {task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {task.description}
                      </p>
                    )}

                    {/* Tiến độ checklist con nếu có */}
                    {task.checklist && task.checklist.length > 0 && (
                      <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5 pt-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#C6FF33]" />
                        <span>
                          {task.checklist.filter((c) => c.done).length}/{task.checklist.length} mục con đã xong
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Cột phải: Nút bắt đầu học ngay + Menu Tuỳ chọn */}
                  <div className="flex items-center gap-2 self-end md:self-center pl-1.5">
                    <Link href="/sessions">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs font-bold rounded-md border-border/80 hover:bg-[#7D39EB]/15 hover:text-[#7D39EB] hover:border-[#7D39EB]/40 gap-1.5"
                        title="Bắt đầu bấm giờ học môn này"
                      >
                        <Play className="h-3 w-3 fill-current" />
                        <span className="hidden sm:inline">Học ngay</span>
                      </Button>
                    </Link>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 text-xs">
                        <DropdownMenuItem
                          onClick={() => onEditTask(task)}
                          className="cursor-pointer"
                        >
                          Chỉnh sửa nhiệm vụ
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onRescheduleTomorrow(task.id)}
                          className="cursor-pointer"
                        >
                          Dời sang ngày mai
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDeleteTask(task.id)}
                          className="text-destructive focus:text-destructive cursor-pointer"
                        >
                          Xoá nhiệm vụ
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="h-14 w-14 rounded-lg bg-muted/60 flex items-center justify-center text-muted-foreground">
              <Calendar className="h-7 w-7" />
            </div>
            <div className="max-w-xs space-y-1">
              <p className="text-sm font-bold text-foreground">
                Chưa có khung giờ tự học nào cho ngày này
              </p>
              <p className="text-xs text-muted-foreground">
                Hãy tạo khung giờ (ví dụ: 08:30 - 10:00) để tối ưu khả năng tập trung sâu.
              </p>
            </div>
            {onAddNewAtTime && (
              <Button
                size="sm"
                onClick={() => onAddNewAtTime("08:30")}
                className="bg-[#C6FF33] hover:bg-[#B5F51B] text-black font-extrabold rounded-md text-xs gap-1.5 mt-2"
              >
                <Plus className="h-3.5 w-3.5 stroke-[3]" />
                <span>Lên lịch khung giờ đầu tiên</span>
              </Button>
            )}
          </div>
        )}

        {/* Khung giờ trống gợi ý (Quick Add Timeblock Slots) */}
        <div className="mt-6 pt-5 border-t border-border/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#C6FF33]" />
              Thêm nhanh khung giờ tự học gợi ý:
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { slot: "08:30 - 10:00", start: "08:30", label: "Buổi sáng sớm" },
              { slot: "10:15 - 11:45", start: "10:15", label: "Cuối buổi sáng" },
              { slot: "14:00 - 15:30", start: "14:00", label: "Đầu buổi chiều" },
              { slot: "19:30 - 21:00", start: "19:30", label: "Tối tập trung" },
            ].map((btn, idx) => (
              <button
                key={idx}
                onClick={() => onAddNewAtTime && onAddNewAtTime(btn.start)}
                className="p-2.5 rounded-lg border border-border/60 bg-muted/30 hover:bg-muted hover:border-[#7D39EB]/50 transition-all text-left group cursor-pointer flex flex-col justify-between"
              >
                <span className="text-[10px] text-muted-foreground font-medium">
                  {btn.label}
                </span>
                <span className="font-mono font-bold text-xs text-foreground group-hover:text-[#7D39EB] transition-colors mt-0.5 flex items-center justify-between">
                  <span>{btn.slot}</span>
                  <Plus className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Các nhiệm vụ trong ngày nhưng không cố định giờ (Linh hoạt) */}
      {flexibleTasks.length > 0 && (
        <div className="p-4 rounded-lg bg-card border border-border/70 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Nhiệm vụ cần hoàn thành trong ngày (Giờ linh hoạt - {flexibleTasks.length})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {flexibleTasks.map((task) => {
              const sub = subjectsMap.get(task.subjectId);
              const subColor = sub?.color || "#7D39EB";
              const isDone = task.status === "completed";

              return (
                <div
                  key={task.id}
                  className={cn(
                    "p-3 rounded-lg border flex items-center justify-between gap-2 transition-all",
                    isDone
                      ? "bg-muted/30 border-border/50 opacity-70"
                      : "bg-muted/40 border-border/70 hover:bg-card"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      onClick={() => onToggleComplete(task.id)}
                      className={cn(
                        "h-5 w-5 rounded flex items-center justify-center border transition-all cursor-pointer shrink-0",
                        isDone
                          ? "bg-[#C6FF33] border-[#C6FF33] text-black"
                          : "border-border/80 bg-background"
                      )}
                    >
                      {isDone && <CheckCircle2 className="h-3.5 w-3.5 stroke-[2.5]" />}
                    </button>

                    <div className="min-w-0">
                      <span
                        className="text-[9px] font-black px-1.5 py-0.2 rounded"
                        style={{
                          backgroundColor: `${subColor}20`,
                          color: subColor,
                        }}
                      >
                        {sub?.code || "MÔN"}
                      </span>
                      <p
                        className={cn(
                          "text-xs font-bold text-foreground truncate mt-0.5",
                          isDone && "line-through text-muted-foreground"
                        )}
                      >
                        {task.title}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-muted-foreground shrink-0 font-medium">
                    {task.durationMinutes}p
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
