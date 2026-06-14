-- Make review scoring server-authoritative.
--
-- Codex review: the previous UPDATE policy let any authenticated client rewrite
-- score/grade/status/feedback on its own rows via the anon key, so a user could
-- fake completions and inflate honor/rank. Clients only ever need to autosave
-- annotations/general_notes on their own in-progress drafts; session creation
-- and completion are done server-side with the service role (which bypasses RLS).

-- Scope the UPDATE policy to in-progress drafts only (completed rows are frozen).
DROP POLICY IF EXISTS "Users can update own sessions" ON public.review_sessions;
CREATE POLICY "Users can autosave own drafts"
  ON public.review_sessions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status = 'in_progress')
  WITH CHECK (auth.uid() = user_id AND status = 'in_progress');

-- Column-level privileges: even on a draft, a client can only write these two
-- columns. Any attempt to set score/grade/status/feedback is denied.
REVOKE INSERT, UPDATE ON public.review_sessions FROM anon, authenticated;
GRANT UPDATE (annotations, general_notes) ON public.review_sessions TO authenticated;

-- Inserts are server-side now (service role), so drop the client INSERT path.
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.review_sessions;
