-- Ater User and Feature Lockout System Migration
-- Purpose: Protect features and profile statuses with hardware-level enforcement and RLS policies.

-- 1. Create enum for account status
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status') THEN
    CREATE TYPE account_status AS ENUM ('active', 'suspended', 'banned');
  END IF;
END $$;

-- 2. Add columns to public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_status account_status DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS locked_features text[] DEFAULT '{}';

-- 3. Create Hardware Blacklist Table
CREATE TABLE IF NOT EXISTS public.hardware_blacklist (
  machine_id_hash text PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  reason text
);

-- Enable RLS on Blacklist
ALTER TABLE public.hardware_blacklist ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins have full access to blacklist
DROP POLICY IF EXISTS "Admins have full control on blacklist" ON public.hardware_blacklist;
CREATE POLICY "Admins have full control on blacklist"
ON public.hardware_blacklist FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'Admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'Admin'
  )
);

-- 4. Trigger to enforce Hardware Blacklist check
-- We check both raw machine_id matches or SHA-256 matches.
CREATE OR REPLACE FUNCTION check_hardware_blacklist()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if plaintext machine_id's SHA-256 hash or raw value matches hardware_blacklist
  IF NEW.machine_id IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.hardware_blacklist 
      WHERE machine_id_hash = NEW.machine_id 
         OR machine_id_hash = encode(digest(NEW.machine_id, 'sha256'), 'hex')
    )
  ) THEN
    RAISE EXCEPTION 'This device signature has been permanently blacklisted by administration.' USING ERRCODE = 'D0001';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_check_hardware_blacklist ON public.profiles;
CREATE TRIGGER trg_check_hardware_blacklist
BEFORE INSERT OR UPDATE OF machine_id ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION check_hardware_blacklist();

-- 5. Hardened RLS policies for Profiles
-- Users can only SELECT or UPDATE their own profile IF their account is active.
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id AND account_status = 'active');

DROP POLICY IF EXISTS "Users can perform initial activation" ON public.profiles;
CREATE POLICY "Users can perform initial activation" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id AND account_status = 'active')
WITH CHECK (
  (CASE 
    WHEN (profiles.machine_id IS NOT NULL) THEN (profiles.machine_id = machine_id)
    ELSE TRUE 
  END)
  AND
  (CASE
    WHEN (profiles.waitlist_status = 'approved' AND profiles.is_approved = true)
    THEN (is_approved = true AND waitlist_status = 'approved')
    ELSE TRUE
  END)
);
