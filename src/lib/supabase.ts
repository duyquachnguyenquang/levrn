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
    instructor: row.instructor ?? undefined,
    targetHours: row.target_hours ?? row.targetHours ?? undefined,
    note: row.note ?? undefined,
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
  if (data.note !== undefined) row.note = data.note;

  return row;
}

