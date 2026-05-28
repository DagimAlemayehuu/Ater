-- Ater credit billing system database function
-- Location: credit_billing_system.sql
-- Purpose: Deduct user credits atomically with bounds checking. Called by execute-ai-action Edge Function.

CREATE OR REPLACE FUNCTION public.deduct_user_credits(
  target_user_id UUID,
  target_feature_slug TEXT
)
RETURNS INTEGER AS $$
DECLARE
  current_bal INTEGER;
  cost INTEGER := 1; -- default cost per call
BEGIN
  -- Determine cost based on feature_slug
  IF target_feature_slug = 'oracle-chat' THEN
    cost := 2;
  ELSIF target_feature_slug = 'ater_generation' THEN
    cost := 5;
  END IF;

  SELECT credit_balance INTO current_bal
  FROM public.profiles
  WHERE id = target_user_id;

  IF current_bal IS NULL THEN
    RAISE EXCEPTION 'User profile not found.' USING ERRCODE = 'P0003';
  END IF;

  -- Unlimited credits check (configured value for unlimited access)
  IF current_bal >= 99999999 THEN
    RETURN current_bal;
  END IF;

  IF current_bal < cost THEN
    RAISE EXCEPTION 'Insufficient credit balance. Required: %, Available: %', cost, current_bal USING ERRCODE = 'P0004';
  END IF;

  UPDATE public.profiles
  SET credit_balance = credit_balance - cost
  WHERE id = target_user_id
  RETURNING credit_balance INTO current_bal;

  RETURN current_bal;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
