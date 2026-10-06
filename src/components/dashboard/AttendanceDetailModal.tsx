"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  GraduationCap,
  MapPin,
  User,
  CheckCheck,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCheckinDateTime, getLocalDateKey } from "@/lib/checkinUtils";

interface AttendanceDetailModalProps {
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

export function AttendanceDetailModal({
  isOpen,
  onClose,
  subject,
  attendanceRecords,
  onSave,
  onDeleteRecord,
}: AttendanceDetailModalProps) {
  // Chế độ: Mặc định ở dạng Cố định (View mode) theo Rule 1.10
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // State form chỉnh sửa
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [status, setStatus] = useState<AttendanceStatus>("present");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Danh sách các bản ghi của môn học
  const subjectRecords = useMemo(() => {
    if (!subject) return [];
    return attendanceRecords
      .filter((r) => r.subjectId === subject.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [subject, attendanceRecords]);

  // Thống kê số buổi đã điểm danh, số buổi còn lại
  const totalWeeks = subject?.totalWeeks || 15;
  const attendedCount = useMemo(() => {
    const todayKey = getLocalDateKey(new Date());
    return subjectRecords.filter(
      (r) => (r.status === "present" || r.status === "late") && (!r.date || r.date <= todayKey)
    ).length;
  }, [subjectRecords]);
  const remainingSessions = Math.max(0, totalWeeks - attendedCount);

  // Bản ghi điểm danh gần nhất
  const lastCheckin = useMemo(() => {
    const valid = subjectRecords.filter(
      (r) => (r.status === "present" || r.status === "late") && r.checkinTime
    );
    return valid.length > 0 ? valid[0] : null;
  }, [subjectRecords]);

  // Reset form khi mở modal
  useEffect(() => {
    if (isOpen && subject) {
      setIsEditing(false);
      const now = new Date();
      const todayKey = getLocalDateKey(now);
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");

      setSelectedRecordId(null);
      setDate(todayKey);
      setTime(subject.startTime || `${hours}:${minutes}`);
      setStatus("present");
      setNotes("");
    }
  }, [isOpen, subject]);

  if (!subject) return null;

  // Chuyển sang sửa một buổi cụ thể
  const handleEditRecord = (rec: AttendanceRecord) => {
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
    setIsEditing(true);
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
        setIsEditing(false);
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
        setSelectedRecordId(null);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* Bo góc 5-10% (rounded-lg) và ẩn nút đóng mặc định theo Rule 1.6 & 1.12 */}
      <DialogContent className="sm:max-w-[560px] rounded-lg border border-border/80 bg-card p-6 shadow-xl [&>button.absolute]:hidden max-h-[90vh] overflow-y-auto">
        {/* Header 3 thành phần cùng hàng đồng kích thước (Rule 1.10 & 1.12) */}
        <DialogHeader className="p-0 space-y-0">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/60">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-md bg-[#7D39EB]/15 text-[#7D39EB] flex items-center justify-center shrink-0">
                <BookOpen className="h-4 w-4" />
              </div>
              {/* Header tinh gọn, không dòng chữ dư thừa (Rule 1.1) */}
              <DialogTitle className="text-base font-extrabold text-foreground truncate">
                {isEditing ? "Chỉnh sửa điểm danh" : "Chi tiết điểm danh"}
              </DialogTitle>
            </div>

            {/* Nút Chỉnh sửa và Nút Thoát CÙNG HÀNG ĐỒNG KÍCH THƯỚC (Rule 1.10, 1.12) */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                type="button"
                variant={isEditing ? "default" : "outline"}
                size="icon"
                onClick={() => setIsEditing(!isEditing)}
                className={cn(
                  "h-8 w-8 rounded-md transition-all active:scale-95",
                  isEditing
                    ? "bg-[#7D39EB] text-white hover:bg-[#682BCA]"
                    : "border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
                title={isEditing ? "Quay lại chế độ xem chi tiết" : "Chỉnh sửa thời gian điểm danh"}
                aria-label={isEditing ? "Quay lại" : "Chỉnh sửa"}
              >
                <Pencil className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 rounded-md border border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 transition-all active:scale-95"
                title="Đóng"
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* 1. CHẾ ĐỘ XEM CỐ ĐỊNH (VIEW MODE - Rule 1.10) */}
        {!isEditing ? (
          <div className="space-y-4 pt-3 text-left">
            {/* THÔNG TIN MÔN HỌC */}
            <div className="space-y-1">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                Môn học
              </Label>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="font-mono font-black text-xs px-2 py-0.5 rounded-md"
                  style={{
                    backgroundColor: `${subject.color || "#7D39EB"}20`,
                    color: subject.color || "#7D39EB",
                  }}
                >
                  #{subject.code}
                </span>
                <span className="text-base font-extrabold text-foreground">
                  {subject.name}
                </span>
                {subject.credits && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                    {subject.credits} tín chỉ
                  </span>
                )}
              </div>
            </div>

            {/* THÔNG SỐ ĐIỂM DANH: SỐ BUỔI ĐÃ HỌC, SỐ BUỔI CÒN LẠI, NGÀY GIỜ ĐIỂM DANH GẦN NHẤT (Rule 1.9 Flat fields) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              {/* Số buổi đã điểm danh */}
              <div className="space-y-1">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Đã điểm danh
                </Label>
                <div className="text-sm font-black text-foreground font-mono">
                  {attendedCount}/{totalWeeks} buổi
                </div>
              </div>

              {/* Số buổi còn lại */}
              <div className="space-y-1">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  Số buổi còn lại
                </Label>
                <div className="text-sm font-black text-foreground font-mono">
                  {remainingSessions} buổi
                </div>
              </div>

              {/* Điểm danh gần nhất */}
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#7D39EB]" />
                  Lần gần nhất
                </Label>
                <div className="text-sm font-bold text-foreground font-mono truncate">
                  {lastCheckin?.checkinTime
                    ? formatCheckinDateTime(lastCheckin.checkinTime, lastCheckin.date)
                    : "Chưa có"}
                </div>
              </div>
            </div>

            {/* THỜI GIAN & ĐỊA ĐIỂM HỌC */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/40">
              {(subject.startTime || subject.endTime) && (
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    Khung giờ học
                  </Label>
                  <div className="text-xs font-semibold text-foreground font-mono">
                    {subject.startTime} - {subject.endTime}
                  </div>
                </div>
              )}

              {(subject.room || subject.campus) && (
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    Địa điểm học
                  </Label>
                  <div className="text-xs font-semibold text-foreground truncate">
                    {subject.room ? `P.${subject.room}` : ""}
                    {subject.room && subject.campus ? " • " : ""}
                    {subject.campus || ""}
                  </div>
                </div>
              )}

              {subject.instructor && (
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    Giảng viên
                  </Label>
                  <div className="text-xs font-semibold text-foreground">
                    {subject.instructor}
                  </div>
                </div>
              )}
            </div>

            {/* LỊCH SỬ CÁC BUỔI ĐIỂM DANH */}
            <div className="space-y-2 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-muted-foreground" />
                  Lịch sử điểm danh các buổi ({subjectRecords.length})
                </Label>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRecordId(null);
                    setIsEditing(true);
                  }}
                  className="text-[11px] font-semibold text-[#7D39EB] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Pencil className="w-3 h-3" />
                  <span>Chỉnh sửa / Bù điểm danh</span>
                </button>
              </div>

              {subjectRecords.length > 0 ? (
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {subjectRecords.map((rec) => {
                    const statusMeta = ATTENDANCE_STATUS_MAP[rec.status];

                    return (
                      <div
                        key={rec.id}
                        className="p-2.5 rounded-md border border-border/60 hover:bg-muted/30 text-xs flex items-center justify-between transition-all"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[11px] text-muted-foreground shrink-0 font-bold">
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

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={cn(
                              "px-1.5 py-0.5 rounded text-[10px] font-bold",
                              statusMeta.color
                            )}
                          >
                            {statusMeta.label}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditRecord(rec)}
                            className="h-6 w-6 rounded-md border-border/70 hover:bg-muted text-muted-foreground hover:text-foreground"
                            title="Chỉnh sửa buổi này"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center text-muted-foreground text-xs">
                  Chưa có bản ghi điểm danh nào cho môn học này
                </div>
              )}
            </div>

            {/* Footer hành động xem: Text-only Đóng (Rule 1.2) */}
            <div className="flex items-center justify-end pt-3 border-t border-border/60">
              <Button
                type="button"
                onClick={onClose}
                className="rounded-md h-9 px-4 text-xs font-bold bg-muted text-foreground hover:bg-muted/80 border border-border/70"
              >
                Đóng
              </Button>
            </div>
          </div>
        ) : (
          /* 2. CHẾ ĐỘ CHỈNH SỬA (EDIT MODE - Rule 1.10) */
          <form onSubmit={handleSubmit} className="space-y-4 pt-3 text-left">
            {/* Thông tin môn học view mode */}
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
                placeholder="VD: Điểm danh bù ngày quên..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="rounded-md border-border/80 h-9 text-sm focus-visible:ring-[#7D39EB]"
              />
            </div>

            {/* Footer hành động: Text-only theo Rule 1.2 */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
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
        )}
      </DialogContent>
    </Dialog>
  );
}
