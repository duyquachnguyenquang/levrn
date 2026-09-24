"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Clock,
  Search,
  CheckCircle2,
  Plus,
  Layers,
  Filter,
  List,
  LayoutGrid,
  Calendar,
  CalendarClock,
  CalendarX,
  FileText,
  GraduationCap,
  BookOpen,
  UploadCloud,
  FolderArchive,
  ExternalLink,
  Trash2,
  FolderOpen,
  Check,
  X,
  RotateCcw,
} from "lucide-react";
import {
  Subject,
  StudyTask,
  StudyTaskFormData,
  StudyTaskStatus,
  StudyPlanClassification,
  StudyPriority,
  TaskMaterialItem,
  STUDY_CLASSIFICATIONS,
  STUDY_PRIORITIES,
} from "@/lib/types";
import { DateTimePicker } from "@/components/plans/DateTimePicker";
import { cn } from "@/lib/utils";

interface TaskAssignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: string; // YYYY-MM-DD
  tasks: StudyTask[];
  subjects: Subject[];
  onAssignDeadline: (
    taskId: string,
    deadline: string,
    newDate?: string
  ) => Promise<{ success: boolean; error?: string }>;
  onCreateTask: (
    formData: StudyTaskFormData
  ) => Promise<{ success: boolean; id: string; error?: string }>;
  onSelectDate?: (dateStr: string) => void;
}

// Chuyển đối tượng Date thành YYYY-MM-DD
function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Định dạng ngày giờ ngắn gọn tiếng Việt
function formatDeadlineDisplay(deadlineStr?: string): string {
  if (!deadlineStr) return "Chưa đặt hạn chót";
  const isIso = deadlineStr.includes("T");
  const parts = deadlineStr.split("T");
  const datePart = parts[0];
  const timePart = parts[1] ? parts[1].substring(0, 5) : "";

  const [y, m, d] = datePart.split("-");
  const dateFormatted = `${d}/${m}`;

  if (timePart === "23:59" || !timePart) {
    return `Cả ngày • ${dateFormatted}`;
  }
  return `${timePart} • ${dateFormatted}`;
}

// Component Popover chọn/sửa ngày giờ hạn chót (hỗ trợ Cả ngày)
interface DeadlinePickerPopoverProps {
  initialDeadline?: string;
  defaultDate?: string;
  onSave: (deadlineIso: string, targetDate: string) => void;
  triggerButton: React.ReactNode;
}

