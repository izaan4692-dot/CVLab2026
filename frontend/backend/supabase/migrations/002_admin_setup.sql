-- Migration: Admin User and Role Setup
-- Description: Creates admin user and sets up admin role
-- Date: 2025-12-19

-- Note: Admin user creation is done via Supabase Admin API
-- This script sets up any database-level admin configurations

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT raw_user_meta_data->>'role'
    INTO user_role
    FROM auth.users
    WHERE id = user_id;

    RETURN user_role IN ('admin', 'service_role', 'super_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT COALESCE(raw_user_meta_data->>'role', 'authenticated')
    INTO user_role
    FROM auth.users
    WHERE id = auth.uid();

    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add is_admin field to user metadata (optional helper view)
CREATE OR REPLACE VIEW admin_users AS
SELECT
    id,
    email,
    raw_user_meta_data->>'full_name' as full_name,
    raw_user_meta_data->>'role' as role,
    CASE WHEN raw_user_meta_data->>'role' IN ('admin', 'service_role', 'super_admin') THEN true ELSE false END as is_admin,
    created_at,
    last_sign_in_at
FROM auth.users
WHERE raw_user_meta_data->>'role' IN ('admin', 'service_role', 'super_admin');

-- Grant access to the view
GRANT SELECT ON admin_users TO authenticated;
