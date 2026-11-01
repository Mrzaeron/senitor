-- ==============================================================================
-- SENITOR DATABASE SCHEMA
-- Table: profiles
-- Linked to Supabase auth.users
-- ==============================================================================

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  programming_language TEXT CONSTRAINT profiles_programming_language_valid
    CHECK (programming_language IS NULL OR programming_language IN ('cpp', 'python', 'java')),
  programming_experience TEXT CONSTRAINT profiles_programming_experience_valid
    CHECK (programming_experience IS NULL OR programming_experience IN ('beginner', 'intermediate', 'advanced')),
  dsa_experience TEXT CONSTRAINT profiles_dsa_experience_valid
    CHECK (dsa_experience IS NULL OR dsa_experience IN ('beginner', 'intermediate', 'advanced')),
  learning_goal TEXT CONSTRAINT profiles_learning_goal_valid
    CHECK (learning_goal IS NULL OR learning_goal IN ('interview_prep', 'competitive_programming', 'academic_exams', 'core_mastery')),
  daily_study_target INTEGER DEFAULT 30
    CONSTRAINT profiles_daily_study_target_range
    CHECK (daily_study_target IS NULL OR daily_study_target BETWEEN 10 AND 240),
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT profiles_onboarding_completion_integrity CHECK (
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
  )
);

-- 2. Add comment
COMMENT ON TABLE public.profiles IS 'Stores Senitor user profile and DSA learning preferences.';

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
-- Policy: Users can view their own profile only
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can insert their own profile only
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile only
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 5. Trigger to automatically create a profile row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, onboarding_completed)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profiles_updated_at ON public.profiles;

CREATE TRIGGER on_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
