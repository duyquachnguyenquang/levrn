/**
 * LEVRN Google Calendar Integration Engine
 * Quản lý đồng bộ 2 chiều thời gian thực giữa LEVRN và Google Calendar qua Google Calendar API v3
 */

import { Subject, GoogleCalendarIntegration } from "./types";
import { supabase } from "./supabase";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v2/userinfo";
const GCAL_BASE_URL = "https://www.googleapis.com/calendar/v3";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/tasks",
].join(" ");

const RRULE_DAY_MAP: Record<number, string> = {
  0: "SU",
  1: "MO",
  2: "TU",
  3: "WE",
  4: "TH",
  5: "FR",
  6: "SA",
};

/**
 * Tạo URL ủy quyền OAuth 2.0 chuyển hướng người dùng sang trang Google
 */
export function getGoogleOAuthUrl(state?: string, customRedirectUri?: string): string {
  const redirectUri = customRedirectUri || `${APP_URL}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent", // Bắt buộc để luôn cấp refresh_token
    include_granted_scopes: "true",
    ...(state ? { state } : {}),
  });

  return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
}

/**
 * Trao đổi Authorization Code lấy Access Token và Refresh Token
 */
export async function exchangeCodeForTokens(code: string, customRedirectUri?: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  email?: string;
}> {
  const redirectUri = customRedirectUri || `${APP_URL}/api/auth/google/callback`;
  const params = new URLSearchParams({
    code,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || data.error || "Không thể lấy token từ Google");
  }

  let email: string | undefined = undefined;
  try {
    const userRes = await fetch(GOOGLE_USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    if (userRes.ok) {
      const userData = await userRes.json();
      email = userData.email;
    }
  } catch {}

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    email,
  };
}

/**
 * Làm mới Access Token khi đã hết hạn bằng Refresh Token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || data.error || "Không thể làm mới token Google");
  }

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Lấy Access Token còn hiệu lực từ integration, tự động refresh nếu hết hạn
 */
export async function getValidAccessToken(
  integration: GoogleCalendarIntegration
): Promise<string> {
  const now = new Date().getTime();
  const expiryTime = integration.tokenExpiry ? new Date(integration.tokenExpiry).getTime() : 0;

  // Nếu token còn hơn 5 phút thì dùng tiếp
  if (expiryTime - now > 5 * 60 * 1000) {
    return integration.accessToken;
  }

  // Nếu sắp hoặc đã hết hạn, gọi làm mới token
  const refreshed = await refreshAccessToken(integration.refreshToken);
  const newExpiry = new Date(Date.now() + refreshed.expiresIn * 1000).toISOString();

  if (supabase) {
    await supabase
      .from("google_calendar_integrations")
      .update({
        access_token: refreshed.accessToken,
        token_expiry: newExpiry,
        updated_at: new Date().toISOString(),
      })
      .eq("id", integration.id);
  }

  return refreshed.accessToken;
}

/**
 * Kiểm tra hoặc tạo mới Lịch con riêng biệt "LEVRN - Lịch học" trên Google Calendar
 */
export async function ensureLevrnCalendar(accessToken: string): Promise<string> {
  // 1. Kiểm tra danh sách calendar hiện có
  const listRes = await fetch(`${GCAL_BASE_URL}/users/me/calendarList`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (listRes.ok) {
    const listData = await listRes.json();
    const existing = listData.items?.find(
      (c: any) => c.summary === "LEVRN - Lịch học"
    );
    if (existing && !existing.deleted) {
      return existing.id;
    }
  }

  // 2. Tạo mới lịch con nếu chưa có
  const createRes = await fetch(`${GCAL_BASE_URL}/calendars`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary: "LEVRN - Lịch học",
      description: "Lịch học tự động đồng bộ từ LEVRN Study Suite",
      timeZone: "Asia/Ho_Chi_Minh",
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json();
    throw new Error(err.error?.message || "Không thể tạo Calendar trên Google");
  }

  const createdData = await createRes.json();
  return createdData.id;
}

/**
 * Chuyển đổi môn học (Subject) trong LEVRN thành đối tượng Event của Google Calendar API
 */
export function buildGoogleCalendarEvent(subject: Subject): any {
  const summary = `[${subject.code}] ${subject.name}`;

  const descriptionParts: string[] = [];
  if (subject.category) descriptionParts.push(`Phân loại: ${subject.category}`);
  if (subject.credits) descriptionParts.push(`Số tín chỉ: ${subject.credits}`);
  if (subject.instructor) descriptionParts.push(`Giảng viên: ${subject.instructor}`);
  if (subject.courseUrl) descriptionParts.push(`Trang LMS: ${subject.courseUrl}`);
  if (subject.driveUrl) descriptionParts.push(`Google Drive: ${subject.driveUrl}`);
  if (subject.note) descriptionParts.push(`Ghi chú: ${subject.note}`);
  descriptionParts.push(`\nĐồng bộ tự động bởi LEVRN Study Suite`);

  const locationParts: string[] = [];
  if (subject.room) locationParts.push(`Phòng ${subject.room}`);
  if (subject.campus) locationParts.push(subject.campus);
  const location = locationParts.join(", ");

  // Xử lý ngày & giờ
  const today = new Date();
  const startDateStr = subject.startDate || `${today.getFullYear()}-09-01`;
  const [sYear, sMonth, sDay] = startDateStr.split("-").map(Number);
  const baseStart = new Date(sYear, sMonth - 1, sDay);

  const startTimeStr = subject.startTime || "07:30";
  const endTimeStr = subject.endTime || "10:30";
  const [startHour, startMin] = startTimeStr.split(":").map(Number);
  const [endHour, endMin] = endTimeStr.split(":").map(Number);

  const scheduledDays =
    subject.scheduleDays && subject.scheduleDays.length > 0
      ? subject.scheduleDays
      : [baseStart.getDay()];

  // Tìm ngày học đầu tiên trên hoặc sau baseStart phù hợp với scheduledDays
  let firstClassDate = new Date(baseStart);
  let found = false;
  for (let offset = 0; offset < 7; offset++) {
    const checkDate = new Date(baseStart.getTime() + offset * 86400000);
    if (scheduledDays.includes(checkDate.getDay())) {
      firstClassDate = checkDate;
      found = true;
      break;
    }
  }
  if (!found) firstClassDate = baseStart;

  const fY = firstClassDate.getFullYear();
  const fM = String(firstClassDate.getMonth() + 1).padStart(2, "0");
  const fD = String(firstClassDate.getDate()).padStart(2, "0");
  const firstDateStr = `${fY}-${fM}-${fD}`;

  const startDateTime = `${firstDateStr}T${String(startHour).padStart(2, "0")}:${String(startMin).padStart(2, "0")}:00+07:00`;
  const endDateTime = `${firstDateStr}T${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}:00+07:00`;

  // Tính ngày kết thúc lặp lại UNTIL
  const totalWeeks = subject.totalWeeks || 15;
  let untilDate: Date;
  if (subject.endDate) {
    const [eYear, eMonth, eDay] = subject.endDate.split("-").map(Number);
    untilDate = new Date(eYear, eMonth - 1, eDay, 23, 59, 59);
  } else {
    untilDate = new Date(baseStart.getTime() + totalWeeks * 7 * 86400000);
  }

  // Định dạng UNTIL theo chuẩn ISO UTC (YYYYMMDDTHHmmssZ)
  const untilUtc = untilDate
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

  const byDays = scheduledDays
    .map((day) => RRULE_DAY_MAP[day])
    .filter(Boolean)
    .join(",");

  const recurrenceRule = `RRULE:FREQ=WEEKLY;BYDAY=${byDays};UNTIL=${untilUtc}`;

  return {
    summary,
    description: descriptionParts.join("\n"),
    location,
    start: {
      dateTime: startDateTime,
      timeZone: "Asia/Ho_Chi_Minh",
    },
    end: {
      dateTime: endDateTime,
      timeZone: "Asia/Ho_Chi_Minh",
    },
    recurrence: [recurrenceRule],
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 30 }, // Báo trước 30 phút
        { method: "popup", minutes: 10 }, // Báo trước 10 phút
      ],
    },
  };
}

/**
 * Đẩy một môn học lên Google Calendar (Thêm mới hoặc Cập nhật)
 */
export async function syncSubjectToGoogleCalendar(
  accessToken: string,
  calendarId: string,
  subject: Subject
): Promise<{ eventId: string; htmlLink?: string }> {
  const eventPayload = buildGoogleCalendarEvent(subject);

  // Nếu đã có googleEventId, cập nhật sự kiện hiện có (PUT/PATCH)
  if (subject.googleEventId) {
    try {
      const updateRes = await fetch(
        `${GCAL_BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(subject.googleEventId)}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(eventPayload),
        }
      );

      if (updateRes.ok) {
        const data = await updateRes.json();
        return { eventId: data.id, htmlLink: data.htmlLink };
      }

      // Nếu sự kiện đã bị xoá thủ công trên Google (404/410), tạo mới lại
      if (updateRes.status === 404 || updateRes.status === 410) {
        console.warn("Event không tồn tại trên Google Calendar, tiến hành tạo mới.");
      }
    } catch (e) {
      console.warn("Lỗi khi update event trên Google Calendar, thử insert mới:", e);
    }
  }

  // Tạo mới sự kiện trên Google Calendar
  const insertRes = await fetch(
    `${GCAL_BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventPayload),
    }
  );

  if (!insertRes.ok) {
    const err = await insertRes.json();
    throw new Error(err.error?.message || "Không thể tạo sự kiện trên Google Calendar");
  }

  const newEvent = await insertRes.json();
  return { eventId: newEvent.id, htmlLink: newEvent.htmlLink };
}

/**
 * Xoá sự kiện môn học khỏi Google Calendar
 */
export async function deleteSubjectFromGoogleCalendar(
  accessToken: string,
  calendarId: string,
  googleEventId: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `${GCAL_BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(googleEventId)}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    return res.status === 204 || res.status === 404;
  } catch (e) {
    console.error("Lỗi khi xoá sự kiện khỏi Google Calendar:", e);
    return false;
  }
}

