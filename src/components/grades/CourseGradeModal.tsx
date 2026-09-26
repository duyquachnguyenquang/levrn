"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Calculator,
  Layers,
  Zap,
  Hash,
  BookOpen,
  GraduationCap,
  Calendar,
  Target,
  Award,
  SlidersHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  CourseGrade,
  CourseGradeFormData,
  GradeComponent,
  GradingMethod,
  Subject,
} from "@/lib/types";
import {
  calculateComponentsScore,
  score10ToScore4,
  score10ToLetter,
  getLetterGradeStyle,
} from "@/lib/gradeUtils";
import { cn } from "@/lib/utils";

interface CourseGradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CourseGradeFormData) => Promise<any>;
  onDelete?: (id: string) => void;
  initialData?: CourseGrade | null;
  existingSubjects?: Subject[];
}

export function CourseGradeModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  existingSubjects = [],
}: CourseGradeModalProps) {
  // Phân loại: 'final_only' (Điểm trung bình) hoặc 'components' (Điểm thành phần)
  const [gradingMethod, setGradingMethod] = useState<GradingMethod>("final_only");

  // Thông tin chung của môn học
  const [subjectId, setSubjectId] = useState<string>("");
  const [subjectCode, setSubjectCode] = useState<string>("");
  const [subjectName, setSubjectName] = useState<string>("");
  const [credits, setCredits] = useState<number>(3);
  const [semester, setSemester] = useState<string>("HK1 2026-2027");
  const [targetScore, setTargetScore] = useState<string>("");

  // Điểm trung bình trực tiếp (cho final_only)
  const [finalScoreInput, setFinalScoreInput] = useState<string>("");

  // Danh sách thành phần điểm (cho components)
  const [components, setComponents] = useState<GradeComponent[]>([
    { id: "c1", name: "Chuyên cần & Thái độ", weight: 10, score: null, maxScore: 10 },
    { id: "c2", name: "Kiểm tra Giữa kỳ", weight: 30, score: null, maxScore: 10 },
    { id: "c3", name: "Thi Cuối kỳ", weight: 60, score: null, maxScore: 10 },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Điền dữ liệu khi chỉnh sửa hoặc mở modal
  useEffect(() => {
    if (initialData) {
      setGradingMethod(initialData.gradingMethod || "final_only");
      setSubjectId(initialData.subjectId || "");
      setSubjectCode(initialData.subjectCode || "");
      setSubjectName(initialData.subjectName || "");
      setCredits(initialData.credits || 3);
      setSemester(initialData.semester || "HK1 2026-2027");
      setTargetScore(
        initialData.targetScore !== null && initialData.targetScore !== undefined
          ? String(initialData.targetScore)
          : ""
      );
      setFinalScoreInput(
        initialData.finalScore !== null && initialData.finalScore !== undefined
          ? String(initialData.finalScore)
          : ""
      );
      if (initialData.components && initialData.components.length > 0) {
        setComponents(initialData.components);
      }
    } else {
      const defaultSemester =
        existingSubjects.length > 0 && existingSubjects[0].semester ? existingSubjects[0].semester : "HK1 2026-2027";
      setGradingMethod("final_only");
      setSubjectId("");
      setSubjectCode("");
      setSubjectName("");
      setCredits(3);
      setSemester(defaultSemester || "Chưa xếp kỳ");
      setTargetScore("");
      setFinalScoreInput("");
      setComponents([
        { id: "c1", name: "Chuyên cần", weight: 10, score: null, maxScore: 10 },
        { id: "c2", name: "Kiểm tra Giữa kỳ", weight: 30, score: null, maxScore: 10 },
        { id: "c3", name: "Thi Cuối kỳ", weight: 60, score: null, maxScore: 10 },
      ]);
    }
  }, [initialData, isOpen, existingSubjects]);

  // Tính toán điểm và tỷ trọng theo thời gian thực (realtime)
  const compCalc = useMemo(() => {
    return calculateComponentsScore(components);
  }, [components]);

  // Điểm tổng kết hệ 10
  const effectiveFinalScore10 = useMemo(() => {
    if (gradingMethod === "final_only") {
      const parsed = parseFloat(finalScoreInput);
      return !isNaN(parsed) ? parsed : null;
    } else {
      return compCalc.finalScore;
    }
  }, [gradingMethod, finalScoreInput, compCalc.finalScore]);

  // Quy đổi hệ 4 và điểm chữ
  const score4 = score10ToScore4(effectiveFinalScore10);
  const letterGrade = score10ToLetter(effectiveFinalScore10);
  const letterStyle = getLetterGradeStyle(letterGrade);

  // Chọn môn từ danh sách môn học hiện có trong hệ thống
  const handleSelectExistingSubject = (subId: string) => {
    const sub = existingSubjects.find((s) => s.id === subId);
    if (!sub) return;
    setSubjectId(sub.id);
    setSubjectCode(sub.code);
    setSubjectName(sub.name);
    setCredits(sub.credits || 3);
    setSemester((sub.semester && sub.semester.trim()) ? sub.semester.trim() : "Chưa xếp kỳ");
  };

  // Thêm thành phần điểm mới
  const handleAddComponent = () => {
    const newComp: GradeComponent = {
      id: `comp-${Date.now()}`,
      name: "Cột điểm mới",
      weight: 10,
      score: null,
      maxScore: 10,
    };
    setComponents([...components, newComp]);
  };

  // Cập nhật thành phần điểm
  const handleUpdateComponent = (
    id: string,
    field: keyof GradeComponent,
    value: any
  ) => {
    setComponents(
      components.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  // Xóa thành phần điểm
  const handleDeleteComponent = (id: string) => {
    setComponents(components.filter((c) => c.id !== id));
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim()) {
      alert("Vui lòng nhập tên môn học!");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData: CourseGradeFormData = {
        subjectId: subjectId || undefined,
        subjectCode: subjectCode.trim() || "MON",
        subjectName: subjectName.trim(),
        credits: Number(credits) || 3,
        semester: (semester && semester.trim()) ? semester.trim() : "Chưa xếp kỳ",
        gradingMethod,
        finalScore: effectiveFinalScore10,
        components: gradingMethod === "components" ? components : [],
        targetScore: targetScore ? parseFloat(targetScore) : null,
      };

      await onSave(formData);
      onClose();
    } catch (err) {
      console.error("Lỗi khi lưu điểm:", err);
      alert("Không thể lưu thông tin điểm môn học.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0 border border-border/80 bg-background text-foreground shadow-2xl rounded-lg">
        {/* Header tinh gọn, không chữ thừa, đồng bộ với các pop-up box khác */}
        <DialogHeader className="p-5 pb-3 border-b border-border/50">
          <DialogTitle className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2.5">
            <Calculator className="h-5 w-5 text-[#7D39EB]" />
            <span>{initialData ? "Chỉnh sửa điểm môn học" : "Thêm môn học"}</span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            {initialData ? "Chỉnh sửa điểm môn học" : "Thêm môn học"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* 1. Phân loại */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-[#7D39EB]" />
              <span>Phân loại</span>
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGradingMethod("final_only")}
                className={cn(
                  "h-10 px-4 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
                  gradingMethod === "final_only"
                    ? "border-[#7D39EB] bg-[#7D39EB]/10 text-foreground ring-1 ring-[#7D39EB]"
                    : "border-border/80 bg-card hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                )}
              >
                <Zap className="h-4 w-4 text-[#7D39EB]" />
                <span>Điểm trung bình</span>
              </button>

              <button
                type="button"
                onClick={() => setGradingMethod("components")}
                className={cn(
                  "h-10 px-4 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
                  gradingMethod === "components"
                    ? "border-[#C6FF33] bg-[#C6FF33]/15 text-foreground ring-1 ring-[#C6FF33]"
                    : "border-border/80 bg-card hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                )}
              >
                <Layers className="h-4 w-4 text-emerald-600 dark:text-[#C6FF33]" />
                <span>Điểm thành phần</span>
              </button>
            </div>
          </div>

          {/* Chọn nhanh từ danh sách môn học nếu có */}
          {existingSubjects.length > 0 && !initialData && (
            <div className="p-3 bg-muted/20 rounded-lg border border-border/70 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-[#7D39EB] shrink-0" />
                <span className="text-xs font-semibold text-foreground">
                  Chọn từ môn học có sẵn:
                </span>
              </div>
              <select
                onChange={(e) => handleSelectExistingSubject(e.target.value)}
                value={subjectId}
                className="text-xs rounded-lg border border-border/80 bg-background px-3 py-1.5 font-medium max-w-xs focus:ring-1 focus:ring-primary focus:outline-none"
              >
                <option value="">-- Chọn môn học --</option>
                {existingSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    [{s.code}] {s.name} ({s.credits || 3} TC - {(s.semester && s.semester.trim()) ? s.semester.trim() : "Chưa xếp kỳ"})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 2. Thông tin môn học cơ bản */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5 text-[#7D39EB]" />
                <span>Mã môn</span>
                <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="VD: RMA"
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value.toUpperCase())}
                className="mt-1 font-bold uppercase text-xs h-9"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-[#7D39EB]" />
                <span>Tên môn học</span>
                <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="VD: Quản trị rủi ro"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                className="mt-1 font-medium text-xs h-9"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-[#7D39EB]" />
                <span>Số tín chỉ</span>
                <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                min={1}
                max={15}
                value={credits}
                onChange={(e) => setCredits(parseInt(e.target.value) || 3)}
                className="mt-1 font-bold text-xs h-9"
                required
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#7D39EB]" />
                <span>Học kỳ</span>
                <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="VD: HK1 2026-2027"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="mt-1 font-medium text-xs h-9"
                required
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-[#7D39EB]" />
                <span>Điểm mục tiêu (hệ 10)</span>
              </Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="10"
                placeholder="VD: 8.5"
                value={targetScore}
                onChange={(e) => setTargetScore(e.target.value)}
                className="mt-1 font-bold text-xs h-9"
              />
            </div>
          </div>

          {/* 3. Khu vực nhập điểm theo chế độ */}
          {gradingMethod === "final_only" ? (
            /* --- CHẾ ĐỘ 1: ĐIỂM TRUNG BÌNH --- */
            <div className="p-4 rounded-xl border border-dashed border-[#7D39EB]/30 bg-[#7D39EB]/5 space-y-2.5">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-[#7D39EB]" />
                <span>Điểm trung bình (Thang điểm 10)</span>
              </Label>
              <div className="flex items-center gap-3">
                <div className="w-36">
                  <Input
                    type="number"
                    step="0.05"
                    min="0"
                    max="10"
                    placeholder="VD: 8.5"
                    value={finalScoreInput}
                    onChange={(e) => setFinalScoreInput(e.target.value)}
                    className="text-xl font-bold h-10 text-center border-[#7D39EB]/50 focus-visible:ring-[#7D39EB]"
                    required
                  />
                </div>
                {effectiveFinalScore10 !== null && (
                  <div className="flex-1 px-3 py-2 rounded-lg bg-card border border-border/80 flex items-center justify-around text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Thang 4</span>
                      <span className="font-bold text-foreground">{score4.toFixed(1)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Điểm chữ</span>
                      <Badge variant="outline" className={cn("text-xs font-bold px-2 py-0", letterStyle.badgeClass)}>
                        {letterGrade}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Kết quả</span>
                      <span className={cn("font-bold", score4 >= 1.0 ? "text-emerald-500" : "text-destructive")}>
                        {score4 >= 1.0 ? "Đạt" : "Học lại"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* --- CHẾ ĐỘ 2: ĐIỂM THÀNH PHẦN --- */
            <div className="space-y-3">
              {/* Tiêu đề & Thanh đo đơn giản, bỏ hết chữ xung quanh */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-[#7D39EB]" />
                  <span>Cấu trúc thành phần điểm</span>
                </Label>
                {/* Thanh đo đơn giản */}
                <div className="w-full bg-muted/60 rounded-full h-1.5 overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, compCalc.totalWeight)}%` }}
                    className={cn(
                      "h-full transition-all duration-300 rounded-full",
                      compCalc.totalWeight === 100
                        ? "bg-[#C6FF33]"
                        : compCalc.totalWeight > 100
                        ? "bg-destructive"
                        : "bg-amber-500"
                    )}
                  />
                </div>
              </div>

              {/* Danh sách các cột điểm */}
              <div className="space-y-2">
                {components.map((comp) => (
                  <div
                    key={comp.id}
                    className="p-2.5 rounded-xl border border-border/70 bg-card flex flex-col sm:flex-row items-stretch sm:items-center gap-2 transition-all hover:border-border/90"
                  >
                    <div className="flex-1">
                      <Input
                        placeholder="Tên cột điểm (VD: Chuyên cần, Giữa kỳ...)"
                        value={comp.name}
                        onChange={(e) => handleUpdateComponent(comp.id, "name", e.target.value)}
                        className="text-xs h-8 font-medium"
                      />
                    </div>
                    <div className="w-24 flex items-center gap-1">
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        placeholder="Tỷ trọng"
                        value={comp.weight}
                        onChange={(e) =>
                          handleUpdateComponent(comp.id, "weight", parseInt(e.target.value) || 0)
                        }
                        className="text-xs h-8 text-center font-bold"
                      />
                      <span className="text-xs font-bold text-muted-foreground">%</span>
                    </div>
                    <div className="w-28 flex items-center gap-1">
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max={comp.maxScore || 10}
                        placeholder="Điểm (0-10)"
                        value={comp.score !== null && comp.score !== undefined ? comp.score : ""}
                        onChange={(e) => {
                          const val = e.target.value === "" ? null : parseFloat(e.target.value);
                          handleUpdateComponent(comp.id, "score", val);
                        }}
                        className="text-xs h-8 text-center font-bold"
                      />
                      <span className="text-[11px] text-muted-foreground">/{comp.maxScore || 10}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteComponent(comp.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-red-500 rounded-lg shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddComponent}
                  className="w-full text-xs font-semibold py-1.5 h-8 border-dashed rounded-lg gap-1.5 hover:bg-muted/40"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Thêm cột điểm thành phần</span>
                </Button>
              </div>
            </div>
          )}

          {/* Footer nút hành động */}
          <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-border/50">
            {initialData && onDelete ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (confirm(`Bạn có chắc chắn muốn xóa môn ${initialData.subjectName}?`)) {
                    onDelete(initialData.id);
                    onClose();
                  }
                }}
                className="text-xs font-semibold rounded-lg px-3 h-9 text-destructive border-destructive/30 hover:bg-destructive/10 active:scale-95"
              >
                Xóa môn
              </Button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="text-xs font-semibold rounded-lg px-4 h-9"
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="text-xs font-bold rounded-lg px-5 h-9 bg-[#C6FF33] hover:bg-[#B5F51B] text-black shadow-md transition-all active:scale-95"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Đang lưu..." : initialData ? "Lưu thay đổi" : "Thêm môn học"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
