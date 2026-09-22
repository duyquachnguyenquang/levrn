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
  X,
  LayoutGrid,
  List,
  Folder,
  Globe,
  ExternalLink,
  Pencil,
  Trash2,
  GraduationCap,
} from "lucide-react";

interface SubjectListProps {
  subjects: Subject[];
  isLoading: boolean;
  onAddNew: () => void;
  onEdit: (subject: Subject) => void;
  onDelete: (id: string) => void;
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
}: SubjectListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSemester, setSelectedSemester] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedCredits, setSelectedCredits] = useState<string>("ALL");
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);

  const semesterOptions = useMemo(() => {
    return Array.from(new Set(subjects.map((s) => s.semester))).filter(Boolean);
  }, [subjects]);

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

  const filteredSubjects = useMemo(() => {
    return subjects.filter((subject) => {
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        subject.name.toLowerCase().includes(query) ||
        subject.code.toLowerCase().includes(query) ||
        (subject.category && subject.category.toLowerCase().includes(query));

      const matchSemester =
        selectedSemester === "ALL" || subject.semester === selectedSemester;

      const matchCategory =
        selectedCategory === "ALL" || subject.category === selectedCategory;

      const matchCredits =
        selectedCredits === "ALL" ||
        (subject.credits !== undefined &&
          String(subject.credits) === selectedCredits);

      return matchSearch && matchSemester && matchCategory && matchCredits;
    });
  }, [subjects, searchQuery, selectedSemester, selectedCategory, selectedCredits]);

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
      {/* Thanh công cụ: Tìm kiếm + Nút Bộ lọc Popover + Chuyển đổi Grid/List */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-2.5 rounded-lg border border-border/70 shadow-xs">
        {/* Input Tìm kiếm */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm môn học"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8 h-10 text-xs sm:text-sm bg-background/60 rounded-md border-border/60 focus-visible:ring-[#7D39EB] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Cụm công cụ bên phải: Nút 'Bộ lọc' + Nút chuyển Grid/List */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          {/* Nút Bộ lọc duy nhất (icon bộ lọc) với Popover chứa 3 drop-box */}
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`h-10 px-3 rounded-md text-xs font-bold gap-2 border-border/80 transition-all active:scale-95 ${
                  isFilterActive
                    ? "border-[#7D39EB] text-[#7D39EB] bg-[#7D39EB]/10"
                    : "text-muted-foreground hover:text-foreground hover:border-[#7D39EB]/40"
                }`}
                title="Bộ lọc môn học"
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Bộ lọc</span>
                {activeFilterCount > 0 && (
                  <span className="h-5 w-5 rounded-full bg-[#7D39EB] text-white text-[10px] flex items-center justify-center font-black">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-72 p-4 rounded-xl border border-border/80 shadow-2xl bg-card text-foreground space-y-3 z-50"
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
                <label className="text-[11px] font-bold text-muted-foreground">
                  Học kỳ
                </label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="w-full h-9 text-xs font-semibold rounded-md border border-border/80 bg-background px-2.5 py-1 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7D39EB] transition-all"
                >
                  <option value="ALL">Tất cả học kỳ</option>
                  {semesterOptions.map((sem) => (
                    <option key={sem} value={sem}>
                      {sem}
                    </option>
                  ))}
                </select>
              </div>

              {/* Drop-box 2: Phân loại */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground">
                  Phân loại
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
                <label className="text-[11px] font-bold text-muted-foreground">
                  Số tín chỉ
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
          <div className="flex items-center p-0.5 bg-muted/60 rounded-md border border-border/70 h-10">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`h-8.5 px-2.5 rounded-sm flex items-center gap-1 text-xs transition-all active:scale-95 ${
                viewMode === "grid"
                  ? "bg-card text-foreground shadow-xs font-bold border border-border/40"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Xem dạng khối (5 môn/hàng)"
              aria-label="Xem dạng khối"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`h-8.5 px-2.5 rounded-sm flex items-center gap-1 text-xs transition-all active:scale-95 ${
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

      {/* Hiển thị danh sách môn học theo chế độ Grid (5 môn/hàng) hoặc List */}
      {filteredSubjects.length > 0 ? (
        viewMode === "grid" ? (
          /* Khối: mật độ hiển thị 5 môn/hàng trên màn hình lớn */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
            {filteredSubjects.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        ) : (
          /* List: Bảng phân chia các cột rõ ràng */
          <div className="overflow-x-auto rounded-lg border border-border/80 bg-card shadow-xs">
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
                        <span
                          className="font-mono font-black text-xs px-2 py-0.5 rounded-md inline-block shadow-2xs"
                          style={{
                            backgroundColor: `${cardColor}20`,
                            color: cardColor,
                            border: `1px solid ${cardColor}40`,
                          }}
                        >
                          {subject.code}
                        </span>
                      </td>

                      {/* Tên môn */}
                      <td className="py-3 px-3.5">
                        <button
                          type="button"
                          onClick={() => onEdit(subject)}
                          className="font-bold text-sm text-foreground hover:text-[#7D39EB] transition-colors text-left line-clamp-1 group-hover:text-[#7D39EB]"
                          title={subject.name}
                        >
                          {subject.name}
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

                      {/* Thao tác: 2 nút Chỉnh sửa & Xoá */}
                      <td className="py-3 px-3.5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(subject)}
                            className="h-8 px-2.5 rounded-md text-xs font-bold gap-1.5 border-border/80 text-foreground hover:border-[#7D39EB]/50 hover:bg-[#7D39EB]/10 hover:text-[#7D39EB] transition-all active:scale-95"
                            title="Chỉnh sửa môn học"
                          >
                            <Pencil className="h-3.5 w-3.5 text-[#7D39EB]" />
                            <span>Chỉnh sửa</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSubjectToDelete(subject)}
                            className="h-8 px-2.5 rounded-md text-xs font-bold gap-1.5 border-border/80 text-destructive hover:border-destructive/40 hover:bg-destructive/10 transition-all active:scale-95"
                            title="Xoá môn học"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Xoá</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
        <AlertDialogContent className="rounded-xl max-w-md border border-border/80">
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

