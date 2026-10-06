import { NextRequest, NextResponse } from "next/server";
import {
  getValidAccessToken,
  syncSubjectToGoogleCalendar,
  deleteSubjectFromGoogleCalendar,
  syncAllSubjectsToGoogle,
} from "@/lib/googleCalendar";
import { supabase, mapRowToSubject } from "@/lib/supabase";
import { GoogleCalendarIntegration, Subject } from "@/lib/types";

// Lấy thông tin integration từ Supabase
async function getIntegration(): Promise<GoogleCalendarIntegration | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("google_calendar_integrations")
    .select("*")
    .limit(1)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    email: data.email,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    tokenExpiry: data.token_expiry,
    calendarId: data.calendar_id,
    isSyncEnabled: data.is_sync_enabled ?? true,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * GET: Kiểm tra trạng thái kết nối Google Calendar
 */
export async function GET() {
  try {
    const integration = await getIntegration();
    if (!integration) {
      return NextResponse.json({
        connected: false,
        isSyncEnabled: false,
      });
    }

    return NextResponse.json({
      connected: true,
      email: integration.email,
      calendarId: integration.calendarId,
      isSyncEnabled: integration.isSyncEnabled,
      updatedAt: integration.updatedAt,
    });
  } catch (error: any) {
    console.error("Lỗi lấy trạng thái Google Calendar:", error);
    return NextResponse.json(
      { error: error.message || "Lỗi kiểm tra kết nối" },
      { status: 500 }
    );
  }
}

/**
 * POST: Thực hiện các hành động đồng bộ
 * - sync-subject: Đồng bộ 1 môn học (thêm mới hoặc cập nhật)
 * - delete-subject: Xóa 1 môn học khỏi Google Calendar
 * - sync-all: Đồng bộ lại toàn bộ danh sách môn học
 */
export async function POST(request: NextRequest) {
  try {
    const integration = await getIntegration();
    if (!integration || !integration.isSyncEnabled || !integration.calendarId) {
      return NextResponse.json(
        { error: "Chưa kết nối Google Calendar hoặc đồng bộ bị tắt" },
        { status: 400 }
      );
    }

    const accessToken = await getValidAccessToken(integration);
    const body = await request.json();
    const { action, subject, googleEventId } = body;

    // 1. Đồng bộ 1 môn học
    if (action === "sync-subject" && subject) {
      if (subject.syncToGoogle === false) {
        if (subject.googleEventId) {
          await deleteSubjectFromGoogleCalendar(accessToken, integration.calendarId, subject.googleEventId);
          if (supabase) {
            await supabase.from("subjects").update({ google_event_id: null, sync_to_google: false }).eq("id", subject.id);
          }
        }
        return NextResponse.json({ success: true, skipped: true });
      }

      const result = await syncSubjectToGoogleCalendar(
        accessToken,
        integration.calendarId,
        subject as Subject
      );

      // Cập nhật lại google_event_id vào bảng subjects
      if (supabase && result.eventId && result.eventId !== subject.googleEventId) {
        await supabase
          .from("subjects")
          .update({ google_event_id: result.eventId, sync_to_google: true })
          .eq("id", subject.id);
      }

      return NextResponse.json({
        success: true,
        googleEventId: result.eventId,
        htmlLink: result.htmlLink,
      });
    }

    // 2. Xóa 1 môn học khỏi Google Calendar
    if (action === "delete-subject" && googleEventId) {
      const success = await deleteSubjectFromGoogleCalendar(
        accessToken,
        integration.calendarId,
        googleEventId
      );
      return NextResponse.json({ success });
    }

    // 3. Bật hoặc tắt đồng bộ cho 1 môn học cụ thể
    if (action === "toggle-subject" && body.subjectId) {
      const { subjectId, enabled } = body;
      if (!supabase) return NextResponse.json({ error: "Supabase chưa sẵn sàng" }, { status: 500 });

      const { data: subData, error: subErr } = await supabase
        .from("subjects")
        .select("*")
        .eq("id", subjectId)
        .single();

      if (subErr || !subData) {
        return NextResponse.json({ error: "Không tìm thấy thông tin môn học" }, { status: 404 });
      }

      const subject = mapRowToSubject(subData);

      if (enabled) {
        // Đẩy lên Google Calendar
        const res = await syncSubjectToGoogleCalendar(accessToken, integration.calendarId, {
          ...subject,
          syncToGoogle: true,
        });

        await supabase
          .from("subjects")
          .update({ google_event_id: res.eventId, sync_to_google: true })
          .eq("id", subjectId);

        return NextResponse.json({ success: true, enabled: true, googleEventId: res.eventId });
      } else {
        // Gỡ khỏi Google Calendar
        if (subject.googleEventId) {
          await deleteSubjectFromGoogleCalendar(accessToken, integration.calendarId, subject.googleEventId);
        }

        await supabase
          .from("subjects")
          .update({ google_event_id: null, sync_to_google: false })
          .eq("id", subjectId);

        return NextResponse.json({ success: true, enabled: false });
      }
    }

    // 3. Đồng bộ lại toàn bộ môn học
    if (action === "sync-all") {
      if (!supabase) {
        return NextResponse.json({ error: "Supabase chưa sẵn sàng" }, { status: 500 });
      }

      const { data: subjectsData, error: subError } = await supabase
        .from("subjects")
        .select("*")
        .order("created_at", { ascending: false });

      if (subError) {
        return NextResponse.json({ error: subError.message }, { status: 500 });
      }

      const subjects = (subjectsData || []).map(mapRowToSubject);
      const results = await syncAllSubjectsToGoogle(
        accessToken,
        integration.calendarId,
        subjects
      );

      return NextResponse.json({
        success: true,
        count: results.length,
      });
    }

    return NextResponse.json({ error: "Action không hợp lệ" }, { status: 400 });
  } catch (error: any) {
    console.error("Lỗi thực thi API Google Calendar Sync:", error);
    let msg = error?.message || "Lỗi đồng bộ Google Calendar";
    if (
      msg.includes("Could not determine client ID from request") ||
      msg.includes("GOOGLE_CLIENT_ID") ||
      msg.includes("GOOGLE_CLIENT_SECRET") ||
      msg.includes("invalid_client")
    ) {
      msg =
        "Chưa cấu hình biến môi trường GOOGLE_CLIENT_ID hoặc GOOGLE_CLIENT_SECRET trên Production (Vercel). Vui lòng thêm các biến này vào Settings > Environment Variables của Vercel.";
    }
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Hủy kết nối Google Calendar
 */
export async function DELETE() {
  try {
    if (supabase) {
      await supabase
        .from("google_calendar_integrations")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Xóa bản ghi integration
    }

    return NextResponse.json({ success: true, message: "Đã hủy kết nối Google Calendar" });
  } catch (error: any) {
    console.error("Lỗi hủy kết nối Google Calendar:", error);
    return NextResponse.json(
      { error: error.message || "Lỗi khi hủy kết nối" },
      { status: 500 }
    );
  }
}
