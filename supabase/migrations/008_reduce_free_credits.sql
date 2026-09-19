-- Reduce the free signup grant from 5 to 3 credits.
-- Updates both the column default and the signup trigger (which writes the
-- profile row and the matching 'bonus' ledger entry).

ALTER TABLE public.profiles ALTER COLUMN credits SET DEFAULT 3;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, credits)
  VALUES (NEW.id, NEW.email, 3);

  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (NEW.id, 3, 'bonus', 'Welcome bonus — 3 free credits');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
