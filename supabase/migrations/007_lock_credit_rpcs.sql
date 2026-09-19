-- Lock the remaining credit RPCs to the server (service_role) only.
--
-- add_credits() and deduct_credit() are SECURITY DEFINER and reachable through
-- the PostgREST RPC endpoint, where Postgres grants EXECUTE to PUBLIC by
-- default. That means any authenticated user could call
--   add_credits(<their own uuid>, 9999)
-- to mint themselves unlimited credits. add_credits is only ever called by the
-- Stripe webhook refund path using the service-role key; deduct_credit is dead
-- code (the app deducts via the auth-guarded start_session_deduct). Neither has
-- a legitimate client caller, so restrict both to service_role. Also pin
-- search_path on both, matching 005_secure_session_rpc and add_credits_for_payment.

ALTER FUNCTION public.add_credits(uuid, int) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.add_credits(uuid, int) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.add_credits(uuid, int) FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.add_credits(uuid, int) TO service_role;

ALTER FUNCTION public.deduct_credit(uuid) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.deduct_credit(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.deduct_credit(uuid) FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.deduct_credit(uuid) TO service_role;
