"use client";

import React, { useState, useMemo } from "react";
import { Subject, SUBJECT_CATEGORIES } from "@/lib/types";
import { SubjectCard } from "./SubjectCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  BookOpen,
  Plus,
  Filter,
  ArrowUpDown,
  Check,
  X,
  LayoutGrid,
  List,
  Folder,
  Globe,
  ExternalLink,
  Pencil,
  Trash2,
  GraduationCap,
  Calendar,
  Tag,
  Clock,
  CheckCircle2,
  Eye,
  MapPin,
} from "lucide-react";
import { useAttendance } from "@/hooks/useAttendance";
import { useNotifications } from "@/hooks/useNotifications";
import { useCourseGrades } from "@/hooks/useCourseGrades";
import { calculateComponentsScore } from "@/lib/gradeUtils";
import { getSubjectCheckinStatus } from "@/lib/checkinUtils";
import { isSubjectCompleted, isPastSemester, CURRENT_SEMESTER } from "@/lib/semesterUtils";
import { MarqueeText } from "@/components/ui/marquee-text";

interface SubjectListProps {
  subjects: Subject[];
  isLoading: boolean;
  onAddNew: () => void;
  onEdit: (subject: Subject) => void;
  onDelete: (id: string) => void;
  onUpdateSubject?: (id: string, updates: Partial<Subject>) => void;
}

// Hàm phân tích năm học và kỳ học từ dữ liệu môn học
function parseSemester(subject: Subject): { year: string; term: string } {
  if (subject.academicYear && subject.term) {
    return { year: subject.academicYear, term: subject.term };
  }
  const raw = (subject.semester || "").trim();
  if (!raw) return { year: "—", term: "—" };

  if (raw.toLowerCase().startsWith("hk hè") || raw.toLowerCase().startsWith("hè")) {
    const term = "HK hè";
    const year = raw.replace(/^(hk\s*hè|hè)/i, "").trim() || "—";
    return { year, term };
  }
  const parts = raw.split(" ");
  if (parts.length >= 2) {
    const term = parts[0];
    const year = parts.slice(1).join(" ");
    return { year, term };
  }
  return { year: raw, term: "—" };
}

