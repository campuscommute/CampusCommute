-- ============================================================
--  MIGRATION: set_admin_role
--  Run this in Supabase Dashboard → SQL Editor → New Query → Run
--
--  Sets role = 'admin' for the account with phone 9220612315
--  After running this, navigate to /admin — no code changes needed.
-- ============================================================

-- First, see what's stored (run this to verify the account exists):
-- SELECT id, name, phone, role, created_at FROM public.profiles ORDER BY created_at DESC LIMIT 10;

-- Set admin role by phone (handles any storage format):
UPDATE public.profiles
SET role = 'admin'
WHERE replace(replace(replace(phone, '+91', ''), '-', ''), ' ', '') = '9220612315';

-- Verify it worked:
SELECT id, name, phone, role FROM public.profiles WHERE role = 'admin';
