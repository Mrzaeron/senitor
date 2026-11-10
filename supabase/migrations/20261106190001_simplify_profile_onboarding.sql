ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_onboarding_completion_integrity;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_onboarding_completion_integrity
  CHECK (
    NOT onboarding_completed
    OR (
      full_name IS NOT NULL
      AND btrim(full_name) <> ''
    )
  );
