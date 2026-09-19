-- Sessions lifecycle + credit-at-start
--
-- A "session" now begins when the user clicks Generate (1 credit deducted up
-- front) and ends when they submit their review. Unfinished sessions persist so
-- the user can reload the page or resume from history without losing work or
-- being charged twice.

-- New columns on review_sessions. Existing rows are all finished reviews, so
-- they default to 'completed'.
ALTER TABLE public.review_sessions
  ADD COLUMN IF NOT EXISTS status        text  NOT NULL DEFAULT 'completed'
    CHECK (status IN ('in_progress', 'completed')),
  ADD COLUMN IF NOT EXISTS domain        text,
  ADD COLUMN IF NOT EXISTS issues        jsonb,           -- planted issues, read server-side at grading time
  ADD COLUMN IF NOT EXISTS general_notes text;            -- autosaved draft of the "general notes" box

-- score/grade/feedback are only known at the END of a session now, so they must
-- be nullable for in-progress rows. (They were already nullable in 001.)

-- Fast lookup of a user's unfinished session(s) for resume.
CREATE INDEX IF NOT EXISTS idx_review_sessions_user_status
  ON public.review_sessions (user_id, status, created_at DESC);

-- Users must be able to UPDATE their own rows now (autosave + mark completed).
DROP POLICY IF EXISTS "Users can update own sessions" ON public.review_sessions;
CREATE POLICY "Users can update own sessions"
  ON public.review_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Deduct one credit when a session starts and return the new balance.
-- Mirrors deduct_credit() but with a session-start description and a return
-- value so the API can update the UI without a second round-trip.
CREATE OR REPLACE FUNCTION public.start_session_deduct(p_user_id uuid)
RETURNS int AS $$
DECLARE
  new_credits int;
BEGIN
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
