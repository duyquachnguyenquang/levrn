"use client";

import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Subject,
  StudyTask,
  GroupProject,
} from "@/lib/types";
import {
  CheckSquare,
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  Clock,
  MapPin,
  Users,
  User,
  CheckCircle2,
  Circle,
  X,
  Check,
  CalendarDays,
} from "lucide-react";
import { MarqueeText } from "@/components/ui/marquee-text";
import { getLocalDateKey } from "@/lib/checkinUtils";
import { cn } from "@/lib/utils";

export type DashboardTaskItem = {
  id: string;
  type: "schedule" | "personal" | "group";
  title: string;
  code?: string;
  date?: string; // YYYY-MM-DD
  time?: string;
  room?: string;
  campus?: string;
  color?: string;
  completed?: boolean;
  priority?: "urgent" | "high" | "medium" | "low";
  groupName?: string;
  assigneeName?: string;
  groupId?: string;
};

interface DashboardTasksCardProps {
  subjects: Subject[];
  personalTasks?: StudyTask[];
  groups?: GroupProject[];
  onTogglePersonalTask?: (taskId: string, completed: boolean) => Promise<any>;
  onToggleGroupTask?: (groupId: string, taskId: string, completed: boolean) => Promise<any>;
}

type TaskFilterType = "all" | "schedule" | "personal" | "group";
type TaskSortType = "date" | "priority" | "name";
type TaskSortDirection = "asc" | "desc";

// Tính dải ngày tuần hiện tại (Thứ Hai đến Chủ Nhật)
function getCurrentWeekRange(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay(); // 0: CN, 1: T2...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    start: getLocalDateKey(monday),
    end: getLocalDateKey(sunday),
  };
}

// Định dạng ngày hiển thị (VD: T2, 02/10)
function formatTaskDate(dateStr?: string, todayKey?: string): string {
  if (!dateStr) return "";
  if (dateStr === todayKey) return "Hôm nay";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const dayOfWeek = dayNames[d.getDay()];
    return `${dayOfWeek}, ${parts[2]}/${parts[1]}`;
  }
  return dateStr;
}

