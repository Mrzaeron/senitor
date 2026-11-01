# SENITOR — Architecture Document

> **Status:** Approved — v1.0  
> **Last updated:** 2026-10-31  
> **Stack:** Next.js 16 (App Router) · React 19 · TypeScript 5 · Tailwind CSS 4 · Lucide React  
> **Auth:** Supabase Auth  
> **Pending integrations:** Supabase DB · AI/LLM provider · RAG pipeline · ML recommendation engine

---

## 1. What Is Senitor?

Senitor is an AI-powered, personalized DSA (Data Structures & Algorithms) learning assistant.  
It tracks student performance, identifies weaknesses, recommends learning paths, and provides AI-powered explanations — all adapted to each individual learner.

---

## 2. Core Principles

| Principle | Decision |
|---|---|
| **Separation of concerns** | Frontend, backend, database, auth, and AI are isolated layers that communicate through defined interfaces |
| **Server-first by default** | Pages and layouts are React Server Components; `"use client"` is added only where interactivity is required |
| **Feature-scoped components** | UI components are grouped by feature domain, not by type, to keep related code co-located |
| **Swappable integrations** | Database, AI provider, and auth are accessed only through `lib/` abstractions — swap implementations without touching UI |
| **Scalable toward RAG/ML** | `lib/ai/` and `lib/ml/` are designed as extension points for future Retrieval-Augmented Generation and ML recommendation pipelines |

---

## 3. Folder Architecture

The project uses a `src/` directory to separate application source code from root-level configuration files.  
The path alias `@/*` maps to the project root (i.e., `@/src/...`).

