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
  CalendarClock,
  UploadCloud,
  FileText,
  ListTodo,
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
} from "@/lib/types";
import { Button } from "@/components/ui/button";
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

interface TaskListViewProps {
  tasks: StudyTask[];
  subjects: Subject[];
  onToggleComplete: (id: string) => void;
  onEditTask: (task: StudyTask) => void;
  onDeleteTask: (id: string) => void;
  onRescheduleTomorrow: (id: string) => void;
}

export function TaskListView({
  tasks,
  subjects,
  onToggleComplete,
  onEditTask,
  onDeleteTask,
  onRescheduleTomorrow,
}: TaskListViewProps) {
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
    <div className="space-y-2">
      {tasks.map((task) => {
        const sub = subjectsMap.get(task.subjectId);
        const subColor = sub?.color || "#7D39EB";
        const clsMeta = STUDY_CLASSIFICATIONS[task.classification];
        const isDone = task.status === "completed";

        const subtaskTotal = task.subtasks?.length || 0;
        const subtaskCompleted = task.subtasks?.filter((s) => s.done).length || 0;
        const materialsTotal = task.materials?.length || 0;

        return (
          <div
            key={task.id}
            className={cn(
              "group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border bg-card transition-all duration-150 hover:border-border/90 hover:shadow-xs",
              isDone && "bg-card/60 opacity-75"
            )}
          >
            {/* Vạch màu môn học bên trái */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl"
              style={{ backgroundColor: subColor }}
            />

            {/* Cột trái: Checkbox + Mã môn + Tiêu đề */}
            <div className="flex items-center gap-3 pl-1.5 min-w-0 flex-1">
              <button
                onClick={() => onToggleComplete(task.id)}
                className={cn(
                  "h-5 w-5 rounded flex items-center justify-center border transition-all cursor-pointer shrink-0",
                  isDone
                    ? "bg-[#C6FF33] border-[#C6FF33] text-black"
                    : "border-border/80 bg-background hover:border-[#C6FF33]"
                )}
                title={isDone ? "Đánh dấu chưa xong" : "Đánh dấu đã hoàn thành"}
              >
                <CheckCircle2
                  className={cn("h-3.5 w-3.5", isDone ? "stroke-[2.5]" : "opacity-0")}
                />
              </button>

              <span
                className="font-black px-1.5 py-0.5 rounded text-[10px] shrink-0"
                style={{
                  backgroundColor: `${subColor}20`,
                  color: subColor,
                }}
              >
                {sub?.code || "MÔN"}
              </span>

              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-xs sm:text-sm font-extrabold text-foreground truncate",
                    isDone && "line-through text-muted-foreground"
                  )}
                >
                  {task.title}
                </p>
              </div>
            </div>

            {/* Cột giữa: Badges metadata */}
            <div className="flex items-center gap-2 flex-wrap pl-8 sm:pl-0 text-xs">
              {clsMeta && (
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold border shrink-0"
                  style={{
                    backgroundColor: clsMeta.bgColor,
                    borderColor: clsMeta.borderColor,
                    color: clsMeta.color,
                  }}
                >
                  {clsMeta.label}
                </span>
              )}

              {/* Hạn chót nếu có */}
              {task.deadline && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#FF5C00]/15 text-[#FF5C00] border border-[#FF5C00]/30 shrink-0">
                  <CalendarClock className="h-3 w-3" />
                  {task.deadline}
                </span>
              )}

              {/* Nút Nộp bài nổi bật nếu có */}
              {task.submissionUrl && (
                <a
                  href={task.submissionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-black bg-gradient-to-r from-[#7D39EB] to-[#9246f8] text-white hover:brightness-110 shadow-xs border border-[#7D39EB]/50 transition-all active:scale-95 shrink-0"
                  title="Mở link nộp bài"
                >
                  <UploadCloud className="h-3 w-3 shrink-0" />
                  <span>Nộp bài</span>
                  <ExternalLink className="h-2.5 w-2.5 opacity-80 shrink-0" />
                </a>
              )}

              {/* Pop-up Tài liệu */}
              {task.materials && task.materials.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
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

              {/* Thời lượng */}
              <span className="text-[11px] font-mono font-bold text-foreground flex items-center gap-1 shrink-0">
                <Clock className="h-3 w-3 text-[#7D39EB]" />
                {task.durationMinutes || 45}p
              </span>
            </div>

            {/* Cột phải: Học ngay + Menu 3 chấm */}
            <div className="flex items-center gap-1.5 self-end sm:self-center pl-8 sm:pl-0 shrink-0">
              <Link href="/sessions">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs font-bold rounded-md border-border/80 hover:bg-[#7D39EB]/15 hover:text-[#7D39EB] gap-1 px-2.5"
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
                    className="h-7 w-7 rounded text-muted-foreground hover:text-foreground"
                  >
                    <MoreVertical className="h-4 w-4" />
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
          </div>
        );
      })}
    </div>
  );
}
