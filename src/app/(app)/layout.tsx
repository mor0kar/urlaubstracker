import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { NavLinks } from '@/components/ui/Navigation';
import BottomNavigation from '@/components/ui/Navigation';
import LogoutButton from '@/components/ui/LogoutButton';
import DatumAnzeige from '@/components/ui/DatumAnzeige';
import ThemeToggle from '@/components/ui/ThemeToggle';

// Layout für alle authentifizierten Seiten der App
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-[var(--color-bg-app)]">
      {/* Desktop-Seitenleiste */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen bg-white dark:bg-[var(--color-bg-sidebar)] border-r border-gray-200 dark:border-slate-700/50 shrink-0">
        {/* App-Brand mit Gradient-Logo-Mark */}
        <div className="px-4 py-5 border-b border-gray-100 dark:border-slate-700/50">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
              style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, #38bdf8 100%)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 leading-tight">UrlaubsPlaner</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 truncate leading-tight mt-0.5">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Navigationslinks */}
        <div className="flex-1 overflow-y-auto py-4">
          <DatumAnzeige />
          <div className="px-3">
            <NavLinks />
          </div>
        </div>

        {/* Theme-Toggle und Logout am unteren Rand */}
        <div className="px-3 py-4 border-t border-gray-100 dark:border-slate-700 space-y-1">
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-xs text-gray-400 dark:text-slate-500">Theme</span>
            <ThemeToggle />
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* Hauptinhalt */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-40">
          <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">
            UrlaubsPlaner
          </span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </header>

        {/* Seiteninhalt — Abstand nach unten für mobile Bottom-Nav */}
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom-Navigation */}
      <BottomNavigation />
    </div>
  );
}
