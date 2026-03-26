# Phase 1: Auth, Firmenverwaltung & Basis-UI

**Projekt:** BuildTime — ERP-Light SaaS für Bauunternehmer in Deutschland
**Phase:** 1 von 5 (Fundament)
**Datum:** 2026-03-26
**Tech-Stack:** Next.js 16.2.1, TypeScript, Tailwind CSS 4, Supabase (Auth + DB), Vercel

## Kontext

BuildTime ist eine SaaS-Lösung für kleine bis mittlere Bauunternehmen in Deutschland (5-100 Mitarbeiter). Die App ersetzt Papier-basierte Prozesse — beginnend mit Zeiterfassung (Phase 2), aufbauend auf dem Fundament aus Phase 1.

**Phasenplan (Gesamtprojekt):**

1. Auth + Firmenverwaltung + Basis-UI (dieses Dokument)
2. Zeiterfassung (GPS-Stempeluhr, Schichten, Zuschläge)
3. Baustellenverwaltung (Projekte, Bautagebuch, Fotos)
4. Personal & Qualifikationen
5. Weitere Module (Material, Kalkulation, Subunternehmer, Compliance, Berichte)

Jede Phase durchläuft einen eigenen Design- und Implementierungszyklus.

## Scope Phase 1

Phase 1 liefert das Fundament: Ein Firmeninhaber kann sich registrieren, seine Firma einrichten, Mitarbeiter per Einladungslink hinzufügen, und alle Nutzer sehen eine rollenbasierte UI-Shell. Keine fachliche Logik (Zeiterfassung etc.) — nur Auth, Multi-Tenancy und Navigation.

### In Scope

- Registrierung für Firmeninhaber (E-Mail + Passwort)
- Microsoft SSO (Azure AD) als alternativer Login
- Einladungs-Flow per Token/Link (WhatsApp-tauglich)
- Rollenmodell: Owner, Foreman, Worker
- Multi-Tenancy via RLS mit `company_id`
- Firmeneinstellungen (Name, Adresse, Steuernummer)
- Mitarbeiterliste und Einladungsverwaltung
- Adaptive UI-Shell (Worker: Bottom-Nav, Manager: Sidebar)
- Profil-Seite (eigenes Profil bearbeiten)
- Responsive Web App, mobile-first

### Nicht in Scope

- Zeiterfassung, Baustellenverwaltung, Kalkulation (spätere Phasen)
- PWA / Offline-Fähigkeit (späteres Enhancement)
- Native App (nicht geplant für MVP)
- Flexible Rollen/Berechtigungen (spätere Phase, falls nötig)
- Abrechnungs-/Billing-Integration
- E-Mail-Versand (Einladung geht über kopierbaren Link, nicht per Mail)

## Architektur-Entscheidungen

| Entscheidung | Wahl | Begründung |
|---|---|---|
| Multi-Tenancy | RLS mit `company_id` | Supabase-nativ, einfach, performant für die Zielgruppe |
| Rollenmodell | 3 feste Rollen (Enum) | Deckt Owner→Foreman→Worker ab, YAGNI für flexible Rollen |
| Auth | Supabase Auth + Microsoft OAuth | Büro-Leute per SSO, Arbeiter per Invite-Link |
| Rollen-Speicherung | `profiles.role` (DB), nicht Auth Metadata | RLS-Policies können direkt darauf zugreifen |
| Session-Schutz | Proxy (optimistisch) + RLS (autoritativ) | Proxy leitet um, RLS erzwingt Datenisolation |
| UI-Strategie | Adaptive UI, eine Codebase | Rollenbasierte Navigation, gleiche Komponenten |
| Mobile | Responsive Web App | Niedrige Einstiegshürde, kein App Store nötig |
| Rendering | Server Components (Default) | Client Components nur für Interaktivität |
| Next.js Version | 16.2.1 | `proxy.ts` statt `middleware.ts`, async params |

## Datenmodell

