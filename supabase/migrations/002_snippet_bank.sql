-- Reusable generated code snippets keyed by (language, domain)
-- Snippets are shared across all users; the bank grows as users generate on cache misses
CREATE TABLE IF NOT EXISTS code_snippets (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language   text NOT NULL,
  domain     text NOT NULL CHECK (domain IN ('ecommerce','fintech','healthcare','devtools','saas','general')),
  scenario   text NOT NULL,
  code       text NOT NULL,
  issues     jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_code_snippets_lang_domain ON code_snippets(language, domain);

-- Tracks which snippets each user has already seen (prevents repeats)
CREATE TABLE IF NOT EXISTS user_seen_snippets (
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  snippet_id uuid NOT NULL REFERENCES code_snippets(id) ON DELETE CASCADE,
  seen_at    timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, snippet_id)
);

ALTER TABLE code_snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_seen_snippets ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read snippets and contribute new ones
CREATE POLICY "snippets_select" ON code_snippets
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "snippets_insert" ON code_snippets
  FOR INSERT TO authenticated WITH CHECK (true);

-- Users manage only their own seen-snippet records
CREATE POLICY "seen_snippets_all" ON user_seen_snippets
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
