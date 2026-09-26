"use client";

import React, { useState } from "react";
import { Subject, AttendanceRecord } from "@/lib/types";
import { getSubjectCheckinStatus } from "@/lib/checkinUtils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pencil,
  Trash2,
  GraduationCap,
  Calendar,
  CalendarDays,
  ExternalLink,
  Folder,
  Clock,
  BookOpen,
  MapPin,
  MoreVertical,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getSubjectCoverImage } from "@/lib/imagePresets";
import { ChangeCoverDialog } from "@/components/ui/change-cover-dialog";
import { MarqueeText } from "@/components/ui/marquee-text";

interface SubjectCardProps {
  subject: Subject;
  onEdit: (subject: Subject) => void;
  onDelete: (id: string) => void;
  onUpdateSubject?: (id: string, updates: Partial<Subject>) => void;
  attendanceRecords?: AttendanceRecord[];
  onCheckin?: (subject: Subject) => void | Promise<void>;
}

// Định dạng ngày hiển thị tiếng Việt DD/MM/YYYY
function formatDateVi(dateStr?: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

// Tính tiến độ tuần học hiện tại dựa trên startDate và totalWeeks
function getWeekProgress(startDateStr?: string, totalWeeks?: number) {
  if (!startDateStr || !totalWeeks || totalWeeks <= 0) return null;
  const start = new Date(startDateStr);
  const now = new Date();
  if (isNaN(start.getTime())) return null;

  const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return {
      status: "upcoming" as const,
      currentWeek: 0,
      totalWeeks,
      percent: 0,
      label: "Chưa bắt đầu",
    };
  }

  const currentWeek = Math.min(totalWeeks, Math.floor(diffDays / 7) + 1);
  const percent = Math.min(100, Math.round((currentWeek / totalWeeks) * 100));
  const isFinished = diffDays >= totalWeeks * 7;

  return {
    status: isFinished ? ("finished" as const) : ("active" as const),
    currentWeek,
    totalWeeks,
    percent,
    label: isFinished ? "Đã xong" : `Tuần ${currentWeek}/${totalWeeks}`,
  };
}

