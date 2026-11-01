ALTER TABLE public.problems
  ADD COLUMN IF NOT EXISTS starter_code JSONB NOT NULL
  DEFAULT '{"cpp":"","python":""}'::JSONB;

ALTER TABLE public.problems
  DROP CONSTRAINT IF EXISTS problems_starter_code_languages_valid;
ALTER TABLE public.problems
  ADD CONSTRAINT problems_starter_code_languages_valid
  CHECK (
    jsonb_typeof(starter_code) = 'object'
    AND starter_code ? 'cpp'
    AND starter_code ? 'python'
    AND jsonb_typeof(starter_code->'cpp') = 'string'
    AND jsonb_typeof(starter_code->'python') = 'string'
    AND char_length(starter_code->>'cpp') <= 50000
    AND char_length(starter_code->>'python') <= 50000
  );

CREATE TABLE IF NOT EXISTS public.code_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  language TEXT NOT NULL CHECK (language IN ('cpp', 'python')),
  source_code TEXT NOT NULL
    CHECK (char_length(source_code) BETWEEN 1 AND 50000),
  status TEXT NOT NULL CHECK (
    status IN (
      'accepted',
      'wrong_answer',
      'compilation_error',
      'runtime_error',
      'time_limit_exceeded',
      'execution_error'
    )
  ),
  execution_time NUMERIC(10, 3)
    CHECK (execution_time IS NULL OR execution_time >= 0),
  memory_used INTEGER
    CHECK (memory_used IS NULL OR memory_used >= 0),
  passed_test_cases INTEGER NOT NULL CHECK (passed_test_cases >= 0),
  total_test_cases INTEGER NOT NULL CHECK (total_test_cases > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT code_submissions_passed_within_total
    CHECK (passed_test_cases <= total_test_cases)
);

CREATE INDEX IF NOT EXISTS code_submissions_user_problem_created_idx
  ON public.code_submissions (user_id, problem_id, created_at DESC);

CREATE INDEX IF NOT EXISTS code_submissions_user_created_idx
  ON public.code_submissions (user_id, created_at DESC);

ALTER TABLE public.code_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own code submissions"
  ON public.code_submissions;
CREATE POLICY "Users can read their own code submissions"
  ON public.code_submissions
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

REVOKE ALL ON TABLE public.code_submissions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.code_submissions TO authenticated;
GRANT ALL ON TABLE public.code_submissions TO service_role;
GRANT SELECT ON TABLE public.problem_test_cases TO service_role;

COMMENT ON TABLE public.code_submissions IS
  'Immutable student submission history. Inserts are performed by the trusted server execution flow.';
