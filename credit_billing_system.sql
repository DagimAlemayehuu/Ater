-- Ater credit billing system database function
-- Location: credit_billing_system.sql
-- Purpose: Deduct user credits atomically with bounds checking. Called by execute-ai-action Edge Function.

-- 1. Create missing configuration tables
CREATE TABLE IF NOT EXISTS public.system_config (
  slug text PRIMARY KEY,
  credit_cost integer DEFAULT 1 NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount integer NOT NULL,
  feature_slug text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Credit Ledger
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own ledger logs
DROP POLICY IF EXISTS "Users can view own ledger" ON public.credit_ledger;
CREATE POLICY "Users can view own ledger"
ON public.credit_ledger FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policy: Admins have full control on ledger logs
DROP POLICY IF EXISTS "Admins have full control on ledger" ON public.credit_ledger;
CREATE POLICY "Admins have full control on ledger"
ON public.credit_ledger FOR ALL
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

-- Enable RLS on System Config
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Authenticated users can view configs
DROP POLICY IF EXISTS "Anyone can view system configs" ON public.system_config;
CREATE POLICY "Anyone can view system configs"
ON public.system_config FOR SELECT
TO authenticated
USING (true);

-- RLS Policy: Admins can update configs
DROP POLICY IF EXISTS "Admins can update configs" ON public.system_config;
CREATE POLICY "Admins can update configs"
ON public.system_config FOR ALL
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

-- 2. Seed default configurations
INSERT INTO public.system_config (slug, credit_cost) VALUES
  ('oracle-chat', 2),
  ('ater_generation', 5),
  ('ai-ingestion', 1),
  ('ai-features', 1),
  ('ai_locked', 1),
  ('explain-features', 1),
  ('generate-practice', 1),
  ('edc-features', 1),
  ('circuit-breaker', 0)
ON CONFLICT (slug) DO UPDATE SET credit_cost = EXCLUDED.credit_cost;

-- 3. Dynamic credit deduction function with circuit breaker and ledger logs
CREATE OR REPLACE FUNCTION public.deduct_user_credits(
  target_user_id UUID,
  target_feature_slug TEXT
)
RETURNS INTEGER AS $$
DECLARE
  current_bal INTEGER;
  cost INTEGER;
BEGIN
  -- Zero-trust call validation: standard users can only deduct their own credits.
  -- Bypassed for Admin profiles or service_role connections.
  IF (auth.uid() IS NOT NULL AND target_user_id <> auth.uid()) AND NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'Admin'
  ) AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Action restricted: Unauthorized credit operations.' USING ERRCODE = 'P0001';
  END IF;

  -- A. Enforce Circuit Breaker / Gateway Kill Switch check
  IF EXISTS (
    SELECT 1 FROM public.system_config
    WHERE slug = 'circuit-breaker' AND credit_cost = 1
  ) THEN
    RAISE EXCEPTION 'AI gateway is temporarily disabled by administration.' USING ERRCODE = 'C0001';
  END IF;

  -- B. Determine cost dynamically from system_config table
  SELECT credit_cost INTO cost
  FROM public.system_config
  WHERE slug = target_feature_slug;

  IF cost IS NULL THEN
    -- Fallback default costs if row is missing
    IF target_feature_slug = 'oracle-chat' THEN
      cost := 2;
    ELSIF target_feature_slug = 'ater_generation' THEN
      cost := 5;
    ELSE
      cost := 1;
    END IF;
  END IF;

  -- C. Fetch user credit balance
  SELECT credit_balance INTO current_bal
  FROM public.profiles
  WHERE id = target_user_id;

  IF current_bal IS NULL THEN
    RAISE EXCEPTION 'User profile not found.' USING ERRCODE = 'P0003';
  END IF;

  -- D. Unlimited credits check (configured value for unlimited access)
  IF current_bal >= 99999999 THEN
    -- Write log entry for unlimited admin account activity tracking
    INSERT INTO public.credit_ledger (user_id, amount, feature_slug)
    VALUES (target_user_id, 0, target_feature_slug);
    RETURN current_bal;
  END IF;

  -- E. Validate balance sufficiency
  IF current_bal < cost THEN
    RAISE EXCEPTION 'Insufficient credit balance. Required: %, Available: %', cost, current_bal USING ERRCODE = 'P0004';
  END IF;

  -- F. Atomic balance update
  UPDATE public.profiles
  SET credit_balance = credit_balance - cost
  WHERE id = target_user_id
  RETURNING credit_balance INTO current_bal;

  -- G. Append transaction ledger trace
  INSERT INTO public.credit_ledger (user_id, amount, feature_slug)
  VALUES (target_user_id, -cost, target_feature_slug);

  RETURN current_bal;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Administrative credit balance delta adjust RPC
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

  INSERT INTO public.credit_ledger (user_id, amount, feature_slug)
  VALUES (target_user_id, delta_amount, 'admin-adjustment');

  RETURN new_bal;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
