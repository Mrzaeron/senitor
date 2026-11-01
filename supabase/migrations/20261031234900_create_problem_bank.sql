CREATE UNIQUE INDEX IF NOT EXISTS subtopics_topic_id_id_problem_fk_idx
  ON public.subtopics (topic_id, id);

CREATE TABLE IF NOT EXISTS public.problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 180),
  slug TEXT NOT NULL UNIQUE
    CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description TEXT NOT NULL CHECK (char_length(btrim(description)) > 0),
  difficulty TEXT NOT NULL
    CHECK (difficulty IN ('easy', 'medium', 'hard')),
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  subtopic_id UUID NOT NULL,
  constraints TEXT[] NOT NULL
    CHECK (cardinality(constraints) BETWEEN 1 AND 20),
  input_format TEXT NOT NULL CHECK (char_length(btrim(input_format)) > 0),
  output_format TEXT NOT NULL CHECK (char_length(btrim(output_format)) > 0),
  examples JSONB NOT NULL
    CHECK (
      jsonb_typeof(examples) = 'array'
      AND jsonb_array_length(examples) >= 2
    ),
  hints JSONB NOT NULL
    CHECK (
      jsonb_typeof(hints) = 'array'
      AND jsonb_array_length(hints) >= 1
    ),
  supported_languages TEXT[] NOT NULL DEFAULT ARRAY['cpp', 'python', 'java'],
  acceptance_rate NUMERIC(5, 2)
    CHECK (acceptance_rate IS NULL OR acceptance_rate BETWEEN 0 AND 100),
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT problems_subtopic_matches_topic_fk
    FOREIGN KEY (topic_id, subtopic_id)
    REFERENCES public.subtopics (topic_id, id)
    ON DELETE CASCADE,
  CONSTRAINT problems_supported_languages_valid
    CHECK (
      cardinality(supported_languages) > 0
      AND supported_languages <@ ARRAY['cpp', 'python', 'java']::TEXT[]
    )
);

CREATE INDEX IF NOT EXISTS problems_published_order_idx
  ON public.problems (created_at DESC, id)
  WHERE is_published;

CREATE INDEX IF NOT EXISTS problems_published_topic_difficulty_idx
  ON public.problems (topic_id, difficulty, created_at DESC)
  WHERE is_published;

CREATE OR REPLACE FUNCTION public.set_problem_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS problems_set_updated_at ON public.problems;
CREATE TRIGGER problems_set_updated_at
  BEFORE UPDATE ON public.problems
  FOR EACH ROW
  EXECUTE FUNCTION public.set_problem_updated_at();

CREATE TABLE IF NOT EXISTS public.problem_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
    CHECK (char_length(btrim(name)) BETWEEN 1 AND 80),
  slug TEXT NOT NULL UNIQUE
    CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

CREATE TABLE IF NOT EXISTS public.problem_tag_relations (
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.problem_tags(id) ON DELETE CASCADE,
  CONSTRAINT problem_tag_relations_pk PRIMARY KEY (problem_id, tag_id)
);

CREATE INDEX IF NOT EXISTS problem_tag_relations_tag_problem_idx
  ON public.problem_tag_relations (tag_id, problem_id);

CREATE TABLE IF NOT EXISTS public.problem_test_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
  input TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  is_sample BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
  CONSTRAINT problem_test_cases_problem_order_unique
    UNIQUE (problem_id, sort_order)
);

CREATE INDEX IF NOT EXISTS problem_test_cases_problem_sample_idx
  ON public.problem_test_cases (problem_id, is_sample, sort_order);

ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_tag_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_test_cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read published problems"
  ON public.problems;
CREATE POLICY "Authenticated users can read published problems"
  ON public.problems
  FOR SELECT
  TO authenticated
  USING (
    is_published
    AND EXISTS (
      SELECT 1
      FROM public.topics
      JOIN public.subtopics ON subtopics.topic_id = topics.id
      WHERE topics.id = problems.topic_id
        AND subtopics.id = problems.subtopic_id
        AND topics.is_published
        AND subtopics.is_published
    )
  );

DROP POLICY IF EXISTS "Authenticated users can read associated published tags"
  ON public.problem_tags;
CREATE POLICY "Authenticated users can read associated published tags"
  ON public.problem_tags
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.problem_tag_relations
      JOIN public.problems ON problems.id = problem_tag_relations.problem_id
      JOIN public.topics ON topics.id = problems.topic_id
      JOIN public.subtopics
        ON subtopics.id = problems.subtopic_id
        AND subtopics.topic_id = problems.topic_id
      WHERE problem_tag_relations.tag_id = problem_tags.id
        AND problems.is_published
        AND topics.is_published
        AND subtopics.is_published
    )
  );

DROP POLICY IF EXISTS "Authenticated users can read tags for published problems"
  ON public.problem_tag_relations;
CREATE POLICY "Authenticated users can read tags for published problems"
  ON public.problem_tag_relations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.problems
      JOIN public.topics ON topics.id = problems.topic_id
      JOIN public.subtopics
        ON subtopics.id = problems.subtopic_id
        AND subtopics.topic_id = problems.topic_id
      WHERE problems.id = problem_tag_relations.problem_id
        AND problems.is_published
        AND topics.is_published
        AND subtopics.is_published
    )
  );

DROP POLICY IF EXISTS "Authenticated users can read sample cases for published problems"
  ON public.problem_test_cases;
CREATE POLICY "Authenticated users can read sample cases for published problems"
  ON public.problem_test_cases
  FOR SELECT
  TO authenticated
  USING (
    is_sample
    AND EXISTS (
      SELECT 1
      FROM public.problems
      JOIN public.topics ON topics.id = problems.topic_id
      JOIN public.subtopics
        ON subtopics.id = problems.subtopic_id
        AND subtopics.topic_id = problems.topic_id
      WHERE problems.id = problem_test_cases.problem_id
        AND problems.is_published
        AND topics.is_published
        AND subtopics.is_published
    )
  );

REVOKE ALL ON TABLE
  public.problems,
  public.problem_tags,
  public.problem_tag_relations,
  public.problem_test_cases
FROM anon, authenticated;

GRANT SELECT ON TABLE
  public.problems,
  public.problem_tags,
  public.problem_tag_relations,
  public.problem_test_cases
TO authenticated;
