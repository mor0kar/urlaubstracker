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

  const akzentGradient = effizienz >= 4
    ? 'linear-gradient(90deg, #3DD68C 0%, #10b981 100%)'
    : effizienz >= 3
      ? 'linear-gradient(90deg, #4A9EFF 0%, #38bdf8 100%)'
      : 'linear-gradient(90deg, #94a3b8 0%, #cbd5e1 100%)';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 transition-all overflow-hidden">
      {/* Gradient-Akzentstreifen */}
      <div className="h-1" style={{ background: akzentGradient }} />

      <div className="p-5">
        {/* Kopfzeile: Effizienz-Badge + Datum */}
        <div className="flex items-start justify-between mb-4">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full"
            style={effizienzStyle(effizienz)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            {effizienz.toFixed(1)}× Effizienz
          </span>
          <span className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
            {formatiereDatumKurz(von)} – {formatiereDatumKurz(bis)}
          </span>
        </div>

        {/* Titel */}
        <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-3">{titel}</h3>

        {/* Gleichung — Urlaubstage => Freie Tage */}
        <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-gray-50 dark:bg-slate-700/40">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 leading-none">{urlaubstage}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              {urlaubstage === 1 ? 'Urlaubstag' : 'Urlaubstage'}
            </p>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="10" viewBox="0 0 24 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 dark:text-slate-600" aria-hidden="true">
              <line x1="0" y1="6" x2="20" y2="6"/>
              <polyline points="14 1 20 6 14 11"/>
            </svg>
            <span className="text-xs text-gray-400 dark:text-slate-500">ergibt</span>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-slate-100 leading-none">{freieTage}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">freie Tage</p>
          </div>
        </div>

        {/* Beteiligte Feiertage */}
        {feiertage.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {feiertage.map((name) => (
              <span
                key={name}
                className="inline-flex items-center px-2 py-0.5 text-xs rounded-full"
                style={{
                  background: 'rgba(74,158,255,0.1)',
                  color: '#7AB8FF',
                  border: '1px solid rgba(74,158,255,0.2)',
                }}
              >
                {name}
              </span>
            ))}
          </div>
        )}

        {/* Im-Kalender-ansehen-Button */}
        <Link
          href={kalenderLink}
          className="flex items-center justify-center gap-2 w-full text-center px-4 py-2.5 text-sm font-medium transition-all rounded-xl hover:opacity-90"
          style={{
            background: 'rgba(74,158,255,0.1)',
            border: '1px solid rgba(74,158,255,0.2)',
            color: '#4A9EFF',
          }}
          aria-label={`${titel} im Kalender ansehen`}
        >
          Im Kalender ansehen
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </Link>
      </div>
    </div>
  );
}
