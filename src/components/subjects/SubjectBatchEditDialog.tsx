"use client";

import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Subject,
  SubjectFormData,
  SubjectCategory,
  SUBJECT_CATEGORIES,
  DEFAULT_CATEGORY_COLORS,
} from "@/lib/types";
import {
  CAMPUSES,
  CampusInfo,
  STUDY_SHIFTS,
  StudyShift,
  getCampusByName,
} from "@/lib/studyShifts";
import { CURRENT_SEMESTER, DEFAULT_SEMESTER_OPTIONS } from "@/lib/semesterUtils";
import {
  Layers,
  X,
  MapPin,
  Clock,
  Calendar,
  Tag,
  GraduationCap,
  BookOpen,
  Building,
  User,
  Folder,
  Globe,
  Check,
  Search,
  ArrowRight,
  Sparkles,
  CheckSquare,
  Square,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export type BatchFieldCategory =
  | "campus"
  | "shift"
  | "semester"
  | "category"
  | "credits"
  | "totalWeeks"
  | "room"
  | "instructor"
  | "driveUrl"
  | "courseUrl";

interface SubjectBatchEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: Subject[];
  availableSemesters: string[];
  onBatchUpdate: (
    ids: string[],
    updates: Partial<SubjectFormData>
  ) => Promise<{ success: boolean; count: number; error?: string }>;
}

