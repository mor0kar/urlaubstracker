#!/bin/bash
# install-skills.sh — Alle Skills für UrlaubsPlaner installieren
# Ausführen im Projektroot: bash install-skills.sh
# Voraussetzung: Claude Code muss installiert sein (npm i -g @anthropic-ai/claude-code)

echo "🚀 Installiere Skills für UrlaubsPlaner..."

# ─── KERN-SKILLS ───────────────────────────────────────────────────────────────

# 1. Supabase Postgres Best Practices (PFLICHT — zentrale Datenbank)
echo "📦 Supabase Postgres Best Practices..."
npx skills add https://github.com/supabase/agent-skills --skill supabase-postgres-best-practices

# 2. Next.js Best Practices (PFLICHT — Next.js 15 App Router)
echo "📦 Next.js Best Practices..."
npx skills add https://github.com/vercel-labs/next-skills --skill next-best-practices

# 3. React Best Practices (PFLICHT — React Server Components)
echo "📦 Vercel React Best Practices..."
npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-react-best-practices

# ─── ENTWICKLUNGS-SKILLS ───────────────────────────────────────────────────────

# 4. Systematic Debugging (schon vorhanden — falls nicht: installieren)
echo "📦 Systematic Debugging..."
npx skills add https://github.com/obra/superpowers --skill systematic-debugging

# 5. Test-Driven Development (für Berechnungslogik — Pflicht!)
echo "📦 Test-Driven Development..."
npx skills add https://github.com/obra/superpowers --skill test-driven-development

# 6. Webapp Testing (Playwright E2E)
echo "📦 Webapp Testing..."
npx skills add https://github.com/anthropics/skills --skill webapp-testing

# 7. Finishing a Development Branch (schon vorhanden — falls nicht)
echo "📦 Finishing a Development Branch..."
npx skills add https://github.com/obra/superpowers --skill finishing-a-development-branch

# ─── AGENTEN-SKILLS ────────────────────────────────────────────────────────────

# 8. Dispatching Parallel Agents (für Orchestrator-Pattern)
echo "📦 Dispatching Parallel Agents..."
npx skills add https://github.com/obra/superpowers --skill dispatching-parallel-agents

# 9. Subagent-Driven Development (Workflow für Multi-Agent)
echo "📦 Subagent-Driven Development..."
npx skills add https://github.com/obra/superpowers --skill subagent-driven-development

# 10. Verification Before Completion (Qualitätsprüfung)
echo "📦 Verification Before Completion..."
npx skills add https://github.com/obra/superpowers --skill verification-before-completion

# ─── UI & DESIGN ───────────────────────────────────────────────────────────────

# 11. Frontend Design (schon vorhanden — falls nicht)
echo "📦 Frontend Design..."
npx skills add https://github.com/anthropics/skills --skill frontend-design

# 12. Tailwind Design System (Tailwind v4 Patterns)
echo "📦 Tailwind Design System..."
npx skills add https://github.com/wshobson/agents --skill tailwind-design-system

# 13. TypeScript Advanced Types (für komplexe Zod-Schemas)
echo "📦 TypeScript Advanced Types..."
npx skills add https://github.com/wshobson/agents --skill typescript-advanced-types

# ─── DEPLOYMENT ────────────────────────────────────────────────────────────────

# 14. Deploy to Vercel
echo "📦 Deploy to Vercel..."
npx skills add https://github.com/vercel-labs/agent-skills --skill deploy-to-vercel

# 15. Vercel Composition Patterns (Next.js + Vercel Optimierungen)
echo "📦 Vercel Composition Patterns..."
npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-composition-patterns

echo ""
echo "✅ Alle Skills installiert!"
echo ""
echo "Installierte Skills:"
echo "  Kern:        supabase-postgres-best-practices, next-best-practices, vercel-react-best-practices"
echo "  Dev:         systematic-debugging, test-driven-development, webapp-testing, finishing-a-development-branch"
echo "  Agenten:     dispatching-parallel-agents, subagent-driven-development, verification-before-completion"
echo "  UI/Design:   frontend-design, tailwind-design-system, typescript-advanced-types"
echo "  Deployment:  deploy-to-vercel, vercel-composition-patterns"
