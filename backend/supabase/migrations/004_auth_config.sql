-- ============================================
-- YOUMOVE - Auth Configuration
-- Migration: 004_auth_config
-- Date: 2024-12-20
-- ============================================

-- NOTE: Manual configuration required in Supabase Dashboard
-- See docs/SUPABASE_AUTH_SETUP.md for instructions

-- ============================================
-- AUTH HELPER FUNCTIONS
-- ============================================

-- Get current user ID safely
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user email is verified
CREATE OR REPLACE FUNCTION is_email_verified()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND email_confirmed_at IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
DECLARE
    v_role user_role;
BEGIN
    SELECT role INTO v_role
    FROM profiles
    WHERE id = auth.uid();
    
    RETURN COALESCE(v_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
