"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
  Check,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  value?: string; // ISO string hoặc YYYY-MM-DDTHH:mm
  onChange: (val?: string) => void;
  placeholder?: string;
  className?: string;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Chọn ngày giờ hạn chót...",
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);

  // Phân tích giá trị hiện tại
  const parsed = useMemo(() => {
    if (!value) return null;
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return d;
  }, [value]);

  // Tháng và năm đang xem trong Calendar
  const [viewDate, setViewDate] = useState<Date>(() => parsed || new Date());
  const [selectedHour, setSelectedHour] = useState<string>(() => {
    return parsed ? String(parsed.getHours()).padStart(2, "0") : "23";
  });
  const [selectedMinute, setSelectedMinute] = useState<string>(() => {
    return parsed ? String(parsed.getMinutes()).padStart(2, "0") : "59";
  });

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth(); // 0..11

  // Tính các ngày trong tháng
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Thứ trong tuần của ngày 1 (JS: 0 là CN, 1 là T2, ...) -> đổi sang T2 = 0
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Các ngày của tháng trước
    for (let i = startDayOfWeek; i > 0; i--) {
      const d = new Date(currentYear, currentMonth, 1 - i);
      days.push({ date: d, isCurrentMonth: false });
    }

    // Các ngày trong tháng này
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const d = new Date(currentYear, currentMonth, i);
      days.push({ date: d, isCurrentMonth: true });
    }

    // Các ngày tháng sau cho tròn tuần
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(currentYear, currentMonth + 1, i);
      days.push({ date: d, isCurrentMonth: false });
    }

    return days;
  }, [currentYear, currentMonth]);

  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleSelectDay = (day: Date) => {
    const h = parseInt(selectedHour, 10) || 23;
    const m = parseInt(selectedMinute, 10) || 59;
    const combined = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m);
    onChange(combined.toISOString());
  };

  const handleQuickPresetTime = (h: string, m: string) => {
    setSelectedHour(h);
    setSelectedMinute(m);
    if (parsed) {
      const updated = new Date(
        parsed.getFullYear(),
        parsed.getMonth(),
        parsed.getDate(),
        parseInt(h, 10),
        parseInt(m, 10)
      );
      onChange(updated.toISOString());
    }
  };

  // Định dạng hiển thị
  const displayLabel = useMemo(() => {
    if (!parsed) return "";
    const day = String(parsed.getDate()).padStart(2, "0");
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const year = parsed.getFullYear();
    const hour = String(parsed.getHours()).padStart(2, "0");
    const min = String(parsed.getMinutes()).padStart(2, "0");
    return `${hour}:${min} • ${day}/${month}/${year}`;
  }, [parsed]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "relative flex items-center justify-between h-10 px-3 rounded-lg border border-input bg-background/80 text-xs sm:text-sm cursor-pointer transition-all hover:border-[#7D39EB]/60 focus-within:ring-1 focus-within:ring-[#7D39EB]",
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <CalendarIcon className="h-3.5 w-3.5 text-[#7D39EB] shrink-0" />
            {parsed ? (
              <span className="font-mono font-bold text-foreground truncate">
                {displayLabel}
              </span>
            ) : (
              <span className="text-muted-foreground truncate">{placeholder}</span>
            )}
          </div>

          {parsed && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(undefined);
              }}
              className="text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-72 p-3.5 rounded-xl border border-border/80 shadow-2xl bg-card text-foreground space-y-3 z-50 animate-in fade-in-50 zoom-in-95"
      >
        {/* Tháng & Năm */}
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <span className="text-xs font-black text-foreground">
            Tháng {currentMonth + 1}, {currentYear}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Thứ trong tuần */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted-foreground">
          {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((w, idx) => (
            <span key={idx}>{w}</span>
          ))}
        </div>

        {/* Lưới ngày */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {calendarDays.map((item, idx) => {
            const isSelected =
              parsed &&
              parsed.getDate() === item.date.getDate() &&
              parsed.getMonth() === item.date.getMonth() &&
              parsed.getFullYear() === item.date.getFullYear();

            const isToday =
              new Date().toDateString() === item.date.toDateString();

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectDay(item.date)}
                className={cn(
                  "h-7 w-7 rounded-md font-bold text-xs flex items-center justify-center transition-all cursor-pointer mx-auto",
                  !item.isCurrentMonth && "text-muted-foreground/40",
                  item.isCurrentMonth && !isSelected && "hover:bg-muted text-foreground",
                  isToday && !isSelected && "border border-[#7D39EB]/50 font-black",
                  isSelected && "bg-[#C6FF33] text-black font-black shadow-xs scale-105"
                )}
              >
                {item.date.getDate()}
              </button>
            );
          })}
        </div>

        {/* Bộ chọn Giờ : Phút */}
        <div className="pt-2 border-t border-border/60 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-[#7D39EB]" />
              Giờ hạn chót:
            </span>
            <div className="flex items-center gap-1 font-mono">
              <input
                type="number"
                min={0}
                max={23}
                value={selectedHour}
                onChange={(e) => {
                  const val = String(e.target.value).padStart(2, "0").slice(-2);
                  setSelectedHour(val);
                  if (parsed) {
                    const u = new Date(parsed);
                    u.setHours(parseInt(val, 10) || 0);
                    onChange(u.toISOString());
                  }
                }}
                className="w-8 h-6 text-center text-xs rounded bg-muted/80 border border-border/70 font-bold focus:outline-none focus:ring-1 focus:ring-[#7D39EB]"
              />
              <span>:</span>
              <input
                type="number"
                min={0}
                max={59}
                value={selectedMinute}
                onChange={(e) => {
                  const val = String(e.target.value).padStart(2, "0").slice(-2);
                  setSelectedMinute(val);
                  if (parsed) {
                    const u = new Date(parsed);
                    u.setMinutes(parseInt(val, 10) || 0);
                    onChange(u.toISOString());
                  }
                }}
                className="w-8 h-6 text-center text-xs rounded bg-muted/80 border border-border/70 font-bold focus:outline-none focus:ring-1 focus:ring-[#7D39EB]"
              />
            </div>
          </div>

          {/* Quick presets: 23:59, 17:00, 12:00 */}
          <div className="flex items-center gap-1.5 pt-1">
            {[
              { label: "23:59 (Cuối ngày)", h: "23", m: "59" },
              { label: "17:00 (Chiều)", h: "17", m: "00" },
              { label: "12:00 (Trưa)", h: "12", m: "00" },
            ].map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleQuickPresetTime(p.h, p.m)}
                className="px-2 py-0.5 rounded bg-muted/60 hover:bg-muted text-[10px] font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer border border-border/50"
              >
                {p.h}:{p.m}
              </button>
            ))}
          </div>

          {/* Nút Xong */}
          <div className="pt-1 flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                if (!parsed) {
                  // Gán ngày hiện tại với giờ đã chọn
                  const today = new Date();
                  const h = parseInt(selectedHour, 10) || 23;
                  const m = parseInt(selectedMinute, 10) || 59;
                  const combined = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m);
                  onChange(combined.toISOString());
                }
                setOpen(false);
              }}
              className="bg-[#C6FF33] hover:bg-[#B5F51B] text-black font-extrabold text-[11px] h-7 px-3 rounded-md"
            >
              <Check className="h-3 w-3 stroke-[3] mr-1" />
              Xong
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
