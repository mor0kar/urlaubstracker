# UrlaubsPlaner — CLAUDE.md

Dieses Dokument ist die primäre Referenz für Claude Code beim Arbeiten in diesem Projekt.
Lies es vollständig bevor du Code schreibst oder Änderungen vorschlägst.

---

## Projektübersicht

**UrlaubsPlaner** ist eine persönliche Webapplikation zur Verwaltung von Urlaubstagen.
Sie ersetzt eine Excel-Datei und bietet zusätzlich intelligente Vorschläge zur optimalen
Urlaubsplanung basierend auf deutschen Feiertagen je Bundesland.

**Status:** Aufbauphase — noch kein Code vorhanden.

---

## Tech-Stack

| Bereich | Technologie | Version |
|---|---|---|
| Framework | Next.js (App Router) | 15.x |
| Sprache | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| Datenbank | Supabase (PostgreSQL) | — |
| ORM | Supabase JS Client (`@supabase/supabase-js`) | 2.x |
| Auth | Supabase Auth (Magic Link / OAuth) | — |
| RLS | Supabase Row Level Security | — |
| Feiertage | `date-holidays` npm-Paket | — |
| Hosting | Vercel (Free Tier) | — |
| Validierung | Zod | 3.x |
| Testing | Playwright (E2E) | — |

**Kein Prisma** — wir nutzen den nativen Supabase JS Client mit generierten TypeScript-Typen.

---

## Projektstruktur

```
urlaubstracker/
├── CLAUDE.md                    ← diese Datei
├── AGENTS.md                    ← Agent-Definitionen
├── .claude/
│   └── skills/                  ← installierte Skills
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/           ← Magic Link Login
│   │   ├── (app)/
│   │   │   ├── dashboard/       ← Jahresübersicht
│   │   │   ├── kalender/        ← Urlaub eintragen & anzeigen
│   │   │   ├── vorschlaege/     ← Brückentagsvorschläge
│   │   │   └── einstellungen/   ← Bundesland, Urlaubstage/Jahr
│   │   ├── api/
│   │   │   ├── urlaub/          ← CRUD für Urlaubseinträge
│   │   │   ├── feiertage/       ← Feiertagsberechnung je Bundesland
│   │   │   └── vorschlaege/     ← Brückentagsoptimierung
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                  ← generische UI-Komponenten
│   │   ├── kalender/            ← Kalenderkomponenten
│   │   └── vorschlaege/         ← Vorschlagskarten
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts        ← Browser-Client
│   │   │   ├── server.ts        ← Server-Client (Cookies)
│   │   │   └── middleware.ts    ← Auth-Middleware
│   │   ├── feiertage.ts         ← date-holidays Wrapper
│   │   ├── brueckentage.ts      ← Optimierungsalgorithmus
│   │   └── berechnungen.ts      ← Urlaubskonto-Logik
│   ├── types/
│   │   ├── database.types.ts    ← Supabase generierte Typen
│   │   └── index.ts
│   └── hooks/
│       ├── useUrlaub.ts
│       └── useVorschlaege.ts
├── supabase/
│   ├── migrations/              ← SQL Migrations
│   └── seed.sql
├── tests/
│   └── e2e/                     ← Playwright Tests
└── .env.local                   ← Supabase Keys (nicht committen!)
```

---

## Datenbank-Schema (Supabase PostgreSQL)

### Tabellen

```sql
-- Benutzereinstellungen (1 pro User)
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  bundesland TEXT NOT NULL DEFAULT 'NW',  -- z.B. 'NW' = Nordrhein-Westfalen
  urlaubstage_pro_jahr INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jahresurlaubskonto (1 pro User pro Jahr)
CREATE TABLE urlaubskonten (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  jahr INTEGER NOT NULL,
  gesamttage INTEGER NOT NULL,           -- Anspruch gesamt (inkl. Übertrag)
  uebertrag_aus_vorjahr INTEGER DEFAULT 0,
  UNIQUE(user_id, jahr)
);

-- Urlaubseinträge
CREATE TABLE urlaubseintraege (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  von_datum DATE NOT NULL,
  bis_datum DATE NOT NULL,
  arbeitstage INTEGER NOT NULL,          -- berechnete Arbeitstage (ohne Feiertage/WE)
  notiz TEXT,
  status TEXT NOT NULL DEFAULT 'geplant' CHECK (status IN ('geplant', 'beantragt', 'genehmigt', 'abgelehnt')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS Policies (immer aktivieren!)

```sql
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE urlaubskonten ENABLE ROW LEVEL SECURITY;
ALTER TABLE urlaubseintraege ENABLE ROW LEVEL SECURITY;

