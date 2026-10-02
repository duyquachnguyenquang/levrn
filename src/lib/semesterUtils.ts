/**
 * Tiện ích quản lý học kỳ và năm học LEVRN
 * Mốc hiện tại: HK1 năm học 2026-2027
 */

export const CURRENT_ACADEMIC_YEAR = "2026-2027";
export const CURRENT_TERM = "HK1";
export const CURRENT_SEMESTER = "HK1 2026-2027";

/**
 * Kiểm tra xem một môn học có thuộc học kỳ/năm học trước HK1 2026-2027 hay không.
 * Các môn học thuộc các năm học trước (2024-2025, 2025-2026...) sẽ được xếp thành "Học xong".
 */
export function isPastSemester(semester?: string, academicYear?: string): boolean {
  // 1. Kiểm tra theo academicYear (dạng "2024-2025", "2025-2026", ...)
  if (academicYear) {
    const startYearMatch = academicYear.match(/\b(20\d{2})\b/);
    if (startYearMatch) {
      const startYear = parseInt(startYearMatch[1], 10);
      if (startYear < 2026) {
        return true; // Năm học trước 2026-2027
      }
    }
  }

  // 2. Kiểm tra theo chuỗi semester (dạng "HK1 2024-2025", "HK2 2025-2026", "HK hè 2024-2025", ...)
  if (semester) {
    const raw = semester.trim();
    if (!raw || raw === "Chưa xếp kỳ") return false;

    // Trích xuất năm bắt đầu từ chuỗi semester
    const match = raw.match(/\b(20\d{2})\b/);
    if (match) {
      const year = parseInt(match[1], 10);
      if (year < 2026) {
        return true; // Học kỳ thuộc các năm trước 2026
      }
    }
  }

  return false;
}

/**
 * Kiểm tra xem môn học đã hoàn thành (Học xong) hay chưa
 */
export function isSubjectCompleted(subject: {
  isCompleted?: boolean;
  semester?: string;
  academicYear?: string;
  endDate?: string;
  attendedCount?: number;
  totalWeeks?: number;
}): boolean {
  // Cờ isCompleted thủ công hoặc đã đánh dấu
  if (subject.isCompleted) return true;

  // Thuộc các học kỳ / năm học trước HK1 2026-2027
  if (isPastSemester(subject.semester, subject.academicYear)) return true;

  // Đã điểm danh đủ số buổi
  if (
    subject.attendedCount !== undefined &&
    subject.totalWeeks !== undefined &&
    subject.totalWeeks > 0 &&
    subject.attendedCount >= subject.totalWeeks
  ) {
    return true;
  }

  // Đã qua ngày kết thúc môn
  if (subject.endDate && !isNaN(new Date(subject.endDate).getTime())) {
    if (new Date(subject.endDate).getTime() < new Date().setHours(0, 0, 0, 0)) {
      return true;
    }
  }

  return false;
}
