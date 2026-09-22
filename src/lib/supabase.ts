import { createClient } from "@supabase/supabase-js";
import { Subject, SubjectFormData } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * Khởi tạo Supabase Client
 */
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Chuyển đổi dữ liệu từ Supabase (snake_case) sang Subject interface (camelCase)
 */
export function mapRowToSubject(row: any): Subject {
  let scheduleDays: number[] | undefined = undefined;
  let startTime: string | undefined = row.start_time || row.startTime || undefined;
  let endTime: string | undefined = row.end_time || row.endTime || undefined;
  let room: string | undefined = row.room || undefined;
  let campus: string | undefined = row.campus || undefined;
  let mapUrl: string | undefined = row.map_url || row.mapUrl || undefined;

  if (Array.isArray(row.schedule_days)) {
    scheduleDays = row.schedule_days;
  } else if (Array.isArray(row.scheduleDays)) {
    scheduleDays = row.scheduleDays;
  }

  // Đọc metadata mở rộng từ note nếu có
  if (typeof row.note === "string") {
    if (row.note.includes("levrn_meta:")) {
      try {
        const match = row.note.match(/levrn_meta:(\{.*?\})/);
        if (match) {
          const meta = JSON.parse(match[1]);
          if (meta.scheduleDays) scheduleDays = meta.scheduleDays;
          if (meta.startTime) startTime = meta.startTime;
          if (meta.endTime) endTime = meta.endTime;
          if (meta.room) room = meta.room;
          if (meta.campus) campus = meta.campus;
          if (meta.mapUrl) mapUrl = meta.mapUrl;
        }
      } catch {}
    } else if (row.note.includes("levrn_schedule:")) {
      try {
        const match = row.note.match(/levrn_schedule:(\[[0-9,]*\])/);
        if (match) {
          scheduleDays = JSON.parse(match[1]);
        }
      } catch {}
    }
  }

  const cleanNote = typeof row.note === "string"
    ? row.note.replace(/\s*levrn_meta:(\{.*?\})/g, "").replace(/\s*levrn_schedule:(\[[0-9,]*\])/g, "").trim() || undefined
    : (row.note ?? undefined);

  return {
    id: row.id,
    code: row.code,
    name: row.name,
    semester: row.semester,
    academicYear: row.academic_year || row.academicYear || undefined,
    term: row.term || undefined,
    credits: row.credits ?? undefined,
    category: row.category || "Môn chuyên ngành",
    color: row.color || "#7D39EB",
    courseUrl: row.course_url || row.courseUrl || undefined,
    driveUrl: row.drive_url || row.driveUrl || undefined,
    startDate: row.start_date || row.startDate || undefined,
    endDate: row.end_date || row.endDate || undefined,
    totalWeeks: row.total_weeks ?? row.totalWeeks ?? undefined,
    scheduleDays,
    startTime,
    endTime,
    room,
    campus,
    mapUrl,
    instructor: row.instructor ?? undefined,
    targetHours: row.target_hours ?? row.targetHours ?? undefined,
    note: cleanNote,
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  };
}

/**
 * Chuyển đổi dữ liệu SubjectFormData sang định dạng lưu trữ cơ sở dữ liệu Supabase
 */
export function mapSubjectToRow(data: Partial<SubjectFormData>) {
  const row: Record<string, any> = {};

  if (data.code !== undefined) row.code = data.code;
  if (data.name !== undefined) row.name = data.name;
  if (data.semester !== undefined) row.semester = data.semester;
  if (data.academicYear !== undefined) row.academic_year = data.academicYear || null;
  if (data.term !== undefined) row.term = data.term || null;
  if (data.credits !== undefined) row.credits = data.credits;
  if (data.category !== undefined) row.category = data.category;
  if (data.color !== undefined) row.color = data.color;
  if (data.courseUrl !== undefined) row.course_url = data.courseUrl || null;
  if (data.driveUrl !== undefined) row.drive_url = data.driveUrl || null;
  if (data.startDate !== undefined) row.start_date = data.startDate || null;
  if (data.endDate !== undefined) row.end_date = data.endDate || null;
  if (data.totalWeeks !== undefined) row.total_weeks = data.totalWeeks ?? null;
  if (data.instructor !== undefined) row.instructor = data.instructor;
  if (data.targetHours !== undefined) row.target_hours = data.targetHours;
  
  let noteValue = data.note ?? "";
  const meta: Record<string, any> = {};
  if (data.scheduleDays && data.scheduleDays.length > 0) meta.scheduleDays = data.scheduleDays;
  if (data.startTime) meta.startTime = data.startTime;
  if (data.endTime) meta.endTime = data.endTime;
  if (data.room) meta.room = data.room;
  if (data.campus) meta.campus = data.campus;
  if (data.mapUrl) meta.mapUrl = data.mapUrl;

  if (Object.keys(meta).length > 0) {
    const tag = `levrn_meta:${JSON.stringify(meta)}`;
    noteValue = noteValue ? `${noteValue} ${tag}` : tag;
  }
  if (noteValue) {
    row.note = noteValue;
  }

  return row;
}

