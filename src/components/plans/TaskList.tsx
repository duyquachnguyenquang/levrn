"use client";

import React, { useState, useMemo } from "react";
import {
  CheckCircle2,
  Clock,
  MoreVertical,
  Plus,
  Play,
  Calendar,
  Layers,
  Copy,
  Trash2,
  Edit,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import {
  StudyTask,
  Subject,
  STUDY_CLASSIFICATIONS,
  STUDY_PRIORITIES,
  StudyTaskStatus,
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
import { cn } from "@/lib/utils";

interface TaskListProps {
  tasks: StudyTask[];
  subjects: Subject[];
  onToggleComplete: (id: string) => void;
  onEditTask: (task: StudyTask) => void;
  onDeleteTask: (id: string) => void;
  onRescheduleTomorrow: (id: string) => void;
  onDuplicateTask: (id: string) => void;
  onAddNew: () => void;
}

type GroupByOption = "status" | "subject" | "date";

export function TaskList({
  tasks,
  subjects,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  onRescheduleTomorrow,
  onDuplicateTask,
  onAddNew,
}: TaskListProps) {
  const [groupBy, setGroupBy] = useState<GroupByOption>("status");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("all");
  const [expandedChecklists, setExpandedChecklists] = useState<Record<string, boolean>>({});

  const subjectsMap = useMemo(() => {
    const map = new Map<string, Subject>();
    subjects.forEach((s) => map.set(s.id, s));
    return map;
  }, [subjects]);

  // Lọc theo status filter
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter === "active") return t.status !== "completed";
      if (statusFilter === "completed") return t.status === "completed";
      return true;
    });
  }, [tasks, statusFilter]);

  const toggleChecklistExpand = (id: string) => {
    setExpandedChecklists((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Gom nhóm
  const groupedTasks = useMemo(() => {
    if (groupBy === "status") {
      const groups = [
        {
          key: "todo",
          label: "Chờ thực hiện",
          color: "#3B82F6",
          items: filteredTasks.filter((t) => t.status === "todo"),
        },
        {
          key: "in_progress",
          label: "Đang tiến hành",
          color: "#F59E0B",
          items: filteredTasks.filter((t) => t.status === "in_progress"),
        },
        {
          key: "completed",
          label: "Đã hoàn thành",
          color: "#10B981",
          items: filteredTasks.filter((t) => t.status === "completed"),
        },
      ];
      return groups.filter((g) => g.items.length > 0);
    } else if (groupBy === "subject") {
      const map = new Map<string, StudyTask[]>();
      filteredTasks.forEach((t) => {
        const list = map.get(t.subjectId) || [];
        map.set(t.subjectId, [...list, t]);
      });

      return Array.from(map.entries()).map(([subId, items]) => {
        const sub = subjectsMap.get(subId);
        return {
          key: subId,
          label: sub ? `${sub.code} - ${sub.name}` : "Môn khác",
          color: sub?.color || "#7D39EB",
          items,
        };
      });
    } else {
      // Group by Date
      const map = new Map<string, StudyTask[]>();
      filteredTasks.forEach((t) => {
        const dateKey = t.date || "Không xác định";
        const list = map.get(dateKey) || [];
        map.set(dateKey, [...list, t]);
      });

      return Array.from(map.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([dateKey, items]) => ({
          key: dateKey,
          label: `Ngày ${dateKey}`,
          color: "#7D39EB",
          items,
        }));
    }
  }, [filteredTasks, groupBy, subjectsMap]);

  return (
    <div className="space-y-4">
      {/* Thanh công cụ gom nhóm và lọc trạng thái */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-card rounded-lg border border-border/70 shadow-xs">
        {/* Lọc trạng thái nhanh */}
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant={statusFilter === "all" ? "default" : "ghost"}
            onClick={() => setStatusFilter("all")}
            className={cn(
              "h-7 text-xs rounded-md px-2.5 font-bold transition-all",
              statusFilter === "all"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Tất cả ({tasks.length})
          </Button>

          <Button
            size="sm"
            variant={statusFilter === "active" ? "default" : "ghost"}
            onClick={() => setStatusFilter("active")}
            className={cn(
              "h-7 text-xs rounded-md px-2.5 font-bold transition-all",
              statusFilter === "active"
                ? "bg-[#7D39EB] text-white"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Cần học ({tasks.filter((t) => t.status !== "completed").length})
          </Button>

          <Button
            size="sm"
            variant={statusFilter === "completed" ? "default" : "ghost"}
            onClick={() => setStatusFilter("completed")}
            className={cn(
              "h-7 text-xs rounded-md px-2.5 font-bold transition-all",
              statusFilter === "completed"
                ? "bg-[#C6FF33] text-black"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Đã xong ({tasks.filter((t) => t.status === "completed").length})
          </Button>
        </div>

        {/* Gom nhóm theo */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-muted-foreground font-semibold">Gom nhóm:</span>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupByOption)}
            className="h-7 text-xs bg-muted/70 border border-border/70 rounded-md px-2 font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#7D39EB]"
          >
            <option value="status">Theo Trạng thái</option>
            <option value="subject">Theo Môn học</option>
            <option value="date">Theo Ngày học</option>
          </select>
        </div>
      </div>

      {/* Danh sách nhiệm vụ theo từng nhóm */}
      {groupedTasks.length > 0 ? (
        <div className="space-y-6">
          {groupedTasks.map((group) => (
            <div key={group.key} className="space-y-2.5">
              {/* Header của từng nhóm */}
              <div className="flex items-center justify-between pb-1.5 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  <h3 className="font-extrabold text-sm text-foreground">
                    {group.label}
                  </h3>
                  <Badge variant="outline" className="text-[10px] font-bold px-1.5 py-0 h-4 border-border/70">
                    {group.items.length}
                  </Badge>
                </div>
              </div>

              {/* Các task trong nhóm */}
              <div className="grid grid-cols-1 gap-2.5">
                {group.items.map((task) => {
                  const sub = subjectsMap.get(task.subjectId);
                  const subColor = sub?.color || "#7D39EB";
                  const clsMeta = STUDY_CLASSIFICATIONS[task.classification];
                  const priorityMeta = task.priority ? STUDY_PRIORITIES[task.priority] : null;
                  const isDone = task.status === "completed";
                  const isExpanded = !!expandedChecklists[task.id];

                  return (
                    <div
                      key={task.id}
                      className={cn(
                        "group relative rounded-lg border p-3.5 sm:p-4 transition-all duration-200",
                        isDone
                          ? "bg-muted/20 border-border/50 opacity-70"
                          : "bg-card border-border/80 hover:border-border/90 hover:shadow-md"
                      )}
                    >
                      {/* Dải màu môn học */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-lg"
                        style={{ backgroundColor: subColor }}
                      />

                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pl-1.5">
                        {/* Cột trái: Checkbox + Tiêu đề + Metadata */}
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <button
                            onClick={() => onToggleComplete(task.id)}
                            className={cn(
                              "mt-0.5 h-5 w-5 rounded-md flex items-center justify-center border transition-all cursor-pointer shrink-0",
                              isDone
                                ? "bg-[#C6FF33] border-[#C6FF33] text-black"
                                : "border-border/80 bg-background hover:border-[#C6FF33]"
                            )}
                            title={isDone ? "Đánh dấu chưa hoàn thành" : "Đánh dấu đã hoàn thành"}
                            aria-label={isDone ? "Đánh dấu chưa hoàn thành" : "Đánh dấu đã hoàn thành"}
                          >
                            <CheckCircle2
                              className={cn(
                                "h-3.5 w-3.5",
                                isDone ? "stroke-[2.5]" : "opacity-0"
                              )}
                            />
                          </button>

                          <div className="space-y-1.5 min-w-0 flex-1">
                            {/* Badges */}
                            <div className="flex items-center gap-1.5 flex-wrap text-xs">
                              {/* Môn */}
                              <span
                                className="px-1.5 py-0.2 rounded text-[10px] font-black"
                                style={{
                                  backgroundColor: `${subColor}20`,
                                  color: subColor,
                                }}
                              >
                                {sub?.code || "MÔN"}
                              </span>

                              {/* Phân loại chiến lược */}
                              {clsMeta && (
                                <span
                                  className="px-1.5 py-0.2 rounded text-[10px] font-bold border"
                                  style={{
                                    backgroundColor: clsMeta.bgColor,
                                    borderColor: clsMeta.borderColor,
                                    color: clsMeta.color,
                                  }}
                                >
                                  {clsMeta.label}
                                </span>
                              )}

                              {/* Ưu tiên */}
                              {priorityMeta && (
                                <span
                                  className={cn(
                                    "px-1.5 py-0.2 rounded text-[10px] font-bold border",
                                    priorityMeta.badgeClass
                                  )}
                                >
                                  {priorityMeta.label}
                                </span>
                              )}

                              {/* Ngày */}
                              <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1 ml-auto sm:ml-0">
                                <Calendar className="h-3 w-3" />
                                {task.date}
                              </span>

                              {/* Giờ nếu có timeblock */}
                              {task.timeblock ? (
                                <span className="text-[10px] text-[#7D39EB] dark:text-[#A78BFA] font-mono font-bold flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {task.timeblock.startTime} - {task.timeblock.endTime}
                                </span>
                              ) : (
                                <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {task.durationMinutes}p
                                </span>
                              )}
                            </div>

                            {/* Tiêu đề */}
                            <h4
                              className={cn(
                                "text-sm font-extrabold text-foreground",
                                isDone && "line-through text-muted-foreground"
                              )}
                            >
                              {task.title}
                            </h4>

                            {/* Mô tả */}
                            {task.description && (
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {task.description}
                              </p>
                            )}

                            {/* Ghi chú */}
                            {task.notes && (
                              <div className="p-2 rounded bg-muted/40 border border-border/50 text-[11px] text-muted-foreground">
                                <strong>Ghi chú:</strong> {task.notes}
                              </div>
                            )}

                            {/* Checklist con */}
                            {task.checklist && task.checklist.length > 0 && (
                              <div className="pt-1">
                                <button
                                  onClick={() => toggleChecklistExpand(task.id)}
                                  className="text-[11px] font-bold text-[#7D39EB] dark:text-[#C6FF33] hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <span>
                                    {task.checklist.filter((c) => c.done).length}/{task.checklist.length} mục việc nhỏ
                                  </span>
                                  {isExpanded ? (
                                    <ChevronUp className="h-3 w-3" />
                                  ) : (
                                    <ChevronDown className="h-3 w-3" />
                                  )}
                                </button>

                                {isExpanded && (
                                  <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-[#7D39EB]/30">
                                    {task.checklist.map((item) => (
                                      <div
                                        key={item.id}
                                        className="text-xs flex items-center gap-2 text-foreground/90"
                                      >
                                        <span
                                          className={cn(
                                            "h-1.5 w-1.5 rounded-full shrink-0",
                                            item.done ? "bg-[#C6FF33]" : "bg-muted-foreground"
                                          )}
                                        />
                                        <span className={item.done ? "line-through text-muted-foreground" : ""}>
                                          {item.text}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Cột phải: Các nút hành động */}
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <Link href="/sessions">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs font-bold rounded-md border-border/80 hover:bg-[#7D39EB]/15 hover:text-[#7D39EB] gap-1"
                              title="Bắt đầu học ngay môn này"
                            >
                              <Play className="h-3 w-3 fill-current" />
                              <span>Học ngay</span>
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
                                className="cursor-pointer gap-2"
                              >
                                <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>Chỉnh sửa nhiệm vụ</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onRescheduleTomorrow(task.id)}
                                className="cursor-pointer gap-2"
                              >
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>Dời sang ngày mai</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onDuplicateTask(task.id)}
                                className="cursor-pointer gap-2"
                              >
                                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>Nhân bản nhiệm vụ</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => onDeleteTask(task.id)}
                                className="text-destructive focus:text-destructive cursor-pointer gap-2"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Xoá nhiệm vụ</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 flex flex-col items-center justify-center text-center space-y-3 bg-card rounded-lg border border-border/70 p-6">
          <div className="h-14 w-14 rounded-lg bg-muted/60 flex items-center justify-center text-muted-foreground">
            <Layers className="h-7 w-7" />
          </div>
          <div className="max-w-xs space-y-1">
            <p className="text-sm font-bold text-foreground">
              Không có nhiệm vụ nào phù hợp với bộ lọc
            </p>
            <p className="text-xs text-muted-foreground">
              Bạn có thể điều chỉnh lại bộ lọc hoặc tạo một nhiệm vụ học tập mới ngay bây giờ.
            </p>
          </div>
          <Button
            size="sm"
            onClick={onAddNew}
            className="bg-[#C6FF33] hover:bg-[#B5F51B] text-black font-extrabold rounded-md text-xs gap-1.5 mt-2"
          >
            <Plus className="h-3.5 w-3.5 stroke-[3]" />
            <span>Thêm nhiệm vụ mới</span>
          </Button>
        </div>
      )}
    </div>
  );
}
