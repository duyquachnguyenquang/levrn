"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  AttendanceRecord,
  AttendanceStatus,
  SubjectAttendanceSummary,
  Subject,
} from "@/lib/types";
import { supabase } from "@/lib/supabase";

const LOCAL_STORAGE_KEY = "levrn_attendance_data";

/**
 * Tạo tự động danh sách các buổi học (1..totalWeeks) cho một môn học
 */
export function generateSessionsForSubject(subject: Subject): AttendanceRecord[] {
  const weeks = subject.totalWeeks || 15;
  const sessions: AttendanceRecord[] = [];
  const startDate = subject.startDate ? new Date(subject.startDate) : new Date();

  // Xác định ngày trong tuần nếu có cấu hình
  const preferredDay = subject.scheduleDays && subject.scheduleDays.length > 0
    ? subject.scheduleDays[0]
    : startDate.getDay();

  for (let i = 1; i <= weeks; i++) {
    // Tính ngày học tương ứng từng tuần
    const sessionDate = new Date(startDate);
    sessionDate.setDate(startDate.getDate() + (i - 1) * 7);

    // Điều chỉnh ngày về thứ học mong muốn
    const currentDay = sessionDate.getDay();
    const diff = (preferredDay - currentDay + 7) % 7;
    sessionDate.setDate(sessionDate.getDate() + diff);

    const dateStr = sessionDate.toISOString().split("T")[0];

    // Xác định trạng thái mặc định (nếu ngày đã qua -> present hoặc upcoming)
    const todayStr = new Date().toISOString().split("T")[0];
    let status: AttendanceStatus = "upcoming";

    // Tạo mẫu một vài buổi đã học cho demo sinh động
    if (i === 1) status = "present";
    else if (i === 2) status = "present";
    else if (i === 3) status = "late";
    else if (i === 4 && dateStr <= todayStr) status = "present";

    sessions.push({
      id: `att-${subject.id}-${i}`,
      subjectId: subject.id,
      subjectCode: subject.code,
      subjectName: subject.name,
      sessionNumber: i,
      date: dateStr,
      startTime: subject.startTime || "08:00",
      endTime: subject.endTime || "10:30",
      room: subject.room || "P.101",
      status,
      notes: i === 3 ? "Đến trễ 15 phút do kẹt xe" : undefined,
      createdAt: new Date().toISOString(),
    });
  }

  return sessions;
}

