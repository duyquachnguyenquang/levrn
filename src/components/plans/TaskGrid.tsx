"use client";

import React from "react";
import {
  CheckCircle2,
  Clock,
  MoreVertical,
  Calendar,
  Play,
  Edit,
  Trash2,
  Folder,
  UploadCloud,
  FolderArchive,
  ExternalLink,
  ChevronDown,
  ArrowRight,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface TaskGridProps {
  tasks: StudyTask[];
  subjects: Subject[];
  onToggleComplete: (id: string) => void;
  onEditTask: (task: StudyTask) => void;
  onDeleteTask: (id: string) => void;
  onRescheduleTomorrow: (id: string) => void;
}

export function TaskGrid({
  tasks,
  subjects,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  onRescheduleTomorrow,
}: TaskGridProps) {
  const subjectsMap = React.useMemo(() => {
    const map = new Map<string, Subject>();
    subjects.forEach((s) => map.set(s.id, s));
    return map;
  }, [subjects]);

  if (tasks.length === 0) {
    return (
      <div className="py-16 text-center space-y-3 bg-card rounded-xl border border-dashed border-border/80 p-8">
        <Folder className="h-10 w-10 text-muted-foreground mx-auto" />
        <h3 className="text-base font-bold text-foreground">Không tìm thấy nhiệm vụ nào</h3>
        <p className="text-xs text-muted-foreground">Thử xoá bộ lọc hoặc nhấn nút (+) để thêm nhiệm vụ mới.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
      {tasks.map((task) => {
        const sub = subjectsMap.get(task.subjectId);
        const subColor = sub?.color || "#7D39EB";
        const clsMeta = STUDY_CLASSIFICATIONS[task.classification];
        const isDone = task.status === "completed";
        const currentSubtasks = task.subtasks || task.checklist || [];

        let deadlineLabel = "";
        if (task.deadline) {
          try {
            const dl = new Date(task.deadline);
            const h = String(dl.getHours()).padStart(2, "0");
            const m = String(dl.getMinutes()).padStart(2, "0");
            const d = String(dl.getDate()).padStart(2, "0");
            const mo = String(dl.getMonth() + 1).padStart(2, "0");
            deadlineLabel = `${h}:${m} • ${d}/${mo}`;
          } catch {}
        }

        return (
          <div
            key={task.id}
            className={cn(
              "group relative rounded-xl border bg-card p-4 shadow-xs transition-all duration-200 hover:border-border/90 hover:shadow-md flex flex-col justify-between overflow-hidden",
              isDone && "bg-card/70 opacity-80"
            )}
          >
            {/* Vạch màu môn học ở đỉnh card */}
            <div
              className="absolute top-0 left-0 right-0 h-1.5"
              style={{ backgroundColor: subColor }}
            />

            <div className="space-y-3 pt-1">
              {/* Hàng 1: Mã môn + Phân loại + Menu */}
              <div className="flex items-center justify-between gap-1 text-[10px]">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className="font-black px-1.5 py-0.5 rounded text-[10px]"
                    style={{
                      backgroundColor: `${subColor}20`,
                      color: subColor,
                    }}
                  >
                    {sub?.code || "MÔN"}
                  </span>

                  {clsMeta && (
                    <span
                      className="font-bold px-1.5 py-0.5 rounded text-[10px] border"
                      style={{
                        backgroundColor: clsMeta.bgColor,
                        borderColor: clsMeta.borderColor,
                        color: clsMeta.color,
                      }}
                    >
                      {clsMeta.label}
                    </span>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 rounded text-muted-foreground hover:text-foreground"
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44 text-xs">
                    <DropdownMenuItem
                      onClick={() => onEditTask(task)}
                      className="cursor-pointer gap-2"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      <span>Chỉnh sửa</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onRescheduleTomorrow(task.id)}
                      className="cursor-pointer gap-2"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Dời sang ngày mai</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDeleteTask(task.id)}
                      className="text-destructive focus:text-destructive cursor-pointer gap-2"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Xoá</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Tiêu đề & Mô tả */}
              <div>
                <h4
                  className={cn(
                    "text-sm font-extrabold text-foreground line-clamp-2 leading-snug",
                    isDone && "line-through text-muted-foreground"
                  )}
                >
                  {task.title}
                </h4>
                {task.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {task.description}
                  </p>
                )}
              </div>

              {/* Hạn chót & Nộp bài */}
              {(deadlineLabel || task.submissionUrl) && (
                <div className="flex items-center justify-between gap-2 text-xs pt-2 border-t border-border/40">
                  {deadlineLabel ? (
                    <span className="flex items-center gap-1 font-mono text-[11px] font-bold text-amber-500">
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
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black bg-gradient-to-r from-[#7D39EB] to-[#9246f8] text-white hover:brightness-110 shadow-xs border border-[#7D39EB]/50 transition-all active:scale-95 shrink-0"
                      title="Mở trang nộp bài"
                    >
                      <UploadCloud className="h-3.5 w-3.5 shrink-0" />
                      <span>Nộp bài</span>
                      <ExternalLink className="h-3 w-3 opacity-80 shrink-0" />
                    </a>
                  )}
                </div>
              )}

              {/* Thời lượng & Pop-up Tài liệu */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1.5 border-t border-border/50">
                <span className="flex items-center gap-1 font-mono text-[11px] font-bold text-foreground">
                  <Clock className="h-3.5 w-3.5 text-[#7D39EB]" />
                  <span>{task.durationMinutes || 60} phút</span>
                </span>

                <div className="flex items-center gap-2 text-[10px]">
                  {/* Pop-up Tài liệu */}
                  {task.materials && task.materials.length > 0 && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25 transition-all cursor-pointer shadow-xs active:scale-95"
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
                </div>
              </div>
            </div>

            {/* Bottom Actions: Toggle Hoàn thành + Học ngay */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/50">
              <button
                onClick={() => onToggleComplete(task.id)}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer",
                  isDone
                    ? "text-[#10B981] dark:text-[#C6FF33]"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <CheckCircle2
                  className={cn(
                    "h-4 w-4",
                    isDone ? "stroke-[2.5]" : "text-muted-foreground/60"
                  )}
                />
                <span>{isDone ? "Đã xong" : "Chưa làm"}</span>
              </button>

              <Link href="/sessions">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px] font-bold rounded-md border-border/80 hover:bg-[#7D39EB]/15 hover:text-[#7D39EB] gap-1"
                >
                  <Play className="h-3 w-3 fill-current" />
                  <span>Học ngay</span>
                </Button>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
