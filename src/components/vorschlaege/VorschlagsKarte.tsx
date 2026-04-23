import React from 'react';
import Link from 'next/link';

interface VorschlagsKarteProps {
  titel: string;
  von: string;           // YYYY-MM-DD
  bis: string;           // YYYY-MM-DD
  urlaubstage: number;
  freieTage: number;
  effizienz: number;
  feiertage: string[];
}

const MONATSNAMEN_KURZ = [
  'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
  'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez',
];

function formatiereDatumKurz(datumStr: string): string {
  const datum = new Date(datumStr + 'T00:00:00');
  const tag = datum.getDate();
  const monat = MONATSNAMEN_KURZ[datum.getMonth()];
  return `${tag}. ${monat}`;
}

function effizienzStyle(effizienz: number): React.CSSProperties {
  if (effizienz >= 4) {
    return {
      background: 'rgba(61,214,140,0.12)',
      color: '#3DD68C',
      borderRadius: '20px',
    };
  }
  if (effizienz >= 3) {
    return {
      background: 'rgba(74,158,255,0.12)',
      color: '#7AB8FF',
      borderRadius: '20px',
    };
  }
  return {
    background: 'rgba(255,255,255,0.08)',
    color: '#8A9BB5',
    borderRadius: '20px',
  };
}

export default function VorschlagsKarte({
  titel,
  von,
  bis,
  urlaubstage,
  freieTage,
  effizienz,
  feiertage,
}: VorschlagsKarteProps) {
  // Kalender-Link mit Hervorhebungsbereich und passendem Jahr
  const jahr = new Date(von + 'T00:00:00').getFullYear();
  const kalenderLink = `/kalender?jahr=${jahr}&von=${von}&bis=${bis}`;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 transition-all p-5">
      {/* Effizienz-Badge */}
      <div className="flex items-start justify-between mb-3">
        <span
          className="inline-flex items-center px-2.5 py-1 text-xs font-semibold"
          style={effizienzStyle(effizienz)}
        >
          {effizienz.toFixed(1)}x Effizienz
        </span>
        <span className="text-xs text-gray-400 dark:text-slate-500">
          {formatiereDatumKurz(von)} – {formatiereDatumKurz(bis)}
        </span>
      </div>

      {/* Titel */}
      <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-1">{titel}</h3>

      {/* Hauptzahl */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{urlaubstage}</span>
        <span className="text-sm text-gray-500 dark:text-slate-400">
          {urlaubstage === 1 ? 'Urlaubstag' : 'Urlaubstage'} einsetzen
        </span>
        <span className="text-gray-300 dark:text-slate-600 text-lg">=</span>
        <span className="text-xl font-semibold text-gray-900 dark:text-slate-100">{freieTage}</span>
        <span className="text-sm text-gray-500 dark:text-slate-400">freie Tage</span>
      </div>

      {/* Beteiligte Feiertage */}
      {feiertage.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1.5">
            {feiertage.map((name) => (
              <span
                key={name}
                className="inline-flex items-center px-2 py-0.5 text-xs"
                style={{
                  background: 'rgba(74,158,255,0.1)',
                  color: '#7AB8FF',
                  border: '1px solid rgba(74,158,255,0.2)',
                  borderRadius: '20px',
                }}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Im-Kalender-ansehen-Button */}
      <Link
        href={kalenderLink}
        className="block w-full text-center px-4 py-2 text-sm font-medium transition-colors"
        style={{
          background: 'rgba(74,158,255,0.1)',
          border: '1px solid rgba(74,158,255,0.2)',
          color: '#4A9EFF',
          borderRadius: '7px',
        }}
        aria-label={`${titel} im Kalender ansehen`}
      >
        Im Kalender ansehen
      </Link>
    </div>
  );
}
