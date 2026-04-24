'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navLinks: NavLink[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    href: '/kalender',
    label: 'Kalender',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    href: '/eintraege',
    label: 'Einträge',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    href: '/vorschlaege',
    label: 'Vorschläge',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    href: '/einstellungen',
    label: 'Einstellungen',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
      </svg>
    ),
  },
];

/**
 * NavLinks — Desktop-Seitenleisten-Links (vertikal gestapelt).
 */
export function NavLinks() {
  const pfad = usePathname();

  return (
    <nav className="flex flex-col gap-0.5" aria-label="Hauptnavigation">
      {navLinks.map(({ href, label, icon }) => {
        const aktiv = pfad === href || pfad.startsWith(href + '/');
        return (
          <div key={href} className="relative rounded-lg overflow-hidden">
            {aktiv && (
              <span
                className="absolute inset-y-1 left-0 w-[3px] rounded-r-full bg-blue-600 dark:bg-blue-400"
                aria-hidden="true"
              />
            )}
            <Link
              href={href}
              aria-current={aktiv ? 'page' : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all ${
                aktiv
                  ? 'bg-blue-50 dark:bg-blue-900/25 text-blue-700 dark:text-blue-300 font-semibold'
                  : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700/60 hover:text-gray-900 dark:hover:text-slate-100'
              }`}
            >
              {icon}
              {label}
            </Link>
          </div>
        );
      })}
    </nav>
  );
}

/**
 * BottomNavigation — Mobile-Navigation am unteren Bildschirmrand.
 */
export default function BottomNavigation() {
  const pfad = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 flex z-50"
      aria-label="Mobile Navigation"
    >
      {navLinks.map(({ href, label, icon }) => {
        const aktiv = pfad === href || pfad.startsWith(href + '/');
        return (
          <Link
            key={href}
            href={href}
            aria-current={aktiv ? 'page' : undefined}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-xs transition-colors ${
              aktiv
                ? 'text-blue-700 dark:text-blue-400'
                : 'text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'
            }`}
          >
            {icon}
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
