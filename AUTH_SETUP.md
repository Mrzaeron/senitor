# SENITOR — Authentication & Database Setup Guide

This guide walks you through connecting **Supabase Auth** and **Supabase PostgreSQL** to SENITOR.

---

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in or create an account.
2. Click **"New Project"**.
3. Choose your organization and specify:
   * **Name:** `senitor` (or your preferred name)
   * **Database Password:** Choose a strong password and save it securely.
   * **Region:** Choose a region geographically close to your target users.
4. Click **"Create new project"** and wait for deployment to complete (~1-2 minutes).

---

## 2. Obtain Your API Credentials

1. In your Supabase project dashboard, navigate to **Project Settings** (gear icon) → **API**.
2. Locate the following values:
   * **Project URL:** `https://<your-project-ref>.supabase.co`
   * **Project API Keys → `anon` `public`:** `eyJhbGciOi...` (safe to expose to browser)
3. In your SENITOR project root directory, create a `.env.local` file:

```bash
# In c:\Users\daksh\OneDrive\Desktop\Project\senitor\.env.local
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> **Security Note:** Never expose the `service_role` secret key in client code or commit `.env.local` to version control.

### Database setup order

For a fresh project, apply each migration in the Supabase SQL Editor in this order:

1. `supabase/migrations/20261031_create_profiles.sql`
2. `supabase/migrations/20261031_harden_profile_constraints.sql`
3. `supabase/migrations/20261031231500_create_dsa_curriculum.sql`
4. `supabase/migrations/20261031233200_create_learning_progress.sql`
5. `supabase/migrations/20261031234900_create_problem_bank.sql`
6. `supabase/migrations/20261101000400_add_coding_submissions.sql`
7. `supabase/migrations/20261101130000_create_study_sessions.sql`
8. `supabase/seed_curriculum.sql`
9. `supabase/seed_problems.sql`

Do not run `supabase/schema.sql` as well as the initial profiles migration; it is an alternative initial profiles setup. If PostgREST still reports a table missing after applying migrations, refresh its schema cache from the SQL Editor with `NOTIFY pgrst, 'reload schema';` and retry.

The seed is safe to rerun: topics, subtopics, and lessons are upserted by their slugs, and prerequisite relationships use conflict-safe inserts. Curriculum read access is limited to authenticated users and published records. Learning-progress records are isolated to the authenticated owner by Row Level Security.

The problem bank seed upserts its 30 original problems and tags, adds sample cases from each problem's examples, and inserts a small set of private cases. The problem bank migration permits students to read only published problem content and sample cases; it grants no student write access.

The study-session migration adds owner-scoped session and elapsed-time segment tables. Study time is recorded from server timestamps; an active session is automatically paused after 90 seconds without a browser heartbeat.

### Code execution configuration

Set these server-side environment variables before enabling Run or Submit:

- `SUPABASE_SERVICE_ROLE_KEY` — service-role key used only by server code to read private tests and persist trusted submission results. Never use a `NEXT_PUBLIC_` prefix or expose this value to the browser.
- `JUDGE0_API_KEY` — Judge0 CE RapidAPI key, used only by the server.
- `JUDGE0_API_HOST` — set to `judge0-ce.p.rapidapi.com`. The execution URL is fixed in server code; clients cannot choose an execution-service URL.

Without Judge0 credentials, the editor, local drafts, and submission history remain available, while code execution reports a configuration message.

---

## 3. Execute Database Migrations (`profiles` Table & RLS)

SENITOR uses a dedicated `profiles` table linked to Supabase's `auth.users` with Row Level Security (RLS) enabled.

1. In your Supabase dashboard, navigate to **SQL Editor** in the left sidebar.
2. Click **"New query"**.
3. For a new project, use the ordered database setup above. For an existing project, verify the current schema before applying pending migrations.
   Do not apply both `supabase/schema.sql` and `supabase/migrations/20261031_create_profiles.sql`; they are alternative initial profiles setup paths.

```sql
-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  programming_language TEXT CHECK (programming_language IN ('cpp', 'python', 'java')),
  programming_experience TEXT CHECK (programming_experience IN ('beginner', 'intermediate', 'advanced')),
  dsa_experience TEXT CHECK (dsa_experience IN ('beginner', 'intermediate', 'advanced')),
  learning_goal TEXT CHECK (learning_goal IN ('interview_prep', 'competitive_programming', 'academic_exams', 'core_mastery')),
  daily_study_target INTEGER DEFAULT 30,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies (Users can only access & mutate their own profile)
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Trigger to automatically provision a profile row on signup
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Trigger for updated_at
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
```

4. Click **Run** (`Ctrl+Enter`). You should see `Success. No rows returned`.

---

## 4. Configure Authentication in Supabase Dashboard

1. Navigate to **Authentication** → **URL Configuration**:
   * **Site URL:** Set to `http://localhost:3000` (or your production domain).
   * **Redirect URLs:** Add:
     * `http://localhost:3000/auth/callback`
     * `http://localhost:3000/onboarding`
     * `http://localhost:3000/dashboard`
     * `http://localhost:3000/reset-password`
2. Under **Authentication** → **Providers** → **Email**:
   * Ensure **Enable Email provider** is turned **ON**.
   * *(Optional for local development)*: If you want to skip clicking email confirmation links during development, toggle **Confirm email** to **OFF**. If toggled **ON**, users will receive an activation email before their session starts.

---

## 5. Testing the Implementation

### A. Testing Registration & Onboarding Flow
1. Start the development server: `npm run dev`
2. Open `http://localhost:3000/signup` in your browser.
3. Fill in:
   * **Full Name:** Alex Morgan
   * **Email:** alex@example.com
   * **Password:** Pass1234
   * **Confirm Password:** Pass1234
4. Click **Create Account**.
   * If email confirmation is disabled: You will be immediately redirected to `http://localhost:3000/onboarding`.
   * If email confirmation is enabled: You will see the verification message instructing you to check your inbox.
5. In `/onboarding`, complete the 3 steps:
   * **Step 1:** Select preferred language (e.g. C++).
   * **Step 2:** Select programming & DSA experience levels.
   * **Step 3:** Select learning goal & daily target (e.g. 45 mins).
6. Click **"Build My Personalized Roadmap"**.
7. You will be redirected to `http://localhost:3000/dashboard` where your learning profile banner will display your chosen language, target goal, and daily study commitment!

### B. Testing Route Protection & Proxy
1. In an Incognito / private browsing window, try visiting `http://localhost:3000/dashboard`.
   * **Expected:** Immediately redirected to `http://localhost:3000/login?redirect=%2Fdashboard`.
2. Try visiting `http://localhost:3000/onboarding` while unauthenticated.
   * **Expected:** Redirected to `http://localhost:3000/login?redirect=%2Fonboarding`.
3. Log in with the account created above:
   * **Expected:** Redirected back to the intended destination.
4. While logged in, try navigating to `http://localhost:3000/login` or `/signup`.
   * **Expected:** Automatically redirected back to `/dashboard`.

### C. Testing Password Reset Flow
1. Visit `http://localhost:3000/forgot-password`.
2. Enter your registered email address and submit.
3. Check your inbox for the reset email, click the link (which routes through `/auth/callback?next=/reset-password`).
4. Enter your new password and submit.
5. You will see the success confirmation and be directed to the dashboard.

### D. Testing Logout
1. In the sidebar, click the **"Log out"** button at the bottom.
2. **Expected:** Your session is cleared and you are redirected to `/login`.
