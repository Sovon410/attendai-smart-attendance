-- Supabase Schema for AI Attendance System

-- 1. Teachers Table (Already created, kept for reference)
CREATE TABLE IF NOT EXISTS public.teachers (
    teacher_id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Students Table (Already created, with biometric columns)
CREATE TABLE IF NOT EXISTS public.students (
    student_id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    face_embedding JSONB,
    voice_embedding JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Classes Table
CREATE TABLE IF NOT EXISTS public.classes (
    class_id SERIAL PRIMARY KEY,
    class_name TEXT NOT NULL,
    class_code TEXT UNIQUE NOT NULL,
    teacher_id INTEGER NOT NULL REFERENCES public.teachers(teacher_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enrollments Table (Students enrolled in classes)
CREATE TABLE IF NOT EXISTS public.enrollments (
    enrollment_id SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL REFERENCES public.classes(class_id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES public.students(student_id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(class_id, student_id)
);

-- 5. Attendance Records Table
CREATE TABLE IF NOT EXISTS public.attendance (
    attendance_id SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL REFERENCES public.classes(class_id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES public.students(student_id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'present',
    method TEXT NOT NULL, -- 'photo', 'voice', 'manual'
    confidence FLOAT,
    marked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(class_id, student_id, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON public.classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_class_code ON public.classes(class_code);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class ON public.enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON public.attendance(class_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON public.attendance(student_id);
