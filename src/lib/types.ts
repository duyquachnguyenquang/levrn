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

// ============================================================================
// KẾ HOẠCH HỌC TẬP (STUDY PLAN / STRATEGY / TASKS)
// ============================================================================

export type StudyPlanClassification =
  | "theory"    // Tự học lý thuyết
  | "quiz"      // Luyện trắc nghiệm
  | "flashcard" // Flashcard ôn tập
  | "exercise"  // Bài tập & Thực hành
  | "reading"   // Đọc tài liệu & Tóm tắt
  | "review";   // Ôn thi & Đánh giá

export interface ClassificationMeta {
  key: StudyPlanClassification;
  label: string;
  shortLabel: string;
  color: string;
  bgColor: string;
  borderColor: string;
  iconName: string;
  description: string;
}

export const STUDY_CLASSIFICATIONS: Record<StudyPlanClassification, ClassificationMeta> = {
  theory: {
    key: "theory",
    label: "Tự học lý thuyết",
    shortLabel: "Lý thuyết",
    color: "#3B82F6", // Blue
    bgColor: "rgba(59, 130, 246, 0.15)",
    borderColor: "rgba(59, 130, 246, 0.35)",
    iconName: "BookOpen",
    description: "Nắm vững khái niệm, định lý, công thức và cấu trúc bài học.",
  },
  quiz: {
    key: "quiz",
    label: "Luyện trắc nghiệm",
    shortLabel: "Trắc nghiệm",
    color: "#F59E0B", // Amber
    bgColor: "rgba(245, 158, 11, 0.15)",
    borderColor: "rgba(245, 158, 11, 0.35)",
    iconName: "HelpCircle",
    description: "Luyện giải các bộ câu hỏi trắc nghiệm, rèn phản xạ và ghi nhớ.",
  },
  flashcard: {
    key: "flashcard",
    label: "Flashcard ôn tập",
    shortLabel: "Flashcard",
    color: "#C6FF33", // Lime brand
    bgColor: "rgba(198, 255, 51, 0.18)",
    borderColor: "rgba(198, 255, 51, 0.4)",
    iconName: "Sparkles",
    description: "Ôn tập ngắt quãng (Spaced Repetition) từ vựng, định nghĩa & thuật ngữ.",
  },
  exercise: {
    key: "exercise",
    label: "Bài tập & Thực hành",
    shortLabel: "Thực hành",
    color: "#7D39EB", // Violet brand
    bgColor: "rgba(125, 57, 235, 0.15)",
    borderColor: "rgba(125, 57, 235, 0.35)",
    iconName: "Code2",
    description: "Giải bài tập đồ án, coding lab, bài tập tuần và các case study.",
  },
  reading: {
    key: "reading",
    label: "Đọc tài liệu & Tóm tắt",
    shortLabel: "Đọc tài liệu",
    color: "#06B6D4", // Cyan
    bgColor: "rgba(6, 182, 212, 0.15)",
    borderColor: "rgba(6, 182, 212, 0.35)",
    iconName: "FileText",
    description: "Đọc giáo trình, slide bài giảng, bài báo khoa học và ghi chú Cornell.",
  },
  review: {
    key: "review",
    label: "Ôn thi & Đánh giá",
    shortLabel: "Ôn thi",
    color: "#EC4899", // Pink
    bgColor: "rgba(236, 72, 153, 0.15)",
    borderColor: "rgba(236, 72, 153, 0.35)",
    iconName: "CheckCircle2",
    description: "Tổng ôn kiến thức giữa kỳ / cuối kỳ và giải đề thi mẫu.",
  },
};

export type StudyPriority = "low" | "medium" | "high" | "urgent";

export const STUDY_PRIORITIES: Record<
  StudyPriority,
  { label: string; color: string; badgeClass: string }
> = {
  low: {
    label: "Thấp",
    color: "#64748B",
    badgeClass: "bg-slate-500/15 text-slate-500 border-slate-500/30",
  },
  medium: {
    label: "Bình thường",
    color: "#3B82F6",
    badgeClass: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  },
  high: {
    label: "Quan trọng",
    color: "#F59E0B",
    badgeClass: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  },
  urgent: {
    label: "Khẩn cấp",
    color: "#EF4444",
    badgeClass: "bg-red-500/15 text-red-500 border-red-500/30",
  },
};

export type StudyTaskStatus = "todo" | "in_progress" | "completed";

export interface StudyTimeblock {
  startTime: string; // VD: "08:30"
  endTime: string;   // VD: "10:00"
  durationMinutes?: number; // Tự động tính hoặc người dùng đặt
}

export interface TaskChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface TaskSubtaskItem {
  id: string;
  text: string;
  done: boolean;
}

export interface TaskMaterialItem {
  id: string;
  title: string;
  url: string;
}

export interface StudyTask {
  id: string;
  subjectId: string;
  semester?: string; // Học kỳ (VD: "HK1 2024-2025")
  title: string;
  classification: StudyPlanClassification;
  status: StudyTaskStatus;
  durationMinutes: number; // Số phút dự kiến (VD: 45, 60, 90)
  subtasks?: TaskSubtaskItem[]; // Sub-task
  materials?: TaskMaterialItem[]; // Tài liệu (nhiều link)
  submissionUrl?: string; // Link nộp bài
  deadline?: string; // Hạn chót (YYYY-MM-DDTHH:mm)
  date: string; // YYYY-MM-DD
  completedAt?: string;
  createdAt: string;

  // Tương thích ngược (tuỳ chọn)
  description?: string;
  priority?: StudyPriority;
  timeblock?: StudyTimeblock;
  notes?: string;
  checklist?: TaskChecklistItem[];
}

export type StudyTaskFormData = Omit<StudyTask, "id" | "createdAt" | "completedAt">;

export interface SubjectStudyStrategy {
  subjectId: string;
  weeklyTargetHours: number;
  focusTopics: string[];
  recommendedMethods: StudyPlanClassification[];
  notes?: string;
}