```sql
-- Enums
CREATE TYPE user_role AS ENUM ('owner', 'foreman', 'worker');

-- Firmen
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  tax_id TEXT,              -- Steuernummer
  trade_license TEXT,       -- Handwerkskammer-Nr
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Benutzerprofile (erweitert Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id),
  role user_role NOT NULL DEFAULT 'worker',
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  invited_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Einladungen
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  role user_role NOT NULL DEFAULT 'worker',
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  email TEXT,               -- optional, Einladung funktioniert auch ohne
  created_by UUID NOT NULL REFERENCES profiles(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '7 days',
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indizes
CREATE INDEX idx_profiles_company ON profiles(company_id);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_company ON invitations(company_id);
```

### Beziehungen

- `profiles.id` → `auth.users.id` (1:1, CASCADE DELETE)
- `profiles.company_id` → `companies.id` (N:1)
- `profiles.invited_by` → `profiles.id` (N:1, nullable — Owner hat keinen Einlader)
- `invitations.company_id` → `companies.id` (N:1)
- `invitations.created_by` → `profiles.id` (N:1)

## Row-Level Security

```sql
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Helper-Funktionen
CREATE FUNCTION auth.company_id() RETURNS UUID AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE FUNCTION auth.user_role() RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- COMPANIES
CREATE POLICY "Eigene Firma sehen" ON companies
  FOR SELECT USING (id = auth.company_id());
CREATE POLICY "Owner kann Firma bearbeiten" ON companies
  FOR UPDATE USING (id = auth.company_id() AND auth.user_role() = 'owner');

-- PROFILES
CREATE POLICY "Kollegen sehen" ON profiles
  FOR SELECT USING (company_id = auth.company_id());
CREATE POLICY "Owner verwaltet Mitarbeiter" ON profiles
  FOR ALL USING (
    company_id = auth.company_id()
    AND auth.user_role() IN ('owner', 'foreman')
  );

-- INVITATIONS
CREATE POLICY "Einladungen der eigenen Firma" ON invitations
  FOR SELECT USING (company_id = auth.company_id());
CREATE POLICY "Einladungen erstellen" ON invitations
  FOR INSERT WITH CHECK (
    company_id = auth.company_id()
    AND auth.user_role() IN ('owner', 'foreman')
  );
-- Einladung per Token: Server Action setzt 'app.invitation_token' via
-- supabase.rpc('set_config', { setting: 'app.invitation_token', value: token })
-- bevor die Invitation abgefragt wird. Alternativ: Service Role Client nutzen.
CREATE POLICY "Einladung per Token" ON invitations
  FOR SELECT USING (token = current_setting('app.invitation_token', true));
```

### RLS-Prinzipien

- Jede Query geht automatisch durch RLS — kein Weg an der Firmenisolation vorbei
- Helper-Funktionen vermeiden wiederholte Subqueries in Policies
- `SECURITY DEFINER` auf Helpern erlaubt Zugriff auf `profiles` während der Auswertung
- Proxy macht nur optimistische Session-Prüfung; RLS ist die autoritative Schicht

## Auth-Flows

### Registrierung (Firmeninhaber)

1. User öffnet `/registrieren`
2. Formular: Firmenname, Vorname, Nachname, E-Mail, Passwort
3. Server Action:
   - Metadaten in `signUp()` übergeben: `{ data: { flow: 'register', company_name, first_name, last_name } }`
   - `supabase.auth.signUp()` erstellt `auth.users` Eintrag mit Metadaten
   - Supabase Database Trigger `on_auth_user_created` liest `raw_user_meta_data.flow`:
     - `flow = 'register'`: Company erstellen + Profile (role: owner) mit `company_id` — atomar in einer Transaktion
     - `flow = 'invite'`: Profile erstellen mit `company_id` und `role` aus Metadaten (gesetzt im Einladungs-Flow)
     - Kein `flow`-Feld (z.B. SSO): Kein automatisches Profile — User wird auf Onboarding-Seite geleitet
4. E-Mail-Bestätigung via Supabase (konfigurierbar)
5. Redirect → `/dashboard`

### Microsoft SSO (Owner/Foreman)

