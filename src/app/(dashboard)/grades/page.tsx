"use client";

import React, { useState } from "react";
import {
  GraduationCap,
  Plus,
  Search,
  RefreshCw,
  Download,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      {/* 1. Header Trang: Đồng bộ chuẩn Môn học & Kế hoạch học tập, không dòng chữ thừa */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-md bg-[#7D39EB]/15 flex items-center justify-center text-[#7D39EB]">
              <GraduationCap className="h-5 w-5" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Quản lý điểm số
            </h2>
          </div>
        </div>

        {/* Nút thao tác bên phải: Tải lại, Tải dữ liệu xuống, Thêm môn học (+) */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          {/* Nút Tải lại (icon Lặp lại) */}
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="rounded-md h-10 w-10 border-border/70 text-muted-foreground hover:text-foreground transition-all active:scale-95"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>

          {/* Nút Tải dữ liệu xuống */}
          <Button
            variant="outline"
            size="icon"
            onClick={handleExportCSV}
            className="rounded-md h-10 w-10 border-border/70 text-muted-foreground hover:text-foreground transition-all active:scale-95"
            title="Tải dữ liệu xuống (CSV)"
          >
            <Download className="h-4 w-4" />
          </Button>

          {/* Nút Thêm môn học (dấu cộng chuẩn trang Môn học) */}
          <Button
            size="icon"
            onClick={handleOpenAddModal}
            className="h-10 w-10 bg-[#C6FF33] hover:bg-[#B5F51B] text-black font-black rounded-md shadow-md transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shrink-0"
            title="Thêm môn học"
            aria-label="Thêm môn học"
          >
            <Plus className="h-5 w-5 stroke-[3]" />
          </Button>
        </div>
      </div>

      {/* Thông báo trạng thái cơ sở dữ liệu nếu có */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between gap-3">
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

      {/* 3. Thanh tìm kiếm và Bộ lọc */}
      <div className="p-3 sm:p-4 rounded-xl border border-border/80 bg-card/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên môn hoặc mã môn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9 text-xs rounded-lg bg-background"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Lọc theo học kỳ */}
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="text-xs rounded-lg border border-border/80 bg-background px-3 py-2 font-medium focus:ring-1 focus:ring-primary focus:outline-none"
          >
            <option value="">Tất cả học kỳ ({allSemesters.length} kỳ)</option>
            {allSemesters.map((sem) => (
              <option key={sem} value={sem}>
                {sem}
              </option>
            ))}
          </select>

          {/* Lọc theo cơ chế chấm điểm */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="text-xs rounded-lg border border-border/80 bg-background px-3 py-2 font-medium focus:ring-1 focus:ring-primary focus:outline-none"
          >
            <option value="all">Tất cả cơ chế</option>
            <option value="final_only">Chỉ môn điểm Final</option>
            <option value="components">Chỉ môn có tỷ trọng thành phần</option>
          </select>
        </div>
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
        initialData={editingCourse}
        existingSubjects={subjects}
      />
    </div>
  );
}
