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
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS total_weeks INTEGER DEFAULT 15;

-- 2. Thiết lập Row Level Security (RLS) để bảo vệ và cấp quyền truy cập
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- Cho phép đọc dữ liệu môn học
DROP POLICY IF EXISTS "Allow public read access" ON public.subjects;
CREATE POLICY "Allow public read access" ON public.subjects
    FOR SELECT USING (true);

-- Cho phép tạo môn học mới
DROP POLICY IF EXISTS "Allow public insert access" ON public.subjects;
CREATE POLICY "Allow public insert access" ON public.subjects
    FOR INSERT WITH CHECK (true);

-- Cho phép chỉnh sửa thông tin môn học
DROP POLICY IF EXISTS "Allow public update access" ON public.subjects;
CREATE POLICY "Allow public update access" ON public.subjects
    FOR UPDATE USING (true);

-- Cho phép xoá môn học
DROP POLICY IF EXISTS "Allow public delete access" ON public.subjects;
CREATE POLICY "Allow public delete access" ON public.subjects
    FOR DELETE USING (true);

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


