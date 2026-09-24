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
  GroupMember,
  GroupTaskPriority,
  GroupTaskStatus,
} from "@/lib/types";
import { Calendar, User, Flag, CheckCircle2 } from "lucide-react";

interface GroupTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  members: GroupMember[];
  onAddTask: (
    groupId: string,
    taskData: {
      title: string;
      description?: string;
      assigneeMemberId?: string;
      status: GroupTaskStatus;
      priority: GroupTaskPriority;
      dueDate?: string;
    }
  ) => void;
}

export function GroupTaskModal({
  open,
  onOpenChange,
  groupId,
  members,
  onAddTask,
}: GroupTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [priority, setPriority] = useState<GroupTaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddTask(groupId, {
      title: title.trim(),
      description: description.trim() || undefined,
      assigneeMemberId: assigneeId || undefined,
      status: "todo",
      priority,
      dueDate: dueDate || undefined,
    });

    setTitle("");
    setDescription("");
    setAssigneeId("");
    setPriority("medium");
    setDueDate("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-lg border-border shadow-2xl p-5">
        <DialogHeader className="pb-3 border-b border-border/60">
          <DialogTitle className="text-base font-bold text-foreground">
            Giao nhiệm vụ mới cho nhóm
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Phân công công việc cho từng thành viên kèm hạn chót.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Tiêu đề nhiệm vụ */}
          <div className="space-y-1.5">
            <Label htmlFor="task-title" className="text-xs font-bold text-foreground">
              Tiêu đề nhiệm vụ <span className="text-destructive">*</span>
            </Label>
            <Input
              id="task-title"
              placeholder="VD: Viết chương 2 báo cáo lý thuyết..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="h-9 text-xs rounded-lg bg-card border-border/80"
            />
          </div>

          {/* Phân công thành viên */}
          <div className="space-y-1.5">
            <Label htmlFor="task-assignee" className="text-xs font-bold text-foreground flex items-center gap-1">
              <User className="h-3.5 w-3.5" /> Người phụ trách
            </Label>
            <select
              id="task-assignee"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full h-9 text-xs px-3 rounded-lg bg-card border border-border/80 text-foreground focus:outline-none focus:ring-1 focus:ring-[#7D39EB]"
            >
              <option value="">-- Chưa phân công --</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role === "leader" ? "Trưởng nhóm" : "Thành viên"})
                </option>
              ))}
            </select>
          </div>

          {/* Mức độ ưu tiên & Hạn chót */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1">
                <Flag className="h-3.5 w-3.5" /> Mức ưu tiên
              </Label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as GroupTaskPriority)}
                className="w-full h-9 text-xs px-3 rounded-lg bg-card border border-border/80 text-foreground focus:outline-none focus:ring-1 focus:ring-[#7D39EB]"
              >
                <option value="low">Thấp</option>
                <option value="medium">Bình thường</option>
                <option value="high">Quan trọng</option>
                <option value="urgent">Khẩn cấp</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-duedate" className="text-xs font-bold text-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Hạn chót
              </Label>
              <Input
                id="task-duedate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-9 text-xs rounded-lg bg-card border-border/80"
              />
            </div>
          </div>

          {/* Mô tả chi tiết */}
          <div className="space-y-1.5">
            <Label htmlFor="task-desc" className="text-xs font-bold text-foreground">
              Mô tả chi tiết / Ghi chú
            </Label>
            <Textarea
              id="task-desc"
              placeholder="Yêu cầu cụ thể, link tài liệu tham khảo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="text-xs rounded-lg bg-card border-border/80 resize-none"
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
              disabled={!title.trim()}
              className="text-xs h-8 bg-[#7D39EB] hover:bg-[#6D28D9] text-white font-bold"
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              Tạo nhiệm vụ
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
