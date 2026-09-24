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

          if (!subErr && subjectRows) {
            const subjectMap = new Map<string, any>(subjectRows.map((s: any) => [s.id, s]));
            const deletedSubjectIds = getDeletedSubjectIds();
            const validRows: any[] = [];
            const idsToDelete: string[] = [];

            // 2.1 Đồng bộ thông tin môn học và loại bỏ các môn mồ côi đã bị xoá khỏi subjects
            for (const g of currentRows) {
              if (g.subject_id && !subjectMap.has(g.subject_id)) {
                // Môn học này đã bị người dùng xóa khỏi 'Môn học của tôi'
                idsToDelete.push(g.id);
                continue;
              }

              const s = g.subject_id
                ? subjectMap.get(g.subject_id)
                : subjectRows.find((sub: any) => sub.code === g.subject_code);

              if (s) {
                const targetSemester = (s.semester && s.semester.trim()) ? s.semester.trim() : "Chưa xếp kỳ";
                const targetYear = s.academic_year || null;
                const targetTerm = s.term || null;
                const targetCredits = Number(s.credits) || 3;
                const targetCode = s.code;
                const targetName = s.name;

                const isDiff = (
                  g.subject_code !== targetCode ||
                  g.subject_name !== targetName ||
                  Number(g.credits) !== targetCredits ||
                  g.semester !== targetSemester ||
                  (g.academic_year || null) !== targetYear ||
                  (g.term || null) !== targetTerm ||
                  g.subject_id !== s.id
                );

                if (isDiff) {
                  g.subject_id = s.id;
                  g.subject_code = targetCode;
                  g.subject_name = targetName;
                  g.credits = targetCredits;
                  g.semester = targetSemester;
                  g.academic_year = targetYear;
                  g.term = targetTerm;

                  // Update trên Supabase
                  supabase.from("course_grades").update({
                    subject_id: s.id,
                    subject_code: targetCode,
                    subject_name: targetName,
                    credits: targetCredits,
                    semester: targetSemester,
                    academic_year: targetYear,
                    term: targetTerm,
                    updated_at: new Date().toISOString()
                  }).eq("id", g.id).then();
                }
              }
              validRows.push(g);
            }

            if (idsToDelete.length > 0) {
              await supabase.from("course_grades").delete().in("id", idsToDelete);
            }

            currentRows = validRows;

            // 2.2 Bổ sung các môn trong 'subjects' chưa có trong 'course_grades'
            const existingSubjectIds = new Set(
              currentRows.map((g: any) => g.subject_id).filter(Boolean)
            );
            const existingCodes = new Set(
              currentRows.map((g: any) => g.subject_code)
            );

            const missingSubjects = subjectRows.filter(
              (s: any) =>
                !existingSubjectIds.has(s.id) &&
                !existingCodes.has(s.code) &&
                !deletedSubjectIds.has(s.id)
            );

            if (missingSubjects.length > 0) {
              const rowsToInsert = missingSubjects.map((s: any) => ({
                subject_id: s.id,
                subject_code: s.code,
                subject_name: s.name,
                credits: s.credits || 3,
                semester: (s.semester && s.semester.trim()) ? s.semester.trim() : "Chưa xếp kỳ",
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
      const storedSubjects = localStorage.getItem("levrn_subjects_data");
      const localSubjects: Subject[] = storedSubjects ? JSON.parse(storedSubjects) : [];
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      let localGrades: CourseGrade[] = stored ? JSON.parse(stored) : [];

      if (localSubjects.length > 0) {
        const subMap = new Map<string, Subject>(localSubjects.map((s) => [s.id, s]));
        const deletedIds = getDeletedSubjectIds();

        // Đồng bộ và loại bỏ môn mồ côi
        localGrades = localGrades
          .filter((g) => !g.subjectId || subMap.has(g.subjectId))
          .map((g) => {
            const s = g.subjectId ? subMap.get(g.subjectId) : localSubjects.find((sub) => sub.code === g.subjectCode);
            if (s) {
              return {
                ...g,
                subjectId: s.id,
                subjectCode: s.code,
                subjectName: s.name,
                credits: s.credits || 3,
                semester: (s.semester && s.semester.trim()) ? s.semester.trim() : "Chưa xếp kỳ",
                academicYear: s.academicYear,
                term: s.term,
              };
            }
            return g;
          });

        const existingSubIds = new Set(localGrades.map((g) => g.subjectId).filter(Boolean));
        const existingCodes = new Set(localGrades.map((g) => g.subjectCode));

        const missing = localSubjects.filter(
          (s) => !existingSubIds.has(s.id) && !existingCodes.has(s.code) && !deletedIds.has(s.id)
        );

        if (missing.length > 0) {
          const newGrades: CourseGrade[] = missing.map((s, idx) => ({
            id: `grade-local-${Date.now()}-${idx}`,
            subjectId: s.id,
            subjectCode: s.code,
            subjectName: s.name,
            credits: s.credits || 3,
            semester: (s.semester && s.semester.trim()) ? s.semester.trim() : "Chưa xếp kỳ",
            academicYear: s.academicYear,
            term: s.term,
            gradingMethod: "components",
            finalScore: null,
            components: [
              { id: "c1", name: "Chuyên cần & Thái độ", weight: 10, score: null, maxScore: 10 },
              { id: "c2", name: "Kiểm tra Giữa kỳ", weight: 30, score: null, maxScore: 10 },
              { id: "c3", name: "Thi Cuối kỳ", weight: 60, score: null, maxScore: 10 },
            ],
            targetScore: 8.5,
            createdAt: new Date().toISOString(),
          }));
          localGrades = [...newGrades, ...localGrades];
        }
      }

      setGrades(localGrades);
      backupToLocalStorage(localGrades);
      setIsLoading(false);
      return;
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
      semester: (data.semester && data.semester.trim()) ? data.semester.trim() : "Chưa xếp kỳ",
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

    const updatedList: CourseGrade[] = grades.map((g) => {
      if (g.id === id) {
        const item: CourseGrade = {
          ...g,
          ...data,
          semester: data.semester !== undefined ? (data.semester.trim() || "Chưa xếp kỳ") : g.semester,
          updatedAt: new Date().toISOString(),
        };
        updatedGrade = item;
        return item;
      }
      return g;
    });

    if (!updatedGrade) return null;

    setGrades(updatedList);
    backupToLocalStorage(updatedList);

    if (supabase && isSupabaseActive) {
      try {
        const row = mapCourseGradeToRow({
          ...data,
          semester: data.semester !== undefined ? (data.semester.trim() || "Chưa xếp kỳ") : undefined,
        });
        await supabase.from("course_grades").update(row).eq("id", id);
      } catch (err) {
        console.error("Lỗi khi cập nhật điểm trên Supabase:", err);
      }
    }

    // Đồng bộ ngược lại sang subjects nếu có subjectId liên kết
    const curSubId = (updatedGrade as CourseGrade).subjectId;
    if (curSubId) {
      const subUpdates: Record<string, any> = {};
      if (data.subjectCode !== undefined) subUpdates.code = data.subjectCode;
      if (data.subjectName !== undefined) subUpdates.name = data.subjectName;
      if (data.credits !== undefined) subUpdates.credits = data.credits;
      if (data.semester !== undefined) {
        subUpdates.semester = data.semester === "Chưa xếp kỳ" ? "" : data.semester;
      }

      if (Object.keys(subUpdates).length > 0) {
        if (supabase && isSupabaseActive) {
          try {
            await supabase.from("subjects").update(subUpdates).eq("id", curSubId);
          } catch (e) {
            console.error("Lỗi đồng bộ ngược sang subjects:", e);
          }
        }
        try {
          const raw = localStorage.getItem("levrn_subjects_data");
          if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
              const synced = list.map((s: any) => s.id === curSubId ? { ...s, ...subUpdates } : s);
              localStorage.setItem("levrn_subjects_data", JSON.stringify(synced));
            }
          }
        } catch {}
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

  // Danh sách các học kỳ duy nhất (đã sắp xếp, các kỳ có năm học xếp trước, "Chưa xếp kỳ" ở cuối)
  const allSemesters = useMemo(() => {
    const semSet = new Set<string>();
    grades.forEach((g) => {
      const sem = (g.semester && g.semester.trim()) ? g.semester.trim() : "Chưa xếp kỳ";
      semSet.add(sem);
    });
    return Array.from(semSet).sort((a, b) => {
      if (a === "Chưa xếp kỳ") return 1;
      if (b === "Chưa xếp kỳ") return -1;
      return b.localeCompare(a, undefined, { numeric: true });
    });
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
