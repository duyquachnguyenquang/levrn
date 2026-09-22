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