export function DashboardTasksCard({
  subjects,
  personalTasks = [],
  groups = [],
  onTogglePersonalTask,
  onToggleGroupTask,
}: DashboardTasksCardProps) {
  const todayKey = useMemo(() => getLocalDateKey(new Date()), []);
  const weekRange = useMemo(() => getCurrentWeekRange(), []);

  // 1. Bộ lọc, tìm kiếm và sắp xếp
  const [filterType, setFilterType] = useState<TaskFilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortType, setSortType] = useState<TaskSortType>("date");
  const [sortDirection, setSortDirection] = useState<TaskSortDirection>("asc");
  const [isSortOpen, setIsSortOpen] = useState(false);

  // 2. Tổng hợp tất cả các mục trong tuần: Lịch học, Nhiệm vụ cá nhân, Nhiệm vụ nhóm
  const allWeekItems = useMemo<DashboardTaskItem[]>(() => {
    const items: DashboardTaskItem[] = [];

    // A. Lịch học trong tuần
    subjects.forEach((sub) => {
      const scheduleDays = sub.scheduleDays || [];
      if (scheduleDays.length === 0 && sub.startDate) {
        const p = sub.startDate.split("-").map(Number);
        if (p.length === 3) {
          scheduleDays.push(new Date(p[0], p[1] - 1, p[2]).getDay());
        }
      }

      // Tạo các ca học cho từng ngày trong tuần hiện tại
      const [startYear, startMonth, startDay] = weekRange.start.split("-").map(Number);
      for (let i = 0; i < 7; i++) {
        const cur = new Date(startYear, startMonth - 1, startDay + i);
        const dayOfWeek = cur.getDay(); // 0..6
        if (scheduleDays.includes(dayOfWeek)) {
          const dateStr = getLocalDateKey(cur);
          // Kiểm tra phạm vi môn học
          if (sub.startDate && dateStr < sub.startDate) continue;
          if (sub.endDate && dateStr > sub.endDate) continue;

          items.push({
            id: `sch-${sub.id}-${dateStr}`,
            type: "schedule",
            title: sub.name,
            code: sub.code,
            date: dateStr,
            time: sub.startTime && sub.endTime ? `${sub.startTime} - ${sub.endTime}` : sub.startTime,
            room: sub.room,
            campus: sub.campus,
            color: sub.color || "#7D39EB",
            completed: dateStr < todayKey,
          });
        }
      }
    });

    // B. Nhiệm vụ cá nhân trong tuần (hoặc đang hoạt động)
    personalTasks.forEach((pt) => {
      // Ưu tiên các task trong tuần hoặc chưa hoàn thành
      const isInWeek = pt.date ? pt.date >= weekRange.start && pt.date <= weekRange.end : true;
      const isDone = pt.status === "completed";
      const targetSub = subjects.find((s) => s.id === pt.subjectId);

      if (isInWeek || !isDone) {
        items.push({
          id: pt.id,
          type: "personal",
          title: pt.title,
          code: targetSub?.code || "CÁ NHÂN",
          date: pt.date || todayKey,
          time: pt.durationMinutes ? `${pt.durationMinutes}p` : undefined,
          completed: isDone,
          priority: pt.priority || "medium",
          color: "#06B6D4",
        });
      }
    });

    // C. Nhiệm vụ nhóm trong tuần
    groups.forEach((grp) => {
      (grp.tasks || []).forEach((gt) => {
        const dueDateStr = gt.dueDate ? gt.dueDate.split("T")[0] : undefined;
        const isInWeek = dueDateStr ? dueDateStr >= weekRange.start && dueDateStr <= weekRange.end : true;
        if (isInWeek || gt.status !== "done") {
          items.push({
            id: gt.id,
            type: "group",
            title: gt.title,
            code: grp.subjectCode || "NHÓM",
            groupName: grp.name,
            date: dueDateStr || todayKey,
            completed: gt.status === "done",
            priority: (gt.priority as any) || "medium",
            assigneeName: gt.assigneeName,
            groupId: grp.id,
            color: "#F59E0B",
          });
        }
      });
    });

    return items;
  }, [subjects, personalTasks, groups, weekRange, todayKey]);

  // 3. Lọc và sắp xếp danh sách nhiệm vụ
  const displayedTasks = useMemo(() => {
    let result = [...allWeekItems];

    // Lọc theo loại
    if (filterType !== "all") {
      result = result.filter((item) => item.type === filterType);
    }

    // Lọc theo từ khóa tìm kiếm
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          (item.code && item.code.toLowerCase().includes(q)) ||
          (item.groupName && item.groupName.toLowerCase().includes(q))
      );
    }

    // Sắp xếp
    result.sort((a, b) => {
      if (sortType === "date") {
        const dateA = a.date || "";
        const dateB = b.date || "";
        const cmp = dateA.localeCompare(dateB);
        return sortDirection === "asc" ? cmp : -cmp;
      }

      if (sortType === "priority") {
        const weight: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
        const wA = weight[a.priority || "medium"] || 2;
        const wB = weight[b.priority || "medium"] || 2;
        return sortDirection === "asc" ? wA - wB : wB - wA;
      }

      if (sortType === "name") {
        const cmp = a.title.localeCompare(b.title, "vi");
        return sortDirection === "asc" ? cmp : -cmp;
      }

      return 0;
    });

    return result;
  }, [allWeekItems, filterType, searchQuery, sortType, sortDirection]);

  // Đếm số lượng theo loại
  const counts = useMemo(() => {
    return {
      all: allWeekItems.length,
      schedule: allWeekItems.filter((i) => i.type === "schedule").length,
      personal: allWeekItems.filter((i) => i.type === "personal").length,
      group: allWeekItems.filter((i) => i.type === "group").length,
    };
  }, [allWeekItems]);

  return (
    <Card className="rounded-lg border border-border/80 bg-card p-5 shadow-xs flex flex-col justify-between transition-all duration-300 hover:border-border/90 hover:shadow-md h-full min-h-[380px]">
      {/* 1. Header Tinh gọn - Tiêu đề 'Nhiệm vụ', công cụ Tìm kiếm, Bộ lọc và Sắp xếp (Rule 1.1) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-border/60">
        {/* Tiêu đề card */}
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-md bg-[#7D39EB]/15 text-[#7D39EB] flex items-center justify-center shrink-0">
            <CheckSquare className="h-4 w-4" />
          </div>
          <h3 className="font-extrabold text-base text-foreground leading-tight">
            Nhiệm vụ
          </h3>
          <span className="text-[11px] font-mono font-bold text-muted-foreground">
            trong tuần ({counts.all})
          </span>
        </div>

        {/* Cụm công cụ bên phải: Tabs Lọc nhanh + Kính lúp (Tìm kiếm) + Sắp xếp (cùng một hàng, không rớt dòng, căn trái) */}
        <div className="flex flex-row items-center justify-start gap-1.5 overflow-x-auto no-scrollbar flex-nowrap w-full sm:w-auto shrink-0">
          {/* Tabs nhanh: Tất cả / Lịch học / Cá nhân / Nhóm */}
          <div className="flex items-center p-0.5 rounded-md bg-muted/60 border border-border/70 min-h-[40px] h-10 sm:min-h-0 sm:h-8 shrink-0">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={cn(
                "px-2.5 py-1.5 sm:py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer shrink-0",
                filterType === "all"
                  ? "bg-[#7D39EB] text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setFilterType("schedule")}
              className={cn(
                "px-2.5 py-1.5 sm:py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer flex items-center gap-1 shrink-0",
                filterType === "schedule"
                  ? "bg-[#7D39EB] text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Lịch học trong tuần"
              aria-label="Lịch học trong tuần"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Lịch học</span>
              <span className="text-[9.5px] font-mono opacity-80">({counts.schedule})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType("personal")}
              className={cn(
                "px-2.5 py-1.5 sm:py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer flex items-center gap-1 shrink-0",
                filterType === "personal"
                  ? "bg-[#7D39EB] text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Nhiệm vụ cá nhân"
              aria-label="Nhiệm vụ cá nhân"
            >
              <User className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cá nhân</span>
              <span className="text-[9.5px] font-mono opacity-80">({counts.personal})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType("group")}
              className={cn(
                "px-2.5 py-1.5 sm:py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer flex items-center gap-1 shrink-0",
                filterType === "group"
                  ? "bg-[#7D39EB] text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Nhiệm vụ nhóm"
              aria-label="Nhiệm vụ nhóm"
            >
              <Users className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Nhóm</span>
              <span className="text-[9.5px] font-mono opacity-80">({counts.group})</span>
            </button>
          </div>

          {/* Nút Tìm kiếm (Icon Kính lúp) */}
          <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "min-h-[40px] min-w-[40px] h-10 w-10 sm:h-8 sm:w-8 rounded-md border border-border/80 transition-all active:scale-95 shrink-0",
                  searchQuery
                    ? "border-[#7D39EB] text-[#7D39EB] bg-[#7D39EB]/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                title="Tìm kiếm nhiệm vụ"
                aria-label="Tìm kiếm nhiệm vụ"
              >
                <Search className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-64 p-2 rounded-md border border-border/80 bg-card shadow-lg"
            >
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Tìm nhiệm vụ, môn học, nhóm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs rounded-md border-border/70 focus-visible:ring-[#7D39EB]"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Nút Sắp xếp (Icon Sắp xếp) */}
          <Popover open={isSortOpen} onOpenChange={setIsSortOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="min-h-[40px] min-w-[40px] h-10 w-10 sm:h-8 sm:w-8 rounded-md border border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 transition-all active:scale-95"
                title="Sắp xếp nhiệm vụ"
                aria-label="Sắp xếp nhiệm vụ"
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-64 p-3 rounded-md border border-border/80 bg-card shadow-lg space-y-3"
            >
              {/* 1. Tích chọn biến sắp xếp */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Sắp xếp theo
                </span>
                <div className="space-y-1">
                  {[
                    { key: "date", label: "Thời gian / Hạn chót" },
                    { key: "priority", label: "Mức độ ưu tiên" },
                    { key: "name", label: "Tên nhiệm vụ" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setSortType(item.key as TaskSortType)}
                      className={cn(
                        "w-full px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center justify-between cursor-pointer transition-all",
                        sortType === item.key
                          ? "bg-[#7D39EB]/15 text-[#7D39EB]"
                          : "hover:bg-muted text-foreground/80"
                      )}
                    >
                      <span>{item.label}</span>
                      {sortType === item.key && (
                        <Check className="h-3.5 w-3.5 text-[#7D39EB]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Dropdown cơ chế */}
              <div className="space-y-1.5 pt-2 border-t border-border/60">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Thứ tự sắp xếp
                </span>
                <select
                  value={sortDirection}
                  onChange={(e) => setSortDirection(e.target.value as TaskSortDirection)}
                  className="w-full h-8 rounded-md border border-border/80 bg-background px-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-[#7D39EB]"
                >
                  <option value="asc">Tăng dần (Gần nhất / A-Z)</option>
                  <option value="desc">Giảm dần (Xa nhất / Z-A)</option>
                </select>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* 2. Danh sách nhiệm vụ trong tuần - Single Row tinh gọn cân xứng */}
      <div className="py-2.5 space-y-2 flex-1 max-h-[290px] overflow-y-auto pr-1">
        {displayedTasks.length > 0 ? (
          displayedTasks.map((task) => {
            const isToday = task.date === todayKey;

            return (
              <div
                key={task.id}
                className={cn(
                  "h-11 px-3 rounded-md border flex items-center justify-between gap-2 overflow-hidden transition-all text-left",
                  task.completed
                    ? "bg-muted/20 border-border/40 opacity-75"
                    : isToday
                    ? "bg-[#7D39EB]/5 border-[#7D39EB]/30 hover:border-[#7D39EB]/60"
                    : "bg-muted/30 border border-border/60 hover:border-border/90"
                )}
              >
                {/* Trái: Vạch nhận diện, Badge phân loại, Tên nhiệm vụ */}
                <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                  {/* Badge phân loại trực quan */}
                  {task.type === "schedule" ? (
                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-[#7D39EB]/15 text-[#7D39EB] shrink-0 font-mono">
                      Lịch học
                    </span>
                  ) : task.type === "personal" ? (
                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 shrink-0 font-mono">
                      Cá nhân
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 shrink-0 font-mono">
                      Nhóm
                    </span>
                  )}

                  {/* Mã môn nếu có */}
                  {task.code && (
                    <span className="font-mono font-bold text-[10px] text-muted-foreground shrink-0 hidden sm:inline">
                      [{task.code}]
                    </span>
                  )}

                  {/* Tên nhiệm vụ với Marquee */}
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <MarqueeText
                      text={task.title}
                      className={cn(
                        "font-bold text-xs truncate",
                        task.completed ? "line-through text-muted-foreground" : "text-foreground"
                      )}
                    />
                  </div>
                </div>

                {/* Phải: Ngày/Giờ & Thao tác check hoàn thành */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Ngày & Thời gian */}
                  <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                    <Clock className="h-3 w-3 text-[#7D39EB] shrink-0" />
                    <span
                      className={cn(
                        "font-bold",
                        isToday ? "text-[#7D39EB] dark:text-[#C6FF33]" : ""
                      )}
                    >
                      {formatTaskDate(task.date, todayKey)}
                    </span>
                    {task.time && (
                      <span className="hidden sm:inline">
                        • {task.time}
                      </span>
                    )}
                  </div>

                  {/* Checkbox hoàn thành nhanh cho task cá nhân & nhóm */}
                  {task.type === "personal" && onTogglePersonalTask ? (
                    <button
                      type="button"
                      onClick={() => onTogglePersonalTask(task.id, !task.completed)}
                      className="h-6 w-6 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-all active:scale-95"
                      title={task.completed ? "Đánh dấu chưa hoàn thành" : "Hoàn thành nhiệm vụ"}
                    >
                      {task.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </button>
                  ) : task.type === "group" && onToggleGroupTask && task.groupId ? (
                    <button
                      type="button"
                      onClick={() => onToggleGroupTask(task.groupId!, task.id, !task.completed)}
                      className="h-6 w-6 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-all active:scale-95"
                      title={task.completed ? "Đánh dấu chưa xong" : "Hoàn thành nhiệm vụ nhóm"}
                    >
                      {task.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-amber-500" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </button>
                  ) : task.type === "schedule" ? (
                    <span className="text-[10px] text-muted-foreground hidden sm:inline">
                      {task.room ? `P.${task.room}` : ""}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-10 flex flex-col items-center justify-center text-center text-muted-foreground">
            <CheckSquare className="h-7 w-7 text-muted-foreground/40 mb-1" />
            <p className="text-xs font-semibold text-foreground/80">
              {searchQuery ? "Không tìm thấy nhiệm vụ phù hợp" : "Không có nhiệm vụ nào trong tuần này"}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-[11px] text-[#7D39EB] hover:underline font-bold mt-1 cursor-pointer"
              >
                Xóa bộ lọc tìm kiếm
              </button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