```
senitor/
│
├── src/                              # All application source code
│   │
│   ├── app/                          # Next.js App Router — routing layer only
│   │   │
│   │   ├── (auth)/                   # Route group: unauthenticated flows
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── signup/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (dashboard)/              # Route group: authenticated app shell
│   │   │   ├── layout.tsx            # Shared sidebar + topbar layout
│   │   │   ├── page.tsx              # ← Dashboard homepage (overview)
│   │   │   ├── learn/
│   │   │   │   ├── page.tsx          # Learning path / topic browser
│   │   │   │   └── [topicId]/
│   │   │   │       └── page.tsx      # Individual topic/lesson view
│   │   │   ├── practice/
│   │   │   │   ├── page.tsx          # Problem browser with filters
│   │   │   │   └── [problemId]/
│   │   │   │       └── page.tsx      # Problem solve view + code editor
│   │   │   ├── progress/
│   │   │   │   └── page.tsx          # Analytics, heatmap, skill radar
│   │   │   ├── ai-tutor/
│   │   │   │   └── page.tsx          # ← Dedicated AI Tutor page
│   │   │   └── profile/
│   │   │       └── page.tsx
│   │   │
│   │   ├── api/                      # Next.js Route Handlers — backend layer
│   │   │   ├── auth/
│   │   │   │   └── callback/
│   │   │   │       └── route.ts      # Supabase Auth OAuth callback handler
│   │   │   ├── problems/
│   │   │   │   ├── route.ts          # GET /api/problems (list + filter)
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts      # GET /api/problems/:id
│   │   │   ├── progress/
│   │   │   │   └── route.ts          # GET/POST /api/progress
│   │   │   └── ai/
│   │   │       ├── explain/
│   │   │       │   └── route.ts      # POST /api/ai/explain
│   │   │       ├── recommend/
│   │   │       │   └── route.ts      # POST /api/ai/recommend
│   │   │       └── tutor/
│   │   │           └── route.ts      # POST /api/ai/tutor (chat stream)
│   │   │
│   │   ├── globals.css
│   │   ├── layout.tsx                # Root layout: fonts, global providers
│   │   └── not-found.tsx
│   │
│   ├── components/                   # All React UI components
│   │   │
│   │   ├── ui/                       # Design-system primitives (no domain knowledge)
│   │   │   ├── Button.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Tooltip.tsx
│   │   │   ├── Avatar.tsx
│   │   │   └── index.ts             # Barrel export
│   │   │
│   │   ├── layout/                   # App shell structural pieces
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Topbar.tsx
│   │   │   ├── MobileNav.tsx
│   │   │   └── Footer.tsx
│   │   │
│   │   ├── dashboard/                # Feature: dashboard homepage widgets
│   │   │   ├── WelcomeBanner.tsx
│   │   │   ├── DailyGoalCard.tsx
│   │   │   ├── RecentProblems.tsx
│   │   │   └── QuickStats.tsx
│   │   │
│   │   ├── learn/                    # Feature: learning path
│   │   │   ├── TopicCard.tsx
│   │   │   ├── TopicList.tsx
│   │   │   ├── LessonViewer.tsx
│   │   │   └── TopicProgressBar.tsx
│   │   │
│   │   ├── practice/                 # Feature: problem solving
│   │   │   ├── ProblemCard.tsx
│   │   │   ├── ProblemFilter.tsx
│   │   │   ├── DifficultyBadge.tsx
│   │   │   └── CodeEditor.tsx
│   │   │
│   │   ├── progress/                 # Feature: analytics & tracking
│   │   │   ├── StreakCalendar.tsx
│   │   │   ├── SkillRadar.tsx
│   │   │   └── StatCard.tsx
│   │   │
│   │   └── ai/                       # Feature: AI assistant widgets
│   │       ├── TutorChat.tsx         # Conversational UI for AI Tutor page
│   │       ├── TutorMessageBubble.tsx
│   │       ├── ExplanationPanel.tsx  # Inline explanation overlay (practice page)
│   │       └── RecommendationCard.tsx
│   │
│   ├── lib/                          # Server-side business logic (never imported by Client Components)
│   │   │
│   │   ├── supabase/                 # Supabase client & Auth helpers
│   │   │   ├── client.ts             # Browser-side Supabase client (for Client Components)
│   │   │   ├── server.ts             # Server-side Supabase client (for Route Handlers & Server Components)
│   │   │   └── middleware.ts         # Session refresh logic for Next.js middleware
│   │   │
│   │   ├── db/                       # Database query functions (Supabase PostgREST / raw SQL)
│   │   │   ├── problems.ts           # CRUD for problems table
│   │   │   ├── progress.ts           # CRUD for user progress table
│   │   │   ├── users.ts              # User profile queries
│   │   │   └── index.ts              # Re-exports
│   │   │
│   │   ├── ai/                       # AI/LLM integration (future provider)
│   │   │   ├── client.ts             # LLM client initialisation
│   │   │   ├── prompts.ts            # Prompt templates (explain, recommend, tutor)
│   │   │   ├── explain.ts            # explain() business function
│   │   │   ├── recommend.ts          # recommend() business function
│   │   │   └── tutor.ts              # tutor() streaming function
│   │   │
│   │   ├── ml/                       # ML recommendation engine (future RAG / embeddings)
│   │   │   ├── embeddings.ts         # Vector embedding utilities
│   │   │   ├── retrieval.ts          # RAG retrieval logic
│   │   │   └── recommend.ts          # ML-based problem recommendation
│   │   │
│   │   └── utils.ts                  # Pure shared utilities (formatDate, slugify, etc.)
│   │
│   ├── hooks/                        # Custom React hooks (Client Components only)
│   │   ├── useLocalStorage.ts
│   │   ├── useDebounce.ts
│   │   ├── useProgress.ts            # Fetches & caches user progress
│   │   ├── useProblems.ts            # Fetches & filters problems list
│   │   └── useTutorChat.ts           # Manages AI tutor conversation state
│   │
│   ├── types/                        # Shared TypeScript interfaces and enums
│   │   ├── problem.ts                # Problem, Difficulty, Tag
│   │   ├── user.ts                   # User, UserProfile
│   │   ├── progress.ts               # ProgressEntry, Streak, TopicMastery
│   │   ├── ai.ts                     # TutorMessage, ExplanationResult, Recommendation
│   │   └── index.ts                  # Barrel re-export
│   │
│   └── constants/                    # Static app-wide configuration
│       ├── topics.ts                 # DSA topic taxonomy (Arrays, Trees, DP, etc.)
│       ├── difficulty.ts             # Difficulty enum labels and colour tokens
│       └── routes.ts                 # Named route path constants
│
├── public/                           # Static assets (served at /)
│   └── icons/
│
├── ARCHITECTURE.md                   # This document
├── AGENTS.md                         # Agentic coding rules
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
└── package.json
```

---

## 4. Page Inventory

| Route | Purpose | Auth required |
|---|---|---|
| `/login` | Sign in with email or OAuth | No |
| `/signup` | Create a new account | No |
| `/` (dashboard) | Overview: daily goal, recent activity, quick stats | Yes |
| `/learn` | Browse DSA topic tree and learning paths | Yes |
| `/learn/[topicId]` | Lesson viewer for a specific topic | Yes |
| `/practice` | Browse and filter problems by topic/difficulty | Yes |
| `/practice/[problemId]` | Solve a problem with AI explanation panel | Yes |
| `/progress` | Analytics dashboard: streak calendar, skill radar | Yes |
| `/ai-tutor` | Dedicated conversational AI tutor | Yes |
| `/profile` | User settings and account details | Yes |

