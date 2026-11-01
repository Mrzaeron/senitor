CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'paused', 'completed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  completed_at TIMESTAMPTZ,
  last_heartbeat_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT study_sessions_id_user_unique UNIQUE (id, user_id),
  CONSTRAINT study_sessions_state_timestamps_check CHECK (
    (status = 'running' AND completed_at IS NULL AND last_heartbeat_at IS NOT NULL)
    OR (status = 'paused' AND completed_at IS NULL AND last_heartbeat_at IS NULL)
    OR (status = 'completed' AND completed_at IS NOT NULL AND last_heartbeat_at IS NULL)
  ),
  CONSTRAINT study_sessions_completion_after_start_check CHECK (
    completed_at IS NULL OR completed_at >= started_at
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS study_sessions_one_active_per_user_idx
  ON public.study_sessions (user_id)
  WHERE status IN ('running', 'paused');

CREATE INDEX IF NOT EXISTS study_sessions_user_started_idx
  ON public.study_sessions (user_id, started_at DESC);

CREATE TABLE IF NOT EXISTS public.study_session_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  ended_at TIMESTAMPTZ,
  CONSTRAINT study_session_segments_session_owner_fk
    FOREIGN KEY (session_id, user_id)
    REFERENCES public.study_sessions (id, user_id)
    ON DELETE CASCADE,
  CONSTRAINT study_session_segments_time_order_check
    CHECK (ended_at IS NULL OR ended_at >= started_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS study_session_segments_one_open_per_session_idx
  ON public.study_session_segments (session_id)
  WHERE ended_at IS NULL;

CREATE INDEX IF NOT EXISTS study_session_segments_user_started_idx
  ON public.study_session_segments (user_id, started_at);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_session_segments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own study sessions"
  ON public.study_sessions;
CREATE POLICY "Users can read their own study sessions"
  ON public.study_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can read their own study session segments"
  ON public.study_session_segments;
CREATE POLICY "Users can read their own study session segments"
  ON public.study_session_segments
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

REVOKE ALL ON TABLE public.study_sessions, public.study_session_segments
  FROM anon, authenticated;
GRANT SELECT ON TABLE public.study_sessions, public.study_session_segments
  TO authenticated;

CREATE OR REPLACE FUNCTION public.start_study_session()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_session_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.study_sessions (user_id, status, last_heartbeat_at)
  VALUES (v_user_id, 'running', pg_catalog.clock_timestamp())
  RETURNING id INTO v_session_id;

  INSERT INTO public.study_session_segments (session_id, user_id)
  VALUES (v_session_id, v_user_id);

  RETURN v_session_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.pause_study_session(p_session_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_session public.study_sessions%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_session
  FROM public.study_sessions
  WHERE id = p_session_id AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Study session not found' USING ERRCODE = '22023';
  END IF;
  IF v_session.status = 'paused' THEN
    RETURN;
  END IF;
  IF v_session.status <> 'running' THEN
    RAISE EXCEPTION 'Study session is not running' USING ERRCODE = '22023';
  END IF;

  UPDATE public.study_session_segments
  SET ended_at = pg_catalog.clock_timestamp()
  WHERE session_id = p_session_id
    AND user_id = v_user_id
    AND ended_at IS NULL;

  UPDATE public.study_sessions
  SET status = 'paused',
      last_heartbeat_at = NULL,
      updated_at = pg_catalog.clock_timestamp()
  WHERE id = p_session_id AND user_id = v_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.resume_study_session(p_session_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_session public.study_sessions%ROWTYPE;
  v_now TIMESTAMPTZ := pg_catalog.clock_timestamp();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_session
  FROM public.study_sessions
  WHERE id = p_session_id AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Study session not found' USING ERRCODE = '22023';
  END IF;
  IF v_session.status = 'running' THEN
    RETURN;
  END IF;
  IF v_session.status <> 'paused' THEN
    RAISE EXCEPTION 'Study session cannot be resumed' USING ERRCODE = '22023';
  END IF;

  UPDATE public.study_sessions
  SET status = 'running',
      last_heartbeat_at = v_now,
      updated_at = v_now
  WHERE id = p_session_id AND user_id = v_user_id;

  INSERT INTO public.study_session_segments (session_id, user_id, started_at)
  VALUES (p_session_id, v_user_id, v_now);
END;
$$;

CREATE OR REPLACE FUNCTION public.finish_study_session(p_session_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_session public.study_sessions%ROWTYPE;
  v_now TIMESTAMPTZ := pg_catalog.clock_timestamp();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_session
  FROM public.study_sessions
  WHERE id = p_session_id AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Study session not found' USING ERRCODE = '22023';
  END IF;
  IF v_session.status = 'completed' THEN
    RETURN;
  END IF;

  IF v_session.status = 'running' THEN
    UPDATE public.study_session_segments
    SET ended_at = v_now
    WHERE session_id = p_session_id
      AND user_id = v_user_id
      AND ended_at IS NULL;
  END IF;

  UPDATE public.study_sessions
  SET status = 'completed',
      completed_at = v_now,
      last_heartbeat_at = NULL,
      updated_at = v_now
  WHERE id = p_session_id AND user_id = v_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.heartbeat_study_session(p_session_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  UPDATE public.study_sessions
  SET last_heartbeat_at = pg_catalog.clock_timestamp(),
      updated_at = pg_catalog.clock_timestamp()
  WHERE id = p_session_id
    AND user_id = v_user_id
    AND status = 'running';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Study session is no longer running' USING ERRCODE = '22023';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.pause_stale_study_session()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_session public.study_sessions%ROWTYPE;
  v_stop_at TIMESTAMPTZ;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_session
  FROM public.study_sessions
  WHERE user_id = v_user_id
    AND status = 'running'
    AND last_heartbeat_at < pg_catalog.clock_timestamp() - INTERVAL '90 seconds'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_stop_at := LEAST(
    pg_catalog.clock_timestamp(),
    v_session.last_heartbeat_at + INTERVAL '90 seconds'
  );

  UPDATE public.study_session_segments
  SET ended_at = v_stop_at
  WHERE session_id = v_session.id
    AND user_id = v_user_id
    AND ended_at IS NULL;

  UPDATE public.study_sessions
  SET status = 'paused',
      last_heartbeat_at = NULL,
      updated_at = v_stop_at
  WHERE id = v_session.id AND user_id = v_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.start_study_session() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.pause_study_session(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.resume_study_session(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.finish_study_session(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.heartbeat_study_session(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.pause_stale_study_session() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.start_study_session() TO authenticated;
GRANT EXECUTE ON FUNCTION public.pause_study_session(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resume_study_session(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finish_study_session(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.heartbeat_study_session(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pause_stale_study_session() TO authenticated;
