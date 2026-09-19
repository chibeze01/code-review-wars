-- Durable run history for the Vercel cron jobs.
--
-- Vercel's runtime logs are short-lived, so a job that runs once a day is
-- effectively unmonitorable through them — by the time anyone looks, the line
-- is gone. Each run writes a row here instead, which can be queried whenever.
--
-- Writing also suits the keep-alive job better than reading did: an INSERT is
-- unambiguous database activity, which is the whole point of that job.

CREATE TABLE IF NOT EXISTS public.cron_heartbeats (
  id          bigserial   PRIMARY KEY,
  job         text        NOT NULL,
  ok          boolean     NOT NULL,
  detail      text,                    -- error message when ok = false
  duration_ms int,
  ran_at      timestamptz NOT NULL DEFAULT now()
);

-- "When did <job> last run?" is the query this table exists to answer.
CREATE INDEX IF NOT EXISTS idx_cron_heartbeats_job_ran_at
  ON public.cron_heartbeats (job, ran_at DESC);

ALTER TABLE public.cron_heartbeats ENABLE ROW LEVEL SECURITY;

-- No policies: RLS with none denies anon and authenticated outright. Only the
-- service role (which bypasses RLS) can read or write, matching the credit
-- RPCs locked down in 007.
