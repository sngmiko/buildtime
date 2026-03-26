# Phase 1: Auth, Firmenverwaltung & Basis-UI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the authentication foundation, multi-tenancy layer, and adaptive UI shell for BuildTime — enabling company registration, employee invitations, and role-based navigation.

**Architecture:** Supabase Auth with RLS-based multi-tenancy. Three fixed roles (owner/foreman/worker) stored in a `profiles` table. Next.js 16 App Router with `proxy.ts` for optimistic session checks, Server Components by default, Server Actions for mutations. Adaptive UI: workers get a mobile-optimized bottom nav, managers get a sidebar.

**Tech Stack:** Next.js 16.2.1, TypeScript, Tailwind CSS 4, Supabase (Auth + Postgres + RLS), Zod, Vitest, `@supabase/ssr`

**Spec:** `docs/superpowers/specs/2026-03-26-phase1-auth-firmenverwaltung-design.md`

**Next.js 16 critical differences:**
- `proxy.ts` replaces `middleware.ts`
- `params` and `searchParams` are Promises (must be awaited)
- `cookies()` and `headers()` must be awaited
- App uses `@supabase/ssr` (not `@supabase/auth-helpers-nextjs`)

---

## File Structure

```
buildtime/
├── proxy.ts                              # Route protection (Next.js 16 proxy)
├── app/
│   ├── layout.tsx                        # Root layout (fonts, metadata, providers)
│   ├── globals.css                       # Tailwind imports + custom properties
│   ├── not-found.tsx                     # 404 page
│   ├── (public)/
│   │   ├── layout.tsx                    # Minimal layout for public pages
│   │   ├── login/page.tsx                # Login page (Server Component)
│   │   ├── registrieren/page.tsx         # Registration page (Server Component)
│   │   ├── einladung/[token]/page.tsx    # Invitation acceptance page
│   │   └── auth/callback/route.ts       # OAuth callback handler
│   └── (app)/
│       ├── layout.tsx                    # App shell with role-based nav
│       ├── dashboard/page.tsx            # Owner/Foreman landing
│       ├── stempeln/page.tsx             # Worker landing (placeholder)
│       ├── mitarbeiter/
│       │   ├── page.tsx                  # Employee list
│       │   └── einladen/page.tsx         # Invite form + link generation
│       ├── firma/page.tsx                # Company settings (owner only)
│       └── profil/page.tsx               # Own profile editing
├── components/
│   ├── ui/
│   │   ├── button.tsx                    # Button component
│   │   ├── input.tsx                     # Input + label component
│   │   ├── card.tsx                      # Card container
│   │   └── select.tsx                    # Select dropdown
│   ├── auth/
│   │   ├── login-form.tsx                # 'use client' — login form
│   │   ├── register-form.tsx             # 'use client' — registration form
│   │   └── accept-invite-form.tsx        # 'use client' — invite acceptance
│   └── layout/
│       ├── worker-bottom-nav.tsx          # 'use client' — bottom nav for workers
│       ├── manager-sidebar.tsx            # 'use client' — sidebar for managers
│       └── top-bar.tsx                    # Top bar with user menu
├── lib/
│   ├── supabase/
│   │   ├── server.ts                     # createServerClient()
│   │   ├── client.ts                     # createBrowserClient()
│   │   └── admin.ts                      # createServiceClient()
│   ├── validations/
│   │   ├── auth.ts                       # Login, register, invite Zod schemas
│   │   └── company.ts                    # Company settings Zod schema
│   └── types.ts                          # Shared TypeScript types
├── actions/
│   ├── auth.ts                           # register, login, acceptInvite actions
│   ├── invitations.ts                    # createInvitation action
│   ├── company.ts                        # updateCompany action
│   └── profile.ts                        # updateProfile action
├── supabase/
│   └── migrations/
│       └── 00001_initial_schema.sql      # Tables, RLS, triggers, functions
├── tests/
│   ├── lib/
│   │   └── validations/
│   │       ├── auth.test.ts              # Auth validation tests
│   │       └── company.test.ts           # Company validation tests
│   └── setup.ts                          # Vitest setup
├── .env.local.example                    # Environment variable template
└── vitest.config.ts                      # Vitest configuration
```

---

## Task 1: Project Setup — Dependencies & Configuration

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`
- Create: `.env.local.example`

- [ ] **Step 1: Install dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr zod
npm install -D vitest @vitejs/plugin-react
```

- [ ] **Step 2: Create environment variable template**

Create `.env.local.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

- [ ] **Step 3: Create Vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

Create `tests/setup.ts`:

```typescript
// Vitest setup — extend as needed
```

- [ ] **Step 4: Add test script to package.json**

Add to the `"scripts"` section in `package.json`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Verify setup**

Run: `npx vitest run`
Expected: 0 tests found, no errors

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts tests/setup.ts .env.local.example
git commit -m "chore: add Supabase, Zod, Vitest dependencies and config"
```

---

## Task 2: Supabase Database Migration

**Files:**
- Create: `supabase/migrations/00001_initial_schema.sql`

- [ ] **Step 1: Create migration file**

Create `supabase/migrations/00001_initial_schema.sql`:

