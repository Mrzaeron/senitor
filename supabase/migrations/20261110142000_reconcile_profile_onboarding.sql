ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_path TEXT;

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

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, onboarding_completed)
  VALUES (
    NEW.id,
    NULLIF(pg_catalog.btrim(NEW.raw_user_meta_data ->> 'full_name'), ''),
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.handle_new_user()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at := pg_catalog.now();
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.handle_updated_at()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_profiles_updated_at ON public.profiles;
CREATE TRIGGER on_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
