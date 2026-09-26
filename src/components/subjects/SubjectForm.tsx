"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Subject,
  SubjectFormData,
  SubjectCategory,
  SUBJECT_CATEGORIES,
  DEFAULT_CATEGORY_COLORS,
  ACADEMIC_TERMS,
  AcademicTerm,
  WEEKDAYS,
} from "@/lib/types";
import {
  Sparkles,
  ExternalLink,
  Calendar,
  CheckCircle2,
  Info,
  BookOpen,
  Hash,
  GraduationCap,
  CalendarRange,
  Clock,
  Tag,
  Globe,
  Folder,
  Plus,
  Hourglass,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  MapPin,
  Image as ImageIcon,
  Pencil,
  Trash2,
} from "lucide-react";
import { IMAGE_PRESETS, getSubjectCoverImage } from "@/lib/imagePresets";
import { ChangeCoverDialog } from "@/components/ui/change-cover-dialog";
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

// Danh sách năm học gợi ý
const PRESET_ACADEMIC_YEARS = [
  "2023-2024",
  "2024-2025",
  "2025-2026",
  "2026-2027",
  "2027-2028",
  "2028-2029",
];

const CATEGORY_COLORS_STORAGE_KEY = "levrn_category_colors";

interface SubjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    data: SubjectFormData
  ) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  initialData?: Subject | null;
  mode: "create" | "edit";
  onDelete?: (id: string) => void;
  onUpdateSubject?: (id: string, updates: Partial<Subject>) => void;
}

// Tính ngày kết thúc dự kiến dựa vào ngày bắt đầu và số tuần
function computeEndDate(startStr: string, weeks: number): string {
  if (!startStr || isNaN(weeks) || weeks <= 0) return "";
  const d = new Date(startStr);
  if (isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + weeks * 7 - 1);
  return d.toISOString().split("T")[0];
}

