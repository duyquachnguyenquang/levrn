/**
 * LEVRN Google Tasks Integration Engine
 * Quản lý đồng bộ 2 chiều các nhiệm vụ cá nhân (vào My Tasks) và đồ án nhóm (vào Groupworks)
 * qua Google Tasks API v1 với định dạng [Mã môn] Tên nhiệm vụ, ngày đến hạn cả ngày, và tài liệu đính kèm.
 */

import { StudyTask, GroupProject, GroupTask, Subject } from "./types";

const GTASKS_BASE_URL = "https://tasks.googleapis.com/tasks/v1";

/**
 * Trích xuất ngày chuẩn YYYY-MM-DD từ chuỗi ngày / deadline
 */
export function extractDateString(dateOrDeadline?: string): string | null {
  if (!dateOrDeadline) return null;
  const trimmed = dateOrDeadline.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.substring(0, 10);
  }
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  return null;
}

/**
 * Chuyển đổi ngày sang định dạng RFC 3339 cả ngày cho Google Tasks API
 * Yêu cầu: YYYY-MM-DDT00:00:00.000Z
 */
export function toGoogleTasksDueDate(dateOrDeadline?: string): string | undefined {
  const dateStr = extractDateString(dateOrDeadline);
  if (!dateStr) return undefined;
  return `${dateStr}T00:00:00.000Z`;
}

/**
 * Tìm hoặc tạo mới một Task List trên Google Tasks theo tên (VD: "Groupworks")
 */
