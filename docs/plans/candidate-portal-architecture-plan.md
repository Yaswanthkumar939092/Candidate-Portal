# Candidate Portal - Full Architecture Plan

## Context

The Candidate Portal is a Next.js 15 application that serves as a job discovery, application, and employee onboarding platform. It integrates Supabase (auth, storage, user data) with Frappe ERPNext (job management, HR workflows, employee records). The codebase has foundational scaffolding (25+ Shadcn/ui components, Supabase auth, Frappe sync service, 20+ API routes) but the existing pages are mostly placeholder/mock implementations that don't match the Figma designs.

**What prompted this**: The Figma designs (15 screens) reveal a desktop-first portal with Physics Wallah branding showing: employee dashboard with onboarding progress, 8-step onboarding wizard (Personal Info through Review), Smart Career Match with AI resume analysis, My Jobs with application timeline, Action Center with tasks/requests. The user needs multi-environment Frappe switching, SSO auth, internal/external job visibility, resume-JD matching, and a complete candidate-to-employee lifecycle where Frappe User+Employee are only created when an admin clicks "Create Employee".

**Intended outcome**: A production-ready portal where candidates sign up via Supabase, apply for jobs, complete onboarding, and get pushed to Frappe as employees - all managed through an admin panel with LOCAL/DEV/UAT/PROD environment switching.

---

## Architecture Overview

```
User Browser
    |
    v
Next.js 15 App (Frontend + API Routes)
    |           |
    v           v
Supabase    Frappe ERPNext (LOCAL/DEV/UAT/PROD)
(Auth,DB,     (Jobs, Employees, HR)
 Storage)
```

**Key principle**: Supabase is the source of truth for auth and user data. Frappe is the source of truth for jobs and HR data. The portal syncs between them.

---

## Phase 0: Environment Configuration (.env.local)

### 0A. Updated `.env.local` (Frappe credentials REQUIRED, not optional)

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://trhuskonqiggrthhjauk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

# Frappe Integration (Required - default/fallback credentials)
FRAPPE_BASE_URL=http://127.0.0.1:8000
FRAPPE_API_KEY=your_api_key_here
FRAPPE_API_SECRET=your_api_secret_here
FRAPPE_USERNAME=Administrator
FRAPPE_PASSWORD=admin

# OAuth Providers
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# SSO (Optional, configure per provider in admin panel)
# SSO_SAML_ENTITY_ID=
# SSO_OIDC_ISSUER=
```

The `.env.local` Frappe credentials serve as the **LOCAL** environment default. When no active environment is set in the DB `frappe_environments` table, the system falls back to these env vars. This means local development works immediately without admin panel setup.

### 0B. Auth Provider Setup Guide

#### Google Authentication Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add Authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (local dev)
   - `https://your-domain.com/auth/callback` (production)
7. Copy the **Client ID** -> `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in `.env.local`
8. Copy the **Client Secret** -> `GOOGLE_CLIENT_SECRET` in `.env.local`
9. In **Supabase Dashboard > Authentication > Providers > Google**:
   - Enable Google provider
   - Paste Client ID and Client Secret
   - Save

#### LinkedIn Authentication Setup
1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
2. Create a new app
3. Under **Auth** tab, add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://your-domain.com/auth/callback`
4. Under **Products**, request access to **Sign In with LinkedIn using OpenID Connect**
5. Copy **Client ID** -> `NEXT_PUBLIC_LINKEDIN_CLIENT_ID` in `.env.local`
6. Copy **Client Secret** -> `LINKEDIN_CLIENT_SECRET` in `.env.local`
7. In **Supabase Dashboard > Authentication > Providers > LinkedIn (OIDC)**:
   - Enable LinkedIn OIDC provider
   - Paste Client ID and Client Secret
   - Save

