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
        {/* App-Name und User-E-Mail */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-700">
          <span className="text-base font-semibold text-gray-900 dark:text-slate-100">
            UrlaubsPlaner
          </span>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 truncate">{user.email}</p>
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
