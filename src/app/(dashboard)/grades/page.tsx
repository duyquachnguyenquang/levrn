"use client";

import React, { useState } from "react";
import {
  GraduationCap,
  Plus,
  Search,
  RefreshCw,
  Download,
  AlertCircle,
  Filter,
  X,
  Calendar,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCourseGrades } from "@/hooks/useCourseGrades";
import { useSubjects } from "@/hooks/useSubjects";
import { GPASummaryCard } from "@/components/grades/GPASummaryCard";
import { SemesterGradeTable } from "@/components/grades/SemesterGradeTable";
import { CourseGradeModal } from "@/components/grades/CourseGradeModal";
import { CourseGrade, CourseGradeFormData } from "@/lib/types";

export default function GradesPage() {
  const {
    grades,
    isLoading,
    isSupabaseActive,
    errorMessage,
    cumulativeGPA,
    allSemesters,
    addCourseGrade,
    updateCourseGrade,
    deleteCourseGrade,
    refreshGrades,
  } = useCourseGrades();

  const { subjects } = useSubjects();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [filterOpen, setFilterOpen] = useState(false);

  const isFilterActive = selectedSemester !== "" || methodFilter !== "all";
  const activeFilterCount =
    (selectedSemester !== "" ? 1 : 0) + (methodFilter !== "all" ? 1 : 0);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseGrade | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleOpenAddModal = () => {
    setEditingCourse(null);
    setIsModalOpen(true);
  };

  const handleEditCourse = (course: CourseGrade) => {
    setEditingCourse(course);
    setIsModalOpen(true);
  };

  const handleSaveCourse = async (data: CourseGradeFormData) => {
    if (editingCourse) {
      await updateCourseGrade(editingCourse.id, data);
    } else {
      await addCourseGrade(data);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshGrades();
    setIsRefreshing(false);
  };

  // Lọc danh sách môn theo phương thức nếu người dùng chọn
  const filteredSemesters = cumulativeGPA.semesters.map((sem) => {
    return {
      ...sem,
      courses: sem.courses.filter((c) => {
        if (methodFilter === "final_only" && c.gradingMethod !== "final_only") return false;
        if (methodFilter === "components" && c.gradingMethod !== "components") return false;
        return true;
      }),
    };
  }).filter((sem) => sem.courses.length > 0);

  // Xuất file bảng điểm dạng CSV
  const handleExportCSV = () => {
    if (grades.length === 0) return;
    const headers = ["Mã môn", "Tên môn", "Số tín chỉ", "Học kỳ", "Cơ chế", "Điểm hệ 10", "Điểm hệ 4", "Ghi chú"];
    const rows = grades.map((g) => [
      g.subjectCode,
      `"${g.subjectName}"`,
      g.credits,
      `"${g.semester}"`,
      g.gradingMethod === "final_only" ? "Điểm Final" : "Điểm thành phần",
      g.finalScore ?? "",
      g.finalScore ? (g.finalScore >= 8.5 ? 4.0 : g.finalScore >= 8.0 ? 3.5 : g.finalScore >= 7.0 ? 3.0 : 2.0) : "",
      `"${g.notes || ""}"`,
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bang_diem_levrn_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* 1. Header Trang: Đồng bộ chuẩn Môn học & Kế hoạch học tập, luôn nằm cùng hàng */}
      <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 pb-2 border-b border-border/50">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-md bg-[#7D39EB]/15 flex items-center justify-center text-[#7D39EB] shrink-0">
            <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-foreground tracking-tight truncate">
            Quản lý điểm số
          </h2>
        </div>

        {/* Nút thao tác bên phải: Tải lại, Tải dữ liệu xuống, Thêm môn học (+) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Nút Tải lại (icon Lặp lại) */}
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="rounded-md h-8 w-8 sm:h-10 sm:w-10 border-border/70 text-muted-foreground hover:text-foreground transition-all active:scale-95 shrink-0"
            title="Tải lại dữ liệu"
            aria-label="Tải lại dữ liệu"
          >
            <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>

          {/* Nút Tải dữ liệu xuống */}
          <Button
            variant="outline"
            size="icon"
            onClick={handleExportCSV}
            className="rounded-md h-8 w-8 sm:h-10 sm:w-10 border-border/70 text-muted-foreground hover:text-foreground transition-all active:scale-95 shrink-0"
            title="Tải dữ liệu xuống (CSV)"
            aria-label="Tải dữ liệu xuống (CSV)"
          >
            <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>

          {/* Nút Thêm môn học (dấu cộng chuẩn trang Môn học) */}
          <Button
            size="icon"
            onClick={handleOpenAddModal}
            className="h-8 w-8 sm:h-10 sm:w-10 bg-[#C6FF33] hover:bg-[#B5F51B] text-black font-black rounded-md shadow-md transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shrink-0"
            title="Thêm môn học"
            aria-label="Thêm môn học"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 stroke-[3]" />
          </Button>
        </div>
      </div>

      {/* Thông báo trạng thái cơ sở dữ liệu nếu có */}
      {errorMessage && (
        <div className="p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => refreshGrades()}
            className="font-semibold underline underline-offset-2 shrink-0 cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* 2. 4 thẻ thống kê GPA tinh gọn */}
      <GPASummaryCard summary={cumulativeGPA} />

      {/* 3. Thanh tìm kiếm và Nút Bộ lọc Popover (đồng bộ theo trang Môn học) */}
      <div className="flex flex-row items-center justify-between gap-2.5 bg-card p-2 sm:p-2.5 rounded-lg border border-border/70 shadow-xs">
        {/* Input Tìm kiếm */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên môn hoặc mã môn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-8 h-9 text-xs bg-background/60 rounded-md border-border/60 focus-visible:ring-[#7D39EB] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Nút Bộ lọc Popover duy nhất (icon bộ lọc) với Popover chứa drop-boxes */}
        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={`h-9 px-3 rounded-md text-xs font-bold gap-2 border-border/80 transition-all active:scale-95 shrink-0 ${
                isFilterActive
                  ? "border-[#7D39EB] text-[#7D39EB] bg-[#7D39EB]/10"
                  : "text-muted-foreground hover:text-foreground hover:border-[#7D39EB]/40"
              }`}
              title="Bộ lọc điểm số"
            >
              <Filter className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Bộ lọc</span>
              {activeFilterCount > 0 && (
                <span className="h-4 w-4 rounded-full bg-[#7D39EB] text-white text-[10px] flex items-center justify-center font-black">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-72 p-4 rounded-lg border border-border/80 shadow-2xl bg-card text-foreground space-y-3 z-50"
          >
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Filter className="h-3.5 w-3.5 text-[#7D39EB]" />
                <span>Bộ lọc điểm số</span>
              </div>
              {isFilterActive && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSemester("");
                    setMethodFilter("all");
                  }}
                  className="text-[11px] text-muted-foreground hover:text-destructive transition-colors font-semibold cursor-pointer"
                >
                  Đặt lại
                </button>
              )}
            </div>

            {/* Drop-box 1: Học kỳ */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#7D39EB]" />
                <span>Học kỳ</span>
              </label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full h-9 text-xs font-semibold rounded-md border border-border/80 bg-background px-2.5 py-1 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7D39EB] transition-all"
              >
                <option value="">Tất cả học kỳ ({allSemesters.length} kỳ)</option>
                {allSemesters.map((sem) => (
                  <option key={sem} value={sem}>
                    {sem}
                  </option>
                ))}
              </select>
            </div>

            {/* Drop-box 2: Cơ chế tính điểm */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#7D39EB]" />
                <span>Cơ chế tính điểm</span>
              </label>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="w-full h-9 text-xs font-semibold rounded-md border border-border/80 bg-background px-2.5 py-1 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7D39EB] transition-all"
              >
                <option value="all">Tất cả cơ chế</option>
                <option value="final_only">Chỉ môn điểm Final</option>
                <option value="components">Chỉ môn có tỷ trọng thành phần</option>
              </select>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* 4. Bảng danh sách điểm theo từng học kỳ */}
      <SemesterGradeTable
        semesterSummaries={filteredSemesters}
        onEditCourse={handleEditCourse}
        onDeleteCourse={deleteCourseGrade}
        filterSemester={selectedSemester}
        searchQuery={searchQuery}
      />

      {/* Modal Thêm/Sửa Môn học */}
      <CourseGradeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCourse}
        onDelete={deleteCourseGrade}
        initialData={editingCourse}
        existingSubjects={subjects}
      />
    </div>
  );
}