export function useAttendance(subjects: Subject[] = []) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupabaseActive, setIsSupabaseActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Khởi tạo và tải dữ liệu điểm danh
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    let loadedRecords: AttendanceRecord[] = [];
    let isSupabaseOk = false;

    // 1. Thử tải từ Supabase nếu có bảng attendance_records
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("attendance_records")
          .select("*")
          .order("session_number", { ascending: true });

        if (!error && data && data.length > 0) {
          loadedRecords = data.map((row: any) => ({
            id: row.id,
            subjectId: row.subject_id,
            subjectCode: row.subject_code,
            subjectName: row.subject_name,
            sessionNumber: row.session_number,
            date: row.date,
            startTime: row.start_time,
            endTime: row.end_time,
            room: row.room,
            status: row.status as AttendanceStatus,
            notes: row.notes,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }));
          isSupabaseOk = true;
        }
      } catch (err) {
        console.warn("Supabase attendance fetch skipped, fallback to localStorage:", err);
      }
    }

    // 2. Nếu Supabase chưa có dữ liệu, đọc từ localStorage
    if (loadedRecords.length === 0 && typeof window !== "undefined") {
      try {
        const local = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (local) {
          loadedRecords = JSON.parse(local);
        }
      } catch (err) {
        console.error("Error reading attendance from localStorage:", err);
      }
    }

    // 3. Nếu vẫn trống và có danh sách môn học, tự động sinh dữ liệu demo cho các môn hiện có
    if (loadedRecords.length === 0 && subjects.length > 0) {
      const generated = subjects.flatMap((s) => generateSessionsForSubject(s));
      loadedRecords = generated;
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(generated));
      }
    }

    setRecords(loadedRecords);
    setIsSupabaseActive(isSupabaseOk);
    setIsLoading(false);
  }, [subjects]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Lưu vào localStorage và Supabase
  const saveRecords = useCallback(
    async (newRecords: AttendanceRecord[]) => {
      setRecords(newRecords);
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newRecords));
      }

      if (supabase && isSupabaseActive) {
        try {
          const rows = newRecords.map((r) => ({
            id: r.id,
            subject_id: r.subjectId,
            subject_code: r.subjectCode,
            subject_name: r.subjectName,
            session_number: r.sessionNumber,
            date: r.date,
            start_time: r.startTime,
            end_time: r.endTime,
            room: r.room,
            status: r.status,
            notes: r.notes,
            updated_at: new Date().toISOString(),
          }));
          await supabase.from("attendance_records").upsert(rows);
        } catch (err) {
          console.error("Supabase upsert error:", err);
        }
      }
    },
    [isSupabaseActive]
  );

  // Cập nhật trạng thái của 1 buổi học
  const updateSessionStatus = useCallback(
    async (recordId: string, newStatus: AttendanceStatus, notes?: string) => {
      const updated = records.map((r) =>
        r.id === recordId
          ? {
              ...r,
              status: newStatus,
              notes: notes !== undefined ? notes : r.notes,
              updatedAt: new Date().toISOString(),
            }
          : r
      );
      await saveRecords(updated);
    },
    [records, saveRecords]
  );

  // Điểm danh nhanh theo subjectId & sessionNumber
  const quickMarkSession = useCallback(
    async (subjectId: string, sessionNumber: number, newStatus: AttendanceStatus) => {
      const updated = records.map((r) =>
        r.subjectId === subjectId && r.sessionNumber === sessionNumber
          ? { ...r, status: newStatus, updatedAt: new Date().toISOString() }
          : r
      );
      await saveRecords(updated);
    },
    [records, saveRecords]
  );

  // Điểm danh cả ngày (đánh dấu có mặt cho tất cả buổi học của ngày hôm nay)
  const markTodayPresent = useCallback(
    async (todayDateString: string) => {
      const updated = records.map((r) =>
        r.date === todayDateString ? { ...r, status: "present" as AttendanceStatus } : r
      );
      await saveRecords(updated);
    },
    [records, saveRecords]
  );

  // Tự động tạo hoặc làm mới các buổi học cho một môn học cụ thể
  const regenerateForSubject = useCallback(
    async (subject: Subject) => {
      const otherRecords = records.filter((r) => r.subjectId !== subject.id);
      const newSubjectSessions = generateSessionsForSubject(subject);
      const combined = [...otherRecords, ...newSubjectSessions];
      await saveRecords(combined);
    },
    [records, saveRecords]
  );

  // Thêm buổi học phát sinh (buổi học bù, phụ đạo)
  const addExtraSession = useCallback(
    async (subjectId: string, sessionData: Partial<AttendanceRecord>) => {
      const subjectSessions = records.filter((r) => r.subjectId === subjectId);
      const nextSessionNumber = subjectSessions.length + 1;
      const targetSub = subjects.find((s) => s.id === subjectId);

      const newRecord: AttendanceRecord = {
        id: `att-${subjectId}-${Date.now()}`,
        subjectId,
        subjectCode: targetSub?.code || sessionData.subjectCode || "SUB",
        subjectName: targetSub?.name || sessionData.subjectName || "Môn học",
        sessionNumber: nextSessionNumber,
        date: sessionData.date || new Date().toISOString().split("T")[0],
        startTime: sessionData.startTime || targetSub?.startTime,
        endTime: sessionData.endTime || targetSub?.endTime,
        room: sessionData.room || targetSub?.room,
        status: sessionData.status || "upcoming",
        notes: sessionData.notes,
        createdAt: new Date().toISOString(),
      };

      await saveRecords([...records, newRecord]);
    },
    [records, subjects, saveRecords]
  );

  // Tính toán tóm tắt chuyên cần theo từng môn học
  const subjectSummaries = useMemo<SubjectAttendanceSummary[]>(() => {
    if (!subjects || subjects.length === 0) return [];

    return subjects.map((sub) => {
      const subRecords = records
        .filter((r) => r.subjectId === sub.id)
        .sort((a, b) => a.sessionNumber - b.sessionNumber);

      const totalWeeks = sub.totalWeeks || 15;
      const presentCount = subRecords.filter((r) => r.status === "present").length;
      const lateCount = subRecords.filter((r) => r.status === "late").length;
      const excusedCount = subRecords.filter((r) => r.status === "excused").length;
      const absentCount = subRecords.filter((r) => r.status === "absent").length;

      // Buổi đã diễn ra và có ghi nhận
      const totalRecorded = presentCount + lateCount + excusedCount + absentCount;
      const totalAbsences = absentCount + excusedCount;

      // Tỷ lệ chuyên cần (%)
      const attendanceRate =
        totalRecorded > 0
          ? Math.round(((presentCount + lateCount * 0.8) / totalRecorded) * 100)
          : 100;

      // Giới hạn vắng tối đa (thường là 20% tổng số buổi)
      const maxAllowedAbsences = Math.max(1, Math.floor(totalWeeks * 0.2));
      const remainingAllowedAbsences = Math.max(0, maxAllowedAbsences - totalAbsences);

      // Cảnh báo cấm thi
      const isBarredFromExam = totalAbsences > maxAllowedAbsences;
      const isAtRisk = !isBarredFromExam && totalAbsences >= maxAllowedAbsences - 1 && totalAbsences > 0;

      return {
        subjectId: sub.id,
        subjectCode: sub.code,
        subjectName: sub.name,
        color: sub.color || "#7D39EB",
        semester: sub.semester || "Chưa xếp kỳ",
        totalWeeks,
        totalRecorded,
        presentCount,
        lateCount,
        excusedCount,
        absentCount,
        totalAbsences,
        attendanceRate,
        maxAllowedAbsences,
        remainingAllowedAbsences,
        isAtRisk,
        isBarredFromExam,
        records: subRecords,
      };
    });
  }, [subjects, records]);

  // Thống kê tổng hợp toàn bộ các môn
  const overallStats = useMemo(() => {
    let totalPresent = 0;
    let totalLate = 0;
    let totalExcused = 0;
    let totalAbsent = 0;
    let barredCount = 0;
    let atRiskCount = 0;

    subjectSummaries.forEach((s) => {
      totalPresent += s.presentCount;
      totalLate += s.lateCount;
      totalExcused += s.excusedCount;
      totalAbsent += s.absentCount;
      if (s.isBarredFromExam) barredCount++;
      if (s.isAtRisk) atRiskCount++;
    });

    const recorded = totalPresent + totalLate + totalExcused + totalAbsent;
    const overallRate =
      recorded > 0 ? Math.round(((totalPresent + totalLate * 0.8) / recorded) * 100) : 100;

    return {
      overallRate,
      totalPresent,
      totalLate,
      totalExcused,
      totalAbsent,
      barredCount,
      atRiskCount,
      totalSubjects: subjectSummaries.length,
    };
  }, [subjectSummaries]);

  return {
    records,
    subjectSummaries,
    overallStats,
    isLoading,
    isSupabaseActive,
    errorMessage,
    updateSessionStatus,
    quickMarkSession,
    markTodayPresent,
    regenerateForSubject,
    addExtraSession,
    refreshAttendance: loadData,
  };
}
