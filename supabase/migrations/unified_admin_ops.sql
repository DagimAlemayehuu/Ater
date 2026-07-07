-- Unified Administrative Operations and Beta Policy Enforcement

-- Ensure is_admin helper is available
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'Admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Atomic Waitlist Approval RPC
-- Purpose: Unify updates to waiting_list and profiles tables in a single transaction.
CREATE OR REPLACE FUNCTION public.handle_waitlist_decision(
  p_id UUID,
  p_status TEXT,
  p_activation_code TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_email TEXT;
BEGIN
  -- Verify authorized admin role OR service_role bypass
  IF NOT public.is_admin() AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Action restricted: Unauthorized administrative operations.' USING ERRCODE = 'P0001';
  END IF;

  -- Get email from the waitlist entry
  SELECT email INTO v_email FROM public.waiting_list WHERE id = p_id;

  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Waitlist entry not found.' USING ERRCODE = 'P0003';
  END IF;

  -- A. Update waiting_list
  UPDATE public.waiting_list
  SET
    status = p_status::text,
    activation_code = p_activation_code
  WHERE id = p_id;

  -- B. Sync with profiles if they exist
  UPDATE public.profiles
  SET
    waitlist_status = p_status,
    is_approved = (p_status = 'approved'),
    activation_code = p_activation_code,
    -- Beta policy: initialized to 0 upon approval
    credit_balance = (CASE WHEN p_status = 'approved' THEN 0 ELSE credit_balance END)
  WHERE email = v_email;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update existing trigger for new signups to enforce 0 credit balance (Beta Policy)
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

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    credit_balance,
    account_status,
    waitlist_status,
    is_approved,
    activation_code
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    'Student',
    0, -- Beta Policy: Always start with 0 credits
    'active',
    COALESCE(v_waitlist_status, 'pending'),
    v_is_approved,
    v_activation_code
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
