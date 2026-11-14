CREATE TABLE IF NOT EXISTS public.code_execution_rate_limits (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  run_count integer NOT NULL DEFAULT 0 CHECK (run_count >= 0),
  submit_count integer NOT NULL DEFAULT 0 CHECK (submit_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.consume_code_execution_quota(
  p_user_id uuid,
  p_action text,
  p_window_seconds integer DEFAULT 60,
  p_run_limit integer DEFAULT 10,
  p_submit_limit integer DEFAULT 3
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_window timestamptz;
  current_run_count integer;
  current_submit_count integer;
BEGIN
  IF p_action NOT IN ('run', 'submit') THEN
    RAISE EXCEPTION 'Unsupported execution quota action';
  END IF;

  IF auth.role() <> 'service_role' AND p_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Execution quota user mismatch';
  END IF;

  INSERT INTO public.code_execution_rate_limits (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT window_started_at, run_count, submit_count
  INTO current_window, current_run_count, current_submit_count
  FROM public.code_execution_rate_limits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF current_window <= now() - make_interval(secs => p_window_seconds) THEN
    current_window := now();
    current_run_count := 0;
    current_submit_count := 0;
  END IF;

  IF p_action = 'run' AND current_run_count >= p_run_limit THEN
    RETURN false;
  END IF;
  IF p_action = 'submit' AND current_submit_count >= p_submit_limit THEN
    RETURN false;
  END IF;

  IF p_action = 'run' THEN
    current_run_count := current_run_count + 1;
  ELSE
    current_submit_count := current_submit_count + 1;
  END IF;

  UPDATE public.code_execution_rate_limits
  SET window_started_at = current_window,
      run_count = current_run_count,
      submit_count = current_submit_count,
      updated_at = now()
  WHERE user_id = p_user_id;

  RETURN true;
END;
$$;

REVOKE ALL ON TABLE public.code_execution_rate_limits FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.consume_code_execution_quota(uuid, text, integer, integer, integer)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_code_execution_quota(uuid, text, integer, integer, integer)
  TO authenticated, service_role;