1. User klickt "Mit Microsoft anmelden" auf `/login`
2. `supabase.auth.signInWithOAuth({ provider: 'azure' })`
3. Redirect zu Microsoft → Consent → zurück zu Callback-URL
4. Supabase erstellt `auth.users` Eintrag
5. Nach Callback prüft die App serverseitig ob ein Profile existiert:
   - **Profile existiert:** Login, Redirect basierend auf Rolle
   - **Kein Profile:** Redirect auf `/registrieren` mit vorausgefüllter E-Mail — User muss Firmenname angeben, dann wird Company + Profile erstellt. Microsoft SSO ohne vorherige Einladung oder Registrierung führt immer zur Firmenerstellung.

Konfiguration: Azure AD App Registration mit Client ID + Secret im Supabase Dashboard.

### Einladung (Arbeiter/Bauleiter)

1. Owner/Foreman öffnet `/mitarbeiter/einladen`
2. Formular: Vorname, Nachname, Rolle (worker/foreman), optional E-Mail
3. Server Action: `INSERT INTO invitations` → Token wird generiert
4. UI zeigt Einladungslink: `buildtime.de/einladung/{token}`
   - "Link kopieren"-Button (WhatsApp-ready)
5. Eingeladener öffnet Link → `/einladung/[token]`
6. Formular: E-Mail (vorausgefüllt falls vorhanden), Passwort setzen
7. Server Action:
   - Invitation validieren (nicht abgelaufen, nicht bereits akzeptiert)
   - `supabase.auth.signUp()` mit E-Mail + Passwort + Metadaten `{ flow: 'invite', company_id, role }` aus Invitation
   - Trigger erstellt Profile automatisch (role + company_id aus Metadaten)
   - Invitation als accepted markieren (`accepted_at = now()`)
8. Redirect → rollenbasiert (`/stempeln` für Worker, `/dashboard` für Foreman)

### Login (Standard)

1. `/login` → E-Mail + Passwort oder "Mit Microsoft anmelden"
2. `supabase.auth.signInWithPassword()` oder `signInWithOAuth()`
3. Proxy prüft Session-Cookie auf geschützten Routen
4. Redirect basierend auf Rolle:
   - Owner/Foreman → `/dashboard`
   - Worker → `/stempeln`

### Proxy (Route Protection)

```typescript
// proxy.ts — Next.js 16 Konvention (ersetzt middleware.ts)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/registrieren', '/einladung']

export function proxy(request: NextRequest) {
  const session = request.cookies.get('sb-access-token')
  const { pathname } = request.nextUrl

  if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
    return NextResponse.next()
  }

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)'],
}
```

Der Proxy macht ausschliesslich optimistische Session-Prüfung (Cookie vorhanden?). Autorisierung (Rolle, Company) wird durch RLS und serverseitige Prüfungen in Server Components erzwungen.

## UI-Architektur

### Route-Struktur

```
app/
├── (public)/                    # Route Group: kein Auth nötig
│   ├── login/page.tsx
│   ├── registrieren/page.tsx
│   └── einladung/[token]/page.tsx
│
├── (app)/                       # Route Group: Auth required
│   ├── layout.tsx               # App-Shell mit rollenbasierter Navigation
│   │
│   ├── dashboard/page.tsx       # Owner/Foreman Landing
│   ├── stempeln/page.tsx        # Worker Landing (Platzhalter für Phase 2)
│   │
│   ├── mitarbeiter/
│   │   ├── page.tsx             # Mitarbeiterliste
│   │   └── einladen/page.tsx    # Einladungsformular
│   │
│   ├── firma/
│   │   └── page.tsx             # Firmeneinstellungen (Owner only)
│   │
│   └── profil/page.tsx          # Eigenes Profil bearbeiten
│
├── layout.tsx                   # Root Layout (Fonts, Globals)
├── globals.css
└── not-found.tsx
```

### Adaptive Navigation

Das `(app)/layout.tsx` ist ein Server Component das den User-Profile lädt und die Navigation rollenbasiert rendert:

