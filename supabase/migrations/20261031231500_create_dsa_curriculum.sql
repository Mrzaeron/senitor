CREATE TABLE IF NOT EXISTS public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
  slug TEXT NOT NULL UNIQUE
    CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description TEXT NOT NULL CHECK (char_length(btrim(description)) BETWEEN 1 AND 1000),
  icon TEXT NOT NULL DEFAULT 'BookOpen'
    CHECK (icon ~ '^[A-Za-z][A-Za-z0-9]*$'),
  difficulty TEXT NOT NULL
    CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS topics_published_order_idx
  ON public.topics (sort_order)
  WHERE is_published;

CREATE TABLE IF NOT EXISTS public.subtopics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
  slug TEXT NOT NULL
    CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description TEXT NOT NULL CHECK (char_length(btrim(description)) BETWEEN 1 AND 1000),
  sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
  estimated_minutes INTEGER
    CHECK (estimated_minutes IS NULL OR estimated_minutes BETWEEN 1 AND 1440),
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT subtopics_topic_slug_unique UNIQUE (topic_id, slug),
  CONSTRAINT subtopics_topic_order_unique UNIQUE (topic_id, sort_order)
);

CREATE INDEX IF NOT EXISTS subtopics_published_order_idx
  ON public.subtopics (topic_id, sort_order)
  WHERE is_published;

CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subtopic_id UUID NOT NULL REFERENCES public.subtopics(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 180),
  slug TEXT NOT NULL
    CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  content TEXT NOT NULL CHECK (char_length(btrim(content)) > 0),
  estimated_minutes INTEGER NOT NULL
    CHECK (estimated_minutes BETWEEN 1 AND 1440),
  sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT lessons_subtopic_slug_unique UNIQUE (subtopic_id, slug),
  CONSTRAINT lessons_subtopic_order_unique UNIQUE (subtopic_id, sort_order)
);

CREATE INDEX IF NOT EXISTS lessons_published_order_idx
  ON public.lessons (subtopic_id, sort_order)
  WHERE is_published;

CREATE TABLE IF NOT EXISTS public.subtopic_prerequisites (
  subtopic_id UUID NOT NULL REFERENCES public.subtopics(id) ON DELETE CASCADE,
  prerequisite_subtopic_id UUID NOT NULL REFERENCES public.subtopics(id) ON DELETE CASCADE,
  CONSTRAINT subtopic_prerequisites_pk
    PRIMARY KEY (subtopic_id, prerequisite_subtopic_id),
  CONSTRAINT subtopic_prerequisites_not_self
    CHECK (subtopic_id <> prerequisite_subtopic_id)
);

CREATE INDEX IF NOT EXISTS subtopic_prerequisites_prerequisite_idx
  ON public.subtopic_prerequisites (prerequisite_subtopic_id);

CREATE OR REPLACE FUNCTION public.set_lesson_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lessons_set_updated_at ON public.lessons;
CREATE TRIGGER lessons_set_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.set_lesson_updated_at();

ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtopics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtopic_prerequisites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read published topics"
  ON public.topics;
CREATE POLICY "Authenticated users can read published topics"
  ON public.topics
  FOR SELECT
  TO authenticated
  USING (is_published);

DROP POLICY IF EXISTS "Authenticated users can read published subtopics"
  ON public.subtopics;
CREATE POLICY "Authenticated users can read published subtopics"
  ON public.subtopics
  FOR SELECT
  TO authenticated
  USING (
    is_published
    AND EXISTS (
      SELECT 1
      FROM public.topics
      WHERE topics.id = subtopics.topic_id
        AND topics.is_published
    )
  );

DROP POLICY IF EXISTS "Authenticated users can read published lessons"
  ON public.lessons;
CREATE POLICY "Authenticated users can read published lessons"
  ON public.lessons
  FOR SELECT
  TO authenticated
  USING (
    is_published
    AND EXISTS (
      SELECT 1
      FROM public.subtopics
      JOIN public.topics ON topics.id = subtopics.topic_id
      WHERE subtopics.id = lessons.subtopic_id
        AND subtopics.is_published
        AND topics.is_published
    )
  );

DROP POLICY IF EXISTS "Authenticated users can read published prerequisites"
  ON public.subtopic_prerequisites;
CREATE POLICY "Authenticated users can read published prerequisites"
  ON public.subtopic_prerequisites
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.subtopics AS dependent
      JOIN public.topics AS dependent_topic
        ON dependent_topic.id = dependent.topic_id
      WHERE dependent.id = subtopic_prerequisites.subtopic_id
        AND dependent.is_published
        AND dependent_topic.is_published
    )
    AND EXISTS (
      SELECT 1
      FROM public.subtopics AS prerequisite
      JOIN public.topics AS prerequisite_topic
        ON prerequisite_topic.id = prerequisite.topic_id
      WHERE prerequisite.id = subtopic_prerequisites.prerequisite_subtopic_id
        AND prerequisite.is_published
        AND prerequisite_topic.is_published
    )
  );

REVOKE ALL ON TABLE
  public.topics,
  public.subtopics,
  public.lessons,
  public.subtopic_prerequisites
FROM anon;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE
  public.topics,
  public.subtopics,
  public.lessons,
  public.subtopic_prerequisites
FROM authenticated;

GRANT SELECT ON TABLE
  public.topics,
  public.subtopics,
  public.lessons,
  public.subtopic_prerequisites
TO authenticated;
