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

// ============================================================================
// QUẢN LÝ ĐIỂM SỐ & GPA (GRADE MANAGEMENT)
// ============================================================================

/**
 * Chế độ chấm điểm môn học:
 * - 'final_only': Nhập trực tiếp điểm tổng kết (Môn cũ của sinh viên năm 1, năm 2)
 * - 'components': Chia nhỏ theo các đầu điểm thành phần có tỷ trọng % (Môn đang học)
 */
export type GradingMethod = "final_only" | "components";

/**
 * Thang điểm chữ chuẩn Bộ GD&ĐT Việt Nam
 */
export type LetterGrade = "A" | "B+" | "B" | "C+" | "C" | "D+" | "D" | "F" | "--";

/**
 * Thành phần điểm (cột điểm) trong một môn học
 */
export interface GradeComponent {
  id: string;              // Mã định danh cột điểm
  name: string;            // Tên cột điểm: Chuyên cần, Giữa kỳ, Báo cáo, Cuối kỳ...
  weight: number;          // Tỷ trọng % (VD: 10, 20, 50)
  score?: number | null;   // Điểm số đạt được (thang 10, VD: 8.5)
  maxScore?: number;       // Điểm tối đa (mặc định 10)
  note?: string;           // Ghi chú thêm
}

/**
 * Dữ liệu điểm số của một môn học (Course Grade)
 */
export interface CourseGrade {
  id: string;                  // UUID duy nhất
  subjectId?: string;          // Khóa ngoại liên kết tới Subject (nếu có)
  subjectCode: string;         // Mã môn: MAT101, CS102, ENG...
  subjectName: string;         // Tên môn học
  credits: number;             // Số tín chỉ (VD: 2, 3, 4)
  semester: string;            // Học kỳ: "HK1 2022-2023", "HK1 2024-2025"
  academicYear?: string;       // Năm học: "2024-2025"
  term?: AcademicTerm;         // Kỳ: "HK1" | "HK2" | "HK hè"
  gradingMethod: GradingMethod;// 'final_only' hoặc 'components'
  finalScore: number | null;   // Điểm tổng kết hệ 10 (0 - 10)
  components: GradeComponent[];// Danh sách thành phần điểm kèm tỷ trọng
  targetScore?: number | null; // Điểm mục tiêu mong muốn (hệ 10)
  notes?: string;              // Ghi chú
  createdAt: string;           // Thời điểm tạo
  updatedAt?: string;          // Thời điểm cập nhật
}

/**
 * Dữ liệu form tạo/sửa môn học trong bảng điểm
 */
export type CourseGradeFormData = Omit<CourseGrade, "id" | "createdAt" | "updatedAt">;

/**
 * Thống kê GPA theo từng học kỳ
 */
export interface SemesterGPASummary {
  semester: string;            // Tên học kỳ (VD: "HK1 2024-2025")
  academicYear?: string;
  term?: string;
  totalCourses: number;        // Tổng số môn
  totalCredits: number;        // Tổng tín chỉ đăng ký
  earnedCredits: number;       // Số tín chỉ đạt (Điểm >= 4.0 / D)
  gpa10: number;               // Điểm trung bình hệ 10 (có trọng số tín chỉ)
  gpa4: number;                // Điểm trung bình hệ 4 (có trọng số tín chỉ)
  letterGrade: LetterGrade;    // Điểm chữ đại diện
  academicStanding: string;    // Xếp loại học lực (Xuất sắc, Giỏi, Khá...)
  courses: CourseGrade[];      // Danh sách các môn trong học kỳ
}

/**
 * Thống kê GPA tích lũy toàn khóa
 */
export interface CumulativeGPASummary {
  totalCourses: number;        // Tổng số môn toàn khóa
  totalCredits: number;        // Tổng số tín chỉ toàn khóa
  earnedCredits: number;       // Số tín chỉ đạt
  cumulativeGPA10: number;     // Điểm GPA tích lũy hệ 10
  cumulativeGPA4: number;      // Điểm GPA tích lũy hệ 4
  letterGrade: LetterGrade;    // Điểm chữ tương ứng
  academicStanding: string;    // Xếp loại học lực tốt nghiệp dự kiến
  semesters: SemesterGPASummary[]; // Thống kê chi tiết theo từng kỳ
}

