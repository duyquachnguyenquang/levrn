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

/**
 * Kiểm tra xem một môn học là Môn cũ (đã hoàn thành hoặc đã kết thúc thời gian học)
 * hay Môn mới (đang trong thời gian học)
 */
export function isSubjectEnded(subject: Subject, records: AttendanceRecord[] = []): boolean {
  // 1. Kiểm tra cờ đánh dấu hoàn thành thủ công
  if (subject.isCompleted) {
    return true;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = getLocalDateKey(today);

  // 2. Kiểm tra ngày kết thúc endDate
  if (subject.endDate) {
    if (subject.endDate < todayStr) {
      return true;
    }
  }

  // 3. Kiểm tra tiến độ theo startDate và totalWeeks
  const totalWeeks = subject.totalWeeks || 15;
  if (subject.startDate && totalWeeks > 0) {
    const start = new Date(subject.startDate);
    if (!isNaN(start.getTime())) {
      const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= totalWeeks * 7) {
        return true;
      }
    }
  }

  // 4. Kiểm tra số buổi đã điểm danh (nếu đã đủ 100% số buổi)
  const subjectRecords = records.filter((r) => r.subjectId === subject.id);
  const attendedCount = subjectRecords.filter(
    (r) => r.status === "present" || r.status === "late"
  ).length;
  if (attendedCount >= totalWeeks && totalWeeks > 0) {
    return true;
  }

  return false;
}

/**
 * Định dạng ngày giờ điểm danh trực quan và thân thiện (VD: "07:45 - 01/10/2026")
 */
export function formatCheckinDateTime(checkinTimeStr?: string, fallbackDate?: string): string {
  if (!checkinTimeStr && !fallbackDate) return "Chưa điểm danh";

  if (checkinTimeStr) {
    // Nếu là ISO string hoặc date string hợp lệ
    const d = new Date(checkinTimeStr);
    if (!isNaN(d.getTime())) {
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${hours}:${minutes} - ${day}/${month}/${year}`;
    }

    // Nếu là định dạng "HH:mm" hoặc "HH:mm:ss"
    if (/^\d{1,2}:\d{2}/.test(checkinTimeStr) && fallbackDate) {
      const parts = fallbackDate.split("-");
      if (parts.length === 3) {
        return `${checkinTimeStr.slice(0, 5)} - ${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return `${checkinTimeStr.slice(0, 5)} - ${fallbackDate}`;
    }
  }

  if (fallbackDate) {
    const parts = fallbackDate.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return fallbackDate;
  }

  return "Chưa điểm danh";
}

/**
 * Lấy bản ghi điểm danh gần nhất của môn học
 */
export function getSubjectLastCheckin(subjectId: string, records: AttendanceRecord[]) {
  const subjectRecords = records
    .filter((r) => r.subjectId === subjectId && (r.status === "present" || r.status === "late"))
    .sort((a, b) => {
      const timeA = a.checkinTime ? new Date(a.checkinTime).getTime() : new Date(a.date).getTime();
      const timeB = b.checkinTime ? new Date(b.checkinTime).getTime() : new Date(b.date).getTime();
      return timeB - timeA;
    });

  if (subjectRecords.length === 0) return null;
  const latest = subjectRecords[0];
  return {
    record: latest,
    date: latest.date,
    checkinTime: latest.checkinTime,
    formatted: formatCheckinDateTime(latest.checkinTime, latest.date),
    sessionNumber: latest.sessionNumber,
    status: latest.status,
  };
}

