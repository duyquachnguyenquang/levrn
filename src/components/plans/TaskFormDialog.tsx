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
import {
  Subject,
  StudyTask,
  StudyTaskFormData,
  StudyTaskStatus,
  StudyPlanClassification,
  TaskMaterialItem,
  STUDY_CLASSIFICATIONS,
} from "@/lib/types";
import { DateTimePicker } from "./DateTimePicker";
import {
  FileText,
  Layers,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  Clock,
  FolderArchive,
  UploadCloud,
  CalendarClock,
  Plus,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: StudyTaskFormData) => Promise<{ success: boolean; error?: string }>;
  initialData?: StudyTask | null;
  defaultDate?: string;
  defaultSubjectId?: string;
  defaultStatus?: StudyTaskStatus;
  subjects: Subject[];
}

export function TaskFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  defaultDate,
  defaultSubjectId,
  defaultStatus = "todo",
  subjects,
}: TaskFormDialogProps) {
  // Hàng 1: Tiêu đề & Phân loại
  const [title, setTitle] = useState("");
  const [classification, setClassification] = useState<StudyPlanClassification>("theory");

  // Hàng 2: Học kỳ, Môn học, Trạng thái
  const [semester, setSemester] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [status, setStatus] = useState<StudyTaskStatus>("todo");

  // Hàng 3: Thời lượng, Hạn chót, Nộp bài
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [deadline, setDeadline] = useState<string | undefined>(undefined);
  const [submissionUrl, setSubmissionUrl] = useState("");

  // Hàng 4: Tài liệu
  const [materials, setMaterials] = useState<TaskMaterialItem[]>([]);
  const [newMaterialUrl, setNewMaterialUrl] = useState("");
  const [newMaterialTitle, setNewMaterialTitle] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Danh sách các học kỳ duy nhất lấy từ danh sách Môn học của tôi
  const availableSemesters = useMemo(() => {
    const list = Array.from(new Set(subjects.map((s) => s.semester))).filter(Boolean);
    return list.length > 0 ? list : ["HK1 2024-2025"];
  }, [subjects]);

  // Khởi tạo form khi mở dialog
  useEffect(() => {
    if (!open) return;

    if (initialData) {
      setTitle(initialData.title);
      setClassification(initialData.classification || "theory");
      setStatus(initialData.status || "todo");
      setDurationMinutes(initialData.durationMinutes || 60);
      setSubmissionUrl(initialData.submissionUrl || "");
      setDeadline(initialData.deadline || undefined);

      // Tìm môn học tương ứng để xác định học kỳ
      const matchedSubject = subjects.find((s) => s.id === initialData.subjectId);
      const currentSem = initialData.semester || matchedSubject?.semester || availableSemesters[0] || "";
      setSemester(currentSem);
      setSubjectId(initialData.subjectId);

      // Materials
      setMaterials(initialData.materials || []);
    } else {
      // Tạo mới
      setTitle("");
      setClassification("theory");
      setStatus(defaultStatus);
      setDurationMinutes(60);
      setSubmissionUrl("");
      setDeadline(undefined);
      setMaterials([]);

      // Khởi tạo học kỳ và môn học
      let initSem = availableSemesters[0] || "";
      let initSubId = defaultSubjectId || "";

      if (defaultSubjectId) {
        const found = subjects.find((s) => s.id === defaultSubjectId);
        if (found && found.semester) {
          initSem = found.semester;
        }
      } else if (subjects.length > 0) {
        const firstInSem = subjects.find((s) => s.semester === initSem) || subjects[0];
        initSubId = firstInSem.id;
        initSem = firstInSem.semester || initSem;
      }

      setSemester(initSem);
      setSubjectId(initSubId);
    }

    setNewMaterialUrl("");
    setNewMaterialTitle("");
    setErrorMsg(null);
  }, [open, initialData, defaultSubjectId, defaultStatus, subjects, availableSemesters]);

  // Lọc danh sách môn học thuộc Học kỳ đã chọn
  const semesterSubjects = useMemo(() => {
    if (!semester) return subjects;
    const filtered = subjects.filter((s) => s.semester === semester);
    return filtered.length > 0 ? filtered : subjects;
  }, [subjects, semester]);

  // Tự động chuyển môn học hợp lệ khi đổi học kỳ
  const handleSemesterChange = (newSem: string) => {
    setSemester(newSem);
    const validInNewSem = subjects.filter((s) => s.semester === newSem);
    if (validInNewSem.length > 0) {
      const isStillValid = validInNewSem.some((s) => s.id === subjectId);
      if (!isStillValid) {
        setSubjectId(validInNewSem[0].id);
      }
    }
  };

  // Thêm tài liệu
  const handleAddMaterial = () => {
    if (!newMaterialUrl.trim()) return;
    let url = newMaterialUrl.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    const titleText = newMaterialTitle.trim() || url;
    setMaterials([
      ...materials,
      { id: "mat-" + Date.now(), title: titleText, url },
    ]);
    setNewMaterialUrl("");
    setNewMaterialTitle("");
  };

  const handleRemoveMaterial = (id: string) => {
    setMaterials(materials.filter((m) => m.id !== id));
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Vui lòng nhập tiêu đề nhiệm vụ.");
      return;
    }
    if (!subjectId) {
      setErrorMsg("Vui lòng chọn môn học.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    // Tính ngày
    let taskDate = defaultDate || new Date().toISOString().split("T")[0];
    if (deadline) {
      try {
        const dObj = new Date(deadline);
        const y = dObj.getFullYear();
        const m = String(dObj.getMonth() + 1).padStart(2, "0");
        const d = String(dObj.getDate()).padStart(2, "0");
        taskDate = `${y}-${m}-${d}`;
      } catch {}
    }

    const formData: StudyTaskFormData = {
      title: title.trim(),
      subjectId,
      semester: semester || undefined,
      classification,
      status,
      durationMinutes: Number(durationMinutes) || 60,
      subtasks: initialData?.subtasks || undefined,
      checklist: initialData?.checklist || undefined,
      materials: materials.length > 0 ? materials : undefined,
      submissionUrl: submissionUrl.trim() || undefined,
      deadline: deadline || undefined,
      date: taskDate,
    };

    const res = await onSubmit(formData);
    setIsSubmitting(false);

    if (res.success) {
      onOpenChange(false);
    } else {
      setErrorMsg(res.error || "Đã xảy ra lỗi khi lưu.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-5 sm:p-6 rounded-xl border border-border/80 bg-card shadow-2xl">
        <DialogHeader className="pb-3 border-b border-border/60">
          <DialogTitle className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#C6FF33]" />
            <span>{initialData ? "Chỉnh sửa nhiệm vụ học tập" : "Thêm nhiệm vụ học tập mới"}</span>
          </DialogTitle>
        </DialogHeader>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* =========================================================================
              HÀNG 1: Tiêu đề + Phân loại (đối xứng độ cao h-10)
          ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
            {/* Tiêu đề */}
            <div className="sm:col-span-8 flex flex-col justify-end">
              <Label className="text-xs font-bold flex items-center gap-1.5 text-foreground h-5 mb-1.5">
                <FileText className="h-3.5 w-3.5 text-[#7D39EB]" />
                <span>Tiêu đề nhiệm vụ</span>
                <span className="text-destructive">*</span>
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Luyện 30 câu trắc nghiệm Cây nhị phân tìm kiếm..."
                className="h-10 text-xs sm:text-sm rounded-lg bg-background/80 border-input focus-visible:ring-[#7D39EB]"
                autoFocus
              />
            </div>

            {/* Phân loại (Drop-box) */}
            <div className="sm:col-span-4 flex flex-col justify-end">
              <Label className="text-xs font-bold flex items-center gap-1.5 text-foreground h-5 mb-1.5">
                <Layers className="h-3.5 w-3.5 text-[#7D39EB]" />
                <span>Phân loại</span>
                <span className="text-destructive">*</span>
              </Label>
              <select
                value={classification}
                onChange={(e) => setClassification(e.target.value as StudyPlanClassification)}
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

          {/* =========================================================================
              HÀNG 2: Học kỳ + Môn học + Trạng thái (3 cột đều nhau, đồng bộ h-10)
          ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Học kỳ */}
            <div className="flex flex-col justify-end">
              <Label className="text-xs font-bold flex items-center gap-1.5 text-foreground h-5 mb-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-[#7D39EB]" />
                <span>Học kỳ</span>
                <span className="text-destructive">*</span>
              </Label>
              <select
                value={semester}
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

            {/* Môn học: Chỉ hiển thị môn thuộc học kỳ, cấu trúc '[CODE] Tên' */}
            <div className="flex flex-col justify-end">
              <Label className="text-xs font-bold flex items-center gap-1.5 text-foreground h-5 mb-1.5">
                <BookOpen className="h-3.5 w-3.5 text-[#7D39EB]" />
                <span>Môn học</span>
                <span className="text-destructive">*</span>
              </Label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full h-10 rounded-lg border border-input bg-background/80 px-3 text-xs sm:text-sm font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#7D39EB] cursor-pointer truncate"
              >
                {semesterSubjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    [{sub.code}] {sub.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Trạng thái */}
            <div className="flex flex-col justify-end">
              <Label className="text-xs font-bold flex items-center gap-1.5 text-foreground h-5 mb-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#7D39EB]" />
                <span>Trạng thái</span>
              </Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StudyTaskStatus)}
                className="w-full h-10 rounded-lg border border-input bg-background/80 px-3 text-xs sm:text-sm font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#7D39EB] cursor-pointer"
              >
                <option value="todo">Chưa làm</option>
                <option value="in_progress">Đang làm</option>
                <option value="completed">Đã xong</option>
              </select>
            </div>
          </div>

          {/* =========================================================================
              HÀNG 3: Thời lượng (tự nhập số phút) + Hạn chót + Nộp bài (3 cột đồng bộ h-10)
          ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Thời lượng (Người dùng tự nhập, bỏ gợi ý) */}
            <div className="flex flex-col justify-end">
              <Label className="text-xs font-bold flex items-center gap-1.5 text-foreground h-5 mb-1.5">
                <Clock className="h-3.5 w-3.5 text-[#7D39EB]" />
                <span>Thời lượng (phút)</span>
              </Label>
              <Input
                type="number"
                min={5}
                step={5}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                placeholder="60"
                className="h-10 text-xs sm:text-sm rounded-lg bg-background/80 font-mono font-bold border-input"
              />
            </div>

            {/* Hạn chót (Drop-down calendar) */}
            <div className="flex flex-col justify-end">
              <Label className="text-xs font-bold flex items-center gap-1.5 text-foreground h-5 mb-1.5">
                <CalendarClock className="h-3.5 w-3.5 text-[#7D39EB]" />
                <span>Hạn chót (Deadline)</span>
              </Label>
              <DateTimePicker
                value={deadline}
                onChange={setDeadline}
                placeholder="Chọn ngày & giờ..."
                className="h-10 text-xs sm:text-sm rounded-lg"
              />
            </div>

            {/* Nộp bài (Link nộp bài) */}
            <div className="flex flex-col justify-end">
              <Label className="text-xs font-bold flex items-center gap-1.5 text-foreground h-5 mb-1.5">
                <UploadCloud className="h-3.5 w-3.5 text-[#7D39EB]" />
                <span>Link nộp bài</span>
              </Label>
              <Input
                value={submissionUrl}
                onChange={(e) => setSubmissionUrl(e.target.value)}
                placeholder="https://courses.ut.edu.vn/..."
                className="h-10 text-xs sm:text-sm rounded-lg bg-background/80 font-mono border-input"
              />
            </div>
          </div>

          {/* =========================================================================
              HÀNG 4: Tài liệu (Đa liên kết, cân đối trọn chiều ngang)
          ========================================================================= */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                <FolderArchive className="h-3.5 w-3.5 text-[#7D39EB]" />
                <span>Tài liệu</span>
              </Label>
              <span className="text-[11px] font-mono text-muted-foreground font-semibold">
                {materials.length} liên kết đã thêm
              </span>
            </div>

            {/* Danh sách link tài liệu đã thêm */}
            {materials.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto p-1.5 rounded-lg bg-background/50 border border-border/60">
                {materials.map((m) => (
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

            {/* Nhập link tài liệu mới: 3 ô trên cùng 1 hàng đồng bộ h-10 */}
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

          {/* Footer nút hành động */}
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
              disabled={isSubmitting}
              className="bg-[#C6FF33] hover:bg-[#B5F51B] text-black font-black text-xs h-10 px-5 rounded-lg shadow-md transition-transform active:scale-95 cursor-pointer"
            >
              {isSubmitting ? "Đang lưu..." : initialData ? "Lưu thay đổi" : "Tạo nhiệm vụ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
