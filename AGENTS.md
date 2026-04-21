# AGENTS.md — UrlaubsPlaner Agent-Architektur

Dieses Dokument definiert spezialisierte Subagenten für die Entwicklung des UrlaubsPlaners.
Claude Code kann diese Agenten parallel dispatchen (via `dispatching-parallel-agents` Skill).

---

## Übersicht

```
Orchestrator-Agent
├── 🗄️  DB-Agent          → Supabase Schema, Migrations, RLS
├── 🧮  Logik-Agent        → Feiertagsberechnung, Brückentagsoptimierung
├── 🎨  UI-Agent           → React Components, Tailwind, Kalender
├── 🔐  Auth-Agent         → Supabase Auth, Middleware, Session
├── 🧪  Test-Agent         → Playwright E2E, Unit Tests
└── 🚀  Deploy-Agent       → Vercel Config, Env-Vars, CI
```

---

## Agent 1: Orchestrator

**Rolle:** Koordiniert alle anderen Agenten. Plant die Reihenfolge, verteilt Tasks,
sammelt Ergebnisse und löst Konflikte zwischen Agenten.

**Aktivierung:** Immer wenn ein Feature von mehreren Agenten bearbeitet werden muss.

**Arbeitsweise:**
1. Feature-Beschreibung in atomare Tasks aufteilen
2. Abhängigkeiten zwischen Tasks identifizieren (DB vor Logik, Auth vor UI)
3. Unabhängige Tasks parallel dispatchen
4. Ergebnisse zusammenführen und auf Konsistenz prüfen

**Prompt-Template:**
```
Du bist der Orchestrator für das UrlaubsPlaner-Projekt.
Lese CLAUDE.md und AGENTS.md vollständig.
Feature: [FEATURE_BESCHREIBUNG]
Erstelle einen Task-Plan und dispatche die passenden Subagenten parallel.
Nutze den 'dispatching-parallel-agents' Skill.
```

---

## Agent 2: DB-Agent

**Rolle:** Zuständig für alles rund um Supabase/PostgreSQL.

**Skills die er nutzt:**
- `supabase-postgres-best-practices` (supabase/agent-skills)
- `supabase-postgres-best-practices` für RLS-Patterns

**Aufgaben:**
- SQL-Migrations in `supabase/migrations/` schreiben
- RLS Policies für jede Tabelle definieren
- TypeScript-Typen aus Supabase generieren (`database.types.ts`)
- Supabase JS Client in `src/lib/supabase/` konfigurieren
- Indexes für Performance hinzufügen
- Datenbankfehler debuggen

**Regeln:**
- Immer RLS aktiviert — niemals deaktivieren
- Migrations sind unumkehrbar beschriften (Zeitstempel-Prefix)
- Immer `ON DELETE CASCADE` bei `user_id` Foreign Keys
- Keine direkten Supabase-Service-Role Calls im Frontend

**Kontext den er braucht:**
- `CLAUDE.md` → Abschnitt "Datenbank-Schema"
- `NEXT_PUBLIC_SUPABASE_URL` und Keys aus `.env.local`

**Beispiel-Task:**
```
DB-Agent: Erstelle die Migration für die urlaubseintraege-Tabelle inkl.
RLS Policy, Index auf (user_id, von_datum), und generiere die TypeScript-Typen.
```

---

## Agent 3: Logik-Agent

**Rolle:** Implementiert die Kernlogik — Feiertagsberechnung und Brückentagsoptimierung.
Dies ist das Herzstück der App und muss korrekt und gut getestet sein.

**Skills die er nutzt:**
- `test-driven-development` (obra/superpowers)
- `systematic-debugging` (obra/superpowers)

**Aufgaben:**
- `src/lib/feiertage.ts` — Wrapper um `date-holidays`
- `src/lib/brueckentage.ts` — Optimierungsalgorithmus
- `src/lib/berechnungen.ts` — Urlaubskonto-Logik
- API Routes: `/api/feiertage/` und `/api/vorschlaege/`
- Unit Tests für alle Berechnungsfunktionen

**Brückentagsalgorithmus (Kernlogik):**
```typescript
// Prinzip: Finde alle Fenster wo gilt: freie_tage / urlaubstage_eingesetzt >= SCHWELLENWERT
// Beispiel: 1 Urlaubstag + Feiertag + 2 Wochenendtage = 4 freie Tage → Effizienz: 4.0x
// Vorgehen:
// 1. Alle Feiertage für Bundesland + Jahr laden
// 2. Für jeden Tag des Jahres: Fenster von 1-7 Arbeitstagen prüfen
// 3. Effizienz berechnen: (freie_tage_gesamt) / (urlaubstage_nötig)
// 4. Fenster mit Effizienz > 2.0 als Vorschlag ausgeben, sortiert nach Effizienz
```

