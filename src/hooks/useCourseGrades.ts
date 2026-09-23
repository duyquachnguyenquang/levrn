"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  CourseGrade,
  CourseGradeFormData,
  GradingMethod,
  Subject,
} from "@/lib/types";
import {
  supabase,
  mapRowToCourseGrade,
  mapCourseGradeToRow,
} from "@/lib/supabase";
import {
  calculateCumulativeGPA,
  calculateSemesterGPA,
} from "@/lib/gradeUtils";

const LOCAL_STORAGE_KEY = "levrn_course_grades_data";
const DELETED_SUBJECT_IDS_KEY = "levrn_deleted_grade_subject_ids";

// Helper lấy danh sách ID môn học đã chủ động xóa khỏi bảng điểm
function getDeletedSubjectIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(DELETED_SUBJECT_IDS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {}
  return new Set();
}

function saveDeletedSubjectId(subjectId?: string) {
  if (!subjectId || typeof window === "undefined") return;
  try {
    const set = getDeletedSubjectIds();
    set.add(subjectId);
    localStorage.setItem(DELETED_SUBJECT_IDS_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

function removeDeletedSubjectId(subjectId?: string) {
  if (!subjectId || typeof window === "undefined") return;
  try {
    const set = getDeletedSubjectIds();
    set.delete(subjectId);
    localStorage.setItem(DELETED_SUBJECT_IDS_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

export function useCourseGrades() {
  const [grades, setGrades] = useState<CourseGrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupabaseActive, setIsSupabaseActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Lưu bản sao dự phòng vào localStorage
  const backupToLocalStorage = (list: CourseGrade[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    } catch (err) {
      console.error("Lỗi khi lưu backup điểm số vào localStorage:", err);
    }
  };

  // Tải danh sách điểm từ Supabase (kết nối trực tiếp với bảng môn học subjects)
  const fetchGrades = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    // 1. Thử lấy dữ liệu từ Supabase nếu client đã khởi tạo
    if (supabase) {
      try {
        const { data: gradeRows, error: gradeErr } = await supabase
          .from("course_grades")
          .select("*")
          .order("created_at", { ascending: false });

        if (gradeErr) {
          console.warn("Supabase course_grades notice:", gradeErr.message);
          if (gradeErr.code === "PGRST205") {
            setErrorMessage(
              "Chưa tìm thấy bảng 'course_grades' trên Supabase. Vui lòng chạy câu lệnh mục 5 trong supabase_schema.sql để khởi tạo."
            );
          } else {
            setErrorMessage(`Lỗi Supabase: ${gradeErr.message}`);
          }
        } else {
          setIsSupabaseActive(true);
          let currentRows = gradeRows || [];

          // 2. Lấy danh sách các môn học người dùng đã thêm từ bảng 'subjects'
          const { data: subjectRows, error: subErr } = await supabase
            .from("subjects")
            .select("*")
            .order("created_at", { ascending: true });

          if (!subErr && subjectRows && subjectRows.length > 0) {
            const deletedSubjectIds = getDeletedSubjectIds();
            const existingSubjectIds = new Set(
              currentRows.map((g: any) => g.subject_id).filter(Boolean)
            );
            const existingCodes = new Set(
              currentRows.map((g: any) => `${g.subject_code}_${g.semester}`)
            );

            // Tìm các môn trong 'subjects' chưa có trong 'course_grades' và chưa bị người dùng chủ động xóa
            const missingSubjects = subjectRows.filter(
              (s: any) =>
                !existingSubjectIds.has(s.id) &&
                !existingCodes.has(`${s.code}_${s.semester}`) &&
                !deletedSubjectIds.has(s.id)
            );

            if (missingSubjects.length > 0) {
              const rowsToInsert = missingSubjects.map((s: any) => ({
                subject_id: s.id,
                subject_code: s.code,
                subject_name: s.name,
                credits: s.credits || 3,
                semester: s.semester || "HK1 2026-2027",
                academic_year: s.academic_year || null,
                term: s.term || null,
                grading_method: "components",
                final_score: null,
                components: [
                  { id: "c1", name: "Chuyên cần & Thái độ", weight: 10, score: null, maxScore: 10 },
                  { id: "c2", name: "Kiểm tra Giữa kỳ", weight: 30, score: null, maxScore: 10 },
                  { id: "c3", name: "Thi Cuối kỳ", weight: 60, score: null, maxScore: 10 },
                ],
                target_score: 8.5,
              }));

              const { data: inserted, error: insertErr } = await supabase
                .from("course_grades")
                .insert(rowsToInsert)
                .select();

              if (!insertErr && inserted) {
                currentRows = [...inserted, ...currentRows];
              }
            }
          }

          const mapped = currentRows.map(mapRowToCourseGrade);
          setGrades(mapped);
          backupToLocalStorage(mapped);
          setIsLoading(false);
          return;
        }
      } catch (err: any) {
        console.error("Lỗi khi kết nối Supabase:", err);
      }
    }

    // 2. Fallback: Đọc từ localStorage nếu Supabase chưa kết nối
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setGrades(parsed);
          setIsLoading(false);
          return;
        }
      }
      setGrades([]);
      backupToLocalStorage([]);
    } catch (err) {
      console.error("Lỗi khi đọc dữ liệu điểm từ localStorage:", err);
      setGrades([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  // Thêm một môn học vào bảng điểm
  const addCourseGrade = async (data: CourseGradeFormData): Promise<CourseGrade> => {
    if (data.subjectId) {
      removeDeletedSubjectId(data.subjectId);
    }

    const tempId = `grade-${Date.now()}`;
    const newGrade: CourseGrade = {
      ...data,
      id: tempId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistic UI update
    const updatedList = [newGrade, ...grades];
    setGrades(updatedList);
    backupToLocalStorage(updatedList);

    // Ghi vào Supabase nếu có
    if (supabase && isSupabaseActive) {
      try {
        const row = mapCourseGradeToRow(data);
        const { data: inserted, error } = await supabase
          .from("course_grades")
          .insert([row])
          .select()
          .single();

        if (!error && inserted) {
          const finalItem = mapRowToCourseGrade(inserted);
          setGrades((prev) =>
            prev.map((g) => (g.id === tempId ? finalItem : g))
          );
          backupToLocalStorage(
            updatedList.map((g) => (g.id === tempId ? finalItem : g))
          );
          return finalItem;
        }
      } catch (err) {
        console.error("Lỗi khi thêm điểm vào Supabase:", err);
      }
    }

    return newGrade;
  };

  // Cập nhật điểm của một môn học
  const updateCourseGrade = async (
    id: string,
    data: Partial<CourseGradeFormData>
  ): Promise<CourseGrade | null> => {
    let updatedGrade: CourseGrade | null = null;

    const updatedList = grades.map((g) => {
      if (g.id === id) {
        updatedGrade = {
          ...g,
          ...data,
          updatedAt: new Date().toISOString(),
        };
        return updatedGrade;
      }
      return g;
    });

    if (!updatedGrade) return null;

    setGrades(updatedList);
    backupToLocalStorage(updatedList);

    if (supabase && isSupabaseActive) {
      try {
        const row = mapCourseGradeToRow(data);
        await supabase.from("course_grades").update(row).eq("id", id);
      } catch (err) {
        console.error("Lỗi khi cập nhật điểm trên Supabase:", err);
      }
    }

    return updatedGrade;
  };

  // Xóa môn khỏi bảng điểm
  const deleteCourseGrade = async (id: string): Promise<boolean> => {
    const itemToDelete = grades.find((g) => g.id === id);
    if (itemToDelete?.subjectId) {
      saveDeletedSubjectId(itemToDelete.subjectId);
    }

    const updatedList = grades.filter((g) => g.id !== id);
    setGrades(updatedList);
    backupToLocalStorage(updatedList);

    if (supabase && isSupabaseActive) {
      try {
        await supabase.from("course_grades").delete().eq("id", id);
      } catch (err) {
        console.error("Lỗi khi xóa điểm trên Supabase:", err);
      }
    }

    return true;
  };

  // Thêm nhanh danh sách nhiều môn cũ
  const addMultiplePastCourses = async (
    courseList: CourseGradeFormData[]
  ): Promise<boolean> => {
    const newItems: CourseGrade[] = courseList.map((c, idx) => ({
      ...c,
      id: `grade-past-${Date.now()}-${idx}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const updatedList = [...newItems, ...grades];
    setGrades(updatedList);
    backupToLocalStorage(updatedList);

    if (supabase && isSupabaseActive) {
      try {
        const rows = courseList.map((c) => mapCourseGradeToRow(c));
        await supabase.from("course_grades").insert(rows);
      } catch (err) {
        console.error("Lỗi khi thêm danh sách môn vào Supabase:", err);
      }
    }

    return true;
  };

  // Đồng bộ hoặc tạo bảng điểm nhanh từ môn học có sẵn trong hệ thống
  const importFromSubject = async (
    subject: Subject,
    method: GradingMethod = "components"
  ): Promise<CourseGrade> => {
    const existing = grades.find(
      (g) => g.subjectId === subject.id || g.subjectCode === subject.code
    );
    if (existing) {
      return existing;
    }

    const newGradeData: CourseGradeFormData = {
      subjectId: subject.id,
      subjectCode: subject.code,
      subjectName: subject.name,
      credits: subject.credits || 3,
      semester: subject.semester,
      academicYear: subject.academicYear,
      term: subject.term,
      gradingMethod: method,
      finalScore: null,
      components:
        method === "components"
          ? [
              { id: "c1", name: "Chuyên cần & Thái độ", weight: 10, score: null, maxScore: 10 },
              { id: "c2", name: "Kiểm tra Giữa kỳ", weight: 30, score: null, maxScore: 10 },
              { id: "c3", name: "Thi Cuối kỳ", weight: 60, score: null, maxScore: 10 },
            ]
          : [],
    };

    return await addCourseGrade(newGradeData);
  };

  // Thống kê GPA tích lũy toàn khóa
  const cumulativeGPA = useMemo(() => {
    return calculateCumulativeGPA(grades);
  }, [grades]);

  // Danh sách các học kỳ duy nhất (đã sắp xếp)
  const allSemesters = useMemo(() => {
    const semSet = new Set<string>();
    grades.forEach((g) => {
      if (g.semester) semSet.add(g.semester);
    });
    return Array.from(semSet).sort((a, b) =>
      b.localeCompare(a, undefined, { numeric: true })
    );
  }, [grades]);

  return {
    grades,
    isLoading,
    isSupabaseActive,
    errorMessage,
    cumulativeGPA,
    allSemesters,
    addCourseGrade,
    updateCourseGrade,
    deleteCourseGrade,
    addMultiplePastCourses,
    importFromSubject,
    refreshGrades: fetchGrades,
  };
}