---

## 5. API Route Inventory

| Endpoint | Method | Responsibility |
|---|---|---|
| `/api/auth/callback` | GET | Supabase OAuth redirect handler |
| `/api/problems` | GET | List problems with filter/pagination |
| `/api/problems/[id]` | GET | Single problem detail |
| `/api/progress` | GET, POST | Read and write user progress entries |
| `/api/ai/explain` | POST | Generate AI explanation for a problem/concept |
| `/api/ai/recommend` | POST | Recommend next problems based on performance |
| `/api/ai/tutor` | POST | Stream a conversational AI tutor response |

---

## 6. Layer Responsibilities

### 6.1 Routing Layer — `src/app/`

- Contains **only** `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, and `route.ts` files.
- Pages are async Server Components that fetch data and pass it as props to feature components.
- No business logic, no database calls, no AI calls — all delegated to `lib/`.
- Route groups `(auth)` and `(dashboard)` share layouts without polluting the URL.

### 6.2 Component Layer — `src/components/`

Split into two tiers:

**Tier 1 — `ui/`:** Primitive, domain-agnostic atoms. They accept only generic props (labels, variants, callbacks). They are never coupled to Senitor data types. These form the design system.

**Tier 2 — `<feature>/`:** Domain-aware components that know about `Problem`, `ProgressEntry`, `TutorMessage`, etc. They are composed from `ui/` atoms and rendered by pages in `app/`. Each subdirectory maps 1:1 to a route group.

### 6.3 Backend Layer — `src/app/api/`

- Next.js Route Handlers act as the HTTP surface of the backend.
- Each handler validates the incoming request, calls the appropriate `lib/` function, and returns a typed JSON response.
- Handlers never contain database or AI logic directly — they are thin adapters.
- Streaming responses (AI tutor) use `ReadableStream` / `Response` with `Transfer-Encoding: chunked`.

### 6.4 Library Layer — `src/lib/`

The core of the server-side application. Divided into four namespaces:

| Namespace | Responsibility |
|---|---|
| `lib/supabase/` | Supabase client initialisation for both browser and server contexts, plus session middleware |
| `lib/db/` | All database read/write operations via Supabase PostgREST or raw SQL. The rest of the app never touches the DB directly |
| `lib/ai/` | LLM client, prompt templates, and exported business functions (`explain`, `recommend`, `tutor`). Swap provider by changing `client.ts` only |
| `lib/ml/` | Future extension point for embedding generation, vector retrieval (RAG), and ML-based problem recommendations |

### 6.5 Hooks Layer — `src/hooks/`

- Custom React hooks used exclusively by Client Components (`"use client"`).
- Wrap `fetch()` calls to Route Handlers, manage local UI state, and abstract browser APIs.
- Keep components thin: components declare *what* to render, hooks manage *how* to get data.

### 6.6 Types Layer — `src/types/`

- Single source of truth for all TypeScript interfaces.
- Shared between components, Route Handlers, and lib functions without circular imports.
- No runtime code — types only.

### 6.7 Constants Layer — `src/constants/`

- Zero runtime logic — pure data.
- `topics.ts` defines the complete DSA topic taxonomy used for learning paths and AI recommendations.
- `routes.ts` exports named constants for all internal navigation paths, preventing magic strings.

---

## 7. Authentication Architecture (Supabase Auth)

```
Browser                         Server
──────────────────────────────────────────────────────
components/                     src/app/api/auth/
  (login form)  ──POST──►       callback/route.ts
                                  │
lib/supabase/client.ts           lib/supabase/server.ts
  supabase.auth.signIn()           supabase.auth.getUser()
                                  │
                             middleware.ts
                               (session refresh on every request)
```

- **Client-side:** `lib/supabase/client.ts` exposes the browser Supabase client for login/signup forms.
- **Server-side:** `lib/supabase/server.ts` creates a cookie-based server client for Route Handlers and Server Components that need the authenticated user.
- **Middleware:** `lib/supabase/middleware.ts` is called from `src/middleware.ts` at the root to refresh the session token on every request and redirect unauthenticated users away from `(dashboard)` routes.

---

## 8. Data Flow Diagram

```
┌───────────────────────────────────────────────────────────────┐
│  BROWSER                                                      │
│                                                               │
│  src/app/(dashboard)/page.tsx  (Server Component)            │
│    └── fetches via lib/db/  OR  delegates to Route Handler   │
│                                                               │
│  src/components/<feature>/*.tsx  (Client Components)          │
│    └── hooks/use*.ts  →  fetch("/api/...")                   │
└────────────────────────────────┬──────────────────────────────┘
                                 │ HTTPS / Route Handler
┌────────────────────────────────▼──────────────────────────────┐
│  NEXT.JS SERVER  (src/app/api/**/route.ts)                    │
│    Validates input → calls lib/db or lib/ai                   │
└──────────┬────────────────────────────────┬───────────────────┘
           │                                │
