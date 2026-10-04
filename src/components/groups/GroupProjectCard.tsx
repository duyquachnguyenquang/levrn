"use client";

import React, { useState } from "react";
import {
  GroupProject,
  GroupProjectStatus,
} from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Calendar,
  CheckCircle2,
  Folder,
  Globe,
  Video,
  MessageCircle,
  Clock,
  MoreVertical,
  Pencil,
  Trash2,
  ArrowRight,
  Crown,
  Award,
  Image as ImageIcon,
  ExternalLink,
  Eye,
  BookOpen,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getGroupCoverImage } from "@/lib/imagePresets";
import { ChangeCoverDialog } from "@/components/ui/change-cover-dialog";
import { MarqueeText } from "@/components/ui/marquee-text";

interface GroupProjectCardProps {
  group: GroupProject;
  onOpenDetail: (group: GroupProject) => void;
  onEdit: (group: GroupProject) => void;
  onDelete: (id: string) => void;
  onUpdateGradeScore?: (groupId: string, score: number | null) => void;
  onUpdateGroup?: (groupId: string, updates: Partial<GroupProject>) => void;
}

export function GroupProjectCard({
  group,
  onOpenDetail,
  onEdit,
  onDelete,
  onUpdateGradeScore,
  onUpdateGroup,
}: GroupProjectCardProps) {
  const [showCoverDialog, setShowCoverDialog] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Tính toán tiến độ dựa trên số lượng tasks
  const totalTasks = group.tasks.length;
  const completedTasks = group.tasks.filter((t) => t.status === "done").length;
  const progressPercent =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Tính số ngày còn lại đến deadline
  let deadlineText = "Chưa có hạn";
  let isOverdue = false;
  let isNearDeadline = false;

  if (group.deadline) {
    const diffMs = new Date(group.deadline).getTime() - Date.now();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      deadlineText = `Quá hạn ${Math.abs(diffDays)} ngày`;
      isOverdue = true;
    } else if (diffDays === 0) {
      deadlineText = "Hạn chót hôm nay";
      isNearDeadline = true;
    } else if (diffDays <= 3) {
      deadlineText = `Còn ${diffDays} ngày`;
      isNearDeadline = true;
    } else {
      deadlineText = `Còn ${diffDays} ngày`;
    }
  }

  // Trạng thái đồ án
  const statusMeta: Record<
    GroupProjectStatus,
    { label: string; dotClass: string; badgeClass: string }
  > = {
    planning: {
      label: "Lên kế hoạch",
      dotClass: "bg-blue-500",
      badgeClass: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    },
    in_progress: {
      label: "Đang thực hiện",
      dotClass: "bg-[#7D39EB]",
      badgeClass: "bg-[#7D39EB]/10 text-[#7D39EB] border-[#7D39EB]/20",
    },
    submitted: {
      label: "Đã nộp bài",
      dotClass: "bg-amber-500",
      badgeClass: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    },
    completed: {
      label: "Hoàn thành",
      dotClass: "bg-emerald-500",
      badgeClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    },
  };

  const statusInfo = statusMeta[group.status] || statusMeta.in_progress;
  const coverUrl = !imageError ? getGroupCoverImage(group) : getGroupCoverImage();

  return (
    <>
      <div
        onClick={() => onOpenDetail(group)}
        className="group relative rounded-lg border border-border/75 dark:border-border/60 bg-card overflow-hidden shadow-xs hover:shadow-lg transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between h-full cursor-pointer"
      >
        {/* 1. Phần ảnh bìa (Visual Banner) - Chiều cao co giãn h-20 trên mobile, h-28 trên desktop */}
        <div className="relative h-20 sm:h-28 w-full overflow-hidden bg-muted/40 shrink-0 select-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverUrl}
            alt={group.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />

          {/* Badge mã môn học nổi trên ảnh góc trái */}
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5">
            <span className="font-mono font-bold text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-white border border-white/20 shadow-xs">
              {group.subjectCode || "ĐỒ ÁN"}
            </span>
          </div>

          {/* Gradient tối nhẹ ở đáy ảnh để nối mượt */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* 2. Thân nội dung Card (Body Content) - Tầng 1: Tên, Thời gian, Môn học/Địa điểm */}
        <div className="p-2.5 sm:p-3 space-y-2 flex-1 flex flex-col justify-between bg-card overflow-hidden">
          <div className="space-y-1.5">
            {/* Tiêu đề nhóm đồ án với Marquee khi vượt quá 1 dòng */}
            <div
              className="pt-0.5 min-w-0"
              title={group.name}
            >
              <MarqueeText
                text={group.name}
                className="text-sm sm:text-base font-black tracking-tight text-foreground group-hover:text-[#7D39EB] transition-colors leading-tight"
              />
            </div>

            {/* Thông tin cốt lõi 1: Thời gian hạn chót (Deadline) */}
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground min-w-0">
              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span
                className={cn(
                  "truncate font-medium",
                  isOverdue
                    ? "text-red-500 font-bold"
                    : isNearDeadline
                    ? "text-amber-500 font-bold"
                    : "text-muted-foreground"
                )}
              >
                {deadlineText}
              </span>
            </div>

            {/* Thông tin cốt lõi 2: Tên môn học / Địa điểm */}
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground min-w-0">
              <BookOpen className="w-3.5 h-3.5 text-[#7D39EB] shrink-0" />
              <span className="truncate font-medium">
                {group.subjectName || group.subjectCode || "Đồ án học phần"}
              </span>
            </div>
          </div>

          {/* Đường kẻ mờ phân tách */}
          <div className="border-t border-border/40 my-0.5" />

          {/* 3. Footer: Thông tin thành viên & Cụm nút điều hướng góc phải (Chuẩn Rule 1.8 & 1.15) */}
          <div className="w-full pt-0.5 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1 font-semibold text-[11px]">
              <Users className="w-3 h-3 text-[#7D39EB]" />
              <span>{group.members.length} tv</span>
              {totalTasks > 0 && (
                <span className="text-[10px] text-muted-foreground/80 font-mono ml-1">
                  • {completedTasks}/{totalTasks} việc
                </span>
              )}
            </div>

            <div className="ml-auto flex items-center gap-1">
              {group.driveUrl && (
                <a
                  href={group.driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="h-7 w-7 rounded-md border border-border/70 hover:bg-amber-500/10 hover:border-amber-500/30 flex items-center justify-center text-amber-500 transition-all"
                  title="Mở Google Drive đồ án"
                  aria-label="Mở Google Drive đồ án"
                >
                  <Folder className="w-3.5 h-3.5" />
                </a>
              )}
              {group.chatUrl && (
                <a
                  href={group.chatUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="h-7 w-7 rounded-md border border-border/70 hover:bg-emerald-500/10 hover:border-emerald-500/30 flex items-center justify-center text-emerald-500 transition-all"
                  title="Mở Zalo / Discord nhóm"
                  aria-label="Mở Zalo / Discord nhóm"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal thay đổi link ảnh bìa vĩnh viễn */}
      <ChangeCoverDialog
        open={showCoverDialog}
        onOpenChange={setShowCoverDialog}
        currentUrl={group.imageUrl || ""}
        title="Đổi ảnh bìa đồ án"
        subtitle={`Dán link ảnh vĩnh viễn cho đồ án "${group.name}" để giao diện sinh động và ngăn nắp.`}
        onSave={(newUrl) => {
          onUpdateGroup?.(group.id, { imageUrl: newUrl });
        }}
      />
    </>
  );
}

/**
 * Component Popover nhập điểm số nhanh trực tiếp trên Card
 */
function QuickScorePopover({
  group,
  onUpdateScore,
}: {
  group: GroupProject;
  onUpdateScore: (score: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(
    group.gradeScore !== null && group.gradeScore !== undefined
      ? String(group.gradeScore)
      : ""
  );

  const hasScore =
    group.gradeScore !== null && group.gradeScore !== undefined;

  const handleSave = () => {
    const val = inputValue.trim();
    if (!val) {
      onUpdateScore(null);
    } else {
      const num = parseFloat(val);
      if (!isNaN(num) && num >= 0 && num <= 10) {
        onUpdateScore(Math.round(num * 10) / 10);
      }
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold bg-[#7D39EB]/10 text-[#7D39EB] hover:bg-[#7D39EB]/20 border border-[#7D39EB]/25 transition-all shadow-2xs cursor-pointer"
          title="Bấm để cập nhật điểm đồ án trực tiếp vào Bảng điểm"
        >
          <Award className="h-3 w-3 shrink-0" />
          <span>
            {group.gradeComponentName || "Đồ án"}: {group.gradeWeight || 0}%
          </span>
          <span className="font-bold border-l border-[#7D39EB]/30 pl-1 ml-0.5">
            {hasScore ? `${group.gradeScore}đ` : "Chưa chấm"}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-64 p-3 rounded-lg shadow-xl border border-border bg-card space-y-2.5 z-50"
      >
        <div className="space-y-0.5">
          <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5 text-[#7D39EB]" />
            <span>Nhập điểm đồ án học phần</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-tight">
            Điểm sẽ được đồng bộ 2 chiều tức thì với cột{" "}
            <strong className="text-foreground">
              {group.gradeComponentName || "Đồ án"} ({group.gradeWeight}%)
            </strong>{" "}
            trong trang Quản lý điểm số.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            min={0}
            max={10}
            step={0.1}
            placeholder="0.0 - 10"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
            className="h-8 text-xs font-mono font-bold rounded-md"
            autoFocus
          />
          <Button
            size="sm"
            onClick={handleSave}
            className="h-8 px-3 text-xs font-bold bg-[#7D39EB] hover:bg-[#6828d4] text-white rounded-md shrink-0"
          >
            Lưu
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
