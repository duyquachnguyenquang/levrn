import { Subject, AttendanceRecord } from "@/lib/types";

export interface SubjectCheckinStatus {
  isTodayClass: boolean;       // Hôm nay có phải là ngày học của môn không?
  isInTimeWindow: boolean;     // Hiện tại có đang trong khung giờ học (startTime -> endTime) không?
  isCheckedIn: boolean;        // Đã điểm danh hôm nay chưa?
  checkinTime?: string;        // Thời gian đã điểm danh nếu có (ISO string hoặc HH:mm)
  canCheckin: boolean;         // Có thể bấm điểm danh ngay lúc này
  statusText: string;          // Mô tả ngắn gọn ("Đang trong giờ học", "Chưa tới giờ", "Đã điểm danh", v.v.)
  sessionNumber: number;       // Buổi thứ mấy (1..totalWeeks)
  totalWeeks: number;          // Tổng số buổi (tuần)
  attendedCount: number;       // Số buổi đã điểm danh (present + late)
  progressPercent: number;     // % tiến độ ngày học đã hoàn thành
}

/**
 * Định dạng Date sang key YYYY-MM-DD
 */
export function getLocalDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Phân tích và kiểm tra trạng thái điểm danh hôm nay của một môn học
 */
export function getSubjectCheckinStatus(
  subject: Subject,
  records: AttendanceRecord[] = [],
  customNow?: Date
): SubjectCheckinStatus {
  const now = customNow || new Date();
  const todayDateStr = getLocalDateKey(now);
  const todayDayOfWeek = now.getDay(); // 0: CN, 1: T2, ..., 6: T7
  const totalWeeks = subject.totalWeeks || 15;

  // 1. Kiểm tra hôm nay có ca học của môn này không
  let isTodayClass = false;
  if (Array.isArray(subject.scheduleDays) && subject.scheduleDays.length > 0) {
    isTodayClass = subject.scheduleDays.includes(todayDayOfWeek);
  } else if (subject.startDate) {
    const parts = subject.startDate.split("-").map(Number);
    if (parts.length === 3) {
      const startDay = new Date(parts[0], parts[1] - 1, parts[2]).getDay();
      isTodayClass = startDay === todayDayOfWeek;
    }
  }

  // Kiểm tra thời hạn môn học (nếu có startDate / endDate)
  if (isTodayClass) {
    if (subject.startDate && todayDateStr < subject.startDate) {
      isTodayClass = false;
    }
    if (subject.endDate && todayDateStr > subject.endDate) {
      isTodayClass = false;
    }
  }

  // 2. Tính số buổi đã điểm danh (present hoặc late)
  const subjectRecords = records.filter((r) => r.subjectId === subject.id);
  const attendedCount = subjectRecords.filter(
    (r) => r.status === "present" || r.status === "late"
  ).length;
  const progressPercent = Math.min(
    100,
    Math.round((attendedCount / totalWeeks) * 100)
  );

  // 3. Kiểm tra xem hôm nay đã điểm danh môn này chưa
  const todayRecord = subjectRecords.find(
    (r) => r.date === todayDateStr && (r.status === "present" || r.status === "late")
  );
  const isCheckedIn = !!todayRecord;
  const checkinTime = todayRecord
    ? todayRecord.checkinTime || todayRecord.updatedAt || todayRecord.createdAt
    : undefined;

  // 4. Kiểm tra xem có đang trong khoảng thời gian giờ học (startTime -> endTime)
  let isInTimeWindow = false;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (subject.startTime && subject.endTime) {
    const [startH, startM] = subject.startTime.split(":").map(Number);
    const [endH, endM] = subject.endTime.split(":").map(Number);
    if (!isNaN(startH) && !isNaN(endH)) {
      const startMinutes = startH * 60 + (startM || 0);
      const endMinutes = endH * 60 + (endM || 0);
      isInTimeWindow = currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      isInTimeWindow = true;
    }
  } else {
    // Nếu môn chưa thiết lập giờ chi tiết, mở trong cả ngày học
    isInTimeWindow = true;
  }

  // Buổi học thứ mấy (tính từ số buổi đã hoàn thành + 1)
  const sessionNumber = Math.min(totalWeeks, attendedCount + (isCheckedIn ? 0 : 1));

  // 5. Xác định điều kiện có thể bấm điểm danh
  const canCheckin = isTodayClass && isInTimeWindow && !isCheckedIn;

  // 6. Xây dựng thông điệp trạng thái
  let statusText = "Không có lịch hôm nay";
  if (isCheckedIn) {
    statusText = "Đã điểm danh";
  } else if (isTodayClass) {
    if (isInTimeWindow) {
      statusText = "Đang trong giờ học (Bấm điểm danh)";
    } else if (subject.startTime) {
      const [startH, startM] = subject.startTime.split(":").map(Number);
      const startMinutes = startH * 60 + (startM || 0);
      if (currentMinutes < startMinutes) {
        statusText = `Chưa đến giờ (${subject.startTime})`;
      } else {
        statusText = "Đã qua giờ học hôm nay";
      }
    }
  }

  return {
    isTodayClass,
    isInTimeWindow,
    isCheckedIn,
    checkinTime,
    canCheckin,
    statusText,
    sessionNumber,
    totalWeeks,
    attendedCount,
    progressPercent,
  };
}
