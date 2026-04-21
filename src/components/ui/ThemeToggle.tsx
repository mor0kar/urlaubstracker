'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

/**
 * Liest das gespeicherte Theme aus localStorage oder ermittelt
 * die Systemeinstellung via prefers-color-scheme.
 */
function leseGespeichertesTheme(): Theme {
  const gespeichert = localStorage.getItem('theme');
  if (gespeichert === 'dark' || gespeichert === 'light') {
    return gespeichert;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/**
 * Wendet das Theme an, indem die 'dark'-Klasse am html-Element
 * gesetzt oder entfernt wird.
 */
function wendeThemeAn(theme: Theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  localStorage.setItem('theme', theme);
}

/**
 * ThemeToggle — Schalter für Dark/Light Mode.
 * Speichert die Auswahl in localStorage.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');
  const [geladen, setGeladen] = useState(false);

  // Initialisierung: Theme aus localStorage oder Systemeinstellung
  useEffect(() => {
    const initialesTheme = leseGespeichertesTheme();
    setTheme(initialesTheme);
    setGeladen(true);
  }, []);

  const handleToggle = () => {
    const neuesTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(neuesTheme);
    wendeThemeAn(neuesTheme);
  };

  // Während Hydration kein Icon anzeigen, um Flackern zu vermeiden
  if (!geladen) {
    return <div className="w-8 h-8" aria-hidden="true" />;
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={theme === 'dark' ? 'Zu Light Mode wechseln' : 'Zu Dark Mode wechseln'}
      title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
      className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-colors"
    >
      {theme === 'dark' ? (
        /* Sonne-Icon für Light Mode */
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        /* Mond-Icon für Dark Mode */
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
