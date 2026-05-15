-- Ater DRM & Anti-Piracy Security Policies
-- Purpose: Protect hardware bindings and activation status from client-side tampering.

-- 1. Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. SELECT: Users can view their own data
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- 3. UPDATE: Restricted Hardware Binding ("Burn-In" Logic)
-- Users can only set machine_id if it's currently NULL.
-- Users CANNOT change is_approved or waitlist_status once they are approved.
DROP POLICY IF EXISTS "Users can perform initial activation" ON public.profiles;
CREATE POLICY "Users can perform initial activation" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  -- Rule 1: If machine_id is already set, it must remain identical
  (CASE 
    WHEN (profiles.machine_id IS NOT NULL) THEN (profiles.machine_id = machine_id)
    ELSE TRUE 
  END)
  AND
  -- Rule 2: Cannot manually flip is_approved to true if it was false (Admin only)
  -- Unless they are currently pending and providing an activation
  (CASE
    WHEN (profiles.waitlist_status = 'approved' AND profiles.is_approved = true)
    THEN (is_approved = true AND waitlist_status = 'approved')
    ELSE TRUE
  END)
);

-- 4. ADMIN: Full Control
-- Admins can override hardware locks and revoke access immediately.
DROP POLICY IF EXISTS "Admins have full control" ON public.profiles;
CREATE POLICY "Admins have full control" 
ON public.profiles FOR ALL 
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

-- 5. RPC Helper for Admin Revocation
-- This ensures the "Kill Switch" is atomic.
CREATE OR REPLACE FUNCTION revoke_user_access(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles 
  SET is_approved = false, waitlist_status = 'revoked'
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
