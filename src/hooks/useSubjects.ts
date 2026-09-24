"use client";

import { useState, useEffect, useCallback } from "react";
import { Subject, SubjectFormData } from "@/lib/types";
import { supabase, mapRowToSubject, mapSubjectToRow } from "@/lib/supabase";

const LOCAL_STORAGE_KEY = "levrn_subjects_data";

// Dữ liệu môn học khởi tạo mẫu ban đầu khi chưa có dữ liệu trên Supabase hoặc localStorage
const INITIAL_DEMO_SUBJECTS: Subject[] = [
  {
    id: "sub-demo-1",
    code: "MAT",
    name: "Giải Tích & Đại Số Tuyến Tính",
    academicYear: "2024-2025",
    term: "HK1",
    semester: "HK1 2024-2025",
    credits: 4,
    category: "Môn đại cương",
    color: "#3B82F6",
    courseUrl: "https://lms.university.edu.vn/courses/mat101",
    driveUrl: "https://drive.google.com/drive/folders/demo-mat",
    startDate: "2024-09-05",
    totalWeeks: 15,
    endDate: "2024-12-19",
    scheduleDays: [4], // Thứ Năm hàng tuần
    startTime: "08:00",
    endTime: "10:30",
    room: "B.304",
    campus: "Cơ sở 1 - Nguyễn Tri Phương",
    mapUrl: "https://maps.google.com/?q=279+Nguyen+Tri+Phuong+Quan+10+TPHCM",
    createdAt: new Date().toISOString(),
  },
  {
    id: "sub-demo-2",
    code: "ENG",
    name: "Tiếng Anh Chuyên Ngành CNTT",
    academicYear: "2024-2025",
    term: "HK1",
    semester: "HK1 2024-2025",
    credits: 3,
    category: "Ngoại ngữ và Tin học",
    color: "#06B6D4",
    courseUrl: "https://lms.university.edu.vn/courses/eng201",
    startDate: "2024-09-10",
    totalWeeks: 15,
    endDate: "2024-12-24",
    scheduleDays: [2], // Thứ Ba hàng tuần
    startTime: "13:30",
    endTime: "15:00",
    room: "A2.102",
    campus: "Cơ sở 2 - Nguyễn Kiệm",
    mapUrl: "https://maps.google.com/?q=Nguyen+Kiem+Go+Vap+TPHCM",
    createdAt: new Date().toISOString(),
  },
  {
    id: "sub-demo-3",
    code: "PRG",
    name: "Cấu Trúc Dữ Liệu & Giải Thuật",
    academicYear: "2024-2025",
    term: "HK1",
    semester: "HK1 2024-2025",
    credits: 3,
    category: "Môn chuyên ngành",
    color: "#7D39EB",
    courseUrl: "https://lms.university.edu.vn/courses/cs102",
    driveUrl: "https://drive.google.com/drive/folders/demo-cs102",
    startDate: "2024-09-08",
    totalWeeks: 15,
    endDate: "2024-12-22",
    scheduleDays: [1, 3], // Thứ Hai & Thứ Tư hàng tuần
    startTime: "09:45",
    endTime: "12:15",
    room: "Lab 05",
    campus: "Cơ sở Công Nghệ Cao",
    mapUrl: "https://maps.google.com/?q=Khu+Cong+Nghe+Cao+TP+Thu+Duc",
    createdAt: new Date().toISOString(),
  },
];


const GRADES_STORAGE_KEY = "levrn_course_grades_data";

