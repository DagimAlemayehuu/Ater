-- Migration: Unify hardware_blacklist schema and create admin audit log
-- Purpose: Rename machine_id_hash to machine_id, track admin actions, and ensure foundational admin functions.

-- 0. Ensure required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Ensure core administrative helper functions exist
-- This allows the migration to be robust regardless of previous migration state.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'Admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Administrative credit balance delta adjust RPC
CREATE OR REPLACE FUNCTION public.admin_adjust_user_balance_delta(
  target_user_id UUID,
  delta_amount INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  new_bal INTEGER;
BEGIN
  -- Verify authorized admin role OR service_role bypass
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'Admin'
  ) AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Action restricted: Unauthorized administrative operations.' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.profiles
  SET credit_balance = GREATEST(0, credit_balance + delta_amount)
  WHERE id = target_user_id
  RETURNING credit_balance INTO new_bal;

  -- Attempt to log to credit_ledger if it exists
  BEGIN
    INSERT INTO public.credit_ledger (user_id, amount, feature_slug)
    VALUES (target_user_id, delta_amount, 'admin-adjustment');
  EXCEPTION WHEN OTHERS THEN
    -- Fallback if table doesn't exist yet (unlikely in target env)
    NULL;
  END;

  RETURN new_bal;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Rename column in hardware_blacklist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='hardware_blacklist' AND column_name='machine_id_hash'
  ) THEN
    ALTER TABLE public.hardware_blacklist RENAME COLUMN machine_id_hash TO machine_id;
  END IF;
END $$;

-- 3. Update the check_hardware_blacklist function to use the new column name
CREATE OR REPLACE FUNCTION check_hardware_blacklist()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if plaintext machine_id's SHA-256 hash or raw value matches hardware_blacklist
  IF NEW.machine_id IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.hardware_blacklist
      WHERE machine_id = NEW.machine_id
         OR machine_id = encode(digest(NEW.machine_id, 'sha256'), 'hex')
    )
  ) THEN
    RAISE EXCEPTION 'This device signature has been permanently blacklisted by administration.' USING ERRCODE = 'D0001';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Explicitly ensure trigger is bound to profiles
DROP TRIGGER IF EXISTS trg_check_hardware_blacklist ON public.profiles;
CREATE TRIGGER trg_check_hardware_blacklist
BEFORE INSERT OR UPDATE OF machine_id ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION check_hardware_blacklist();

-- 4. Create Admin Audit Log Table
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES public.profiles(id) NOT NULL,
  target_user_id uuid REFERENCES public.profiles(id),
  action_type text NOT NULL,
  action_details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Enable RLS on Admin Audit Log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can view audit logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_log;
CREATE POLICY "Admins can view audit logs"
ON public.admin_audit_log FOR SELECT
TO authenticated
USING (public.is_admin());
