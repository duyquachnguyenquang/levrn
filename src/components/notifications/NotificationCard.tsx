"use client";

import React from "react";
import Link from "next/link";
import {
  AppNotification,
  NotificationType,
  NotificationCategory,
} from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Clock,
  UserCheck,
  Info,
  CheckCircle2,
  Trash2,
  Check,
  ArrowUpRight,
  Bell,
  Users,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationCardProps {
  notification: AppNotification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export function NotificationCard({
  notification,
  onMarkAsRead,
  onDelete,
}: NotificationCardProps) {
  // Format relative time
  const getRelativeTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) return "Hôm qua";
    return `${diffDays} ngày trước`;
  };

  // Icon theo loại
  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "deadline":
        return <Clock className="h-4 w-4 text-red-500" />;
      case "attendance":
        return <UserCheck className="h-4 w-4 text-[#7D39EB]" />;
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  // Badge phân loại
  const getCategoryBadge = (cat: NotificationCategory) => {
    switch (cat) {
      case "attendance":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#7D39EB]/15 text-[#7D39EB] border border-[#7D39EB]/25">
            Điểm danh
          </span>
        );
      case "groups":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-500 border border-blue-500/25">
            Đồ án nhóm
          </span>
        );
      case "schedule":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C6FF33]/20 text-[#C6FF33] border border-[#C6FF33]/30">
            Lịch học
          </span>
        );
      case "grades":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/25">
            Điểm số GPA
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-500/15 text-zinc-400 border border-zinc-500/25">
            Hệ thống
          </span>
        );
    }
  };

  return (
    <Card
      className={cn(
        "border transition-all duration-200 rounded-lg shadow-xs hover:border-[#7D39EB]/40 group/notif",
        notification.read
          ? "bg-card/70 border-border/70"
          : "bg-card border-[#7D39EB]/35 ring-1 ring-[#7D39EB]/20 shadow-md"
      )}
    >
      <CardContent className="p-4 sm:p-4.5 flex items-start gap-3.5">
        {/* Cột icon */}
        <div
          className={cn(
            "h-9 w-9 rounded-lg border flex items-center justify-center shrink-0 mt-0.5",
            notification.type === "warning"
              ? "bg-amber-500/10 border-amber-500/25"
              : notification.type === "deadline"
              ? "bg-red-500/10 border-red-500/25"
              : notification.type === "attendance"
              ? "bg-[#7D39EB]/10 border-[#7D39EB]/25"
              : notification.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/25"
              : "bg-blue-500/10 border-blue-500/25"
          )}
        >
          {getIcon(notification.type)}
        </div>

        {/* Cột nội dung */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {getCategoryBadge(notification.category)}
              <span className="text-[11px] text-muted-foreground">
                {getRelativeTime(notification.createdAt)}
              </span>
            </div>

            {/* Chấm tròn chưa đọc */}
            {!notification.read && (
              <span className="h-2 w-2 rounded-full bg-[#C6FF33] ring-2 ring-background shrink-0 animate-pulse" />
            )}
          </div>

          <h4
            className={cn(
              "text-xs sm:text-sm mt-1.5 leading-snug tracking-tight",
              notification.read
                ? "font-semibold text-foreground/90"
                : "font-extrabold text-foreground"
            )}
          >
            {notification.title}
          </h4>

          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {notification.message}
          </p>

          {/* Nút điều hướng nhanh nếu có link */}
          <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-border/40">
            {notification.link ? (
              <Link
                href={notification.link}
                onClick={() => onMarkAsRead(notification.id)}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#7D39EB] hover:underline"
              >
                <span>Đi đến trang chi tiết</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <span />
            )}

            {/* Các thao tác: Đánh dấu đã đọc / Xoá */}
            <div className="flex items-center gap-1 shrink-0">
              {!notification.read && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onMarkAsRead(notification.id)}
                  className="h-7 text-[11px] text-muted-foreground hover:text-foreground px-2"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Đã đọc
                </Button>
              )}

              <Button
                size="icon"
                variant="ghost"
                onClick={() => onDelete(notification.id)}
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                title="Xoá thông báo"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
