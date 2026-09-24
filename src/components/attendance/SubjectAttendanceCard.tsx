"use client";

import React, { useState } from "react";
import {
  SubjectAttendanceSummary,
  AttendanceRecord,
  AttendanceStatus,
  ATTENDANCE_STATUS_MAP,
} from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  X,
  Clock,
  FileCheck,
  Minus,
  AlertTriangle,
  RotateCcw,
  Plus,
  MoreVertical,
  Calendar,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface SubjectAttendanceCardProps {
  summary: SubjectAttendanceSummary;
  onQuickMark: (subjectId: string, sessionNumber: number, status: AttendanceStatus) => void;
  onOpenSessionModal: (session: AttendanceRecord) => void;
  onMarkAllPresent: (subjectId: string) => void;
  onRegenerate: () => void;
  onAddExtraSession: () => void;
}

export function SubjectAttendanceCard({
  summary,
  onQuickMark,
  onOpenSessionModal,
  onMarkAllPresent,
  onRegenerate,
  onAddExtraSession,
}: SubjectAttendanceCardProps) {
  // Chu trình trạng thái nhanh khi click chuột: upcoming -> present -> late -> excused -> absent -> upcoming
  const cycleStatus = (current: AttendanceStatus): AttendanceStatus => {
    switch (current) {
      case "upcoming":
        return "present";
      case "present":
        return "late";
      case "late":
        return "absent";
      case "absent":
        return "excused";
      case "excused":
        return "upcoming";
      default:
        return "present";
    }
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case "present":
        return <Check className="h-3 w-3 stroke-[3]" />;
      case "late":
        return <Clock className="h-3 w-3 stroke-[2.5]" />;
      case "excused":
        return <FileCheck className="h-3 w-3 stroke-[2.5]" />;
      case "absent":
        return <X className="h-3 w-3 stroke-[3]" />;
      default:
        return <Minus className="h-2.5 w-2.5 opacity-40" />;
    }
  };

  // Xác định màu sắc cảnh báo
  const cardBorderClass = summary.isBarredFromExam
    ? "border-red-500/70 shadow-red-500/10 shadow-lg"
    : summary.isAtRisk
    ? "border-amber-500/70 shadow-amber-500/10 shadow-lg"
    : "border-border/80 hover:border-[#7D39EB]/40";

  return (
    <Card className={cn("overflow-hidden border bg-card rounded-lg transition-all", cardBorderClass)}>
      {/* Thanh viền màu trên đỉnh theo màu môn học */}
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: summary.color || "#7D39EB" }}
      />

      <CardContent className="p-4 sm:p-5">
        {/* Header môn học */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="font-mono font-black text-xs px-2 py-0.5 rounded-md"
                style={{
                  backgroundColor: `${summary.color}20`,
                  color: summary.color,
                  border: `1px solid ${summary.color}40`,
                }}
              >
                {summary.subjectCode}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {summary.semester}
              </span>

              {/* Badges cảnh báo */}
              {summary.isBarredFromExam ? (
                <Badge className="bg-red-500 text-white font-extrabold text-[10px] px-2 py-0.5 animate-pulse">
                  <AlertTriangle className="h-3 w-3 mr-1" /> BỊ CẤM THI ({summary.totalAbsences}/{summary.maxAllowedAbsences} buổi)
                </Badge>
              ) : summary.isAtRisk ? (
                <Badge className="bg-amber-500/20 text-amber-500 border border-amber-500/30 font-bold text-[10px] px-2 py-0.5">
                  <AlertTriangle className="h-3 w-3 mr-1" /> Nguy cơ cấm thi (Còn 1 buổi)
                </Badge>
              ) : (
                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  An toàn
                </span>
              )}
            </div>

            <h3 className="font-extrabold text-sm sm:text-base text-foreground mt-1.5 truncate">
              {summary.subjectName}
            </h3>
          </div>

          {/* Menu thao tác phụ */}
          <div className="flex items-center gap-1 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-lg p-1.5 shadow-2xl">
                <DropdownMenuItem
                  onClick={() => onMarkAllPresent(summary.subjectId)}
                  className="text-xs cursor-pointer gap-2"
                >
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Đánh dấu tất cả có mặt</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onAddExtraSession}
                  className="text-xs cursor-pointer gap-2"
                >
                  <Plus className="h-3.5 w-3.5 text-[#7D39EB]" />
                  <span>Thêm buổi học bù</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onRegenerate}
                  className="text-xs cursor-pointer gap-2"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Tạo lại 15 buổi chuẩn</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Thanh tiến độ và thống kê vắng */}
        <div className="bg-muted/40 rounded-lg p-3 border border-border/60 mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5">
              Tỷ lệ chuyên cần:
              <strong className="text-foreground font-mono font-bold">
                {summary.attendanceRate}%
              </strong>
            </span>
            <span className="text-[11px] text-muted-foreground">
              Đã vắng:{" "}
              <strong
                className={cn(
                  "font-bold font-mono",
                  summary.isBarredFromExam
                    ? "text-red-500"
                    : summary.isAtRisk
                    ? "text-amber-500"
                    : "text-foreground"
                )}
              >
                {summary.totalAbsences}
              </strong>
              /{summary.maxAllowedAbsences} buổi cho phép
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-border/80 overflow-hidden flex">
            <div
              className={cn(
                "h-full transition-all duration-300",
                summary.attendanceRate >= 80
                  ? "bg-emerald-500"
                  : summary.attendanceRate >= 65
                  ? "bg-amber-500"
                  : "bg-red-500"
              )}
              style={{ width: `${Math.min(100, summary.attendanceRate)}%` }}
            />
          </div>

          {/* Chi tiết con: Có mặt, Trễ, Phép, Vắng */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2 pt-2 border-t border-border/40">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Có mặt: <strong className="text-foreground">{summary.presentCount}</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Đi trễ: <strong className="text-foreground">{summary.lateCount}</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              Có phép: <strong className="text-foreground">{summary.excusedCount}</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Vắng: <strong className="text-foreground">{summary.absentCount}</strong>
            </span>
          </div>
        </div>

        {/* Ma trận các buổi học (Interactive Session Grid) */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-foreground mb-2">
            <span>Danh sách buổi học ({summary.records.length} buổi)</span>
            <span className="text-[10px] text-muted-foreground font-normal">
              Click để đổi nhanh / Nhấn đúp để sửa ghi chú
            </span>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-15 gap-1.5">
            {summary.records.map((session) => {
              const meta = ATTENDANCE_STATUS_MAP[session.status];

              return (
                <div key={session.id} className="relative group/session">
                  <button
                    type="button"
                    onClick={() => {
                      const next = cycleStatus(session.status);
                      onQuickMark(session.subjectId, session.sessionNumber, next);
                    }}
                    onDoubleClick={() => onOpenSessionModal(session)}
                    title={`Buổi ${session.sessionNumber} (${session.date}): ${meta.label}${
                      session.notes ? ` - ${session.notes}` : ""
                    }. Nhấp đúp để xem chi tiết.`}
                    className={cn(
                      "w-full aspect-square rounded-md border flex flex-col items-center justify-center p-1 transition-all duration-150 active:scale-90 hover:shadow-xs",
                      session.status === "present"
                        ? "bg-emerald-500/15 border-emerald-500/35 text-emerald-500"
                        : session.status === "late"
                        ? "bg-amber-500/15 border-amber-500/35 text-amber-500"
                        : session.status === "excused"
                        ? "bg-blue-500/15 border-blue-500/35 text-blue-500"
                        : session.status === "absent"
                        ? "bg-red-500/20 border-red-500/40 text-red-500 font-black ring-1 ring-red-500/30"
                        : "bg-muted/40 border-border/70 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <span className="text-[9px] font-mono font-bold leading-none mb-0.5 opacity-80">
                      B{session.sessionNumber}
                    </span>
                    {getStatusIcon(session.status)}
                  </button>

                  {/* Chấm nhỏ nếu có ghi chú */}
                  {session.notes && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#7D39EB] ring-1 ring-background" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