export function SubjectList({
  subjects,
  isLoading,
  onAddNew,
  onEdit,
  onDelete,
  onUpdateSubject,
}: SubjectListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSemester, setSelectedSemester] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedCredits, setSelectedCredits] = useState<string>("ALL");
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);

  // Điểm danh & Thông báo
  const { records: attendanceRecords, checkinSubjectToday } = useAttendance(subjects);
  const { addNotification } = useNotifications();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleCheckin = async (subject: Subject) => {
    const res = await checkinSubjectToday(subject);
    if (res.success) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const dateStr = now.toLocaleDateString("vi-VN");
      const status = getSubjectCheckinStatus(subject, attendanceRecords);

      await addNotification({
        title: `Điểm danh thành công: [${subject.code}] ${subject.name}`,
        message: `Bạn đã điểm danh lúc ${timeStr} ngày ${dateStr} (Buổi ${status.sessionNumber}/${status.totalWeeks}). Dữ liệu đã lưu vào hệ thống.`,
        type: "success",
        category: "attendance",
        link: "/dashboard",
      });

      setToastMessage(`Đã điểm danh thành công môn [${subject.code}] ${subject.name} lúc ${timeStr}!`);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const hasUnassigned = useMemo(() => {
    return subjects.some((s) => !s.semester || s.semester.trim() === "" || s.semester === "Chưa xếp kỳ");
  }, [subjects]);

  const semesterOptions = useMemo(() => {
    const standard = Array.from(
      new Set(
        subjects
          .map((s) => (s.semester ? s.semester.trim() : ""))
          .filter((sem) => sem && sem !== "Chưa xếp kỳ")
      )
    ).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

    if (hasUnassigned) {
      return [...standard, "Chưa xếp kỳ"];
    }
    return standard;
  }, [subjects, hasUnassigned]);

  const creditOptions = useMemo(() => {
    const set = new Set<number>();
    subjects.forEach((s) => {
      if (s.credits !== undefined) set.add(s.credits);
    });
    if (set.size === 0) return [1, 2, 3, 4, 5];
    return Array.from(set).sort((a, b) => a - b);
  }, [subjects]);

  const isFilterActive =
    selectedSemester !== "ALL" ||
    selectedCategory !== "ALL" ||
    selectedCredits !== "ALL";

  const activeFilterCount =
    (selectedSemester !== "ALL" ? 1 : 0) +
    (selectedCategory !== "ALL" ? 1 : 0) +
    (selectedCredits !== "ALL" ? 1 : 0);

  type SortOption = "default" | "name_asc" | "name_desc" | "progress" | "score_desc" | "score_asc";
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [sortOpen, setSortOpen] = useState(false);
  const { grades } = useCourseGrades();

  // Xác định phân loại tiến độ môn học theo thứ tự ưu tiên hiển thị:
  // 1: Đang học (ưu tiên cao nhất lên đầu trang để người dùng dễ theo dõi)
  // 2: Chưa học (các môn sắp diễn ra)
  // 3: Học xong (đã hoàn thành / thuộc các học kỳ trước)
  const getSubjectProgressCategory = (subject: Subject): number => {
    const checkinStatus = getSubjectCheckinStatus(subject, attendanceRecords);
    const isCompleted = isSubjectCompleted({
      isCompleted: subject.isCompleted,
      semester: subject.semester,
      academicYear: subject.academicYear,
      endDate: subject.endDate,
      attendedCount: checkinStatus.attendedCount,
      totalWeeks: checkinStatus.totalWeeks,
    });

    if (isCompleted) return 3; // Học xong -> xếp sau cùng

    const isStarted =
      checkinStatus.attendedCount > 0 ||
      Boolean(
        subject.startDate &&
        !isNaN(new Date(subject.startDate).getTime()) &&
        new Date(subject.startDate).getTime() <= Date.now()
      ) ||
      (subject.semester && (subject.semester.includes("2026-2027") || subject.semester === CURRENT_SEMESTER));

    if (isStarted) return 1; // Đang học -> Ưu tiên 1 lên đầu trang!

    return 2; // Chưa học -> ở giữa
  };

  // Lấy điểm số của môn học từ bảng điểm
  const getSubjectScore = (subject: Subject): number => {
    const grade = grades.find(
      (g) =>
        g.subjectId === subject.id ||
        (g.subjectCode && subject.code && g.subjectCode.toLowerCase() === subject.code.toLowerCase())
    );
    if (!grade) return -1;
    if (grade.finalScore !== null && grade.finalScore !== undefined) {
      return Number(grade.finalScore);
    }
    if (grade.components && grade.components.length > 0) {
      const compScore = calculateComponentsScore(grade.components).finalScore;
      if (compScore !== null) return compScore;
    }
    if (grade.targetScore !== null && grade.targetScore !== undefined) {
      return Number(grade.targetScore);
    }
    return -1;
  };

  const filteredSubjects = useMemo(() => {
    const list = subjects.filter((subject) => {
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        subject.name.toLowerCase().includes(query) ||
        subject.code.toLowerCase().includes(query) ||
        (subject.category && subject.category.toLowerCase().includes(query));

      const matchSemester =
        selectedSemester === "ALL" ||
        (selectedSemester === "Chưa xếp kỳ"
          ? (!subject.semester || subject.semester.trim() === "" || subject.semester === "Chưa xếp kỳ")
          : subject.semester === selectedSemester);

      const matchCategory =
        selectedCategory === "ALL" || subject.category === selectedCategory;

      const matchCredits =
        selectedCredits === "ALL" ||
        (subject.credits !== undefined &&
          String(subject.credits) === selectedCredits);

      return matchSearch && matchSemester && matchCategory && matchCredits;
    });

    if (sortBy === "name_asc") {
      return [...list].sort((a, b) => a.name.localeCompare(b.name, "vi"));
    }
    if (sortBy === "name_desc") {
      return [...list].sort((a, b) => b.name.localeCompare(a.name, "vi"));
    }
    if (sortBy === "progress") {
      // Đang học (1) -> Chưa học (2) -> Học xong (3)
      return [...list].sort((a, b) => {
        const catA = getSubjectProgressCategory(a);
        const catB = getSubjectProgressCategory(b);
        if (catA !== catB) return catA - catB;
        return a.name.localeCompare(b.name, "vi");
      });
    }
    if (sortBy === "score_desc") {
      return [...list].sort((a, b) => {
        const scoreA = getSubjectScore(a);
        const scoreB = getSubjectScore(b);
        if (scoreA !== scoreB) return scoreB - scoreA;
        return a.name.localeCompare(b.name, "vi");
      });
    }
    if (sortBy === "score_asc") {
      return [...list].sort((a, b) => {
        const scoreA = getSubjectScore(a);
        const scoreB = getSubjectScore(b);
        if (scoreA !== scoreB) return scoreA - scoreB;
        return a.name.localeCompare(b.name, "vi");
      });
    }

    // Mặc định: Sắp xếp theo thứ tự những môn đang học lên trước để tiện theo dõi
    return [...list].sort((a, b) => {
      const catA = getSubjectProgressCategory(a);
      const catB = getSubjectProgressCategory(b);
      if (catA !== catB) return catA - catB;
      return a.name.localeCompare(b.name, "vi");
    });
  }, [
    subjects,
    searchQuery,
    selectedSemester,
    selectedCategory,
    selectedCredits,
    sortBy,
    grades,
    attendanceRecords,
  ]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7D39EB] border-t-transparent" />
        <p className="text-xs text-muted-foreground font-medium">Đang tải danh sách môn học...</p>
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] rounded-lg border border-dashed border-border/80 bg-card p-8 text-center animate-in fade-in-50 duration-300">
        <div className="h-14 w-14 rounded-md bg-[#7D39EB]/10 flex items-center justify-center text-[#7D39EB] mb-4 shadow-inner">
          <BookOpen className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-bold text-foreground">
          Chưa có môn học nào được tạo
        </h3>
        <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-6">
          Bắt đầu hành trình học tập bằng cách thêm môn học đầu tiên để theo dõi tiến độ và số giờ học.
        </p>
        <Button
          onClick={onAddNew}
          className="gap-2 bg-[#C6FF33] hover:bg-[#B5F51B] text-black font-extrabold rounded-md shadow-md text-xs h-10 px-5 transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>Thêm môn học đầu tiên</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in-50 duration-300">
      {/* Thanh công cụ: Tìm kiếm + Nút Bộ lọc Popover + Chuyển đổi Grid/List (luôn ngang hàng) */}
      <div className="flex flex-row items-center justify-between gap-2 bg-card p-2 sm:p-2.5 rounded-lg border border-border/70 shadow-xs">
        {/* Input Tìm kiếm */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm môn học"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-7 min-h-[40px] h-10 sm:h-9 text-xs sm:text-sm bg-background/60 rounded-md border-border/60 focus-visible:ring-[#7D39EB] transition-all"
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

        {/* Cụm công cụ bên phải: Nút Sắp xếp + Nút Bộ lọc + Nút chuyển Grid/List (icon-only toàn bộ) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* 1. Nút Sắp xếp (Icon-only) bên trái Bộ lọc */}
          <Popover open={sortOpen} onOpenChange={setSortOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`min-h-[40px] min-w-[40px] h-10 w-10 sm:h-9 sm:w-9 p-0 rounded-md border-border/80 transition-all active:scale-95 shrink-0 relative flex items-center justify-center ${
                  sortBy !== "default"
                    ? "border-[#7D39EB] text-[#7D39EB] bg-[#7D39EB]/10"
                    : "text-muted-foreground hover:text-foreground hover:border-[#7D39EB]/40"
                }`}
                title="Sắp xếp môn học"
                aria-label="Sắp xếp môn học"
              >
                <ArrowUpDown className="h-4 w-4" />
                {sortBy !== "default" && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-[#7D39EB] ring-2 ring-background" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-64 p-2 rounded-lg border border-border/80 shadow-2xl bg-card text-foreground space-y-1 z-50"
            >
              <div className="px-2.5 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/60 flex items-center justify-between">
                <span>Sắp xếp môn học</span>
                {sortBy !== "default" && (
                  <button
                    type="button"
                    onClick={() => {
                      setSortBy("default");
                      setSortOpen(false);
                    }}
                    className="text-[10px] text-muted-foreground hover:text-destructive font-semibold transition-colors"
                  >
                    Mặc định
                  </button>
                )}
              </div>

              {/* Tùy chọn 1: Xếp theo tên A-Z */}
              <button
                type="button"
                onClick={() => {
                  setSortBy("name_asc");
                  setSortOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-md font-semibold transition-all ${
                  sortBy === "name_asc"
                    ? "bg-[#7D39EB]/15 text-[#7D39EB] font-bold"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="h-3.5 w-3.5 text-[#7D39EB]" />
                  <span>Xếp theo tên (A → Z)</span>
                </span>
                {sortBy === "name_asc" && <Check className="h-3.5 w-3.5 text-[#7D39EB]" />}
              </button>

              {/* Tùy chọn 2: Xếp theo tên Z-A */}
              <button
                type="button"
                onClick={() => {
                  setSortBy("name_desc");
                  setSortOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-md font-semibold transition-all ${
                  sortBy === "name_desc"
                    ? "bg-[#7D39EB]/15 text-[#7D39EB] font-bold"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="h-3.5 w-3.5 text-[#7D39EB]" />
                  <span>Xếp theo tên (Z → A)</span>
                </span>
                {sortBy === "name_desc" && <Check className="h-3.5 w-3.5 text-[#7D39EB]" />}
              </button>

              {/* Tùy chọn 3: Xếp theo tiến độ (Đã xong, Đang học, Chưa học) */}
              <button
                type="button"
                onClick={() => {
                  setSortBy("progress");
                  setSortOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-md font-semibold transition-all ${
                  sortBy === "progress"
                    ? "bg-[#7D39EB]/15 text-[#7D39EB] font-bold"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#7D39EB]" />
                  <span>Tiến độ (Đang học → Chưa học → Học xong)</span>
                </span>
                {sortBy === "progress" && <Check className="h-3.5 w-3.5 text-[#7D39EB]" />}
              </button>

              {/* Tùy chọn 4: Xếp theo điểm số (Cao -> Thấp) */}
              <button
                type="button"
                onClick={() => {
                  setSortBy("score_desc");
                  setSortOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-md font-semibold transition-all ${
                  sortBy === "score_desc"
                    ? "bg-[#7D39EB]/15 text-[#7D39EB] font-bold"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                <span className="flex items-center gap-2">
                  <GraduationCap className="h-3.5 w-3.5 text-[#7D39EB]" />
                  <span>Điểm số (Cao → Thấp)</span>
                </span>
                {sortBy === "score_desc" && <Check className="h-3.5 w-3.5 text-[#7D39EB]" />}
              </button>

              {/* Tùy chọn 5: Xếp theo điểm số (Thấp -> Cao) */}
              <button
                type="button"
                onClick={() => {
                  setSortBy("score_asc");
                  setSortOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-md font-semibold transition-all ${
                  sortBy === "score_asc"
                    ? "bg-[#7D39EB]/15 text-[#7D39EB] font-bold"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                <span className="flex items-center gap-2">
                  <GraduationCap className="h-3.5 w-3.5 text-[#7D39EB]" />
                  <span>Điểm số (Thấp → Cao)</span>
                </span>
                {sortBy === "score_asc" && <Check className="h-3.5 w-3.5 text-[#7D39EB]" />}
              </button>
            </PopoverContent>
          </Popover>

          {/* 2. Nút Bộ lọc duy nhất (Icon-only) với Popover chứa 3 drop-box */}
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`min-h-[40px] min-w-[40px] h-10 w-10 sm:h-9 sm:w-9 p-0 rounded-md border-border/80 transition-all active:scale-95 shrink-0 relative flex items-center justify-center ${
                  isFilterActive
                    ? "border-[#7D39EB] text-[#7D39EB] bg-[#7D39EB]/10"
                    : "text-muted-foreground hover:text-foreground hover:border-[#7D39EB]/40"
                }`}
                title="Bộ lọc môn học"
                aria-label="Bộ lọc môn học"
              >
                <Filter className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#7D39EB] text-white text-[9px] flex items-center justify-center font-black ring-2 ring-background">
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
                  <span>Bộ lọc môn học</span>
                </div>
                {isFilterActive && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSemester("ALL");
                      setSelectedCategory("ALL");
                      setSelectedCredits("ALL");
                    }}
                    className="text-[11px] text-muted-foreground hover:text-destructive transition-colors font-semibold"
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
                  <option value="ALL">Tất cả học kỳ</option>
                  {semesterOptions.map((sem) => {
                    const isCurrent = sem === CURRENT_SEMESTER || sem.includes("2026-2027");
                    const isPast = isPastSemester(sem);
                    const labelSuffix = isCurrent ? " (Hiện tại)" : isPast ? " (Học xong)" : "";
                    return (
                      <option key={sem} value={sem}>
                        {sem}{labelSuffix}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Drop-box 2: Phân loại */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#7D39EB]" />
                  <span>Phân loại</span>
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full h-9 text-xs font-semibold rounded-md border border-border/80 bg-background px-2.5 py-1 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7D39EB] transition-all"
                >
                  <option value="ALL">Tất cả phân loại</option>
                  {SUBJECT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Drop-box 3: Số tín chỉ */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-[#7D39EB]" />
                  <span>Số tín chỉ</span>
                </label>
                <select
                  value={selectedCredits}
                  onChange={(e) => setSelectedCredits(e.target.value)}
                  className="w-full h-9 text-xs font-semibold rounded-md border border-border/80 bg-background px-2.5 py-1 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7D39EB] transition-all"
                >
                  <option value="ALL">Tất cả tín chỉ</option>
                  {creditOptions.map((c) => (
                    <option key={c} value={String(c)}>
                      {c} tín chỉ
                    </option>
                  ))}
                </select>
              </div>
            </PopoverContent>
          </Popover>

          {/* Nút chuyển đổi giao diện: Xem theo Khối (5 môn/hàng) hoặc theo List */}
          <div className="flex items-center p-0.5 bg-muted/60 rounded-md border border-border/70 min-h-[40px] h-10 sm:h-9 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`min-h-[36px] min-w-[36px] h-9 w-9 sm:h-8 sm:w-auto sm:px-2.5 rounded-sm flex items-center justify-center gap-1 text-xs transition-all active:scale-95 cursor-pointer ${
                viewMode === "grid"
                  ? "bg-card text-foreground shadow-xs font-bold border border-border/40"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Xem dạng khối"
              aria-label="Xem dạng khối"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`min-h-[36px] min-w-[36px] h-9 w-9 sm:h-8 sm:w-auto sm:px-2.5 rounded-sm flex items-center justify-center gap-1 text-xs transition-all active:scale-95 cursor-pointer ${
                viewMode === "list"
                  ? "bg-card text-foreground shadow-xs font-bold border border-border/40"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Xem dạng danh sách"
              aria-label="Xem dạng danh sách"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Toast phản hồi điểm danh thành công */}
      {toastMessage && (
        <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between gap-2 shadow-sm animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Hiển thị danh sách môn học theo chế độ Grid (5 môn/hàng) hoặc List */}
      {filteredSubjects.length > 0 ? (
        viewMode === "grid" ? (
          /* Khối: Mặc định 2 thẻ/hàng trên mobile, chuẩn 5 thẻ/hàng trên màn hình máy tính */
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
            {filteredSubjects.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                onEdit={onEdit}
                onDelete={onDelete}
                onUpdateSubject={onUpdateSubject}
                attendanceRecords={attendanceRecords}
                onCheckin={handleCheckin}
              />
            ))}
          </div>
        ) : (
          /* List: Trên mobile hiển thị gọn gàng trong toàn bộ chiều ngang thiết bị (KHÔNG cuộn ngang); Trên desktop hiển thị bảng đầy đủ */
          <div className="w-full">
            {/* Giao diện Mobile (dưới md): Danh sách hàng ngang co giãn 100% chiều ngang, tuyệt đối không có thanh kéo ngang */}
            <div className="md:hidden flex flex-col gap-2 w-full">
              {filteredSubjects.map((subject) => {
                const cardColor = subject.color || "#7D39EB";
                const scheduleDaysText =
                  subject.scheduleDays && subject.scheduleDays.length > 0
                    ? subject.scheduleDays.map((d) => (d === 0 ? "CN" : `T${d + 1}`)).join(", ")
                    : subject.startDate && !isNaN(new Date(subject.startDate).getTime())
                    ? new Date(subject.startDate).getDay() === 0 ? "CN" : `T${new Date(subject.startDate).getDay() + 1}`
                    : "";
                const timeText =
                  subject.startTime && subject.endTime
                    ? `${subject.startTime} - ${subject.endTime}`
                    : subject.startTime || "";
                const scheduleText =
                  scheduleDaysText && timeText
                    ? `${scheduleDaysText} • ${timeText}`
                    : scheduleDaysText || timeText || "Chưa có lịch";
                const locationText =
                  subject.room && subject.campus
                    ? `P.${subject.room} • ${subject.campus}`
                    : subject.room
                    ? `Phòng ${subject.room}`
                    : subject.campus || "Chưa cập nhật";

                return (
                  <div
                    key={subject.id}
                    onClick={() => onEdit(subject)}
                    className="w-full rounded-lg border border-border/80 bg-card p-3 flex items-center justify-between gap-3 shadow-2xs hover:border-[#7D39EB]/40 transition-all cursor-pointer"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-14 h-5 inline-flex items-center justify-center font-mono font-black text-[10px] rounded-md shrink-0 text-center tracking-tight truncate px-1 shadow-2xs"
                          style={{
                            backgroundColor: `${cardColor}20`,
                            color: cardColor,
                            border: `1px solid ${cardColor}40`,
                          }}
                          title={subject.code}
                        >
                          {subject.code}
                        </span>
                        <div className="min-w-0 flex-1">
                          <MarqueeText
                            text={subject.name}
                            className="font-bold text-sm text-foreground"
                          />
                        </div>
                      </div>

                      {/* Thông tin cơ bản Tầng 1: Thời gian & Địa điểm */}
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-0.5 flex-wrap">
                        <span className="flex items-center gap-1 truncate max-w-[170px]">
                          <Clock className="h-3 w-3 text-[#7D39EB] shrink-0" />
                          <span className="truncate">{scheduleText}</span>
                        </span>
                        <span className="flex items-center gap-1 truncate max-w-[140px]">
                          <MapPin className="h-3 w-3 text-emerald-500 shrink-0" />
                          <span className="truncate">{locationText}</span>
                        </span>
                      </div>
                    </div>

                    {/* Cụm nút liên kết nhanh (nếu có) trên mobile list view */}
                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {subject.courseUrl && (
                        <a
                          href={subject.courseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-[36px] min-w-[36px] h-9 w-9 rounded-md flex items-center justify-center text-[#7D39EB] bg-[#7D39EB]/10 hover:bg-[#7D39EB]/20 border border-[#7D39EB]/30 transition-all shadow-2xs"
                          title="Mở Course môn học"
                          aria-label="Mở Course môn học"
                        >
                          <Globe className="h-4 w-4" />
                        </a>
                      )}
                      {subject.driveUrl && (
                        <a
                          href={subject.driveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-[36px] min-w-[36px] h-9 w-9 rounded-md flex items-center justify-center text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all shadow-2xs"
                          title="Mở Google Drive môn học"
                          aria-label="Mở Google Drive môn học"
                        >
                          <Folder className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Giao diện Desktop (md trở lên): Bảng phân chia các cột rõ ràng */}
            <div className="hidden md:block overflow-x-auto rounded-lg border border-border/80 bg-card shadow-xs">
              <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-border/80 bg-muted/40 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-3.5 whitespace-nowrap">Mã môn</th>
                  <th className="py-3 px-3.5 min-w-[200px]">Tên môn</th>
                  <th className="py-3 px-3 whitespace-nowrap">Năm học</th>
                  <th className="py-3 px-3 whitespace-nowrap">Kỳ học</th>
                  <th className="py-3 px-3 whitespace-nowrap">Phân loại</th>
                  <th className="py-3 px-3 whitespace-nowrap text-center">Số tín chỉ</th>
                  <th className="py-3 px-3 whitespace-nowrap text-center">Course</th>
                  <th className="py-3 px-3 whitespace-nowrap text-center">Google Drive</th>
                  <th className="py-3 px-3 whitespace-nowrap text-center">Tiến độ & Điểm danh</th>
                  <th className="py-3 px-3.5 whitespace-nowrap text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-xs">
                {filteredSubjects.map((subject) => {
                  const cardColor = subject.color || "#7D39EB";
                  const { year, term } = parseSemester(subject);
                  return (
                    <tr
                      key={subject.id}
                      className="group hover:bg-muted/30 transition-colors"
                    >
                      {/* Mã môn */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onEdit(subject)}
                          className="w-16 h-6 inline-flex items-center justify-center font-mono font-black text-xs rounded-md shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-pointer text-center truncate px-1"
                          style={{
                            backgroundColor: `${cardColor}20`,
                            color: cardColor,
                            border: `1px solid ${cardColor}40`,
                          }}
                          title={`Xem chi tiết môn học [${subject.code}] ${subject.name}`}
                        >
                          {subject.code}
                        </button>
                      </td>

                      {/* Tên môn */}
                      <td className="py-3 px-3.5 max-w-[320px]">
                        <button
                          type="button"
                          onClick={() => onEdit(subject)}
                          className="font-bold text-sm text-foreground hover:text-[#7D39EB] transition-colors text-left group-hover:text-[#7D39EB] w-full"
                          title={subject.name}
                        >
                          <MarqueeText text={subject.name} className="font-bold text-sm" />
                        </button>
                      </td>

                      {/* Năm học */}
                      <td className="py-3 px-3 whitespace-nowrap text-muted-foreground font-semibold">
                        {year}
                      </td>

                      {/* Kỳ học */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-muted font-bold text-[11px] text-foreground">
                          {term}
                        </span>
                      </td>

                      {/* Phân loại */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {subject.category ? (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                            style={{
                              backgroundColor: `${cardColor}15`,
                              color: cardColor,
                            }}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: cardColor }}
                            />
                            <span>{subject.category}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40 font-mono">—</span>
                        )}
                      </td>

                      {/* Số tín chỉ */}
                      <td className="py-3 px-3 whitespace-nowrap text-center font-bold text-foreground">
                        {subject.credits !== undefined ? (
                          <span className="inline-flex items-center gap-1">
                            <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{subject.credits} TC</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40 font-mono">—</span>
                        )}
                      </td>

                      {/* Course (nút chuyển hướng) */}
                      <td className="py-3 px-3 whitespace-nowrap text-center">
                        {subject.courseUrl ? (
                          <a
                            href={subject.courseUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-[#7D39EB]/10 text-[#7D39EB] hover:bg-[#7D39EB]/20 border border-[#7D39EB]/30 transition-all hover:-translate-y-0.5 active:scale-95 shadow-2xs"
                            title={`Mở Course: ${subject.courseUrl}`}
                          >
                            <Globe className="h-3.5 w-3.5" />
                            <span>Course</span>
                            <ExternalLink className="h-3 w-3 opacity-70" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground/40 font-mono text-xs">—</span>
                        )}
                      </td>

                      {/* Google Drive (nút chuyển hướng) */}
                      <td className="py-3 px-3 whitespace-nowrap text-center">
                        {subject.driveUrl ? (
                          <a
                            href={subject.driveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 transition-all hover:-translate-y-0.5 active:scale-95 shadow-2xs"
                            title={`Mở Google Drive: ${subject.driveUrl}`}
                          >
                            <Folder className="h-3.5 w-3.5" />
                            <span>Drive</span>
                            <ExternalLink className="h-3 w-3 opacity-70" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground/40 font-mono text-xs">—</span>
                        )}
                      </td>

                      {/* Tiến độ & Điểm danh */}
                      <td className="py-3 px-3 whitespace-nowrap text-center">
                        {(() => {
                          const checkinStatus = getSubjectCheckinStatus(subject, attendanceRecords);
                          if (checkinStatus.canCheckin) {
                            return (
                              <Button
                                size="sm"
                                onClick={() => handleCheckin(subject)}
                                className="h-7 px-2.5 bg-[#C6FF33] hover:bg-[#b5f514] text-black font-extrabold text-[11px] rounded-md shadow-xs transition-all active:scale-95 inline-flex items-center gap-1"
                                title="Điểm danh buổi học hôm nay"
                              >
                                <CheckCircle2 className="h-3 w-3 stroke-[2.5]" />
                                <span>Điểm danh</span>
                              </Button>
                            );
                          }
                          if (checkinStatus.isCheckedIn) {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Đã điểm danh</span>
                              </span>
                            );
                          }
                          return (
                            <span className="font-mono text-xs font-semibold text-muted-foreground">
                              {checkinStatus.attendedCount}/{checkinStatus.totalWeeks} buổi
                            </span>
                          );
                        })()}
                      </td>

                      {/* Thao tác: Nút Xoá môn học (Chuẩn Icon-only theo Design System) */}
                      <td className="py-3 px-3.5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setSubjectToDelete(subject)}
                            className="h-8 w-8 rounded-md border-border/80 text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/10 transition-all active:scale-95"
                            title={`Xoá môn học [${subject.code}] ${subject.name}`}
                            aria-label={`Xoá môn học [${subject.code}] ${subject.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-lg border border-border/60 bg-card">
          <Search className="h-10 w-10 text-muted-foreground/60 mb-3" />
          <h4 className="font-bold text-base text-foreground">
            Không tìm thấy môn học phù hợp
          </h4>
          <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
            Không có môn học nào khớp với điều kiện tìm kiếm. Hãy thử tìm từ khóa khác hoặc thiết lập lại bộ lọc.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setSelectedSemester("ALL");
              setSelectedCategory("ALL");
              setSelectedCredits("ALL");
            }}
            className="rounded-md text-xs transition-colors active:scale-95"
          >
            Xóa bộ lọc tìm kiếm
          </Button>
        </div>
      )}

      {/* Dialog xác nhận xoá môn học (cho List view) */}
      <AlertDialog
        open={!!subjectToDelete}
        onOpenChange={(open) => !open && setSubjectToDelete(null)}
      >
        <AlertDialogContent className="rounded-lg max-w-md border border-border/80">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              Xác nhận xoá môn học
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Bạn có chắc chắn muốn xoá môn học{" "}
              <strong className="text-foreground">
                {subjectToDelete?.code} - {subjectToDelete?.name}
              </strong>
              ? Toàn bộ dữ liệu của môn học này sẽ bị xoá và không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="text-xs h-9 rounded-md font-semibold">
              Huỷ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (subjectToDelete) {
                  onDelete(subjectToDelete.id);
                  setSubjectToDelete(null);
                }
              }}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs h-9 rounded-md font-bold"
            >
              Xoá môn học
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