export function SubjectBatchEditDialog({
  open,
  onOpenChange,
  subjects,
  availableSemesters,
  onBatchUpdate,
}: SubjectBatchEditDialogProps) {
  // 1. State Hạng mục đang chọn
  const [selectedField, setSelectedField] = useState<BatchFieldCategory>("campus");

  // 2. State các giá trị cấu hình cho từng hạng mục
  const [campusId, setCampusId] = useState<string>("cs1");
  const [shiftId, setShiftId] = useState<number>(1);
  const [semesterValue, setSemesterValue] = useState<string>(CURRENT_SEMESTER);
  const [categoryValue, setCategoryValue] = useState<SubjectCategory>("Môn đại cương");
  const [creditsValue, setCreditsValue] = useState<number>(3);
  const [totalWeeksValue, setTotalWeeksValue] = useState<number>(15);
  const [roomValue, setRoomValue] = useState<string>("");
  const [instructorValue, setInstructorValue] = useState<string>("");
  const [driveUrlValue, setDriveUrlValue] = useState<string>("");
  const [courseUrlValue, setCourseUrlValue] = useState<string>("");

  // 3. State chọn môn học
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [semesterFilter, setSemesterFilter] = useState<string>("ALL");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Danh sách các phòng học và giảng viên có sẵn trong hệ thống để gợi ý
  const existingRooms = useMemo(() => {
    return Array.from(new Set(subjects.map((s) => s.room).filter(Boolean))) as string[];
  }, [subjects]);

  const existingInstructors = useMemo(() => {
    return Array.from(new Set(subjects.map((s) => s.instructor).filter(Boolean))) as string[];
  }, [subjects]);

  // Danh sách học kỳ gợi ý
  const allSemesterOptions = useMemo(() => {
    return Array.from(new Set([...DEFAULT_SEMESTER_OPTIONS, ...availableSemesters])).filter(Boolean);
  }, [availableSemesters]);

  // Lọc môn học theo tìm kiếm và học kỳ
  const filteredSubjects = useMemo(() => {
    return subjects.filter((subject) => {
      const matchSearch =
        !searchQuery.trim() ||
        subject.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        subject.code.toLowerCase().includes(searchQuery.toLowerCase().trim());

      const matchSemester =
        semesterFilter === "ALL" || subject.semester === semesterFilter;

      return matchSearch && matchSemester;
    });
  }, [subjects, searchQuery, semesterFilter]);

  // Toggle chọn một môn
  const toggleSelectSubject = (id: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Chọn tất cả môn đang hiển thị
  const handleSelectAll = () => {
    const currentIds = filteredSubjects.map((s) => s.id);
    const allSelected = currentIds.every((id) => selectedSubjectIds.includes(id));
    if (allSelected) {
      // Bỏ chọn các môn trong currentIds
      setSelectedSubjectIds((prev) => prev.filter((id) => !currentIds.includes(id)));
    } else {
      // Thêm các môn trong currentIds
      setSelectedSubjectIds((prev) => Array.from(new Set([...prev, ...currentIds])));
    }
  };

  // Chọn nhanh những môn chưa có dữ liệu ở hạng mục đang chọn
  const handleSelectMissing = () => {
    const missingIds = filteredSubjects
      .filter((sub) => {
        switch (selectedField) {
          case "campus":
            return !sub.campus || sub.campus.trim() === "";
          case "shift":
            return !sub.startTime || !sub.endTime;
          case "semester":
            return !sub.semester || sub.semester === "Chưa xếp kỳ";
          case "category":
            return !sub.category;
          case "credits":
            return sub.credits === undefined || sub.credits === null;
          case "totalWeeks":
            return !sub.totalWeeks;
          case "room":
            return !sub.room || sub.room.trim() === "";
          case "instructor":
            return !sub.instructor || sub.instructor.trim() === "";
          case "driveUrl":
            return !sub.driveUrl || sub.driveUrl.trim() === "";
          case "courseUrl":
            return !sub.courseUrl || sub.courseUrl.trim() === "";
          default:
            return false;
        }
      })
      .map((s) => s.id);

    setSelectedSubjectIds(missingIds);
  };

  // Lấy giá trị hiện tại của môn học
  const getCurrentFieldValue = (sub: Subject): string => {
    switch (selectedField) {
      case "campus":
        return sub.campus || "Chưa có cơ sở";
      case "shift":
        return sub.startTime && sub.endTime
          ? `${sub.startTime} - ${sub.endTime}`
          : "Chưa có giờ";
      case "semester":
        return sub.semester || "Chưa xếp kỳ";
      case "category":
        return sub.category || "Chưa phân loại";
      case "credits":
        return sub.credits !== undefined ? `${sub.credits} TC` : "Chưa có TC";
      case "totalWeeks":
        return `${sub.totalWeeks || 15} tuần`;
      case "room":
        return sub.room ? `Phòng ${sub.room}` : "Chưa có phòng";
      case "instructor":
        return sub.instructor || "Chưa có GV";
      case "driveUrl":
        return sub.driveUrl ? "Đã có Drive" : "Chưa có link";
      case "courseUrl":
        return sub.courseUrl ? "Đã có LMS" : "Chưa có link";
      default:
        return "—";
    }
  };

  // Lấy giá trị mới sẽ thay đổi
  const getNewFieldValueDisplay = (): string => {
    switch (selectedField) {
      case "campus": {
        const c = CAMPUSES.find((item) => item.id === campusId);
        return c?.name || "Cơ sở đã chọn";
      }
      case "shift": {
        const s = STUDY_SHIFTS.find((item) => item.id === shiftId);
        return s ? `${s.name} (${s.startTime} - ${s.endTime})` : "Ca học đã chọn";
      }
      case "semester":
        return semesterValue || "Học kỳ mới";
      case "category":
        return categoryValue;
      case "credits":
        return `${creditsValue} TC`;
      case "totalWeeks":
        return `${totalWeeksValue} tuần`;
      case "room":
        return roomValue.trim() ? `Phòng ${roomValue.trim()}` : "Chưa nhập phòng";
      case "instructor":
        return instructorValue.trim() || "Chưa nhập GV";
      case "driveUrl":
        return driveUrlValue.trim() ? "Link Drive mới" : "Chưa nhập link";
      case "courseUrl":
        return courseUrlValue.trim() ? "Link LMS mới" : "Chưa nhập link";
      default:
        return "";
    }
  };

  // Xử lý gửi cập nhật hàng loạt
  const handleApplyBatch = async () => {
    if (selectedSubjectIds.length === 0) {
      setErrorMessage("Vui lòng click chọn ít nhất một môn học cần thay đổi.");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    const updatePayload: Partial<SubjectFormData> = {};

    switch (selectedField) {
      case "campus": {
        const c = CAMPUSES.find((item) => item.id === campusId);
        if (c) {
          updatePayload.campus = c.name;
          updatePayload.mapUrl = c.mapUrl;
        }
        break;
      }
      case "shift": {
        const s = STUDY_SHIFTS.find((item) => item.id === shiftId);
        if (s) {
          updatePayload.startTime = s.startTime;
          updatePayload.endTime = s.endTime;
        }
        break;
      }
      case "semester": {
        const trimmed = semesterValue.trim();
        updatePayload.semester = trimmed;
        const match = trimmed.match(/^(HK\d+|HK hè)\s*(.*)$/i);
        if (match) {
          updatePayload.term = match[1] as any;
          updatePayload.academicYear = match[2];
        }
        break;
      }
      case "category":
        updatePayload.category = categoryValue;
        updatePayload.color = DEFAULT_CATEGORY_COLORS[categoryValue] || "#7D39EB";
        break;
      case "credits":
        updatePayload.credits = Number(creditsValue);
        break;
      case "totalWeeks":
        updatePayload.totalWeeks = Number(totalWeeksValue);
        break;
      case "room":
        updatePayload.room = roomValue.trim();
        break;
      case "instructor":
        updatePayload.instructor = instructorValue.trim();
        break;
      case "driveUrl":
        updatePayload.driveUrl = driveUrlValue.trim() || undefined;
        break;
      case "courseUrl":
        updatePayload.courseUrl = courseUrlValue.trim() || undefined;
        break;
    }

    try {
      const res = await onBatchUpdate(selectedSubjectIds, updatePayload);
      if (res.success) {
        setSuccessMessage(`Đã cập nhật thành công cho ${res.count} môn học!`);
        setTimeout(() => {
          setSelectedSubjectIds([]);
          setSuccessMessage(null);
          onOpenChange(false);
        }, 1200);
      } else {
        setErrorMessage(res.error || "Không thể cập nhật các môn học.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Đã xảy ra lỗi trong quá trình cập nhật.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[92vh] flex flex-col p-4 sm:p-6 border-border shadow-2xl rounded-lg bg-card [&>button.absolute]:hidden">
        {/* HEADER: Tiêu đề và nút đóng cùng một hàng, đồng kích thước h-8 w-8 */}
        <DialogHeader className="pb-3 border-b border-border/50 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-black text-foreground">
              <div className="h-8 w-8 rounded-md bg-[#7D39EB]/15 flex items-center justify-center text-[#7D39EB] shrink-0">
                <Layers className="h-4 w-4" />
              </div>
              <span className="truncate">Chỉnh sửa hàng loạt</span>
            </DialogTitle>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 rounded-md border border-border/80 bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all active:scale-95 shadow-2xs shrink-0"
              title="Đóng hộp thoại"
              aria-label="Đóng hộp thoại"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="sr-only">
            Hộp thoại cho phép chọn hạng mục chỉnh sửa theo bộ thông tin đã nạp và áp dụng cho các môn đã chọn.
          </DialogDescription>
        </DialogHeader>

        {/* THÔNG BÁO KẾT QUẢ NẾU CÓ */}
        {successMessage && (
          <div className="mt-2 p-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in-50">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-2 p-2.5 rounded-md bg-destructive/10 border border-destructive/30 flex items-center gap-2 text-xs font-bold text-destructive animate-in fade-in-50">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* NỘI DUNG CUỘN TRONG DIALOG */}
        <div className="space-y-4 my-2 overflow-y-auto flex-1 pr-1">
          {/* PHẦN 1: CÁC TRƯỜNG ĐỒNG CẤP, KHÔNG ĐÓNG KHUNG BAO NGOÀI, KHÔNG ĐÁNH SỐ, KHÔNG EMOJI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
            {/* Chọn Hạng mục */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#7D39EB]" />
                <span>Hạng mục</span>
              </Label>
              <select
                value={selectedField}
                onChange={(e) => setSelectedField(e.target.value as BatchFieldCategory)}
                className="w-full h-9 rounded-md border border-border bg-background px-2.5 text-xs font-bold text-foreground focus:outline-hidden focus:ring-1 focus:ring-[#7D39EB]"
              >
                <option value="campus">Cơ sở học & Google Maps</option>
                <option value="shift">Ca học & Giờ học</option>
                <option value="semester">Học kỳ</option>
                <option value="category">Phân loại môn & Màu sắc</option>
                <option value="credits">Số tín chỉ</option>
                <option value="totalWeeks">Số tuần học</option>
                <option value="room">Phòng học</option>
                <option value="instructor">Giảng viên</option>
                <option value="driveUrl">Google Drive</option>
                <option value="courseUrl">Link Course / LMS</option>
              </select>
            </div>

            {/* Chọn Giá trị tương ứng */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#7D39EB]" />
                <span>Giá trị</span>
              </Label>

                {/* A. CƠ SỞ HỌC */}
                {selectedField === "campus" && (
                  <select
                    value={campusId}
                    onChange={(e) => setCampusId(e.target.value)}
                    className="w-full h-9 rounded-md border border-border bg-background px-2.5 text-xs font-bold text-foreground focus:outline-hidden focus:ring-1 focus:ring-[#7D39EB]"
                  >
                    {CAMPUSES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.address})
                      </option>
                    ))}
                  </select>
                )}

                {/* B. CA HỌC CHUẨN */}
                {selectedField === "shift" && (
                  <select
                    value={shiftId}
                    onChange={(e) => setShiftId(Number(e.target.value))}
                    className="w-full h-9 rounded-md border border-border bg-background px-2.5 text-xs font-bold text-foreground focus:outline-hidden focus:ring-1 focus:ring-[#7D39EB]"
                  >
                    {STUDY_SHIFTS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.startTime} - {s.endTime})
                      </option>
                    ))}
                  </select>
                )}

                {/* C. HỌC KỲ */}
                {selectedField === "semester" && (
                  <div className="flex items-center gap-1.5">
                    <select
                      value={semesterValue}
                      onChange={(e) => setSemesterValue(e.target.value)}
                      className="w-full h-9 rounded-md border border-border bg-background px-2.5 text-xs font-bold text-foreground focus:outline-hidden focus:ring-1 focus:ring-[#7D39EB]"
                    >
                      {allSemesterOptions.map((sem) => (
                        <option key={sem} value={sem}>
                          {sem}
                        </option>
                      ))}
                      <option value="Chưa xếp kỳ">Chưa xếp kỳ</option>
                    </select>
                  </div>
                )}

                {/* D. PHÂN LOẠI MÔN */}
                {selectedField === "category" && (
                  <select
                    value={categoryValue}
                    onChange={(e) => setCategoryValue(e.target.value as SubjectCategory)}
                    className="w-full h-9 rounded-md border border-border bg-background px-2.5 text-xs font-bold text-foreground focus:outline-hidden focus:ring-1 focus:ring-[#7D39EB]"
                  >
                    {SUBJECT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                )}

                {/* E. SỐ TÍN CHỈ */}
                {selectedField === "credits" && (
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((tc) => (
                      <button
                        key={tc}
                        type="button"
                        onClick={() => setCreditsValue(tc)}
                        className={`flex-1 h-9 rounded-md text-xs font-bold border transition-all ${
                          creditsValue === tc
                            ? "bg-[#7D39EB] text-white border-[#7D39EB] shadow-xs"
                            : "bg-background border-border/80 text-foreground hover:bg-muted"
                        }`}
                      >
                        {tc} TC
                      </button>
                    ))}
                  </div>
                )}

                {/* F. SỐ TUẦN HỌC */}
                {selectedField === "totalWeeks" && (
                  <div className="flex items-center gap-1">
                    {[8, 10, 12, 15, 20].map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setTotalWeeksValue(w)}
                        className={`flex-1 h-9 rounded-md text-xs font-bold border transition-all ${
                          totalWeeksValue === w
                            ? "bg-[#7D39EB] text-white border-[#7D39EB] shadow-xs"
                            : "bg-background border-border/80 text-foreground hover:bg-muted"
                        }`}
                      >
                        {w}t
                      </button>
                    ))}
                  </div>
                )}

                {/* G. PHÒNG HỌC */}
                {selectedField === "room" && (
                  <div className="space-y-1">
                    <Input
                      placeholder="VD: B.304, A.101..."
                      value={roomValue}
                      onChange={(e) => setRoomValue(e.target.value)}
                      className="h-9 text-xs rounded-md"
                    />
                    {existingRooms.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {existingRooms.slice(0, 4).map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setRoomValue(r)}
                            className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border/40"
                          >
                            P.{r}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* H. GIẢNG VIÊN */}
                {selectedField === "instructor" && (
                  <div className="space-y-1">
                    <Input
                      placeholder="Nhập tên giảng viên phụ trách..."
                      value={instructorValue}
                      onChange={(e) => setInstructorValue(e.target.value)}
                      className="h-9 text-xs rounded-md"
                    />
                    {existingInstructors.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {existingInstructors.slice(0, 3).map((inst) => (
                          <button
                            key={inst}
                            type="button"
                            onClick={() => setInstructorValue(inst)}
                            className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border/40 truncate max-w-[120px]"
                            title={inst}
                          >
                            {inst}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* I. GOOGLE DRIVE */}
                {selectedField === "driveUrl" && (
                  <Input
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={driveUrlValue}
                    onChange={(e) => setDriveUrlValue(e.target.value)}
                    className="h-9 text-xs rounded-md font-mono"
                  />
                )}

                {/* J. LINK COURSE */}
                {selectedField === "courseUrl" && (
                  <Input
                    placeholder="https://lms.university.edu.vn/courses/..."
                    value={courseUrlValue}
                    onChange={(e) => setCourseUrlValue(e.target.value)}
                    className="h-9 text-xs rounded-md font-mono"
                  />
                )}
              </div>
            </div>

          {/* PHẦN 2: CHỌN MÔN HỌC */}
          <div className="space-y-2 pt-1">
            {/* Header: Tiêu đề + 2 nút thao tác 'Tất cả' & 'Chưa có' ngang hàng căn phải chuẩn Rule 1.13 */}
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-[#7D39EB]" />
                <span>
                  Chọn môn học (
                  <strong className="text-[#7D39EB] font-black">
                    {selectedSubjectIds.length}
                  </strong>
                  /{filteredSubjects.length})
                </span>
              </Label>

              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-7 px-2.5 text-xs font-bold rounded-md border-border/80 hover:bg-muted transition-all active:scale-95"
                  title="Chọn hoặc bỏ chọn tất cả các môn đang hiển thị"
                >
                  Tất cả
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectMissing}
                  className="h-7 px-2.5 text-xs font-bold rounded-md border-border/80 hover:border-[#7D39EB]/50 hover:bg-[#7D39EB]/10 hover:text-[#7D39EB] transition-all active:scale-95"
                  title="Tự động chọn những môn chưa có thông tin ở hạng mục này"
                >
                  Chưa có
                </Button>
              </div>
            </div>

            {/* Thanh tìm kiếm môn học độc lập: Trải đều 100% chiều ngang, không bị lấn chiếm khung */}
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Tìm môn theo tên hoặc mã môn..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-8 pr-8 text-xs rounded-md w-full border-border/80 bg-background focus-visible:ring-1 focus-visible:ring-[#7D39EB]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground cursor-pointer h-5 w-5 flex items-center justify-center rounded-sm hover:bg-muted"
                  title="Xóa tìm kiếm"
                  aria-label="Xóa tìm kiếm"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* DANH SÁCH MÔN HỌC (Click chọn trực tiếp) */}
            <div className="max-h-[280px] overflow-y-auto space-y-1.5 border border-border/70 rounded-md p-1.5 bg-background">
              {filteredSubjects.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Không tìm thấy môn học nào phù hợp.
                </div>
              ) : (
                filteredSubjects.map((sub) => {
                  const isChecked = selectedSubjectIds.includes(sub.id);
                  const currentVal = getCurrentFieldValue(sub);
                  const newVal = getNewFieldValueDisplay();
                  const cardColor = sub.color || "#7D39EB";

                  return (
                    <div
                      key={sub.id}
                      onClick={() => toggleSelectSubject(sub.id)}
                      className={`p-2 rounded-md border transition-all cursor-pointer flex items-center justify-between gap-2.5 select-none ${
                        isChecked
                          ? "bg-[#7D39EB]/10 border-[#7D39EB]/50 text-foreground shadow-2xs"
                          : "bg-card/50 border-border/60 hover:bg-muted/40 text-foreground"
                      }`}
                    >
                      {/* Cột trái: Checkbox + Mã môn + Tên môn */}
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div
                          className={`h-4.5 w-4.5 rounded flex items-center justify-center shrink-0 border transition-all ${
                            isChecked
                              ? "bg-[#7D39EB] border-[#7D39EB] text-white"
                              : "border-border bg-background"
                          }`}
                        >
                          {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>

                        <span
                          className="w-14 h-5 inline-flex items-center justify-center font-mono font-black text-[10px] rounded text-white shrink-0 text-center tracking-tight truncate px-1 shadow-2xs"
                          style={{ backgroundColor: cardColor }}
                          title={sub.code}
                        >
                          {sub.code}
                        </span>

                        <span className="font-bold text-xs truncate" title={sub.name}>
                          {sub.name}
                        </span>
                      </div>

                      {/* Cột phải: Đối chiếu Hiện tại -> Mới */}
                      <div className="flex items-center gap-1.5 text-[11px] shrink-0 text-right">
                        <span
                          className="text-muted-foreground max-w-[100px] sm:max-w-[130px] truncate font-medium"
                          title={`Hiện tại: ${currentVal}`}
                        >
                          {currentVal}
                        </span>

                        {isChecked && (
                          <>
                            <ArrowRight className="h-3 w-3 text-[#7D39EB] shrink-0" />
                            <span
                              className="font-bold text-[#7D39EB] max-w-[110px] sm:max-w-[140px] truncate"
                              title={`Mới: ${newVal}`}
                            >
                              {newVal}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* FOOTER: Hủy bỏ & Áp dụng */}
        <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="h-9 px-4 rounded-md text-xs font-bold border-border/80 active:scale-95"
          >
            Hủy bỏ
          </Button>

          <Button
            type="button"
            onClick={handleApplyBatch}
            disabled={isSubmitting || selectedSubjectIds.length === 0}
            className="h-9 px-4 rounded-md text-xs font-black bg-[#C6FF33] hover:bg-[#B5F51B] text-black shadow-md transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Đang cập nhật...</span>
            ) : (
              <>
                <Check className="h-4 w-4 stroke-[3]" />
                <span>Áp dụng</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
