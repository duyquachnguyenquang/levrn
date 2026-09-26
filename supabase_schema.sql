-- ====================================================================
-- LEVRN SUPABASE DATABASE SCHEMA
-- Hướng dẫn: Copy toàn bộ nội dung file này và dán vào:
-- Supabase Dashboard -> Project của bạn -> SQL Editor -> Nhấn "Run"
-- ====================================================================

-- 1. Tạo bảng subjects (môn học)
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) NOT NULL,
    name TEXT NOT NULL,
    semester TEXT NOT NULL,
    academic_year TEXT,
    term TEXT,
    credits INTEGER,
    category TEXT NOT NULL DEFAULT 'Môn chuyên ngành',
    color VARCHAR(30) NOT NULL DEFAULT '#7D39EB',
    course_url TEXT,
    drive_url TEXT,
    image_url TEXT,
    start_date DATE,
    end_date DATE,
    total_weeks INTEGER DEFAULT 15,
    instructor TEXT,
    target_hours INTEGER,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Migration nếu bảng đã tồn tại: Bổ sung các cột mới
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS academic_year TEXT;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS term TEXT;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Môn chuyên ngành';
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS course_url TEXT;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS drive_url TEXT;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS total_weeks INTEGER DEFAULT 15;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS schedule_days INTEGER[];
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS start_time VARCHAR(20);
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS end_time VARCHAR(20);
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS room VARCHAR(50);
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS campus TEXT;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS map_url TEXT;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- 2. Thiết lập Row Level Security (RLS) để bảo vệ và cấp quyền truy cập cá nhân hóa
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- Cho phép đọc: Chỉ đọc môn học của chính mình (hoặc môn công khai nếu chưa phân quyền)
DROP POLICY IF EXISTS "Allow public read access" ON public.subjects;
DROP POLICY IF EXISTS "Users can read own subjects" ON public.subjects;
CREATE POLICY "Users can read own subjects" ON public.subjects
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Cho phép tạo môn học mới: Tự động gán user_id của người tạo
DROP POLICY IF EXISTS "Allow public insert access" ON public.subjects;
DROP POLICY IF EXISTS "Users can insert own subjects" ON public.subjects;
CREATE POLICY "Users can insert own subjects" ON public.subjects
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Cho phép chỉnh sửa thông tin môn học của chính mình
DROP POLICY IF EXISTS "Allow public update access" ON public.subjects;
DROP POLICY IF EXISTS "Users can update own subjects" ON public.subjects;
CREATE POLICY "Users can update own subjects" ON public.subjects
    FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- Cho phép xoá môn học của chính mình
DROP POLICY IF EXISTS "Allow public delete access" ON public.subjects;
DROP POLICY IF EXISTS "Users can delete own subjects" ON public.subjects;
CREATE POLICY "Users can delete own subjects" ON public.subjects
    FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- 3. Tạo dữ liệu mẫu ban đầu (tuỳ chọn)
INSERT INTO public.subjects (code, name, semester, credits, instructor, color, target_hours, note)
VALUES 
    ('MAT', 'Giải Tích & Đại Số Tuyến Tính', 'HK1 2024-2025', 4, 'TS. Nguyễn Văn An', '#7D39EB', 60, 'Ôn tập kỹ các chương tích phân và định thức ma trận.'),
    ('ENG', 'Tiếng Anh Chuyên Ngành CNTT', 'HK1 2024-2025', 3, 'ThS. Sarah Jenkins', '#06B6D4', 45, 'Tập trung thuyết trình dự án công nghệ và viết bài luận kỹ thuật.'),
    ('PRG', 'Cấu Trúc Dữ Liệu & Giải Thuật', 'HK1 2024-2025', 3, 'PGS.TS. Trần Quốc Bảo', '#C6FF33', 50, 'Luyện bài tập cây nhị phân, thuật toán đồ thị trên LeetCode.')
ON CONFLICT DO NOTHING;

