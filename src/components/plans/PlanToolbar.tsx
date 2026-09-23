"use client";

import React, { useState } from "react";
import {
  Search,
  Filter,
  X,
  Columns3,
  LayoutGrid,
  List,
  Clock,
  RotateCcw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Subject,
  StudyPlanClassification,
  StudyPriority,
  STUDY_CLASSIFICATIONS,
  STUDY_PRIORITIES,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export type PlanDisplayMode = "kanban" | "grid" | "list" | "timeline";

interface PlanToolbarProps {
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  displayMode: PlanDisplayMode;
  onDisplayModeChange: (mode: PlanDisplayMode) => void;
  selectedSubjectId: string; // "ALL" | id
  onSelectSubjectId: (id: string) => void;
  selectedClassification: string; // "ALL" | classification
  onSelectClassification: (cls: string) => void;
  selectedTimeFilter: string; // "ALL" | "today" | "tomorrow" | "week"
  onSelectTimeFilter: (time: string) => void;
  selectedPriority: string; // "ALL" | priority
  onSelectPriority: (p: string) => void;
  onResetFilters: () => void;
  subjects: Subject[];
}

export function PlanToolbar({
  searchQuery,
  onSearchQueryChange,
  displayMode,
  onDisplayModeChange,
  selectedSubjectId,
  onSelectSubjectId,
  selectedClassification,
  onSelectClassification,
  selectedTimeFilter,
  onSelectTimeFilter,
  selectedPriority,
  onSelectPriority,
  onResetFilters,
  subjects,
}: PlanToolbarProps) {
  const [filterOpen, setFilterOpen] = useState(false);

  const isFilterActive =
    selectedSubjectId !== "ALL" ||
    selectedClassification !== "ALL" ||
    selectedTimeFilter !== "ALL" ||
    selectedPriority !== "ALL";

  const activeFilterCount =
    (selectedSubjectId !== "ALL" ? 1 : 0) +
    (selectedClassification !== "ALL" ? 1 : 0) +
    (selectedTimeFilter !== "ALL" ? 1 : 0) +
    (selectedPriority !== "ALL" ? 1 : 0);

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-2.5 rounded-lg border border-border/70 shadow-xs">
      {/* 1. Input Tìm kiếm */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm nhiệm vụ, nội dung..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          className="pl-9 pr-8 h-10 text-xs sm:text-sm bg-background/60 rounded-md border-border/60 focus-visible:ring-[#7D39EB] transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchQueryChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* 2. Nút Bộ lọc Popover duy nhất + Chuyển đổi Dạng xem */}
      <div className="flex items-center gap-2 self-end sm:self-center">
        {/* Nút Bộ lọc (icon Phễu) */}
        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-10 px-3 rounded-md text-xs font-bold gap-2 border-border/80 transition-all active:scale-95 cursor-pointer",
                isFilterActive
                  ? "border-[#7D39EB] text-[#7D39EB] bg-[#7D39EB]/10"
                  : "text-muted-foreground hover:text-foreground hover:border-[#7D39EB]/40"
              )}
              title="Bộ lọc nhiệm vụ"
            >
              <Filter className="h-4 w-4" />
              <span>Bộ lọc</span>
              {activeFilterCount > 0 && (
                <span className="h-5 w-5 rounded-full bg-[#7D39EB] text-white text-[10px] flex items-center justify-center font-black">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>

          <PopoverContent
            align="end"
            className="w-80 p-4 rounded-xl border border-border/80 shadow-2xl bg-card text-foreground space-y-3 z-50 animate-in fade-in-50 zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Filter className="h-3.5 w-3.5 text-[#7D39EB]" />
                <span>Bộ lọc nhiệm vụ</span>
              </div>
              {isFilterActive && (
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="text-[11px] text-[#7D39EB] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Đặt lại</span>
                </button>
              )}
            </div>

            <div className="space-y-3 text-xs">
              {/* Lọc Môn học */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground">Môn học:</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => onSelectSubjectId(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-[#7D39EB]"
                >
                  <option value="ALL">Tất cả môn học ({subjects.length})</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lọc Phân loại chiến lược */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground">Phân loại chiến lược:</label>
                <select
                  value={selectedClassification}
                  onChange={(e) => onSelectClassification(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-[#7D39EB]"
                >
                  <option value="ALL">Tất cả phân loại</option>
                  {(Object.keys(STUDY_CLASSIFICATIONS) as StudyPlanClassification[]).map((k) => (
                    <option key={k} value={k}>
                      {STUDY_CLASSIFICATIONS[k].label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lọc Thời gian */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground">Thời gian:</label>
                <select
                  value={selectedTimeFilter}
                  onChange={(e) => onSelectTimeFilter(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-[#7D39EB]"
                >
                  <option value="ALL">Tất cả thời gian</option>
                  <option value="today">Hôm nay</option>
                  <option value="tomorrow">Ngày mai</option>
                  <option value="week">Tuần này</option>
                </select>
              </div>

              {/* Lọc Độ ưu tiên */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground">Độ ưu tiên:</label>
                <select
                  value={selectedPriority}
                  onChange={(e) => onSelectPriority(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-[#7D39EB]"
                >
                  <option value="ALL">Tất cả mức ưu tiên</option>
                  {(Object.keys(STUDY_PRIORITIES) as StudyPriority[]).map((p) => (
                    <option key={p} value={p}>
                      {STUDY_PRIORITIES[p].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Chuyển đổi Dạng xem: Kanban (Cột kéo thả) | Thẻ (Grid) | Danh sách (List) | Khung giờ (Timeline) */}
        <div className="flex items-center bg-muted/60 p-1 rounded-md border border-border/60">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDisplayModeChange("kanban")}
            className={cn(
              "h-8 px-2.5 rounded-xs transition-all cursor-pointer font-bold text-xs gap-1.5",
              displayMode === "kanban"
                ? "bg-[#C6FF33] text-black shadow-xs font-black"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Dạng cột kéo thả (Chưa làm, Đang làm, Đã xong)"
          >
            <Columns3 className="h-4 w-4" />
            <span className="hidden md:inline">Cột</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDisplayModeChange("grid")}
            className={cn(
              "h-8 px-2.5 rounded-xs transition-all cursor-pointer font-bold text-xs gap-1.5",
              displayMode === "grid"
                ? "bg-[#C6FF33] text-black shadow-xs font-black"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Dạng thẻ (Grid)"
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden md:inline">Thẻ</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDisplayModeChange("list")}
            className={cn(
              "h-8 px-2.5 rounded-xs transition-all cursor-pointer font-bold text-xs gap-1.5",
              displayMode === "list"
                ? "bg-[#C6FF33] text-black shadow-xs font-black"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Dạng danh sách (List)"
          >
            <List className="h-4 w-4" />
            <span className="hidden md:inline">List</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDisplayModeChange("timeline")}
            className={cn(
              "h-8 px-2.5 rounded-xs transition-all cursor-pointer font-bold text-xs gap-1.5",
              displayMode === "timeline"
                ? "bg-[#C6FF33] text-black shadow-xs font-black"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Dạng khung giờ tự học (Timeblock)"
          >
            <Clock className="h-4 w-4" />
            <span className="hidden md:inline">Giờ</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
