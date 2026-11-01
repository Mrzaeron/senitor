-- Enforce study-target bounds and require complete profile data for completed onboarding.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_daily_study_target_range'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_daily_study_target_range
      CHECK (daily_study_target IS NULL OR daily_study_target BETWEEN 10 AND 240);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_onboarding_completion_integrity'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_onboarding_completion_integrity
      CHECK (
        NOT onboarding_completed OR (
          full_name IS NOT NULL
          AND btrim(full_name) <> ''
          AND programming_language IS NOT NULL
          AND programming_experience IS NOT NULL
          AND dsa_experience IS NOT NULL
          AND learning_goal IS NOT NULL
          AND daily_study_target IS NOT NULL
          AND daily_study_target BETWEEN 10 AND 240
        )
      );
  END IF;
END
$$;
