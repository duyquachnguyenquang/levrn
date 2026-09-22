export type SubjectCategory =
  | "Môn đại cương"
  | "Môn chuyên ngành"
  | "Môn tự chọn"
  | "Ngoại ngữ và Tin học"
  | "Thể dục thể hình"
  | "Khác";

export const SUBJECT_CATEGORIES: SubjectCategory[] = [
  "Môn đại cương",
  "Môn chuyên ngành",
  "Môn tự chọn",
  "Ngoại ngữ và Tin học",
  "Thể dục thể hình",
  "Khác",
];

export const DEFAULT_CATEGORY_COLORS: Record<SubjectCategory, string> = {
  "Môn đại cương": "#3B82F6",       // Blue
  "Môn chuyên ngành": "#7D39EB",     // LEVRN Brand Violet
  "Môn tự chọn": "#F59E0B",         // Amber
  "Ngoại ngữ và Tin học": "#06B6D4", // Cyan
  "Thể dục thể hình": "#10B981",     // Emerald
  "Khác": "#EC4899",                 // Vivid Pink
};

export const ACADEMIC_TERMS = ["HK1", "HK2", "HK hè"] as const;
export type AcademicTerm = (typeof ACADEMIC_TERMS)[number];

// Các thứ trong tuần dùng cho lịch học (0: CN, 1: T2, ..., 6: T7 theo getDay() của JS)
export const WEEKDAYS = [
  { value: 1, label: "T2", fullLabel: "Thứ Hai" },
  { value: 2, label: "T3", fullLabel: "Thứ Ba" },
  { value: 3, label: "T4", fullLabel: "Thứ Tư" },
  { value: 4, label: "T5", fullLabel: "Thứ Năm" },
  { value: 5, label: "T6", fullLabel: "Thứ Sáu" },
  { value: 6, label: "T7", fullLabel: "Thứ Bảy" },
  { value: 0, label: "CN", fullLabel: "Chủ Nhật" },
] as const;

/**
 * Định nghĩa kiểu dữ liệu cho môn học (Subject) trong ứng dụng LEVRN
 */
export interface Subject {
  id: string;              // UUID duy nhất cho môn học
  code: string;            // Mã môn (ví dụ: MAT, CS101, ENG)
  name: string;            // Tên môn học
  academicYear?: string;   // Năm học (ví dụ: "2024-2025")
  term?: AcademicTerm;     // Kỳ học ("HK1" | "HK2" | "HK hè")
  semester: string;        // Ví dụ: "HK1 2024-2025" (tương thích ngược)
  credits?: number;        // Tín chỉ (tuỳ chọn)
  category?: SubjectCategory; // Phân loại môn học
  color: string;           // Màu đại diện (đồng bộ theo phân loại)
  courseUrl?: string;      // Link dẫn tới trang LMS của trường
  driveUrl?: string;       // Link Google Drive môn học
  startDate?: string;      // Ngày bắt đầu (YYYY-MM-DD)
  totalWeeks?: number;     // Số tuần học (mặc định 15)
  endDate?: string;        // Ngày kết thúc (YYYY-MM-DD)
  scheduleDays?: number[]; // Các thứ học trong tuần (1..6, 0: CN)
  startTime?: string;      // Giờ bắt đầu học (VD: "08:00")
  endTime?: string;        // Giờ kết thúc học (VD: "10:30")
  room?: string;           // Phòng học (VD: "B.304")
  campus?: string;         // Cơ sở (VD: "Cơ sở 1 - Nguyễn Tri Phương")
  mapUrl?: string;         // Đường dẫn Google Maps của cơ sở
  createdAt: string;       // Thời điểm tạo môn học (ISO string)
  
  // Dữ liệu cũ (tuỳ chọn giữ tương thích ngược)
  instructor?: string;     // Giảng viên phụ trách
  targetHours?: number;    // Số giờ học mục tiêu
  note?: string;           // Ghi chú thêm
}

/**
 * Kiểu dữ liệu cho form tạo mới hoặc chỉnh sửa môn học
 */
export type SubjectFormData = Omit<Subject, "id" | "createdAt">;
