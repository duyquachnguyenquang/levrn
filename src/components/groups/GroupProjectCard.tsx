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
      <div className="group relative rounded-lg border border-border/75 dark:border-border/60 bg-card overflow-hidden shadow-xs hover:shadow-lg transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between h-full">
        {/* 1. Phần ảnh bìa (Visual Banner) đồng bộ kích thước chuẩn cố định h-44 */}
        <div className="relative h-44 w-full overflow-hidden bg-muted/40 shrink-0 select-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverUrl}
            alt={group.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />

          {/* Badge phân loại môn học nổi trên ảnh góc trái */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
            <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-white border border-white/20 shadow-xs">
              {group.subjectCode || "ĐỒ ÁN"}
            </span>
          </div>

          {/* Nút đổi nhanh ảnh bìa khi hover ảnh */}
          <button
            type="button"
            onClick={() => setShowCoverDialog(true)}
            className="absolute top-3 right-3 z-10 h-7 px-2.5 rounded-md bg-black/60 hover:bg-black/85 backdrop-blur-md text-white text-[11px] font-medium flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 border border-white/20 shadow-xs"
            title="Đổi ảnh bìa vĩnh viễn"
          >
            <ImageIcon className="h-3 w-3" />
            <span>Đổi ảnh</span>
          </button>

          {/* Gradient tối nhẹ ở đáy ảnh để nối mượt */}
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
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-lg p-1.5 shadow-xl">
                <DropdownMenuItem
                  onClick={() => onOpenDetail(group)}
                  className="text-xs cursor-pointer gap-2 rounded-md"
                >
                  <Users className="h-3.5 w-3.5 text-[#7D39EB]" />
                  <span>Xem chi tiết nhóm</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onEdit(group)}
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
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(group.id)}
                  className="text-xs cursor-pointer gap-2 rounded-md text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Xoá nhóm</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* 2. Thân nội dung Card (Body Content) - Thoáng đãng, có lề padding đầy đủ */}
        <div className="px-5 pt-3.5 pb-4 space-y-3 flex-1 flex flex-col justify-between bg-card">
          <div className="space-y-2">
            {/* Hàng meta: Deadline • Trạng thái (pr-9 để chừa khoảng cho notch) */}
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground/85 pr-9 flex-wrap">
              <span
                className={cn(
                  "font-semibold flex items-center gap-1",
                  isOverdue
                    ? "text-red-500 font-bold"
                    : isNearDeadline
                    ? "text-amber-500 font-bold"
                    : "text-muted-foreground"
                )}
              >
                {deadlineText}
              </span>
              <span className="text-muted-foreground/40">•</span>
              <span className="flex items-center gap-1.5 font-medium text-foreground/80">
                <span className={cn("h-1.5 w-1.5 rounded-full", statusInfo.dotClass)} />
                {statusInfo.label}
              </span>
            </div>

            {/* Tiêu đề nhóm đồ án với Marquee khi vượt quá 1 dòng */}
            <div
              onClick={() => onOpenDetail(group)}
              className="cursor-pointer pt-0.5"
              title={group.name}
            >
              <MarqueeText
                text={group.name}
                className="text-base font-bold text-foreground group-hover:text-[#7D39EB] transition-colors"
              />
            </div>

            {/* Đề tài / Mô tả (2 dòng gọn gàng, giảm rối mắt) */}
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed min-h-[2.4rem]">
              {group.topic || group.description || "Chưa có nội dung mô tả đề tài học phần."}
            </p>

            {/* Tags / Pills (Góc bo nhẹ 5-10% cứng cáp) */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {/* Pill Trọng số điểm & Nhập điểm nhanh */}
              {(group.gradeComponentName || group.gradeWeight !== undefined) && (
                <QuickScorePopover
                  group={group}
                  onUpdateScore={(score) => onUpdateGradeScore?.(group.id, score)}
                />
              )}

              {/* Pill Tiến độ task */}
              <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium bg-muted/60 text-muted-foreground border border-border/60">
                <CheckCircle2 className="h-3 w-3 text-[#7D39EB]" />
                {completedTasks}/{totalTasks} việc
              </span>

              {/* Pill Học kỳ */}
              {group.semester && (
                <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium bg-muted/60 text-muted-foreground border border-border/60">
                  {group.semester}
                </span>
              )}
            </div>
          </div>

          {/* Đường kẻ mờ phân tách */}
          <div className="border-t border-border/40 my-1" />

          {/* 4. Footer: Avatar Stack bên trái, App Icons bên phải */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            {/* Avatar Stack thành viên */}
            <div
              onClick={() => onOpenDetail(group)}
              className="flex items-center cursor-pointer group/avatars"
              title="Xem danh sách thành viên"
            >
              <div className="flex items-center -space-x-1.5 overflow-hidden py-0.5">
                {group.members.slice(0, 3).map((member, idx) => (
                  <div
                    key={member.id}
                    title={`${member.name} (${member.role === "leader" ? "Trưởng nhóm" : "Thành viên"})`}
                    className="relative h-6.5 w-6.5 rounded-full border-2 border-card flex items-center justify-center text-[9.5px] font-bold text-white shrink-0 shadow-2xs group-hover/avatars:scale-105 transition-transform"
                    style={{ backgroundColor: member.avatarColor || (idx === 0 ? "#7D39EB" : "#3B82F6") }}
                  >
                    {member.name.charAt(0).toUpperCase()}
                    {member.role === "leader" && (
                      <Crown className="absolute -top-1 -right-1 h-2.5 w-2.5 text-amber-400 fill-amber-400 drop-shadow-xs" />
                    )}
                  </div>
                ))}
              </div>
              {group.members.length > 3 && (
                <span className="text-[11px] font-bold text-muted-foreground ml-2">
                  +{group.members.length - 3}
                </span>
              )}
            </div>

            {/* Các nút App biểu tượng hình vuông bo góc nhẹ (cứng cáp) */}
            <div className="flex items-center gap-1.5">
              {group.driveUrl && (
                <a
                  href={group.driveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-7 w-7 rounded-md flex items-center justify-center bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/25 transition-all shadow-2xs hover:scale-105"
                  title="Mở Google Drive"
                >
                  <Folder className="h-3.5 w-3.5" />
                </a>
              )}

              {group.repoUrl && (
                <a
                  href={group.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-7 w-7 rounded-md flex items-center justify-center bg-[#7D39EB]/10 hover:bg-[#7D39EB]/20 text-[#7D39EB] border border-[#7D39EB]/25 transition-all shadow-2xs hover:scale-105"
                  title="Mở Repo / Figma / Tài liệu"
                >
                  <Globe className="h-3.5 w-3.5" />
                </a>
              )}

              {group.meetingUrl && (
                <a
                  href={group.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-7 w-7 rounded-md flex items-center justify-center bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border border-blue-500/25 transition-all shadow-2xs hover:scale-105"
                  title="Mở Google Meet"
                >
                  <Video className="h-3.5 w-3.5" />
                </a>
              )}

              {group.chatUrl && (
                <a
                  href={group.chatUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-7 w-7 rounded-md flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/25 transition-all shadow-2xs hover:scale-105"
                  title="Mở Nhóm Chat"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                </a>
              )}

              {/* Nút Chi tiết */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onOpenDetail(group)}
                className="h-7 px-2 rounded-md text-xs font-semibold text-[#7D39EB] hover:text-[#7D39EB] hover:bg-[#7D39EB]/10 ml-0.5"
              >
                <span>Chi tiết</span>
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
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
