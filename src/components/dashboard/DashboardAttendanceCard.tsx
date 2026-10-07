"use client";

import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Subject,
  AttendanceRecord,
  AttendanceStatus,
} from "@/lib/types";
import {
  CheckCircle2,
  CheckCheck,
  Search,
  Filter,
  ArrowUpDown,
  BookOpen,
  Archive,
  X,
  Check,
} from "lucide-react";
import { MarqueeText } from "@/components/ui/marquee-text";
import {
  isSubjectEnded,
  getSubjectCheckinStatus,
  calculateAttendedCount,
} from "@/lib/checkinUtils";
import { AttendanceDetailModal } from "./AttendanceDetailModal";
import { cn } from "@/lib/utils";

interface DashboardAttendanceCardProps {
  subjects: Subject[];
  attendanceRecords: AttendanceRecord[];
  onCheckin: (subject: Subject) => Promise<void>;
  onEditCheckin: (params: {
    subject: Subject;
    date: string;
    time?: string;
    status: AttendanceStatus;
    notes?: string;
    recordId?: string;
  }) => Promise<{ success: boolean; message: string }>;
  onDeleteRecord?: (recordId: string) => Promise<void>;
}

type SortVariable = "name" | "date" | "attendance";
type SortDirection = "asc" | "desc";

