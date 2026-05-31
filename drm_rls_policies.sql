-- Ater DRM & Anti-Piracy Security Policies
-- Purpose: Protect hardware bindings and activation status from client-side tampering.

-- 1. Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. SELECT: Users can view their own data
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- 3. UPDATE: Simplified Owner Access (Trigger checks column integrity)
-- Standard owners can only update their own safe columns.
DROP POLICY IF EXISTS "Users can perform initial activation" ON public.profiles;
CREATE POLICY "Users can perform initial activation" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Helper function to verify admin role without inducing RLS recursion.
-- Executed under SECURITY DEFINER to bypass RLS evaluation.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'Admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. ADMIN: Full Control
-- Admins can override hardware locks and revoke access immediately.
DROP POLICY IF EXISTS "Admins have full control" ON public.profiles;
CREATE POLICY "Admins have full control" 
ON public.profiles FOR ALL 
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 5. Database Trigger for Profile State-Transition Verification (Zero-Trust Guard)
CREATE OR REPLACE FUNCTION verify_profile_state_transitions()
RETURNS TRIGGER AS $$
BEGIN
  -- Trigger logic: standard authenticated users cannot modify administrative fields or role
  IF (NEW.role IS DISTINCT FROM OLD.role OR 
      NEW.is_approved IS DISTINCT FROM OLD.is_approved OR 
      NEW.waitlist_status IS DISTINCT FROM OLD.waitlist_status OR 
      NEW.locked_features IS DISTINCT FROM OLD.locked_features OR
      NEW.credit_balance IS DISTINCT FROM OLD.credit_balance) THEN
    
    -- Allow the update if the user has Admin role in the database OR if it is service_role
    IF NOT public.is_admin() AND auth.role() <> 'service_role' THEN
      RAISE EXCEPTION 'Action restricted: Unauthorized modification of administrative columns.' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  -- Rule: machine_id is a permanent hardware lock once set, it cannot be modified
  IF (OLD.machine_id IS NOT NULL AND NEW.machine_id IS DISTINCT FROM OLD.machine_id) THEN
    IF NOT public.is_admin() AND auth.role() <> 'service_role' THEN
      RAISE EXCEPTION 'Action restricted: Machine binding is permanent and cannot be modified.' USING ERRCODE = 'P0002';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_verify_profile_state_transitions ON public.profiles;
CREATE TRIGGER trg_verify_profile_state_transitions
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION verify_profile_state_transitions();

-- 6. RPC Helper for Admin Revocation
-- This ensures the "Kill Switch" is atomic.
CREATE OR REPLACE FUNCTION revoke_user_access(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles 
  SET is_approved = false, waitlist_status = 'revoked'
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RLS Policies for waiting_list Table
-- Protects user signup details and activation codes from unauthenticated exposure.
ALTER TABLE public.waiting_list ENABLE ROW LEVEL SECURITY;

-- Rule A: Anyone (including anonymous users) can submit a waitlist entry (Insert)
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waiting_list;
CREATE POLICY "Anyone can join waitlist"
ON public.waiting_list FOR INSERT
WITH CHECK (true);

-- Rule B: Users can view their own waitlist entry by email matching
DROP POLICY IF EXISTS "Users can view own waitlist entry" ON public.waiting_list;
CREATE POLICY "Users can view own waitlist entry"
ON public.waiting_list FOR SELECT
TO authenticated, anon
USING (auth.jwt() ->> 'email' = email);

-- Rule C: Admins have full access to view, update, or delete all waitlist records
DROP POLICY IF EXISTS "Admins have full control on waitlist" ON public.waiting_list;
CREATE POLICY "Admins have full control on waitlist"
ON public.waiting_list FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
