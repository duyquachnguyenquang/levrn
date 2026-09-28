export interface StudyShift {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  label: string;
}

/**
 * 5 Ca học cố định theo chuẩn hệ thống LEVRN
 */
export const STUDY_SHIFTS: StudyShift[] = [
  { id: 1, name: "Ca 1", startTime: "06:45", endTime: "09:15", label: "Ca 1: 6:45 - 9:15" },
  { id: 2, name: "Ca 2", startTime: "09:25", endTime: "11:55", label: "Ca 2: 9:25 - 11:55" },
  { id: 3, name: "Ca 3", startTime: "12:10", endTime: "14:40", label: "Ca 3: 12:10 - 14:40" },
  { id: 4, name: "Ca 4", startTime: "14:50", endTime: "17:20", label: "Ca 4: 14:50 - 17:20" },
  { id: 5, name: "Ca 5", startTime: "17:30", endTime: "20:00", label: "Ca 5: 17:30 - 20:00" },
];

/**
 * Danh sách các Cơ sở của trường cùng liên kết Google Maps chính xác
 */
export interface CampusInfo {
  id: string;
  name: string;
  address: string;
  mapUrl: string;
  label: string;
}

export const CAMPUSES: CampusInfo[] = [
  {
    id: "cs1",
    name: "Cơ sở 1",
    address: "02 Võ Oanh, phường Thạnh Mỹ Tây, TP. HCM",
    mapUrl: "https://maps.app.goo.gl/7xkBhoNb9MBpEaWP7",
    label: "Cơ sở 1 (02 Võ Oanh, P. Thạnh Mỹ Tây)",
  },
  {
    id: "cs2",
    name: "Cơ sở 2",
    address: "10 đường 12, phường An Khánh, TP. HCM",
    mapUrl: "https://maps.app.goo.gl/LnvwRvZayy4YJP7y8",
    label: "Cơ sở 2 (10 đường 12, P. An Khánh)",
  },
  {
    id: "cs3",
    name: "Cơ sở 3",
    address: "70 Tô Ký, phường Trung Mỹ Tây, TP. HCM",
    mapUrl: "https://maps.app.goo.gl/FwLrsx5K2rSBPjwH6",
    label: "Cơ sở 3 (70 Tô Ký, P. Trung Mỹ Tây)",
  },
  {
    id: "csvt",
    name: "Cơ sở Vũng Tàu",
    address: "17 đường Ba Tháng Hai, phường Phước Thắng, TP. HCM",
    mapUrl: "https://maps.app.goo.gl/oA7MxoFFY6J6fuM68",
    label: "Cơ sở Vũng Tàu (17 đường Ba Tháng Hai)",
  },
];

/**
 * Tìm kiếm thông tin cơ sở dựa trên tên hoặc URL Google Maps
 */
export function getCampusByName(nameOrUrl?: string): CampusInfo | undefined {
  if (!nameOrUrl) return undefined;
  const lower = nameOrUrl.toLowerCase().trim();
  return CAMPUSES.find(
    (c) =>
      c.name.toLowerCase() === lower ||
      c.id.toLowerCase() === lower ||
      c.mapUrl.toLowerCase() === lower ||
      lower.includes(c.name.toLowerCase()) ||
      c.address.toLowerCase().includes(lower)
  );
}

/**
 * Chuẩn hóa chuỗi thời gian HH:mm (ví dụ '6:45' -> '06:45')
 */
export function normalizeTime(timeStr?: string): string {
  if (!timeStr) return "";
  const parts = timeStr.trim().split(":");
  if (parts.length >= 2) {
    const h = parts[0].padStart(2, "0");
    const m = parts[1].padStart(2, "0");
    return `${h}:${m}`;
  }
  return timeStr.trim();
}

/**
 * Tìm Ca học khớp với startTime và endTime
 */
export function getShiftByTimes(startTime?: string, endTime?: string): StudyShift | undefined {
  if (!startTime) return undefined;
  const normStart = normalizeTime(startTime);
  const normEnd = normalizeTime(endTime);

  // Khớp chính xác cả giờ bắt đầu và kết thúc
  const exact = STUDY_SHIFTS.find(
    (s) => s.startTime === normStart && (!normEnd || s.endTime === normEnd)
  );
  if (exact) return exact;

  // Nếu không khớp kết thúc, tìm theo giờ bắt đầu
  return STUDY_SHIFTS.find((s) => s.startTime === normStart);
}

/**
 * Hiển thị nhãn Ca học đẹp mắt (ví dụ: 'Ca 1 (6:45 - 9:15)')
 */
export function formatShiftLabel(startTime?: string, endTime?: string): string {
  if (!startTime) return "Chưa cập nhật ca học";
  const shift = getShiftByTimes(startTime, endTime);
  if (shift) {
    return `${shift.name} (${shift.label.replace(/^Ca\s*\d+:\s*/, "")})`;
  }
  if (startTime && endTime) {
    return `${startTime} - ${endTime}`;
  }
  return startTime;
}
