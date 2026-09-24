"use client";

import React, { useState, useEffect } from "react";
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
import {
  AttendanceRecord,
  AttendanceStatus,
  ATTENDANCE_STATUS_MAP,
} from "@/lib/types";
import { Calendar, Clock, MapPin, Check, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface AttendanceSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: AttendanceRecord | null;
  onSave: (recordId: string, status: AttendanceStatus, notes?: string, date?: string) => void;
}

export function AttendanceSessionModal({
  open,
  onOpenChange,
  session,
  onSave,
}: AttendanceSessionModalProps) {
  const [status, setStatus] = useState<AttendanceStatus>("upcoming");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    if (session) {
      setStatus(session.status);
      setNotes(session.notes || "");
      setDate(session.date || "");
    }
  }, [session]);

  if (!session) return null;

  const handleSave = () => {
    onSave(session.id, status, notes.trim() || undefined, date || undefined);
    onOpenChange(false);
  };

  const statuses: AttendanceStatus[] = ["present", "late", "excused", "absent", "upcoming"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-lg border-border shadow-2xl p-5">
        <DialogHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-black px-2 py-0.5 rounded-md bg-[#7D39EB]/15 text-[#7D39EB] border border-[#7D39EB]/30">
              {session.subjectCode}
            </span>
            <DialogTitle className="text-base font-bold text-foreground">
              Buổi học số {session.sessionNumber}
            </DialogTitle>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {session.subjectName}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Thông tin phòng & thời gian */}
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/50">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[#7D39EB]" />
              <span>
                {session.startTime || "--:--"} - {session.endTime || "--:--"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-[#C6FF33]" />
              <span className="truncate">{session.room || "Chưa rõ phòng"}</span>
            </div>
          </div>

          {/* Ngày học */}
          <div className="space-y-1.5">
            <Label htmlFor="session-date" className="text-xs font-bold text-foreground flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Ngày diễn ra
            </Label>
            <Input
              id="session-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 text-xs rounded-lg bg-card border-border/80"
            />
          </div>

          {/* Chọn trạng thái điểm danh */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              Trạng thái điểm danh
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {statuses.map((st) => {
                const meta = ATTENDANCE_STATUS_MAP[st];
                const isSelected = status === st;

                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg text-xs font-semibold border transition-all text-left",
                      isSelected
                        ? "border-current shadow-xs ring-1 ring-current"
                        : "border-border/60 bg-card hover:bg-muted/50 text-muted-foreground"
                    )}
                    style={{
                      color: isSelected ? meta.color : undefined,
                      backgroundColor: isSelected ? meta.bgColor : undefined,
                    }}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: meta.color }}
                    />
                    <span className="truncate">{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ghi chú buổi học */}
          <div className="space-y-1.5">
            <Label htmlFor="session-notes" className="text-xs font-bold text-foreground flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" /> Ghi chú buổi học
            </Label>
            <Input
              id="session-notes"
              placeholder="VD: Kiểm tra 15 phút, nghỉ có đơn xin phép, bài tập tuần..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-9 text-xs rounded-lg bg-card border-border/80"
            />
          </div>
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
            type="button"
            onClick={handleSave}
            className="text-xs h-8 bg-[#7D39EB] hover:bg-[#6D28D9] text-white font-bold"
          >
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