export function SubjectCard({
  subject,
  onEdit,
  onDelete,
  onUpdateSubject,
  attendanceRecords = [],
  onCheckin,
}: SubjectCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCoverDialog, setShowCoverDialog] = useState(false);
  const [imageError, setImageError] = useState(false);

  const cardColor = subject.color || "#7D39EB";
  const weekProgress = getWeekProgress(subject.startDate, subject.totalWeeks);
  const checkinStatus = getSubjectCheckinStatus(subject, attendanceRecords);
  const coverUrl = !imageError ? getSubjectCoverImage(subject) : getSubjectCoverImage();

  // Chuỗi lịch học
  const scheduleDaysText =
    subject.scheduleDays && subject.scheduleDays.length > 0
      ? subject.scheduleDays.map((d) => (d === 0 ? "CN" : `T${d + 1}`)).join(", ")
      : subject.startDate && !isNaN(new Date(subject.startDate).getTime())
      ? new Date(subject.startDate).getDay() === 0 ? "CN" : `T${new Date(subject.startDate).getDay() + 1}`
      : "";

  const timeText =
    subject.startTime && subject.endTime
      ? `${subject.startTime} - ${subject.endTime}`
      : subject.startTime || "";

  return (
    <>
      <div className="group relative rounded-lg border border-border/75 dark:border-border/60 bg-card overflow-hidden shadow-xs hover:shadow-lg transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between h-full">
        {/* 1. Ảnh bìa môn học (Visual Banner) đồng bộ kích thước chuẩn cố định */}
        <div className="relative h-44 w-full overflow-hidden bg-muted/40 shrink-0 select-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverUrl}
            alt={subject.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />

          {/* Badge phân loại môn học nổi trên ảnh góc trái */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 flex-wrap">
            <span
              className="font-mono font-black text-[11px] px-2 py-0.5 rounded-md text-white backdrop-blur-md border border-white/20 shadow-xs"
              style={{ backgroundColor: `${cardColor}cc` }}
            >
              {subject.code}
            </span>

            {subject.category && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white/90 border border-white/15 shadow-xs">
                {subject.category}
              </span>
            )}
          </div>

          {/* Nút đổi nhanh ảnh bìa khi hover ảnh */}
          <button
            type="button"
            onClick={() => setShowCoverDialog(true)}
            className="absolute top-3 right-3 z-10 h-7 px-2.5 rounded-md bg-black/60 hover:bg-black/85 backdrop-blur-md text-white text-[11px] font-medium flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 border border-white/20 shadow-xs"
            title="Đổi ảnh bìa môn học"
            aria-label="Đổi ảnh bìa môn học"
          >
            <ImageIcon className="h-3 w-3" />
            <span>Đổi ảnh</span>
          </button>

          {/* Gradient tối nhẹ ở đáy ảnh */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

          {/* Đường khuyết notch gọn gàng, cứng cáp */}
          <div className="absolute -bottom-[1px] left-0 right-0 z-10 pointer-events-none">
            <svg
              className="w-full h-5 fill-card text-card block"
              viewBox="0 0 400 20"
              preserveAspectRatio="none"
            >
              <path d="M 0,20 L 0,8 L 300,8 C 312,8 316,0 326,0 L 374,0 C 384,0 388,8 400,8 L 400,20 Z" />
            </svg>
          </div>

          {/* Nút tuỳ chọn nằm gọn gàng bên trong khía notch */}
          <div className="absolute bottom-1 right-3.5 z-20">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-md bg-card shadow-xs border border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all hover:scale-105"
                  title="Tùy chọn môn học"
                  aria-label="Tùy chọn môn học"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-lg p-1.5 shadow-xl">
                <DropdownMenuItem
                  onClick={() => onEdit(subject)}
                  className="text-xs cursor-pointer gap-2 rounded-md"
                >
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Chỉnh sửa thông tin</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowCoverDialog(true)}
                  className="text-xs cursor-pointer gap-2 rounded-md"
                >
                  <ImageIcon className="h-3.5 w-3.5 text-[#7D39EB]" />
                  <span>Đổi ảnh bìa (Link)...</span>
                </DropdownMenuItem>
                {subject.courseUrl && (
                  <DropdownMenuItem asChild className="text-xs cursor-pointer gap-2 rounded-md">
                    <a href={subject.courseUrl} target="_blank" rel="noopener noreferrer">
                      <BookOpen className="h-3.5 w-3.5 text-[#7D39EB]" />
                      <span>Mở LMS Course</span>
                    </a>
                  </DropdownMenuItem>
                )}
                {subject.driveUrl && (
                  <DropdownMenuItem asChild className="text-xs cursor-pointer gap-2 rounded-md">
                    <a href={subject.driveUrl} target="_blank" rel="noopener noreferrer">
                      <Folder className="h-3.5 w-3.5 text-amber-500" />
                      <span>Mở Google Drive</span>
                    </a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-xs cursor-pointer gap-2 rounded-md text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Xoá môn học</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* 2. Thân nội dung Card (Body Content) - Thoáng đãng, có lề padding đầy đủ */}
        <div className="px-5 pt-3.5 pb-4 space-y-3 flex-1 flex flex-col justify-between bg-card">
          <div className="space-y-2">
            {/* Hàng meta: Tín chỉ • Tuần học • Học kỳ (giữ 1 dòng chuẩn) */}
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground/85 pr-9 whitespace-nowrap overflow-hidden">
              <span className="font-semibold text-foreground/90 flex items-center gap-1 shrink-0">
                <GraduationCap className="h-3.5 w-3.5 text-[#7D39EB]" />
                {subject.credits !== undefined ? `${subject.credits} Tín chỉ` : "Học phần"}
              </span>
              <span className="text-muted-foreground/40 shrink-0">•</span>
              <span className="font-medium shrink-0">
                {weekProgress ? weekProgress.label : `${subject.totalWeeks || 15} tuần`}
              </span>
              {subject.semester && (
                <>
                  <span className="text-muted-foreground/40 shrink-0">•</span>
                  <div className="max-w-[120px] overflow-hidden shrink-0">
                    <MarqueeText
                      text={subject.semester}
                      className="text-muted-foreground/90 text-xs"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Tên môn học với hiệu ứng Marquee tự động chạy ngang tuần hoàn khi tràn */}
            <div
              onClick={() => onEdit(subject)}
              className="cursor-pointer pt-0.5"
              title={subject.name}
            >
              <MarqueeText
                text={subject.name}
                className="text-base font-bold text-foreground group-hover:text-[#7D39EB] transition-colors"
              />
            </div>

            {/* Mô tả lịch học & phòng học cân đối với Marquee */}
            <div className="text-xs text-muted-foreground min-h-[2.4rem] flex flex-col justify-center space-y-0.5">
              {scheduleDaysText ? (
                <>
                  <div className="flex items-center gap-1 text-foreground/85 font-medium whitespace-nowrap overflow-hidden">
                    <strong className="text-foreground font-semibold shrink-0">Lịch:</strong>
                    <span className="shrink-0">{scheduleDaysText}</span>
                    {timeText && <span className="font-mono text-[11px] text-muted-foreground">({timeText})</span>}
                  </div>
                  {(subject.room || subject.campus) ? (
                    <MarqueeText
                      text={`${subject.room ? `Phòng ${subject.room}` : ""}${subject.room && subject.campus ? " • " : ""}${subject.campus || ""}`}
                      className="text-[11px] text-muted-foreground"
                    />
                  ) : (
                    <span className="text-[11px] text-muted-foreground/60 italic">Chưa xếp phòng</span>
                  )}
                </>
              ) : (
                <span className="text-[11px] text-muted-foreground/80">
                  {subject.room ? `Phòng ${subject.room} • ${subject.campus || "Tại cơ sở"}` : "Chưa cập nhật lịch và phòng học."}
                </span>
              )}
            </div>

            {/* Tags / Pills hiển thị 1 hàng đồng bộ */}
            <div className="flex items-center gap-1.5 pt-1 overflow-hidden whitespace-nowrap">
              {/* Pill tiến độ tuần */}
              {weekProgress && (
                <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium bg-[#7D39EB]/10 text-[#7D39EB] border border-[#7D39EB]/20 shrink-0">
                  <Clock className="h-3 w-3" />
                  {weekProgress.percent}% tiến độ
                </span>
              )}

              {/* Pill ngày bắt đầu */}
              {subject.startDate && (
                <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium bg-muted/60 text-muted-foreground border border-border/60 shrink-0">
                  <Calendar className="h-3 w-3 text-muted-foreground/70" />
                  {formatDateVi(subject.startDate)}
                </span>
              )}

              {/* Pill phòng học */}
              {subject.room && (
                <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium bg-muted/60 text-muted-foreground border border-border/60 shrink-0 max-w-[130px] overflow-hidden">
                  <MapPin className="h-3 w-3 text-muted-foreground/70 shrink-0" />
                  <div className="overflow-hidden">
                    <MarqueeText text={subject.room} className="text-[11px]" />
                  </div>
                </span>
              )}
            </div>

            {/* Thanh tiến độ ngày học & Nút Điểm danh tích hợp */}
            <div className="pt-2 pb-0.5 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-foreground/80 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-[#7D39EB]" />
                  <span>Tiến độ ngày học</span>
                </span>
                <span className="font-mono font-bold text-foreground">
                  {checkinStatus.attendedCount}/{checkinStatus.totalWeeks} buổi ({checkinStatus.progressPercent}%)
                </span>
              </div>
              <div className="h-1.5 w-full bg-muted/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#7D39EB] to-[#C6FF33] transition-all duration-300 rounded-full"
                  style={{ width: `${checkinStatus.progressPercent}%` }}
                />
              </div>

              {/* Nút Điểm danh khi đúng ngày và trong giờ học */}
              {checkinStatus.canCheckin && (
                <Button
                  type="button"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCheckin?.(subject);
                  }}
                  className="w-full mt-1.5 h-8 bg-[#C6FF33] hover:bg-[#b2f310] text-black font-extrabold text-xs rounded-md shadow-xs transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-1.5"
                  title="Điểm danh buổi học hôm nay"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Điểm danh ca học hôm nay</span>
                </Button>
              )}

              {/* Badge khi đã điểm danh */}
              {checkinStatus.isCheckedIn && (
                <div className="mt-1 w-full py-1 px-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Đã điểm danh hôm nay</span>
                  </span>
                  <span className="text-[10px] font-mono opacity-80">
                    {checkinStatus.checkinTime
                      ? new Date(checkinStatus.checkinTime).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Hoàn tất"}
                  </span>
                </div>
              )}

              {/* Báo chưa tới giờ học nếu hôm nay có lịch nhưng ngoài giờ */}
              {checkinStatus.isTodayClass && !checkinStatus.isInTimeWindow && !checkinStatus.isCheckedIn && (
                <div className="mt-1 w-full py-1 px-2 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                  <span className="flex items-center gap-1.5 truncate">
                    <Clock className="h-3 w-3 shrink-0" />
                    <span className="truncate">Lịch: {subject.startTime} - {subject.endTime}</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0 ml-1">
                    {checkinStatus.statusText}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Đường kẻ mờ phân tách */}
          <div className="border-t border-border/40 my-1" />

          {/* 3. Footer: Giảng viên bên trái, App Icons bên phải */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            {/* Bên trái: Giảng viên với Marquee nếu tên dài */}
            <div className="flex items-center gap-2 min-w-0 flex-1 mr-2 overflow-hidden">
              <div
                className="h-6.5 w-6.5 rounded-md flex items-center justify-center text-[9.5px] font-bold text-white shadow-2xs shrink-0"
                style={{ backgroundColor: cardColor }}
              >
                {subject.code.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <MarqueeText
                  text={subject.instructor || "Chưa cập nhật GV"}
                  className="text-xs font-semibold text-foreground/80"
                />
              </div>
            </div>

            {/* Bên phải: Các nút icon (LMS Course, Drive, Map, Edit) */}
            <div className="flex items-center gap-1.5 shrink-0">
              {subject.courseUrl && (
                <a
                  href={subject.courseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-7 w-7 rounded-md flex items-center justify-center bg-[#7D39EB]/10 hover:bg-[#7D39EB]/20 text-[#7D39EB] border border-[#7D39EB]/25 transition-all shadow-2xs hover:scale-105"
                  title="Mở LMS Course"
                  aria-label="Mở LMS Course"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                </a>
              )}

              {subject.driveUrl && (
                <a
                  href={subject.driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-7 w-7 rounded-md flex items-center justify-center bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/25 transition-all shadow-2xs hover:scale-105"
                  title="Mở Google Drive"
                  aria-label="Mở Google Drive"
                >
                  <Folder className="h-3.5 w-3.5" />
                </a>
              )}

              {(subject.mapUrl || subject.campus) && (
                <a
                  href={subject.mapUrl || `https://maps.google.com/?q=${encodeURIComponent(subject.campus || "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-7 w-7 rounded-md flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/25 transition-all shadow-2xs hover:scale-105"
                  title="Mở Google Maps cơ sở"
                  aria-label="Mở Google Maps cơ sở"
                >
                  <MapPin className="h-3.5 w-3.5" />
                </a>
              )}

              {/* Nút sửa */}
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onEdit(subject)}
                className="h-7 w-7 rounded-md text-muted-foreground hover:text-[#7D39EB] hover:bg-[#7D39EB]/10"
                title="Chỉnh sửa môn học"
                aria-label="Chỉnh sửa môn học"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal thay đổi link ảnh bìa vĩnh viễn */}
      <ChangeCoverDialog
        open={showCoverDialog}
        onOpenChange={setShowCoverDialog}
        currentUrl={subject.imageUrl || ""}
        title="Đổi ảnh bìa môn học"
        subtitle={`Dán link ảnh vĩnh viễn cho môn "${subject.name}" (${subject.code}) để giao diện sinh động và ngăn nắp.`}
        onSave={(newUrl) => {
          onUpdateSubject?.(subject.id, { imageUrl: newUrl });
        }}
      />

      {/* Alert Dialog xác nhận trước khi xoá an toàn */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="rounded-lg border-border shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-destructive">
              Xác nhận xoá môn học?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Bạn có chắc chắn muốn xoá môn học{" "}
              <strong className="text-foreground">
                [{subject.code}] {subject.name}
              </strong>{" "}
              không? Dữ liệu môn học và lịch học sẽ bị xoá khỏi hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-md">Huỷ bỏ</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(subject.id)}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-md"
            >
              Xác nhận xoá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
