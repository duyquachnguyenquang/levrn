"use client";

import React, { useState } from "react";
import { Subject } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
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
} from "lucide-react";

interface SubjectCardProps {
  subject: Subject;
  onEdit: (subject: Subject) => void;
  onDelete: (id: string) => void;
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

  // Tính số ngày chênh lệch
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
    label: isFinished ? "Đã hoàn thành" : `Tuần ${currentWeek}/${totalWeeks}`,
  };
}

export function SubjectCard({ subject, onEdit, onDelete }: SubjectCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const cardColor = subject.color || "#7D39EB";
  const weekProgress = getWeekProgress(subject.startDate, subject.totalWeeks);

  return (
    <>
      <Card className="group relative overflow-hidden border border-border/80 bg-card hover:shadow-2xl hover:border-[#7D39EB]/50 transition-all duration-300 hover:-translate-y-1.5 rounded-lg flex flex-col justify-between">
        {/* Dải màu nhận diện theo Phân loại bên mép trái */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300 group-hover:w-2.5"
          style={{ backgroundColor: cardColor }}
        />

        <CardContent className="p-3.5 pl-4.5 flex-1 flex flex-col justify-between">
          <div>
            {/* Hàng trên: Mã môn + Phân loại + Tín chỉ + Pie-chart tiến độ ở góc phải */}
            <div className="flex items-center justify-between gap-1.5 mb-2">
              <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                {/* Mã môn */}
                <span
                  className="font-mono font-black text-[11px] px-1.5 py-0.5 rounded-md tracking-wider shadow-xs shrink-0"
                  style={{
                    backgroundColor: `${cardColor}20`,
                    color: cardColor,
                    border: `1px solid ${cardColor}40`,
                  }}
                >
                  {subject.code}
                </span>

                {/* Phân loại môn học */}
                {subject.category && (
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-md truncate max-w-[100px]"
                    style={{
                      backgroundColor: `${cardColor}15`,
                      color: cardColor,
                    }}
                    title={subject.category}
                  >
                    {subject.category}
                  </span>
                )}

                {/* Tín chỉ */}
                {subject.credits !== undefined && (
                  <Badge
                    variant="outline"
                    className="text-[9px] font-semibold text-muted-foreground rounded-md border-border/70 py-0 px-1"
                  >
                    <GraduationCap className="h-2.5 w-2.5 mr-0.5 text-muted-foreground" />
                    {subject.credits} TC
                  </Badge>
                )}
              </div>

              {/* Pie-chart tiến độ lịch học ở góc phải bên trên */}
              <div
                className="relative flex items-center justify-center shrink-0 cursor-default"
                title={
                  weekProgress
                    ? `Tiến độ: ${weekProgress.label} (${weekProgress.percent}%)`
                    : subject.startDate
                    ? `Bắt đầu: ${formatDateVi(subject.startDate)}`
                    : "Chưa có tiến độ lịch học"
                }
              >
                <svg className="w-8 h-8 -rotate-90 transform" viewBox="0 0 36 36">
                  {/* Vòng nền */}
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    stroke="currentColor"
                    strokeWidth="3.2"
                    fill="transparent"
                    className="text-muted/40"
                  />
                  {/* Vòng tiến độ */}
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    stroke={cardColor}
                    strokeWidth="3.2"
                    strokeDasharray="88"
                    strokeDashoffset={
                      88 - (88 * (weekProgress ? weekProgress.percent : 0)) / 100
                    }
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <span className="absolute text-[8px] font-black text-foreground font-mono">
                  {weekProgress ? `${weekProgress.percent}%` : "0%"}
                </span>
              </div>
            </div>

            {/* Tên môn học */}
            <h3 className="font-extrabold text-sm text-foreground leading-snug tracking-tight mb-2 group-hover:text-[#7D39EB] transition-colors line-clamp-2 min-h-[2.5rem]">
              {subject.name}
            </h3>

            {/* Thông tin học kỳ & Lịch học: Căn lề thẳng hàng 100% giữa icon và chữ */}
            <div className="space-y-1.5 text-xs text-muted-foreground pt-0.5">
              {/* Hàng 1: Học kỳ */}
              <div className="flex items-center gap-2 text-[11px] leading-tight">
                <div className="w-3.5 h-3.5 flex items-center justify-center shrink-0 text-muted-foreground/80">
                  <Calendar className="h-3.5 w-3.5" />
                </div>
                <span className="font-semibold text-foreground/80 truncate">{subject.semester || "Chưa xếp kỳ"}</span>
              </div>

              {/* Hàng 2: Thời lượng tuần */}
              {subject.totalWeeks ? (
                <div className="flex items-center gap-2 text-[11px] leading-tight">
                  <div className="w-3.5 h-3.5 flex items-center justify-center shrink-0 text-muted-foreground/80">
                    <Clock className="h-3.5 w-3.5" />
                  </div>
                  <span className="truncate">
                    {subject.totalWeeks} tuần
                    {subject.startDate ? ` (từ ${formatDateVi(subject.startDate)})` : ""}
                  </span>
                </div>
              ) : subject.startDate ? (
                <div className="flex items-center gap-2 text-[11px] leading-tight">
                  <div className="w-3.5 h-3.5 flex items-center justify-center shrink-0 text-muted-foreground/80">
                    <Clock className="h-3.5 w-3.5" />
                  </div>
                  <span className="truncate">Bắt đầu: {formatDateVi(subject.startDate)}</span>
                </div>
              ) : null}

              {/* Hàng 3: Thứ học (Dùng icon CalendarDays đồng bộ kích thước w-3.5 h-3.5) */}
              {((subject.scheduleDays && subject.scheduleDays.length > 0) || subject.startDate) && (
                <div className="flex items-center gap-2 text-[11px] leading-tight text-foreground/85">
                  <div className="w-3.5 h-3.5 flex items-center justify-center shrink-0 text-[#7D39EB]">
                    <CalendarDays className="h-3.5 w-3.5" />
                  </div>
                  <span className="truncate">
                    Lịch học:{" "}
                    <strong className="text-foreground font-semibold">
                      {subject.scheduleDays && subject.scheduleDays.length > 0
                        ? subject.scheduleDays.map((d) => (d === 0 ? "Chủ Nhật" : `Thứ ${d + 1}`)).join(", ")
                        : (subject.startDate && !isNaN(new Date(subject.startDate).getTime()))
                        ? (new Date(subject.startDate).getDay() === 0 ? "Chủ Nhật" : `Thứ ${new Date(subject.startDate).getDay() + 1}`)
                        : ""}
                    </strong>
                  </span>
                </div>
              )}

              {/* Hàng 4: Ca học */}
              {(subject.startTime || subject.endTime) && (
                <div className="flex items-center gap-2 text-[11px] leading-tight text-foreground/85">
                  <div className="w-3.5 h-3.5 flex items-center justify-center shrink-0 text-[#7D39EB]">
                    <Clock className="h-3.5 w-3.5" />
                  </div>
                  <span className="truncate">
                    Ca học:{" "}
                    <strong className="text-foreground font-mono font-bold">
                      {subject.startTime || "--:--"} - {subject.endTime || "--:--"}
                    </strong>
                  </span>
                </div>
              )}

              {/* Hàng 5: Phòng học & Cơ sở */}
              {(subject.room || subject.campus) && (
                <div className="flex items-center gap-2 text-[11px] leading-tight text-foreground/80">
                  <div className="w-3.5 h-3.5 flex items-center justify-center shrink-0 text-[#C6FF33]">
                    <MapPin className="h-3.5 w-3.5" />
                  </div>
                  <span className="truncate min-w-0 flex-1">
                    {subject.room && <strong className="text-foreground font-semibold mr-1">{subject.room}</strong>}
                    {subject.campus && (
                      <span className="text-muted-foreground">
                        • {subject.campus}
                      </span>
                    )}
                  </span>
                  {(subject.mapUrl || subject.campus) && (
                    <a
                      href={subject.mapUrl || `https://maps.google.com/?q=${encodeURIComponent(subject.campus || "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto text-[10px] font-bold text-[#7D39EB] hover:underline flex items-center gap-0.5 shrink-0"
                      title="Mở Google Maps"
                    >
                      <span>Maps</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Dải chân card: Các nút Course, Drive, Chỉnh sửa, Xoá */}
          <div className="mt-3.5 pt-2.5 border-t border-border/50 flex items-center justify-between gap-1 flex-wrap">
            {/* Nhóm liên kết Course & Drive */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {subject.courseUrl && (
                <a
                  href={subject.courseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10.5px] font-bold bg-[#7D39EB]/10 text-[#7D39EB] hover:bg-[#7D39EB]/20 border border-[#7D39EB]/25 transition-all hover:-translate-y-0.5 active:scale-95 shrink-0"
                  title="Mở LMS Course"
                >
                  <BookOpen className="h-3 w-3" />
                  <span>Course</span>
                </a>
              )}

              {subject.driveUrl && (
                <a
                  href={subject.driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10.5px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/25 transition-all hover:-translate-y-0.5 active:scale-95 shrink-0"
                  title="Mở Google Drive môn học"
                >
                  <Folder className="h-3 w-3" />
                  <span>Drive</span>
                </a>
              )}
            </div>

            {/* Nhóm thao tác Chỉnh sửa & Xoá */}
            <div className="flex items-center gap-0.5 ml-auto shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(subject)}
                className="h-7 w-7 rounded-md text-muted-foreground hover:text-[#7D39EB] hover:bg-[#7D39EB]/10 transition-all active:scale-90"
                title="Chỉnh sửa môn học"
                aria-label={`Chỉnh sửa môn ${subject.name}`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDeleteConfirm(true)}
                className="h-7 w-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all active:scale-90"
                title="Xoá môn học"
                aria-label={`Xoá môn ${subject.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
              không? Dữ liệu môn học sẽ bị xoá khỏi thiết bị của bạn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-md transition-colors">Giữ lại</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-md bg-destructive hover:bg-destructive/90 transition-all active:scale-95"
              onClick={() => {
                onDelete(subject.id);
                setShowDeleteConfirm(false);
              }}
            >
              Xác nhận xoá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

