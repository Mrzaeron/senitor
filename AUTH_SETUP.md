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

### Database migration order

For local development, Supabase applies files in filename order after migrations are enabled in
`supabase/config.toml`. For a fresh database, the migration order is:

1. `supabase/migrations/20261031000000_create_profiles.sql`
2. `supabase/migrations/20261031000001_harden_profile_constraints.sql`
3. `supabase/migrations/20261031231500_create_dsa_curriculum.sql`
4. `supabase/migrations/20261031233200_create_learning_progress.sql`
5. `supabase/migrations/20261031234900_create_problem_bank.sql`
6. `supabase/migrations/20261101000400_add_coding_submissions.sql`
7. `supabase/migrations/20261101130000_create_study_sessions.sql`
8. `supabase/migrations/20261106190000_add_profile_avatars.sql`
9. `supabase/migrations/20261106190001_simplify_profile_onboarding.sql`
10. `supabase/migrations/20261106190002_read_own_submitted_problems.sql`
11. `supabase/migrations/20261110142000_reconcile_profile_onboarding.sql`
12. `supabase/migrations/20261114000000_add_code_execution_rate_limits.sql`

Do not run `supabase/schema.sql` as well as the initial profiles migration; it is an alternative initial profiles setup. If PostgREST still reports a table missing after applying migrations, refresh its schema cache from the SQL Editor with `NOTIFY pgrst, 'reload schema';` and retry.

### Local seed order

When `supabase db reset` is used, the enabled seed files in `supabase/config.toml` run after all
migrations in this order:

1. `supabase/seed_curriculum.sql` — creates the topics and subtopics required by the problem seeds.
2. `supabase/seed_problems.sql` — creates the initial 30 problems, tags, examples, and private tests.
3. `supabase/seed_additional_problems.sql` — adds the 70-problem expansion after the 30-problem baseline.

The curriculum seed is safe to rerun: topics, subtopics, and lessons are upserted by their slugs,
and prerequisite relationships use conflict-safe inserts. The original problem seed must run before
the additional problem seed because both problem seeds reference curriculum rows and the latter
validates the 30-problem baseline.

The additional problem seed is safe to rerun, preserves existing problem IDs, and checks for exactly
100 published problems (40 easy, 40 medium, 20 hard). It adds two public examples and a private case
per new problem.

The study-session migration and its existing tables are retained so historical data is not deleted. The dashboard no longer exposes the study timer.

The avatar migration creates or configures a public `avatars` bucket with a 2 MB size limit and JPEG, PNG, and WebP MIME restrictions. Storage object policies restrict authenticated uploads, updates, and deletes to the current user's own folder.

### Code execution configuration

Set these server-side environment variables before enabling Run or Submit:

- `SUPABASE_SERVICE_ROLE_KEY` — service-role key used only by server code to read private tests and persist trusted submission results. Never use a `NEXT_PUBLIC_` prefix or expose this value to the browser.
- `JUDGE0_API_KEY` — Judge0 CE RapidAPI key, used only by the server.
- `JUDGE0_API_HOST` — set to `judge0-ce.p.rapidapi.com`. The execution URL is fixed in server code; clients cannot choose an execution-service URL.

Without Judge0 credentials, the editor, local drafts, and submission history remain available, while code execution reports a configuration message.

### Production problem-bank deployment

The local reset seed configuration loads 30 baseline problems followed by the
70-problem expansion. A hosted database must be checked and updated separately:

1. Inspect the current schema and take a database backup according to your
   deployment policy.
2. Run `supabase/deploy_problem_bank.sql` in the hosted Supabase SQL Editor or
   through the reviewed production database workflow. This script uses the
   existing `problems.slug`, `problem_test_cases_problem_order_unique`,
   `tags.slug`, and `problem_tag_relations_pk` conflict keys, so rerunning it
   updates the intended records without duplicating them.
3. Run `supabase/verify_problem_bank.sql` and confirm `total = 100`,
   `easy = 40`, `medium = 40`, and `hard = 20`.

Do not run `supabase db reset`, delete rows, or apply this deployment script
automatically from the application. The repository cannot claim that production
contains 100 problems until the verification query has been run against the
hosted database.

---

## 3. Apply Database Migrations

For local integration testing, use the migration files and seed configuration described above.
Do not run `supabase/schema.sql` alongside `supabase/migrations/20261031000000_create_profiles.sql`;
they are alternative initial profiles setup paths. For an existing database, inspect its current
schema and apply only pending migrations in the listed order.

---

## 4. Configure Authentication in Supabase Dashboard

1. Navigate to **Authentication** → **URL Configuration**:
   * **Site URL:** Set to `http://localhost:3000` (or your production domain).
   * **Redirect URLs:** Add:
     * `http://localhost:3000/auth/callback`
     * `http://localhost:3000/onboarding`
     * `http://localhost:3000/dashboard`
     * `http://localhost:3000/reset-password`
2. For local Supabase CLI testing, `supabase/config.toml` uses `http://localhost:3000` as the
   canonical site URL and permits both `http://localhost:3000/**` and
   `http://127.0.0.1:3000/**`. Use HTTP (not HTTPS) for both local hostnames.
3. Under **Authentication** → **Providers** → **Email**:
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
5. In `/onboarding`, enter your name. Learning preferences are optional and are no longer required to access the problem bank.
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
