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