function DeadlinePickerPopover({
  initialDeadline,
  defaultDate,
  onSave,
  triggerButton,
}: DeadlinePickerPopoverProps) {
  const [popOpen, setPopOpen] = useState(false);
  const todayStr = useMemo(() => toDateString(new Date()), []);

  const [dateVal, setDateVal] = useState(() => {
    if (initialDeadline) {
      return initialDeadline.split("T")[0] || todayStr;
    }
    return defaultDate || todayStr;
  });

  const [timeVal, setTimeVal] = useState(() => {
    if (initialDeadline && initialDeadline.includes("T")) {
      return initialDeadline.split("T")[1].substring(0, 5) || "23:59";
    }
    return "23:59";
  });

  const [isAllDay, setIsAllDay] = useState(() => {
    if (initialDeadline && initialDeadline.includes("T")) {
      const t = initialDeadline.split("T")[1].substring(0, 5);
      return t === "23:59";
    }
    return true;
  });

  useEffect(() => {
    if (popOpen) {
      if (initialDeadline) {
        const d = initialDeadline.split("T")[0] || todayStr;
        const t = initialDeadline.includes("T")
          ? initialDeadline.split("T")[1].substring(0, 5)
          : "23:59";
        setDateVal(d);
        setTimeVal(t);
        setIsAllDay(t === "23:59");
      } else {
        setDateVal(defaultDate || todayStr);
        setTimeVal("23:59");
        setIsAllDay(true);
      }
    }
  }, [popOpen, initialDeadline, defaultDate, todayStr]);

  const handleApply = () => {
    const finalTime = isAllDay ? "23:59" : timeVal || "23:59";
    const deadlineIso = `${dateVal}T${finalTime}`;
    onSave(deadlineIso, dateVal);
    setPopOpen(false);
  };

  const handleSetQuickDate = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    setDateVal(toDateString(d));
  };

  return (
    <Popover open={popOpen} onOpenChange={setPopOpen}>
      <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-72 p-3.5 rounded-xl border-border/80 shadow-2xl bg-card text-foreground z-50 space-y-3"
      >
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <span className="text-xs font-black text-foreground flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5 text-[#7D39EB]" />
            <span>Chọn hạn chót</span>
          </span>
          <label className="flex items-center gap-1.5 text-xs font-bold text-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAllDay}
              onChange={(e) => {
                setIsAllDay(e.target.checked);
                if (e.target.checked) setTimeVal("23:59");
              }}
              className="rounded border-input text-[#7D39EB] focus:ring-[#7D39EB] cursor-pointer h-3.5 w-3.5"
            />
            <span>Cả ngày</span>
          </label>
        </div>

        {/* Ô chọn ngày */}
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground">Ngày:</span>
          <Input
            type="date"
            value={dateVal}
            onChange={(e) => setDateVal(e.target.value)}
            className="text-xs font-bold font-mono h-8 bg-background border-border/80"
          />
          {/* Phím ngày nhanh */}
          <div className="flex flex-wrap gap-1 pt-1">
            <button
              type="button"
              onClick={() => handleSetQuickDate(0)}
              className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 transition-colors"
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={() => handleSetQuickDate(1)}
              className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 transition-colors"
            >
              Ngày mai
            </button>
            <button
              type="button"
              onClick={() => handleSetQuickDate(3)}
              className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 transition-colors"
            >
              +3 ngày
            </button>
            <button
              type="button"
              onClick={() => handleSetQuickDate(7)}
              className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 transition-colors"
            >
              +1 tuần
            </button>
          </div>
        </div>

        {/* Ô chọn giờ nếu không chọn Cả ngày */}
        {!isAllDay && (
          <div className="space-y-1 pt-1 border-t border-border/50">
            <span className="text-[11px] font-semibold text-muted-foreground">Giờ:</span>
            <Input
              type="time"
              value={timeVal}
              onChange={(e) => setTimeVal(e.target.value)}
              className="text-xs font-bold font-mono h-8 bg-background border-border/80"
            />
            {/* Phím giờ nhanh */}
            <div className="flex items-center gap-1 pt-0.5">
              {["23:59", "18:00", "12:00"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTimeVal(t)}
                  className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 transition-colors font-mono"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2 flex justify-end gap-1.5 border-t border-border/60">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPopOpen(false)}
            className="text-xs h-7 px-2.5"
          >
            Đóng
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleApply}
            className="text-xs h-7 px-3 bg-[#7D39EB] hover:bg-[#6826d4] text-white font-bold"
          >
            Lưu hạn chót
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function TaskAssignModal({
  open,
  onOpenChange,
  initialDate,
  tasks,
  subjects,
  onAssignDeadline,
  onCreateTask,
  onSelectDate,
}: TaskAssignModalProps) {
  const todayStr = useMemo(() => toDateString(new Date()), []);
  const defaultTargetDate = initialDate || todayStr;

  // Tab: "assign" (Nhập từ danh sách) hoặc "create" (Tạo nhiệm vụ mới)
  const [activeTab, setActiveTab] = useState<"assign" | "create">("assign");

  // Dạng xem danh sách: "grid" (Thẻ 3 cột) hoặc "list" (Danh sách ngang)
  const [viewLayout, setViewLayout] = useState<"grid" | "list">("grid");

  // Tìm kiếm & Bộ lọc cho danh sách
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "no_deadline" | "incomplete">("all");
  const [filterSubjectId, setFilterSubjectId] = useState<string>("ALL");
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);

  // Thông báo phản hồi
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Map Môn học
  const subjectsMap = useMemo(() => {
    const map = new Map<string, Subject>();
    subjects.forEach((s) => map.set(s.id, s));
    return map;
  }, [subjects]);

  // Khởi tạo lại trạng thái khi mở modal
  useEffect(() => {
    if (open) {
      setToastMsg(null);
      setSearchQuery("");
      setFilterMode("all");
      setFilterSubjectId("ALL");
    }
  }, [open]);

  // --- FORM TẠO NHIỆM VỤ MỚI (CHUẨN FORM NHIỆM VỤ CỦA KẾ HOẠCH HỌC TẬP) ---
  const availableSemesters = useMemo(() => {
    const list = Array.from(new Set(subjects.map((s) => s.semester))).filter(Boolean);
    return list.length > 0 ? list : ["HK1 2024-2025"];
  }, [subjects]);

  const [createTitle, setCreateTitle] = useState("");
  const [createClassification, setCreateClassification] =
    useState<StudyPlanClassification>("theory");
  const [createSemester, setCreateSemester] = useState("");
  const [createSubjectId, setCreateSubjectId] = useState("");
  const [createStatus, setCreateStatus] = useState<StudyTaskStatus>("todo");
  const [createDuration, setCreateDuration] = useState(60);
  const [createDeadline, setCreateDeadline] = useState<string | undefined>(() => {
    return initialDate ? `${initialDate}T23:59` : undefined;
  });
  const [createSubmissionUrl, setCreateSubmissionUrl] = useState("");
  const [createMaterials, setCreateMaterials] = useState<TaskMaterialItem[]>([]);
  const [newMaterialUrl, setNewMaterialUrl] = useState("");
  const [newMaterialTitle, setNewMaterialTitle] = useState("");
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Reset form tạo mới khi mở dialog hoặc chuyển tab
  useEffect(() => {
    if (open) {
      setCreateTitle("");
      setCreateClassification("theory");
      setCreateStatus("todo");
      setCreateDuration(60);
      setCreateDeadline(initialDate ? `${initialDate}T23:59` : undefined);
      setCreateSubmissionUrl("");
      setCreateMaterials([]);
      setNewMaterialUrl("");
      setNewMaterialTitle("");

      let initSem = availableSemesters[0] || "";
      let initSubId = "";
      if (subjects.length > 0) {
        const first = subjects.find((s) => s.semester === initSem) || subjects[0];
        initSubId = first.id;
        initSem = first.semester || initSem;
      }
      setCreateSemester(initSem);
      setCreateSubjectId(initSubId);
    }
  }, [open, initialDate, subjects, availableSemesters]);

  const createSemesterSubjects = useMemo(() => {
    if (!createSemester) return subjects;
    const filtered = subjects.filter((s) => s.semester === createSemester);
    return filtered.length > 0 ? filtered : subjects;
  }, [subjects, createSemester]);

  const handleSemesterChange = (newSem: string) => {
    setCreateSemester(newSem);
    const valid = subjects.filter((s) => s.semester === newSem);
    if (valid.length > 0 && !valid.some((s) => s.id === createSubjectId)) {
      setCreateSubjectId(valid[0].id);
    }
  };

  const handleAddMaterial = () => {
    if (!newMaterialUrl.trim()) return;
    let url = newMaterialUrl.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    const titleText = newMaterialTitle.trim() || url;
    setCreateMaterials((prev) => [
      ...prev,
      { id: "mat-" + Date.now(), title: titleText, url },
    ]);
    setNewMaterialUrl("");
    setNewMaterialTitle("");
  };

  const handleRemoveMaterial = (id: string) => {
    setCreateMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  // Submit tạo nhiệm vụ mới
  const handleSubmitCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim()) {
      setToastMsg({ type: "error", text: "Vui lòng nhập tiêu đề nhiệm vụ." });
      return;
    }

    try {
      setIsSubmittingCreate(true);
      const targetDate = createDeadline
        ? createDeadline.split("T")[0]
        : defaultTargetDate;

      const formData: StudyTaskFormData = {
        title: createTitle.trim(),
        subjectId: createSubjectId || (subjects[0]?.id ?? ""),
        semester: createSemester || undefined,
        classification: createClassification,
        priority: "medium",
        status: createStatus,
        durationMinutes: Number(createDuration) || 60,
        deadline: createDeadline || undefined,
        date: targetDate,
        submissionUrl: createSubmissionUrl.trim() || undefined,
        materials: createMaterials.length > 0 ? createMaterials : undefined,
      };

      const res = await onCreateTask(formData);
      if (res.success) {
        setToastMsg({
          type: "success",
          text: `Đã tạo nhiệm vụ "${createTitle.trim()}" và lưu vào Kế hoạch học tập!`,
        });
        setActiveTab("assign");
        if (onSelectDate) onSelectDate(targetDate);
      } else {
        setToastMsg({
          type: "error",
          text: res.error || "Không thể tạo nhiệm vụ.",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã có lỗi xảy ra.";
      setToastMsg({ type: "error", text: msg });
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // --- TAB NHẬP TỪ DANH SÁCH: LỌC NHIỆM VỤ ---
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Tìm kiếm
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const sub = subjectsMap.get(t.subjectId);
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchSub = sub
          ? sub.name.toLowerCase().includes(q) || sub.code.toLowerCase().includes(q)
          : false;
        if (!matchTitle && !matchSub) return false;
      }

      // Lọc môn
      if (filterSubjectId !== "ALL" && t.subjectId !== filterSubjectId) {
        return false;
      }

      // Lọc trạng thái / deadline
      if (filterMode === "no_deadline" && t.deadline) {
        return false;
      }
      if (filterMode === "incomplete" && t.status === "completed") {
        return false;
      }

      return true;
    });
  }, [tasks, searchQuery, filterSubjectId, filterMode, subjectsMap]);

  // Xử lý gán hạn chót
  const handleAssign = async (taskId: string, deadlineIso: string, targetDate: string) => {
    const task = tasks.find((t) => t.id === taskId);
    const res = await onAssignDeadline(taskId, deadlineIso, targetDate);
    if (res.success) {
      setToastMsg({
        type: "success",
        text: `Đã gán hạn chót cho "${task?.title || "nhiệm vụ"}" (${formatDeadlineDisplay(
          deadlineIso
        )})!`,
      });
      if (onSelectDate) onSelectDate(targetDate);
    } else {
      setToastMsg({ type: "error", text: res.error || "Không thể gán hạn chót." });
    }
  };

  // Xử lý huỷ gán hạn chót
  const handleUnassign = async (task: StudyTask) => {
    const res = await onAssignDeadline(task.id, "", undefined);
    if (res.success) {
      setToastMsg({
        type: "success",
        text: `Đã huỷ hạn chót của nhiệm vụ "${task.title}".`,
      });
    } else {
      setToastMsg({ type: "error", text: res.error || "Không thể huỷ hạn chót." });
    }
  };

  // Kiểm tra có đang áp dụng bộ lọc nào không
  const hasActiveFilter = filterMode !== "all" || filterSubjectId !== "ALL";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-5 sm:p-6 rounded-xl border border-border/80 bg-card text-foreground shadow-2xl">
        {/* Header Tinh Gọn chuẩn Eduplex */}
        <DialogHeader className="pb-3 border-b border-border/60">
          <DialogTitle className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#7D39EB]" />
            <span>Thêm nhiệm vụ</span>
          </DialogTitle>
        </DialogHeader>

        {/* Thông báo Alert */}
        {toastMsg && (
          <div
            className={cn(
              "p-3 rounded-lg text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in duration-200 border",
              toastMsg.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
            )}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{toastMsg.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMsg(null)}
              className="text-[11px] underline opacity-80 hover:opacity-100 cursor-pointer"
            >
              Đóng
            </button>
          </div>
        )}

        {/* Cụm 2 nút chuyển đổi: Nhập nhiệm vụ từ danh sách & Tạo nhiệm vụ mới */}
        <div className="flex items-center rounded-lg bg-muted/60 p-1 border border-border/60">
          <button
            type="button"
            onClick={() => setActiveTab("assign")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs sm:text-sm font-bold transition-all cursor-pointer",
              activeTab === "assign"
                ? "bg-[#7D39EB] text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <FolderOpen className="h-4 w-4" />
            <span>Nhập nhiệm vụ từ danh sách</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
              {tasks.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("create")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs sm:text-sm font-bold transition-all cursor-pointer",
              activeTab === "create"
                ? "bg-[#7D39EB] text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Plus className="h-4 w-4" />
            <span>Tạo nhiệm vụ mới</span>
          </button>
        </div>

        {/* =========================================================================
            TAB 1: NHẬP NHIỆM VỤ TỪ DANH SÁCH (CARD 3 CỘT / LIST + BỘ LỌC GỌN)
        ========================================================================= */}
        {activeTab === "assign" && (
          <div className="space-y-4 pt-1 animate-in fade-in-50 duration-200">
            {/* Thanh công cụ tìm kiếm + Nút Bộ lọc + Nút Đổi giao diện Thẻ/List */}
            <div className="flex items-center gap-2">
              {/* Ô tìm kiếm */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo tên nhiệm vụ hoặc mã môn..."
                  className="pl-8 text-xs h-9 bg-background/80 border-input rounded-lg"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Nút Bộ lọc Popover gom chung */}
              <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-9 px-3 gap-1.5 text-xs font-bold rounded-lg border-input bg-background/80 transition-all cursor-pointer",
                      hasActiveFilter
                        ? "border-[#7D39EB] text-[#7D39EB] bg-[#7D39EB]/10"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    title="Bộ lọc nhiệm vụ"
                  >
                    <Filter className="h-4 w-4" />
                    <span className="hidden sm:inline">Bộ lọc</span>
                    {hasActiveFilter && (
                      <span className="h-2 w-2 rounded-full bg-[#7D39EB]" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-72 p-4 rounded-xl border-border/80 shadow-2xl bg-card text-foreground z-50 space-y-3.5"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <span className="font-extrabold text-xs text-foreground flex items-center gap-1.5">
                      <Filter className="h-3.5 w-3.5 text-[#7D39EB]" />
                      <span>Bộ lọc nhiệm vụ</span>
                    </span>
                    {hasActiveFilter && (
                      <button
                        type="button"
                        onClick={() => {
                          setFilterMode("all");
                          setFilterSubjectId("ALL");
                        }}
                        className="text-[11px] font-semibold text-[#7D39EB] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Đặt lại</span>
                      </button>
                    )}
                  </div>

                  {/* Lọc theo trạng thái / hạn chót */}
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase">
                      Hạn chót &amp; Trạng thái
                    </Label>
                    <div className="grid grid-cols-1 gap-1">
                      {[
                        { id: "all", label: `Tất cả (${tasks.length})` },
                        {
                          id: "no_deadline",
                          label: `Chưa có hạn chót (${
                            tasks.filter((t) => !t.deadline).length
                          })`,
                        },
                        {
                          id: "incomplete",
                          label: `Chưa hoàn thành (${
                            tasks.filter((t) => t.status !== "completed").length
                          })`,
                        },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setFilterMode(item.id as typeof filterMode)}
                          className={cn(
                            "px-2.5 py-1.5 text-xs font-semibold rounded-md text-left transition-colors cursor-pointer flex items-center justify-between",
                            filterMode === item.id
                              ? "bg-[#7D39EB] text-white font-bold"
                              : "hover:bg-muted text-foreground"
                          )}
                        >
                          <span>{item.label}</span>
                          {filterMode === item.id && <Check className="h-3.5 w-3.5" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lọc theo Môn học */}
                  <div className="space-y-1.5 pt-2 border-t border-border/50">
                    <Label className="text-[11px] font-bold text-muted-foreground uppercase">
                      Môn học
                    </Label>
                    <select
                      value={filterSubjectId}
                      onChange={(e) => setFilterSubjectId(e.target.value)}
                      className="w-full text-xs h-8.5 px-2.5 rounded-lg border border-input bg-background text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#7D39EB]"
                    >
                      <option value="ALL">Tất cả môn ({subjects.length})</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          [{s.code}] {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Nút chuyển đổi xem Thẻ (Grid) / Danh sách (List) */}
              <div className="flex items-center rounded-lg bg-muted/60 p-0.5 border border-border/60">
                <button
                  type="button"
                  onClick={() => setViewLayout("grid")}
                  className={cn(
                    "p-1.5 rounded-md text-xs transition-all cursor-pointer",
                    viewLayout === "grid"
                      ? "bg-background text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Xem dạng thẻ (3 thẻ / hàng)"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewLayout("list")}
                  className={cn(
                    "p-1.5 rounded-md text-xs transition-all cursor-pointer",
                    viewLayout === "list"
                      ? "bg-background text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Xem dạng danh sách"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* DANH SÁCH NHIỆM VỤ */}
            <div className="max-h-[55vh] overflow-y-auto pr-1">
              {filteredTasks.length > 0 ? (
                viewLayout === "grid" ? (
                  /* GIAO DIỆN THẺ (3 THẺ MỘT HÀNG) */
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {filteredTasks.map((task) => {
                      const sub = subjectsMap.get(task.subjectId);
                      const subColor = sub?.color || "#7D39EB";
                      const classMeta = STUDY_CLASSIFICATIONS[task.classification];
                      const isAssigned = !!task.deadline;

                      return (
                        <div
                          key={task.id}
                          className={cn(
                            "p-3 rounded-xl border flex flex-col justify-between transition-all duration-200 text-left bg-card hover:shadow-sm",
                            isAssigned
                              ? "border-[#7D39EB]/40 bg-[#7D39EB]/5"
                              : "border-border/70 hover:border-[#7D39EB]/30"
                          )}
                        >
                          <div className="space-y-2">
                            {/* Badges môn học & phân loại */}
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              <span
                                className="px-2 py-0.5 rounded text-[10px] font-extrabold text-white"
                                style={{ backgroundColor: subColor }}
                              >
                                {sub?.code || "Môn"}
                              </span>
                              {classMeta && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                                  {classMeta.shortLabel}
                                </span>
                              )}
                            </div>

                            {/* Tiêu đề nhiệm vụ */}
                            <h4 className="font-bold text-xs text-foreground line-clamp-2 leading-snug">
                              {task.title}
                            </h4>

                            {/* Trạng thái hạn chót */}
                            <div className="pt-1 text-[11px]">
                              {isAssigned ? (
                                <div className="flex items-center gap-1 font-semibold text-[#7D39EB] dark:text-[#C6FF33]">
                                  <Clock className="h-3 w-3 shrink-0" />
                                  <span className="truncate">
                                    {formatDeadlineDisplay(task.deadline)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground/60 italic">
                                  Chưa đặt hạn chót
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Hành động dưới thẻ: Điều chỉnh ngày / Huỷ gán / Gán hạn chót */}
                          <div className="pt-3 border-t border-border/50 mt-3 flex items-center justify-between gap-1.5">
                            {isAssigned ? (
                              <>
                                <DeadlinePickerPopover
                                  initialDeadline={task.deadline}
                                  defaultDate={defaultTargetDate}
                                  onSave={(iso, dDate) => handleAssign(task.id, iso, dDate)}
                                  triggerButton={
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-[11px] font-bold px-2 flex-1 border-border/80 hover:border-[#7D39EB] hover:text-[#7D39EB]"
                                      title="Điều chỉnh ngày hạn chót"
                                    >
                                      <CalendarClock className="h-3 w-3 mr-1" />
                                      Đổi ngày
                                    </Button>
                                  }
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleUnassign(task)}
                                  className="h-7 px-2 text-[11px] font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  title="Huỷ hạn chót đã gán"
                                >
                                  <CalendarX className="h-3.5 w-3.5" />
                                  <span className="sr-only">Huỷ gán</span>
                                </Button>
                              </>
                            ) : (
                              <DeadlinePickerPopover
                                defaultDate={defaultTargetDate}
                                onSave={(iso, dDate) => handleAssign(task.id, iso, dDate)}
                                triggerButton={
                                  <Button
                                    size="sm"
                                    className="w-full h-7 text-[11px] font-bold bg-[#7D39EB] hover:bg-[#6826d4] text-white shadow-xs"
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Gán hạn chót
                                  </Button>
                                }
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* GIAO DIỆN DANH SÁCH (LIST) */
                  <div className="space-y-2">
                    {filteredTasks.map((task) => {
                      const sub = subjectsMap.get(task.subjectId);
                      const subColor = sub?.color || "#7D39EB";
                      const classMeta = STUDY_CLASSIFICATIONS[task.classification];
                      const isAssigned = !!task.deadline;

                      return (
                        <div
                          key={task.id}
                          className={cn(
                            "p-3 rounded-xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left bg-card",
                            isAssigned
                              ? "border-[#7D39EB]/40 bg-[#7D39EB]/5"
                              : "border-border/70 hover:border-[#7D39EB]/30 hover:bg-muted/20"
                          )}
                        >
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className="px-2 py-0.5 rounded text-[10px] font-extrabold text-white"
                                style={{ backgroundColor: subColor }}
                              >
                                {sub?.code || "Môn"}
                              </span>
                              {classMeta && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                                  {classMeta.shortLabel}
                                </span>
                              )}
                              {task.status === "completed" && (
                                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[9px] px-1.5 py-0">
                                  Đã xong
                                </Badge>
                              )}
                            </div>
                            <h4 className="font-bold text-xs text-foreground line-clamp-1">
                              {task.title}
                            </h4>
                            <div className="text-[11px]">
                              {isAssigned ? (
                                <span className="font-semibold text-[#7D39EB] dark:text-[#C6FF33] flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{formatDeadlineDisplay(task.deadline)}</span>
                                </span>
                              ) : (
                                <span className="text-muted-foreground/60 italic">
                                  Chưa đặt hạn chót
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Hành động */}
                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                            {isAssigned ? (
                              <>
                                <DeadlinePickerPopover
                                  initialDeadline={task.deadline}
                                  defaultDate={defaultTargetDate}
                                  onSave={(iso, dDate) => handleAssign(task.id, iso, dDate)}
                                  triggerButton={
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 text-xs font-bold border-border/80 hover:border-[#7D39EB]"
                                    >
                                      <CalendarClock className="h-3.5 w-3.5 mr-1" />
                                      Đổi ngày
                                    </Button>
                                  }
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleUnassign(task)}
                                  className="h-8 text-xs font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                >
                                  <CalendarX className="h-3.5 w-3.5 mr-1" />
                                  Huỷ gán
                                </Button>
                              </>
                            ) : (
                              <DeadlinePickerPopover
                                defaultDate={defaultTargetDate}
                                onSave={(iso, dDate) => handleAssign(task.id, iso, dDate)}
                                triggerButton={
                                  <Button
                                    size="sm"
                                    className="h-8 text-xs font-bold bg-[#7D39EB] hover:bg-[#6826d4] text-white shadow-xs"
                                  >
                                    <Plus className="h-3.5 w-3.5 mr-1" />
                                    Gán hạn chót
                                  </Button>
                                }
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                <div className="py-10 text-center space-y-2 border border-dashed border-border/70 rounded-xl">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Không tìm thấy nhiệm vụ nào phù hợp.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("create")}
                    className="text-xs font-bold gap-1 border-dashed"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Tạo nhiệm vụ mới ngay
                  </Button>
                </div>
              )}
            </div>

            {/* Footer Tab 1 */}
            <div className="pt-2 border-t border-border/60 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                Hiển thị <strong>{filteredTasks.length}</strong> / {tasks.length} nhiệm vụ
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-xs font-bold h-8"
              >
                Đóng
              </Button>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: TẠO NHIỆM VỤ MỚI (GIỐNG HOÀN TOÀN POP-UP KẾ HOẠCH HỌC TẬP)
        ========================================================================= */}
        {activeTab === "create" && (
          <form
            onSubmit={handleSubmitCreateTask}
            className="space-y-4 pt-1 animate-in fade-in-50 duration-200"
          >
            {/* HÀNG 1: Tiêu đề + Phân loại (đối xứng độ cao h-10) */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
              <div className="sm:col-span-8 flex flex-col justify-end">
                <Label className="text-xs font-bold flex items-center gap-1.5 text-foreground h-5 mb-1.5">
                  <FileText className="h-3.5 w-3.5 text-[#7D39EB]" />
                  <span>Tiêu đề nhiệm vụ</span>
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="VD: Luyện 30 câu trắc nghiệm Cây nhị phân tìm kiếm..."
                  className="h-10 text-xs sm:text-sm rounded-lg bg-background/80 border-input focus-visible:ring-[#7D39EB]"
                  autoFocus
                />
              </div>

              <div className="sm:col-span-4 flex flex-col justify-end">
                <Label className="text-xs font-bold flex items-center gap-1.5 text-foreground h-5 mb-1.5">
                  <Layers className="h-3.5 w-3.5 text-[#7D39EB]" />
                  <span>Phân loại</span>
                  <span className="text-destructive">*</span>
                </Label>
                <select
                  value={createClassification}
                  onChange={(e) =>
                    setCreateClassification(e.target.value as StudyPlanClassification)
                  }
                  className="w-full h-10 rounded-lg border border-input bg-background/80 px-3 text-xs sm:text-sm font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#7D39EB] cursor-pointer"
                >
                  {(Object.keys(STUDY_CLASSIFICATIONS) as StudyPlanClassification[]).map((key) => (
                    <option key={key} value={key}>
                      {STUDY_CLASSIFICATIONS[key].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* HÀNG 2: Học kỳ + Môn học + Trạng thái (3 cột đều nhau, đồng bộ h-10) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="flex flex-col justify-end">
                <Label className="text-xs font-bold flex items-center gap-1.5 text-foreground h-5 mb-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-[#7D39EB]" />
                  <span>Học kỳ</span>
                  <span className="text-destructive">*</span>
                </Label>
                <select
                  value={createSemester}
                  onChange={(e) => handleSemesterChange(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background/80 px-3 text-xs sm:text-sm font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#7D39EB] cursor-pointer"
                >
                  {availableSemesters.map((sem) => (
                    <option key={sem} value={sem}>
                      {sem}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <Label className="text-xs font-bold flex items-center gap-1.5 text-foreground h-5 mb-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-[#7D39EB]" />
                  <span>Môn học</span>
                  <span className="text-destructive">*</span>
                </Label>
                <select
                  value={createSubjectId}
                  onChange={(e) => setCreateSubjectId(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background/80 px-3 text-xs sm:text-sm font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#7D39EB] cursor-pointer truncate"
                >
                  {createSemesterSubjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      [{sub.code}] {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <Label className="text-xs font-bold flex items-center gap-1.5 text-foreground h-5 mb-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#7D39EB]" />
                  <span>Trạng thái</span>
                </Label>
                <select
                  value={createStatus}
                  onChange={(e) => setCreateStatus(e.target.value as StudyTaskStatus)}
                  className="w-full h-10 rounded-lg border border-input bg-background/80 px-3 text-xs sm:text-sm font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#7D39EB] cursor-pointer"
                >
                  <option value="todo">Chưa xong</option>
                  <option value="completed">Đã xong</option>
                </select>
              </div>
            </div>

            {/* HÀNG 3: Thời lượng + Hạn chót (Deadline có Cả ngày) + Link nộp bài */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="flex flex-col justify-end">
                <Label className="text-xs font-bold flex items-center gap-1.5 text-foreground h-5 mb-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#7D39EB]" />
                  <span>Thời lượng (phút)</span>
                </Label>
                <Input
                  type="number"
                  min={5}
                  step={5}
                  value={createDuration}
                  onChange={(e) => setCreateDuration(Number(e.target.value))}
                  placeholder="60"
                  className="h-10 text-xs sm:text-sm rounded-lg bg-background/80 font-mono font-bold border-input"
                />
              </div>

              <div className="flex flex-col justify-end">
                <Label className="text-xs font-bold flex items-center gap-1.5 text-foreground h-5 mb-1.5">
                  <CalendarClock className="h-3.5 w-3.5 text-[#7D39EB]" />
                  <span>Hạn chót (Deadline)</span>
                </Label>
                <DateTimePicker
                  value={createDeadline}
                  onChange={setCreateDeadline}
                  placeholder="Chọn ngày & giờ..."
                  className="h-10 text-xs sm:text-sm rounded-lg"
                />
              </div>

              <div className="flex flex-col justify-end">
                <Label className="text-xs font-bold flex items-center gap-1.5 text-foreground h-5 mb-1.5">
                  <UploadCloud className="h-3.5 w-3.5 text-[#7D39EB]" />
                  <span>Link nộp bài</span>
                </Label>
                <Input
                  value={createSubmissionUrl}
                  onChange={(e) => setCreateSubmissionUrl(e.target.value)}
                  placeholder="https://courses.ut.edu.vn/..."
                  className="h-10 text-xs sm:text-sm rounded-lg bg-background/80 font-mono border-input"
                />
              </div>
            </div>

            {/* HÀNG 4: Tài liệu (Đa liên kết) */}
            <div className="space-y-2 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                  <FolderArchive className="h-3.5 w-3.5 text-[#7D39EB]" />
                  <span>Tài liệu</span>
                </Label>
                <span className="text-[11px] font-mono text-muted-foreground font-semibold">
                  {createMaterials.length} liên kết đã thêm
                </span>
              </div>

              {createMaterials.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto p-1.5 rounded-lg bg-background/50 border border-border/60">
                  {createMaterials.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-lg bg-card text-xs border border-border/60 shadow-xs group"
                    >
                      <a
                        href={m.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#7D39EB] dark:text-[#C6FF33] font-bold hover:underline flex items-center gap-1.5 truncate text-xs min-w-0"
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        <span className="truncate">{m.title || m.url}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemoveMaterial(m.id)}
                        className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors cursor-pointer shrink-0"
                        title="Xoá liên kết"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-7">
                  <Input
                    value={newMaterialUrl}
                    onChange={(e) => setNewMaterialUrl(e.target.value)}
                    placeholder="Dán link tài liệu (Google Drive, LMS, PDF)..."
                    className="h-10 text-xs sm:text-sm rounded-lg bg-background/80 font-mono border-input"
                  />
                </div>
                <div className="sm:col-span-3">
                  <Input
                    value={newMaterialTitle}
                    onChange={(e) => setNewMaterialTitle(e.target.value)}
                    placeholder="Tên gợi nhớ (tuỳ chọn)"
                    className="h-10 text-xs sm:text-sm rounded-lg bg-background/80 border-input"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddMaterial}
                    className="w-full h-10 rounded-lg text-xs font-bold border-border/80 hover:bg-[#7D39EB]/15 hover:text-[#7D39EB] cursor-pointer gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Thêm</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Footer nút hành động: Huỷ + Tạo nhiệm vụ */}
            <DialogFooter className="pt-3 border-t border-border/60 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="text-xs font-bold h-10 px-4 rounded-lg"
              >
                Huỷ
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingCreate}
                className="bg-[#C6FF33] hover:bg-[#B5F51B] text-black font-black text-xs h-10 px-5 rounded-lg shadow-md transition-transform active:scale-95 cursor-pointer"
              >
                {isSubmittingCreate ? "Đang tạo..." : "Tạo nhiệm vụ"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