// Đồng bộ thêm môn học vào bảng điểm (course_grades)
async function syncAddGrade(subject: Subject, isSupabaseActive: boolean) {
  const targetSemester = (subject.semester && subject.semester.trim()) ? subject.semester.trim() : "Chưa xếp kỳ";
  const defaultComponents = [
    { id: "c1", name: "Chuyên cần & Thái độ", weight: 10, score: null, maxScore: 10 },
    { id: "c2", name: "Kiểm tra Giữa kỳ", weight: 30, score: null, maxScore: 10 },
    { id: "c3", name: "Thi Cuối kỳ", weight: 60, score: null, maxScore: 10 },
  ];

  if (supabase && isSupabaseActive) {
    try {
      await supabase.from("course_grades").insert([{
        subject_id: subject.id,
        subject_code: subject.code,
        subject_name: subject.name,
        credits: subject.credits || 3,
        semester: targetSemester,
        academic_year: subject.academicYear || null,
        term: subject.term || null,
        grading_method: "components",
        final_score: null,
        components: defaultComponents,
        target_score: 8.5,
      }]);
    } catch (e) {
      console.error("Lỗi đồng bộ thêm vào course_grades:", e);
    }
  }

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(GRADES_STORAGE_KEY);
      const grades = raw ? JSON.parse(raw) : [];
      if (Array.isArray(grades) && !grades.some((g: any) => g.subjectId === subject.id || g.subjectCode === subject.code)) {
        grades.unshift({
          id: `grade-${Date.now()}`,
          subjectId: subject.id,
          subjectCode: subject.code,
          subjectName: subject.name,
          credits: subject.credits || 3,
          semester: targetSemester,
          academicYear: subject.academicYear,
          term: subject.term,
          gradingMethod: "components",
          finalScore: null,
          components: defaultComponents,
          targetScore: 8.5,
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem(GRADES_STORAGE_KEY, JSON.stringify(grades));
      }
    } catch {}
  }
}

// Đồng bộ sửa thông tin môn học sang bảng điểm (course_grades)
async function syncUpdateGrade(id: string, formData: Partial<SubjectFormData>, isSupabaseActive: boolean) {
  const gradeUpdates: Record<string, any> = {};
  if (formData.code !== undefined) gradeUpdates.subject_code = formData.code;
  if (formData.name !== undefined) gradeUpdates.subject_name = formData.name;
  if (formData.credits !== undefined) gradeUpdates.credits = formData.credits;
  if (formData.semester !== undefined) {
    gradeUpdates.semester = formData.semester && formData.semester.trim() ? formData.semester.trim() : "Chưa xếp kỳ";
  }
  if (formData.academicYear !== undefined) gradeUpdates.academic_year = formData.academicYear || null;
  if (formData.term !== undefined) gradeUpdates.term = formData.term || null;

  if (Object.keys(gradeUpdates).length === 0) return;

  if (supabase && isSupabaseActive) {
    try {
      await supabase
        .from("course_grades")
        .update({ ...gradeUpdates, updated_at: new Date().toISOString() })
        .eq("subject_id", id);
    } catch (e) {
      console.error("Lỗi đồng bộ sửa sang course_grades:", e);
    }
  }

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(GRADES_STORAGE_KEY);
      if (raw) {
        const grades = JSON.parse(raw);
        if (Array.isArray(grades)) {
          const updated = grades.map((g: any) => {
            if (g.subjectId === id) {
              return {
                ...g,
                subjectCode: gradeUpdates.subject_code ?? g.subjectCode,
                subjectName: gradeUpdates.subject_name ?? g.subjectName,
                credits: gradeUpdates.credits ?? g.credits,
                semester: gradeUpdates.semester ?? g.semester,
                academicYear: gradeUpdates.academic_year !== undefined ? gradeUpdates.academic_year : g.academicYear,
                term: gradeUpdates.term !== undefined ? gradeUpdates.term : g.term,
                updatedAt: new Date().toISOString(),
              };
            }
            return g;
          });
          localStorage.setItem(GRADES_STORAGE_KEY, JSON.stringify(updated));
        }
      }
    } catch {}
  }
}

// Đồng bộ xóa môn học khỏi bảng điểm (course_grades)
async function syncDeleteGrade(id: string, isSupabaseActive: boolean) {
  if (supabase && isSupabaseActive) {
    try {
      await supabase.from("course_grades").delete().eq("subject_id", id);
    } catch (e) {
      console.error("Lỗi xóa course_grades liên quan:", e);
    }
  }

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(GRADES_STORAGE_KEY);
      if (raw) {
        const grades = JSON.parse(raw);
        if (Array.isArray(grades)) {
          const filtered = grades.filter((g: any) => g.subjectId !== id);
          localStorage.setItem(GRADES_STORAGE_KEY, JSON.stringify(filtered));
        }
      }
    } catch {}
  }
}

