"use client";

import React, { useState, useMemo } from "react";
import { useSubjects } from "@/hooks/useSubjects";
import { useAttendance } from "@/hooks/useAttendance";
import { AttendanceSummaryCards } from "@/components/attendance/AttendanceSummaryCards";
import { SubjectAttendanceCard } from "@/components/attendance/SubjectAttendanceCard";
import { AttendanceSessionModal } from "@/components/attendance/AttendanceSessionModal";
import { QuickCheckinBanner } from "@/components/attendance/QuickCheckinBanner";
import { AttendanceRecord, AttendanceStatus } from "@/lib/types";
import {
  ClipboardCheck,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Plus,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function AttendancePage() {
  const { subjects, isLoading: isSubjectsLoading } = useSubjects();
  const {
    records,
    subjectSummaries,
    overallStats,
    isLoading: isAttendanceLoading,
    isSupabaseActive,
    updateSessionStatus,
    quickMarkSession,
    markTodayPresent,
    regenerateForSubject,
    addExtraSession,
    refreshAttendance,
  } = useAttendance(subjects);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "at_risk" | "safe">("all");
  const [filterOpen, setFilterOpen] = useState(false);

  // Modal editing state
  const [selectedSession, setSelectedSession] = useState<AttendanceRecord | null>(null);
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Danh sách các học kỳ có trong môn học
  const allSemesters = useMemo(() => {
    const set = new Set<string>();
    subjects.forEach((s) => {
      if (s.semester && s.semester.trim()) set.add(s.semester.trim());
    });
    return Array.from(set);
  }, [subjects]);

  // Các ca học diễn ra hôm nay (theo ngày YYYY-MM-DD hoặc theo scheduleDays)
  const todaySessions = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const todayDay = new Date().getDay(); // 0: CN, 1: T2...

    // Lọc theo ngày khớp hoặc theo thứ học trong tuần nếu chưa tới
    return records.filter((r) => {
      if (r.date === todayStr) return true;
      // Hoặc nếu hôm nay là thứ học của môn và buổi chưa ghi nhận
      const sub = subjects.find((s) => s.id === r.subjectId);
      if (sub?.scheduleDays?.includes(todayDay) && r.date <= todayStr && r.status === "upcoming") {
        return true;
      }
      return false;
    });
  }, [records, subjects]);

  // Lọc danh sách môn học
  const filteredSummaries = useMemo(() => {
    return subjectSummaries.filter((s) => {
      // Tìm kiếm theo mã hoặc tên môn
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        s.subjectCode.toLowerCase().includes(q) ||
        s.subjectName.toLowerCase().includes(q);

      // Lọc học kỳ
      const matchSemester =
        selectedSemester === "all" || s.semester === selectedSemester;

      // Lọc trạng thái nguy cơ
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "at_risk" && (s.isAtRisk || s.isBarredFromExam)) ||
        (statusFilter === "safe" && !s.isAtRisk && !s.isBarredFromExam);

      return matchQuery && matchSemester && matchStatus;
    });
  }, [subjectSummaries, searchQuery, selectedSemester, statusFilter]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshAttendance();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleOpenSession = (session: AttendanceRecord) => {
    setSelectedSession(session);
    setSessionModalOpen(true);
  };

  const handleSaveSession = (
    recordId: string,
    status: AttendanceStatus,
    notes?: string,
    date?: string
  ) => {
    updateSessionStatus(recordId, status, notes);
  };

  const handleMarkAllSubjectPresent = (subjectId: string) => {
    const subRecords = records.filter((r) => r.subjectId === subjectId);
    subRecords.forEach((r) => {
      if (r.status === "upcoming" || r.status === "absent") {
        updateSessionStatus(r.id, "present");
      }
    });
  };

  const handleTodayMarkPresent = (recordId: string) => {
    updateSessionStatus(recordId, "present");
  };

  const handleMarkTodayAllPresent = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    markTodayPresent(todayStr);
  };

  const isFilterActive = selectedSemester !== "all" || statusFilter !== "all";

  return (
    <div className="space-y-6 pb-12">
      {/* Header trang */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#7D39EB]/10 border border-[#7D39EB]/25 flex items-center justify-center text-[#7D39EB]">
              <ClipboardCheck className="h-4.5 w-4.5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              Điểm danh &amp; Quản lý chuyên cần
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Theo dõi điểm danh từng buổi học, cảnh báo tự động giới hạn vắng 20% tránh nguy cơ cấm thi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-9 text-xs rounded-lg border-border/80 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5 mr-1.5", isRefreshing && "animate-spin text-[#7D39EB]")}
            />
            {isRefreshing ? "Đang đồng bộ..." : "Đồng bộ"}
          </Button>
        </div>
      </div>

      {/* Banner điểm danh nhanh hôm nay (nếu có ca học) */}
      <QuickCheckinBanner
        todaySessions={todaySessions}
        onMarkPresent={handleTodayMarkPresent}
        onMarkTodayAllPresent={handleMarkTodayAllPresent}
      />

      {/* 4 Thẻ KPI thống kê chuyên cần */}
      <AttendanceSummaryCards
        overallRate={overallStats.overallRate}
        totalPresent={overallStats.totalPresent}
        totalLate={overallStats.totalLate}
        totalExcused={overallStats.totalExcused}
        totalAbsent={overallStats.totalAbsent}
        atRiskCount={overallStats.atRiskCount}
        barredCount={overallStats.barredCount}
        totalSubjects={overallStats.totalSubjects}
      />

      {/* Thanh công cụ tìm kiếm và lọc */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Tìm theo mã môn, tên môn học..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9 pr-4 text-xs rounded-lg bg-card border-border/80"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Lọc học kỳ nhanh */}
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="h-9 text-xs px-3 rounded-lg bg-card border border-border/80 text-foreground focus:outline-none focus:ring-1 focus:ring-[#7D39EB]"
          >
            <option value="all">Tất cả học kỳ</option>
            {allSemesters.map((sem) => (
              <option key={sem} value={sem}>
                {sem}
              </option>
            ))}
          </select>

          {/* Lọc trạng thái nguy cơ */}
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-9 text-xs rounded-lg border-border/80 gap-1.5",
                  isFilterActive && "border-[#7D39EB] text-[#7D39EB] bg-[#7D39EB]/5"
                )}
              >
                <Filter className="h-3.5 w-3.5" />
                <span>Lọc</span>
                {isFilterActive && (
                  <span className="h-2 w-2 rounded-full bg-[#7D39EB]" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-3 rounded-lg border-border/80 shadow-2xl">
              <div className="space-y-3">
                <span className="text-xs font-bold text-foreground">
                  Trạng thái cấm thi
                </span>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter("all");
                      setFilterOpen(false);
                    }}
                    className={cn(
                      "w-full text-left text-xs px-2.5 py-1.5 rounded-md transition-colors",
                      statusFilter === "all"
                        ? "bg-[#7D39EB]/15 text-[#7D39EB] font-bold"
                        : "hover:bg-muted text-muted-foreground"
                    )}
                  >
                    Tất cả các môn
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter("at_risk");
                      setFilterOpen(false);
                    }}
                    className={cn(
                      "w-full text-left text-xs px-2.5 py-1.5 rounded-md transition-colors",
                      statusFilter === "at_risk"
                        ? "bg-amber-500/15 text-amber-500 font-bold"
                        : "hover:bg-muted text-muted-foreground"
                    )}
                  >
                    Nguy cơ cấm thi / Bị cấm thi
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter("safe");
                      setFilterOpen(false);
                    }}
                    className={cn(
                      "w-full text-left text-xs px-2.5 py-1.5 rounded-md transition-colors",
                      statusFilter === "safe"
                        ? "bg-emerald-500/15 text-emerald-500 font-bold"
                        : "hover:bg-muted text-muted-foreground"
                    )}
                  >
                    Chuyên cần an toàn
                  </button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Danh sách các môn học kèm bảng ma trận điểm danh */}
      {isAttendanceLoading || isSubjectsLoading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          Đang tải dữ liệu điểm danh môn học...
        </div>
      ) : filteredSummaries.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredSummaries.map((summary) => {
            const originalSubject = subjects.find((s) => s.id === summary.subjectId);

            return (
              <SubjectAttendanceCard
                key={summary.subjectId}
                summary={summary}
                onQuickMark={quickMarkSession}
                onOpenSessionModal={handleOpenSession}
                onMarkAllPresent={handleMarkAllSubjectPresent}
                onRegenerate={() => {
                  if (originalSubject) regenerateForSubject(originalSubject);
                }}
                onAddExtraSession={() => {
                  addExtraSession(summary.subjectId, {});
                }}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed border-border/80 rounded-lg p-8">
          <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground/60 mb-2" />
          <h3 className="text-sm font-bold text-foreground">Không tìm thấy môn học nào</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {searchQuery || isFilterActive
              ? "Hãy thử xoá bộ lọc hoặc từ khoá tìm kiếm."
              : "Hãy thêm môn học mới ở trang Quản lý môn học để hệ thống tự động thiết lập điểm danh 15 buổi."}
          </p>
        </div>
      )}

      {/* Modal chi tiết buổi học */}
      <AttendanceSessionModal
        open={sessionModalOpen}
        onOpenChange={setSessionModalOpen}
        session={selectedSession}
        onSave={handleSaveSession}
      />
    </div>
  );
}
