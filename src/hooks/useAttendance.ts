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
    const status: AttendanceStatus = "upcoming";

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
            checkinTime: row.checked_in_at || row.checkin_time || undefined,
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

    // 3. Nếu vẫn trống và có danh sách môn học, tự động sinh dữ liệu các buổi học cho các môn hiện có
    if (loadedRecords.length === 0 && subjects.length > 0) {
      const generated = subjects.flatMap((s) => generateSessionsForSubject(s));
      loadedRecords = generated;
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(generated));
      }
    }

    // 4. Dọn dẹp dữ liệu demo cũ: reset MỌI bản ghi present/late không có checkinTime hợp lệ
    // ID demo cũ: att-{subjectId}-{1..15} (kết thúc bằng số 1-2 chữ số)
    // ID thực: att-{subjectId}-{timestamp13} hoặc att-{subjectId}-{timestamp}-{random}
    const LEGACY_ID_REGEX = /^att-[^-]+-(\d{1,2})$/; // chỉ match suffix 1-2 chữ số (session number)
    const VALID_CHECKIN_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;   // ISO datetime

    let hasCleanedMock = false;
    loadedRecords = loadedRecords.map((r) => {
      const isLegacyId = LEGACY_ID_REGEX.test(r.id);
      const hasValidCheckin = r.checkinTime && VALID_CHECKIN_RE.test(r.checkinTime);
      const isGhostPresent = (r.status === "present" || r.status === "late") && !hasValidCheckin;
      const isDemoNote = r.notes === "Đến trễ 15 phút do kẹt xe";

      if (isDemoNote || (isLegacyId && isGhostPresent)) {
        hasCleanedMock = true;
        return {
          ...r,
          status: "upcoming" as AttendanceStatus,
          notes: isDemoNote ? undefined : r.notes,
          checkinTime: undefined,
        };
      }
      return r;
    });

    if (hasCleanedMock && typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(loadedRecords));
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
            checked_in_at: r.checkinTime || null,
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

  // Điểm danh môn học hôm nay (cập nhật trạng thái present + thời gian điểm danh thực tế)
  const checkinSubjectToday = useCallback(
    async (
      subject: Subject,
      targetDateStr?: string
    ): Promise<{ success: boolean; message: string; record?: AttendanceRecord }> => {
      const now = new Date();
      const nowIso = now.toISOString();
      const dateStr = targetDateStr || nowIso.split("T")[0];
      const totalWeeks = subject.totalWeeks || 15;

      // 1. Tìm xem hôm nay đã có bản ghi của môn này chưa
      const existingIdx = records.findIndex(
        (r) => r.subjectId === subject.id && r.date === dateStr
      );

      let updatedRecord: AttendanceRecord;
      let newRecords: AttendanceRecord[];

      if (existingIdx >= 0) {
        const existing = records[existingIdx];
        updatedRecord = {
          ...existing,
          status: "present",
          checkinTime: nowIso,
          updatedAt: nowIso,
        };
        newRecords = [...records];
        newRecords[existingIdx] = updatedRecord;
      } else {
        // Tìm số buổi đã học để xác định sessionNumber tiếp theo
        const attendedCount = records.filter(
          (r) => r.subjectId === subject.id && (r.status === "present" || r.status === "late")
        ).length;
        const nextSessionNum = Math.min(totalWeeks, attendedCount + 1);

        updatedRecord = {
          id: `att-${subject.id}-${Date.now()}`,
          subjectId: subject.id,
          subjectCode: subject.code,
          subjectName: subject.name,
          sessionNumber: nextSessionNum,
          date: dateStr,
          startTime: subject.startTime || "08:00",
          endTime: subject.endTime || "10:30",
          room: subject.room || "P.101",
          status: "present",
          checkinTime: nowIso,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        newRecords = [updatedRecord, ...records];
      }

      await saveRecords(newRecords);
      return {
        success: true,
        message: `Điểm danh thành công môn [${subject.code}] ${subject.name}`,
        record: updatedRecord,
      };
    },
    [records, saveRecords]
  );

  // Điểm danh cả ngày (đánh dấu có mặt cho tất cả buổi học của ngày hôm nay)
  const markTodayPresent = useCallback(
    async (todayDateString: string) => {
      const updated = records.map((r) =>
        r.date === todayDateString
          ? {
              ...r,
              status: "present" as AttendanceStatus,
              checkinTime: r.checkinTime || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : r
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

  // Chỉnh sửa hoặc thêm mới bản ghi điểm danh (hỗ trợ sửa thời gian điểm danh đối với ngày quên điểm danh)
  const editOrAddAttendanceRecord = useCallback(
    async (params: {
      subject: Subject;
      date: string; // YYYY-MM-DD
      time?: string; // HH:mm
      status: AttendanceStatus;
      notes?: string;
      recordId?: string;
    }): Promise<{ success: boolean; message: string; record?: AttendanceRecord }> => {
      const { subject, date, time, status, notes, recordId } = params;

      let checkinTimeIso: string | undefined = undefined;
      if (time) {
        const [h, m] = time.split(":").map(Number);
        const [year, month, day] = date.split("-").map(Number);
        const d = new Date(year, month - 1, day, h || 0, m || 0);
        checkinTimeIso = !isNaN(d.getTime()) ? d.toISOString() : new Date().toISOString();
      } else {
        checkinTimeIso = new Date().toISOString();
      }

      const nowIso = new Date().toISOString();
      let updatedList = [...records];
      let targetRecord: AttendanceRecord;

      // Tìm theo recordId hoặc tìm theo subjectId và date
      const idxById = recordId ? updatedList.findIndex((r) => r.id === recordId) : -1;
      const idxByDate =
        idxById >= 0
          ? idxById
          : updatedList.findIndex((r) => r.subjectId === subject.id && r.date === date);

      if (idxByDate >= 0) {
        const existing = updatedList[idxByDate];
        targetRecord = {
          ...existing,
          date,
          status,
          checkinTime: checkinTimeIso,
          notes: notes !== undefined ? notes : existing.notes,
          updatedAt: nowIso,
        };
        updatedList[idxByDate] = targetRecord;
      } else {
        const totalWeeks = subject.totalWeeks || 15;
        const subjectRecords = updatedList.filter((r) => r.subjectId === subject.id);
        const sessionNumber = Math.min(totalWeeks, subjectRecords.length + 1);

        targetRecord = {
          id: `att-${subject.id}-${Date.now()}`,
          subjectId: subject.id,
          subjectCode: subject.code,
          subjectName: subject.name,
          sessionNumber,
          date,
          startTime: subject.startTime || "08:00",
          endTime: subject.endTime || "10:30",
          room: subject.room || "P.101",
          status,
          checkinTime: checkinTimeIso,
          notes,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        updatedList.unshift(targetRecord);
      }

      await saveRecords(updatedList);
      return {
        success: true,
        message: `Đã cập nhật thời gian điểm danh môn [${subject.code}] ${subject.name}`,
        record: targetRecord,
      };
    },
    [records, saveRecords]
  );

  // Xóa một bản ghi điểm danh
  const deleteAttendanceRecord = useCallback(
    async (recordId: string) => {
      const updated = records.filter((r) => r.id !== recordId);
      await saveRecords(updated);
      if (supabase && isSupabaseActive) {
        try {
          await supabase.from("attendance_records").delete().eq("id", recordId);
        } catch (err) {
          console.error("Supabase delete attendance error:", err);
        }
      }
    },
    [records, saveRecords, isSupabaseActive]
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
        imageUrl: sub.imageUrl,
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

  // Điểm danh cho danh sách các môn vào một ngày cụ thể (áp dụng cả điểm danh hôm nay và điểm danh bù)
  const checkinMultipleSubjectsForDate = useCallback(
    async (dateStr: string, subjectsToMark: Subject[]): Promise<{ success: boolean; message: string }> => {
      if (!subjectsToMark || subjectsToMark.length === 0) {
        return { success: false, message: "Không có môn học nào để điểm danh" };
      }

      // Không cho phép điểm danh ngày tương lai
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      if (dateStr > todayStr) {
        return { success: false, message: "Chưa đến ngày học, không thể điểm danh trước" };
      }

      const nowIso = now.toISOString();
      let updatedList = [...records];

      for (const sub of subjectsToMark) {
        const existingIdx = updatedList.findIndex(
          (r) => r.subjectId === sub.id && r.date === dateStr
        );

        if (existingIdx >= 0) {
          updatedList[existingIdx] = {
            ...updatedList[existingIdx],
            status: "present",
            checkinTime: nowIso,
            updatedAt: nowIso,
          };
        } else {
          const totalWeeks = sub.totalWeeks || 15;
          const subRecords = updatedList.filter((r) => r.subjectId === sub.id);
          const attendedCount = subRecords.filter(
            (r) => r.status === "present" || r.status === "late"
          ).length;
          const sessionNumber = Math.min(totalWeeks, attendedCount + 1);

          const newRec: AttendanceRecord = {
            id: `att-${sub.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            subjectId: sub.id,
            subjectCode: sub.code,
            subjectName: sub.name,
            sessionNumber,
            date: dateStr,
            startTime: sub.startTime || "08:00",
            endTime: sub.endTime || "10:30",
            room: sub.room || "P.101",
            status: "present",
            checkinTime: nowIso,
            createdAt: nowIso,
            updatedAt: nowIso,
          };
          updatedList.unshift(newRec);
        }
      }

      await saveRecords(updatedList);
      return { success: true, message: "Điểm danh thành công" };
    },
    [records, saveRecords]
  );

  // Hủy điểm danh cho một ngày (khi bấm nhầm)
  const cancelCheckinForDate = useCallback(
    async (dateStr: string, subjectIds?: string[]): Promise<{ success: boolean; message: string }> => {
      let updatedList = [...records];
      if (subjectIds && subjectIds.length > 0) {
        updatedList = updatedList.map((r) => {
          if (r.date === dateStr && subjectIds.includes(r.subjectId)) {
            return { ...r, status: "upcoming" as AttendanceStatus, updatedAt: new Date().toISOString() };
          }
          return r;
        });
      } else {
        updatedList = updatedList.map((r) => {
          if (r.date === dateStr) {
            return { ...r, status: "upcoming" as AttendanceStatus, updatedAt: new Date().toISOString() };
          }
          return r;
        });
      }
      await saveRecords(updatedList);
      return { success: true, message: "Đã hủy điểm danh" };
    },
    [records, saveRecords]
  );

  // Lấy số ngày đã học/điểm danh của 1 môn học
  const getSubjectAttendedCount = useCallback(
    (subjectId: string): number => {
      return records.filter(
        (r) => r.subjectId === subjectId && (r.status === "present" || r.status === "late")
      ).length;
    },
    [records]
  );

  // Kiểm tra 1 môn học đã điểm danh vào ngày cụ thể chưa
  const isSubjectDateCheckedIn = useCallback(
    (dateStr: string, subjectId: string): boolean => {
      return records.some(
        (r) => r.subjectId === subjectId && r.date === dateStr && (r.status === "present" || r.status === "late")
      );
    },
    [records]
  );

  return {
    records,
    subjectSummaries,
    overallStats,
    isLoading,
    isSupabaseActive,
    errorMessage,
    updateSessionStatus,
    quickMarkSession,
    checkinSubjectToday,
    checkinMultipleSubjectsForDate,
    cancelCheckinForDate,
    getSubjectAttendedCount,
    isSubjectDateCheckedIn,
    editOrAddAttendanceRecord,
    deleteAttendanceRecord,
    markTodayPresent,
    regenerateForSubject,
    addExtraSession,
    refreshAttendance: loadData,
  };
}
