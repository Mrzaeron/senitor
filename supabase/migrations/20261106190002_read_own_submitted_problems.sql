DROP POLICY IF EXISTS "Users can read problems they have submitted to"
  ON public.problems;

CREATE POLICY "Users can read problems they have submitted to"
  ON public.problems
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.code_submissions
      WHERE code_submissions.problem_id = problems.id
        AND code_submissions.user_id = (SELECT auth.uid())
    )
  );