/**
 * Custom hook quản lý danh sách môn học đồng bộ trực tiếp với Supabase Database
 * Có cơ chế dự phòng an toàn (fallback) với localStorage khi mạng yếu hoặc chưa tạo bảng
 */
export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupabaseActive, setIsSupabaseActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Lưu bản sao dự phòng vào localStorage
  const backupToLocalStorage = (list: Subject[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    } catch (err) {
      console.error("Lỗi khi lưu backup vào localStorage:", err);
    }
  };

  // Tải danh sách môn học từ Supabase (hoặc localStorage nếu chưa có bảng)
  const fetchSubjects = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    // 1. Thử lấy dữ liệu từ Supabase nếu client đã khởi tạo
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("subjects")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data) {
          const mapped = data.map(mapRowToSubject);
          setSubjects(mapped);
          backupToLocalStorage(mapped);
          setIsSupabaseActive(true);
          setIsLoading(false);
          return;
        }

        // Báo lỗi nếu bảng chưa được tạo trên Supabase (Mã lỗi PGRST205)
        if (error) {
          console.warn("Supabase notice:", error.message);
          if (error.code === "PGRST205") {
            setErrorMessage(
              "Chưa tìm thấy bảng 'subjects' trong Supabase Database. Vui lòng chạy file supabase_schema.sql trong SQL Editor."
            );
          } else {
            setErrorMessage(`Lỗi Supabase: ${error.message}`);
          }
        }
      } catch (err: any) {
        console.error("Lỗi khi kết nối Supabase:", err);
        setErrorMessage(err.message || "Không thể kết nối với Supabase.");
      }
    }

    // 2. Fallback: Đọc từ localStorage nếu Supabase chưa có bảng hoặc offline
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setSubjects(JSON.parse(stored));
      } else {
        setSubjects(INITIAL_DEMO_SUBJECTS);
        backupToLocalStorage(INITIAL_DEMO_SUBJECTS);
      }
    } catch (err) {
      console.error("Lỗi khi đọc dữ liệu từ localStorage:", err);
      setSubjects(INITIAL_DEMO_SUBJECTS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  /**
   * Kiểm tra mã môn học đã tồn tại hay chưa
   */
  const checkCodeExists = (code: string, excludeId?: string): boolean => {
    const formattedCode = code.trim().toUpperCase();
    return subjects.some(
      (sub) => sub.code.toUpperCase() === formattedCode && sub.id !== excludeId
    );
  };

  /**
   * Thêm môn học mới - Lưu trực tiếp vào Supabase (hoặc localStorage)
   */
  const addSubject = async (
    formData: SubjectFormData
  ): Promise<{ success: boolean; error?: string }> => {
    const formattedCode = formData.code.trim().toUpperCase();

    if (!/^[A-Z0-9_-]{2,10}$/i.test(formattedCode)) {
      return {
        success: false,
        error: "Mã môn học phải gồm từ 2 đến 10 ký tự (chữ hoặc số, VD: MAT, CS101).",
      };
    }

    if (checkCodeExists(formattedCode)) {
      return {
        success: false,
        error: `Mã môn học "${formattedCode}" đã tồn tại trong danh sách!`,
      };
    }

    if (!formData.name.trim()) {
      return { success: false, error: "Vui lòng nhập tên môn học." };
    }

    if (!formData.semester.trim()) {
      return { success: false, error: "Vui lòng chọn hoặc nhập học kỳ." };
    }


    // Thử lưu vào Supabase trước
    if (supabase && isSupabaseActive) {
      try {
        const row = mapSubjectToRow({
          ...formData,
          code: formattedCode,
        });

        const { data, error } = await supabase
          .from("subjects")
          .insert([row])
          .select()
          .single();

        if (error) {
          console.error("Lỗi khi insert môn học vào Supabase:", error);
          return { success: false, error: error.message };
        }

        if (data) {
          const newSubject = mapRowToSubject(data);
          const updatedList = [newSubject, ...subjects];
          setSubjects(updatedList);
          backupToLocalStorage(updatedList);
          // Đồng bộ tự động sang Quản lý điểm số
          await syncAddGrade(newSubject, true);
          return { success: true };
        }
      } catch (err: any) {
        console.error("Lỗi mạng Supabase:", err);
      }
    }

    // Fallback: Lưu cục bộ nếu Supabase chưa kích hoạt
    const newSubject: Subject = {
      ...formData,
      id: "sub-" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      code: formattedCode,
      name: formData.name.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedList = [newSubject, ...subjects];
    setSubjects(updatedList);
    backupToLocalStorage(updatedList);
    // Đồng bộ sang Quản lý điểm số (localStorage)
    await syncAddGrade(newSubject, false);

    return { success: true };
  };

  /**
   * Cập nhật thông tin môn học - Đồng bộ trực tiếp vào Supabase và Bảng điểm (course_grades)
   */
  const updateSubject = async (
    id: string,
    formData: Partial<SubjectFormData>
  ): Promise<{ success: boolean; error?: string }> => {
    if (formData.code) {
      const formattedCode = formData.code.trim().toUpperCase();
      if (!/^[A-Z0-9_-]{2,10}$/i.test(formattedCode)) {
        return {
          success: false,
          error: "Mã môn học phải gồm từ 2 đến 10 ký tự (chữ hoặc số).",
        };
      }
      if (checkCodeExists(formattedCode, id)) {
        return {
          success: false,
          error: `Mã môn học "${formattedCode}" đã được sử dụng bởi môn khác.`,
        };
      }
      formData.code = formattedCode;
    }

    // Cập nhật trên Supabase
    if (supabase && isSupabaseActive) {
      try {
        const row = mapSubjectToRow(formData);
        const { data, error } = await supabase
          .from("subjects")
          .update(row)
          .eq("id", id)
          .select()
          .single();

        if (error) {
          console.error("Lỗi khi update môn học trên Supabase:", error);
          return { success: false, error: error.message };
        }

        if (data) {
          const updatedSubject = mapRowToSubject(data);
          const updatedList = subjects.map((sub) =>
            sub.id === id ? updatedSubject : sub
          );
          setSubjects(updatedList);
          backupToLocalStorage(updatedList);
          // Đồng bộ tự động sang Quản lý điểm số
          await syncUpdateGrade(id, formData, true);
          return { success: true };
        }
      } catch (err: any) {
        console.error("Lỗi mạng Supabase khi update:", err);
      }
    }

    // Fallback cục bộ
    const updatedList = subjects.map((sub) => {
      if (sub.id === id) {
        return { ...sub, ...formData };
      }
      return sub;
    });

    setSubjects(updatedList);
    backupToLocalStorage(updatedList);
    // Đồng bộ sang Quản lý điểm số (localStorage)
    await syncUpdateGrade(id, formData, false);
    return { success: true };
  };

  /**
   * Xoá môn học khỏi Supabase và cập nhật danh sách, đồng thời xoá khỏi Bảng điểm (course_grades)
   */
  const deleteSubject = async (id: string) => {
    if (supabase && isSupabaseActive) {
      try {
        const { error } = await supabase.from("subjects").delete().eq("id", id);
        if (error) {
          console.error("Lỗi khi xoá môn học trên Supabase:", error);
        }
      } catch (err) {
        console.error("Lỗi mạng Supabase khi xoá:", err);
      }
    }

    const updatedList = subjects.filter((sub) => sub.id !== id);
    setSubjects(updatedList);
    backupToLocalStorage(updatedList);

    // Đồng bộ xoá khỏi bảng điểm
    await syncDeleteGrade(id, isSupabaseActive);
  };

  const availableSemesters = Array.from(
    new Set(subjects.map((s) => s.semester))
  ).filter(Boolean);

  return {
    subjects,
    isLoading,
    isSupabaseActive,
    errorMessage,
    addSubject,
    updateSubject,
    deleteSubject,
    checkCodeExists,
    availableSemesters,
    refreshSubjects: fetchSubjects,
  };
}
