-- ===============================
-- Development Schema Setup Script
-- ===============================

-- Create enum for user roles (only if not exists)
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('BE', 'BM', 'Marketing', 'Admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for risk levels
DO $$ BEGIN
    CREATE TYPE public.risk_level AS ENUM ('Low Risk', 'Moderate Risk', 'High Risk');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for camp status
DO $$ BEGIN
    CREATE TYPE public.camp_status AS ENUM ('active', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add role column to existing users table if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'BE';

-- Update camp table structure
ALTER TABLE public.camps ADD COLUMN IF NOT EXISTS status camp_status DEFAULT 'active';

-- Add risk_level to patients table
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS risk_level risk_level;

-- Insert sample doctors data if not exists
INSERT INTO public.doctors (imacx_code, name, specialty, clinic_name, clinic_address, city, phone, whatsapp_number, is_selected_by_marketing) 
SELECT 'DOC001', 'Dr. Rajesh Kumar', 'General Medicine', 'Kumar Clinic', '123 MG Road, Bangalore', 'Bangalore', '9876543210', '9876543210', true
WHERE NOT EXISTS (SELECT 1 FROM public.doctors WHERE imacx_code = 'DOC001');

INSERT INTO public.doctors (imacx_code, name, specialty, clinic_name, clinic_address, city, phone, whatsapp_number, is_selected_by_marketing) 
SELECT 'DOC002', 'Dr. Priya Sharma', 'Endocrinology', 'Diabetes Care Center', '456 Park Street, Mumbai', 'Mumbai', '9876543211', '9876543211', true
WHERE NOT EXISTS (SELECT 1 FROM public.doctors WHERE imacx_code = 'DOC002');

INSERT INTO public.doctors (imacx_code, name, specialty, clinic_name, clinic_address, city, phone, whatsapp_number, is_selected_by_marketing) 
SELECT 'DOC003', 'Dr. Amit Patel', 'Internal Medicine', 'Patel Hospital', '789 Ring Road, Ahmedabad', 'Ahmedabad', '9876543212', '9876543212', true
WHERE NOT EXISTS (SELECT 1 FROM public.doctors WHERE imacx_code = 'DOC003');

INSERT INTO public.doctors (imacx_code, name, specialty, clinic_name, clinic_address, city, phone, whatsapp_number, is_selected_by_marketing) 
SELECT 'DOC004', 'Dr. Sunita Reddy', 'General Practice', 'Family Health Clinic', '321 Tank Bund, Hyderabad', 'Hyderabad', '9876543213', '9876543213', true
WHERE NOT EXISTS (SELECT 1 FROM public.doctors WHERE imacx_code = 'DOC004');

INSERT INTO public.doctors (imacx_code, name, specialty, clinic_name, clinic_address, city, phone, whatsapp_number, is_selected_by_marketing) 
SELECT 'DOC005', 'Dr. Vikram Singh', 'Orthopedics', 'Bone & Joint Center', '654 Civil Lines, Delhi', 'Delhi', '9876543214', '9876543214', true
WHERE NOT EXISTS (SELECT 1 FROM public.doctors WHERE imacx_code = 'DOC005');

-- ===============================
-- Disable Row Level Security (DEV MODE)
-- ===============================
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.camps DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients DISABLE ROW LEVEL SECURITY;