export async function ensureTaskList(accessToken: string, listTitle: string): Promise<string> {
  // 1. Lấy danh sách các Task List hiện có
  const res = await fetch(`${GTASKS_BASE_URL}/users/@me/lists?maxResults=100`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || "Không thể truy vấn danh sách Google Tasks");
  }

  const data = await res.json();
  const items: Array<{ id: string; title: string }> = data.items || [];

  // Tìm kiếm theo tên (không phân biệt chữ hoa thường)
  const existing = items.find(
    (item) => item.title.trim().toLowerCase() === listTitle.trim().toLowerCase()
  );

  if (existing) {
    return existing.id;
  }

  // 2. Nếu chưa có, tạo Task List mới
  const createRes = await fetch(`${GTASKS_BASE_URL}/users/@me/lists`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      title: listTitle,
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Không thể tạo danh sách "${listTitle}" trên Google Tasks`);
  }

  const createdData = await createRes.json();
  return createdData.id;
}

/**
 * Lấy danh sách toàn bộ các task trong 1 Task List
 */
export async function getTaskListItems(
  accessToken: string,
  listId: string
): Promise<Array<{ id: string; title: string; notes?: string; due?: string; status?: string }>> {
  const url = `${GTASKS_BASE_URL}/lists/${encodeURIComponent(listId)}/tasks?showCompleted=true&showHidden=true&maxResults=100`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    return [];
  }

  const data = await res.json();
  return data.items || [];
}

/**
 * Tạo nội dung Notes chứa đầy đủ tài liệu & file đính kèm (Attachments)
 */
export function buildTaskNotesWithAttachments(params: {
  taskTitle: string;
  subjectCode?: string;
  subjectName?: string;
  taskType?: string;
  statusText?: string;
  deadlineText?: string;
  descriptionOrNotes?: string;
  attachments: Array<{ title: string; url: string }>;
  taskId: string;
}): string {
  const {
    taskTitle,
    subjectCode,
    subjectName,
    taskType,
    statusText,
    deadlineText,
    descriptionOrNotes,
    attachments,
    taskId,
  } = params;

  const sections: string[] = [];

  // 1. Khối tài liệu & file đính kèm (Attachments) đặt ở đầu
  if (attachments.length > 0) {
    sections.push("📎 TÀI LIỆU & FILE ĐÍNH KÈM (ATTACHMENTS):");
    attachments.forEach((att) => {
      sections.push(`• ${att.title}: ${att.url}`);
    });
  } else {
    sections.push("📎 TÀI LIỆU: Chưa đính kèm file trong LEVRN.");
  }

  sections.push("────────────────────────");

  // 2. Thông tin chi tiết nhiệm vụ
  sections.push("📋 THÔNG TIN NHIỆM VỤ LEVRN:");
  sections.push(`• Tiêu đề: ${taskTitle}`);
  if (subjectCode || subjectName) {
    sections.push(`• Môn học: [${subjectCode || "N/A"}] ${subjectName || ""}`.trim());
  }
  if (taskType) {
    sections.push(`• Phân loại: ${taskType}`);
  }
  if (statusText) {
    sections.push(`• Trạng thái: ${statusText}`);
  }
  if (deadlineText) {
    sections.push(`• Hạn chót: ${deadlineText}`);
  }

  // 3. Ghi chú mô tả thêm
  if (descriptionOrNotes && descriptionOrNotes.trim()) {
    sections.push("\n📝 GHI CHÚ BỔ SUNG:");
    sections.push(descriptionOrNotes.trim());
  }

  // 4. Thẻ định danh ngầm để đồng bộ không bị trùng lặp
  sections.push(`\n[LEVRN-TASK-ID:${taskId}]`);

  return sections.join("\n");
}

/**
 * Xây dựng payload Google Task cho Nhiệm vụ cá nhân (Personal Task)
 */
export function buildGoogleTaskPayloadForPersonal(
  task: StudyTask,
  subjects: Subject[]
): {
  title: string;
  due?: string;
  notes: string;
  status: "needsAction" | "completed";
} {
  const subject = subjects.find((s) => s.id === task.subjectId);
  const subjectCode = subject?.code || "CÁ NHÂN";
  const subjectName = subject?.name || "";

  // Tên task: [Mã môn] Tên nhiệm vụ (theo đúng yêu cầu người dùng)
  const taskTitle = `[${subjectCode}] ${task.title}`;

  // Ngày đến hạn cả ngày
  const dueDate = toGoogleTasksDueDate(task.deadline || task.date);

  // Thu thập toàn bộ file và liên kết đính kèm
  const attachments: Array<{ title: string; url: string }> = [];

  if (task.materials && Array.isArray(task.materials)) {
    task.materials.forEach((m) => {
      if (m.url) attachments.push({ title: m.title || "Tài liệu học", url: m.url });
    });
  }

  if (task.submissionUrl) {
    attachments.push({ title: "Link nộp bài (LMS/Form)", url: task.submissionUrl });
  }

  if (subject?.driveUrl) {
    attachments.push({ title: `Google Drive môn [${subject.code}]`, url: subject.driveUrl });
  }

  if (subject?.courseUrl) {
    attachments.push({ title: `Hệ thống môn học (Course LMS)`, url: subject.courseUrl });
  }

  const statusText =
    task.status === "completed"
      ? "Đã hoàn thành"
      : task.status === "in_progress"
      ? "Đang thực hiện"
      : "Cần làm";

  const deadlineText = task.deadline
    ? task.deadline.replace("T", " ")
    : task.date
    ? `${task.date} (Cả ngày)`
    : "Không có";

  const notes = buildTaskNotesWithAttachments({
    taskTitle: task.title,
    subjectCode,
    subjectName,
    taskType:
      task.classification === "review"
        ? "Ôn thi & Đánh giá"
        : task.classification === "exercise"
        ? "Bài tập & Thực hành"
        : task.classification === "quiz"
        ? "Luyện trắc nghiệm"
        : task.classification === "flashcard"
        ? "Flashcard ôn tập"
        : task.classification === "reading"
        ? "Đọc tài liệu & Tóm tắt"
        : "Tự học lý thuyết",
    statusText,
    deadlineText,
    descriptionOrNotes: task.notes || task.description,
    attachments,
    taskId: task.id,
  });

  return {
    title: taskTitle,
    due: dueDate,
    notes,
    status: task.status === "completed" ? "completed" : "needsAction",
  };
}

/**
 * Xây dựng payload Google Task cho Nhiệm vụ nhóm (Group Task)
 */
export function buildGoogleTaskPayloadForGroup(
  task: GroupTask,
  project: GroupProject,
  subjects: Subject[]
): {
  title: string;
  due?: string;
  notes: string;
  status: "needsAction" | "completed";
} {
  const subject = subjects.find((s) => s.id === project.subjectId || s.code === project.subjectCode);
  const subjectCode = project.subjectCode || subject?.code || "NHÓM";
  const subjectName = project.subjectName || subject?.name || project.name;

  // Tên task: [Mã môn] Tên nhiệm vụ (theo đúng yêu cầu người dùng)
  const taskTitle = `[${subjectCode}] ${task.title}`;

  // Ngày đến hạn cả ngày
  const dueDate = toGoogleTasksDueDate(task.dueDate || project.deadline);

  // Thu thập toàn bộ file và liên kết đính kèm
  const attachments: Array<{ title: string; url: string }> = [];

  if (project.driveUrl) {
    attachments.push({ title: `Google Drive đồ án nhóm [${project.name}]`, url: project.driveUrl });
  }

  if (project.repoUrl) {
    attachments.push({ title: "Kho mã nguồn / Thiết kế (Repo/Figma/Canva)", url: project.repoUrl });
  }

  if (project.meetingUrl) {
    attachments.push({ title: "Phòng họp nhóm (Google Meet / Zoom)", url: project.meetingUrl });
  }

  if (project.chatUrl) {
    attachments.push({ title: "Kênh trao đổi nhóm (Zalo / Discord)", url: project.chatUrl });
  }

  if (subject?.driveUrl) {
    attachments.push({ title: `Google Drive môn học [${subject.code}]`, url: subject.driveUrl });
  }

  if (subject?.courseUrl) {
    attachments.push({ title: "Hệ thống Course LMS môn học", url: subject.courseUrl });
  }

  const statusText =
    task.status === "done"
      ? "Đã hoàn thành"
      : task.status === "review"
      ? "Đang kiểm tra (Review)"
      : task.status === "in_progress"
      ? "Đang làm"
      : "Cần làm";

  const deadlineText = task.dueDate
    ? task.dueDate.replace("T", " ")
    : project.deadline
    ? project.deadline.replace("T", " ")
    : "Không có";

  const notes = buildTaskNotesWithAttachments({
    taskTitle: task.title,
    subjectCode,
    subjectName,
    taskType: `Đồ án nhóm: ${project.name}`,
    statusText: `${statusText}${task.assigneeName ? ` (Phụ trách: ${task.assigneeName})` : ""}`,
    deadlineText,
    descriptionOrNotes: task.description,
    attachments,
    taskId: task.id,
  });

  return {
    title: taskTitle,
    due: dueDate,
    notes,
    status: task.status === "done" ? "completed" : "needsAction",
  };
}

/**
 * Đồng bộ toàn bộ Nhiệm vụ cá nhân vào danh sách "My Tasks" (@default)
 */
export async function syncPersonalTasksToGoogle(
  accessToken: string,
  tasks: StudyTask[],
  subjects: Subject[]
): Promise<{ synced: number; created: number; updated: number }> {
  const listId = "@default";
  const existingGoogleTasks = await getTaskListItems(accessToken, listId);

  let createdCount = 0;
  let updatedCount = 0;

  for (const task of tasks) {
    const payload = buildGoogleTaskPayloadForPersonal(task, subjects);

    // Tìm kiếm xem task này đã được đồng bộ trước đó hay chưa (dựa theo thẻ định danh ngầm hoặc tiêu đề)
    const existing = existingGoogleTasks.find((gt) => {
      if (gt.notes && gt.notes.includes(`[LEVRN-TASK-ID:${task.id}]`)) {
        return true;
      }
      return gt.title.trim().toLowerCase() === payload.title.trim().toLowerCase();
    });

    if (existing) {
      // Cập nhật task hiện có
      const patchRes = await fetch(
        `${GTASKS_BASE_URL}/lists/${encodeURIComponent(listId)}/tasks/${encodeURIComponent(existing.id)}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );
      if (patchRes.ok) {
        updatedCount++;
      }
    } else {
      // Tạo task mới
      const insertRes = await fetch(
        `${GTASKS_BASE_URL}/lists/${encodeURIComponent(listId)}/tasks`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );
      if (insertRes.ok) {
        createdCount++;
      }
    }
  }

  return {
    synced: createdCount + updatedCount,
    created: createdCount,
    updated: updatedCount,
  };
}

