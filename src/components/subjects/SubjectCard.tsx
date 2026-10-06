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
  Globe,
} from "lucide-react";
import { getSubjectCoverImage } from "@/lib/imagePresets";
import { MarqueeText } from "@/components/ui/marquee-text";
import { formatShiftLabel, getCampusByName } from "@/lib/studyShifts";
import { isSubjectCompleted } from "@/lib/semesterUtils";

// Component biểu đồ tròn tiến độ ngày học (Pie Chart)
function AttendancePieChart({
  attended,
  total,
  size = 48,
  isCompleted = false,
}: {
  attended: number;
  total: number;
  size?: number;
  isCompleted?: boolean;
}) {
  const safeTotal = total > 0 ? total : 15;
  const safeAttended = Math.max(0, attended);
  const percent = isCompleted ? 100 : Math.min(100, Math.round((safeAttended / safeTotal) * 100));

  const strokeWidth = 4;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = isCompleted ? 0 : circumference - (percent / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center shrink-0 select-none"
      style={{ width: size, height: size }}
      title={isCompleted ? "Môn học đã hoàn thành" : `Tiến độ ngày học: ${safeAttended}/${safeTotal} (${percent}%)`}
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
          stroke={isCompleted ? "#7D39EB" : "currentColor"}
          strokeWidth={strokeWidth}
          fill={isCompleted ? "#7D39EB" : "transparent"}
          className={isCompleted ? "" : "text-muted/30 dark:text-muted/20"}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isCompleted ? "#7D39EB" : (percent === 100 ? "#C6FF33" : "#7D39EB")}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-center pointer-events-none">
        {isCompleted ? (
          <span className="font-black text-xs leading-none text-white tracking-wider">
            Xong
          </span>
        ) : (
          <span className="font-mono font-black text-xs leading-none text-foreground tracking-tight">
            {safeAttended}/{safeTotal}
          </span>
        )}
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

  // Xác định môn học đã hoàn thành (Học xong)
  const isCompleted =
    isSubjectCompleted({
      isCompleted: subject.isCompleted,
      semester: subject.semester,
      academicYear: subject.academicYear,
      endDate: subject.endDate,
      attendedCount: checkinStatus.attendedCount,
      totalWeeks: checkinStatus.totalWeeks,
    }) || weekProgress?.status === "finished";

  // Chuỗi lịch học và thời gian
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

  const scheduleText =
    scheduleDaysText && timeText
      ? `${scheduleDaysText} • ${timeText}`
      : scheduleDaysText || timeText || "Chưa có lịch";

  // Chuỗi địa điểm (Phòng học / Cơ sở) và liên kết Google Maps
  const campusInfo = getCampusByName(subject.campus) || getCampusByName(subject.mapUrl);
  const targetMapUrl = campusInfo?.mapUrl || subject.mapUrl || (subject.campus ? `https://maps.google.com/?q=${encodeURIComponent(subject.campus)}` : "");

  const locationText =
    subject.room && subject.campus
      ? `P.${subject.room} • ${subject.campus}`
      : subject.room
      ? `Phòng ${subject.room}`
      : subject.campus || "Chưa cập nhật phòng";

  return (
    <>
      <div 
        onClick={() => onEdit(subject)}
        className="group relative rounded-lg border border-border/75 dark:border-border/60 bg-card overflow-hidden shadow-xs hover:shadow-lg transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between h-full cursor-pointer"
      >
        {/* 1. Ảnh bìa môn học (Visual Banner) - Bấm vào ảnh bìa mở chi tiết môn học */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            onEdit(subject);
          }}
          className="relative h-20 sm:h-28 w-full overflow-hidden bg-muted/40 shrink-0 select-none cursor-pointer"
          title={`Xem chi tiết môn học [${subject.code}] ${subject.name}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverUrl}
            alt={subject.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />

          {/* Badge mã môn nổi trên ảnh góc trái */}
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 flex-wrap">
            <span
              className="font-mono font-black text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-md text-white backdrop-blur-md border border-white/20 shadow-xs"
              style={{ backgroundColor: `${cardColor}cc` }}
            >
              {subject.code}
            </span>

            {subject.category && (
              <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white/90 border border-white/15 shadow-xs">
                {subject.category}
              </span>
            )}
          </div>

          {/* Gradient tối nhẹ ở đáy ảnh */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* 2. Thân nội dung Card (Body Content) - Tầng 1: Tên, Thời gian, Địa điểm */}
        <div className="p-2.5 sm:p-3 space-y-2 flex-1 flex flex-col justify-between bg-card overflow-hidden">
          <div className="space-y-1.5">
            {/* Hàng trên: Tiêu đề môn học to nổi bật bên trái (click mở chi tiết), Pie-chart tiến độ bên phải */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(subject);
                }}
                className="min-w-0 flex-1 cursor-pointer"
                title={`Xem chi tiết môn học [${subject.code}] ${subject.name}`}
              >
                <MarqueeText
                  text={subject.name}
                  className="text-sm sm:text-base font-black tracking-tight text-foreground group-hover:text-[#7D39EB] transition-colors leading-tight"
                />
              </div>

              {/* Pie-chart tiến độ gọn gàng (size 34 trên mobile, 44 trên PC) */}
              <div className="shrink-0">
                <div className="sm:hidden">
                  <AttendancePieChart
                    attended={checkinStatus.attendedCount}
                    total={checkinStatus.totalWeeks || 15}
                    size={34}
                    isCompleted={isCompleted}
                  />
                </div>
                <div className="hidden sm:block">
                  <AttendancePieChart
                    attended={checkinStatus.attendedCount}
                    total={checkinStatus.totalWeeks || 15}
                    size={44}
                    isCompleted={isCompleted}
                  />
                </div>
              </div>
            </div>

            {/* Thông tin cốt lõi 1: Thời gian học (Thứ, Ca học) */}
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground min-w-0">
              <Clock className="w-3.5 h-3.5 text-[#7D39EB] shrink-0" />
              <span className="truncate font-medium">{scheduleText}</span>
            </div>

            {/* Thông tin cốt lõi 2: Địa điểm học (Phòng học, Cơ sở) */}
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground min-w-0">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate font-medium">{locationText}</span>
            </div>

            {/* Điểm danh hôm nay nếu đúng ca học và chưa học xong */}
            {checkinStatus.canCheckin && !isCompleted && (
              <Button
                type="button"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onCheckin?.(subject);
                }}
                className="w-full mt-1 h-7 bg-[#C6FF33] hover:bg-[#b2f310] text-black font-extrabold text-[11px] rounded-md shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1"
                title="Điểm danh buổi học hôm nay"
              >
                <CheckCircle2 className="h-3 w-3 stroke-[2.5]" />
                <span className="truncate">Điểm danh ca hôm nay</span>
              </Button>
            )}

            {checkinStatus.isCheckedIn && (
              <div className="w-full py-0.5 px-2 rounded-md bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="flex items-center gap-1 truncate">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                  <span className="truncate">Đã điểm danh</span>
                </span>
                <span className="text-[10px] font-mono opacity-80 shrink-0">
                  {checkinStatus.checkinTime
                    ? new Date(checkinStatus.checkinTime).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Xong"}
                </span>
              </div>
            )}
          </div>

          {/* 3. Footer: Nút tính năng điều hướng Course, Google Drive và Maps căn về góc dưới bên phải */}
          <div className="w-full pt-2 flex items-center justify-between gap-1.5 border-t border-border/40 mt-auto">
            {/* Góc dưới bên trái: Thông tin tín chỉ hoặc giảng viên */}
            <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground/80 truncate min-w-0">
              {subject.credits !== undefined && subject.credits !== null ? (
                <span
                  className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted/60 text-[10px] font-bold text-foreground/80 border border-border/40 shrink-0"
                  title={subject.credits === 0 ? "Môn điều kiện (không tính GPA)" : `${subject.credits} tín chỉ`}
                >
                  {subject.credits} TC
                </span>
              ) : subject.instructor ? (
                <span className="truncate text-[10.5px] font-medium text-muted-foreground" title={`GV: ${subject.instructor}`}>
                  {subject.instructor}
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground/40 font-mono">LEVRN</span>
              )}
            </div>

            {/* Góc dưới bên phải: Cụm 3 nút icon điều hướng Course, Google Drive và Maps */}
            <div className="flex items-center gap-1 shrink-0 ml-auto">
              {/* 1. Nút Course / LMS */}
              {subject.courseUrl ? (
                <a
                  href={subject.courseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="h-7 w-7 sm:h-7.5 sm:w-7.5 rounded-md flex items-center justify-center text-[#7D39EB] bg-[#7D39EB]/10 hover:bg-[#7D39EB]/20 border border-[#7D39EB]/30 transition-all hover:scale-105 active:scale-95 shadow-2xs"
                  title={`Mở Course / LMS: ${subject.courseUrl}`}
                  aria-label="Mở Course môn học"
                >
                  <Globe className="h-3.5 w-3.5" />
                </a>
              ) : (
                <span
                  className="h-7 w-7 sm:h-7.5 sm:w-7.5 rounded-md flex items-center justify-center text-muted-foreground/35 bg-muted/20 border border-border/30 cursor-not-allowed select-none"
                  title="Chưa cập nhật liên kết Course / LMS"
                  aria-label="Chưa cập nhật Course"
                >
                  <Globe className="h-3.5 w-3.5" />
                </span>
              )}

              {/* 2. Nút Google Drive */}
              {subject.driveUrl ? (
                <a
                  href={subject.driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="h-7 w-7 sm:h-7.5 sm:w-7.5 rounded-md flex items-center justify-center text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all hover:scale-105 active:scale-95 shadow-2xs"
                  title={`Mở Google Drive: ${subject.driveUrl}`}
                  aria-label="Mở Google Drive môn học"
                >
                  <Folder className="h-3.5 w-3.5" />
                </a>
              ) : (
                <span
                  className="h-7 w-7 sm:h-7.5 sm:w-7.5 rounded-md flex items-center justify-center text-muted-foreground/35 bg-muted/20 border border-border/30 cursor-not-allowed select-none"
                  title="Chưa cập nhật liên kết Google Drive"
                  aria-label="Chưa cập nhật Google Drive"
                >
                  <Folder className="h-3.5 w-3.5" />
                </span>
              )}

              {/* 3. Nút Google Maps */}
              {targetMapUrl ? (
                <a
                  href={targetMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="h-7 w-7 sm:h-7.5 sm:w-7.5 rounded-md flex items-center justify-center text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all hover:scale-105 active:scale-95 shadow-2xs"
                  title={`Mở Google Maps: ${campusInfo?.name || subject.campus || "Cơ sở học"}`}
                  aria-label="Mở Google Maps cơ sở học"
                >
                  <MapPin className="h-3.5 w-3.5" />
                </a>
              ) : (
                <span
                  className="h-7 w-7 sm:h-7.5 sm:w-7.5 rounded-md flex items-center justify-center text-muted-foreground/35 bg-muted/20 border border-border/30 cursor-not-allowed select-none"
                  title="Chưa cập nhật địa điểm / cơ sở học"
                  aria-label="Chưa cập nhật Google Maps"
                >
                  <MapPin className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
