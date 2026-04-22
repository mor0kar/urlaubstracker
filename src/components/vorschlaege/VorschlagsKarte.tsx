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

function effizienzFarbe(effizienz: number): string {
  if (effizienz >= 3) return 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/40';
  if (effizienz >= 2) return 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40';
  return 'text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700';
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
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${effizienzFarbe(effizienz)}`}
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
                className="inline-flex items-center px-2 py-0.5 rounded-md bg-yellow-50 dark:bg-amber-900/30 border border-yellow-200 dark:border-amber-700 text-xs text-yellow-800 dark:text-amber-300"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Übernehmen-Button */}
      <Link
        href={kalenderLink}
        className="block w-full text-center rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors"
        aria-label={`${titel} im Kalender übernehmen`}
      >
        Im Kalender ansehen
      </Link>
    </div>
  );
}
