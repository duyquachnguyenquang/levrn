"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  AttendanceRecord,
  AttendanceStatus,
  SubjectAttendanceSummary,
  Subject,
} from "@/lib/types";
import { supabase } from "@/lib/supabase";
import {
  getLocalDateKey,
  calculateAttendedCount,
  hasValidAttendanceCheckin,
} from "@/lib/checkinUtils";

const LOCAL_STORAGE_KEY = "levrn_attendance_data";

/**
 * Tạo tự động danh sách các buổi học (1..totalWeeks) cho một môn học
 */
export function generateSessionsForSubject(subject: Subject): AttendanceRecord[] {
  const weeks = subject.totalWeeks || 15;
  const sessions: AttendanceRecord[] = [];
  let startDate: Date;
  if (subject.startDate) {
    const [sy, sm, sd] = subject.startDate.split("-").map(Number);
    startDate = new Date(sy, sm - 1, sd);
  } else {
    startDate = new Date();
  }

  // Xác định ngày trong tuần nếu có cấu hình
  const preferredDay =
    subject.scheduleDays && subject.scheduleDays.length > 0
      ? subject.scheduleDays[0]
      : startDate.getDay();

  for (let i = 1; i <= weeks; i++) {
    // Tính ngày học tương ứng từng tuần
    const sessionDate = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate() + (i - 1) * 7
    );

    // Điều chỉnh ngày về thứ học mong muốn
    const currentDay = sessionDate.getDay();
    const diff = (preferredDay - currentDay + 7) % 7;
    sessionDate.setDate(sessionDate.getDate() + diff);

    const dateStr = getLocalDateKey(sessionDate);

    // Xác định trạng thái mặc định (luôn là upcoming)
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
    let sbData: any[] | null = null;
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("attendance_records")
          .select("*")
          .order("session_number", { ascending: true });

        if (!error) {
          isSupabaseOk = true;
          sbData = data;
          if (data && data.length > 0) {
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
          }
        } else {
          console.warn("Supabase attendance fetch error:", error);
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

    // 3. Nếu danh sách môn học có môn chưa được sinh buổi học, bổ sung các buổi học tương ứng
    if (subjects.length > 0) {
      if (loadedRecords.length === 0) {
        const generated = subjects.flatMap((s) => generateSessionsForSubject(s));
        loadedRecords = generated;
      } else {
        const existingSubIds = new Set(loadedRecords.map((r) => r.subjectId));
        const missingSubs = subjects.filter((s) => !existingSubIds.has(s.id));
        if (missingSubs.length > 0) {
          const generated = missingSubs.flatMap((s) => generateSessionsForSubject(s));
          loadedRecords = [...loadedRecords, ...generated];
        }
      }
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(loadedRecords));
      }
    }

    // 4. Khử trùng lặp (Deduplication) và dọn dẹp bản ghi ảo/demo cũ
    const now = new Date();
    const todayStr = getLocalDateKey(now);

    // 4.1. Khử trùng lặp theo (subjectId, date): 1 môn trong 1 ngày chỉ được có 1 bản ghi duy nhất
    const dedupedMap = new Map<string, AttendanceRecord>();
    const duplicateIdsToDelete: string[] = [];

    loadedRecords.forEach((r) => {
      const key = `${r.subjectId}__${r.date || `session-${r.sessionNumber}`}`;
      const existing = dedupedMap.get(key);

      if (!existing) {
        dedupedMap.set(key, r);
      } else {
        // Nếu đã có bản ghi cho ngày này, ưu tiên giữ bản ghi có checkinTime hoặc có status present/late
        const existingHasCheckin = !!existing.checkinTime;
        const currentHasCheckin = !!r.checkinTime;
        const existingIsPresent = existing.status === "present" || existing.status === "late";
        const currentIsPresent = r.status === "present" || r.status === "late";

        if (!existingHasCheckin && currentHasCheckin) {
          duplicateIdsToDelete.push(existing.id);
          dedupedMap.set(key, r);
        } else if (!existingIsPresent && currentIsPresent) {
          duplicateIdsToDelete.push(existing.id);
          dedupedMap.set(key, r);
        } else {
          duplicateIdsToDelete.push(r.id);
        }
      }
    });

    let cleanedRecords = Array.from(dedupedMap.values());
    let hasCleanedMock = duplicateIdsToDelete.length > 0;

    // 4.2. Dọn dẹp bản ghi demo cũ & bản ghi bất hợp lý:
    // - Mọi bản ghi bị gán 'present'/'late' từ code cũ nhưng KHÔNG CÓ checkinTime thực tế
    // - Ngày trong tương lai (> todayStr) bị đánh dấu có mặt
    // - Ghi chú demo "Đến trễ 15 phút do kẹt xe"
    const modifiedCleanedRecords: AttendanceRecord[] = [];

    cleanedRecords = cleanedRecords.map((r) => {
      const hasValidCheckin = hasValidAttendanceCheckin(r);
      const isFutureDate = !!(r.date && r.date > todayStr);
      const isDemoNote = r.notes === "Đến trễ 15 phút do kẹt xe";
      const isInvalidFuture = isFutureDate && (r.status === "present" || r.status === "late");
      const isGhostPresent = (r.status === "present" || r.status === "late") && !hasValidCheckin;

      if (isDemoNote || isInvalidFuture || isGhostPresent) {
        hasCleanedMock = true;
        const updatedRec: AttendanceRecord = {
          ...r,
          status: "upcoming" as AttendanceStatus,
          notes: isDemoNote ? undefined : r.notes,
          checkinTime: undefined,
          updatedAt: new Date().toISOString(),
        };
        modifiedCleanedRecords.push(updatedRec);
        return updatedRec;
      }
      return r;
    });

    if (hasCleanedMock && typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleanedRecords));
    }

    // Nếu Supabase hoạt động và có bản ghi trùng lặp bị loại bỏ, xoá khỏi Supabase
    if (supabase && isSupabaseOk && duplicateIdsToDelete.length > 0) {
      try {
        await supabase.from("attendance_records").delete().in("id", duplicateIdsToDelete);
      } catch (err) {
        console.error("Supabase delete duplicates error:", err);
      }
    }

    // Nếu có bản ghi được dọn dẹp trạng thái ma về upcoming, cập nhật lại lên Supabase
    if (supabase && isSupabaseOk && modifiedCleanedRecords.length > 0) {
      try {
        const rowsToUpdate = modifiedCleanedRecords.map((r) => ({
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
          notes: r.notes || null,
          checked_in_at: null,
          updated_at: new Date().toISOString(),
        }));
        await supabase.from("attendance_records").upsert(rowsToUpdate);
      } catch (err) {
        console.error("Supabase update cleaned records error:", err);
      }
    }

    // 5. Nếu Supabase kết nối được nhưng ban đầu chưa có bản ghi nào, đồng bộ dữ liệu hiện tại lên Supabase
    if (supabase && isSupabaseOk && (!sbData || sbData.length === 0) && cleanedRecords.length > 0) {
      try {
        const rows = cleanedRecords.map((r) => ({
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
          notes: r.notes || null,
          checked_in_at: r.checkinTime || null,
          updated_at: new Date().toISOString(),
        }));
        await supabase.from("attendance_records").upsert(rows);
      } catch (err) {
        console.error("Supabase initial sync error:", err);
      }
    }

    setRecords(cleanedRecords);
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

      if (supabase) {
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
            notes: r.notes || null,
            checked_in_at: r.checkinTime || null,
            updated_at: new Date().toISOString(),
          }));
          const { error } = await supabase.from("attendance_records").upsert(rows);
          if (error) {
            console.error("Supabase upsert error:", error);
          } else {
            setIsSupabaseActive(true);
          }
        } catch (err) {
          console.error("Supabase upsert exception:", err);
        }
      }
    },
    []
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
      const dateStr = targetDateStr || getLocalDateKey(now);
      const totalWeeks = subject.totalWeeks || 15;

      // 1. Tìm xem hôm nay đã có bản ghi của môn này chưa (tìm tất cả matches để tránh duplicate)
      const matchingIndices = records
        .map((r, idx) => (r.subjectId === subject.id && r.date === dateStr ? idx : -1))
        .filter((idx) => idx !== -1);

      let updatedRecord: AttendanceRecord;
      let newRecords: AttendanceRecord[];

      if (matchingIndices.length > 0) {
        const firstIdx = matchingIndices[0];
        const existing = records[firstIdx];
        updatedRecord = {
          ...existing,
          status: "present",
          checkinTime: nowIso,
          updatedAt: nowIso,
        };

        // Nếu phát hiện có nhiều bản ghi trùng cùng ngày, chỉ giữ 1 bản ghi và loại bỏ phần thừa
        if (matchingIndices.length > 1) {
          const redundantIndices = new Set(matchingIndices.slice(1));
          const redundantIds = matchingIndices.slice(1).map((idx) => records[idx].id);
          newRecords = records
            .filter((_, idx) => !redundantIndices.has(idx))
            .map((r) => (r.id === existing.id ? updatedRecord : r));

          if (supabase) {
            supabase.from("attendance_records").delete().in("id", redundantIds).then();
          }
        } else {
          newRecords = [...records];
          newRecords[firstIdx] = updatedRecord;
        }
      } else {
        // Tìm số buổi đã học theo số ngày duy nhất để xác định sessionNumber tiếp theo
        const subRecords = records.filter((r) => r.subjectId === subject.id);
        const attendedCount = calculateAttendedCount(subRecords, dateStr);
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
      const now = new Date();
      const todayStr = getLocalDateKey(now);
      const presentDates = new Set(
        subRecords
          .filter(
            (r) =>
              r.status === "present" &&
              (!r.date || r.date <= todayStr) &&
              hasValidAttendanceCheckin(r)
          )
          .map((r) => r.date || `session-${r.sessionNumber}`)
      );
      const lateDates = new Set(
        subRecords
          .filter(
            (r) =>
              r.status === "late" &&
              (!r.date || r.date <= todayStr) &&
              hasValidAttendanceCheckin(r)
          )
          .map((r) => r.date || `session-${r.sessionNumber}`)
      );
      const excusedDates = new Set(
        subRecords
          .filter((r) => r.status === "excused" && (!r.date || r.date <= todayStr))
          .map((r) => r.date || `session-${r.sessionNumber}`)
      );
      const absentDates = new Set(
        subRecords
          .filter((r) => r.status === "absent" && (!r.date || r.date <= todayStr))
          .map((r) => r.date || `session-${r.sessionNumber}`)
      );

      const presentCount = presentDates.size;
      const lateCount = lateDates.size;
      const excusedCount = excusedDates.size;
      const absentCount = absentDates.size;

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
      const todayStr = getLocalDateKey(now);
      if (dateStr > todayStr) {
        return { success: false, message: "Chưa đến ngày học, không thể điểm danh trước" };
      }

      const nowIso = now.toISOString();
      let updatedList = [...records];
      const redundantIdsToDelete: string[] = [];

      for (const sub of subjectsToMark) {
        const matchingIndices = updatedList
          .map((r, i) => (r.subjectId === sub.id && r.date === dateStr ? i : -1))
          .filter((i) => i !== -1);

        if (matchingIndices.length > 0) {
          const firstIdx = matchingIndices[0];
          updatedList[firstIdx] = {
            ...updatedList[firstIdx],
            status: "present",
            checkinTime: nowIso,
            updatedAt: nowIso,
          };

          // Nếu có các bản ghi trùng lặp thừa vào cùng ngày đó, loại bỏ đi
          if (matchingIndices.length > 1) {
            const redundantIndices = new Set(matchingIndices.slice(1));
            matchingIndices.slice(1).forEach((i) => {
              redundantIdsToDelete.push(updatedList[i].id);
            });
            updatedList = updatedList.filter((_, i) => !redundantIndices.has(i));
          }
        } else {
          const totalWeeks = sub.totalWeeks || 15;
          const subRecords = updatedList.filter((r) => r.subjectId === sub.id);
          const attendedCount = calculateAttendedCount(subRecords, dateStr);
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

      if (redundantIdsToDelete.length > 0 && supabase) {
        try {
          await supabase.from("attendance_records").delete().in("id", redundantIdsToDelete);
        } catch (err) {
          console.error("Supabase delete redundant error:", err);
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
            return {
              ...r,
              status: "upcoming" as AttendanceStatus,
              checkinTime: undefined,
              updatedAt: new Date().toISOString(),
            };
          }
          return r;
        });
      } else {
        updatedList = updatedList.map((r) => {
          if (r.date === dateStr) {
            return {
              ...r,
              status: "upcoming" as AttendanceStatus,
              checkinTime: undefined,
              updatedAt: new Date().toISOString(),
            };
          }
          return r;
        });
      }
      await saveRecords(updatedList);
      return { success: true, message: "Đã hủy điểm danh" };
    },
    [records, saveRecords]
  );

  // Lấy số ngày đã học/điểm danh của 1 môn học (theo số ngày duy nhất)
  const getSubjectAttendedCount = useCallback(
    (subjectId: string): number => {
      const now = new Date();
      const todayStr = getLocalDateKey(now);
      const subRecords = records.filter((r) => r.subjectId === subjectId);
      return calculateAttendedCount(subRecords, todayStr);
    },
    [records]
  );

  // Kiểm tra 1 môn học đã điểm danh vào ngày cụ thể chưa
  const isSubjectDateCheckedIn = useCallback(
    (dateStr: string, subjectId: string): boolean => {
      const now = new Date();
      const todayStr = getLocalDateKey(now);
      if (dateStr > todayStr) return false;
      return records.some(
        (r) =>
          r.subjectId === subjectId &&
          r.date === dateStr &&
          (r.status === "present" || r.status === "late") &&
          hasValidAttendanceCheckin(r)
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
