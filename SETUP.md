# SETUP.md — UrlaubsPlaner Projektstart-Checkliste

Schritt-für-Schritt Anleitung um das Projekt aufzubauen.
Abhaken was erledigt ist.

---

## Phase 0: Vorbereitung (einmalig, manuell)

### Accounts & Services
- [x] Supabase-Account erstellen: https://supabase.com (kostenlos)
- [x] Neues Supabase-Projekt anlegen (Region: Frankfurt/EU)
- [x] Vercel-Account verbinden: https://vercel.com (kostenlos, mit GitHub-Login)
- [x] GitHub-Repo erstellen: `urlaubstracker`

### Lokales Setup
```bash
# Next.js Projekt erstellen
npx create-next-app@latest urlaubstracker \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*"

# Umstrukturieren auf src/ Ordner (laut CLAUDE.md)
mkdir src && mv app components lib src/

# Abhängigkeiten installieren
npm install @supabase/supabase-js @supabase/ssr
npm install date-holidays
npm install zod
npm install -D @playwright/test
npm install -D supabase

# Supabase CLI initialisieren
npx supabase init
```

### MCP Server verbinden (in VS Code)
- [ ] Supabase MCP: https://mcp.supabase.com/sse → OAuth autorisieren
- [ ] Playwright MCP: `npx @playwright/mcp` als stdio
- [ ] Verbindung testen: "Zeige mir meine Supabase-Projekte"

### Skills installieren
```bash
bash install-skills.sh
```

---

## Phase 1: Datenbank & Auth (DB-Agent + Auth-Agent)

**Starte mit dem Prompt:**
```
Lese CLAUDE.md und AGENTS.md.
Führe Phase 1 aus:
  - DB-Agent: Erstelle alle Tabellen aus CLAUDE.md mit RLS Policies
  - Auth-Agent: Konfiguriere Supabase Auth mit Magic Link und Next.js Middleware
Nutze den Supabase MCP für Datenbankoperationen.
```

### Erwartete Ergebnisse
- [ ] Tabellen angelegt: `settings`, `urlaubskonten`, `urlaubseintraege`
- [ ] RLS aktiviert und Policies erstellt
- [ ] `src/lib/supabase/client.ts` existiert
- [ ] `src/lib/supabase/server.ts` existiert
- [ ] `src/middleware.ts` schützt `/(app)/` Routen
- [ ] `src/app/(auth)/login/page.tsx` zeigt Magic Link Formular
- [ ] `.env.local` enthält Supabase Keys

---

## Phase 2a: Berechnungslogik (Logik-Agent, parallel zu 2b)

**Prompt:**
```
Logik-Agent: Implementiere die Kernlogik. Nutze TDD (test-driven-development Skill).
Schreibe zuerst Tests, dann Implementierung:
1. src/lib/feiertage.ts — date-holidays Wrapper für alle 16 Bundesländer
2. src/lib/berechnungen.ts — Urlaubskonto: Übertrag, genommen, verbleibend
3. src/lib/brueckentage.ts — Brückentagsalgorithmus (findet optimale Fenster)
4. API Route: /api/vorschlaege — gibt Top-10 Vorschläge zurück
Teste mit NRW 2025 — Christi Himmelfahrt (28. Mai) muss als Vorschlag erscheinen.
```

### Erwartete Ergebnisse
- [ ] `src/lib/feiertage.ts` — alle 16 Länder funktionieren
- [ ] `src/lib/berechnungen.ts` — Konto-Berechnung korrekt
- [ ] `src/lib/brueckentage.ts` — Top-Vorschläge mit Effizienzwert
- [ ] Unit Tests grün

---

## Phase 2b: Benutzeroberfläche (UI-Agent, parallel zu 2a)

**Prompt:**
```
UI-Agent: Baue die UI mit Next.js 15 App Router und Tailwind CSS 4.
Nutze 'next-best-practices' und 'vercel-react-best-practices' Skills.
Seiten:
1. /dashboard — Urlaubskonto-Widget + nächste Vorschläge + anstehende Urlaube
2. /kalender — Jahreskalender zum Eintragen und Anzeigen von Urlaub
3. /vorschlaege — Vollständige Liste der Brückentagsvorschläge
4. /einstellungen — Bundesland auswählen, Urlaubstage/Jahr setzen
Platzhalter für API-Daten sind ok — echte Anbindung in Phase 3.
```

---

## Phase 3: Integration (Orchestrator)

**Prompt:**
```
Orchestrator: Verbinde UI mit Logik und Datenbank.
1. Dashboard: echte Daten aus Supabase laden
2. Kalender: Urlaub eintragen → Supabase → Konto aktualisieren
3. Vorschläge: /api/vorschlaege aufrufen → Karten anzeigen
4. Einstellungen: speichern in settings-Tabelle
Nutze Server Actions für Mutations, Server Components für Data Fetching.
```

---

## Phase 4: Tests (Test-Agent)

**Prompt:**
```
Test-Agent: Schreibe Playwright E2E Tests. Nutze 'webapp-testing' Skill.
Kritische Pfade:
1. Login-Flow (Magic Link)
2. Urlaub eintragen und Konto-Update prüfen
3. Brückentagsvorschläge werden angezeigt
4. Bundesland ändern → Feiertage aktualisieren
Nutze 'verification-before-completion' Skill für Review.
```

---

## Phase 5: Deployment (Deploy-Agent)

**Prompt:**
```
Deploy-Agent: Deploye auf Vercel. Nutze 'deploy-to-vercel' Skill.
1. vercel.json erstellen
2. Env-Vars in Vercel setzen (Supabase Keys)
3. GitHub Actions Workflow: Lint → Typecheck → Test → Deploy
4. Supabase Migrations automatisch ausführen
```

---

## Skills-Übersicht

| Skill | Quelle | Für welchen Agent |
|---|---|---|
| `supabase-postgres-best-practices` | supabase/agent-skills | DB-Agent, Auth-Agent |
| `next-best-practices` | vercel-labs/next-skills | UI-Agent, Auth-Agent |
| `vercel-react-best-practices` | vercel-labs/agent-skills | UI-Agent |
| `systematic-debugging` | obra/superpowers | Alle |
| `test-driven-development` | obra/superpowers | Logik-Agent, Test-Agent |
| `webapp-testing` | anthropics/skills | Test-Agent |
| `finishing-a-development-branch` | obra/superpowers | Alle |
| `dispatching-parallel-agents` | obra/superpowers | Orchestrator |
| `subagent-driven-development` | obra/superpowers | Orchestrator |
| `verification-before-completion` | obra/superpowers | Test-Agent |
| `frontend-design` | anthropics/skills | UI-Agent |
| `tailwind-design-system` | wshobson/agents | UI-Agent |
| `typescript-advanced-types` | wshobson/agents | Logik-Agent |
| `deploy-to-vercel` | vercel-labs/agent-skills | Deploy-Agent |
| `vercel-composition-patterns` | vercel-labs/agent-skills | Deploy-Agent |

## MCP-Server

| MCP | URL / Befehl | Zweck |
|---|---|---|
| Supabase MCP | https://mcp.supabase.com/sse | DB-Ops, Migrations, RLS |
| Playwright MCP | `npx @playwright/mcp` | E2E Testing |
| GitHub MCP | https://api.githubcopilot.com/mcp/ | CI/CD, Issues |
| Filesystem MCP | `npx @modelcontextprotocol/server-filesystem` | Dateizugriff |
