"use client";

import React from "react";
import {
  GroupProject,
  GroupProjectStatus,
} from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface GroupProjectCardProps {
  group: GroupProject;
  onOpenDetail: (group: GroupProject) => void;
  onEdit: (group: GroupProject) => void;
  onDelete: (id: string) => void;
}

export function GroupProjectCard({
  group,
  onOpenDetail,
  onEdit,
  onDelete,
}: GroupProjectCardProps) {
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
      deadlineText = "Hôm nay là hạn chót!";
      isNearDeadline = true;
    } else if (diffDays <= 3) {
      deadlineText = `Còn ${diffDays} ngày nữa`;
      isNearDeadline = true;
    } else {
      deadlineText = `Còn ${diffDays} ngày`;
    }
  }

  // Trạng thái đồ án
  const statusMeta: Record<
    GroupProjectStatus,
    { label: string; badgeClass: string }
  > = {
    planning: {
      label: "Lên kế hoạch",
      badgeClass: "bg-blue-500/15 text-blue-500 border-blue-500/30",
    },
    in_progress: {
      label: "Đang thực hiện",
      badgeClass: "bg-[#7D39EB]/15 text-[#7D39EB] border-[#7D39EB]/30",
    },
    submitted: {
      label: "Đã nộp bài",
      badgeClass: "bg-amber-500/15 text-amber-500 border-amber-500/30",
    },
    completed: {
      label: "Hoàn thành",
      badgeClass: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
    },
  };

  const statusInfo = statusMeta[group.status] || statusMeta.in_progress;
  const leader = group.members.find((m) => m.role === "leader");

  return (
    <Card className="group relative overflow-hidden border border-border/80 bg-card hover:border-[#7D39EB]/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 rounded-lg flex flex-col justify-between">
      {/* Viền màu nhận diện Eduplex */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#7D39EB] via-[#9A5CF8] to-[#C6FF33]" />

      <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Header Card: Mã môn + Tên môn + Status + Menu */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
              <span className="font-mono font-black text-xs px-2 py-0.5 rounded-md bg-[#7D39EB]/15 text-[#7D39EB] border border-[#7D39EB]/30 shrink-0">
                {group.subjectCode}
              </span>
              <span className="text-[11px] text-muted-foreground truncate max-w-[140px]">
                {group.subjectName}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Badge
                variant="outline"
                className={cn("text-[10px] font-bold py-0.5 px-2 rounded-md", statusInfo.badgeClass)}
              >
                {statusInfo.label}
              </Badge>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 rounded-lg p-1.5 shadow-2xl">
                  <DropdownMenuItem
                    onClick={() => onOpenDetail(group)}
                    className="text-xs cursor-pointer gap-2"
                  >
                    <Users className="h-3.5 w-3.5 text-[#7D39EB]" />
                    <span>Xem chi tiết nhóm</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onEdit(group)}
                    className="text-xs cursor-pointer gap-2"
                  >
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Chỉnh sửa thông tin</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(group.id)}
                    className="text-xs cursor-pointer gap-2 text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Xoá nhóm</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Tên nhóm & Đề tài đồ án */}
          <h3
            onClick={() => onOpenDetail(group)}
            className="text-base font-extrabold text-foreground group-hover:text-[#7D39EB] transition-colors cursor-pointer tracking-tight"
          >
            {group.name}
          </h3>

          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
            <strong className="text-foreground/90 font-semibold">Nhiệm vụ:</strong> {group.topic}
          </p>

          {/* Deadline đếm ngược */}
          <div className="flex items-center gap-2 mt-3 text-xs">
            <Clock
              className={cn(
                "h-3.5 w-3.5 shrink-0",
                isOverdue
                  ? "text-red-500"
                  : isNearDeadline
                  ? "text-amber-500 animate-pulse"
                  : "text-muted-foreground"
              )}
            />
            <span
              className={cn(
                "text-[11px] font-semibold",
                isOverdue
                  ? "text-red-500 font-bold"
                  : isNearDeadline
                  ? "text-amber-500 font-bold"
                  : "text-muted-foreground"
              )}
            >
              Hạn nộp: {deadlineText}
            </span>
          </div>

          {/* Thanh tiến độ nhiệm vụ đồ án */}
          <div className="mt-3.5 bg-muted/40 p-2.5 rounded-lg border border-border/60">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                Tiến độ:{" "}
                <strong className="text-foreground font-bold font-mono">
                  {completedTasks}/{totalTasks} việc
                </strong>
              </span>
              <span className="font-mono font-black text-xs text-[#7D39EB]">
                {progressPercent}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-border/80 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#7D39EB] to-[#C6FF33] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Danh sách thành viên (Avatar Stack) */}
          <div className="flex items-center justify-between gap-2 mt-3.5 pt-2.5 border-t border-border/50">
            <div className="flex items-center -space-x-2 overflow-hidden py-0.5">
              {group.members.slice(0, 5).map((member) => (
                <div
                  key={member.id}
                  title={`${member.name} (${member.role === "leader" ? "Trưởng nhóm" : "Thành viên"})`}
                  className="relative h-7 w-7 rounded-full border-2 border-card flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-xs cursor-default"
                  style={{ backgroundColor: member.avatarColor || "#7D39EB" }}
                >
                  {member.name.charAt(0).toUpperCase()}
                  {member.role === "leader" && (
                    <Crown className="absolute -top-1 -right-1 h-3 w-3 text-amber-400 fill-amber-400 drop-shadow-xs" />
                  )}
                </div>
              ))}
              {group.members.length > 5 && (
                <div className="h-7 w-7 rounded-full border-2 border-card bg-muted text-[10px] font-bold text-muted-foreground flex items-center justify-center shrink-0">
                  +{group.members.length - 5}
                </div>
              )}
            </div>

            <span className="text-[11px] text-muted-foreground font-medium">
              {group.members.length} thành viên
            </span>
          </div>
        </div>

        {/* Chân card: Các nút link nhanh (Drive, Repo, Meeting, Chat) + Nút Chi tiết */}
        <div className="mt-3.5 pt-2.5 border-t border-border/50 flex items-center justify-between gap-1 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {group.driveUrl && (
              <a
                href={group.driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10.5px] font-bold bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/25 transition-all"
                title="Mở Google Drive đồ án"
              >
                <Folder className="h-3 w-3" />
                <span>Drive</span>
              </a>
            )}

            {group.repoUrl && (
              <a
                href={group.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10.5px] font-bold bg-[#7D39EB]/10 text-[#7D39EB] hover:bg-[#7D39EB]/20 border border-[#7D39EB]/25 transition-all"
                title="Mở Github / Tài liệu"
              >
                <Globe className="h-3 w-3" />
                <span>Repo</span>
              </a>
            )}

            {group.meetingUrl && (
              <a
                href={group.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10.5px] font-bold bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border border-blue-500/25 transition-all"
                title="Mở Google Meet nhóm"
              >
                <Video className="h-3 w-3" />
                <span>Meet</span>
              </a>
            )}

            {group.chatUrl && (
              <a
                href={group.chatUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10.5px] font-bold bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/25 transition-all"
                title="Mở Zalo / Nhóm chat"
              >
                <MessageCircle className="h-3 w-3" />
                <span>Chat</span>
              </a>
            )}
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onOpenDetail(group)}
            className="text-xs font-bold text-[#7D39EB] hover:text-[#7D39EB] hover:bg-[#7D39EB]/10 h-7 px-2 ml-auto"
          >
            <span>Chi tiết</span>
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
