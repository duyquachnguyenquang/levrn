import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForTokens,
  ensureLevrnCalendar,
  syncAllSubjectsToGoogle,
} from "@/lib/googleCalendar";
import { supabase, mapRowToSubject } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const stateStr = searchParams.get("state");

  let returnUrl = "/dashboard";
  let redirectUri: string | undefined = undefined;
  if (stateStr) {
    try {
      const stateObj = JSON.parse(stateStr);
      if (stateObj.returnUrl) returnUrl = stateObj.returnUrl;
      if (stateObj.redirectUri) redirectUri = stateObj.redirectUri;
    } catch {}
  }

  const appUrl = request.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error || !code) {
    const errorMsg = error || "Không nhận được mã xác thực từ Google";
    return NextResponse.redirect(
      new URL(`${returnUrl}?gcal=error&msg=${encodeURIComponent(errorMsg)}`, appUrl)
    );
  }

  try {
    // 1. Đổi code lấy Access Token & Refresh Token
    const { accessToken, refreshToken, expiresIn, email } =
      await exchangeCodeForTokens(code, redirectUri);

    // 2. Đảm bảo lịch con "LEVRN - Lịch học" tồn tại trên Google Calendar
    const calendarId = await ensureLevrnCalendar(accessToken);
    const tokenExpiry = new Date(Date.now() + expiresIn * 1000).toISOString();

    // 3. Lưu thông tin xác thực vào Supabase
    if (supabase) {
      const { data: existingList } = await supabase
        .from("google_calendar_integrations")
        .select("id")
        .limit(1);

      if (existingList && existingList.length > 0) {
        await supabase
          .from("google_calendar_integrations")
          .update({
            email: email || null,
            access_token: accessToken,
            refresh_token: refreshToken,
            token_expiry: tokenExpiry,
            calendar_id: calendarId,
            is_sync_enabled: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingList[0].id);
      } else {
        await supabase.from("google_calendar_integrations").insert([
          {
            email: email || null,
            access_token: accessToken,
            refresh_token: refreshToken,
            token_expiry: tokenExpiry,
            calendar_id: calendarId,
            is_sync_enabled: true,
          },
        ]);
      }

      // 4. Đồng bộ ban đầu: Đẩy toàn bộ môn học hiện tại lên Google Calendar
      const { data: subjectsData } = await supabase
        .from("subjects")
        .select("*")
        .order("created_at", { ascending: false });

      if (subjectsData && subjectsData.length > 0) {
        const subjects = subjectsData.map(mapRowToSubject);
        await syncAllSubjectsToGoogle(accessToken, calendarId, subjects);
      }
    }

    return NextResponse.redirect(
      new URL(`${returnUrl}?gcal=connected`, appUrl)
    );
  } catch (err: any) {
    console.error("Lỗi xử lý callback Google OAuth:", err);
    return NextResponse.redirect(
      new URL(
        `${returnUrl}?gcal=error&msg=${encodeURIComponent(err.message || "Lỗi xử lý đồng bộ")}`,
        appUrl
      )
    );
  }
}
