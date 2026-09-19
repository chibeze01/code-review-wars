-- Make Stripe credit grants idempotent, and lock the grant RPC to the server.
--
-- The webhook can be delivered more than once (Stripe retries on non-2xx, and
-- replays are possible). Previously each delivery called add_credits() and
-- inserted a ledger row unconditionally, so a duplicate delivery double-granted
-- credits to a paying customer. We fix that with a unique key on the payment id
-- plus a single atomic RPC that inserts-then-increments only when the row is new.

-- Remediate any pre-existing duplicate payments BEFORE enforcing uniqueness,
-- otherwise CREATE UNIQUE INDEX would abort on the very rows this migration
-- exists to prevent and the RPC below would never install. Keep the earliest
-- ledger row per payment id and drop the later duplicates. (This only removes
-- the duplicate ledger rows; it does not retroactively correct an already
-- inflated balance.)
DELETE FROM public.credit_transactions a
USING public.credit_transactions b
WHERE a.stripe_payment_id IS NOT NULL
  AND a.stripe_payment_id = b.stripe_payment_id
  AND (a.created_at, a.id) > (b.created_at, b.id);

-- A given Stripe payment can only ever produce one purchase ledger row.
-- Partial: 'usage'/'bonus' rows have a NULL stripe_payment_id and are exempt.
CREATE UNIQUE INDEX IF NOT EXISTS credit_transactions_stripe_payment_id_key
  ON public.credit_transactions (stripe_payment_id)
  WHERE stripe_payment_id IS NOT NULL;

-- Atomically record a Stripe purchase and grant credits, exactly once.
-- Inserts the ledger row first; only if it was actually new (not a duplicate
-- payment id) do we increment the balance. Returns true when credits were
-- granted, false when the payment had already been processed.
CREATE OR REPLACE FUNCTION public.add_credits_for_payment(
  p_user_id    uuid,
  p_amount     int,
  p_payment_id text,
  p_description text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted int;
BEGIN
  INSERT INTO public.credit_transactions (user_id, amount, type, description, stripe_payment_id)
  VALUES (p_user_id, p_amount, 'purchase', p_description, p_payment_id)
  ON CONFLICT (stripe_payment_id) WHERE stripe_payment_id IS NOT NULL DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_inserted > 0 THEN
    UPDATE public.profiles
    SET credits = credits + p_amount
    WHERE id = p_user_id;
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- This SECURITY DEFINER function is reachable through the REST RPC endpoint and
-- Postgres grants EXECUTE to PUBLIC by default, so without this an authenticated
-- client could call it with their own UUID and a fresh payment id to mint
-- arbitrary credits. Its only legitimate caller is the Stripe webhook, which
-- uses the service-role key — restrict execution to service_role.
REVOKE EXECUTE ON FUNCTION public.add_credits_for_payment(uuid, int, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.add_credits_for_payment(uuid, int, text, text) FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.add_credits_for_payment(uuid, int, text, text) TO service_role;