-- Jeder User sieht nur seine eigenen Daten
CREATE POLICY "users_own_settings" ON settings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_own_konten" ON urlaubskonten
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_own_eintraege" ON urlaubseintraege
  FOR ALL USING (auth.uid() = user_id);
```

---

## Schlüsselfunktionen

### 1. Urlaubskonto-Berechnung
```typescript
// Aus src/lib/berechnungen.ts
interface Urlaubskonto {
  gesamtanspruch: number;       // Basis-Tage + Übertrag
  uebertragVorjahr: number;
  genommeneTage: number;        // bereits eingetragene Tage
  beantrageTage: number;        // noch nicht genehmigte Tage
  verbleibendeTag: number;      // frei verfügbar
}
```

### 2. Feiertagsberechnung je Bundesland
```typescript
// Aus src/lib/feiertage.ts — nutzt 'date-holidays' npm
import Holidays from 'date-holidays';

export function getFeiertage(bundesland: string, jahr: number) {
  const hd = new Holidays('DE', bundesland);
  return hd.getHolidays(jahr).filter(h => h.type === 'public');
}
```

### 3. Brückentagsoptimierung
```typescript
// Aus src/lib/brueckentage.ts
// Findet Fenster wo X Urlaubstage => Y freie Tage ergeben (Y/X maximieren)
export function findeOptimaleUrlaube(
  bundesland: string,
  jahr: number,
  maxUrlaubstage: number
): Vorschlag[]
```

---

## Bundesländer-Codes

```typescript
export const BUNDESLAENDER = {
  'BB': 'Brandenburg',
  'BE': 'Berlin',
  'BW': 'Baden-Württemberg',
  'BY': 'Bayern',
  'HB': 'Bremen',
  'HE': 'Hessen',
  'HH': 'Hamburg',
  'MV': 'Mecklenburg-Vorpommern',
  'NI': 'Niedersachsen',
  'NW': 'Nordrhein-Westfalen',
  'RP': 'Rheinland-Pfalz',
  'SH': 'Schleswig-Holstein',
  'SL': 'Saarland',
  'SN': 'Sachsen',
  'ST': 'Sachsen-Anhalt',
  'TH': 'Thüringen',
} as const;
```

---

## Konventionen & Regeln

### Allgemein
- Alle Code-Kommentare und Variablennamen auf **Deutsch** (Ausnahme: npm-Paketnamen, SQL-Keywords)
- TypeScript strict mode — kein `any`
- Zod für alle API-Inputs validieren
- Alle Datenbankzugriffe über Supabase Server Client (nicht Browser Client) in API Routes

### Supabase
- **Immer** RLS aktiviert lassen — niemals `supabase.from(...).select()` ohne Auth-Context im Server
- Typen generieren mit: `npx supabase gen types typescript --project-id <ID> > src/types/database.types.ts`
- Browser Client nur für Realtime/Auth-State — Datenbankoperationen im Server
- `.env.local` enthält `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY` und `SUPABASE_SERVICE_ROLE_KEY`

### Next.js 15
- App Router — kein Pages Router
- Server Components by default — `'use client'` nur wenn nötig
- Server Actions für Mutations bevorzugen (statt API Routes für einfache Ops)
- API Routes (`/api/...`) nur für komplexe Berechnungen (Feiertage, Brückentagsoptimierung)

### Tailwind CSS 4
- Tailwind v4 Syntax (kein `tailwind.config.js` — CSS-first Config)
- Design-Tokens in `app/globals.css` definieren

### Fehlerbehandlung
- API Routes geben immer `{ data, error }` zurück
- Fehler nie verschlucken — immer loggen und an Client propagieren
- Nutze `error.tsx` und `not-found.tsx` von Next.js

---

## Umgebungsvariablen

```bash
# .env.local (NICHT committen)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # nur server-side!
```

---

## Scripts

```bash
npm run dev          # Entwicklungsserver
npm run build        # Production Build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npx playwright test  # E2E Tests
npx supabase gen types typescript --project-id <ID> > src/types/database.types.ts
```

---

## Kostenlos-Garantie

Alle eingesetzten Dienste müssen im Free Tier bleiben:
- Supabase Free: 500 MB DB, 50.000 MAU Auth, 5 GB Bandwidth ✓
- Vercel Free: Serverless Functions, globales CDN ✓
- `date-holidays`: Open Source npm-Paket ✓

Keine bezahlten APIs, keine Drittanbieter außer den genannten.
