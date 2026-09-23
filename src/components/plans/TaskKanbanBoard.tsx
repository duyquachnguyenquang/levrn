"use client";

import React, { useState } from "react";
import {
  Circle,
  Clock,
  CheckCircle2,
  Plus,
  MoreVertical,
  Calendar,
  Play,
  Edit,
  Trash2,
  ArrowRight,
  GripVertical,
  UploadCloud,
  FolderArchive,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import {
  StudyTask,
  StudyTaskStatus,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface TaskKanbanBoardProps {
  tasks: StudyTask[];
  subjects: Subject[];
  onStatusChange: (id: string, newStatus: StudyTaskStatus) => void;
  onEditTask: (task: StudyTask) => void;
  onDeleteTask: (id: string) => void;
  onRescheduleTomorrow: (id: string) => void;
  onAddNewWithStatus: (status: StudyTaskStatus) => void;
}

interface ColumnDef {
  key: StudyTaskStatus;
  title: string;
  icon: React.ElementType;
  headerColor: string;
  badgeBg: string;
}

const COLUMNS: ColumnDef[] = [
  {
    key: "todo",
    title: "Chưa làm",
    icon: Circle,
    headerColor: "text-blue-500",
    badgeBg: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  },
  {
    key: "in_progress",
    title: "Đang làm",
    icon: Clock,
    headerColor: "text-amber-500",
    badgeBg: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  },
  {
    key: "completed",
    title: "Đã xong",
    icon: CheckCircle2,
    headerColor: "text-[#10B981] dark:text-[#C6FF33]",
    badgeBg: "bg-[#C6FF33]/20 text-[#1F3E00] dark:text-[#C6FF33] border-[#C6FF33]/40",
  },
];

export function TaskKanbanBoard({
  tasks,
  subjects,
  onStatusChange,
  onEditTask,
  onDeleteTask,
  onRescheduleTomorrow,
  onAddNewWithStatus,
}: TaskKanbanBoardProps) {
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<StudyTaskStatus | null>(null);

  const subjectsMap = React.useMemo(() => {
    const map = new Map<string, Subject>();
    subjects.forEach((s) => map.set(s.id, s));
    return map;
  }, [subjects]);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
    setActiveDragId(taskId);
  };

  const handleDragEnd = () => {
    setActiveDragId(null);
    setDragOverCol(null);
  };

  const handleDragOver = (e: React.DragEvent, colKey: StudyTaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverCol !== colKey) {
      setDragOverCol(colKey);
    }
  };

  const handleDragLeave = (e: React.DragEvent, colKey: StudyTaskStatus) => {
    // Only clear if leaving the column element itself
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragOverCol === colKey) {
      setDragOverCol(null);
    }
  };

  const handleDrop = (e: React.DragEvent, colKey: StudyTaskStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    setActiveDragId(null);
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) {
      onStatusChange(taskId, colKey);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.key);
        const Icon = col.icon;
        const isTarget = dragOverCol === col.key;

        return (
          <div
            key={col.key}
            onDragOver={(e) => handleDragOver(e, col.key)}
            onDragLeave={(e) => handleDragLeave(e, col.key)}
            onDrop={(e) => handleDrop(e, col.key)}
            className={cn(
              "flex flex-col rounded-xl border bg-card/60 p-3 sm:p-3.5 transition-all duration-200 min-h-[480px]",
              isTarget
                ? "border-[#C6FF33] bg-[#C6FF33]/5 ring-2 ring-[#C6FF33]/30 shadow-lg"
                : "border-border/80"
            )}
          >
            {/* Header cột */}
            <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-3">
              <div className="flex items-center gap-2">
                <Icon className={cn("h-4 w-4", col.headerColor)} />
                <h3 className="font-extrabold text-sm text-foreground">
                  {col.title}
                </h3>
                <Badge
                  variant="outline"
                  className={cn("text-[10px] font-black px-1.5 py-0 h-4 border", col.badgeBg)}
                >
                  {colTasks.length}
                </Badge>
              </div>

              {/* Nút thêm nhanh nhiệm vụ vào cột này */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onAddNewWithStatus(col.key)}
                className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
                title={`Thêm nhiệm vụ vào ${col.title}`}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Danh sách thẻ nhiệm vụ trong cột */}
            <div className="flex-1 space-y-2.5 overflow-y-auto">
              {colTasks.length > 0 ? (
                colTasks.map((task) => {
                  const sub = subjectsMap.get(task.subjectId);
                  const subColor = sub?.color || "#7D39EB";
                  const clsMeta = STUDY_CLASSIFICATIONS[task.classification];
                  const isDragging = activeDragId === task.id;
                  const currentSubtasks = task.subtasks || task.checklist || [];

                  // Định dạng deadline nếu có
                  let deadlineLabel = "";
                  if (task.deadline) {
                    try {
                      const dl = new Date(task.deadline);
                      const h = String(dl.getHours()).padStart(2, "0");
                      const m = String(dl.getMinutes()).padStart(2, "0");
                      const d = String(dl.getDate()).padStart(2, "0");
                      const mo = String(dl.getMonth() + 1).padStart(2, "0");
                      deadlineLabel = `${h}:${m} ${d}/${mo}`;
                    } catch {}
                  }

                  return (
                    <div
                      key={task.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        "group relative rounded-xl border bg-card p-3 shadow-xs transition-all duration-150 cursor-grab active:cursor-grabbing hover:border-border/90 hover:shadow-md select-none",
                        isDragging && "opacity-40 scale-95 border-dashed border-[#7D39EB]",
                        col.key === "completed" && "bg-card/70"
                      )}
                    >
                      {/* Vạch màu môn học bên trái */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl"
                        style={{ backgroundColor: subColor }}
                      />

                      <div className="pl-1.5 space-y-2">
                        {/* Hàng 1: Badges + Menu thao tác */}
                        <div className="flex items-center justify-between gap-1 text-[10px]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Mã môn */}
                            <span
                              className="font-black px-1.5 py-0.5 rounded text-[10px]"
                              style={{
                                backgroundColor: `${subColor}20`,
                                color: subColor,
                              }}
                            >
                              {sub?.code || "MÔN"}
                            </span>

                            {/* Phân loại */}
                            {clsMeta && (
                              <span
                                className="font-bold px-1.5 py-0.5 rounded text-[10px] border"
                                style={{
                                  backgroundColor: clsMeta.bgColor,
                                  borderColor: clsMeta.borderColor,
                                  color: clsMeta.color,
                                }}
                              >
                                {clsMeta.shortLabel}
                              </span>
                            )}
                          </div>

                          {/* Menu 3 chấm */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 rounded text-muted-foreground hover:text-foreground opacity-60 group-hover:opacity-100"
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 text-xs">
                              <DropdownMenuItem
                                onClick={() => onEditTask(task)}
                                className="cursor-pointer gap-2"
                              >
                                <Edit className="h-3 w-3" />
                                <span>Chỉnh sửa</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onRescheduleTomorrow(task.id)}
                                className="cursor-pointer gap-2"
                              >
                                <Calendar className="h-3 w-3" />
                                <span>Dời sang ngày mai</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => onDeleteTask(task.id)}
                                className="text-destructive focus:text-destructive cursor-pointer gap-2"
                              >
                                <Trash2 className="h-3 w-3" />
                                <span>Xoá</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Tiêu đề nhiệm vụ */}
                        <h4
                          className={cn(
                            "text-xs sm:text-sm font-extrabold text-foreground line-clamp-2 leading-snug",
                            col.key === "completed" && "line-through text-muted-foreground"
                          )}
                        >
                          {task.title}
                        </h4>

                        {/* Hạn chót & Nút nộp bài nếu có */}
                        {(deadlineLabel || task.submissionUrl) && (
                          <div className="flex items-center justify-between gap-1.5 text-[10px] pt-1 border-t border-border/40">
                            {deadlineLabel ? (
                              <span className="font-mono font-bold text-amber-500 flex items-center gap-1">
                                <Clock className="h-3 w-3 shrink-0" />
                                <span>Hạn: {deadlineLabel}</span>
                              </span>
                            ) : <span />}

                            {task.submissionUrl && (
                              <a
                                href={task.submissionUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-black bg-gradient-to-r from-[#7D39EB] to-[#9246f8] text-white hover:brightness-110 shadow-xs border border-[#7D39EB]/50 transition-all active:scale-95 shrink-0"
                                title="Mở trang nộp bài"
                              >
                                <UploadCloud className="h-3 w-3 shrink-0" />
                                <span>Nộp bài</span>
                                <ExternalLink className="h-2.5 w-2.5 opacity-80 shrink-0" />
                              </a>
                            )}
                          </div>
                        )}

                        {/* Thời lượng & Pop-up Tài liệu */}
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40 font-medium">
                          <span className="flex items-center gap-1 font-mono text-[10px]">
                            <Clock className="h-3 w-3 text-[#7D39EB]" />
                            <span>{task.durationMinutes || 60}p</span>
                          </span>

                          <div className="flex items-center gap-2 text-[10px]">
                            {/* Pop-up Tài liệu đính kèm */}
                            {task.materials && task.materials.length > 0 && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25 transition-all cursor-pointer shadow-xs active:scale-95"
                                    title="Bấm để xem danh sách tài liệu"
                                  >
                                    <FolderArchive className="h-3 w-3 shrink-0" />
                                    <span>{task.materials.length} tài liệu</span>
                                    <ChevronDown className="h-2.5 w-2.5 opacity-70" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent
                                  align="end"
                                  side="bottom"
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-64 p-2 rounded-xl border border-border/80 bg-card text-foreground shadow-2xl z-50 space-y-1"
                                >
                                  <div className="px-2 py-1 text-[10px] font-black text-muted-foreground uppercase tracking-wider border-b border-border/50 mb-1 flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                      <FolderArchive className="h-3 w-3 text-cyan-400" />
                                      <span>Tài liệu đính kèm</span>
                                    </span>
                                    <span className="font-mono text-[10px] font-bold bg-cyan-500/20 text-cyan-400 px-1.5 py-0.2 rounded-full">
                                      {task.materials.length}
                                    </span>
                                  </div>
                                  <div className="max-h-48 overflow-y-auto space-y-1">
                                    {task.materials.map((m) => (
                                      <a
                                        key={m.id}
                                        href={m.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between gap-2 p-1.5 rounded-lg text-xs font-semibold hover:bg-[#7D39EB]/15 hover:text-[#C6FF33] transition-all group"
                                      >
                                        <div className="flex items-center gap-1.5 truncate min-w-0">
                                          <ExternalLink className="h-3 w-3 shrink-0 text-cyan-400 group-hover:text-[#C6FF33]" />
                                          <span className="truncate">{m.title || m.url}</span>
                                        </div>
                                        <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 shrink-0 text-[#C6FF33] transition-opacity" />
                                      </a>
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                            <GripVertical className="h-3 w-3 text-muted-foreground/50 opacity-0 group-hover:opacity-100" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div
                  className={cn(
                    "h-32 flex flex-col items-center justify-center text-center p-3 rounded-lg border border-dashed border-border/60 text-muted-foreground text-xs",
                    isTarget && "border-[#C6FF33] bg-[#C6FF33]/10"
                  )}
                >
                  <p className="text-[11px] font-medium">
                    {isTarget ? "Thả nhiệm vụ vào đây" : "Chưa có nhiệm vụ"}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