```sql
-- BuildTime Phase 1: Auth, Firmenverwaltung & Basis-UI
-- Tables, RLS policies, helper functions, and triggers

-- =============================================================================
-- ENUMS
-- =============================================================================
CREATE TYPE user_role AS ENUM ('owner', 'foreman', 'worker');

-- =============================================================================
-- TABLES
-- =============================================================================
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  tax_id TEXT,
  trade_license TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id),
  role user_role NOT NULL DEFAULT 'worker',
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  invited_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  role user_role NOT NULL DEFAULT 'worker',
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  email TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '7 days',
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX idx_profiles_company ON profiles(company_id);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_company ON invitations(company_id);

-- =============================================================================
-- UPDATED_AT TRIGGER
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- RLS HELPER FUNCTIONS
-- =============================================================================
CREATE OR REPLACE FUNCTION auth.company_id() RETURNS UUID AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth.user_role() RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- COMPANIES
CREATE POLICY "select_own_company" ON companies
  FOR SELECT USING (id = auth.company_id());

CREATE POLICY "owner_update_company" ON companies
  FOR UPDATE USING (id = auth.company_id() AND auth.user_role() = 'owner');

-- PROFILES
CREATE POLICY "select_company_profiles" ON profiles
  FOR SELECT USING (company_id = auth.company_id());

CREATE POLICY "manage_company_profiles" ON profiles
  FOR ALL USING (
    company_id = auth.company_id()
    AND auth.user_role() IN ('owner', 'foreman')
  );

-- Workers can update their own profile (name, phone)
CREATE POLICY "update_own_profile" ON profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- INVITATIONS
CREATE POLICY "select_company_invitations" ON invitations
  FOR SELECT USING (company_id = auth.company_id());

CREATE POLICY "insert_company_invitations" ON invitations
  FOR INSERT WITH CHECK (
    company_id = auth.company_id()
    AND auth.user_role() IN ('owner', 'foreman')
  );

-- =============================================================================
-- AUTH TRIGGER: on_auth_user_created
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  meta JSONB;
  flow TEXT;
  new_company_id UUID;
BEGIN
  meta := NEW.raw_user_meta_data;
  flow := meta->>'flow';

  IF flow = 'register' THEN
    -- Create company and owner profile atomically
    INSERT INTO public.companies (name)
    VALUES (meta->>'company_name')
    RETURNING id INTO new_company_id;

    INSERT INTO public.profiles (id, company_id, role, first_name, last_name)
    VALUES (
      NEW.id,
      new_company_id,
      'owner',
      meta->>'first_name',
      meta->>'last_name'
    );

  ELSIF flow = 'invite' THEN
    -- Create profile from invitation metadata
    INSERT INTO public.profiles (id, company_id, role, first_name, last_name, invited_by)
    VALUES (
      NEW.id,
      (meta->>'company_id')::UUID,
      (meta->>'role')::user_role,
      meta->>'first_name',
      meta->>'last_name',
      (meta->>'invited_by')::UUID
    );
  END IF;

  -- For SSO without flow metadata: no automatic profile creation.
  -- The app redirects to registration if no profile is found.

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/00001_initial_schema.sql
git commit -m "feat: add database schema, RLS policies, and auth trigger"
```

> **Note for engineer:** Run this migration against your Supabase project via the Supabase Dashboard SQL editor or `supabase db push` if using the Supabase CLI.

---

## Task 3: Shared Types & Supabase Clients

**Files:**
- Create: `lib/types.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/admin.ts`

- [ ] **Step 1: Create shared types**

Create `lib/types.ts`:

```typescript
export type UserRole = 'owner' | 'foreman' | 'worker'

export type Profile = {
  id: string
  company_id: string
  role: UserRole
  first_name: string
  last_name: string
  phone: string | null
  invited_by: string | null
  created_at: string
  updated_at: string
}

export type Company = {
  id: string
  name: string
  address: string | null
  tax_id: string | null
  trade_license: string | null
  created_at: string
  updated_at: string
}

export type Invitation = {
  id: string
  company_id: string
  role: UserRole
  token: string
  email: string | null
  created_by: string
  expires_at: string
  accepted_at: string | null
  created_at: string
}
```

- [ ] **Step 2: Create server Supabase client**

Create `lib/supabase/server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll is called from Server Components where cookies
            // cannot be set. This is safe to ignore when reading session
            // in Server Components.
          }
        },
      },
    }
  )
}
```

- [ ] **Step 3: Create browser Supabase client**

Create `lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 4: Create admin Supabase client**

Create `lib/supabase/admin.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add lib/types.ts lib/supabase/server.ts lib/supabase/client.ts lib/supabase/admin.ts
git commit -m "feat: add shared types and Supabase client utilities"
```

---

## Task 4: Zod Validation Schemas

**Files:**
- Create: `lib/validations/auth.ts`
- Create: `lib/validations/company.ts`
- Create: `tests/lib/validations/auth.test.ts`
- Create: `tests/lib/validations/company.test.ts`

- [ ] **Step 1: Write failing tests for auth validations**

Create `tests/lib/validations/auth.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { registerSchema, loginSchema, acceptInviteSchema, createInviteSchema } from '@/lib/validations/auth'