#### Supabase Auth Configuration (Required for all OAuth)
1. Go to **Supabase Dashboard > Authentication > URL Configuration**
2. Set **Site URL**: `http://localhost:3000` (or your production URL)
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/**`
   - `https://your-domain.com/auth/callback` (when deployed)
4. Go to **Authentication > Email Templates** - customize if needed
5. Go to **Authentication > Rate Limits** - review defaults

#### SSO Setup (Configured via Admin Panel, not .env)
SSO providers are configured in the admin panel UI (stored in `sso_providers` table), not in `.env.local`. The admin panel provides forms for:

**Frappe SSO**:
1. In Frappe, go to **Settings > OAuth Client**
2. Create a new OAuth Client with redirect URI: `http://localhost:3000/api/auth/sso/frappe/callback`
3. Note the Client ID and Client Secret
4. In the Candidate Portal admin panel, add a new SSO provider:
   - Type: Frappe SSO
   - Frappe URL: `http://127.0.0.1:8000` (or your Frappe instance)
   - Client ID and Secret from step 3
   - Email domain restriction (optional): e.g., `yourcompany.com`

**SAML 2.0** (future):
- Entity ID, SSO URL, X.509 Certificate from your Identity Provider (Okta, Azure AD, etc.)
- Configure via admin panel

**OIDC** (future):
- Issuer URL, Client ID, Client Secret from your OIDC provider (Keycloak, Auth0, etc.)
- Configure via admin panel

---

## Phase 1: Foundation (Database + Environment Manager)

### 1A. New Database Tables

**`frappe_environments`** - Multi-env Frappe credentials (replaces single-connection in admin_settings)
```
Migration: supabase/migrations/006_frappe_environments.sql
- id, environment_key (LOCAL|DEV|UAT|PROD), label, frappe_url, api_key, api_secret
- username, password, webhook_secret
- is_active (BOOLEAN, unique partial index ensures only ONE active)
- auto_sync_enabled, sync_interval_hours
- last_connection_test_at, last_connection_status
- created_by -> profiles(id)

Default seed: LOCAL environment pre-created from .env.local FRAPPE_* vars
  - environment_key: 'LOCAL'
  - label: 'Local Development'
  - frappe_url: from FRAPPE_BASE_URL env var (e.g., http://127.0.0.1:8000)
  - is_active: true (default active on first run)
```

**`onboarding_data`** - Multi-step wizard data with partial saves
```
Migration: supabase/migrations/007_onboarding_data.sql
- id, user_id -> profiles(id) UNIQUE
- personal_info JSONB, address JSONB, identity_documents JSONB
- bank_details JSONB, emergency_contacts JSONB
- education JSONB (array), employment_history JSONB (array)
- current_step, completed_steps TEXT[], declaration_accepted
- status (draft|submitted|approved|pushed_to_frappe)
- frappe_employee_id, frappe_user_id, pushed_to_frappe_at
```

**`job_match_results`** - Cached resume-to-JD match scores
```
Migration: supabase/migrations/008_job_matching.sql
- id, user_id, job_id, match_type (keyword|ai)
- match_score NUMERIC(5,2), matched_skills TEXT[], missing_skills TEXT[]
- analysis JSONB, resume_document_id, computed_at, expires_at
- UNIQUE(user_id, job_id, match_type)
```

**`action_center_tasks`** - Assigned tasks
```
Migration: supabase/migrations/009_action_center.sql
- id, user_id, assigned_by, title, description
- task_type (onboarding_task|document_upload|form_fill|custom)
- status (pending|in_progress|completed|overdue), priority, due_date
```

**`action_center_requests`** - User-submitted requests
```
Same migration file
- id, user_id, request_type, subject, description
- status (open|in_review|approved|rejected|closed)
- attachments TEXT[], admin_notes, resolved_by, resolved_at
```

**`sso_providers`** - Extensible SSO configuration
```
Migration: supabase/migrations/010_sso_providers.sql
- id, provider_type (saml|oidc|frappe_sso), name, is_enabled
- config JSONB (provider-specific: entity_id, sso_url, client_id, etc.)
- email_domain_restriction TEXT[], auto_create_profile, default_role
```

**`company_domains`** - For internal employee detection
```
Same migration as sso_providers
- id, domain (UNIQUE), company_name, frappe_company_id, is_active
```

### 1B. Existing Supabase Tables (Current State)

These tables already exist in your Supabase instance:
| Table | Columns | Rows |
|-------|---------|------|
| profiles | 16 | 0 |
| companies | 16 | 6 (seeded) |
| jobs | 13 | 6 (seeded) |
| feature_flag_overrides | 6 | 0 |
| notifications | 8 | 0 |
| saved_jobs | 4 | 0 |
| user_documents | 11 | 0 |

Note: `admin_settings`, `feature_flags`, and `applications` tables also exist from prior migrations. The seeded jobs/companies data provides immediate testing data.

### 1C. Existing Table Modifications

**`jobs`** - Add visibility columns:
```sql
ADD COLUMN visibility VARCHAR(20) DEFAULT 'external' CHECK (IN ('internal','external','both'))
ADD COLUMN visibility_override BOOLEAN DEFAULT false
ADD COLUMN frappe_publish_field BOOLEAN DEFAULT true
```

**`profiles`** - Add lifecycle/employee columns:
```sql
ADD COLUMN lifecycle_stage VARCHAR(30) DEFAULT 'candidate'
  CHECK (IN ('candidate','applicant','offered','onboarding','employee'))
ADD COLUMN frappe_employee_id VARCHAR(100)
ADD COLUMN is_internal_employee BOOLEAN DEFAULT false
ADD COLUMN email_domain VARCHAR(255)
```

**`applications`** - Add offer tracking:
```sql
ADD COLUMN offer_accepted_at TIMESTAMPTZ
ADD COLUMN frappe_job_applicant_id VARCHAR(100)
```

### 1D. FrappeEnvironmentManager (`lib/services/frappe-env.ts` - NEW)

Core service that replaces env-var-based Frappe config with DB-driven multi-environment support.

```
FrappeEnvironmentManager
  - getActiveConfig() -> reads active env from frappe_environments table (cached 5min)
    Fallback: if no row in DB, reads from .env.local FRAPPE_* vars (LOCAL mode)
  - getClient() -> returns FrappeClient instance for active env
  - switchEnvironment(envKey) -> admin action, sets is_active flag (LOCAL|DEV|UAT|PROD)
  - invalidateCache() -> called after env switch
  - testConnection(envId) -> tests connectivity
  - seedLocalEnv() -> on first run, creates LOCAL row from .env.local if table is empty

FrappeClient (extracted from current FrappeSyncService)
  - request<T>(endpoint, options) -> generic authenticated request
  - getJobOpenings(filters), createJobApplicant(data)
  - createUser(data), createEmployee(data)
  - checkEmployeeExists(email), ping()
```

### 1E. Refactor existing `lib/services/sync.ts`

The `FrappeSyncService` currently reads from `process.env`. Refactor to accept a `FrappeClient` from `FrappeEnvironmentManager`:
```typescript
class FrappeSyncService {
  constructor(private envManager: FrappeEnvironmentManager) {}
  async syncJobs(options) {
    const client = await this.envManager.getClient();
    // ... existing logic but using client instead of direct fetch
  }
}
```

### 1F. Update `types/database.ts`

Add TypeScript types for all new tables: `FrappeEnvironment`, `OnboardingData`, `JobMatchResult`, `ActionCenterTask`, `ActionCenterRequest`, `SSOProvider`, `CompanyDomain` + Insert/Update variants.

---

## Phase 2: Frontend Foundation (Layout + Auth)

### 2A. Route Group Restructure

Create `(portal)` route group for authenticated candidate pages with distinct layout:

```
app/
  (public)/layout.tsx          -- Existing Navigation + footer (for landing, public jobs)
  (portal)/layout.tsx          -- NEW: PortalNavigation (Figma top bar), auth guard
    dashboard/page.tsx         -- NEW: Figma Screen 1
    onboarding/
      layout.tsx               -- Onboarding-specific layout (sidebar + progress)
      page.tsx                 -- NEW: 8-step wizard (Figma Screens 2-10)
    open-jobs/page.tsx         -- NEW: Smart Career Match + View All (Figma Screen 11-13)
    my-jobs/page.tsx           -- NEW: Applied + Draft tabs (Figma Screen 14)
    action-center/page.tsx     -- NEW: Tasks + Requests (Figma Screen 15)
  (auth)/                      -- Keep existing login/register
  admin/                       -- Keep existing admin routes
  api/                         -- Extended with new routes
```

### 2B. AuthProvider Context (`lib/contexts/auth-context.tsx` - NEW)

```typescript
interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isOnboardingComplete: boolean;
  refreshProfile: () => Promise<void>;
}
```

Wraps all pages in `app/layout.tsx`. Replaces scattered `auth.getCurrentUser()` calls.

### 2C. Portal Navigation (`components/portal/portal-navigation.tsx` - NEW)

Desktop top bar matching Figma:
- Configurable logo (Physics Wallah / company branding)
- Nav links: Home, Open Jobs, My Jobs (badge count), Action Center
- Right: Language selector (EN), user avatar + name/role dropdown
- "Profile Active" badge

### 2D. New API Routes

```
app/api/admin/frappe-environments/
  route.ts, [id]/route.ts, [id]/activate/route.ts, [id]/test-connection/route.ts

app/api/onboarding/
  route.ts (GET all data), [step]/route.ts (PUT per step), submit/route.ts

app/api/admin/onboarding/
  route.ts (list all), [userId]/route.ts, [userId]/create-employee/route.ts

app/api/jobs/[id]/match/
  route.ts (keyword match), ai/route.ts (AI match)
app/api/matching/bulk/route.ts, results/route.ts

app/api/admin/jobs/[id]/visibility/route.ts

app/api/action-center/
  tasks/route.ts, tasks/[id]/route.ts
  requests/route.ts, requests/[id]/route.ts

app/api/admin/sso-providers/route.ts, [id]/route.ts
app/api/auth/sso/[provider]/route.ts, [provider]/callback/route.ts
app/api/admin/company-domains/route.ts, [id]/route.ts
```

---

## Phase 3: Dashboard (Figma Screen 1)

### Components to Build
```
components/dashboard/welcome-header.tsx        -- "Welcome back, [Name]!" + greeting
components/dashboard/onboarding-snapshot.tsx   -- 100% circle, "Ready to join on [Date]!"
components/dashboard/info-card.tsx             -- Joining Date, Office Location, Role cards
components/dashboard/key-contacts.tsx          -- Contact list
components/dashboard/journey-countdown.tsx     -- "View Your Journey" with countdown
components/shared/circular-progress.tsx        -- SVG circular progress (reused in career match)
```

### Page: `app/(portal)/dashboard/page.tsx`
Client component. Fetches profile, onboarding status, contacts from API on mount.

---

## Phase 4: Onboarding Wizard (Figma Screens 2-10) - LARGEST EFFORT

### 4A. OnboardingContext (`lib/contexts/onboarding-context.tsx` - NEW)

Scoped to `(portal)/onboarding/layout.tsx`:
```typescript
interface OnboardingContextType {
  currentStep: number;
  stepData: Record<string, any>;
  stepValidation: Record<string, boolean>;
  isDirty: boolean;
  setStepData, goToStep, nextStep, prevStep, saveDraft, submitAll
}
```
- Auto-saves to localStorage on change (debounced 500ms)
- Explicit "Save Draft" saves to Supabase via API
- Step in URL searchParams `?step=3` for deep-linking

### 4B. UI Libraries for Onboarding (from uselayouts.com)

Install two components from uselayouts that match the Figma design:

```bash
# Vertical Tabs - for onboarding sidebar navigation (progress + step switching)
npx shadcn@latest add "https://uselayouts.com/r/vertical-tabs.json"

# Multi-Step Form - for animated step transitions with react-hook-form + Zod
npx shadcn@latest add "https://uselayouts.com/r/multi-step-form.json"

# Required dependencies
npm install motion @hugeicons/react @hugeicons/core-free-icons react-use-measure date-fns
```

**Vertical Tabs** provides: progress indicators on active steps, auto-cycling, smooth slide animations, interactive sidebar navigation - maps directly to the Figma left sidebar with 8 steps.

**Multi-Step Form** provides: react-hook-form + Zod validation built-in, step navigation (nextStep/prevStep), spring-based animations between steps, automatic height adjustment. We'll customize it to support partial saves and 8 onboarding steps instead of the default config.

### 4C. Validation Schemas (`lib/validation/onboarding-schemas.ts` - NEW)

One Zod schema per step. Each step is an independent `react-hook-form` instance (leveraging the multi-step-form component's built-in Zod resolver).

### 4D. Components

```
components/onboarding/
  onboarding-layout.tsx              -- Customized vertical-tabs + multi-step-form composition
  onboarding-step-nav.tsx            -- Adapts vertical-tabs for 8 onboarding steps with completed/active/pending states
  steps/personal-info-step.tsx       -- Basic info, demographics, family, uploads
  steps/address-details-step.tsx     -- Current + permanent address, "same as" toggle
  steps/identity-verification-step.tsx -- PAN + Aadhaar with uploads
  steps/bank-details-step.tsx        -- Bank info + cheque upload
  steps/emergency-contact-step.tsx   -- Contact form
  steps/education-step.tsx           -- Repeater form for qualifications
  steps/employment-step.tsx          -- Experience + referral
  steps/review-step.tsx              -- Collapsible summary + declaration
  document-field.tsx                 -- Single-file inline upload (lighter than document-upload.tsx)
  address-form.tsx                   -- Reusable address fieldset
components/shared/
  repeater-field.tsx                 -- Dynamic add/remove rows (education, employment)
  collapsible-section.tsx            -- For review step
  form-section.tsx                   -- Titled section with description
```

### 4E. New Storage Buckets
`identity-documents`, `onboarding-photos`, `address-proofs`, `bank-documents`, `education-documents`

### 4F. File Upload Strategy
- Reuse existing `FileUploadService` from `lib/services/file-upload.ts`
- New `DocumentField` component for inline single-file uploads
- Files upload immediately on selection (not on form submit)
- URL stored in form state, persisted in OnboardingContext

---

## Phase 5: Open Jobs + Smart Career Match (Figma Screens 11-13)

### 5A. MatchingService (`lib/services/matching.ts` - NEW)

```
MatchingService
  - computeKeywordMatch(userId, jobId) -> extract skills from JD + resume, compute overlap %
  - computeAIMatch(userId, jobId) -> call LLM API for semantic analysis (on-demand)
  - computeBulkMatches(userId, jobIds?) -> batch keyword matching
  - getCachedMatch(userId, jobId, type) -> read from job_match_results table
  - extractKeywordsFromJD/Resume, computeOverlapScore (internal helpers)
  - getResumeText(userId) -> download + parse primary resume (pdf-parse for PDFs)
```

### 5B. Components

```
components/jobs/smart-career-match.tsx     -- Upload flow + analysis + results
components/jobs/career-match-progress.tsx   -- Animated 86% circle with step indicators
components/jobs/job-match-card.tsx          -- Job card with match % badge
components/jobs/saved-jobs-drawer.tsx       -- Sheet sliding from right
components/jobs/job-detail-dialog.tsx       -- "Why you're a match" + description + Apply
```

### 5C. Page: `app/(portal)/open-jobs/page.tsx`
Tabs: "Smart Career Match" | "View All"
- Smart Career Match: resume upload -> analysis animation -> matched job cards
- View All: existing search-filters + job-card components

---

## Phase 6: My Jobs (Figma Screen 14)

### Components
```
components/my-jobs/applied-jobs-timeline.tsx    -- Vertical timeline (Applied->Review->Interview->Offer)
components/my-jobs/draft-applications-list.tsx  -- Resume draft applications with progress
components/my-jobs/application-stage-badge.tsx  -- Stage indicator badges
```

### Page: `app/(portal)/my-jobs/page.tsx`
Tabs: "Applied Jobs" | "Draft Applications"

---

## Phase 7: Action Center (Figma Screen 15)

### Components
```
components/action-center/assigned-tasks-list.tsx
components/action-center/my-requests-list.tsx
components/action-center/raise-request-dialog.tsx
components/action-center/task-status-badge.tsx
```

### Page: `app/(portal)/action-center/page.tsx`
Tabs: "Assigned Tasks" | "My Requests" + "Raise a Request" button

---

## Phase 8: Internal vs External Jobs

### InternalEmployeeDetector (`lib/services/employee-detection.ts` - NEW)

Two-tier detection:
1. **Primary**: Email domain matching against `company_domains` table (fast, no external call)
2. **Secondary**: Frappe Employee lookup via API for edge cases (slower, used on login)

On user login/signup, `profiles.is_internal_employee` and `profiles.email_domain` are updated.

### Job Visibility Logic

Modify `GET /api/jobs`:
- Unauthenticated: `WHERE visibility IN ('external', 'both')`
- Authenticated + external: `WHERE visibility IN ('external', 'both')`
- Authenticated + internal: show ALL jobs

Admin override: `PUT /api/admin/jobs/[id]/visibility` sets `visibility` + `visibility_override = true` (future syncs won't overwrite).

---

## Phase 9: Candidate-to-Employee Lifecycle

### Flow
```
1. SIGN UP -> Supabase only (lifecycle_stage = 'candidate')
2. APPLY -> Create Job Applicant in Frappe (lifecycle_stage = 'applicant')
3. OFFER ACCEPTED -> (lifecycle_stage = 'offered')
4. ONBOARDING -> Fill wizard, save to onboarding_data (lifecycle_stage = 'onboarding')
5. CREATE EMPLOYEE (admin triggers) ->
   a) FrappeClient.createUser() -> Frappe User with email, name
   b) FrappeClient.createEmployee() -> Frappe Employee with all onboarding data
   c) profiles.lifecycle_stage = 'employee'
   d) profiles.frappe_employee_id = EMP-XXXX
   e) profiles.is_internal_employee = true
```

### OnboardingService (`lib/services/onboarding.ts` - NEW)
- `getOnboardingData(userId)`, `saveStep(userId, step, data)`
- `submitForReview(userId)`, `approveOnboarding(userId, adminId)`
- `createFrappeEmployee(userId, adminId)` -> maps onboarding JSONB to Frappe API payload, creates User + Employee

---

## Phase 10: SSO (Extensible, Implement Frappe SSO First)

### SSOService (`lib/services/sso.ts` - NEW)

Strategy pattern - each provider implements `SSOProvider` interface:
```typescript
interface SSOProvider {
  generateAuthUrl(state: string): string;
  handleCallback(params: Record<string, string>): Promise<SSOCallbackResult>;
}
```

**Coexistence with Supabase Auth**: SSO authenticates externally, then creates/links Supabase user via `supabaseAdmin.auth.admin.createUser()` + `generateLink()`.

**Phase 10 scope**: Build interface + Frappe SSO concrete implementation. SAML/OIDC providers added later by implementing the interface.

---

## Phase 11: Admin Panel Enhancements

### New Admin Pages
- **Frappe Environments**: `app/admin/frappe-environments/page.tsx` - LOCAL/DEV/UAT/PROD toggle with radio buttons, credentials management per env, test connection button, active environment indicator
- **Company Domains**: `app/admin/company-domains/page.tsx` - Manage email domains for internal detection
- **SSO Providers**: `app/admin/sso-providers/page.tsx` - Configure SSO providers
- **Onboarding Management**: `app/admin/onboarding-management/page.tsx` - View all candidates' onboarding status, approve, trigger "Create Employee"

Existing `app/admin/onboarding/page.tsx` (super admin wizard) is kept as-is.

---

## Critical Files to Modify

| File | Change |
|------|--------|
| `lib/services/sync.ts` | Refactor to use FrappeEnvironmentManager instead of env vars |
| `types/database.ts` | Add all new table types |
| `app/layout.tsx` | Add AuthProvider, restructure for conditional layouts |
| `app/api/jobs/route.ts` | Add visibility filtering |
| `lib/validation/schemas.ts` | Add new endpoint schemas |
| `lib/middleware/auth.ts` | Extend for SSO, internal employee detection |
| `components/navigation.tsx` | Reference pattern for PortalNavigation |
| `components/document-upload.tsx` | Reference pattern for DocumentField |

## New Files to Create

| File | Purpose |
|------|---------|
| `lib/services/frappe-env.ts` | FrappeEnvironmentManager + FrappeClient |
| `lib/services/onboarding.ts` | OnboardingService |
| `lib/services/matching.ts` | MatchingService (keyword + AI) |
| `lib/services/employee-detection.ts` | InternalEmployeeDetector |
| `lib/services/sso.ts` | SSOService with provider interface |
| `lib/contexts/auth-context.tsx` | AuthProvider context |
| `lib/contexts/onboarding-context.tsx` | OnboardingContext (scoped to wizard) |
| `lib/validation/onboarding-schemas.ts` | Zod schemas for 8 onboarding steps |
| `types/onboarding.ts` | Onboarding TypeScript interfaces |
| `types/action-center.ts` | Action center types |
| `types/career-match.ts` | Match result types |
| 6 migration files | New tables + column modifications |
| ~30 new components | See Phases 3-7 above |
| ~15 new API routes | See Phase 2D above |
| 5 new pages | Dashboard, Onboarding, Open Jobs, My Jobs, Action Center |

---

## Testing Setup

### Framework: Vitest + React Testing Library + Playwright (E2E, optional)

**Why Vitest**: Native ESM support, fast HMR, first-class TypeScript, compatible with Next.js 15. Lighter than Jest for a Next.js project.

**Installation (first implementation step)**:
```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom msw
```

**Config file**: `vitest.config.ts` at project root
**Test location**: Co-located with source files as `*.test.ts` / `*.test.tsx`
**Mock strategy**: MSW (Mock Service Worker) for API mocking, manual mocks for Supabase client

---

## Test Cases

### Phase 0: Environment Configuration

#### TC-0.1: `.env.local` validation
```
Test: Environment variables are loaded correctly
Given: `.env.local` has all required Frappe vars (FRAPPE_BASE_URL, FRAPPE_API_KEY, FRAPPE_API_SECRET)
When: The app starts
Then: FrappeEnvironmentManager reads these as LOCAL fallback
Assert: getActiveConfig() returns { frappe_url: 'http://127.0.0.1:8000', ... }
```

#### TC-0.2: Missing Frappe env vars
```
Test: App warns when Frappe credentials missing
Given: `.env.local` has FRAPPE_BASE_URL but no FRAPPE_API_KEY
When: FrappeEnvironmentManager.getActiveConfig() is called with no DB rows
Then: Throws descriptive error "FRAPPE_API_KEY is required in .env.local"
```

---

### Phase 1: Foundation (Database + Environment Manager)

#### TC-1.1: FrappeEnvironmentManager — getActiveConfig (DB hit)
```
Test: Returns active environment from DB
Given: frappe_environments has rows: LOCAL (is_active=false), DEV (is_active=true)
When: getActiveConfig() is called
Then: Returns DEV config (frappe_url, api_key, api_secret)
Assert: Result.environment_key === 'DEV'
```

#### TC-1.2: FrappeEnvironmentManager — getActiveConfig (fallback)
```
Test: Falls back to .env.local when DB is empty
Given: frappe_environments table is empty
When: getActiveConfig() is called
Then: Returns config from process.env FRAPPE_* variables
Assert: Result.environment_key === 'LOCAL'
Assert: Result.frappe_url === process.env.FRAPPE_BASE_URL
```

#### TC-1.3: FrappeEnvironmentManager — getActiveConfig (cache)
```
Test: Caches config for 5 minutes
Given: First call fetches from DB successfully
When: Second call is made within 5 minutes
Then: Returns cached result without DB query
Assert: Supabase .from('frappe_environments') called only once
```

#### TC-1.4: FrappeEnvironmentManager — switchEnvironment
```
Test: Switching environment updates is_active flags
Given: LOCAL is active, DEV exists
When: switchEnvironment('DEV') is called
Then: LOCAL.is_active = false, DEV.is_active = true
Assert: Only one row has is_active = true
Assert: Cache is invalidated
```

#### TC-1.5: FrappeEnvironmentManager — switchEnvironment (invalid key)
```
Test: Rejects invalid environment key
Given: Only LOCAL and DEV exist
When: switchEnvironment('STAGING') is called
Then: Throws "Environment 'STAGING' not found"
```

#### TC-1.6: FrappeEnvironmentManager — testConnection (success)
```
Test: Test connection to Frappe instance
Given: Valid Frappe credentials for LOCAL
When: testConnection(localEnvId) is called
Then: Calls FrappeClient.ping()
Assert: Returns { success: true, response_time_ms: <number> }
Assert: Updates last_connection_test_at and last_connection_status in DB
```

#### TC-1.7: FrappeEnvironmentManager — testConnection (failure)
```
Test: Handles unreachable Frappe instance
Given: Invalid Frappe URL (http://127.0.0.1:9999)
When: testConnection(envId) is called
Then: Returns { success: false, error: 'Connection refused' }
Assert: Updates last_connection_status = 'failed' in DB
```

#### TC-1.8: FrappeEnvironmentManager — seedLocalEnv
```
Test: Seeds LOCAL environment on first run
Given: frappe_environments table is empty, .env.local has FRAPPE_* vars
When: seedLocalEnv() is called
Then: Inserts a LOCAL row with env var values
Assert: Row has environment_key='LOCAL', is_active=true
```

#### TC-1.9: FrappeEnvironmentManager — seedLocalEnv (already seeded)
```
Test: No-op when LOCAL already exists
Given: frappe_environments has a LOCAL row
When: seedLocalEnv() is called
Then: Does nothing, no duplicate created
Assert: Count of LOCAL rows === 1
```

#### TC-1.10: FrappeClient — request (authenticated)
```
Test: Sends authenticated request to Frappe
Given: Valid FrappeClient with api_key and api_secret
When: request('/api/resource/Job Opening', { method: 'GET' }) is called
Then: Request includes Authorization header with token
Assert: Response is parsed JSON
```

#### TC-1.11: FrappeClient — request (auth failure)
```
Test: Handles 401/403 from Frappe
Given: Invalid api_key
When: request('/api/resource/Job Opening') is called
Then: Throws AuthenticationError with descriptive message
```

#### TC-1.12: FrappeClient — getJobOpenings
```
Test: Fetches job openings with filters
Given: Connected FrappeClient
When: getJobOpenings({ status: 'Open' }) is called
Then: Returns array of Job Opening objects
Assert: Each object has name, job_title, company, status
```

#### TC-1.13: FrappeClient — createJobApplicant
```
Test: Creates a Job Applicant in Frappe
Given: Valid applicant data { applicant_name, email_id, job_title }
When: createJobApplicant(data) is called
Then: Returns created Job Applicant with Frappe name (e.g., 'HR-APP-00001')
Assert: Response has name, status === 'Open'
```

#### TC-1.14: FrappeClient — createUser + createEmployee
```
Test: Creates User then Employee in Frappe
Given: Valid user data { email, first_name, last_name }
When: createUser(data) then createEmployee(data) is called sequentially
Then: Both return created documents
Assert: Employee.user_id === User.name
```

#### TC-1.15: FrappeClient — ping
```
Test: Health check on Frappe instance
Given: Valid Frappe URL
When: ping() is called
Then: Returns true if Frappe responds within timeout
```

#### TC-1.16: FrappeSyncService — uses FrappeEnvironmentManager
```
Test: Sync service gets client from environment manager
Given: FrappeSyncService constructed with FrappeEnvironmentManager
When: syncJobs() is called
Then: envManager.getClient() is called to get FrappeClient
Assert: Jobs fetched via client, not via process.env directly
```

#### TC-1.17: Database types — new table types exist
```
Test: TypeScript types for new tables compile
Given: types/database.ts updated with new types
When: TypeScript compilation runs
Then: No type errors
Assert: FrappeEnvironment, OnboardingData, JobMatchResult, ActionCenterTask, ActionCenterRequest, SSOProvider, CompanyDomain all exist with Row/Insert/Update variants
```

---

### Phase 2: Frontend Foundation (Layout + Auth)

#### TC-2.1: AuthProvider — initial load
```
Test: AuthProvider fetches user and profile on mount
Given: User is logged in (valid Supabase session)
When: AuthProvider mounts
Then: Sets user and profile in context
Assert: isLoading transitions from true to false
Assert: user.email is populated
Assert: profile.lifecycle_stage exists
```

#### TC-2.2: AuthProvider — unauthenticated
```
Test: AuthProvider handles no session
Given: No active Supabase session
When: AuthProvider mounts
Then: user = null, profile = null, isLoading = false
```

#### TC-2.3: AuthProvider — refreshProfile
```
Test: refreshProfile re-fetches profile data
Given: AuthProvider mounted with existing profile
When: refreshProfile() is called
Then: Fetches latest profile from Supabase
Assert: Profile data is updated in context
```

#### TC-2.4: Portal layout — auth guard
```
Test: Unauthenticated users redirected to login
Given: User is NOT logged in
When: User navigates to /dashboard
Then: Redirected to /auth/login
```

#### TC-2.5: Portal layout — authenticated access
```
Test: Authenticated users can access portal pages
Given: User IS logged in
When: User navigates to /dashboard
Then: Dashboard page renders (not redirected)
```

#### TC-2.6: PortalNavigation — renders nav links
```
Test: Navigation bar shows correct links
Given: PortalNavigation rendered with authenticated user
When: Component mounts
Then: Shows Home, Open Jobs, My Jobs, Action Center links
Assert: User avatar and name displayed
Assert: "Profile Active" badge visible
```

#### TC-2.7: PortalNavigation — My Jobs badge count
```
Test: My Jobs shows application count badge
Given: User has 3 active applications
When: PortalNavigation renders
Then: My Jobs link shows badge with "3"
```

---

### Phase 3: Dashboard

#### TC-3.1: WelcomeHeader — personalized greeting
```
Test: Shows user's name in greeting
Given: User profile with full_name = "Vanshita Sharma"
When: WelcomeHeader renders
Then: Displays "Welcome back, Vanshita!"
```

#### TC-3.2: OnboardingSnapshot — progress display
```
Test: Shows correct onboarding progress percentage
Given: User has completed 6 of 8 onboarding steps
When: OnboardingSnapshot renders
Then: Circular progress shows 75%
Assert: SVG circle stroke-dashoffset is correct for 75%
```

#### TC-3.3: OnboardingSnapshot — 100% complete
```
Test: Shows completion message when all steps done
Given: User has completed all 8 onboarding steps
When: OnboardingSnapshot renders
Then: Shows "Ready to join on [Date]!" message
Assert: Circular progress shows 100%
```

#### TC-3.4: InfoCard — displays joining info
```
Test: Shows joining date, location, role
Given: Profile with joining_date, office_location, role
When: InfoCard renders for each
Then: Each card shows correct label and value
```

#### TC-3.5: KeyContacts — renders contact list
```
Test: Displays key contacts with actions
Given: Array of contacts (HR Manager, Team Lead, IT Support)
When: KeyContacts renders
Then: Shows each contact with name, role, email/phone action buttons
```

#### TC-3.6: CircularProgress — SVG rendering
```
Test: SVG circular progress renders correctly for various values
Given: value = 0, 25, 50, 75, 100
When: CircularProgress renders with each value
Then: stroke-dasharray and stroke-dashoffset are mathematically correct
Assert: Inner text shows "[value]%"
```

---

### Phase 4: Onboarding Wizard

#### TC-4.1: OnboardingContext — initialization
```
Test: Context initializes with default step data
Given: OnboardingContext provider wraps onboarding page
When: Provider mounts
Then: currentStep = 0 (or from URL ?step=), stepData = {}, isDirty = false
```

#### TC-4.2: OnboardingContext — step navigation
```
Test: nextStep and prevStep update currentStep
Given: currentStep = 2
When: nextStep() called
Then: currentStep = 3
When: prevStep() called
Then: currentStep = 2
```

#### TC-4.3: OnboardingContext — step bounds
```
Test: Cannot navigate past first/last step
Given: currentStep = 0
When: prevStep() called
Then: currentStep remains 0
Given: currentStep = 7 (last step)
When: nextStep() called
Then: currentStep remains 7
```

#### TC-4.4: OnboardingContext — setStepData marks dirty
```
Test: Setting step data marks context as dirty
Given: isDirty = false
When: setStepData('personal_info', { first_name: 'John' }) called
Then: isDirty = true
Assert: stepData.personal_info.first_name === 'John'
```

#### TC-4.5: OnboardingContext — saveDraft API call
```
Test: saveDraft sends current data to API
Given: stepData has personal_info filled
When: saveDraft() called
Then: PUT /api/onboarding/personal-info with step data
Assert: isDirty = false after successful save
```

#### TC-4.6: OnboardingContext — auto-save to localStorage
```
Test: Data auto-saves to localStorage on change (debounced)
Given: stepData changes
When: 500ms debounce timer elapses
Then: localStorage.setItem('onboarding_draft', JSON.stringify(stepData)) called
```

#### TC-4.7: OnboardingContext — restore from localStorage
```
Test: Restores draft from localStorage on mount
Given: localStorage has onboarding_draft data
When: OnboardingContext mounts
Then: stepData populated from localStorage
Assert: currentStep set to last saved step
```

#### TC-4.8: OnboardingContext — URL deep linking
```
Test: Step syncs with URL search params
Given: URL is /onboarding?step=4
When: OnboardingContext mounts
Then: currentStep = 4
When: goToStep(6) called
Then: URL updates to /onboarding?step=6
```

#### TC-4.9: PersonalInfoStep — form validation (Zod)
```
Test: Personal info step validates required fields
Given: Empty form
When: User clicks Next
Then: Validation errors shown for: first_name, last_name, date_of_birth, gender
Assert: Cannot proceed to next step
```

#### TC-4.10: PersonalInfoStep — valid submission
```
Test: Valid personal info allows progression
Given: All required fields filled (first_name, last_name, dob, gender, blood_group)
When: User clicks Next
Then: No validation errors
Assert: nextStep() called, data saved to context
```

#### TC-4.11: PersonalInfoStep — family details repeater
```
Test: Can add and remove family members
Given: PersonalInfoStep rendered
When: User clicks "Add Family Member"
Then: New row appears with name, relationship, dob fields
When: User clicks remove on a row
Then: Row is removed
Assert: Family members array updates correctly
```

#### TC-4.12: AddressDetailsStep — "same as current" toggle
```
Test: Permanent address copies from current when toggled
Given: Current address filled (line1, city, state, pin)
When: User toggles "Same as Current Address"
Then: Permanent address fields auto-fill with current address values
When: User toggles off
Then: Permanent address fields clear
```

#### TC-4.13: AddressDetailsStep — validation
```
Test: Both addresses required
Given: Current address filled, permanent address empty, toggle OFF
When: User clicks Next
Then: Validation errors on permanent address fields
```

#### TC-4.14: IdentityVerificationStep — PAN validation
```
Test: PAN number format validation
Given: User enters "ABCDE1234" (invalid - missing last char)
When: Field loses focus
Then: Error: "Invalid PAN format. Expected: ABCDE1234F"
Given: User enters "ABCDE1234F"
Then: No error
```

#### TC-4.15: IdentityVerificationStep — Aadhaar validation
```
Test: Aadhaar number format validation
Given: User enters "1234 5678" (too short)
When: Field loses focus
Then: Error: "Aadhaar must be 12 digits"
Given: User enters "1234 5678 9012"
Then: No error
```

#### TC-4.16: IdentityVerificationStep — document upload
```
Test: PAN card image upload
Given: IdentityVerificationStep rendered
When: User selects a file for PAN card upload
Then: File uploads immediately to Supabase storage (identity-documents bucket)
Assert: Upload progress shown
Assert: After upload, file URL stored in form state
Assert: Preview/thumbnail shown
```

#### TC-4.17: BankDetailsStep — validation
```
Test: Bank details required fields
Given: Empty bank details form
When: User clicks Next
Then: Errors on: account_holder_name, account_number, ifsc_code, bank_name
```

#### TC-4.18: BankDetailsStep — IFSC format
```
Test: IFSC code format validation
Given: User enters "SBIN123" (invalid)
When: Field validates
Then: Error: "Invalid IFSC format. Expected: SBIN0001234"
Given: User enters "SBIN0001234"
Then: No error
```

#### TC-4.19: EmergencyContactStep — at least one contact
```
Test: At least one emergency contact required
Given: No contacts added
When: User clicks Next
Then: Error: "At least one emergency contact is required"
```

#### TC-4.20: EmergencyContactStep — contact validation
```
Test: Contact fields validated
Given: Contact with name but no phone
When: Form validates
Then: Error on phone field
Assert: phone_number matches 10-digit Indian mobile pattern
```

#### TC-4.21: EducationStep — repeater add/remove
```
Test: Add multiple education entries
Given: EducationStep rendered
When: User clicks "Add Qualification"
Then: New education entry form appears
Assert: Fields: degree, institution, year_of_passing, percentage/cgpa, specialization
When: User adds 3 entries then removes the 2nd
Then: 2 entries remain, correctly indexed
```

#### TC-4.22: EmploymentStep — experience entries
```
Test: Employment history entries
Given: EmploymentStep rendered
When: User clicks "Add Experience"
Then: New entry with: company, designation, from_date, to_date, is_current
When: is_current toggled ON
Then: to_date field disabled/hidden
```

#### TC-4.23: ReviewStep — displays all data
```
Test: Review step shows all filled data
Given: All 7 previous steps completed with data
When: ReviewStep renders
Then: Shows collapsible sections for each step
Assert: Personal info, address, identity, bank, emergency, education, employment all displayed
```

#### TC-4.24: ReviewStep — declaration checkbox
```
Test: Must accept declaration to submit
Given: ReviewStep rendered, all data shown
When: User clicks "Submit" without checking declaration
Then: Error: "You must accept the declaration to submit"
When: User checks declaration then clicks Submit
Then: submitAll() called
```

#### TC-4.25: Onboarding — full wizard flow (integration)
```
Test: Complete 8-step wizard end-to-end
Given: Authenticated user on /onboarding
When: User fills all 8 steps sequentially
Then: Each step validates, saves, progresses to next
When: User clicks Submit on Review step
Then: POST /api/onboarding/submit called
Assert: onboarding_data.status changes from 'draft' to 'submitted'
Assert: Redirected to dashboard with success message
```

#### TC-4.26: Onboarding — draft persistence
```
Test: Partially filled wizard persists on reload
Given: User fills steps 1-3, clicks Save Draft
When: User closes browser and reopens /onboarding
Then: Steps 1-3 data restored
Assert: currentStep = 3 (last completed + 1)
Assert: Steps 1-3 marked as completed in sidebar
```

#### TC-4.27: DocumentField — file type restriction
```
Test: Only allowed file types accepted
Given: DocumentField configured for images (jpg, png, pdf)
When: User selects a .exe file
Then: Error: "File type not allowed. Accepted: jpg, png, pdf"
Assert: File NOT uploaded
```

#### TC-4.28: DocumentField — file size limit
```
Test: File size limit enforced
Given: Max file size = 5MB
When: User selects a 10MB file
Then: Error: "File size exceeds 5MB limit"
Assert: File NOT uploaded
```

---

### Phase 5: Open Jobs + Smart Career Match

#### TC-5.1: SmartCareerMatch — resume upload
```
Test: User can upload resume for matching
Given: SmartCareerMatch tab selected, no resume uploaded
When: User drops/selects a PDF resume
Then: File uploads to Supabase storage (resumes bucket)
Assert: Upload progress shown
Assert: After upload, analysis starts automatically
```

#### TC-5.2: SmartCareerMatch — keyword matching
```
Test: Keyword matching computes overlap scores
Given: User has uploaded resume with skills: [React, TypeScript, Node.js, Python]
And: Job JD mentions: [React, TypeScript, AWS, Docker]
When: computeKeywordMatch(userId, jobId) called
Then: Returns { match_score: 50, matched_skills: [React, TypeScript], missing_skills: [AWS, Docker] }
```

#### TC-5.3: SmartCareerMatch — bulk matching
```
Test: Bulk match against all open jobs
Given: User resume uploaded, 6 jobs in DB
When: computeBulkMatches(userId) called
Then: Returns array of 6 match results
Assert: Each has match_score, matched_skills, missing_skills
Assert: Results sorted by match_score descending
```

#### TC-5.4: SmartCareerMatch — analysis animation
```
Test: Shows animated progress during analysis
Given: Resume uploaded, matching in progress
When: Analysis runs
Then: UI shows steps: "Parsing resume..." -> "Extracting skills..." -> "Matching with jobs..."
Assert: Circular progress animates to final score (e.g., 86%)
```

#### TC-5.5: SmartCareerMatch — cached results
```
Test: Returns cached match if not expired
Given: Match computed 1 hour ago (expires_at = 24 hours from compute)
When: getCachedMatch(userId, jobId, 'keyword') called
Then: Returns cached result without recomputing
```

#### TC-5.6: SmartCareerMatch — expired cache recomputes
```
Test: Recomputes if cache expired
Given: Match computed 25 hours ago (expired)
When: getCachedMatch returns null
Then: computeKeywordMatch runs fresh computation
Assert: New result stored in job_match_results
```

#### TC-5.7: JobMatchCard — displays match percentage
```
Test: Job card shows match score badge
Given: Job with match_score = 85
When: JobMatchCard renders
Then: Shows "85% Match" badge
Assert: Badge color is green for >75%, yellow for 50-75%, red for <50%
```

#### TC-5.8: JobDetailDialog — "Why you're a match"
```
Test: Dialog shows match analysis
Given: Job with match result (matched_skills, missing_skills)
When: User clicks job card to open detail
Then: Dialog shows "Why you're a match" section
Assert: Matched skills shown as green badges
Assert: Missing skills shown as gray/red badges
Assert: Full job description displayed
Assert: "Apply Now" button visible
```

#### TC-5.9: SavedJobsDrawer — save and unsave
```
Test: User can save/unsave jobs
Given: Job card with save icon
When: User clicks save icon
Then: Job added to saved_jobs table
Assert: Icon changes to filled/active state
When: User opens Saved Jobs drawer
Then: Saved job appears in list
When: User clicks unsave
Then: Job removed from saved_jobs
```

#### TC-5.10: OpenJobsPage — View All tab
```
Test: View All tab shows all visible jobs
Given: 6 jobs in DB (4 external, 2 internal), user is external
When: User switches to "View All" tab
Then: Shows 4 external jobs
Assert: Search/filter controls available
Assert: Jobs displayed as cards with company, location, type
```

---

### Phase 6: My Jobs

#### TC-6.1: AppliedJobsTimeline — shows application stages
```
Test: Timeline shows progression for each application
Given: User has 2 applications (one at "Review" stage, one at "Interview")
When: AppliedJobsTimeline renders
Then: Shows 2 job entries with stage timelines
Assert: Stages: Applied -> Review -> Interview -> Offer
Assert: Current stage highlighted, future stages grayed out
```

#### TC-6.2: AppliedJobsTimeline — stage dates
```
Test: Each stage shows date when reached
Given: Application applied_at = Jan 1, moved to review_at = Jan 5
When: Timeline renders
Then: "Applied" shows "Jan 1", "Review" shows "Jan 5"
Assert: Stages after Review show no date (not yet reached)
```

#### TC-6.3: DraftApplicationsList — shows incomplete applications
```
Test: Lists draft/incomplete applications
Given: User has 1 draft application (resume attached, not submitted)
When: DraftApplicationsList renders
Then: Shows draft with job title, company, progress indicator
Assert: "Continue" button links to application form
```

#### TC-6.4: MyJobsPage — tab switching
```
Test: Tabs switch between Applied and Drafts
Given: MyJobsPage rendered
When: User clicks "Draft Applications" tab
Then: DraftApplicationsList shown, AppliedJobsTimeline hidden
When: User clicks "Applied Jobs" tab
Then: AppliedJobsTimeline shown, DraftApplicationsList hidden
```

---

### Phase 7: Action Center

#### TC-7.1: AssignedTasksList — displays tasks
```
Test: Shows assigned tasks with status
Given: User has 3 tasks (1 pending, 1 in_progress, 1 completed)
When: AssignedTasksList renders
Then: Shows 3 task cards with status badges
Assert: Pending = yellow, In Progress = blue, Completed = green
Assert: Overdue tasks show red indicator
```

#### TC-7.2: AssignedTasksList — mark task complete
```
Test: User can mark task as completed
Given: Task with status = 'in_progress'
When: User clicks "Mark Complete"
Then: PUT /api/action-center/tasks/[id] with status = 'completed'
Assert: Task status badge updates to green "Completed"
```

#### TC-7.3: MyRequestsList — displays user requests
```
Test: Shows requests submitted by user
Given: User has 2 requests (1 open, 1 in_review)
When: MyRequestsList renders
Then: Shows 2 request cards
Assert: Each shows subject, status, submitted date
```

#### TC-7.4: RaiseRequestDialog — submit request
```
Test: User can raise a new request
Given: User clicks "Raise a Request"
When: Dialog opens, user fills subject, description, selects type
And: Clicks Submit
Then: POST /api/action-center/requests with form data
Assert: Dialog closes, new request appears in list
Assert: Status = 'open'
```

#### TC-7.5: RaiseRequestDialog — validation
```
Test: Request form validates required fields
Given: Dialog open, form empty
When: User clicks Submit
Then: Errors on: subject (required), request_type (required)
Assert: Description optional but recommended
```

#### TC-7.6: ActionCenterPage — tab counts
```
Test: Tab headers show counts
Given: 5 tasks, 2 requests
When: ActionCenterPage renders
Then: "Assigned Tasks (5)" and "My Requests (2)" shown in tab headers
```

---

### Phase 8: Internal vs External Jobs

#### TC-8.1: InternalEmployeeDetector — email domain match
```
Test: Detects internal employee by email domain
Given: company_domains has { domain: 'physicswallah.com', is_active: true }
When: detectInternal('user@physicswallah.com') called
Then: Returns { is_internal: true, method: 'domain_match' }
```

#### TC-8.2: InternalEmployeeDetector — external user
```
Test: External user not detected as internal
Given: company_domains has { domain: 'physicswallah.com' }
When: detectInternal('user@gmail.com') called
Then: Returns { is_internal: false }
```

#### TC-8.3: InternalEmployeeDetector — Frappe fallback
```
Test: Falls back to Frappe Employee lookup
Given: company_domains has no match for 'user@subsidiary.com'
And: Frappe has Employee with user_id='user@subsidiary.com'
When: detectInternal('user@subsidiary.com') called
Then: Returns { is_internal: true, method: 'frappe_lookup' }
```

#### TC-8.4: Job visibility — unauthenticated
```
Test: Unauthenticated sees only external/both jobs
Given: 3 jobs: internal, external, both
When: GET /api/jobs without auth
Then: Returns 2 jobs (external + both)
Assert: Internal job NOT in results
```

#### TC-8.5: Job visibility — authenticated external user
```
Test: External authenticated user sees external/both
Given: Same 3 jobs, user is external (is_internal_employee = false)
When: GET /api/jobs with auth
Then: Returns 2 jobs (external + both)
```

#### TC-8.6: Job visibility — authenticated internal user
```
Test: Internal user sees ALL jobs
Given: Same 3 jobs, user is internal (is_internal_employee = true)
When: GET /api/jobs with auth
Then: Returns 3 jobs (all)
```

#### TC-8.7: Admin visibility override
```
Test: Admin can override job visibility
Given: Job synced from Frappe as 'external'
When: PUT /api/admin/jobs/[id]/visibility { visibility: 'internal' }
Then: Job.visibility = 'internal', visibility_override = true
When: Next Frappe sync runs
Then: Visibility NOT overwritten (override = true)
```

---

### Phase 9: Candidate-to-Employee Lifecycle

#### TC-9.1: Signup — creates candidate
```
Test: New signup creates Supabase profile with lifecycle_stage='candidate'
Given: New user signs up via email
When: Signup succeeds
Then: profiles row created with lifecycle_stage = 'candidate'
Assert: No Frappe User/Employee created
Assert: is_internal_employee = false (default)
```

#### TC-9.2: Apply — creates Job Applicant in Frappe
```
Test: Applying for job creates Frappe Job Applicant
Given: Candidate applies for a job
When: POST /api/applications with { job_id, resume_url }
Then: Frappe Job Applicant created via API
Assert: profiles.lifecycle_stage updated to 'applicant'
Assert: applications.frappe_job_applicant_id populated
```

#### TC-9.3: Apply — Frappe unavailable
```
Test: Application saved locally when Frappe is down
Given: Frappe instance unreachable
When: User applies for job
Then: Application saved in Supabase with frappe_job_applicant_id = null
Assert: Retry/sync mechanism will push to Frappe later
Assert: User sees success message (not error)
```

#### TC-9.4: Offer accepted — lifecycle update
```
Test: Accepting offer updates lifecycle stage
Given: Application at 'offered' stage
When: Admin marks offer as accepted
Then: profiles.lifecycle_stage = 'offered'
Assert: applications.offer_accepted_at populated
```

#### TC-9.5: Create Employee — full lifecycle
```
Test: Admin creates Frappe User + Employee
Given: Onboarding completed and approved, lifecycle = 'onboarding'
When: Admin clicks "Create Employee" on admin panel
Then: Step 1: FrappeClient.createUser(email, name) succeeds
And: Step 2: FrappeClient.createEmployee(all onboarding data) succeeds
Assert: profiles.lifecycle_stage = 'employee'
Assert: profiles.frappe_employee_id = 'EMP-XXXX'
Assert: profiles.is_internal_employee = true
Assert: onboarding_data.status = 'pushed_to_frappe'
Assert: onboarding_data.frappe_employee_id + frappe_user_id populated
```

#### TC-9.6: Create Employee — Frappe User creation fails
```
Test: Handles failure in User creation gracefully
Given: Valid onboarding data
When: FrappeClient.createUser() throws "User already exists"
Then: Logs error, does NOT proceed to createEmployee
Assert: profiles.lifecycle_stage remains 'onboarding'
Assert: Admin sees descriptive error message
```

#### TC-9.7: Create Employee — partial failure (User created, Employee fails)
```
Test: Handles partial failure in Employee creation
Given: User created successfully in Frappe
When: FrappeClient.createEmployee() fails
Then: onboarding_data.frappe_user_id populated (User exists)
Assert: onboarding_data.frappe_employee_id = null
Assert: Admin can retry "Create Employee" which skips User creation
Assert: Error logged with details
```

#### TC-9.8: OnboardingService — saveStep
```
Test: Saves individual step data
Given: userId and step = 'personal_info'
When: saveStep(userId, 'personal_info', { first_name: 'John', ... })
Then: onboarding_data.personal_info JSONB updated
Assert: current_step updated
Assert: 'personal_info' added to completed_steps array
```

#### TC-9.9: OnboardingService — submitForReview
```
Test: Submit changes status to 'submitted'
Given: All 8 steps completed, declaration accepted
When: submitForReview(userId) called
Then: onboarding_data.status = 'submitted'
Assert: Cannot edit steps after submission (read-only)
```

#### TC-9.10: OnboardingService — approveOnboarding
```
Test: Admin approval changes status
Given: onboarding_data.status = 'submitted'
When: approveOnboarding(userId, adminId) called
Then: onboarding_data.status = 'approved'
Assert: "Create Employee" button becomes available
```

---

### Phase 10: SSO

#### TC-10.1: SSOService — generateAuthUrl (Frappe SSO)
```
Test: Generates correct Frappe OAuth URL
Given: Frappe SSO provider configured with client_id, frappe_url
When: generateAuthUrl(state) called
Then: Returns URL like: http://127.0.0.1:8000/api/method/frappe.integrations.oauth2.authorize?client_id=XXX&redirect_uri=...&state=YYY
```

#### TC-10.2: SSOService — handleCallback (Frappe SSO)
```
Test: Handles OAuth callback and creates/links Supabase user
Given: Valid authorization code from Frappe callback
When: handleCallback({ code: 'XXX' }) called
Then: Exchanges code for access token with Frappe
And: Fetches user info from Frappe
And: Creates or links Supabase user via admin API
Assert: Returns { user, session, isNewUser }
```

#### TC-10.3: SSOService — email domain restriction
```
Test: SSO rejects users from non-allowed domains
Given: SSO provider with email_domain_restriction = ['physicswallah.com']
When: User from 'user@gmail.com' tries SSO
Then: Callback returns error: "Email domain not allowed for this SSO provider"
```

#### TC-10.4: SSOService — auto-create profile
```
Test: New SSO user gets profile auto-created
Given: SSO provider with auto_create_profile = true
When: New user completes SSO flow
Then: Supabase user + profile created
Assert: profile.full_name from SSO user info
Assert: profile.lifecycle_stage = 'candidate'
```

---

### Phase 11: Admin Panel

#### TC-11.1: FrappeEnvironments page — list environments
```
Test: Shows all configured environments
Given: 3 environments: LOCAL (active), DEV, PROD
When: Admin visits /admin/frappe-environments
Then: Shows 3 environment cards
Assert: LOCAL has "Active" indicator
Assert: Each card shows URL, last test result, sync status
```

#### TC-11.2: FrappeEnvironments page — switch environment
```
Test: Admin can switch active environment via radio button
Given: LOCAL is active
When: Admin selects DEV radio button
Then: Confirmation dialog: "Switch active environment to DEV?"
When: Confirmed
Then: PUT /api/admin/frappe-environments/[devId]/activate
Assert: DEV now shows "Active", LOCAL shows inactive
Assert: Subsequent job syncs use DEV credentials
```

#### TC-11.3: FrappeEnvironments page — test connection
```
Test: Admin can test connection for any environment
Given: Environment card with "Test Connection" button
When: Admin clicks button
Then: POST /api/admin/frappe-environments/[id]/test-connection
Assert: Shows success (green check, response time) or failure (red X, error)
Assert: last_connection_test_at updated
```

#### TC-11.4: FrappeEnvironments page — add new environment
```
Test: Admin can add a new environment
Given: Admin clicks "Add Environment"
When: Fills form: key=UAT, label="UAT Server", url=..., api_key=..., api_secret=...
And: Clicks Save
Then: POST /api/admin/frappe-environments with form data
Assert: New UAT card appears in list
```

#### TC-11.5: OnboardingManagement page — list candidates
```
Test: Shows all candidates with onboarding status
Given: 3 candidates (1 draft, 1 submitted, 1 approved)
When: Admin visits /admin/onboarding-management
Then: Shows table with 3 rows
Assert: Columns: Name, Email, Status, Progress, Actions
Assert: "submitted" row has "Approve" button
Assert: "approved" row has "Create Employee" button
```

#### TC-11.6: OnboardingManagement — approve onboarding
```
Test: Admin can approve submitted onboarding
Given: Candidate with status = 'submitted'
When: Admin clicks "Approve"
Then: PUT /api/admin/onboarding/[userId] with status = 'approved'
Assert: Status badge changes to "Approved"
Assert: "Create Employee" button appears
```

#### TC-11.7: OnboardingManagement — create employee
```
Test: Admin triggers Create Employee flow
Given: Candidate with approved onboarding
When: Admin clicks "Create Employee"
Then: POST /api/admin/onboarding/[userId]/create-employee
Assert: Loading spinner during Frappe API calls
Assert: On success: shows Frappe Employee ID, status = 'pushed_to_frappe'
Assert: On failure: shows error, allows retry
```

#### TC-11.8: CompanyDomains page — CRUD
```
Test: Admin can manage company domains
Given: Admin on /admin/company-domains
When: Adds domain 'physicswallah.com'
Then: Domain appears in list
When: Toggles is_active off
Then: Domain no longer used for internal detection
When: Deletes domain
Then: Domain removed from list
```

---

### Cross-Cutting Concerns

#### TC-CC.1: API authentication
```
Test: All /api/admin/* routes require admin auth
Given: Regular candidate user (not admin)
When: Calls any /api/admin/* endpoint
Then: Returns 403 Forbidden
```

#### TC-CC.2: API authentication — portal routes
```
Test: All /api/onboarding/* routes require auth
Given: Unauthenticated request
When: Calls GET /api/onboarding
Then: Returns 401 Unauthorized
```

#### TC-CC.3: RLS — user isolation
```
Test: Users can only see their own data
Given: User A and User B both have onboarding data
When: User A calls GET /api/onboarding
Then: Only User A's data returned
Assert: User B's data NOT accessible
```

#### TC-CC.4: Dark mode
```
Test: All components render correctly in dark mode
Given: System/user preference set to dark mode
When: Any portal page renders
Then: CSS variables switch to dark palette
Assert: Text readable, contrast sufficient, no hard-coded colors
```

#### TC-CC.5: Responsive layout
```
Test: Portal pages render on mobile viewport
Given: Viewport width = 375px (mobile)
When: Dashboard page renders
Then: Layout stacks vertically, no horizontal overflow
Assert: Navigation collapses to hamburger/bottom nav
Assert: Cards stack single-column
```

#### TC-CC.6: Error boundaries
```
Test: Component errors don't crash entire app
Given: A component throws during render
When: Error boundary catches it
Then: Fallback UI shown ("Something went wrong")
Assert: Rest of the app continues functioning
Assert: Error logged
```

---

## Implementation-First Step: Save Plan + Test Cases

**On exiting plan mode, the first action will be:**
1. Save this entire plan (including test cases) to `docs/plans/candidate-portal-architecture-plan.md`
2. Set up Vitest + React Testing Library
3. Create initial test scaffolding for Phase 1 services

---

## Verification (Manual)

### End-to-End Flow Testing
1. **Auth**: Sign up via email -> verify Supabase profile created, lifecycle_stage = 'candidate'
2. **Env Switch**: Admin adds DEV + PROD Frappe configs -> toggles between them -> verify jobs sync from correct instance
3. **Job Visibility**: Create internal + external jobs -> verify internal user sees both, external sees only external
4. **Onboarding Wizard**: Fill all 8 steps -> save draft -> reload -> verify data persists -> submit -> verify status changes
5. **Smart Career Match**: Upload resume -> verify keyword matching returns scores -> trigger AI match -> verify detailed analysis
6. **Create Employee**: Admin approves onboarding -> clicks Create Employee -> verify Frappe User + Employee created via API
7. **Action Center**: Verify tasks appear -> mark complete -> raise request -> verify status tracking

### Manual Testing
- Run `npm run dev` and navigate through all new pages
- Test responsive behavior (desktop-first, then mobile)
- Test dark mode (CSS variables handle automatically)
- Test auth guards (unauthenticated users redirected to login)

### Frappe API Testing
- Use `FrappeEnvironmentManager.testConnection()` before any sync
- Verify Job Applicant creation, User creation, Employee creation via Frappe API
- Test webhook reception from Frappe (with correct webhook_secret per environment)