┌──────────▼──────────┐         ┌───────────▼──────────────────┐
│  lib/db/            │         │  lib/ai/  +  lib/ml/          │
│  Supabase PostgREST │         │  LLM Client  (future)         │
│  / SQL              │         │  RAG / Embeddings (future)    │
└──────────┬──────────┘         └───────────┬──────────────────┘
           │                                │
┌──────────▼──────────┐         ┌───────────▼──────────────────┐
│  Supabase Database  │         │  AI Provider API              │
│  (PostgreSQL)       │         │  (Gemini / OpenAI / etc.)     │
└─────────────────────┘         └──────────────────────────────┘
```

---

## 9. Server vs. Client Component Strategy

| File location | Default rendering | When to add `"use client"` |
|---|---|---|
| `app/**/page.tsx` | Server Component | Never — keep pages as server data-fetchers |
| `app/**/layout.tsx` | Server Component | Only if global context providers are needed |
| `components/ui/*.tsx` | Server Component | When the component uses `useState`, `useEffect`, or event handlers |
| `components/<feature>/*.tsx` | Server Component | When the component needs interactivity (forms, modals, charts) |
| `hooks/*.ts` | — (client-only) | Always — hooks are always client-side |

---

## 10. Scalability for RAG and ML

`lib/ml/` is scaffolded as a dedicated namespace to support future AI enhancements without refactoring:

- **`embeddings.ts`** — generates vector embeddings from problem descriptions and user solution history using any embedding model (OpenAI `text-embedding-3`, Gemini `embedding-001`, etc.).
- **`retrieval.ts`** — performs similarity search against a vector store (pgvector on Supabase, Pinecone, etc.) to retrieve relevant DSA concepts for RAG.
- **`recommend.ts`** — an ML-informed recommendation function that replaces or augments the simple rule-based `lib/ai/recommend.ts` as the model matures.

The Route Handlers in `app/api/ai/` will simply swap which `lib/` function they call — no changes to components or pages.

---

## 11. Reusable Component Catalogue

| Component | Location | Used By |
|---|---|---|
| `Button` | `components/ui/` | Auth forms, problem actions, AI panel, profile |
| `Badge` | `components/ui/` | Difficulty labels, topic tags, status chips |
| `Card` | `components/ui/` | Topic cards, problem cards, stat cards, recommendation cards |
| `Skeleton` | `components/ui/` | All data-fetching pages during loading states |
| `Modal` | `components/ui/` | Lesson overlays, confirmation dialogs, AI explanations |
| `Input` | `components/ui/` | Search, filters, auth forms, tutor chat input |
| `Tooltip` | `components/ui/` | Heatmap cells, chart data points, icon-only buttons |
| `Avatar` | `components/ui/` | Topbar user menu, profile page, chat bubbles |

---

## 12. Naming Conventions

| Artifact | Convention | Example |
|---|---|---|
| React components | PascalCase file, named export | `TopicCard.tsx` |
| Hooks | camelCase, `use` prefix | `useProgress.ts` |
| Lib functions | camelCase, verb-first | `getUserProgress()` |
| Types/Interfaces | PascalCase, `I` prefix avoided | `type Problem = { ... }` |
| Route Handler files | always named `route.ts` | `app/api/problems/route.ts` |
| Constants | SCREAMING_SNAKE for values, camelCase for objects | `DIFFICULTY_LEVELS`, `routes` |
| CSS classes | Tailwind utility-first, no custom class names unless necessary | — |

---

## 13. Environment Variables (planned)

| Variable | Used In | Public? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `lib/supabase/client.ts` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `lib/supabase/client.ts` | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | `lib/supabase/server.ts` | **No** |
| `AI_PROVIDER_API_KEY` | `lib/ai/client.ts` | **No** |
| `AI_MODEL_NAME` | `lib/ai/client.ts` | **No** |

Variables without the `NEXT_PUBLIC_` prefix are **server-only** and never bundled into the client.

---

## 14. What Is NOT in Scope (for this stage)

- No database schema or migrations
- No Supabase project configuration
- No LLM/AI provider integration
- No authentication implementation
- No frontend page or component code
- No additional npm dependencies
- No changes to `next.config.ts`, `tsconfig.json`, or `eslint.config.mjs`

These will be addressed in subsequent development stages, one layer at a time.
