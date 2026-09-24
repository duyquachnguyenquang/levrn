"use client";

import React from "react";
import {
  Check,
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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
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
              "group relative rounded-xl border bg-card p-3 sm:p-3.5 shadow-xs transition-all duration-200 hover:border-border/90 hover:shadow-md flex flex-col justify-between overflow-hidden",
              isDone && "bg-card/70 opacity-80"
            )}
          >
            {/* Vạch màu môn học ở đỉnh card */}
            <div
              className="absolute top-0 left-0 right-0 h-1.5"
              style={{ backgroundColor: subColor }}
            />

            <div className="space-y-2.5 pt-1">
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
                    "text-xs sm:text-sm font-extrabold text-foreground line-clamp-2 leading-snug min-h-[2.4rem]",
                    isDone && "line-through text-muted-foreground"
                  )}
                >
                  {task.title}
                </h4>
                {task.description && (
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                    {task.description}
                  </p>
                )}
              </div>

              {/* Hàng 1 thông tin: Hạn chót & Nút Nộp bài */}
              {(deadlineLabel || task.submissionUrl) && (
                <div className="min-h-[28px] flex items-center justify-between gap-1.5 pt-2 border-t border-border/40">
                  {deadlineLabel ? (
                    <span
                      className="flex items-center gap-1 font-mono text-[10px] sm:text-[11px] font-bold text-amber-500 truncate min-w-0"
                      title={`Hạn chót: ${deadlineLabel}`}
                    >
                      <Clock className="h-3 w-3 shrink-0" />
                      <span className="truncate">Hạn: {deadlineLabel}</span>
                    </span>
                  ) : (
                    <span />
                  )}

                  {task.submissionUrl && (
                    <a
                      href={task.submissionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="w-[90px] h-7 rounded-md text-[11px] font-bold inline-flex items-center justify-center gap-1 shrink-0 bg-gradient-to-r from-[#7D39EB] to-[#9246f8] text-white hover:brightness-110 shadow-xs border border-[#7D39EB]/50 transition-all active:scale-95 ml-auto"
                      title="Mở trang nộp bài"
                    >
                      <UploadCloud className="h-3 w-3 shrink-0" />
                      <span className="truncate">Nộp bài</span>
                      <ExternalLink className="h-2.5 w-2.5 opacity-80 shrink-0" />
                    </a>
                  )}
                </div>
              )}

              {/* Hàng 2 thông tin: Thời lượng & Nút Tài liệu */}
              <div className="min-h-[28px] flex items-center justify-between gap-1.5 pt-1.5 border-t border-border/50 text-muted-foreground">
                <span className="flex items-center gap-1 font-mono text-[10px] sm:text-[11px] font-bold text-foreground truncate min-w-0">
                  <Clock className="h-3 w-3 text-[#7D39EB] shrink-0" />
                  <span className="truncate">{task.durationMinutes || 60} phút</span>
                </span>

                {task.materials && task.materials.length > 0 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        className="w-[90px] h-7 rounded-md text-[11px] font-bold inline-flex items-center justify-center gap-1 shrink-0 bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25 transition-all cursor-pointer shadow-xs active:scale-95 ml-auto"
                        title="Bấm để xem danh sách tài liệu"
                      >
                        <FolderArchive className="h-3 w-3 shrink-0" />
                        <span className="truncate">{task.materials.length} tài liệu</span>
                        <ChevronDown className="h-2.5 w-2.5 opacity-70 shrink-0" />
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

            {/* Hàng 3: Nút tick hoàn thành (Chưa xong / Đã xong) & Nút Học ngay */}
            <div className="min-h-[28px] flex items-center justify-between gap-1.5 pt-2 mt-2 border-t border-border/50">
              <button
                type="button"
                onClick={() => onToggleComplete(task.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 py-0.5 px-1 rounded-md text-xs font-bold transition-all cursor-pointer group min-w-0 truncate",
                  isDone
                    ? "text-[#10B981] dark:text-[#C6FF33]"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title={isDone ? "Đã xong (Bấm để chuyển sang chưa xong)" : "Chưa xong (Bấm để hoàn thành)"}
              >
                <div
                  className={cn(
                    "h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                    isDone
                      ? "bg-[#10B981] dark:bg-[#C6FF33] border-[#10B981] dark:border-[#C6FF33] text-black shadow-xs"
                      : "border-muted-foreground/60 group-hover:border-[#7D39EB]"
                  )}
                >
                  {isDone && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                </div>
                <span className="text-[11px] font-bold truncate">
                  {isDone ? "Đã xong" : "Chưa xong"}
                </span>
              </button>

              <Link href="/sessions" className="shrink-0 ml-auto">
                <button
                  type="button"
                  className="w-[90px] h-7 rounded-md text-[11px] font-bold inline-flex items-center justify-center gap-1 shrink-0 bg-background hover:bg-[#7D39EB]/15 hover:text-[#7D39EB] border border-border/80 text-foreground transition-all shadow-xs active:scale-95 cursor-pointer"
                  title="Bắt đầu phiên học ngay"
                >
                  <Play className="h-3 w-3 fill-current shrink-0" />
                  <span className="truncate">Học ngay</span>
                </button>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
