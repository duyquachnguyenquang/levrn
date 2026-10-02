"use client";

import React from "react";
import {
  CalendarRange,
  ListTodo,
  Layers,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Search,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Subject,
  StudyPlanClassification,
  STUDY_CLASSIFICATIONS,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export type PlanViewMode = "timeline" | "list" | "strategy";
export type DateQuickPreset = "today" | "tomorrow" | "week" | "all";

interface PlanFiltersProps {
  viewMode: PlanViewMode;
  onViewModeChange: (mode: PlanViewMode) => void;
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  datePreset: DateQuickPreset;
  onDatePresetChange: (preset: DateQuickPreset) => void;
  selectedSubjectId: string | null;
  onSelectSubjectId: (id: string | null) => void;
  selectedClassification: StudyPlanClassification | "all";
  onSelectClassification: (cls: StudyPlanClassification | "all") => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  subjects: Subject[];
}

// Chuyển date string YYYY-MM-DD sang định dạng Thứ, DD/MM
function formatFriendlyDate(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const dateObj = new Date(y, m - 1, d);

  const daysOfWeek = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  const dayName = daysOfWeek[dateObj.getDay()];
  return `${dayName}, ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
}

export function PlanFilters({
  viewMode,
  onViewModeChange,
  selectedDate,
  onSelectDate,
  datePreset,
  onDatePresetChange,
  selectedSubjectId,
  onSelectSubjectId,
  selectedClassification,
  onSelectClassification,
  searchQuery,
  onSearchQueryChange,
  subjects,
}: PlanFiltersProps) {
  // Chuyển ngày trước / sau
  const handleShiftDate = (days: number) => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + days);
    const newY = dateObj.getFullYear();
    const newM = String(dateObj.getMonth() + 1).padStart(2, "0");
    const newD = String(dateObj.getDate()).padStart(2, "0");
    const newDateStr = `${newY}-${newM}-${newD}`;

    onSelectDate(newDateStr);
    onDatePresetChange("today"); // custom date
  };

  return (
    <div className="space-y-3.5 bg-card/60 p-3.5 sm:p-4 rounded-xl border border-border/70 backdrop-blur-xs">
      {/* Hàng 1: Switcher Chế độ xem + Bộ chọn ngày */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Tab chuyển đổi chế độ xem: Timeblock vs Danh sách vs Chiến lược môn (Ưu tiên icon trên mobile, căn trái, không rớt dòng) */}
        <div className="flex flex-row items-center justify-start gap-1 p-1 bg-muted/60 border border-border/60 rounded-lg overflow-x-auto no-scrollbar flex-nowrap shrink-0">
          <button
            onClick={() => onViewModeChange("timeline")}
            className={cn(
              "flex items-center gap-1.5 min-h-[40px] px-3.5 sm:px-3 sm:py-1.5 sm:min-h-0 rounded-md text-xs font-bold transition-all duration-150 cursor-pointer shrink-0",
              viewMode === "timeline"
                ? "bg-[#C6FF33] text-black shadow-xs font-black"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Khung giờ Timeblock"
            aria-label="Khung giờ Timeblock"
          >
            <CalendarRange className="h-4 w-4" />
            <span className="hidden sm:inline">Khung giờ Timeblock</span>
          </button>

          <button
            onClick={() => onViewModeChange("list")}
            className={cn(
              "flex items-center gap-1.5 min-h-[40px] px-3.5 sm:px-3 sm:py-1.5 sm:min-h-0 rounded-md text-xs font-bold transition-all duration-150 cursor-pointer shrink-0",
              viewMode === "list"
                ? "bg-[#C6FF33] text-black shadow-xs font-black"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Danh sách nhiệm vụ"
            aria-label="Danh sách nhiệm vụ"
          >
            <ListTodo className="h-4 w-4" />
            <span className="hidden sm:inline">Danh sách nhiệm vụ</span>
          </button>

          <button
            onClick={() => onViewModeChange("strategy")}
            className={cn(
              "flex items-center gap-1.5 min-h-[40px] px-3.5 sm:px-3 sm:py-1.5 sm:min-h-0 rounded-md text-xs font-bold transition-all duration-150 cursor-pointer shrink-0",
              viewMode === "strategy"
                ? "bg-[#C6FF33] text-black shadow-xs font-black"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Chiến lược môn học"
            aria-label="Chiến lược môn học"
          >
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline">Chiến lược môn học</span>
          </button>
        </div>

        {/* Thanh tìm kiếm nhanh */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Tìm nhiệm vụ, từ khoá..."
            className="min-h-[40px] h-10 sm:h-8 pl-8 pr-3 text-xs rounded-md bg-background/80 border-border/70 focus-visible:ring-[#7D39EB]"
          />
        </div>
      </div>

      {/* Hàng 2: Bộ lọc ngày (Cùng một hàng trên Mobile, không rớt dòng, căn hết về bên trái) */}
      <div className="flex flex-row items-center justify-start gap-2 pt-2 border-t border-border/50 overflow-x-auto no-scrollbar flex-nowrap">
        <div className="flex items-center gap-1.5 shrink-0 flex-nowrap">
          <Button
            size="sm"
            variant={datePreset === "today" ? "default" : "outline"}
            onClick={() => onDatePresetChange("today")}
            className={cn(
              "min-h-[40px] h-10 px-3.5 sm:min-h-0 sm:h-8 sm:px-2.5 text-xs rounded-md font-bold transition-all shrink-0",
              datePreset === "today"
                ? "bg-[#7D39EB] text-white hover:bg-[#6C2BD9]"
                : "border-border/70 text-muted-foreground hover:text-foreground"
            )}
          >
            Hôm nay
          </Button>

          <Button
            size="sm"
            variant={datePreset === "tomorrow" ? "default" : "outline"}
            onClick={() => onDatePresetChange("tomorrow")}
            className={cn(
              "min-h-[40px] h-10 px-3.5 sm:min-h-0 sm:h-8 sm:px-2.5 text-xs rounded-md font-bold transition-all shrink-0",
              datePreset === "tomorrow"
                ? "bg-[#7D39EB] text-white hover:bg-[#6C2BD9]"
                : "border-border/70 text-muted-foreground hover:text-foreground"
            )}
          >
            Ngày mai
          </Button>

          <Button
            size="sm"
            variant={datePreset === "week" ? "default" : "outline"}
            onClick={() => onDatePresetChange("week")}
            className={cn(
              "min-h-[40px] h-10 px-3.5 sm:min-h-0 sm:h-8 sm:px-2.5 text-xs rounded-md font-bold transition-all shrink-0",
              datePreset === "week"
                ? "bg-[#7D39EB] text-white hover:bg-[#6C2BD9]"
                : "border-border/70 text-muted-foreground hover:text-foreground"
            )}
          >
            Tuần này
          </Button>

          <Button
            size="sm"
            variant={datePreset === "all" ? "default" : "outline"}
            onClick={() => onDatePresetChange("all")}
            className={cn(
              "min-h-[40px] h-10 px-3.5 sm:min-h-0 sm:h-8 sm:px-2.5 text-xs rounded-md font-bold transition-all shrink-0",
              datePreset === "all"
                ? "bg-[#7D39EB] text-white hover:bg-[#6C2BD9]"
                : "border-border/70 text-muted-foreground hover:text-foreground"
            )}
          >
            Tất cả
          </Button>
        </div>

        {/* Bộ điều khiển ngày chi tiết: nằm ngay cạnh trên cùng 1 hàng */}
        <div className="flex items-center gap-1 shrink-0 bg-muted/40 px-2 py-0.5 rounded-md border border-border/50 min-h-[40px] h-10 sm:min-h-0 sm:h-8">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleShiftDate(-1)}
            className="h-8 w-8 min-h-[32px] min-w-[32px] rounded text-muted-foreground hover:text-foreground"
            title="Ngày trước"
            aria-label="Ngày trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1.5 px-2 text-xs font-bold text-foreground shrink-0">
            <CalendarIcon className="h-3.5 w-3.5 text-[#7D39EB]" />
            <span>{formatFriendlyDate(selectedDate)}</span>
          </div>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleShiftDate(1)}
            className="h-8 w-8 min-h-[32px] min-w-[32px] rounded text-muted-foreground hover:text-foreground"
            title="Ngày tiếp theo"
            aria-label="Ngày tiếp theo"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Hàng 3: Lọc theo Môn học & Phân loại chiến lược */}
      <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
        {/* Pills môn học */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-muted-foreground font-semibold flex items-center gap-1 shrink-0 mr-1 text-[11px]">
            <Filter className="h-3 w-3" />
            Môn học:
          </span>

          <button
            onClick={() => onSelectSubjectId(null)}
            className={cn(
              "px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer whitespace-nowrap text-[11px]",
              selectedSubjectId === null
                ? "bg-foreground text-background font-black"
                : "bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            Tất cả ({subjects.length})
          </button>

          {subjects.map((sub) => {
            const isSelected = selectedSubjectId === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => onSelectSubjectId(isSelected ? null : sub.id)}
                className={cn(
                  "px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer whitespace-nowrap text-[11px] flex items-center gap-1.5 border",
                  isSelected
                    ? "font-black shadow-xs"
                    : "bg-muted/50 border-border/60 text-muted-foreground hover:text-foreground"
                )}
                style={
                  isSelected
                    ? {
                        backgroundColor: `${sub.color}25`,
                        borderColor: sub.color,
                        color: sub.color,
                      }
                    : {}
                }
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: sub.color }}
                />
                <span>{sub.code}</span>
              </button>
            );
          })}
        </div>

        {/* Pills Phân loại chiến lược học tập (Lý thuyết, Trắc nghiệm, Flashcard, Thực hành, etc.) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs no-scrollbar">
          <span className="text-muted-foreground font-semibold shrink-0 mr-1 text-[11px]">
            Chiến lược:
          </span>

          <button
            onClick={() => onSelectClassification("all")}
            className={cn(
              "px-2.5 py-0.5 rounded-md font-bold transition-all cursor-pointer whitespace-nowrap text-[11px]",
              selectedClassification === "all"
                ? "bg-foreground text-background font-black"
                : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            Tất cả
          </button>

          {(Object.keys(STUDY_CLASSIFICATIONS) as StudyPlanClassification[]).map((key) => {
            const meta = STUDY_CLASSIFICATIONS[key];
            const isSelected = selectedClassification === key;

            return (
              <button
                key={key}
                onClick={() => onSelectClassification(isSelected ? "all" : key)}
                className={cn(
                  "px-2.5 py-0.5 rounded-md font-bold transition-all cursor-pointer whitespace-nowrap text-[11px] border",
                  isSelected
                    ? "font-black shadow-xs"
                    : "bg-muted/40 border-border/50 text-muted-foreground hover:text-foreground"
                )}
                style={
                  isSelected
                    ? {
                        backgroundColor: meta.bgColor,
                        borderColor: meta.borderColor,
                        color: meta.color,
                      }
                    : {}
                }
              >
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
