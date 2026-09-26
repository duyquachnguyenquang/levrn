"use client";

import React, { useState } from "react";
import {
  Zap,
  Plus,
  Trash2,
  CheckCircle2,
  Layers,
  GraduationCap,
  Calendar,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CourseGradeFormData } from "@/lib/types";
import { score10ToScore4, score10ToLetter } from "@/lib/gradeUtils";
import { cn } from "@/lib/utils";

interface QuickCourseRow {
  id: string;
  code: string;
  name: string;
  credits: number;
  score10: string;
}

interface QuickPastCoursesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBatchSave: (courses: CourseGradeFormData[]) => Promise<any>;
}

export function QuickPastCoursesModal({
  isOpen,
  onClose,
  onBatchSave,
}: QuickPastCoursesModalProps) {
  const [semester, setSemester] = useState<string>("HK1 2022-2023");
  const [rows, setRows] = useState<QuickCourseRow[]>([
    { id: "row-1", code: "", name: "", credits: 3, score10: "" },
    { id: "row-2", code: "", name: "", credits: 3, score10: "" },
    { id: "row-3", code: "", name: "", credits: 3, score10: "" },
    { id: "row-4", code: "", name: "", credits: 3, score10: "" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddRow = () => {
    setRows([
      ...rows,
      {
        id: `row-${Date.now()}`,
        code: "",
        name: "",
        credits: 3,
        score10: "",
      },
    ]);
  };

  const handleUpdateRow = (
    id: string,
    field: keyof QuickCourseRow,
    value: any
  ) => {
    setRows(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const handleDeleteRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((r) => r.id !== id));
  };

  // Tính GPA tạm tính của các dòng hợp lệ
  let validCount = 0;
  let totalCredits = 0;
  let weightedSum10 = 0;
  let weightedSum4 = 0;

  for (const r of rows) {
    const sc = parseFloat(r.score10);
    if (r.name.trim() && !isNaN(sc) && sc >= 0 && sc <= 10) {
      validCount++;
      const cr = Number(r.credits) || 3;
      totalCredits += cr;
      weightedSum10 += sc * cr;
      weightedSum4 += score10ToScore4(sc) * cr;
    }
  }

  const previewGPA10 = totalCredits > 0 ? (weightedSum10 / totalCredits).toFixed(2) : "--";
  const previewGPA4 = totalCredits > 0 ? (weightedSum4 / totalCredits).toFixed(2) : "--";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validRows = rows.filter((r) => {
      const sc = parseFloat(r.score10);
      return r.name.trim().length > 0 && !isNaN(sc);
    });

    if (validRows.length === 0) {
      alert("Vui lòng điền ít nhất 1 môn học có tên và điểm tổng kết!");
      return;
    }

    setIsSubmitting(true);
    try {
      const courseList: CourseGradeFormData[] = validRows.map((r) => {
        const sc = parseFloat(r.score10);
        return {
          subjectCode: r.code.trim().toUpperCase() || "MON",
          subjectName: r.name.trim(),
          credits: Number(r.credits) || 3,
          semester: semester.trim(),
          gradingMethod: "final_only",
          finalScore: sc,
          components: [],
          notes: "Nhập nhanh từ danh sách môn cũ",
        };
      });

      await onBatchSave(courseList);
      onClose();
      // Reset form
      setRows([
        { id: "row-1", code: "", name: "", credits: 3, score10: "" },
        { id: "row-2", code: "", name: "", credits: 3, score10: "" },
        { id: "row-3", code: "", name: "", credits: 3, score10: "" },
      ]);
    } catch (err) {
      console.error("Lỗi khi lưu danh sách môn cũ:", err);
      alert("Không thể lưu danh sách môn cũ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 border border-border/80 bg-background text-foreground shadow-2xl rounded-lg">
        <DialogHeader className="p-6 pb-4 border-b border-border/60">
          <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            <span>Nhập nhanh môn cũ (Năm 1, Năm 2)</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Chọn Học Kỳ chung cho nhóm môn này */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-border/80 bg-muted/20">
            <div>
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#7D39EB]" />
                <span>Học kỳ nhập điểm</span>
                <span className="text-destructive">*</span>
              </Label>
            </div>
            <div className="w-full sm:w-60">
              <Input
                placeholder="VD: HK1 2022-2023"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="font-medium text-xs h-9 bg-background"
                required
              />
            </div>
          </div>

          {/* Bảng nhập dữ liệu dạng dòng nhanh */}
          <div className="space-y-2">
            <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <span className="col-span-2">Mã môn</span>
              <span className="col-span-5">Tên môn học *</span>
              <span className="col-span-2 text-center">Tín chỉ</span>
              <span className="col-span-2 text-center">Điểm Final (10) *</span>
              <span className="col-span-1 text-center">Xóa</span>
            </div>

            <div className="space-y-2">
              {rows.map((r, index) => {
                const sc = parseFloat(r.score10);
                const isValidScore = !isNaN(sc) && sc >= 0 && sc <= 10;
                const letter = isValidScore ? score10ToLetter(sc) : "";

                return (
                  <div
                    key={r.id}
                    className="p-3 sm:p-2 rounded-lg border border-border/70 bg-card flex flex-col sm:grid sm:grid-cols-12 gap-2 items-center hover:border-border/90 transition-colors"
                  >
                    <div className="w-full sm:col-span-2">
                      <Input
                        placeholder="Mã môn"
                        value={r.code}
                        onChange={(e) =>
                          handleUpdateRow(r.id, "code", e.target.value.toUpperCase())
                        }
                        className="text-xs h-9 font-mono uppercase"
                      />
                    </div>
                    <div className="w-full sm:col-span-5">
                      <Input
                        placeholder={`Môn học #${index + 1}`}
                        value={r.name}
                        onChange={(e) => handleUpdateRow(r.id, "name", e.target.value)}
                        className="text-xs h-9 font-medium"
                      />
                    </div>
                    <div className="w-full sm:col-span-2 flex items-center justify-center">
                      <Input
                        type="number"
                        min="1"
                        max="15"
                        value={r.credits}
                        onChange={(e) =>
                          handleUpdateRow(r.id, "credits", parseInt(e.target.value) || 3)
                        }
                        className="text-xs h-9 font-mono text-center"
                      />
                    </div>
                    <div className="w-full sm:col-span-2 flex items-center gap-1.5 justify-center">
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        placeholder="VD: 8.5"
                        value={r.score10}
                        onChange={(e) => handleUpdateRow(r.id, "score10", e.target.value)}
                        className="text-xs h-9 font-mono text-center font-bold"
                      />
                      {letter && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1 py-0 h-6 shrink-0 font-bold"
                        >
                          {letter}
                        </Badge>
                      )}
                    </div>
                    <div className="w-full sm:col-span-1 flex justify-end sm:justify-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRow(r.id)}
                        disabled={rows.length <= 1}
                        className="h-8 w-8 text-muted-foreground hover:text-red-500 rounded-lg"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleAddRow}
              className="w-full text-xs font-semibold py-2 rounded-xl border-dashed gap-1.5 mt-2 hover:bg-muted/40"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Thêm dòng môn học tiếp theo</span>
            </Button>
          </div>

          {/* Thanh thống kê tạm tính trực tiếp */}
          <div className="p-4 rounded-xl border border-border/80 bg-muted/30 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-foreground">
                Số môn hợp lệ: <strong className="font-mono text-sm">{validCount}</strong> môn
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="font-semibold text-foreground">
                Tổng tín chỉ: <strong className="font-mono text-sm">{totalCredits}</strong> TC
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">
                GPA học kỳ (Hệ 10): <strong className="text-foreground font-mono">{previewGPA10}</strong>
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                GPA học kỳ (Hệ 4): <strong className="text-[#7D39EB] font-mono text-sm font-black">{previewGPA4}</strong>
              </span>
            </div>
          </div>

          {/* Footer nút hành động */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs font-semibold rounded-lg px-4"
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="text-xs font-bold rounded-lg px-5 bg-amber-500 hover:bg-amber-600 text-black shadow-md shadow-amber-500/20"
              disabled={isSubmitting || validCount === 0}
            >
              {isSubmitting
                ? "Đang lưu..."
                : `Lưu ${validCount} môn vào bảng điểm`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
