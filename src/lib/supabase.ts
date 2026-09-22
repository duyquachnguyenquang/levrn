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
  if (Array.isArray(row.schedule_days)) {
    scheduleDays = row.schedule_days;
  } else if (Array.isArray(row.scheduleDays)) {
    scheduleDays = row.scheduleDays;
  } else if (typeof row.note === "string" && row.note.includes("levrn_schedule:")) {
    try {
      const match = row.note.match(/levrn_schedule:(\[[0-9,]*\])/);
      if (match) {
        scheduleDays = JSON.parse(match[1]);
      }
    } catch {}
  }

  const cleanNote = typeof row.note === "string"
    ? row.note.replace(/\s*levrn_schedule:(\[[0-9,]*\])/g, "").trim() || undefined
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
  if (data.scheduleDays && data.scheduleDays.length > 0) {
    const tag = `levrn_schedule:${JSON.stringify(data.scheduleDays)}`;
    noteValue = noteValue ? `${noteValue} ${tag}` : tag;
  }
  if (noteValue) {
    row.note = noteValue;
  }

  return row;
}