- **Worker:** Bottom-Navigation (3 Tabs: Stempeln, Meine Zeiten, Profil) — grosse Touch-Targets, mobile-optimiert
- **Owner/Foreman:** Sidebar (Desktop) mit Hamburger-Menu (Mobile) — Dashboard, Mitarbeiter, Baustellen*, Zeiten*, Firma (Owner only)

*Baustellen und Zeiten werden in Phase 2+3 als Menüpunkte hinzugefügt, die Navigation ist dafür vorbereitet.

### Komponenten-Struktur

```
components/
├── ui/                    # Basis-Komponenten
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   └── ...
├── auth/                  # Auth-spezifische Formulare
│   ├── login-form.tsx     # 'use client' — useActionState
│   ├── register-form.tsx  # 'use client' — useActionState
│   └── invite-form.tsx    # 'use client' — useActionState
├── layout/                # Shell-Komponenten
│   ├── worker-bottom-nav.tsx   # 'use client' (active state tracking)
│   ├── manager-sidebar.tsx     # 'use client' (collapse state)
│   └── top-bar.tsx
└── providers/
    └── supabase-provider.tsx   # 'use client' — Supabase Browser Client
```

### Rendering-Strategie

- **Server Components** als Default für alle Seiten und Layouts
- **Client Components** (`'use client'`) nur für: Formulare (Login, Register, Invite), Navigation-State (aktiver Tab, Sidebar collapsed), Supabase Browser Client Provider
- **Server Actions** für alle Mutations (Registrierung, Einladung erstellen, Profil bearbeiten)
- Formulare nutzen React 19 `useActionState` für pending-State und Validierungsfehler

### Supabase Client-Strategie

```
lib/
├── supabase/
│   ├── server.ts    # createServerClient() — Server Components & Server Actions
│   ├── client.ts    # createBrowserClient() — Client Components
│   └── admin.ts     # createServiceClient() — Admin-Ops (Service Role Key, nur serverseitig)
```

Drei Clients, jeweils für ihren Kontext. `@supabase/ssr` handhabt Cookie-Management.

## Validierung

Formular-Validierung mit Zod-Schemas, geteilt zwischen Client (sofortiges Feedback) und Server (autoritative Prüfung):

```
lib/
├── validations/
│   ├── auth.ts      # Login, Register, Invite Schemas
│   └── company.ts   # Firmeneinstellungen Schema
```

## Seiten-Übersicht

| Route | Zugang | Beschreibung |
|---|---|---|
| `/login` | Public | E-Mail/Passwort + Microsoft SSO |
| `/registrieren` | Public | Firma + Owner-Account erstellen |
| `/einladung/[token]` | Public | Einladung annehmen, Passwort setzen |
| `/dashboard` | Owner, Foreman | Übersicht (Platzhalter, wird in Phase 2+ befüllt) |
| `/stempeln` | Worker | Stempeluhr (Platzhalter für Phase 2) |
| `/mitarbeiter` | Owner, Foreman | Mitarbeiterliste mit Status |
| `/mitarbeiter/einladen` | Owner, Foreman | Einladungsformular + Link generieren |
| `/firma` | Owner | Firmenname, Adresse, Steuernummer bearbeiten |
| `/profil` | Alle | Eigenes Profil (Name, Telefon, Passwort) |

## Sprache

Die gesamte App-UI ist auf Deutsch. Code (Variablen, Funktionen, Komponenten) bleibt auf Englisch. Deutsche Strings werden direkt in den Komponenten verwendet — kein i18n-Framework für den MVP, da nur Deutsch unterstützt wird.

## Testing-Strategie

- **Unit Tests:** Zod-Validierungsschemas
- **Integration Tests:** Auth-Flows (Registrierung, Login, Einladung) gegen Supabase
- **RLS Tests:** SQL-Tests die verifizieren, dass Firma A nicht auf Daten von Firma B zugreifen kann
- **E2E Tests:** Kritische User-Journeys (Registrierung → Einladung → Worker-Login)

Testing-Framework und Details werden im Implementierungsplan festgelegt.
