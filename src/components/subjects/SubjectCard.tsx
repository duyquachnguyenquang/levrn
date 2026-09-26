"use client";

import React, { useState } from "react";
import { Subject, AttendanceRecord } from "@/lib/types";
import { getSubjectCheckinStatus } from "@/lib/checkinUtils";
import { Button } from "@/components/ui/button";
import {
  Folder,
  Clock,
  BookOpen,
  MapPin,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { getSubjectCoverImage } from "@/lib/imagePresets";
import { MarqueeText } from "@/components/ui/marquee-text";

// Component biểu đồ tròn tiến độ ngày học (Pie Chart)
function AttendancePieChart({
  attended,
  total,
  size = 56,
}: {
  attended: number;
  total: number;
  size?: number;
}) {
  const safeTotal = total > 0 ? total : 15;
  const safeAttended = Math.max(0, attended);
  const percent = Math.min(100, Math.round((safeAttended / safeTotal) * 100));

  const strokeWidth = 5;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      title={`Tiến độ ngày học: ${safeAttended}/${safeTotal} ngày (${percent}%)`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-muted/30 dark:text-muted/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={percent === 100 ? "#C6FF33" : "#7D39EB"}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <span className="font-mono font-black text-xs leading-tight text-foreground tracking-tight">
          {safeAttended}/{safeTotal}
        </span>
        <span className="text-[8px] font-bold text-muted-foreground uppercase leading-none tracking-wider">
          ngày
        </span>
      </div>
    </div>
  );
}

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
        {/* 1. Ảnh bìa môn học (Visual Banner) nhỏ gọn tinh tế h-28, tỉ lệ cân đối */}
        <div className="relative h-28 w-full overflow-hidden bg-muted/40 shrink-0 select-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverUrl}
            alt={subject.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />

          {/* Badge phân loại môn học nổi trên ảnh góc trái */}
          <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 flex-wrap">
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

          {/* Gradient tối nhẹ ở đáy ảnh */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* 2. Thân nội dung Card (Body Content) - Rộng rãi, chữ to nổi bật, bảo toàn viền */}
        <div className="px-3.5 pt-3 pb-3 space-y-2.5 flex-1 flex flex-col justify-between bg-card overflow-hidden">
          <div className="space-y-2">
            {/* Hàng trên: Tiêu đề môn học to nổi bật bên trái, Pie-chart bên phải ngang hàng */}
            <div className="flex items-center justify-between gap-2.5 pt-0.5">
              <div
                onClick={() => onEdit(subject)}
                className="cursor-pointer min-w-0 flex-1"
                title={subject.name}
              >
                <MarqueeText
                  text={subject.name}
                  className="text-lg font-black tracking-tight text-foreground group-hover:text-[#7D39EB] transition-colors leading-tight"
                />
              </div>

              {/* Pie-chart lớn thể hiện số ngày thực học / số ngày phải học */}
              <AttendancePieChart
                attended={checkinStatus.attendedCount}
                total={checkinStatus.totalWeeks || 15}
                size={48}
              />
            </div>

            {/* Trạng thái Điểm danh hôm nay (nếu có ca học) */}
            {checkinStatus.canCheckin && (
              <Button
                type="button"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onCheckin?.(subject);
                }}
                className="w-full mt-1 h-7.5 bg-[#C6FF33] hover:bg-[#b2f310] text-black font-extrabold text-xs rounded-md shadow-xs transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-1.5"
                title="Điểm danh buổi học hôm nay"
              >
                <CheckCircle2 className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>Điểm danh ca học hôm nay</span>
              </Button>
            )}

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

          {/* Đường kẻ mờ phân tách */}
          <div className="border-t border-border/40 my-0.5" />

          {/* 3. Footer: Nút Xem chi tiết bên trái, Quick Action Links bên phải (bảo toàn không tràn) */}
          <div className="flex items-center justify-between gap-1.5 pt-0.5 overflow-hidden">
            {/* Bên trái: Nút Xem chi tiết (icon con mắt) */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(subject)}
              className="h-7.5 px-2.5 gap-1.5 text-xs font-semibold rounded-md border-border/80 hover:bg-[#7D39EB]/10 hover:text-[#7D39EB] hover:border-[#7D39EB]/40 transition-all flex items-center shadow-2xs shrink-0"
              title="Xem chi tiết môn học"
              aria-label="Xem chi tiết môn học"
            >
              <Eye className="h-3.5 w-3.5 text-[#7D39EB]" />
              <span>Xem chi tiết</span>
            </Button>

            {/* Bên phải: Các nút icon liên kết trực tiếp (LMS Course, Drive, Map) */}
            <div className="flex items-center gap-1 shrink-0">
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
