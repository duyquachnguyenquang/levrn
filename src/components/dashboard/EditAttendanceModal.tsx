"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Subject,
  AttendanceRecord,
  AttendanceStatus,
  ATTENDANCE_STATUS_MAP,
} from "@/lib/types";
import {
  Pencil,
  X,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  History,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCheckinDateTime, getLocalDateKey } from "@/lib/checkinUtils";

interface EditAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject | null;
  attendanceRecords: AttendanceRecord[];
  onSave: (params: {
    subject: Subject;
    date: string;
    time?: string;
    status: AttendanceStatus;
    notes?: string;
    recordId?: string;
  }) => Promise<{ success: boolean; message: string }>;
  onDeleteRecord?: (recordId: string) => Promise<void>;
}

export function EditAttendanceModal({
  isOpen,
  onClose,
  subject,
  attendanceRecords,
  onSave,
  onDeleteRecord,
}: EditAttendanceModalProps) {
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [status, setStatus] = useState<AttendanceStatus>("present");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Danh sách các bản ghi của môn học hiện tại
  const subjectRecords = React.useMemo(() => {
    if (!subject) return [];
    return attendanceRecords
      .filter((r) => r.subjectId === subject.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [subject, attendanceRecords]);

  // Khởi tạo form khi mở modal
  useEffect(() => {
    if (isOpen && subject) {
      const now = new Date();
      const todayKey = getLocalDateKey(now);
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");

      setSelectedRecordId(null);
      setDate(todayKey);
      setTime(subject.startTime || `${hours}:${minutes}`);
      setStatus("present");
      setNotes("");
      setFeedback(null);
    }
  }, [isOpen, subject]);

  if (!subject) return null;

  // Chọn một buổi cụ thể từ lịch sử để chỉnh sửa thời gian
  const handleSelectRecord = (rec: AttendanceRecord) => {
    setSelectedRecordId(rec.id);
    setDate(rec.date);
    if (rec.checkinTime) {
      const d = new Date(rec.checkinTime);
      if (!isNaN(d.getTime())) {
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        setTime(`${hh}:${mm}`);
      } else if (/^\d{1,2}:\d{2}/.test(rec.checkinTime)) {
        setTime(rec.checkinTime.slice(0, 5));
      } else {
        setTime(rec.startTime || "07:30");
      }
    } else {
      setTime(rec.startTime || "07:30");
    }
    setStatus(rec.status);
    setNotes(rec.notes || "");
    setFeedback(`Đang sửa Buổi ${rec.sessionNumber} (${rec.date})`);
  };

  const handleResetToNew = () => {
    const now = new Date();
    setSelectedRecordId(null);
    setDate(getLocalDateKey(now));
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    setTime(subject.startTime || `${hours}:${minutes}`);
    setStatus("present");
    setNotes("");
    setFeedback(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      alert("Vui lòng chọn ngày điểm danh.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onSave({
        subject,
        date,
        time,
        status,
        notes: notes.trim() || undefined,
        recordId: selectedRecordId || undefined,
      });

      if (res.success) {
        onClose();
      }
    } catch (err) {
      console.error("Lỗi cập nhật điểm danh:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (recordId: string) => {
    if (!onDeleteRecord) return;
    if (confirm("Bạn có chắc chắn muốn xóa bản ghi điểm danh này không?")) {
      await onDeleteRecord(recordId);
      if (selectedRecordId === recordId) {
        handleResetToNew();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* Tuân thủ Rule 1.6 bo góc 5-10% (rounded-lg) và Rule 1.12 ẩn nút đóng mặc định */}
      <DialogContent className="sm:max-w-[500px] rounded-lg border border-border/80 bg-card p-6 shadow-xl [&>button.absolute]:hidden">
        {/* 1. Header cùng hàng đồng kích thước & Nút chữ x vuông bo góc 5-10% (Rule 1.10, 1.12) */}
        <DialogHeader className="p-0 space-y-0">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/60">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-md bg-[#7D39EB]/15 text-[#7D39EB] flex items-center justify-center shrink-0">
                <Pencil className="h-4 w-4" />
              </div>
              {/* Header tinh gọn, không có subtitle dài bên dưới (Rule 1.1) */}
              <DialogTitle className="text-base font-extrabold text-foreground truncate">
                Chỉnh sửa điểm danh
              </DialogTitle>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-md border border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 transition-all"
              title="Đóng"
              aria-label="Đóng"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* 2. Form chỉnh sửa các trường đồng cấp (Flat fields - Rule 1.9) */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Thông tin môn học (View Mode cố định - Rule 1.10) */}
          <div className="space-y-1">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
              Môn học
            </Label>
            <div className="flex items-center gap-2 py-1">
              <span
                className="font-mono font-black text-xs px-2 py-0.5 rounded-md shrink-0"
                style={{
                  backgroundColor: `${subject.color || "#7D39EB"}20`,
                  color: subject.color || "#7D39EB",
                }}
              >
                {subject.code}
              </span>
              <span className="text-sm font-bold text-foreground truncate">
                {subject.name}
              </span>
            </div>
          </div>

          {/* Ngày điểm danh */}
          <div className="space-y-1">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              Ngày điểm danh
            </Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="rounded-md border-border/80 h-9 text-sm font-medium focus-visible:ring-[#7D39EB]"
            />
          </div>

          {/* Thời gian điểm danh */}
          <div className="space-y-1">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              Giờ điểm danh (Giờ : Phút)
            </Label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className="rounded-md border-border/80 h-9 text-sm font-mono font-medium focus-visible:ring-[#7D39EB]"
            />
          </div>

          {/* Trạng thái chuyên cần */}
          <div className="space-y-1">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />
              Trạng thái
            </Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AttendanceStatus)}
              className="w-full h-9 rounded-md border border-border/80 bg-background px-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-[#7D39EB]"
            >
              <option value="present">Có mặt (Đúng giờ)</option>
              <option value="late">Đi trễ</option>
              <option value="excused">Nghỉ có phép</option>
              <option value="absent">Vắng mặt (Không phép)</option>
            </select>
          </div>

          {/* Ghi chú */}
          <div className="space-y-1">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              Ghi chú
            </Label>
            <Input
              type="text"
              placeholder="VD: Điểm danh bù ngày quên điểm danh..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-md border-border/80 h-9 text-sm focus-visible:ring-[#7D39EB]"
            />
          </div>

          {/* Danh sách các buổi đã ghi nhận để chọn nhanh */}
          {subjectRecords.length > 0 && (
            <div className="pt-2 border-t border-border/60 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-muted-foreground" />
                  Các buổi đã ghi nhận ({subjectRecords.length})
                </Label>
                {selectedRecordId && (
                  <button
                    type="button"
                    onClick={handleResetToNew}
                    className="text-[11px] font-semibold text-[#7D39EB] hover:underline cursor-pointer"
                  >
                    + Tạo buổi điểm danh mới
                  </button>
                )}
              </div>

              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {subjectRecords.map((rec) => {
                  const isSelected = selectedRecordId === rec.id;
                  const statusMeta = ATTENDANCE_STATUS_MAP[rec.status];

                  return (
                    <div
                      key={rec.id}
                      onClick={() => handleSelectRecord(rec)}
                      className={cn(
                        "p-2 rounded-md border text-xs flex items-center justify-between cursor-pointer transition-all",
                        isSelected
                          ? "border-[#7D39EB] bg-[#7D39EB]/10 font-bold"
                          : "border-border/60 hover:bg-muted/40"
                      )}
                      title="Bấm để chọn và sửa thời gian của buổi này"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-[11px] text-muted-foreground shrink-0">
                          B.{rec.sessionNumber}
                        </span>
                        <span className="font-semibold text-foreground truncate">
                          {rec.date}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {rec.checkinTime
                            ? formatCheckinDateTime(rec.checkinTime, rec.date)
                            : rec.startTime || "—"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-bold",
                            statusMeta.color
                          )}
                        >
                          {statusMeta.label}
                        </span>
                        {onDeleteRecord && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(rec.id);
                            }}
                            className="h-6 w-6 rounded hover:bg-destructive/15 hover:text-destructive flex items-center justify-center text-muted-foreground transition-colors"
                            title="Xóa bản ghi này"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Footer Action Buttons (Text-only theo Rule 1.2) */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-md h-9 px-4 text-xs font-bold border-border/80 text-muted-foreground hover:text-foreground active:scale-95"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md h-9 px-4 text-xs font-bold bg-[#7D39EB] hover:bg-[#6C2DD4] text-white active:scale-95"
            >
              {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
