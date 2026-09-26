"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  id?: string;
  value?: string; // Formats: "YYYY-MM-DDTHH:mm", "YYYY-MM-DD", or ISO string
  onChange: (val: string) => void;
  placeholder?: string;
  includeTime?: boolean;
  className?: string;
  disabled?: boolean;
}

export function DateTimePicker({
  id,
  value,
  onChange,
  placeholder = "Chọn hạn chót...",
  includeTime = true,
  className,
  disabled = false,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);

  // Parse existing date or default to current
  const parsedDate = useMemo(() => {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }, [value]);

  const [viewYear, setViewYear] = useState(() => parsedDate ? parsedDate.getFullYear() : new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => parsedDate ? parsedDate.getMonth() : new Date().getMonth());

  // Time state: "HH:mm"
  const [timeStr, setTimeStr] = useState(() => {
    if (parsedDate) {
      const h = String(parsedDate.getHours()).padStart(2, "0");
      const m = String(parsedDate.getMinutes()).padStart(2, "0");
      return `${h}:${m}`;
    }
    return "23:59"; // Default deadline to end of day
  });

  // Sync state when incoming value changes
  useEffect(() => {
    if (parsedDate) {
      setViewYear(parsedDate.getFullYear());
      setViewMonth(parsedDate.getMonth());
      const h = String(parsedDate.getHours()).padStart(2, "0");
      const m = String(parsedDate.getMinutes()).padStart(2, "0");
      setTimeStr(`${h}:${m}`);
    }
  }, [parsedDate]);

  // Handle month navigation
  const handlePrevMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Helper to format string for output
  const assembleDateTime = (y: number, m: number, d: number, time: string) => {
    const monthFormatted = String(m + 1).padStart(2, "0");
    const dayFormatted = String(d).padStart(2, "0");
    const datePart = `${y}-${monthFormatted}-${dayFormatted}`;
    if (!includeTime) {
      return datePart;
    }
    const safeTime = time && time.includes(":") ? time : "23:59";
    return `${datePart}T${safeTime}`;
  };

  // When a day is clicked in the calendar
  const handleSelectDay = (day: number) => {
    const val = assembleDateTime(viewYear, viewMonth, day, timeStr);
    onChange(val);
  };

  // When time changes
  const handleTimeChange = (newTime: string) => {
    setTimeStr(newTime);
    if (parsedDate) {
      const val = assembleDateTime(
        parsedDate.getFullYear(),
        parsedDate.getMonth(),
        parsedDate.getDate(),
        newTime
      );
      onChange(val);
    }
  };


  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange("");
  };

  // Calendar calculations
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Monday as 0

  const monthNames = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];
  const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  const today = new Date();
  const isCurrentMonthToday = today.getFullYear() === viewYear && today.getMonth() === viewMonth;
  const todayDate = today.getDate();

  const isSelectedMonth = parsedDate && parsedDate.getFullYear() === viewYear && parsedDate.getMonth() === viewMonth;
  const selectedDay = isSelectedMonth ? parsedDate.getDate() : null;

  // Format trigger display text
  const displayText = useMemo(() => {
    if (!parsedDate) return null;
    const d = String(parsedDate.getDate()).padStart(2, "0");
    const m = String(parsedDate.getMonth() + 1).padStart(2, "0");
    const y = parsedDate.getFullYear();
    const dateFormatted = `${d}/${m}/${y}`;

    if (!includeTime) return dateFormatted;

    const hh = String(parsedDate.getHours()).padStart(2, "0");
    const mm = String(parsedDate.getMinutes()).padStart(2, "0");
    return `${dateFormatted} ${hh}:${mm}`;
  }, [parsedDate, includeTime]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-lg border border-border/80 bg-card px-3 text-xs text-left transition-all duration-200 hover:border-[#7D39EB]/60 focus:outline-none focus:ring-1 focus:ring-[#7D39EB] disabled:opacity-50 disabled:pointer-events-none group",
            className
          )}
        >
          <div className="flex items-center gap-2 truncate min-w-0">
            <CalendarIcon className="h-3.5 w-3.5 text-[#7D39EB] shrink-0 transition-transform group-hover:scale-110" />
            <span
              className={cn(
                "truncate font-medium",
                displayText ? "text-foreground font-semibold" : "text-muted-foreground"
              )}
            >
              {displayText || placeholder}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-1">
            {displayText ? (
              <span
                role="button"
                onClick={handleClear}
                className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-colors cursor-pointer"
                title="Xóa hạn chót"
              >
                <X className="h-3 w-3" />
              </span>
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground opacity-60" />
            )}
          </div>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[280px] p-3 rounded-lg border border-border/80 shadow-2xl bg-card text-foreground z-50 animate-in fade-in-50 zoom-in-95 duration-150"
      >
        {/* Điều hướng Tháng / Năm */}
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all active:scale-95"
            aria-label="Tháng trước"
            title="Tháng trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-black tracking-tight text-foreground flex items-center gap-1">
            <span className="text-[#7D39EB]">{monthNames[viewMonth]}</span>
            <span>năm {viewYear}</span>
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all active:scale-95"
            aria-label="Tháng sau"
            title="Tháng sau"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Thứ trong tuần */}
        <div className="grid grid-cols-7 gap-1 text-center py-1 text-[10px] font-bold text-muted-foreground">
          {dayNames.map((d, idx) => (
            <div key={d} className={idx >= 5 ? "text-amber-500/80" : ""}>
              {d}
            </div>
          ))}
        </div>

        {/* Lưới ngày trong tháng */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="h-7 w-7" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const isSelected = selectedDay === day;
            const isToday = isCurrentMonthToday && todayDate === day;

            return (
              <button
                key={day}
                type="button"
                onClick={() => handleSelectDay(day)}
                className={cn(
                  "relative h-7 w-7 rounded-md font-semibold flex items-center justify-center transition-all duration-150 cursor-pointer text-xs",
                  isSelected
                    ? "bg-[#7D39EB] text-white font-black shadow-md shadow-[#7D39EB]/30 scale-105"
                    : isToday
                    ? "bg-muted/90 text-foreground font-black border border-[#C6FF33] hover:bg-[#7D39EB]/15"
                    : "hover:bg-muted text-foreground/90 hover:text-foreground"
                )}
              >
                <span>{day}</span>
                {isToday && !isSelected && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-[#C6FF33]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Khung chọn Giờ & Phút (Time Selection) */}
        {includeTime && (
          <div className="mt-3 pt-2.5 border-t border-border/60">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3 text-[#7D39EB]" />
                <span>Giờ nộp bài:</span>
              </span>
              <div className="flex items-center gap-1 font-mono">
                <input
                  type="time"
                  value={timeStr}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="h-6 px-1.5 rounded-md bg-muted/60 border border-border/80 text-[11px] font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-[#7D39EB]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer hoàn tất */}
        <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-border/60">
          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] font-semibold text-muted-foreground hover:text-destructive px-2 py-1 rounded transition-colors"
          >
            Xóa hạn
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-[11px] font-bold bg-[#C6FF33] hover:bg-[#b0f01a] text-black px-3 py-1 rounded-md transition-all active:scale-95 shadow-xs"
          >
            Xong
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