// ============================================================================
// PHIÊN HỌC TẬP, POMODORO, FLASHCARD & TRẮC NGHIỆM (STUDY SESSIONS)
// ============================================================================

export type PomodoroMode = "focus" | "short_break" | "long_break";

export interface StudySession {
  id: string;
  subjectId?: string;
  durationMinutes: number;
  mode: PomodoroMode;
  notes?: string;
  createdAt: string;
}

export interface Flashcard {
  id: string;
  subjectId: string;
  deckName: string;
  front: string;          // Khái niệm, thuật ngữ hoặc câu hỏi
  back: string;           // Định nghĩa, câu trả lời, công thức
  hint?: string;          // Gợi ý
  difficulty?: "easy" | "medium" | "hard";
  reviewCount: number;
  isMastered: boolean;
  createdAt: string;
}

export type FlashcardFormData = Omit<Flashcard, "id" | "reviewCount" | "isMastered" | "createdAt">;

export interface QuizQuestion {
  id: string;
  subjectId: string;
  topic?: string;
  question: string;
  options: string[];      // Danh sách các đáp án A, B, C, D
  correctIndex: number;   // Index đáp án đúng (0, 1, 2, 3)
  explanation?: string;   // Giải thích chi tiết đáp án
  createdAt: string;
}

export type QuizQuestionFormData = Omit<QuizQuestion, "id" | "createdAt">;

// ============================================================================
// ĐIỂM DANH & QUẢN LÝ CHUYÊN CẦN (ATTENDANCE MANAGEMENT)
// ============================================================================

export type AttendanceStatus = "present" | "late" | "excused" | "absent" | "upcoming";

export interface AttendanceStatusMeta {
  key: AttendanceStatus;
  label: string;
  shortLabel: string;
  color: string;
  bgColor: string;
  badgeClass: string;
  description: string;
}

export const ATTENDANCE_STATUS_MAP: Record<AttendanceStatus, AttendanceStatusMeta> = {
  present: {
    key: "present",
    label: "Có mặt",
    shortLabel: "Có mặt",
    color: "#10B981", // Emerald
    bgColor: "rgba(16, 185, 129, 0.15)",
    badgeClass: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
    description: "Tham dự đầy đủ đúng giờ",
  },
  late: {
    key: "late",
    label: "Đi trễ",
    shortLabel: "Trễ",
    color: "#F59E0B", // Amber
    bgColor: "rgba(245, 158, 11, 0.15)",
    badgeClass: "bg-amber-500/15 text-amber-500 border-amber-500/30",
    description: "Đến lớp trễ sau giờ bắt đầu",
  },
  excused: {
    key: "excused",
    label: "Vắng có phép",
    shortLabel: "Nghỉ phép",
    color: "#3B82F6", // Blue
    bgColor: "rgba(59, 130, 246, 0.15)",
    badgeClass: "bg-blue-500/15 text-blue-500 border-blue-500/30",
    description: "Nghỉ học có đơn xin phép",
  },
  absent: {
    key: "absent",
    label: "Vắng không phép",
    shortLabel: "Vắng",
    color: "#EF4444", // Red
    bgColor: "rgba(239, 68, 68, 0.15)",
    badgeClass: "bg-red-500/15 text-red-500 border-red-500/30",
    description: "Nghỉ học không báo trước (tính vào cấm thi)",
  },
  upcoming: {
    key: "upcoming",
    label: "Chưa diễn ra",
    shortLabel: "Sắp tới",
    color: "#71717A", // Zinc
    bgColor: "rgba(113, 113, 122, 0.15)",
    badgeClass: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
    description: "Buổi học trong tương lai",
  },
};