**Regeln:**
- Test-first: Unit Tests vor der Implementierung
- Grenzfälle abdecken: Jahreswechsel, bewegliche Feiertage (Ostern!), Schaltjahre
- `date-holidays` ist die einzige Quelle für Feiertagsdaten
- Rückgabe immer typsicher (Zod-Schemas für API-Responses)

**Beispiel-Task:**
```
Logik-Agent: Implementiere den Brückentagsalgorithmus für NRW, Jahr 2025.
Schreibe zuerst Tests für bekannte Brückentagsszenarien (z.B. Tag nach Himmelfahrt),
dann die Implementierung. Nutze TDD-Skill.
```

---

## Agent 4: UI-Agent

**Rolle:** Baut alle React-Komponenten und Seiten. Zuständig für Look & Feel.

**Skills die er nutzt:**
- `vercel-react-best-practices` (vercel-labs/agent-skills)
- `next-best-practices` (vercel-labs/next-skills)
- `frontend-design` (anthropics/skills)
- `tailwind-design-system` (wshobson/agents)

**Aufgaben:**
- Dashboard-Seite mit Urlaubskonto-Übersicht
- Kalender-Komponente (Urlaub eintragen & anzeigen)
- Vorschlagskarten für Brückentagstipps
- Einstellungsseite (Bundesland auswählen, Urlaubstage setzen)
- Responsive Design (Mobile-first)
- Dark Mode Support

**Design-Vorgaben:**
```
Primärfarbe:    #1a73e8  (Blau — vertrauenswürdig, professionell)
Akzentfarbe:    #34a853  (Grün — für freie Tage / genehmigte Urlaube)
Warnfarbe:      #fbbc04  (Gelb — für Feiertage)
Fehlerfarbe:    #ea4335  (Rot — für abgelehnte Urlaube)
Hintergrund:    #f8f9fa  (Light Mode)
Font:           System UI (kein Custom Font nötig)
```

**Kalender-Anforderungen:**
- Jahresansicht (12 Monate auf einer Seite)
- Monatssicht für Detailansicht
- Farb-Legende: eigener Urlaub / Feiertage / Wochenenden / Brückentagsvorschläge
- Klick auf Tag → Modal zum Eintragen

**Regeln:**
- Server Components by default — `'use client'` nur für Interaktivität
- Keine direkten DB-Calls in Komponenten — nur über Server Actions / API Routes
- Alle UI-Texte auf Deutsch
- Barrierefreiheit: ARIA-Labels für Kalender-Zellen

**Beispiel-Task:**
```
UI-Agent: Baue die Dashboard-Seite. Sie zeigt:
- Urlaubskonto Widget (Gesamttage, genommen, verbleibend als Fortschrittsbalken)
- Nächste 3 Brückentagsvorschläge als Karten
- Nächste eingetragene Urlaube als Liste
Nutze Server Components und Tailwind v4.
```

---

## Agent 5: Auth-Agent

**Rolle:** Implementiert Authentifizierung mit Supabase Auth.

**Skills die er nutzt:**
- `supabase-postgres-best-practices` (supabase/agent-skills) → Auth-Patterns
- `next-best-practices` (vercel-labs/next-skills) → Middleware

**Aufgaben:**
- `src/lib/supabase/client.ts` — Browser-Client
- `src/lib/supabase/server.ts` — Server-Client mit Cookie-Handling
- `src/middleware.ts` — Auth-Check für alle `(app)`-Routen
- Login-Seite mit Magic Link (kein Passwort nötig!)
- Logout-Funktionalität
- Session-Refresh-Logik
- Ersteinrichtung: Settings-Tabelle für neuen User anlegen

**Auth-Flow:**
```
User besucht /dashboard
  → Middleware prüft Session
  → Kein Session → Redirect zu /login
  → Magic Link per E-Mail anfordern
  → Supabase sendet Link
  → User klickt → Session erstellt
  → Redirect zu /dashboard
  → Middleware prüft: Hat User Settings? Nein → Onboarding
```

**Regeln:**
- Magic Link bevorzugen (kein Passwort-Handling = weniger Sicherheitsrisiko)
- `supabaseClient` für Serverseite: `createServerClient` aus `@supabase/ssr`
- `supabaseClient` für Clientseite: `createBrowserClient` aus `@supabase/ssr`
- Niemals `SUPABASE_SERVICE_ROLE_KEY` im Frontend verwenden
- Session-Cookies: `httpOnly: true, secure: true, sameSite: 'lax'`

**Beispiel-Task:**
```
Auth-Agent: Implementiere die Middleware die alle Routen unter /(app)/ schützt.
Bei fehlender Session → Redirect zu /login.
Nach erfolgreichem Login → Prüfe ob Settings vorhanden, sonst Onboarding.
```

