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
USING (public.is_admin())
WITH CHECK (public.is_admin());

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

-- 6. Trigger to automatically create a profile record when a new user registers in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  v_waitlist_status text := 'pending';
  v_is_approved boolean := false;
  v_activation_code text := null;
BEGIN
  -- Look up status and activation code from the waitlist
  SELECT status, activation_code 
  INTO v_waitlist_status, v_activation_code
  FROM public.waiting_list
  WHERE email = NEW.email;

  IF v_waitlist_status = 'approved' THEN
    v_is_approved := true;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, credit_balance, account_status, waitlist_status, is_approved, activation_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    'Student',
    100, -- Default welcome credits
    'active',
    COALESCE(v_waitlist_status, 'pending'),
    v_is_approved,
    v_activation_code
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_create_profile_on_signup ON auth.users;
CREATE TRIGGER trg_create_profile_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_signup();