describe('registerSchema', () => {
  it('accepts valid registration data', () => {
    const result = registerSchema.safeParse({
      company_name: 'Bau GmbH',
      first_name: 'Max',
      last_name: 'Mustermann',
      email: 'max@bau-gmbh.de',
      password: 'sicheres-passwort-123',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty company name', () => {
    const result = registerSchema.safeParse({
      company_name: '',
      first_name: 'Max',
      last_name: 'Mustermann',
      email: 'max@bau-gmbh.de',
      password: 'sicheres-passwort-123',
    })
    expect(result.success).toBe(false)
  })

  it('rejects short password', () => {
    const result = registerSchema.safeParse({
      company_name: 'Bau GmbH',
      first_name: 'Max',
      last_name: 'Mustermann',
      email: 'max@bau-gmbh.de',
      password: '12345',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({
      company_name: 'Bau GmbH',
      first_name: 'Max',
      last_name: 'Mustermann',
      email: 'not-an-email',
      password: 'sicheres-passwort-123',
    })
    expect(result.success).toBe(false)
  })
})

describe('loginSchema', () => {
  it('accepts valid login data', () => {
    const result = loginSchema.safeParse({
      email: 'max@bau-gmbh.de',
      password: 'sicheres-passwort-123',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({
      email: 'max@bau-gmbh.de',
      password: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('acceptInviteSchema', () => {
  it('accepts valid invite acceptance', () => {
    const result = acceptInviteSchema.safeParse({
      email: 'arbeiter@email.de',
      password: 'mein-passwort-123',
    })
    expect(result.success).toBe(true)
  })
})

describe('createInviteSchema', () => {
  it('accepts valid invite with email', () => {
    const result = createInviteSchema.safeParse({
      first_name: 'Hans',
      last_name: 'Arbeiter',
      role: 'worker',
      email: 'hans@email.de',
    })
    expect(result.success).toBe(true)
  })

  it('accepts valid invite without email', () => {
    const result = createInviteSchema.safeParse({
      first_name: 'Hans',
      last_name: 'Arbeiter',
      role: 'worker',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid role', () => {
    const result = createInviteSchema.safeParse({
      first_name: 'Hans',
      last_name: 'Arbeiter',
      role: 'admin',
    })
    expect(result.success).toBe(false)
  })

  it('rejects owner role in invitations', () => {
    const result = createInviteSchema.safeParse({
      first_name: 'Hans',
      last_name: 'Arbeiter',
      role: 'owner',
    })
    expect(result.success).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/lib/validations/auth.test.ts`
Expected: FAIL — cannot resolve `@/lib/validations/auth`

- [ ] **Step 3: Implement auth validation schemas**

Create `lib/validations/auth.ts`:

```typescript
import { z } from 'zod'

export const registerSchema = z.object({
  company_name: z.string().min(1, 'Firmenname ist erforderlich').max(200),
  first_name: z.string().min(1, 'Vorname ist erforderlich').max(100),
  last_name: z.string().min(1, 'Nachname ist erforderlich').max(100),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
})

export const loginSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(1, 'Passwort ist erforderlich'),
})

export const acceptInviteSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
})

export const createInviteSchema = z.object({
  first_name: z.string().min(1, 'Vorname ist erforderlich').max(100),
  last_name: z.string().min(1, 'Nachname ist erforderlich').max(100),
  role: z.enum(['foreman', 'worker'], {
    errorMap: () => ({ message: 'Rolle muss Bauleiter oder Arbeiter sein' }),
  }),
  email: z.string().email('Ungültige E-Mail-Adresse').optional().or(z.literal('')),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>
export type CreateInviteInput = z.infer<typeof createInviteSchema>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/lib/validations/auth.test.ts`
Expected: All 9 tests PASS

- [ ] **Step 5: Write failing tests for company validations**

Create `tests/lib/validations/company.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { companySchema, profileSchema } from '@/lib/validations/company'

describe('companySchema', () => {
  it('accepts valid company data', () => {
    const result = companySchema.safeParse({
      name: 'Bau GmbH',
      address: 'Hauptstraße 1, 10115 Berlin',
      tax_id: 'DE123456789',
      trade_license: 'HWK-12345',
    })
    expect(result.success).toBe(true)
  })

  it('accepts company with only name', () => {
    const result = companySchema.safeParse({
      name: 'Bau GmbH',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = companySchema.safeParse({
      name: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('profileSchema', () => {
  it('accepts valid profile data', () => {
    const result = profileSchema.safeParse({
      first_name: 'Max',
      last_name: 'Mustermann',
      phone: '+49 170 1234567',
    })
    expect(result.success).toBe(true)
  })

  it('accepts profile without phone', () => {
    const result = profileSchema.safeParse({
      first_name: 'Max',
      last_name: 'Mustermann',
    })
    expect(result.success).toBe(true)
  })
})
```

- [ ] **Step 6: Run tests to verify they fail**

Run: `npx vitest run tests/lib/validations/company.test.ts`
Expected: FAIL — cannot resolve `@/lib/validations/company`

- [ ] **Step 7: Implement company validation schemas**

Create `lib/validations/company.ts`:

```typescript
import { z } from 'zod'

export const companySchema = z.object({
  name: z.string().min(1, 'Firmenname ist erforderlich').max(200),
  address: z.string().max(500).optional().or(z.literal('')),
  tax_id: z.string().max(50).optional().or(z.literal('')),
  trade_license: z.string().max(50).optional().or(z.literal('')),
})

export const profileSchema = z.object({
  first_name: z.string().min(1, 'Vorname ist erforderlich').max(100),
  last_name: z.string().min(1, 'Nachname ist erforderlich').max(100),
  phone: z.string().max(30).optional().or(z.literal('')),
})

export type CompanyInput = z.infer<typeof companySchema>
export type ProfileInput = z.infer<typeof profileSchema>
```

- [ ] **Step 8: Run all validation tests**

Run: `npx vitest run tests/lib/validations/`
Expected: All 14 tests PASS

- [ ] **Step 9: Commit**

```bash
git add lib/validations/ tests/lib/validations/
git commit -m "feat: add Zod validation schemas with tests for auth and company"
```

---

## Task 5: Root Layout & Global Styles

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Create: `app/not-found.tsx`

- [ ] **Step 1: Update root layout**

Replace contents of `app/layout.tsx`:

```typescript
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'BuildTime',
  description: 'ERP-Light für Bauunternehmer',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Update globals.css**

Replace contents of `app/globals.css`:

```css
@import 'tailwindcss';

@theme {
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

- [ ] **Step 3: Create 404 page**

Create `app/not-found.tsx`:

```typescript
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-zinc-600 dark:text-zinc-400">Seite nicht gefunden</p>
      <Link
        href="/"
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Zur Startseite
      </Link>
    </div>
  )
}
```

- [ ] **Step 4: Delete default boilerplate page**

Delete `app/page.tsx` — it will be replaced by the login redirect in the proxy.

- [ ] **Step 5: Verify dev server starts**

Run: `npm run dev`
Expected: Server starts, visiting `http://localhost:3000` shows the app (404 page since no root page exists)

- [ ] **Step 6: Commit**

```bash
git add app/layout.tsx app/globals.css app/not-found.tsx
git rm app/page.tsx
git commit -m "feat: update root layout for BuildTime, add 404 page, remove boilerplate"
```

---

## Task 6: UI Components

**Files:**
- Create: `components/ui/button.tsx`
- Create: `components/ui/input.tsx`
- Create: `components/ui/card.tsx`
- Create: `components/ui/select.tsx`

- [ ] **Step 1: Create Button component**

Create `components/ui/button.tsx`:

```typescript
import { type ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const variants = {
  primary:
    'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200',
  secondary:
    'border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800',
  ghost:
    'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100',
}

const sizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    />
  )
}
```

- [ ] **Step 2: Create Input component**

Create `components/ui/input.tsx`:

```typescript
import { type InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

export function Input({ label, error, id, className = '', ...props }: InputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      <input
        id={inputId}
        className={`h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 3: Create Card component**

Create `components/ui/card.tsx`:

```typescript
import { type HTMLAttributes } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement>

export function Card({ className = '', ...props }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 ${className}`}
      {...props}
    />
  )
}
```

- [ ] **Step 4: Create Select component**

Create `components/ui/select.tsx`:

```typescript
import { type SelectHTMLAttributes } from 'react'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  error?: string
  options: { value: string; label: string }[]
}

export function Select({ label, error, id, options, className = '', ...props }: SelectProps) {
  const selectId = id || label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      <select
        id={selectId}
        className={`h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add components/ui/
git commit -m "feat: add base UI components (Button, Input, Card, Select)"
```

---

## Task 7: Proxy (Route Protection)

**Files:**
- Create: `proxy.ts`

- [ ] **Step 1: Create proxy**

Create `proxy.ts` in the project root:

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PUBLIC_ROUTES = ['/login', '/registrieren', '/einladung', '/auth/callback']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next()
  }

  // Check for Supabase session cookie
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Refresh session cookies in response
  const response = NextResponse.next()
  const allCookies = request.cookies.getAll()
  allCookies.forEach((cookie) => {
    response.cookies.set(cookie.name, cookie.value)
  })

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)'],
}
```

- [ ] **Step 2: Commit**

```bash
git add proxy.ts
git commit -m "feat: add proxy for route protection with Supabase session check"
```

---

## Task 8: Auth Callback Route

**Files:**
- Create: `app/(public)/auth/callback/route.ts`

- [ ] **Step 1: Create OAuth callback route handler**

Create `app/(public)/auth/callback/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/login', origin))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(new URL('/login', origin))
  }

  // Check if user has a profile
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login', origin))
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    // SSO user without profile — redirect to registration with prefilled email
    const email = encodeURIComponent(user.email || '')
    return NextResponse.redirect(new URL(`/registrieren?email=${email}`, origin))
  }

  // Redirect based on role
  const destination = profile.role === 'worker' ? '/stempeln' : '/dashboard'
  return NextResponse.redirect(new URL(destination, origin))
}
```

- [ ] **Step 2: Commit**

```bash
git add app/(public)/auth/callback/route.ts
git commit -m "feat: add OAuth callback route with role-based redirect"
```

---

## Task 9: Server Actions — Auth

**Files:**
- Create: `actions/auth.ts`

- [ ] **Step 1: Create auth server actions**

Create `actions/auth.ts`:

```typescript
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { registerSchema, loginSchema, acceptInviteSchema } from '@/lib/validations/auth'

export type AuthState = {
  errors?: Record<string, string[]>
  message?: string
} | null

export async function register(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const raw = {
    company_name: formData.get('company_name'),
    first_name: formData.get('first_name'),
    last_name: formData.get('last_name'),
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const validated = registerSchema.safeParse(raw)
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { company_name, first_name, last_name, email, password } = validated.data

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        flow: 'register',
        company_name,
        first_name,
        last_name,
      },
    },
  })

  if (error) {
    return { message: error.message }
  }

  redirect('/dashboard')
}

export async function login(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const validated = loginSchema.safeParse(raw)
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { email, password } = validated.data

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { message: 'E-Mail oder Passwort ist falsch' }
  }

  // Get role for redirect
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { message: 'Anmeldung fehlgeschlagen' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const destination = profile?.role === 'worker' ? '/stempeln' : '/dashboard'
  redirect(destination)
}

export async function acceptInvite(
  token: string,
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const validated = acceptInviteSchema.safeParse(raw)
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { email, password } = validated.data

  // Use admin client to read invitation (unauthenticated user)
  const admin = createAdminClient()
  const { data: invitation, error: invError } = await admin
    .from('invitations')
    .select('*')
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (invError || !invitation) {
    return { message: 'Einladung ist ungültig oder abgelaufen' }
  }

  // Get invited person's name from invitation metadata
  // The name was stored when the invitation was created
  const { data: invitedBy } = await admin
    .from('profiles')
    .select('id')
    .eq('id', invitation.created_by)
    .single()

  const supabase = await createClient()
  const { error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        flow: 'invite',
        company_id: invitation.company_id,
        role: invitation.role,
        first_name: formData.get('first_name') || '',
        last_name: formData.get('last_name') || '',
        invited_by: invitedBy?.id || invitation.created_by,
      },
    },
  })

  if (signUpError) {
    return { message: signUpError.message }
  }

  // Mark invitation as accepted
  await admin
    .from('invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invitation.id)

  const destination = invitation.role === 'worker' ? '/stempeln' : '/dashboard'
  redirect(destination)
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

- [ ] **Step 2: Commit**

```bash
git add actions/auth.ts
git commit -m "feat: add auth server actions (register, login, acceptInvite, logout)"
```

---

## Task 10: Server Actions — Invitations, Company, Profile

**Files:**
- Create: `actions/invitations.ts`
- Create: `actions/company.ts`
- Create: `actions/profile.ts`

- [ ] **Step 1: Create invitation server action**

Create `actions/invitations.ts`:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { createInviteSchema } from '@/lib/validations/auth'

export type InviteState = {
  errors?: Record<string, string[]>
  message?: string
  inviteLink?: string
} | null

export async function createInvitation(
  prevState: InviteState,
  formData: FormData
): Promise<InviteState> {
  const raw = {
    first_name: formData.get('first_name'),
    last_name: formData.get('last_name'),
    role: formData.get('role'),
    email: formData.get('email') || undefined,
  }

  const validated = createInviteSchema.safeParse(raw)
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { message: 'Nicht angemeldet' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || !['owner', 'foreman'].includes(profile.role)) {
    return { message: 'Keine Berechtigung' }
  }

  const { data: invitation, error } = await supabase
    .from('invitations')
    .insert({
      company_id: profile.company_id,
      role: validated.data.role,
      email: validated.data.email || null,
      created_by: user.id,
    })
    .select('token')
    .single()

  if (error) {
    return { message: 'Einladung konnte nicht erstellt werden' }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const inviteLink = `${baseUrl}/einladung/${invitation.token}?fn=${encodeURIComponent(validated.data.first_name)}&ln=${encodeURIComponent(validated.data.last_name)}`

  return { inviteLink }
}
```

- [ ] **Step 2: Create company server action**

Create `actions/company.ts`:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { companySchema } from '@/lib/validations/company'

export type CompanyState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
} | null

export async function updateCompany(
  prevState: CompanyState,
  formData: FormData
): Promise<CompanyState> {
  const raw = {
    name: formData.get('name'),
    address: formData.get('address') || undefined,
    tax_id: formData.get('tax_id') || undefined,
    trade_license: formData.get('trade_license') || undefined,
  }

  const validated = companySchema.safeParse(raw)
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { message: 'Nicht angemeldet' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'owner') {
    return { message: 'Nur der Firmeninhaber kann die Firma bearbeiten' }
  }

  const { error } = await supabase
    .from('companies')
    .update(validated.data)
    .eq('id', profile.company_id)

  if (error) {
    return { message: 'Firma konnte nicht aktualisiert werden' }
  }

  return { success: true, message: 'Firma erfolgreich aktualisiert' }
}
```

- [ ] **Step 3: Create profile server action**

Create `actions/profile.ts`:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { profileSchema } from '@/lib/validations/company'

export type ProfileState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
} | null

export async function updateProfile(
  prevState: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const raw = {
    first_name: formData.get('first_name'),
    last_name: formData.get('last_name'),
    phone: formData.get('phone') || undefined,
  }

  const validated = profileSchema.safeParse(raw)
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { message: 'Nicht angemeldet' }
  }

  const { error } = await supabase
    .from('profiles')
    .update(validated.data)
    .eq('id', user.id)

  if (error) {
    return { message: 'Profil konnte nicht aktualisiert werden' }
  }

  return { success: true, message: 'Profil erfolgreich aktualisiert' }
}
```

- [ ] **Step 4: Commit**

```bash
git add actions/invitations.ts actions/company.ts actions/profile.ts
git commit -m "feat: add server actions for invitations, company, and profile"
```

---

## Task 11: Public Pages — Login

**Files:**
- Create: `app/(public)/layout.tsx`
- Create: `app/(public)/login/page.tsx`
- Create: `components/auth/login-form.tsx`

- [ ] **Step 1: Create public layout**

Create `app/(public)/layout.tsx`:

```typescript
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
```

- [ ] **Step 2: Create login form component**

Create `components/auth/login-form.tsx`:

```typescript
'use client'

import { useActionState } from 'react'
import { login, type AuthState } from '@/actions/auth'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function LoginForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(login, null)

  function handleMicrosoftLogin() {
    const supabase = createClient()
    supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="flex flex-col gap-4">
        <Input
          label="E-Mail"
          name="email"
          type="email"
          placeholder="max@firma.de"
          required
          error={state?.errors?.email?.[0]}
        />
        <Input
          label="Passwort"
          name="password"
          type="password"
          required
          error={state?.errors?.password?.[0]}
        />
        {state?.message && (
          <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>
        )}
        <Button type="submit" disabled={pending} size="lg" className="w-full">
          {pending ? 'Anmelden...' : 'Anmelden'}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-300 dark:border-zinc-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
            oder
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="w-full"
        onClick={handleMicrosoftLogin}
      >
        Mit Microsoft anmelden
      </Button>
    </div>
  )
}
```

- [ ] **Step 3: Create login page**

Create `app/(public)/login/page.tsx`:

```typescript
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <Card>
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">BuildTime</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Melden Sie sich an
          </p>
        </div>

        <LoginForm />

        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          Noch kein Konto?{' '}
          <Link href="/registrieren" className="font-medium text-zinc-900 hover:underline dark:text-zinc-100">
            Firma registrieren
          </Link>
        </p>
      </div>
    </Card>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add app/(public)/layout.tsx app/(public)/login/page.tsx components/auth/login-form.tsx
git commit -m "feat: add login page with email/password and Microsoft SSO"
```

---

## Task 12: Public Pages — Registration

**Files:**
- Create: `app/(public)/registrieren/page.tsx`
- Create: `components/auth/register-form.tsx`

- [ ] **Step 1: Create registration form component**

Create `components/auth/register-form.tsx`:

```typescript
'use client'

import { useActionState } from 'react'
import { register, type AuthState } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function RegisterForm({ defaultEmail }: { defaultEmail?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(register, null)

  return (
    <form action={action} className="flex flex-col gap-4">
      <Input
        label="Firmenname"
        name="company_name"
        placeholder="Muster Bau GmbH"
        required
        error={state?.errors?.company_name?.[0]}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Vorname"
          name="first_name"
          placeholder="Max"
          required
          error={state?.errors?.first_name?.[0]}
        />
        <Input
          label="Nachname"
          name="last_name"
          placeholder="Mustermann"
          required
          error={state?.errors?.last_name?.[0]}
        />
      </div>
      <Input
        label="E-Mail"
        name="email"
        type="email"
        placeholder="max@firma.de"
        defaultValue={defaultEmail}
        required
        error={state?.errors?.email?.[0]}
      />
      <Input
        label="Passwort"
        name="password"
        type="password"
        placeholder="Mindestens 8 Zeichen"
        required
        error={state?.errors?.password?.[0]}
      />
      {state?.message && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>
      )}
      <Button type="submit" disabled={pending} size="lg" className="w-full">
        {pending ? 'Registrieren...' : 'Kostenlos registrieren'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: Create registration page**

Create `app/(public)/registrieren/page.tsx`:

```typescript
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { RegisterForm } from '@/components/auth/register-form'

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = await searchParams

  return (
    <Card>
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Firma registrieren</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Erstellen Sie Ihr BuildTime-Konto
          </p>
        </div>

        <RegisterForm defaultEmail={email} />

        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          Bereits registriert?{' '}
          <Link href="/login" className="font-medium text-zinc-900 hover:underline dark:text-zinc-100">
            Anmelden
          </Link>
        </p>
      </div>
    </Card>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/(public)/registrieren/page.tsx components/auth/register-form.tsx
git commit -m "feat: add registration page with company creation"
```

---

## Task 13: Public Pages — Invitation Acceptance

**Files:**
- Create: `app/(public)/einladung/[token]/page.tsx`
- Create: `components/auth/accept-invite-form.tsx`

- [ ] **Step 1: Create invite acceptance form**

Create `components/auth/accept-invite-form.tsx`:

```typescript
'use client'

import { useActionState } from 'react'
import { acceptInvite, type AuthState } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function AcceptInviteForm({
  token,
  defaultEmail,
  firstName,
  lastName,
  companyName,
}: {
  token: string
  defaultEmail?: string
  firstName?: string
  lastName?: string
  companyName: string
}) {
  const boundAcceptInvite = acceptInvite.bind(null, token)
  const [state, action, pending] = useActionState<AuthState, FormData>(boundAcceptInvite, null)

  return (
    <form action={action} className="flex flex-col gap-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Sie wurden eingeladen, <strong>{companyName}</strong> auf BuildTime beizutreten.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Vorname"
          name="first_name"
          defaultValue={firstName}
          required
        />
        <Input
          label="Nachname"
          name="last_name"
          defaultValue={lastName}
          required
        />
      </div>
      <Input
        label="E-Mail"
        name="email"
        type="email"
        placeholder="ihre@email.de"
        defaultValue={defaultEmail}
        required
        error={state?.errors?.email?.[0]}
      />
      <Input
        label="Passwort festlegen"
        name="password"
        type="password"
        placeholder="Mindestens 8 Zeichen"
        required
        error={state?.errors?.password?.[0]}
      />
      {state?.message && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>
      )}
      <Button type="submit" disabled={pending} size="lg" className="w-full">
        {pending ? 'Konto erstellen...' : 'Konto erstellen & loslegen'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: Create invitation page**

Create `app/(public)/einladung/[token]/page.tsx`:

```typescript
import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { AcceptInviteForm } from '@/components/auth/accept-invite-form'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function InvitationPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ fn?: string; ln?: string }>
}) {
  const { token } = await params
  const { fn, ln } = await searchParams

  const admin = createAdminClient()
  const { data: invitation } = await admin
    .from('invitations')
    .select('*, companies(name)')
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!invitation) {
    notFound()
  }

  const companyName = (invitation.companies as { name: string })?.name || 'Unbekannte Firma'

  return (
    <Card>
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Einladung annehmen</h1>
        </div>

        <AcceptInviteForm
          token={token}
          defaultEmail={invitation.email || undefined}
          firstName={fn}
          lastName={ln}
          companyName={companyName}
        />
      </div>
    </Card>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/(public)/einladung/ components/auth/accept-invite-form.tsx
git commit -m "feat: add invitation acceptance page with token validation"
```

---

## Task 14: App Layout — Adaptive Navigation

**Files:**
- Create: `app/(app)/layout.tsx`
- Create: `components/layout/top-bar.tsx`
- Create: `components/layout/manager-sidebar.tsx`
- Create: `components/layout/worker-bottom-nav.tsx`

- [ ] **Step 1: Create top bar**

Create `components/layout/top-bar.tsx`:

```typescript
'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function TopBar({
  userName,
  companyName,
}: {
  userName: string
  companyName: string
}) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-3">
        <span className="text-lg font-bold">BuildTime</span>
        <span className="hidden text-sm text-zinc-500 dark:text-zinc-400 sm:inline">
          {companyName}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-zinc-600 dark:text-zinc-400 sm:inline">
          {userName}
        </span>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          Abmelden
        </Button>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Create manager sidebar**

Create `components/layout/manager-sidebar.tsx`:

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import type { UserRole } from '@/lib/types'

type NavItem = {
  href: string
  label: string
  roles: UserRole[]
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', roles: ['owner', 'foreman'] },
  { href: '/mitarbeiter', label: 'Mitarbeiter', roles: ['owner', 'foreman'] },
  { href: '/firma', label: 'Firma', roles: ['owner'] },
  { href: '/profil', label: 'Profil', roles: ['owner', 'foreman'] },
]

export function ManagerSidebar({ role }: { role: UserRole }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const items = NAV_ITEMS.filter((item) => item.roles.includes(role))

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg md:hidden dark:bg-zinc-100 dark:text-zinc-900"
        onClick={() => setOpen(!open)}
        aria-label="Navigation öffnen"
      >
        {open ? '\u2715' : '\u2630'}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-56 flex-col border-r border-zinc-200 bg-white pt-14 transition-transform dark:border-zinc-800 dark:bg-zinc-900 md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="flex flex-col gap-1 p-3">
          {items.map((item) => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
```

- [ ] **Step 3: Create worker bottom nav**

Create `components/layout/worker-bottom-nav.tsx`:

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const WORKER_TABS = [
  { href: '/stempeln', label: 'Stempeln' },
  { href: '/profil', label: 'Profil' },
]

export function WorkerBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 md:hidden">
      {WORKER_TABS.map((tab) => {
        const active = pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-1 flex-col items-center justify-center py-3 text-xs font-medium transition-colors ${
              active
                ? 'text-zinc-900 dark:text-zinc-100'
                : 'text-zinc-500 dark:text-zinc-400'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 4: Create app layout**

Create `app/(app)/layout.tsx`:

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/top-bar'
import { ManagerSidebar } from '@/components/layout/manager-sidebar'
import { WorkerBottomNav } from '@/components/layout/worker-bottom-nav'
import type { Profile, Company } from '@/lib/types'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  if (!profile) {
    redirect('/registrieren')
  }

  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', profile.company_id)
    .single<Company>()

  const userName = `${profile.first_name} ${profile.last_name}`
  const companyName = company?.name || ''
  const isWorker = profile.role === 'worker'

  return (
    <div className="flex flex-1 flex-col">
      <TopBar userName={userName} companyName={companyName} />
      <div className="flex flex-1">
        {!isWorker && <ManagerSidebar role={profile.role} />}
        <main className={`flex flex-1 flex-col p-4 md:p-6 ${isWorker ? 'pb-20 md:pb-6' : ''}`}>
          {children}
        </main>
      </div>
      {isWorker && <WorkerBottomNav />}
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add app/(app)/layout.tsx components/layout/
git commit -m "feat: add adaptive app layout with role-based navigation"
```

---

## Task 15: App Pages — Dashboard, Stempeln, Profil

**Files:**
- Create: `app/(app)/dashboard/page.tsx`
- Create: `app/(app)/stempeln/page.tsx`
- Create: `app/(app)/profil/page.tsx`

- [ ] **Step 1: Create dashboard page**

Create `app/(app)/dashboard/page.tsx`:

```typescript
import { Card } from '@/components/ui/card'

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <Card>
        <p className="text-zinc-600 dark:text-zinc-400">
          Willkommen bei BuildTime. Das Dashboard wird in Phase 2 mit Zeiterfassungsdaten befüllt.
        </p>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Create stempeln page**

Create `app/(app)/stempeln/page.tsx`:

```typescript
import { Card } from '@/components/ui/card'

export default function StempelnPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-2xl font-bold">Stempeluhr</h1>
      <Card className="w-full max-w-sm text-center">
        <p className="text-zinc-600 dark:text-zinc-400">
          Die Stempeluhr wird in Phase 2 implementiert.
        </p>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Create profile page**

Create `app/(app)/profil/page.tsx`:

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { ProfileForm } from './profile-form'
import type { Profile } from '@/lib/types'

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  if (!profile) redirect('/login')

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Mein Profil</h1>
      <Card className="max-w-lg">
        <ProfileForm profile={profile} email={user.email || ''} />
      </Card>
    </div>
  )
}
```

- [ ] **Step 4: Create profile form**

Create `app/(app)/profil/profile-form.tsx`:

```typescript
'use client'

import { useActionState } from 'react'
import { updateProfile, type ProfileState } from '@/actions/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Profile } from '@/lib/types'

export function ProfileForm({ profile, email }: { profile: Profile; email: string }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, null)

  return (
    <form action={action} className="flex flex-col gap-4">
      <Input label="E-Mail" value={email} disabled />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Vorname"
          name="first_name"
          defaultValue={profile.first_name}
          required
          error={state?.errors?.first_name?.[0]}
        />
        <Input
          label="Nachname"
          name="last_name"
          defaultValue={profile.last_name}
          required
          error={state?.errors?.last_name?.[0]}
        />
      </div>
      <Input
        label="Telefon"
        name="phone"
        type="tel"
        defaultValue={profile.phone || ''}
        error={state?.errors?.phone?.[0]}
      />
      {state?.message && (
        <p className={`text-sm ${state.success ? 'text-green-600' : 'text-red-600'}`}>
          {state.message}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? 'Speichern...' : 'Profil speichern'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add app/(app)/dashboard/ app/(app)/stempeln/ app/(app)/profil/
git commit -m "feat: add dashboard, stempeln, and profile pages"
```

---

## Task 16: App Pages — Mitarbeiter & Einladen

**Files:**
- Create: `app/(app)/mitarbeiter/page.tsx`
- Create: `app/(app)/mitarbeiter/einladen/page.tsx`
- Create: `app/(app)/mitarbeiter/einladen/invite-form.tsx`

- [ ] **Step 1: Create employee list page**

Create `app/(app)/mitarbeiter/page.tsx`:

```typescript
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Profile } from '@/lib/types'

const ROLE_LABELS: Record<string, string> = {
  owner: 'Inhaber',
  foreman: 'Bauleiter',
  worker: 'Arbeiter',
}

export default async function MitarbeiterPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!currentProfile || !['owner', 'foreman'].includes(currentProfile.role)) {
    redirect('/stempeln')
  }

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('last_name')

  const { data: pendingInvites } = await supabase
    .from('invitations')
    .select('*')
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mitarbeiter</h1>
        <Link href="/mitarbeiter/einladen">
          <Button>Einladen</Button>
        </Link>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                <th className="pb-3 font-medium text-zinc-500">Name</th>
                <th className="pb-3 font-medium text-zinc-500">Rolle</th>
                <th className="pb-3 font-medium text-zinc-500">Telefon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {(profiles as Profile[])?.map((p) => (
                <tr key={p.id}>
                  <td className="py-3 font-medium">
                    {p.first_name} {p.last_name}
                  </td>
                  <td className="py-3 text-zinc-600 dark:text-zinc-400">
                    {ROLE_LABELS[p.role] || p.role}
                  </td>
                  <td className="py-3 text-zinc-600 dark:text-zinc-400">
                    {p.phone || '–'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {pendingInvites && pendingInvites.length > 0 && (
        <>
          <h2 className="text-lg font-semibold">Offene Einladungen</h2>
          <Card>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {pendingInvites.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <span className="font-medium">{inv.email || 'Kein E-Mail'}</span>
                    <span className="ml-2 text-zinc-500">{ROLE_LABELS[inv.role]}</span>
                  </div>
                  <span className="text-zinc-400">
                    Läuft ab: {new Date(inv.expires_at).toLocaleDateString('de-DE')}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create invite form component**

Create `app/(app)/mitarbeiter/einladen/invite-form.tsx`:

```typescript
'use client'

import { useActionState, useState } from 'react'
import { createInvitation, type InviteState } from '@/actions/invitations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

export function InviteForm() {
  const [state, action, pending] = useActionState<InviteState, FormData>(createInvitation, null)
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    if (state?.inviteLink) {
      await navigator.clipboard.writeText(state.inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (state?.inviteLink) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-green-600 dark:text-green-400">
          Einladung erstellt! Teilen Sie den Link mit dem Mitarbeiter:
        </p>
        <div className="flex gap-2">
          <input
            readOnly
            value={state.inviteLink}
            className="flex-1 rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
          <Button type="button" variant="secondary" onClick={copyLink}>
            {copied ? 'Kopiert!' : 'Kopieren'}
          </Button>
        </div>
        <p className="text-xs text-zinc-500">
          Der Link ist 7 Tage gültig. Sie können ihn per WhatsApp oder E-Mail teilen.
        </p>
      </div>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Vorname"
          name="first_name"
          required
          error={state?.errors?.first_name?.[0]}
        />
        <Input
          label="Nachname"
          name="last_name"
          required
          error={state?.errors?.last_name?.[0]}
        />
      </div>
      <Select
        label="Rolle"
        name="role"
        options={[
          { value: 'worker', label: 'Arbeiter' },
          { value: 'foreman', label: 'Bauleiter' },
        ]}
        error={state?.errors?.role?.[0]}
      />
      <Input
        label="E-Mail (optional)"
        name="email"
        type="email"
        placeholder="wird im Einladungslink vorausgefüllt"
        error={state?.errors?.email?.[0]}
      />
      {state?.message && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.message}</p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? 'Einladung erstellen...' : 'Einladung erstellen'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 3: Create invite page**

Create `app/(app)/mitarbeiter/einladen/page.tsx`:

```typescript
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { InviteForm } from './invite-form'

export default function EinladenPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/mitarbeiter"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          Mitarbeiter
        </Link>
        <span className="text-zinc-300 dark:text-zinc-600">/</span>
        <h1 className="text-2xl font-bold">Einladen</h1>
      </div>
      <Card className="max-w-lg">
        <InviteForm />
      </Card>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add app/(app)/mitarbeiter/
git commit -m "feat: add employee list and invitation pages"
```

---

## Task 17: App Pages — Firmeneinstellungen

**Files:**
- Create: `app/(app)/firma/page.tsx`
- Create: `app/(app)/firma/company-form.tsx`

- [ ] **Step 1: Create company form**

Create `app/(app)/firma/company-form.tsx`:

```typescript
'use client'

import { useActionState } from 'react'
import { updateCompany, type CompanyState } from '@/actions/company'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Company } from '@/lib/types'

export function CompanyForm({ company }: { company: Company }) {
  const [state, action, pending] = useActionState<CompanyState, FormData>(updateCompany, null)

  return (
    <form action={action} className="flex flex-col gap-4">
      <Input
        label="Firmenname"
        name="name"
        defaultValue={company.name}
        required
        error={state?.errors?.name?.[0]}
      />
      <Input
        label="Adresse"
        name="address"
        defaultValue={company.address || ''}
        error={state?.errors?.address?.[0]}
      />
      <Input
        label="Steuernummer"
        name="tax_id"
        defaultValue={company.tax_id || ''}
        error={state?.errors?.tax_id?.[0]}
      />
      <Input
        label="Handwerkskammer-Nr."
        name="trade_license"
        defaultValue={company.trade_license || ''}
        error={state?.errors?.trade_license?.[0]}
      />
      {state?.message && (
        <p className={`text-sm ${state.success ? 'text-green-600' : 'text-red-600'}`}>
          {state.message}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? 'Speichern...' : 'Firma speichern'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: Create company settings page**

Create `app/(app)/firma/page.tsx`:

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { CompanyForm } from './company-form'
import type { Profile, Company } from '@/lib/types'

export default async function FirmaPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single<Pick<Profile, 'role' | 'company_id'>>()

  if (!profile || profile.role !== 'owner') {
    redirect('/dashboard')
  }

  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', profile.company_id)
    .single<Company>()

  if (!company) redirect('/dashboard')

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Firmeneinstellungen</h1>
      <Card className="max-w-lg">
        <CompanyForm company={company} />
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/(app)/firma/
git commit -m "feat: add company settings page (owner only)"
```

---

## Task 18: Root Redirect

**Files:**
- Create: `app/page.tsx`

- [ ] **Step 1: Create root page with redirect**

Create `app/page.tsx`:

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types'

export default async function RootPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single<Pick<Profile, 'role'>>()

  if (!profile) {
    redirect('/registrieren')
  }

  redirect(profile.role === 'worker' ? '/stempeln' : '/dashboard')
}
```

- [ ] **Step 2: Verify dev server**

Run: `npm run dev`
Expected: Visiting `/` redirects to `/login` (when not authenticated)

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add root page with role-based redirect"
```

---

## Task 19: Final Verification

- [ ] **Step 1: Run all tests**

Run: `npx vitest run`
Expected: All 14 validation tests pass

- [ ] **Step 2: Run TypeScript type check**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Run linter**

Run: `npm run lint`
Expected: No lint errors (fix any that appear)

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 5: Verify file structure**

Run: `find app components lib actions supabase proxy.ts -type f | sort`
Expected: All files from the File Structure section exist

- [ ] **Step 6: Final commit (if any fixes were needed)**

```bash
git add -A
git commit -m "fix: resolve build/lint issues from Phase 1 implementation"
```