export interface AttendanceRecord {
  id: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  sessionNumber: number;      // Buổi thứ mấy (1, 2, ..., totalWeeks)
  date: string;               // YYYY-MM-DD
  startTime?: string;
  endTime?: string;
  room?: string;
  status: AttendanceStatus;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type AttendanceRecordFormData = Omit<AttendanceRecord, "id" | "createdAt" | "updatedAt">;

export interface SubjectAttendanceSummary {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  color: string;
  semester: string;
  totalWeeks: number;
  totalRecorded: number;      // Đã học (present + late + excused + absent)
  presentCount: number;
  lateCount: number;
  excusedCount: number;
  absentCount: number;
  totalAbsences: number;      // absentCount + excusedCount
  attendanceRate: number;     // % chuyên cần = (present + late) / totalRecorded * 100
  maxAllowedAbsences: number; // Thường là 20% tổng số buổi (VD: 3 buổi trên 15 tuần)
  remainingAllowedAbsences: number; // Số buổi còn lại được phép nghỉ trước khi cấm thi
  isAtRisk: boolean;          // Cận kề nguy cơ cấm thi (còn 1 buổi là bị cấm)
  isBarredFromExam: boolean;  // Đã vượt quá 20% vắng -> Bị cấm thi!
  records: AttendanceRecord[];
}

// ============================================================================
// QUẢN LÝ NHÓM & ĐỒ ÁN HỌC PHẦN (GROUP / TEAM MANAGEMENT)
// ============================================================================

export type GroupMemberRole = "leader" | "member" | "secretary";

export interface GroupMember {
  id: string;
  name: string;
  studentId?: string;         // Mã số sinh viên
  role: GroupMemberRole;
  email?: string;
  phone?: string;
  contributionScore?: number; // Đánh giá đóng góp (0 - 100%)
  avatarColor?: string;
}

export type GroupTaskStatus = "todo" | "in_progress" | "review" | "done";
export type GroupTaskPriority = "low" | "medium" | "high" | "urgent";

export interface GroupTask {
  id: string;
  groupId: string;
  title: string;
  description?: string;
  assigneeMemberId?: string; // ID của thành viên phụ trách
  assigneeName?: string;
  status: GroupTaskStatus;
  priority: GroupTaskPriority;
  dueDate?: string;          // Hạn chót nhiệm vụ (YYYY-MM-DD)
  createdAt: string;
}

export type GroupProjectStatus = "planning" | "in_progress" | "submitted" | "completed";

export interface GroupProject {
  id: string;
  name: string;              // Tên nhóm (VD: "Nhóm 03 - Logistics Warriors")
  subjectId?: string;        // ID môn học liên kết
  subjectCode: string;       // Mã môn (VD: "SCM")
  subjectName: string;       // Tên môn học
  topic: string;             // Đề tài đồ án / bài tập lớn
  description?: string;
  semester?: string;
  status: GroupProjectStatus;
  deadline?: string;         // Hạn nộp đồ án (YYYY-MM-DDTHH:mm)
  driveUrl?: string;         // Thư mục tài liệu Google Drive
  repoUrl?: string;          // Repo Github / Figma / Canva
  meetingUrl?: string;       // Link họp nhóm Google Meet / Zoom
  chatUrl?: string;          // Link Zalo / Messenger / Discord nhóm
  members: GroupMember[];
  tasks: GroupTask[];
  createdAt: string;
  updatedAt?: string;
}

export type GroupProjectFormData = Omit<GroupProject, "id" | "createdAt" | "updatedAt">;

// ============================================================================
// HỆ THỐNG THÔNG BÁO & NHẮC NHỞ (NOTIFICATION CENTER & ALERTS)
// ============================================================================

export type NotificationType = "warning" | "info" | "success" | "deadline" | "attendance";
export type NotificationCategory = "attendance" | "groups" | "grades" | "system" | "schedule";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  read: boolean;
  link?: string;             // Đường dẫn điều hướng nhanh khi click (VD: "/attendance")
  createdAt: string;
}

export type AppNotificationFormData = Omit<AppNotification, "id" | "read" | "createdAt">;