/**
 * Đồng bộ toàn bộ Nhiệm vụ nhóm vào danh sách "Groupworks"
 */
export async function syncGroupTasksToGoogle(
  accessToken: string,
  groups: GroupProject[],
  subjects: Subject[]
): Promise<{ synced: number; created: number; updated: number }> {
  // Đảm bảo Task List "Groupworks" tồn tại trên Google Tasks
  const listId = await ensureTaskList(accessToken, "Groupworks");
  const existingGoogleTasks = await getTaskListItems(accessToken, listId);

  let createdCount = 0;
  let updatedCount = 0;

  for (const group of groups) {
    if (!group.tasks || !Array.isArray(group.tasks)) continue;

    for (const task of group.tasks) {
      const payload = buildGoogleTaskPayloadForGroup(task, group, subjects);

      // Tìm kiếm theo thẻ định danh ngầm hoặc tiêu đề
      const existing = existingGoogleTasks.find((gt) => {
        if (gt.notes && gt.notes.includes(`[LEVRN-TASK-ID:${task.id}]`)) {
          return true;
        }
        return gt.title.trim().toLowerCase() === payload.title.trim().toLowerCase();
      });

      if (existing) {
        // Cập nhật task hiện có
        const patchRes = await fetch(
          `${GTASKS_BASE_URL}/lists/${encodeURIComponent(listId)}/tasks/${encodeURIComponent(existing.id)}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );
        if (patchRes.ok) {
          updatedCount++;
        }
      } else {
        // Tạo task mới
        const insertRes = await fetch(
          `${GTASKS_BASE_URL}/lists/${encodeURIComponent(listId)}/tasks`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );
        if (insertRes.ok) {
          createdCount++;
        }
      }
    }
  }

  return {
    synced: createdCount + updatedCount,
    created: createdCount,
    updated: updatedCount,
  };
}

/**
 * Đồng bộ tổng hợp cả Nhiệm vụ cá nhân (My Tasks) và Nhiệm vụ nhóm (Groupworks)
 */
export async function syncAllTasksToGoogle(
  accessToken: string,
  personalTasks: StudyTask[],
  groups: GroupProject[],
  subjects: Subject[]
): Promise<{
  personal: { synced: number; created: number; updated: number };
  group: { synced: number; created: number; updated: number };
  total: number;
}> {
  const [personalRes, groupRes] = await Promise.all([
    syncPersonalTasksToGoogle(accessToken, personalTasks, subjects),
    syncGroupTasksToGoogle(accessToken, groups, subjects),
  ]);

  return {
    personal: personalRes,
    group: groupRes,
    total: personalRes.synced + groupRes.synced,
  };
}
