"use client";

import React from "react";
import { Calendar, CheckCircle2, Clock, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AttendanceRecord, AttendanceStatus } from "@/lib/types";

interface QuickCheckinBannerProps {
  todaySessions: AttendanceRecord[];
  onMarkPresent: (recordId: string) => void;
  onMarkTodayAllPresent: () => void;
}

export function QuickCheckinBanner({
  todaySessions,
  onMarkPresent,
  onMarkTodayAllPresent,
}: QuickCheckinBannerProps) {
  if (todaySessions.length === 0) return null;

  const unrecordedToday = todaySessions.filter(
    (s) => s.status === "upcoming"
  );

  return (
    <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-[#7D39EB]/15 via-background to-[#C6FF33]/15 border border-[#7D39EB]/30 p-4 sm:p-4.5 mb-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-[#7D39EB]/20 border border-[#7D39EB]/40 flex items-center justify-center text-[#7D39EB] shrink-0 mt-0.5">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">
                Lịch học hôm nay ({todaySessions.length} ca)
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C6FF33]/20 text-[#C6FF33] border border-[#C6FF33]/40">
                Hôm nay
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {unrecordedToday.length > 0
                ? `Bạn còn ${unrecordedToday.length} ca học chưa điểm danh hôm nay.`
                : "Tất cả các ca học hôm nay đã được ghi nhận đầy đủ!"}
            </p>
          </div>
        </div>

        {/* Nút điểm danh nhanh */}
        {unrecordedToday.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={onMarkTodayAllPresent}
              className="h-8 text-xs font-bold bg-[#C6FF33] text-black hover:bg-[#b2e82e] shadow-xs transition-all active:scale-95"
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              Điểm danh có mặt tất cả
            </Button>
          </div>
        )}
      </div>

      {/* Danh sách các ca học hôm nay */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/50">
        {todaySessions.map((session) => (
          <div
            key={session.id}
            className="flex items-center justify-between p-2 rounded-md bg-card/80 border border-border/60 text-xs"
          >
            <div className="min-w-0 pr-2">
              <p className="font-bold text-foreground truncate">
                {session.subjectCode} - {session.subjectName}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-[#7D39EB]" />
                  {session.startTime || "--:--"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-[#C6FF33]" />
                  {session.room || "P.Học"}
                </span>
              </div>
            </div>

            {session.status === "upcoming" ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onMarkPresent(session.id)}
                className="h-7 text-[11px] font-bold border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10 shrink-0"
              >
                Có mặt
              </Button>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 shrink-0">
                Đã ghi nhận
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
