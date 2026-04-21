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
  if (effizienz >= 3) return 'text-green-700 bg-green-100';
  if (effizienz >= 2) return 'text-blue-700 bg-blue-100';
  return 'text-gray-700 bg-gray-100';
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
  // Kalender-Link mit vorausgefülltem Datum
  const kalenderLink = `/kalender?von=${von}&bis=${bis}`;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all p-5">
      {/* Effizienz-Badge */}
      <div className="flex items-start justify-between mb-3">
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${effizienzFarbe(effizienz)}`}
        >
          {effizienz.toFixed(1)}x Effizienz
        </span>
        <span className="text-xs text-gray-400">
          {formatiereDatumKurz(von)} – {formatiereDatumKurz(bis)}
        </span>
      </div>

      {/* Titel */}
      <h3 className="text-base font-semibold text-gray-900 mb-1">{titel}</h3>

      {/* Hauptzahl */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-3xl font-bold text-blue-600">{urlaubstage}</span>
        <span className="text-sm text-gray-500">
          {urlaubstage === 1 ? 'Urlaubstag' : 'Urlaubstage'} einsetzen
        </span>
        <span className="text-gray-300 text-lg">=</span>
        <span className="text-xl font-semibold text-gray-900">{freieTage}</span>
        <span className="text-sm text-gray-500">freie Tage</span>
      </div>

      {/* Beteiligte Feiertage */}
      {feiertage.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1.5">
            {feiertage.map((name) => (
              <span
                key={name}
                className="inline-flex items-center px-2 py-0.5 rounded-md bg-yellow-50 border border-yellow-200 text-xs text-yellow-800"
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
        className="block w-full text-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        aria-label={`${titel} im Kalender übernehmen`}
      >
        Im Kalender ansehen
      </Link>
    </div>
  );
}