/**
 * Đồng bộ hàng loạt toàn bộ môn học hiện tại lên Google Calendar
 */
export async function syncAllSubjectsToGoogle(
  accessToken: string,
  calendarId: string,
  subjects: Subject[]
): Promise<Array<{ subjectId: string; googleEventId: string }>> {
  const results: Array<{ subjectId: string; googleEventId: string }> = [];

  for (const subject of subjects) {
    // Nếu môn học được người dùng đánh dấu BỎ QUA (không đồng bộ Google Calendar)
    if (subject.syncToGoogle === false) {
      if (subject.googleEventId) {
        await deleteSubjectFromGoogleCalendar(accessToken, calendarId, subject.googleEventId);
        if (supabase) {
          await supabase.from("subjects").update({ google_event_id: null }).eq("id", subject.id);
        }
      }
      continue;
    }

    try {
      const { eventId } = await syncSubjectToGoogleCalendar(accessToken, calendarId, subject);
      results.push({ subjectId: subject.id, googleEventId: eventId });

      // Lưu google_event_id vào Supabase
      if (supabase) {
        await supabase
          .from("subjects")
          .update({ google_event_id: eventId })
          .eq("id", subject.id);
      }
    } catch (err) {
      console.error(`Lỗi khi sync môn ${subject.code}:`, err);
    }
  }

  return results;
}