-- ====================================================================
-- 4. Bảng study_tasks (Kế hoạch học tập, nhiệm vụ & timeblock)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.study_tasks (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    subject_id TEXT,
    semester TEXT,
    title TEXT NOT NULL,
    classification VARCHAR(30) NOT NULL DEFAULT 'theory',
    status VARCHAR(20) NOT NULL DEFAULT 'todo',
    duration_minutes INTEGER DEFAULT 60,
    subtasks JSONB,
    materials JSONB,
    submission_url TEXT,
    deadline TIMESTAMPTZ,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'medium',
    timeblock JSONB,
    notes TEXT,
    checklist JSONB,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Migration nếu bảng study_tasks đã tồn tại trước đó
ALTER TABLE public.study_tasks ADD COLUMN IF NOT EXISTS semester TEXT;
ALTER TABLE public.study_tasks ADD COLUMN IF NOT EXISTS subtasks JSONB;
ALTER TABLE public.study_tasks ADD COLUMN IF NOT EXISTS materials JSONB;
ALTER TABLE public.study_tasks ADD COLUMN IF NOT EXISTS submission_url TEXT;
ALTER TABLE public.study_tasks ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;

ALTER TABLE public.study_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read study_tasks" ON public.study_tasks;
CREATE POLICY "Allow public read study_tasks" ON public.study_tasks
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert study_tasks" ON public.study_tasks;
CREATE POLICY "Allow public insert study_tasks" ON public.study_tasks
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update study_tasks" ON public.study_tasks;
CREATE POLICY "Allow public update study_tasks" ON public.study_tasks
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete study_tasks" ON public.study_tasks;
CREATE POLICY "Allow public delete study_tasks" ON public.study_tasks
    FOR DELETE USING (true);

-- ====================================================================
-- 5. Bảng course_grades (Quản lý điểm số, GPA và thành phần điểm)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.course_grades (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    subject_id TEXT,
    subject_code VARCHAR(20) NOT NULL,
    subject_name TEXT NOT NULL,
    credits INTEGER NOT NULL DEFAULT 3,
    semester TEXT NOT NULL,
    academic_year TEXT,
    term TEXT,
    grading_method VARCHAR(20) NOT NULL DEFAULT 'final_only',
    final_score NUMERIC(4,2),
    components JSONB DEFAULT '[]'::jsonb,
    target_score NUMERIC(4,2),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bổ sung cột nếu bảng đã tồn tại trước đó
ALTER TABLE public.course_grades ADD COLUMN IF NOT EXISTS grading_method VARCHAR(20) DEFAULT 'final_only';
ALTER TABLE public.course_grades ADD COLUMN IF NOT EXISTS components JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.course_grades ADD COLUMN IF NOT EXISTS target_score NUMERIC(4,2);

ALTER TABLE public.course_grades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read course_grades" ON public.course_grades;
CREATE POLICY "Allow public read course_grades" ON public.course_grades
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert course_grades" ON public.course_grades;
CREATE POLICY "Allow public insert course_grades" ON public.course_grades
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update course_grades" ON public.course_grades;
CREATE POLICY "Allow public update course_grades" ON public.course_grades
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete course_grades" ON public.course_grades;
CREATE POLICY "Allow public delete course_grades" ON public.course_grades
    FOR DELETE USING (true);

-- Script hỗ trợ đồng bộ dữ liệu hai bảng subjects <-> course_grades:
-- (Hệ thống Levrn đã tự động đồng bộ thời gian thực qua mã nguồn ứng dụng,
--  bạn cũng có thể chạy lệnh này bất cứ lúc nào trong Supabase SQL Editor nếu muốn chuẩn hoá toàn bộ)
UPDATE public.course_grades cg
SET 
    subject_code = s.code,
    subject_name = s.name,
    credits = COALESCE(s.credits, 3),
    semester = CASE WHEN s.semester IS NOT NULL AND TRIM(s.semester) != '' THEN TRIM(s.semester) ELSE 'Chưa xếp kỳ' END,
    academic_year = s.academic_year,
    term = s.term,
    updated_at = now()
FROM public.subjects s
WHERE cg.subject_id = s.id::text;

-- Xoá môn điểm mồ côi (nếu môn học tương ứng đã bị xoá khỏi bảng subjects)
DELETE FROM public.course_grades
WHERE subject_id IS NOT NULL 
  AND subject_id NOT IN (SELECT id::text FROM public.subjects);

-- ====================================================================
-- 6. Bảng study_sessions (Phiên học tập Pomodoro & Lịch sử học)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.study_sessions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    subject_id TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 25,
    mode VARCHAR(20) NOT NULL DEFAULT 'focus',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read study_sessions" ON public.study_sessions;
CREATE POLICY "Allow public read study_sessions" ON public.study_sessions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert study_sessions" ON public.study_sessions;
CREATE POLICY "Allow public insert study_sessions" ON public.study_sessions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete study_sessions" ON public.study_sessions;
CREATE POLICY "Allow public delete study_sessions" ON public.study_sessions FOR DELETE USING (true);

-- ====================================================================
-- 7. Bảng flashcards (Thẻ ghi nhớ ôn tập theo môn học)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.flashcards (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    subject_id TEXT,
    deck_name TEXT NOT NULL DEFAULT 'Chung',
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    hint TEXT,
    difficulty VARCHAR(20) DEFAULT 'medium',
    review_count INTEGER DEFAULT 0,
    is_mastered BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read flashcards" ON public.flashcards;
CREATE POLICY "Allow public read flashcards" ON public.flashcards FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert flashcards" ON public.flashcards;
CREATE POLICY "Allow public insert flashcards" ON public.flashcards FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update flashcards" ON public.flashcards;
CREATE POLICY "Allow public update flashcards" ON public.flashcards FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete flashcards" ON public.flashcards;
CREATE POLICY "Allow public delete flashcards" ON public.flashcards FOR DELETE USING (true);

-- ====================================================================
-- 8. Bảng quiz_questions (Ngân hàng câu hỏi trắc nghiệm ôn tập)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    subject_id TEXT,
    topic TEXT,
    question TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    correct_index INTEGER NOT NULL DEFAULT 0,
    explanation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read quiz_questions" ON public.quiz_questions;
CREATE POLICY "Allow public read quiz_questions" ON public.quiz_questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert quiz_questions" ON public.quiz_questions;
CREATE POLICY "Allow public insert quiz_questions" ON public.quiz_questions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update quiz_questions" ON public.quiz_questions;
CREATE POLICY "Allow public update quiz_questions" ON public.quiz_questions FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete quiz_questions" ON public.quiz_questions;
CREATE POLICY "Allow public delete quiz_questions" ON public.quiz_questions FOR DELETE USING (true);

-- ====================================================================
-- 9. Bảng attendance_records (Điểm danh & Quản lý chuyên cần môn học)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    subject_id TEXT NOT NULL,
    subject_code VARCHAR(20) NOT NULL,
    subject_name TEXT NOT NULL,
    session_number INTEGER NOT NULL DEFAULT 1,
    date DATE NOT NULL,
    start_time VARCHAR(20),
    end_time VARCHAR(20),
    room VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'upcoming', -- present, late, excused, absent, upcoming
    checked_in_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read attendance_records" ON public.attendance_records;
CREATE POLICY "Allow public read attendance_records" ON public.attendance_records FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert attendance_records" ON public.attendance_records;
CREATE POLICY "Allow public insert attendance_records" ON public.attendance_records FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update attendance_records" ON public.attendance_records;
CREATE POLICY "Allow public update attendance_records" ON public.attendance_records FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete attendance_records" ON public.attendance_records;
CREATE POLICY "Allow public delete attendance_records" ON public.attendance_records FOR DELETE USING (true);

-- ====================================================================
-- 10. Bảng group_projects (Quản lý nhóm đồ án & bài tập lớn)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.group_projects (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    subject_id TEXT,
    subject_code VARCHAR(20) NOT NULL,
    subject_name TEXT NOT NULL,
    topic TEXT NOT NULL,
    description TEXT,
    semester TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress', -- planning, in_progress, submitted, completed
    deadline TIMESTAMPTZ,
    drive_url TEXT,
    repo_url TEXT,
    meeting_url TEXT,
    chat_url TEXT,
    image_url TEXT,
    grade_component_id TEXT,
    grade_component_name TEXT,
    grade_weight NUMERIC,
    grade_score NUMERIC,
    members JSONB NOT NULL DEFAULT '[]'::jsonb,
    tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lệnh cập nhật bổ sung cột gán trọng số điểm và ảnh bìa (chạy trong Supabase SQL Editor nếu đã tạo bảng trước đó)
ALTER TABLE public.group_projects 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS grade_component_id TEXT,
ADD COLUMN IF NOT EXISTS grade_component_name TEXT,
ADD COLUMN IF NOT EXISTS grade_weight NUMERIC,
ADD COLUMN IF NOT EXISTS grade_score NUMERIC;

ALTER TABLE public.group_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read group_projects" ON public.group_projects;
CREATE POLICY "Allow public read group_projects" ON public.group_projects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert group_projects" ON public.group_projects;
CREATE POLICY "Allow public insert group_projects" ON public.group_projects FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update group_projects" ON public.group_projects;
CREATE POLICY "Allow public update group_projects" ON public.group_projects FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete group_projects" ON public.group_projects;
CREATE POLICY "Allow public delete group_projects" ON public.group_projects FOR DELETE USING (true);

-- ====================================================================
-- 11. Bảng app_notifications (Trung tâm thông báo & Cảnh báo học tập)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.app_notifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'info', -- warning, deadline, attendance, success, info
    category VARCHAR(30) NOT NULL DEFAULT 'system', -- attendance, groups, schedule, grades, system
    read BOOLEAN NOT NULL DEFAULT false,
    link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read app_notifications" ON public.app_notifications;
CREATE POLICY "Allow public read app_notifications" ON public.app_notifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert app_notifications" ON public.app_notifications;
CREATE POLICY "Allow public insert app_notifications" ON public.app_notifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update app_notifications" ON public.app_notifications;
CREATE POLICY "Allow public update app_notifications" ON public.app_notifications FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete app_notifications" ON public.app_notifications;
CREATE POLICY "Allow public delete app_notifications" ON public.app_notifications FOR DELETE USING (true);



