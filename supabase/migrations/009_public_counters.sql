-- Read-only aggregate counters for the public landing page (reviews graded,
-- bugs caught, planted flaws in the snippet bank). Fetched server-side with the
-- service role and cached for 5 minutes; locked down like the credit RPCs (007)
-- so nothing client-side can call it.

CREATE OR REPLACE FUNCTION public.public_counters()
RETURNS TABLE (reviews_graded bigint, bugs_caught bigint, planted_flaws bigint) AS $$
  SELECT
    (SELECT count(*) FROM public.review_sessions WHERE status = 'completed'),
    (SELECT count(*)
       FROM public.review_sessions s,
            jsonb_array_elements(coalesce(s.feedback->'issueResults', '[]'::jsonb)) r
      WHERE s.status = 'completed'
        AND (r->>'found')::boolean),
    (SELECT coalesce(sum(jsonb_array_length(issues)), 0) FROM public.code_snippets);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.public_counters() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.public_counters() FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.public_counters() TO service_role;
