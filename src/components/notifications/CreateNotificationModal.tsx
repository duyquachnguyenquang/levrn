"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  NotificationCategory,
  NotificationType,
  AppNotificationFormData,
} from "@/lib/types";
import { Bell, Tag, Flag, FileText, Link2 } from "lucide-react";

interface CreateNotificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddNotification: (data: AppNotificationFormData) => void;
}

export function CreateNotificationModal({
  open,
  onOpenChange,
  onAddNotification,
}: CreateNotificationModalProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NotificationType>("info");
  const [category, setCategory] = useState<NotificationCategory>("system");
  const [link, setLink] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    onAddNotification({
      title: title.trim(),
      message: message.trim(),
      type,
      category,
      link: link.trim() || undefined,
    });

    setTitle("");
    setMessage("");
    setType("info");
    setCategory("system");
    setLink("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-lg border-border shadow-2xl p-5">
        <DialogHeader className="pb-3 border-b border-border/60">
          <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <Bell className="h-4 w-4 text-[#7D39EB]" />
            Tạo lời nhắc / Thông báo mới
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Tiêu đề thông báo */}
          <div className="space-y-1.5">
            <Label htmlFor="notif-title" className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Bell className="h-3.5 w-3.5 text-[#7D39EB]" />
              <span>Tiêu đề thông báo</span>
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="notif-title"
              placeholder="VD: Nhắc nộp slide thuyết trình nhóm..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="h-9 text-xs rounded-lg bg-card"
            />
          </div>

          {/* Phân loại & Mức độ */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-[#7D39EB]" />
                <span>Phân loại</span>
              </Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as NotificationCategory)}
                className="w-full h-9 text-xs px-3 rounded-lg bg-card border border-border/80 text-foreground focus:outline-none focus:ring-1 focus:ring-[#7D39EB]"
              >
                <option value="system">Hệ thống</option>
                <option value="attendance">Điểm danh</option>
                <option value="groups">Đồ án nhóm</option>
                <option value="schedule">Lịch học</option>
                <option value="grades">Điểm số GPA</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Flag className="h-3.5 w-3.5 text-[#7D39EB]" />
                <span>Mức độ</span>
              </Label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as NotificationType)}
                className="w-full h-9 text-xs px-3 rounded-lg bg-card border border-border/80 text-foreground focus:outline-none focus:ring-1 focus:ring-[#7D39EB]"
              >
                <option value="info">Thông tin (Info)</option>
                <option value="warning">Cảnh báo (Warning)</option>
                <option value="deadline">Hạn chót (Deadline)</option>
                <option value="success">Thành công (Success)</option>
              </select>
            </div>
          </div>

          {/* Nội dung chi tiết */}
          <div className="space-y-1.5">
            <Label htmlFor="notif-msg" className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-[#7D39EB]" />
              <span>Nội dung thông báo</span>
              <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="notif-msg"
              placeholder="Chi tiết nội dung cần nhắc nhở..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={3}
              className="text-xs rounded-lg bg-card resize-none"
            />
          </div>

          {/* Đường dẫn liên kết tuỳ chọn */}
          <div className="space-y-1.5">
            <Label htmlFor="notif-link" className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5 text-[#7D39EB]" />
              <span>Đường dẫn liên kết (tuỳ chọn)</span>
            </Label>
            <Input
              id="notif-link"
              placeholder="VD: /groups hoặc /attendance"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="h-9 text-xs rounded-lg bg-card"
            />
          </div>

          <DialogFooter className="pt-2 border-t border-border/60 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-xs h-8"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || !message.trim()}
              className="text-xs h-8 bg-[#7D39EB] hover:bg-[#6D28D9] text-white font-bold"
            >
              Tạo thông báo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
