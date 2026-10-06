import { NextRequest, NextResponse } from "next/server";
import { getValidAccessToken } from "@/lib/googleCalendar";
import {
  syncAllTasksToGoogle,
  syncPersonalTasksToGoogle,
  syncGroupTasksToGoogle,
} from "@/lib/googleTasks";
import { supabase, mapRowToSubject } from "@/lib/supabase";
import { GoogleCalendarIntegration, StudyTask, GroupProject, Subject } from "@/lib/types";

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
 * GET: Kiểm tra trạng thái kết nối Google Tasks
 */
export async function GET() {
  try {
    const integration = await getIntegration();
    if (!integration) {
      return NextResponse.json({
        connected: false,
        email: null,
      });
    }

    return NextResponse.json({
      connected: true,
      email: integration.email,
    });
  } catch (error: any) {
    console.error("Lỗi lấy trạng thái Google Tasks:", error);
    return NextResponse.json(
      { error: error.message || "Lỗi kiểm tra kết nối Google Tasks" },
      { status: 500 }
    );
  }
}

/**
 * POST: Đồng bộ nhiệm vụ cá nhân (vào My Tasks) và nhiệm vụ nhóm (vào Groupworks)
 */
export async function POST(request: NextRequest) {
  try {
    const integration = await getIntegration();
    if (!integration) {
      return NextResponse.json(
        { error: "Chưa kết nối tài khoản Google. Vui lòng kết nối tài khoản trước." },
        { status: 400 }
      );
    }

    const accessToken = await getValidAccessToken(integration);
    const body = await request.json().catch(() => ({}));
    const { action = "sync-all" } = body;

    // Lấy dữ liệu subjects (từ client gửi hoặc fallback từ Supabase)
    let subjects: Subject[] = body.subjects || [];
    if (subjects.length === 0 && supabase) {
      const { data: subData } = await supabase.from("subjects").select("*");
      if (subData) {
        subjects = subData.map(mapRowToSubject);
      }
    }

    // Lấy dữ liệu personalTasks
    let personalTasks: StudyTask[] = body.personalTasks || [];
    if (personalTasks.length === 0 && supabase) {
      const { data: taskData } = await supabase.from("study_tasks").select("*");
      if (taskData) {
        personalTasks = taskData.map((row: any) => ({
          id: String(row.id),
          subjectId: row.subject_id || "",
          semester: row.semester || undefined,
          title: row.title || "",
          description: row.description || undefined,
          classification: row.classification || "theory",
          priority: row.priority || "medium",
          status: row.status || "todo",
          date: row.date || "",
          durationMinutes: Number(row.duration_minutes || 60),
          materials: Array.isArray(row.materials) ? row.materials : undefined,
          submissionUrl: row.submission_url || undefined,
          deadline: row.deadline || undefined,
          createdAt: row.created_at || new Date().toISOString(),
        }));
      }
    }

    // Lấy dữ liệu groups
    let groups: GroupProject[] = body.groups || [];
    if (groups.length === 0 && supabase) {
      const { data: groupData } = await supabase.from("group_projects").select("*");
      if (groupData) {
        groups = groupData.map((row: any) => ({
          id: String(row.id),
          name: row.name,
          subjectId: row.subject_id || undefined,
          subjectCode: row.subject_code || "NHÓM",
          subjectName: row.subject_name || "",
          topic: row.topic || "",
          description: row.description || undefined,
          semester: row.semester || undefined,
          status: row.status || "in_progress",
          deadline: row.deadline || undefined,
          driveUrl: row.drive_url || undefined,
          repoUrl: row.repo_url || undefined,
          meetingUrl: row.meeting_url || undefined,
          chatUrl: row.chat_url || undefined,
          members: Array.isArray(row.members) ? row.members : [],
          tasks: Array.isArray(row.tasks) ? row.tasks : [],
          createdAt: row.created_at || new Date().toISOString(),
        }));
      }
    }

    if (action === "sync-personal") {
      const result = await syncPersonalTasksToGoogle(accessToken, personalTasks, subjects);
      return NextResponse.json({
        success: true,
        type: "personal",
        targetList: "My Tasks",
        synced: result.synced,
        created: result.created,
        updated: result.updated,
      });
    }

    if (action === "sync-group") {
      const result = await syncGroupTasksToGoogle(accessToken, groups, subjects);
      return NextResponse.json({
        success: true,
        type: "group",
        targetList: "Groupworks",
        synced: result.synced,
        created: result.created,
        updated: result.updated,
      });
    }

    // Mặc định: sync-all cả cá nhân (vào My Tasks) và nhóm (vào Groupworks)
    const result = await syncAllTasksToGoogle(accessToken, personalTasks, groups, subjects);

    return NextResponse.json({
      success: true,
      type: "all",
      personal: {
        targetList: "My Tasks",
        ...result.personal,
      },
      group: {
        targetList: "Groupworks",
        ...result.group,
      },
      total: result.total,
    });
  } catch (error: any) {
    console.error("Lỗi thực thi API Google Tasks Sync:", error);
    const msg = String(error?.message || "");

    const isApiDisabled =
      msg.includes("Google Tasks API has not been used") ||
      msg.includes("it is disabled") ||
      msg.includes("accessNotConfigured");

    const isScopeError =
      !isApiDisabled &&
      (msg.includes("insufficient authentication scopes") ||
        msg.includes("ACCESS_TOKEN_SCOPE_INSUFFICIENT"));

    const isClientIdError =
      msg.includes("Could not determine client ID from request") ||
      msg.includes("GOOGLE_CLIENT_ID") ||
      msg.includes("GOOGLE_CLIENT_SECRET") ||
      msg.includes("invalid_client");

    let enableApiUrl: string | undefined = undefined;
    let friendlyError = msg || "Lỗi đồng bộ Google Tasks";
    if (isClientIdError) {
      friendlyError =
        "Chưa cấu hình biến môi trường GOOGLE_CLIENT_ID hoặc GOOGLE_CLIENT_SECRET trên Production (Vercel). Vui lòng thêm các biến này vào Settings > Environment Variables của Vercel.";
    } else if (isApiDisabled) {
      const enableMatch = msg.match(/https:\/\/console\.[^\s]+/);
      enableApiUrl = enableMatch
        ? enableMatch[0].replace(/[.,]+$/, "")
        : "https://console.cloud.google.com/apis/library/tasks.googleapis.com";

      friendlyError =
        "Google Tasks API chưa được Bật (Enable) trong Google Cloud Console. Vui lòng bấm vào liên kết để Bật API, đợi 1-2 phút rồi đồng bộ lại.";
    } else if (isScopeError) {
      friendlyError =
        "Tài khoản Google của bạn chưa được cấp quyền Google Tasks. Vui lòng bấm 'Cấp lại quyền' để hoàn tất liên kết.";
    }

    return NextResponse.json(
      {
        error: friendlyError,
        rawError: msg,
        needsReauth: isScopeError,
        isApiDisabled,
        enableApiUrl,
      },
      { status: isScopeError || isApiDisabled ? 403 : 500 }
    );
  }
}