// Định dạng hiển thị ngày tiếng Việt (DD/MM/YYYY)
function formatDateVi(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Component chọn ngày thông minh (Smart Date Picker) theo nhận diện thương hiệu LEVRN
 */
interface SmartDatePickerProps {
  id?: string;
  value: string;
  onChange: (val: string) => void;
}

function SmartDatePicker({ id, value, onChange }: SmartDatePickerProps) {
  const [open, setOpen] = useState(false);
  const initialDate = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear() || new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(
    !isNaN(initialDate.getMonth()) ? initialDate.getMonth() : new Date().getMonth()
  );

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const formattedMonth = String(viewMonth + 1).padStart(2, "0");
    const formattedDay = String(day).padStart(2, "0");
    onChange(`${viewYear}-${formattedMonth}-${formattedDay}`);
    setOpen(false);
  };

  const handleSelectToday = (e: React.MouseEvent) => {
    e.preventDefault();
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    onChange(`${y}-${m}-${d}`);
    setViewYear(y);
    setViewMonth(today.getMonth());
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange("");
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;

  const monthNames = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];
  const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  const today = new Date();
  const isCurrentMonthToday = today.getFullYear() === viewYear && today.getMonth() === viewMonth;
  const todayDate = today.getDate();

  const selectedDateObj = value ? new Date(value) : null;
  const isSelectedMonth = selectedDateObj && selectedDateObj.getFullYear() === viewYear && selectedDateObj.getMonth() === viewMonth;
  const selectedDay = isSelectedMonth ? selectedDateObj.getDate() : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          className="flex h-10 w-full items-center justify-between rounded-md border border-border/80 bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#7D39EB] transition-all hover:border-[#7D39EB]/50"
        >
          <div className="flex items-center gap-2 truncate">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className={value ? "text-foreground font-semibold" : "text-muted-foreground"}>
              {value ? formatDateVi(value) : "Chọn ngày..."}
            </span>
          </div>
          {value ? (
            <span
              role="button"
              onClick={handleClear}
              className="p-1 hover:bg-muted rounded-sm text-muted-foreground hover:text-foreground transition-colors"
              title="Xóa ngày"
            >
              <X className="h-3 w-3" />
            </span>
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground opacity-50" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-3 rounded-lg border border-border/80 shadow-2xl bg-card text-foreground z-50">
        {/* Thanh điều hướng tháng/năm */}
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
            aria-label="Tháng trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-black tracking-tight">
            {monthNames[viewMonth]} {viewYear}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
            aria-label="Tháng sau"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Thứ trong tuần */}
        <div className="grid grid-cols-7 gap-1 text-center py-2 text-[10px] font-bold text-muted-foreground">
          {dayNames.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* Các ngày trong tháng */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="h-7 w-7" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const isSelected = selectedDay === day;
            const isToday = isCurrentMonthToday && todayDate === day;
            return (
              <button
                key={day}
                type="button"
                onClick={() => handleSelectDay(day)}
                className={`h-7 w-7 rounded-md text-xs font-semibold flex items-center justify-center transition-all ${
                  isSelected
                    ? "bg-[#7D39EB] text-white shadow-sm font-bold"
                    : isToday
                    ? "border border-[#C6FF33] text-[#7D39EB] dark:text-[#C6FF33] font-bold hover:bg-muted"
                    : "hover:bg-muted text-foreground/90"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Phím tắt chọn nhanh */}
        <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-border/60 text-[11px]">
          <button
            type="button"
            onClick={handleSelectToday}
            className="font-bold text-[#7D39EB] hover:underline"
          >
            Hôm nay
          </button>
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              Xóa chọn
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function SubjectForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode,
  onDelete,
  onUpdateSubject,
}: SubjectFormProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCoverDialog, setShowCoverDialog] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [academicYear, setAcademicYear] = useState("2024-2025");
  const [term, setTerm] = useState<AcademicTerm>("HK1");
  const [credits, setCredits] = useState<string>("");
  
  // Phân loại và màu theo phân loại
  const [category, setCategory] = useState<SubjectCategory>("Môn chuyên ngành");
  const [categoryColors, setCategoryColors] = useState<Record<SubjectCategory, string>>(DEFAULT_CATEGORY_COLORS);

  // Link Course và Google Drive & Ảnh bìa
  const [courseUrl, setCourseUrl] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [driveHelpNotice, setDriveHelpNotice] = useState<string | null>(null);

  // Lịch học
  const [startDate, setStartDate] = useState("");
  const [totalWeeks, setTotalWeeks] = useState<string>("15");
  const [scheduleDays, setScheduleDays] = useState<number[]>([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Địa điểm học
  const [room, setRoom] = useState("");
  const [campus, setCampus] = useState("");
  const [mapUrl, setMapUrl] = useState("");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(mode === "create");

  // Tải bảng màu phân loại từ localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CATEGORY_COLORS_STORAGE_KEY);
      if (saved) {
        setCategoryColors({ ...DEFAULT_CATEGORY_COLORS, ...JSON.parse(saved) });
      }
    } catch {
      // ignore
    }
  }, []);

  // Cập nhật màu cho phân loại
  const handleCategoryColorChange = (newColor: string) => {
    const updated = { ...categoryColors, [category]: newColor };
    setCategoryColors(updated);
    try {
      localStorage.setItem(CATEGORY_COLORS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Khởi tạo dữ liệu form khi mở hoặc chuyển mode
  useEffect(() => {
    setIsEditing(mode === "create");
    if (initialData && mode === "edit") {
      setCode(initialData.code);
      setName(initialData.name);
      
      // Tách học kỳ thành Năm học và Kỳ học
      if (initialData.academicYear && initialData.term) {
        setAcademicYear(initialData.academicYear);
        setTerm(initialData.term);
      } else if (initialData.semester) {
        const parts = initialData.semester.split(" ");
        if (parts.length >= 2) {
          const possibleTerm = parts[0] as AcademicTerm;
          if (ACADEMIC_TERMS.includes(possibleTerm)) {
            setTerm(possibleTerm);
            setAcademicYear(parts.slice(1).join(" "));
          } else {
            setAcademicYear(initialData.semester);
          }
        } else {
          setAcademicYear(initialData.semester);
        }
      } else {
        setAcademicYear("2024-2025");
        setTerm("HK1");
      }

      setCredits(initialData.credits ? String(initialData.credits) : "");
      setCategory(initialData.category || "Môn chuyên ngành");
      setCourseUrl(initialData.courseUrl || "");
      setDriveUrl(initialData.driveUrl || "");
      setImageUrl(initialData.imageUrl || "");
      setPreviewError(false);
      setStartDate(initialData.startDate || "");
      setTotalWeeks(initialData.totalWeeks ? String(initialData.totalWeeks) : "15");
      setScheduleDays(
        initialData.scheduleDays && initialData.scheduleDays.length > 0
          ? initialData.scheduleDays
          : initialData.startDate
          ? [new Date(initialData.startDate).getDay()]
          : []
      );
      setStartTime(initialData.startTime || "");
      setEndTime(initialData.endTime || "");
      setRoom(initialData.room || "");
      setCampus(initialData.campus || "");
      setMapUrl(initialData.mapUrl || "");
    } else {
      setCode("");
      setName("");
      setAcademicYear("2024-2025");
      setTerm("HK1");
      setCredits("");
      setCategory("Môn chuyên ngành");
      setCourseUrl("");
      setDriveUrl("");
      setImageUrl("");
      setPreviewError(false);
      setTotalWeeks("15");
      setScheduleDays([]);
      setStartTime("");
      setEndTime("");
      setRoom("");
      setCampus("");
      setMapUrl("");
    }
    setErrorMessage(null);
    setDriveHelpNotice(null);
  }, [initialData, mode, open]);

  // Xử lý khi đổi ngày bắt đầu: tự động chọn thứ tương ứng nếu chưa chọn thứ nào
  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (val && scheduleDays.length === 0) {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        setScheduleDays([d.getDay()]);
      }
    }
  };

  const toggleScheduleDay = (dayValue: number) => {
    setScheduleDays((prev) =>
      prev.includes(dayValue)
        ? prev.filter((d) => d !== dayValue)
        : [...prev, dayValue].sort((a, b) => a - b)
    );
  };

  // Xử lý mã môn: Viết hoa, tối đa 10 ký tự chữ và số
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    if (rawValue.length <= 10) {
      setCode(rawValue);
      setErrorMessage(null);
    }
  };

  // Nút '+' (Tạo Drive)
  const handleCreateDrive = () => {
    const folderName = `[${code.trim() || "MÔN"}] ${name.trim() || "Môn học"}`;
    
    // Sao chép tên thư mục vào clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(folderName).catch(() => {});
    }

    // Mở Google Drive trong tab mới
    window.open("https://drive.google.com/drive/my-drive", "_blank", "noopener,noreferrer");

    // Thông báo hướng dẫn
    setDriveHelpNotice(
      `Đã sao chép "${folderName}" vào bộ nhớ tạm và mở Google Drive! Hãy dán tên tạo thư mục rồi dán link vào ô Google Drive.`
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanCode = code.trim().toUpperCase();
    if (!name.trim()) {
      setErrorMessage("Vui lòng nhập tên môn học.");
      return;
    }
    if (cleanCode.length < 2) {
      setErrorMessage("Mã môn học phải gồm ít nhất 2 ký tự (VD: MAT, CS101).");
      return;
    }
    if (!academicYear.trim()) {
      setErrorMessage("Vui lòng chọn hoặc nhập năm học.");
      return;
    }

    const weeksNum = totalWeeks ? parseInt(totalWeeks, 10) : 15;
    const computedEndDate = startDate ? computeEndDate(startDate, weeksNum) : undefined;
    const activeColor = categoryColors[category] || DEFAULT_CATEGORY_COLORS[category] || "#7D39EB";
    const combinedSemester = `${term} ${academicYear.trim()}`;

    const payload: SubjectFormData = {
      code: cleanCode,
      name: name.trim(),
      academicYear: academicYear.trim(),
      term,
      semester: combinedSemester,
      credits: credits ? parseInt(credits, 10) : undefined,
      category,
      color: activeColor,
      courseUrl: courseUrl.trim() || undefined,
      driveUrl: driveUrl.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      startDate: startDate || undefined,
      totalWeeks: weeksNum > 0 ? weeksNum : undefined,
      endDate: computedEndDate,
      scheduleDays: scheduleDays.length > 0 ? scheduleDays : (startDate ? [new Date(startDate).getDay()] : undefined),
      startTime: startTime.trim() || undefined,
      endTime: endTime.trim() || undefined,
      room: room.trim() || undefined,
      campus: campus.trim() || undefined,
      mapUrl: mapUrl.trim() || (campus.trim() ? `https://maps.google.com/?q=${encodeURIComponent(campus.trim())}` : undefined),
    };

    setIsSubmitting(true);
    try {
      const result = await onSubmit(payload);
      if (result.success) {
        onOpenChange(false);
      } else if (result.error) {
        setErrorMessage(result.error);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Đã xảy ra lỗi khi lưu môn học.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeColor = categoryColors[category] || DEFAULT_CATEGORY_COLORS[category] || "#7D39EB";
  const weeksNum = parseInt(totalWeeks || "0", 10);
  const previewEndDate = startDate && weeksNum > 0 ? computeEndDate(startDate, weeksNum) : "";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[580px] max-h-[92vh] overflow-y-auto rounded-lg p-6 border-border shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150 [&>button.absolute]:hidden">
        {/* HEADER: Tiêu đề, Chỉnh sửa và Thoát trên CÙNG MỘT HÀNG, 2 nút cùng kích thước h-8 w-8 */}
        <DialogHeader className="pb-3 border-b border-border/50">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold text-foreground min-w-0 truncate">
              {mode === "create" ? (
                <>
                  <Sparkles className="h-5 w-5 text-[#7D39EB] shrink-0" />
                  <span className="truncate">Thêm môn học mới</span>
                </>
              ) : isEditing ? (
                <>
                  <Pencil className="h-5 w-5 text-[#7D39EB] shrink-0" />
                  <span className="truncate">Chỉnh sửa môn học</span>
                </>
              ) : (
                <>
                  <BookOpen className="h-5 w-5 text-[#7D39EB] shrink-0" />
                  <span className="truncate">Chi tiết môn học</span>
                </>
              )}
            </DialogTitle>

            {/* Cặp nút [Chỉnh sửa] và [Thoát/X]: CÙNG HÀNG, CÙNG KÍCH THƯỚC CHUẨN h-8 w-8 */}
            <div className="flex items-center gap-1.5 shrink-0">
              {mode === "edit" && (
                <Button
                  type="button"
                  variant={isEditing ? "default" : "outline"}
                  size="icon"
                  onClick={() => {
                    setIsEditing(!isEditing);
                    setErrorMessage(null);
                  }}
                  className={`h-8 w-8 rounded-md transition-all active:scale-95 ${
                    isEditing
                      ? "bg-[#7D39EB] text-white hover:bg-[#682BCA] border-[#7D39EB]"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted border border-border/80 shadow-2xs"
                  }`}
                  title={isEditing ? "Hủy chỉnh sửa, quay lại xem chi tiết" : "Chỉnh sửa thông tin môn học"}
                  aria-label={isEditing ? "Hủy chỉnh sửa" : "Chỉnh sửa thông tin môn học"}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted border border-border/80 transition-all active:scale-95 shadow-2xs"
                title="Đóng hộp thoại"
                aria-label="Đóng hộp thoại"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <DialogDescription className="sr-only">
            {mode === "create" ? "Thêm môn học mới" : isEditing ? "Chỉnh sửa môn học" : "Chi tiết môn học"}
          </DialogDescription>
        </DialogHeader>

        {/* 1. CHẾ ĐỘ XEM CỐ ĐỊNH (VIEW MODE): Phân cấp rõ nét, tinh gọn, khoa học, đầy đủ chức năng */}
        {!isEditing && mode === "edit" ? (
          <div className="space-y-4 pt-3">
            {/* KHỐI 1: TÊN MÔN HỌC & CÁC BADGE NHẬN DIỆN */}
            <div className="space-y-2">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-[#7D39EB]" />
                  <span>Tên môn học</span>
                </Label>
                <div className="text-lg sm:text-xl font-black text-foreground tracking-tight leading-snug py-0.5">
                  {name || "—"}
                </div>
              </div>

              {/* Hàng 3 badges: Mã môn, Tín chỉ, Phân loại */}
              <div className="flex items-center gap-2 flex-wrap pt-0.5">
                <span className="font-mono font-black text-xs px-2.5 py-1 rounded-md bg-[#7D39EB]/15 text-[#7D39EB] border border-[#7D39EB]/30 shadow-2xs">
                  #{code || "MÃ MÔN"}
                </span>

                <span className="font-bold text-xs px-2.5 py-1 rounded-md bg-muted/80 text-foreground border border-border/70 flex items-center gap-1.5 shadow-2xs">
                  <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{credits ? `${credits} tín chỉ` : "Chưa có tín chỉ"}</span>
                </span>

                <span
                  className="font-bold text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 border shadow-2xs"
                  style={{
                    backgroundColor: `${activeColor}15`,
                    color: activeColor,
                    borderColor: `${activeColor}30`,
                  }}
                >
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: activeColor }} />
                  <span>{category}</span>
                </span>
              </div>
            </div>

            {/* KHỐI 2: HỌC KỲ & THỜI GIAN HỌC (2 CỘT CÂN ĐỐI) */}
            <div className="border-t border-border/50 pt-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Cột trái: Học kỳ & Khung giờ học */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                      <CalendarRange className="h-3.5 w-3.5 text-[#7D39EB]" />
                      <span>Học kỳ & Năm học</span>
                    </Label>
                    <div className="text-sm font-bold text-foreground">
                      {term === "HK1" ? "Học kỳ 1 (HK1)" : term === "HK2" ? "Học kỳ 2 (HK2)" : "Học kỳ hè"} • {academicYear || "—"}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-[#7D39EB]" />
                      <span>Khung giờ học</span>
                    </Label>
                    <div className="text-sm font-bold font-mono text-foreground">
                      {startTime && endTime ? `${startTime} - ${endTime}` : startTime || "Chưa cập nhật"}
                    </div>
                  </div>
                </div>

                {/* Cột phải: Thời gian khóa học & Thứ học trong tuần */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-[#7D39EB]" />
                      <span>Thời gian khóa học</span>
                    </Label>
                    <div className="text-sm font-bold text-foreground">
                      {startDate ? formatDateVi(startDate) : "Chưa có ngày bắt đầu"}
                      {previewEndDate && ` → ${formatDateVi(previewEndDate)}`}
                      <span className="text-xs text-muted-foreground font-normal ml-1">
                        ({totalWeeks ? `${totalWeeks} tuần` : "15 tuần"})
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-[#7D39EB]" />
                      <span>Thứ học trong tuần</span>
                    </Label>
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {WEEKDAYS.map((wd) => {
                        const isSelected = scheduleDays.includes(wd.value);
                        return (
                          <span
                            key={wd.value}
                            className={`h-6 px-2 rounded-md text-[11px] font-bold flex items-center justify-center border transition-all ${
                              isSelected
                                ? "bg-[#7D39EB] text-white border-[#7D39EB] shadow-2xs"
                                : "bg-muted/20 text-muted-foreground/40 border-border/40"
                            }`}
                          >
                            {wd.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* KHỐI 3: ĐỊA ĐIỂM HỌC & TÀI NGUYÊN (2 CỘT CÂN ĐỐI) */}
            <div className="border-t border-border/50 pt-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Cột trái: Phòng học & Cơ sở */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-[#7D39EB]" />
                    <span>Phòng học & Cơ sở</span>
                  </Label>
                  <div className="text-sm font-bold text-foreground">
                    {room ? `Phòng ${room}` : "Chưa cập nhật phòng"}
                    {campus && ` • ${campus}`}
                  </div>
                  {(mapUrl || campus) && (
                    <a
                      href={mapUrl || `https://maps.google.com/?q=${encodeURIComponent(campus)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline pt-0.5"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      <span>Mở bản đồ vị trí</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                {/* Cột phải: Tài nguyên học tập (Nút mở nhanh LMS & Drive) */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-[#7D39EB]" />
                    <span>Tài nguyên môn học</span>
                  </Label>
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {courseUrl ? (
                      <a
                        href={courseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-7.5 px-2.5 rounded-md bg-[#7D39EB]/10 hover:bg-[#7D39EB]/20 text-[#7D39EB] border border-[#7D39EB]/30 flex items-center gap-1.5 text-xs font-bold transition-all shadow-2xs"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>Mở LMS Course</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground/60 italic py-1">Chưa có LMS</span>
                    )}

                    {driveUrl && (
                      <a
                        href={driveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-7.5 px-2.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center gap-1.5 text-xs font-bold transition-all shadow-2xs"
                      >
                        <Folder className="h-3.5 w-3.5" />
                        <span>Google Drive</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* KHỐI 4: QUẢN LÝ ẢNH BÌA */}
            <div className="border-t border-border/50 pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-[#7D39EB]" />
                  <span>Ảnh bìa môn học</span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCoverDialog(true)}
                  className="h-7 px-2.5 rounded-md text-xs font-semibold gap-1.5 text-[#7D39EB] border-[#7D39EB]/40 hover:bg-[#7D39EB]/10 transition-all shadow-2xs"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>Đổi ảnh bìa</span>
                </Button>
              </div>

              {/* Khung xem trước ảnh bìa */}
              <div className="relative w-full h-24 rounded-lg overflow-hidden border border-border/70 bg-muted/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl || getSubjectCoverImage(initialData || undefined)}
                  alt={name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-2 left-2.5 text-[11px] text-white/90 font-medium truncate max-w-[90%]">
                  {imageUrl ? imageUrl : "Ảnh mặc định theo danh mục môn học"}
                </div>
              </div>
            </div>

            {/* FOOTER: Nút Xoá môn học bên trái, Nút Đóng bên phải */}
            <DialogFooter className="pt-3 border-t border-border/50 flex flex-row items-center justify-between sm:justify-between w-full">
              {initialData?.id && onDelete ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 rounded-md gap-1.5 px-2.5 h-8 transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Xoá môn học</span>
                </Button>
              ) : (
                <div />
              )}

              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-md h-8 text-xs font-semibold px-4"
              >
                Đóng
              </Button>
            </DialogFooter>
          </div>
        ) : (
          /* 2. CHẾ ĐỘ CHỈNH SỬA / TẠO MỚI (EDIT MODE): Tất cả trường đồng cấp, KHÔNG có ô lớn bao quanh */
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {errorMessage && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold animate-in fade-in-50">
                {errorMessage}
              </div>
            )}

            {/* HÀNG 1: Tên môn học, Mã môn, Tín chỉ */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Tên môn học */}
              <div className="space-y-1.5 sm:col-span-6">
                <Label htmlFor="name" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-[#7D39EB]" />
                  <span>Tên môn học</span>
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Ví dụ: Quản trị vận tải đa phương thức..."
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setErrorMessage(null);
                  }}
                  className="rounded-md"
                  required
                />
              </div>

              {/* Mã môn */}
              <div className="space-y-1.5 sm:col-span-3">
                <Label htmlFor="code" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-[#7D39EB]" />
                  <span>Mã môn</span>
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="code"
                  placeholder="MAT"
                  value={code}
                  onChange={handleCodeChange}
                  maxLength={10}
                  className="font-mono uppercase font-black tracking-wider text-center rounded-md"
                  required
                />
              </div>

              {/* Tín chỉ */}
              <div className="space-y-1.5 sm:col-span-3">
                <Label htmlFor="credits" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-[#7D39EB]" />
                  <span>Tín chỉ</span>
                </Label>
                <Input
                  id="credits"
                  type="number"
                  min={0}
                  max={20}
                  placeholder="3"
                  value={credits}
                  onChange={(e) => setCredits(e.target.value)}
                  className="rounded-md text-center font-bold"
                />
              </div>
            </div>

            {/* HÀNG 2: Năm học, Kỳ học, Phân loại */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Năm học */}
              <div className="space-y-1.5">
                <Label htmlFor="academicYear" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <CalendarRange className="h-3.5 w-3.5 text-[#7D39EB]" />
                  <span>Năm học</span>
                  <span className="text-destructive">*</span>
                </Label>
                <select
                  id="academicYear"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full h-10 text-xs font-semibold rounded-md border border-border/80 bg-background px-3 py-1 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7D39EB] transition-all"
                  required
                >
                  {PRESET_ACADEMIC_YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              {/* Kỳ học */}
              <div className="space-y-1.5">
                <Label htmlFor="term" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#7D39EB]" />
                  <span>Kỳ học</span>
                  <span className="text-destructive">*</span>
                </Label>
                <select
                  id="term"
                  value={term}
                  onChange={(e) => setTerm(e.target.value as AcademicTerm)}
                  className="w-full h-10 text-xs font-semibold rounded-md border border-border/80 bg-background px-3 py-1 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7D39EB] transition-all"
                  required
                >
                  {ACADEMIC_TERMS.map((t) => (
                    <option key={t} value={t}>
                      {t === "HK1" ? "HK1 (Học kỳ 1)" : t === "HK2" ? "HK2 (Học kỳ 2)" : "HK hè (Học kỳ hè)"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Phân loại */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="category" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-[#7D39EB]" />
                    <span>Phân loại</span>
                    <span className="text-destructive">*</span>
                  </Label>
                  <label
                    htmlFor="category-color-input"
                    className="h-4 w-4 rounded-full cursor-pointer border border-border/80 shadow-xs flex items-center justify-center transition-transform hover:scale-125"
                    style={{ backgroundColor: activeColor }}
                    title={`Đổi màu cho "${category}"`}
                  >
                    <span className="sr-only">Đổi màu</span>
                    <input
                      id="category-color-input"
                      type="color"
                      value={activeColor}
                      onChange={(e) => handleCategoryColorChange(e.target.value)}
                      className="sr-only"
                    />
                  </label>
                </div>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as SubjectCategory)}
                  className="w-full h-10 text-xs font-semibold rounded-md border border-border/80 bg-background px-3 py-1 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7D39EB] transition-all"
                  required
                >
                  {SUBJECT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* HÀNG 3: Course, Google Drive; + (Tạo Drive) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Course */}
              <div className="space-y-1.5">
                <Label htmlFor="courseUrl" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-[#7D39EB]" />
                  <span>Course</span>
                </Label>
                <div className="relative">
                  <Input
                    id="courseUrl"
                    type="url"
                    placeholder="https://lms.university.edu.vn/courses/..."
                    value={courseUrl}
                    onChange={(e) => setCourseUrl(e.target.value)}
                    className="rounded-md pr-9"
                  />
                  {courseUrl && (
                    <a
                      href={courseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#7D39EB] transition-colors"
                      title="Mở Course"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>

              {/* Google Drive + Nút '+' */}
              <div className="space-y-1.5">
                <Label htmlFor="driveUrl" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Folder className="h-3.5 w-3.5 text-[#7D39EB]" />
                  <span>Google Drive</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="driveUrl"
                    type="url"
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={driveUrl}
                    onChange={(e) => setDriveUrl(e.target.value)}
                    className="rounded-md flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCreateDrive}
                    className="h-10 w-10 rounded-md shrink-0 border-border/80 hover:border-[#7D39EB] hover:text-[#7D39EB] active:scale-95 transition-all"
                    title="Tạo Drive"
                    aria-label="Tạo Drive"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Thông báo hướng dẫn tạo Drive nếu có */}
            {driveHelpNotice && (
              <div className="p-2.5 rounded-md bg-[#7D39EB]/10 border border-[#7D39EB]/25 text-[11px] text-[#7D39EB] dark:text-[#A775F8] flex items-start gap-2 animate-in fade-in-50">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <p>{driveHelpNotice}</p>
              </div>
            )}

            {/* HÀNG 4: Ảnh bìa môn học (Permanent Link) - ĐỒNG CẤP, KHÔNG Ô BAO QUANH */}
            <div className="space-y-1.5">
              <Label htmlFor="subjectImageUrl" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-[#7D39EB]" />
                <span>Ảnh bìa môn học (Permanent Link)</span>
              </Label>

              <div className="space-y-2">
                <div className="relative">
                  <Input
                    id="subjectImageUrl"
                    type="url"
                    placeholder="https://images.unsplash.com/... (link ảnh vĩnh viễn)"
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      setPreviewError(false);
                    }}
                    className="rounded-md font-mono text-xs pr-8"
                  />
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Xem trước ảnh */}
                {imageUrl && !previewError && (
                  <div className="relative w-full h-24 rounded-lg overflow-hidden border border-border/70">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt="Preview cover"
                      className="w-full h-full object-cover"
                      onError={() => setPreviewError(true)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* HÀNG 5: Ngày bắt đầu, Số tuần học - ĐỒNG CẤP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Ngày bắt đầu (Smart Date Picker) */}
              <div className="space-y-1.5">
                <Label htmlFor="startDate" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#7D39EB]" />
                  <span>Ngày bắt đầu</span>
                </Label>
                <SmartDatePicker
                  id="startDate"
                  value={startDate}
                  onChange={handleStartDateChange}
                />
              </div>

              {/* Số tuần học */}
              <div className="space-y-1.5">
                <Label htmlFor="totalWeeks" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Hourglass className="h-3.5 w-3.5 text-[#7D39EB]" />
                  <span>Số tuần học</span>
                </Label>
                <Input
                  id="totalWeeks"
                  type="number"
                  min={1}
                  max={52}
                  placeholder="15"
                  value={totalWeeks}
                  onChange={(e) => setTotalWeeks(e.target.value)}
                  className="rounded-md font-bold"
                />
              </div>
            </div>

            {/* HÀNG 6: Thứ học trong tuần - ĐỒNG CẤP, KHÔNG Ô BAO QUANH */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#7D39EB]" />
                  <span>Thứ học trong tuần</span>
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  Tự động đánh dấu trên Lịch học Dashboard
                </span>
              </div>
              <div className="grid grid-cols-7 gap-1.5 pt-0.5">
                {WEEKDAYS.map((wd) => {
                  const isSelected = scheduleDays.includes(wd.value);
                  return (
                    <button
                      key={wd.value}
                      type="button"
                      onClick={() => toggleScheduleDay(wd.value)}
                      className={`h-8 rounded-md text-xs font-bold transition-all duration-150 border flex items-center justify-center cursor-pointer ${
                        isSelected
                          ? "bg-[#7D39EB] text-white border-[#7D39EB] shadow-xs scale-102"
                          : "bg-background text-muted-foreground border-border/80 hover:bg-muted hover:text-foreground"
                      }`}
                      title={wd.fullLabel}
                    >
                      {wd.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* HÀNG 7: Giờ học - ĐỒNG CẤP, KHÔNG Ô BAO QUANH */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="startTime" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#7D39EB]" />
                  <span>Giờ bắt đầu</span>
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="rounded-md font-semibold"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endTime" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#7D39EB]" />
                  <span>Giờ kết thúc</span>
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="rounded-md font-semibold"
                />
              </div>
            </div>

            {/* HÀNG 8: Phòng học & Cơ sở - ĐỒNG CẤP, KHÔNG Ô BAO QUANH */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="room" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[#7D39EB]" />
                  <span>Phòng học</span>
                </Label>
                <Input
                  id="room"
                  placeholder="VD: B.304, Lab 02"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="rounded-md"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="campus" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[#7D39EB]" />
                  <span>Cơ sở</span>
                </Label>
                <Input
                  id="campus"
                  placeholder="VD: Cơ sở 1 - Nguyễn Tri Phương"
                  value={campus}
                  onChange={(e) => setCampus(e.target.value)}
                  className="rounded-md"
                />
              </div>
            </div>

            {/* HÀNG 9: Link Google Maps - ĐỒNG CẤP, KHÔNG Ô BAO QUANH */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="mapUrl" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5 text-[#7D39EB]" />
                  <span>Link Google Maps</span>
                </Label>
                {(mapUrl || campus) && (
                  <a
                    href={mapUrl || `https://maps.google.com/?q=${encodeURIComponent(campus)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-[#7D39EB] hover:underline flex items-center gap-1"
                  >
                    <span>Mở thử bản đồ</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <Input
                id="mapUrl"
                type="url"
                placeholder="https://maps.google.com/?q=... (hoặc để trống sẽ tự tìm theo Cơ sở)"
                value={mapUrl}
                onChange={(e) => setMapUrl(e.target.value)}
                className="rounded-md text-xs"
              />
            </div>

            {/* Hiển thị tính toán ngày kết thúc dự kiến */}
            {previewEndDate && (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-0.5">
                <Info className="h-3.5 w-3.5 text-[#7D39EB] shrink-0" />
                <span>
                  Dự kiến kết thúc:{" "}
                  <strong className="text-foreground">{formatDateVi(previewEndDate)}</strong> (sau{" "}
                  {weeksNum} tuần)
                </span>
              </div>
            )}

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (mode === "edit") {
                    setIsEditing(false);
                  } else {
                    onOpenChange(false);
                  }
                }}
                className="rounded-md transition-colors active:scale-95"
              >
                {mode === "edit" ? "Hủy chỉnh sửa" : "Hủy"}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-[#7D39EB] hover:bg-[#682BCA] text-white font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shadow-md"
              >
                {isSubmitting
                  ? "Đang lưu..."
                  : mode === "create"
                  ? "Tạo môn học"
                  : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>

    {/* Modal thay đổi link ảnh bìa vĩnh viễn */}
    <ChangeCoverDialog
      open={showCoverDialog}
      onOpenChange={setShowCoverDialog}
      currentUrl={imageUrl || ""}
      title="Đổi ảnh bìa môn học"
      subtitle={`Dán link ảnh vĩnh viễn cho môn "${name}" (${code}) để giao diện sinh động và ngăn nắp.`}
      onSave={(newUrl) => {
        setImageUrl(newUrl);
        if (initialData?.id && onUpdateSubject) {
          onUpdateSubject(initialData.id, { imageUrl: newUrl });
        }
      }}
    />

    {/* Alert Dialog xác nhận trước khi xoá an toàn */}
    <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
      <AlertDialogContent className="rounded-lg border-border shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base font-bold text-destructive">
            Xác nhận xoá môn học?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm">
            Bạn có chắc chắn muốn xoá môn học{" "}
            <strong className="text-foreground">
              [{code}] {name}
            </strong>{" "}
            không? Dữ liệu môn học và lịch học sẽ bị xoá khỏi hệ thống.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-md">Huỷ bỏ</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (initialData?.id && onDelete) {
                onDelete(initialData.id);
                onOpenChange(false);
              }
            }}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-md"
          >
            Xác nhận xoá
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

