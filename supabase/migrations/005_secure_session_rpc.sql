-- Codex round 3 fixes.

-- P1: guard start_session_deduct so a client can only ever spend its OWN
-- credits. The function is SECURITY DEFINER and callable directly via the REST
-- RPC endpoint, so without this check any authenticated user could pass another
-- profile's UUID and drain their credits. Also pins search_path.
CREATE OR REPLACE FUNCTION public.start_session_deduct(p_user_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_credits int;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Not authorized to start a session for another user';
  END IF;

  UPDATE public.profiles
  SET credits = credits - 1
  WHERE id = p_user_id AND credits > 0
  RETURNING credits INTO new_credits;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient credits for user %', p_user_id;
  END IF;

  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (p_user_id, -1, 'usage', 'Review session started');

  RETURN new_credits;
END;
$$;

-- P2: persist the custom-domain context with the session so a resumed custom
-- session can still generate the next challenge (generate-code rejects custom
-- requests without a context).
ALTER TABLE public.review_sessions ADD COLUMN IF NOT EXISTS context text;
