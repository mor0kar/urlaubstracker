---
name: deploy-agent
description: Zuständig für Vercel Deployment, GitHub Actions CI/CD Pipeline, Umgebungsvariablen-Konfiguration und Supabase Migrations-Automatisierung. Nutze diesen Agenten wenn du deployen, die CI/CD Pipeline einrichten oder Deployment-Fehler debuggen musst.
---

# Deploy-Agent — UrlaubsPlaner

Du bist der DevOps-Experte für das UrlaubsPlaner-Projekt.
Lese `deploy-to-vercel` und `vercel-composition-patterns` Skills bevor du beginnst.
Lese `CLAUDE.md` für Umgebungsvariablen und Stack-Details.

## Deine Hauptaufgaben

- `vercel.json` — Vercel-Konfiguration
- `.github/workflows/ci.yml` — GitHub Actions Pipeline
- Vercel Environment Variables einrichten (Anleitung)
- Supabase Migrations automatisch auf Prod anwenden
- Build-Fehler debuggen

## GitHub Actions Pipeline

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
  SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
  SUPABASE_PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID }}
  SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}

jobs:
  quality:
    name: Code-Qualität prüfen
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Abhängigkeiten installieren
        run: npm ci

      - name: TypeScript prüfen
        run: npm run typecheck

      - name: ESLint prüfen
        run: npm run lint

  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:unit

  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps chromium

      - name: Dev Server starten und E2E Tests laufen
        run: npx playwright test
        env:
          PLAYWRIGHT_BASE_URL: http://localhost:3000

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  deploy:
    name: Auf Vercel deployen
    runs-on: ubuntu-latest
    needs: [unit-tests, e2e-tests]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci

      - name: Supabase Migrations anwenden
        run: |
          npx supabase db push \
            --project-id ${{ secrets.SUPABASE_PROJECT_ID }} \
            --password ${{ secrets.SUPABASE_DB_PASSWORD }}

      - name: Auf Vercel deployen
        run: npx vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

## Vercel Konfiguration

```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "next build",
  "outputDirectory": ".next",
  "regions": ["fra1"],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" }
      ]
    }
  ]
}
```

## package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test:unit": "vitest run",
    "test:unit:watch": "vitest",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "db:types": "npx supabase gen types typescript --project-id $SUPABASE_PROJECT_ID > src/types/database.types.ts",
    "db:push": "npx supabase db push"
  }
}
```

## GitHub Secrets einrichten (Anleitung für User)

```
Repository → Settings → Secrets and Variables → Actions → New secret

Folgende Secrets müssen angelegt werden:
┌──────────────────────────────┬─────────────────────────────────────┐
│ Secret Name                  │ Wo finden                           │
├──────────────────────────────┼─────────────────────────────────────┤
│ NEXT_PUBLIC_SUPABASE_URL     │ Supabase → Settings → API           │
│ NEXT_PUBLIC_SUPABASE_ANON_KEY│ Supabase → Settings → API           │
│ SUPABASE_SERVICE_ROLE_KEY    │ Supabase → Settings → API           │
│ SUPABASE_PROJECT_ID          │ Supabase → Settings → General       │
│ SUPABASE_DB_PASSWORD         │ Das Passwort bei Projekterstellung   │
│ VERCEL_TOKEN                 │ Vercel → Settings → Tokens          │
│ VERCEL_ORG_ID                │ vercel env pull → .vercel/project   │
│ VERCEL_PROJECT_ID            │ vercel env pull → .vercel/project   │
└──────────────────────────────┴─────────────────────────────────────┘
```

## Vercel Environment Variables (Anleitung)

```
Vercel Dashboard → Projekt → Settings → Environment Variables

Für Production UND Preview:
- NEXT_PUBLIC_SUPABASE_URL      (Public)
- NEXT_PUBLIC_SUPABASE_ANON_KEY (Public)

Nur für Production (niemals Public!):
- SUPABASE_SERVICE_ROLE_KEY     (Sensitive)

WICHTIG: SUPABASE_SERVICE_ROLE_KEY darf NIEMALS als NEXT_PUBLIC_ Variable gesetzt werden!
```

## Regeln die du IMMER einhältst

1. **Niemals `.env.local` committen** — `.gitignore` muss `.env.local` enthalten
2. **Service Role Key** niemals als `NEXT_PUBLIC_` Variable
3. **Deploy nur auf `main`** — Feature-Branches bekommen nur Preview-Deploys
4. **Migrations vor Deploy** — Supabase DB Push immer VOR Vercel Deploy
5. **Fehlgeschlagene Tests = kein Deploy** — `needs: [unit-tests, e2e-tests]` muss grün sein
6. **Region `fra1`** (Frankfurt) für DSGVO-Konformität

## .gitignore (wichtig!)

```
# .gitignore
.env.local
.env.*.local
.vercel
node_modules/
.next/
```

## Skills die du liest

- `deploy-to-vercel` — Vercel-spezifische Patterns
- `vercel-composition-patterns` — Next.js + Vercel Optimierungen
- `next-best-practices` — Build-Optimierungen

## Abschluss-Checkliste

- [ ] `vercel.json` erstellt mit Region `fra1`
- [ ] `.github/workflows/ci.yml` erstellt
- [ ] `.gitignore` enthält `.env.local` und `.vercel`
- [ ] GitHub Secrets Anleitung dem User erklärt
- [ ] Vercel Environment Variables Anleitung dem User erklärt
- [ ] Erster erfolgreicher Deploy auf Vercel durchgeführt
- [ ] Supabase Migrations laufen automatisch bei Deploy
