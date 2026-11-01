CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'completed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT lesson_progress_user_lesson_unique UNIQUE (user_id, lesson_id),
  CONSTRAINT lesson_progress_status_timestamps_check CHECK (
    (status = 'not_started' AND started_at IS NULL AND completed_at IS NULL)
    OR (
      status = 'in_progress'
      AND started_at IS NOT NULL
      AND completed_at IS NULL
    )
    OR (
      status = 'completed'
      AND started_at IS NOT NULL
      AND completed_at IS NOT NULL
      AND completed_at >= started_at
    )
  )
);

CREATE INDEX IF NOT EXISTS lesson_progress_user_status_idx
  ON public.lesson_progress (user_id, status);

CREATE INDEX IF NOT EXISTS lesson_progress_lesson_idx
  ON public.lesson_progress (lesson_id);

CREATE TABLE IF NOT EXISTS public.user_learning_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  last_lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  last_subtopic_id UUID REFERENCES public.subtopics(id) ON DELETE SET NULL,
  last_topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_learning_state_last_lesson_idx
  ON public.user_learning_state (last_lesson_id)
  WHERE last_lesson_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS user_learning_state_last_subtopic_idx
  ON public.user_learning_state (last_subtopic_id)
  WHERE last_subtopic_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS user_learning_state_last_topic_idx
  ON public.user_learning_state (last_topic_id)
  WHERE last_topic_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.set_learning_progress_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lesson_progress_set_updated_at
  ON public.lesson_progress;
CREATE TRIGGER lesson_progress_set_updated_at
  BEFORE UPDATE ON public.lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.set_learning_progress_updated_at();

DROP TRIGGER IF EXISTS user_learning_state_set_updated_at
  ON public.user_learning_state;
CREATE TRIGGER user_learning_state_set_updated_at
  BEFORE UPDATE ON public.user_learning_state
  FOR EACH ROW
  EXECUTE FUNCTION public.set_learning_progress_updated_at();

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_learning_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own lesson progress"
  ON public.lesson_progress;
CREATE POLICY "Users can read their own lesson progress"
  ON public.lesson_progress
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own published lesson progress"
  ON public.lesson_progress;
CREATE POLICY "Users can insert their own published lesson progress"
  ON public.lesson_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.lessons
      JOIN public.subtopics ON subtopics.id = lessons.subtopic_id
      JOIN public.topics ON topics.id = subtopics.topic_id
      WHERE lessons.id = lesson_progress.lesson_id
        AND lessons.is_published
        AND subtopics.is_published
        AND topics.is_published
    )
  );

DROP POLICY IF EXISTS "Users can update their own published lesson progress"
  ON public.lesson_progress;
CREATE POLICY "Users can update their own published lesson progress"
  ON public.lesson_progress
  FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.lessons
      JOIN public.subtopics ON subtopics.id = lessons.subtopic_id
      JOIN public.topics ON topics.id = subtopics.topic_id
      WHERE lessons.id = lesson_progress.lesson_id
        AND lessons.is_published
        AND subtopics.is_published
        AND topics.is_published
    )
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.lessons
      JOIN public.subtopics ON subtopics.id = lessons.subtopic_id
      JOIN public.topics ON topics.id = subtopics.topic_id
      WHERE lessons.id = lesson_progress.lesson_id
        AND lessons.is_published
        AND subtopics.is_published
        AND topics.is_published
    )
  );

DROP POLICY IF EXISTS "Users can read their own learning state"
  ON public.user_learning_state;
CREATE POLICY "Users can read their own learning state"
  ON public.user_learning_state
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own learning state"
  ON public.user_learning_state;
CREATE POLICY "Users can insert their own learning state"
  ON public.user_learning_state
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND (
      last_lesson_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.lessons
        JOIN public.subtopics ON subtopics.id = lessons.subtopic_id
        JOIN public.topics ON topics.id = subtopics.topic_id
        WHERE lessons.id = user_learning_state.last_lesson_id
          AND subtopics.id = user_learning_state.last_subtopic_id
          AND topics.id = user_learning_state.last_topic_id
          AND lessons.is_published
          AND subtopics.is_published
          AND topics.is_published
      )
    )
    AND (
      last_subtopic_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.subtopics
        JOIN public.topics ON topics.id = subtopics.topic_id
        WHERE subtopics.id = user_learning_state.last_subtopic_id
          AND subtopics.is_published
          AND topics.is_published
      )
    )
    AND (
      last_topic_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.topics
        WHERE topics.id = user_learning_state.last_topic_id
          AND topics.is_published
      )
    )
  );

DROP POLICY IF EXISTS "Users can update their own learning state"
  ON public.user_learning_state;
CREATE POLICY "Users can update their own learning state"
  ON public.user_learning_state
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND (
      last_lesson_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.lessons
        JOIN public.subtopics ON subtopics.id = lessons.subtopic_id
        JOIN public.topics ON topics.id = subtopics.topic_id
        WHERE lessons.id = user_learning_state.last_lesson_id
          AND subtopics.id = user_learning_state.last_subtopic_id
          AND topics.id = user_learning_state.last_topic_id
          AND lessons.is_published
          AND subtopics.is_published
          AND topics.is_published
      )
    )
    AND (
      last_subtopic_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.subtopics
        JOIN public.topics ON topics.id = subtopics.topic_id
        WHERE subtopics.id = user_learning_state.last_subtopic_id
          AND subtopics.is_published
          AND topics.is_published
      )
    )
    AND (
      last_topic_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.topics
        WHERE topics.id = user_learning_state.last_topic_id
          AND topics.is_published
      )
    )
  );

REVOKE ALL ON TABLE public.lesson_progress, public.user_learning_state
FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE
ON TABLE public.lesson_progress, public.user_learning_state
TO authenticated;