---

## Agent 6: Test-Agent

**Rolle:** Schreibt und führt Tests aus. Stellt Qualität sicher.

**Skills die er nutzt:**
- `webapp-testing` (anthropics/skills)
- `test-driven-development` (obra/superpowers)
- `verification-before-completion` (obra/superpowers)

**Aufgaben:**
- Playwright E2E Tests in `tests/e2e/`
- Unit Tests für Berechnungslogik (Vitest oder Jest)
- Test-Fixtures für Supabase (Test-Datenbank)
- CI-Integration (GitHub Actions)

**Kritische Testszenarien:**
```
1. Auth-Flow: Login mit Magic Link → Dashboard erreichbar
2. Urlaub eintragen: Datum wählen → Arbeitstage korrekt berechnet
3. Brückentagsvorschläge: NRW 2025 → Christi Himmelfahrt-Woche erscheint
4. Jahreswechsel: Übertrag aus Vorjahr korrekt übernommen
5. RLS: User A kann Daten von User B nicht sehen
```

**Regeln:**
- E2E Tests simulieren echte User-Aktionen (kein direkter DB-Zugriff)
- Für Unit Tests: `date-holidays` mocken für deterministische Feiertage
- Testdaten über `supabase/seed.sql` — nicht hardcoded in Tests

**Beispiel-Task:**
```
Test-Agent: Schreibe Playwright E2E Test für das Eintragen eines Urlaubs.
User navigiert zu /kalender, wählt KW 30 2025 (Mo-Fr), bestätigt.
Prüfe: 5 Arbeitstage werden angezeigt, Urlaubskonto zeigt 5 Tage weniger.
```

---

## Agent 7: Deploy-Agent

**Rolle:** Kümmert sich um Deployment, CI/CD und Konfiguration.

**Skills die er nutzt:**
- `deploy-to-vercel` (vercel-labs/agent-skills)
- `next-best-practices` (vercel-labs/next-skills)

**Aufgaben:**
- `vercel.json` Konfiguration
- GitHub Actions Workflow (Lint → Typecheck → Test → Deploy)
- Vercel Environment Variables einrichten
- Supabase CLI Setup (`supabase/config.toml`)
- Migrations automatisch bei Deploy ausführen

**Deploy-Pipeline:**
```yaml
on: push to main
  1. npm run lint
  2. npm run typecheck
  3. npx playwright test (Headless)
  4. vercel deploy --prod
  5. npx supabase db push (falls Migrations vorhanden)
```

**Regeln:**
- Niemals `.env.local` committen
- Prod-Secrets nur in Vercel Environment Variables
- `SUPABASE_SERVICE_ROLE_KEY` niemals als `NEXT_PUBLIC_` Variable

**Beispiel-Task:**
```
Deploy-Agent: Erstelle GitHub Actions Workflow der bei Push auf main:
1. Lint und Typecheck durchführt
2. Vercel Preview-Deploy erstellt (für PRs)
3. Vercel Prod-Deploy macht (nur main-Branch)
Nutze 'deploy-to-vercel' Skill.
```

---

## Agenten-Reihenfolge beim Projektstart

Beim ersten Aufbau des Projekts in dieser Reihenfolge vorgehen:

```
Phase 1 (sequenziell):
  Auth-Agent → DB-Agent

Phase 2 (parallel möglich):
  Logik-Agent ↔ UI-Agent

Phase 3 (nach Phase 2):
  Test-Agent

Phase 4 (final):
  Deploy-Agent
```

**Begründung:** Auth und DB müssen zuerst stehen, da alle anderen Agenten
davon abhängen. Logik und UI können parallel entwickelt werden.

---

## Kommunikation zwischen Agenten

- Agenten teilen Code über das gemeinsame Repo — kein direkter API-Aufruf zwischen Agenten
- Typen in `src/types/index.ts` sind die gemeinsame Sprache
- API-Contracts (Request/Response Schemas mit Zod) werden vom Logik-Agenten definiert,
  vom UI-Agenten konsumiert
- Der Orchestrator-Agent reviewed bei Konflikten

---

## Parallelisierung mit `dispatching-parallel-agents` Skill

Wenn du den `dispatching-parallel-agents` Skill installiert hast, kannst du
unabhängige Tasks so starten:

```
# Beispiel: Feature "Vorschlagsseite"
Orchestrator dispatcht parallel:
  - Logik-Agent: /api/vorschlaege Route implementieren
  - UI-Agent: /app/vorschlaege Seite bauen
  - Test-Agent: E2E Tests für Vorschläge vorbereiten
→ Alle drei laufen gleichzeitig, Orchestrator merged am Ende
```
