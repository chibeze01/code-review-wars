-- Code Review Wars — initial schema

-- Profiles: one row per auth.users entry
CREATE TABLE public.profiles (
  id         uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text        NOT NULL,
  credits    int         NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);


-- Credit transactions: immutable ledger
CREATE TABLE public.credit_transactions (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount            int         NOT NULL,
  type              text        NOT NULL CHECK (type IN ('purchase', 'usage', 'bonus')),
  description       text,
  stripe_payment_id text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own transactions"
  ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);


-- Review sessions
CREATE TABLE public.review_sessions (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scenario     text,
  language     text,
  code         text,
  annotations  jsonb       NOT NULL DEFAULT '[]'::jsonb,
  score        int,
  grade        text,
  feedback     jsonb,
  credits_used int         NOT NULL DEFAULT 1,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.review_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own sessions"
  ON public.review_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions"
  ON public.review_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);


-- Auto-create profile + welcome credit transaction on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, credits)
  VALUES (NEW.id, NEW.email, 5);

  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (NEW.id, 5, 'bonus', 'Welcome bonus — 5 free credits');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- Atomically deduct 1 credit (called from evaluate-review API route)
-- Also writes a 'usage' row to the ledger so credit_transactions reconciles
-- with profiles.credits.
CREATE OR REPLACE FUNCTION public.deduct_credit(p_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET credits = credits - 1
  WHERE id = p_user_id AND credits > 0;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient credits for user %', p_user_id;
  END IF;

  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (p_user_id, -1, 'usage', 'Code review evaluation');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Atomically add credits (called from Stripe webhook)
CREATE OR REPLACE FUNCTION public.add_credits(p_user_id uuid, p_amount int)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET credits = credits + p_amount
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