export function DashboardAttendanceCard({
  subjects,
  attendanceRecords,
  onCheckin,
  onEditCheckin,
  onDeleteRecord,
}: DashboardAttendanceCardProps) {
  // 1. Tab phân loại: "active" (Đang học) | "ended" (Đã học)
  const [activeTab, setActiveTab] = useState<"active" | "ended">("active");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewingSubject, setViewingSubject] = useState<Subject | null>(null);
  const [isCheckingInId, setIsCheckingInId] = useState<string | null>(null);

  // 2. Tìm kiếm & Sắp xếp
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sortVariable, setSortVariable] = useState<SortVariable>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [isSortOpen, setIsSortOpen] = useState(false);

  // 3. Phân loại 2 nhóm: Đang học vs Đã học
  const { newSubjects, oldSubjects } = useMemo(() => {
    const newSubs: Subject[] = [];
    const oldSubs: Subject[] = [];

    subjects.forEach((sub) => {
      if (isSubjectEnded(sub, attendanceRecords)) {
        oldSubs.push(sub);
      } else {
        newSubs.push(sub);
      }
    });

    return { newSubjects: newSubs, oldSubjects: oldSubs };
  }, [subjects, attendanceRecords]);

  // Danh sách hiện tại theo Tab đã chọn
  const currentTabSubjects = activeTab === "active" ? newSubjects : oldSubjects;

  // 4. Lọc theo tìm kiếm và Sắp xếp
  const displayedSubjects = useMemo(() => {
    let result = [...currentTabSubjects];

    // Lọc theo Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q)
      );
    }

    // Sắp xếp theo biến được tích chọn
    result.sort((a, b) => {
      if (sortVariable === "name") {
        const cmp = a.name.localeCompare(b.name, "vi");
        return sortDirection === "asc" ? cmp : -cmp;
      }

      if (sortVariable === "date") {
        // Sắp xếp theo ngày bắt đầu hoặc thứ học trong tuần
        const dayA = a.scheduleDays && a.scheduleDays.length > 0 ? a.scheduleDays[0] : 7;
        const dayB = b.scheduleDays && b.scheduleDays.length > 0 ? b.scheduleDays[0] : 7;
        if (dayA !== dayB) {
          return sortDirection === "asc" ? dayA - dayB : dayB - dayA;
        }
        const startA = a.startDate || "";
        const startB = b.startDate || "";
        const cmp = startA.localeCompare(startB);
        return sortDirection === "asc" ? cmp : -cmp;
      }

      if (sortVariable === "attendance") {
        const countA = calculateAttendedCount(attendanceRecords.filter((r) => r.subjectId === a.id));
        const countB = calculateAttendedCount(attendanceRecords.filter((r) => r.subjectId === b.id));
        return sortDirection === "asc" ? countA - countB : countB - countA;
      }

      return 0;
    });

    return result;
  }, [currentTabSubjects, searchQuery, sortVariable, sortDirection, attendanceRecords]);

  // Xử lý điểm danh nhanh 1 chạm
  const handleQuickCheckin = async (subject: Subject) => {
    setIsCheckingInId(subject.id);
    try {
      await onCheckin(subject);
    } finally {
      setIsCheckingInId(null);
    }
  };

  return (
    <>
      {/* Container Thẻ chỉ bo tròn 5-10% (rounded-lg) theo Rule 1.6 */}
      <Card id="attendance-card" className="rounded-lg border border-border/80 bg-card p-3.5 sm:p-5 shadow-xs flex flex-col justify-between transition-all duration-300 hover:border-border/90 hover:shadow-md h-full min-h-[380px] scroll-mt-6">
        {/* 1. Header Tinh gọn - Ngang hàng trên cả PC & Mobile, căn phải cụm nút: Bộ lọc, Sắp xếp, Tìm kiếm */}
        <div className="flex flex-row items-center justify-between gap-2 sm:gap-3 pb-3 border-b border-border/60">
          {/* Tiêu đề card */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-md bg-[#7D39EB]/15 text-[#7D39EB] flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <h3 className="font-extrabold text-base text-foreground leading-tight truncate">
              Điểm danh
            </h3>
          </div>

          {/* Cụm công cụ bên phải: 1. Bộ lọc (icon Đầu lọc), 2. Sắp xếp, 3. Tìm kiếm */}
          <div className="flex items-center gap-2 shrink-0">
            {/* 1. Nút Bộ lọc (Icon Đầu lọc) */}
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "min-h-[40px] min-w-[40px] h-10 w-10 sm:h-8 sm:w-8 rounded-md border border-border/80 transition-all active:scale-95 shrink-0",
                    activeTab === "ended"
                      ? "border-[#7D39EB] text-[#7D39EB] bg-[#7D39EB]/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  title="Bộ lọc môn học (Đang học / Đã học)"
                  aria-label="Bộ lọc môn học"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-56 p-2 rounded-md border border-border/80 bg-card shadow-lg space-y-1"
              >
                <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Trạng thái môn học
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("active");
                    setIsFilterOpen(false);
                  }}
                  className={cn(
                    "w-full px-2.5 py-2 rounded-md text-xs font-semibold flex items-center justify-between cursor-pointer transition-all",
                    activeTab === "active"
                      ? "bg-[#7D39EB]/15 text-[#7D39EB] font-bold"
                      : "hover:bg-muted text-foreground/80"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>Đang học</span>
                  </div>
                  <span
                    className={cn(
                      "px-1.5 py-0.2 rounded text-[10px] font-mono",
                      activeTab === "active" ? "bg-[#7D39EB] text-white" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {newSubjects.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("ended");
                    setIsFilterOpen(false);
                  }}
                  className={cn(
                    "w-full px-2.5 py-2 rounded-md text-xs font-semibold flex items-center justify-between cursor-pointer transition-all",
                    activeTab === "ended"
                      ? "bg-[#7D39EB]/15 text-[#7D39EB] font-bold"
                      : "hover:bg-muted text-foreground/80"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Archive className="h-3.5 w-3.5" />
                    <span>Đã học</span>
                  </div>
                  <span
                    className={cn(
                      "px-1.5 py-0.2 rounded text-[10px] font-mono",
                      activeTab === "ended" ? "bg-[#7D39EB] text-white" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {oldSubjects.length}
                  </span>
                </button>
              </PopoverContent>
            </Popover>

            {/* 2. Nút Sắp xếp (Icon Sắp xếp - Tích chọn biến + Dropdown cơ chế) */}
            <Popover open={isSortOpen} onOpenChange={setIsSortOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="min-h-[40px] min-w-[40px] h-10 w-10 sm:h-8 sm:w-8 rounded-md border border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 transition-all active:scale-95"
                  title="Sắp xếp danh sách"
                  aria-label="Sắp xếp danh sách"
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-64 p-3 rounded-md border border-border/80 bg-card shadow-lg space-y-3"
              >
                {/* 1. Tích chọn theo tên biến sắp xếp */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Biến sắp xếp
                  </span>
                  <div className="space-y-1">
                    {[
                      { key: "name", label: "Tên môn học" },
                      { key: "date", label: "Ngày học" },
                      { key: "attendance", label: "Số buổi đã điểm danh" },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setSortVariable(item.key as SortVariable)}
                        className={cn(
                          "w-full px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center justify-between cursor-pointer transition-all",
                          sortVariable === item.key
                            ? "bg-[#7D39EB]/15 text-[#7D39EB]"
                            : "hover:bg-muted text-foreground/80"
                        )}
                      >
                        <span>{item.label}</span>
                        {sortVariable === item.key && (
                          <Check className="h-3.5 w-3.5 text-[#7D39EB]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Dropdown sổ xuống để chọn cơ chế (A-Z, thấp đến cao, v.v.) */}
                <div className="space-y-1.5 pt-2 border-t border-border/60">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Cơ chế sắp xếp
                  </span>
                  <select
                    value={sortDirection}
                    onChange={(e) => setSortDirection(e.target.value as SortDirection)}
                    className="w-full h-8 rounded-md border border-border/80 bg-background px-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-[#7D39EB]"
                  >
                    {sortVariable === "name" ? (
                      <>
                        <option value="asc">A → Z (Tăng dần)</option>
                        <option value="desc">Z → A (Giảm dần)</option>
                      </>
                    ) : sortVariable === "date" ? (
                      <>
                        <option value="asc">Sớm nhất → Muộn nhất</option>
                        <option value="desc">Muộn nhất → Sớm nhất</option>
                      </>
                    ) : (
                      <>
                        <option value="asc">Thấp đến cao (Ít nhất → Nhiều nhất)</option>
                        <option value="desc">Cao đến thấp (Nhiều nhất → Ít nhất)</option>
                      </>
                    )}
                  </select>
                </div>
              </PopoverContent>
            </Popover>

            {/* 3. Nút Tìm kiếm (Icon Kính lúp - Popover) */}
            <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "min-h-[40px] min-w-[40px] h-10 w-10 sm:h-8 sm:w-8 rounded-md border border-border/80 transition-all active:scale-95 shrink-0",
                    searchQuery ? "border-[#7D39EB] text-[#7D39EB] bg-[#7D39EB]/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  title="Tìm kiếm môn học"
                  aria-label="Tìm kiếm môn học"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-64 p-2 rounded-md border border-border/80 bg-card shadow-lg"
              >
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Tìm theo mã hoặc tên môn..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs rounded-md border-border/70 focus-visible:ring-[#7D39EB]"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* 2. Danh sách môn học - CHỈ HIỂN THỊ MỘT DÒNG DUY NHẤT: Mã môn & Tên môn bên trái, Điểm danh & Chi tiết bên phải */}
        <div className="py-2.5 space-y-2 flex-1 max-h-[290px] overflow-y-auto pr-1">
          {displayedSubjects.length > 0 ? (
            displayedSubjects.map((sub) => {
              const subColor = sub.color || "#7D39EB";
              const isEnded = activeTab === "ended";
              const checkinStatus = getSubjectCheckinStatus(sub, attendanceRecords);
              const isCheckingIn = isCheckingInId === sub.id;

              return (
                <div
                  key={sub.id}
                  className="h-11 px-2.5 sm:px-3 rounded-md bg-muted/30 border border-border/60 hover:border-border/90 flex items-center justify-between gap-2 overflow-hidden transition-all text-left"
                >
                  {/* BÊN TRÁI: Vạch màu, Mã môn, Tên môn (Click để mở xem chi tiết) */}
                  <div
                    onClick={() => setViewingSubject(sub)}
                    className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden cursor-pointer group/item"
                    title={`Bấm xem chi tiết môn ${sub.name}`}
                  >
                    <div
                      className="w-1.5 h-6 rounded-full shrink-0"
                      style={{ backgroundColor: isEnded ? "#94a3b8" : subColor }}
                    />
                    <span
                      className="w-14 h-5 inline-flex items-center justify-center font-mono font-black text-[10px] rounded-xs shrink-0 text-center tracking-tight truncate px-1 shadow-2xs"
                      style={{
                        backgroundColor: isEnded ? "#e2e8f0" : `${subColor}20`,
                        color: isEnded ? "#64748b" : subColor,
                      }}
                      title={sub.code}
                    >
                      {sub.code}
                    </span>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <MarqueeText
                        text={sub.name}
                        className={cn(
                          "font-bold text-xs truncate group-hover/item:text-[#7D39EB] transition-colors",
                          isEnded ? "text-foreground/80" : "text-foreground"
                        )}
                      />
                    </div>
                  </div>

                  {/* BÊN PHẢI: Nút Điểm danh Icon-only, không chữ, không còn nút Xem chi tiết Con mắt */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isEnded ? (
                      checkinStatus.isCheckedIn ? (
                        <div
                          className="h-8 w-8 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center shrink-0 shadow-2xs"
                          title="Đã điểm danh hôm nay"
                          aria-label="Đã điểm danh"
                        >
                          <CheckCheck className="h-4 w-4 stroke-[2.5]" />
                        </div>
                      ) : (
                        <Button
                          size="icon"
                          disabled={isCheckingIn}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickCheckin(sub);
                          }}
                          className="h-8 w-8 bg-[#C6FF33] hover:bg-[#b2f310] text-black font-black rounded-md shadow-2xs transition-all active:scale-95 flex items-center justify-center shrink-0"
                          title="Bấm điểm danh cho môn học này"
                          aria-label="Điểm danh"
                        >
                          <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
                        </Button>
                      )
                    ) : (
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md shrink-0">
                        Đã học
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-10 flex flex-col items-center justify-center text-center text-muted-foreground">
              <CheckCircle2 className="h-7 w-7 text-muted-foreground/40 mb-1" />
              <p className="text-xs font-semibold text-foreground/80">
                {searchQuery ? "Không tìm thấy môn học phù hợp" : "Chưa có môn học nào"}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-[11px] text-[#7D39EB] hover:underline font-bold mt-1 cursor-pointer"
                >
                  Xóa bộ lọc tìm kiếm
                </button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Pop-up Xem chi tiết điểm danh (tích hợp sẵn tính năng Chỉnh sửa) */}
      <AttendanceDetailModal
        isOpen={!!viewingSubject}
        onClose={() => setViewingSubject(null)}
        subject={viewingSubject}
        attendanceRecords={attendanceRecords}
        onSave={onEditCheckin}
        onDeleteRecord={onDeleteRecord}
      />
    </>
  );
}
