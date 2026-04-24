import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getFeiertage } from '@/lib/feiertage';
import Jahreskalender from '@/components/kalender/Jahreskalender';
import EintraegeTabelle from '@/components/kalender/EintraegeTabelle';
import type { Urlaubseintrag } from '@/types';

interface KalenderSuchparameter {
  jahr?: string;
  von?: string;
  bis?: string;
}

interface KalenderPageProps {
  searchParams: Promise<KalenderSuchparameter>;
}

// Prüft ob ein String ein gültiges YYYY-MM-DD Datum ist
function istGültigesDatum(s: string | undefined): s is string {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export default async function KalenderPage({ searchParams }: KalenderPageProps) {
  const { jahr: jahrParam, von: vonParam, bis: bisParam } = await searchParams;
  const aktuellesJahr = new Date().getFullYear();
  const jahr = jahrParam ? parseInt(jahrParam, 10) : aktuellesJahr;

  // Sicherheitsprüfung: sinnvoller Jahresbereich
  const anzeigeJahr =
    isNaN(jahr) || jahr < 2020 || jahr > 2035 ? aktuellesJahr : jahr;

  // Hervorhebungsbereich aus Brückentagsvorschlag (optional)
  const hervorgehobenVon = istGültigesDatum(vonParam) ? vonParam : undefined;
  const hervorgehobenBis = istGültigesDatum(bisParam) ? bisParam : undefined;

  const supabase = await createClient();

  // Alle Daten parallel laden (kein Wasserfall)
  const [eintraegeErgebnis, einstellungenErgebnis] = await Promise.all([
    supabase
      .from('urlaubseintraege')
      .select('*')
      .gte('von_datum', `${anzeigeJahr}-01-01`)
      .lte('bis_datum', `${anzeigeJahr}-12-31`)
      .order('von_datum', { ascending: true }),
    supabase
      .from('settings')
      .select('bundesland, wochenende_zaehlt')
      .single(),
  ]);

  const eintraege: Urlaubseintrag[] = eintraegeErgebnis.data ?? [];
  const bundesland = einstellungenErgebnis.data?.bundesland ?? 'NW';
  const wochenendeZählt = einstellungenErgebnis.data?.wochenende_zaehlt ?? false;

  // Feiertage serverseitig berechnen und als einfaches Objekt übergeben
  const feiertageListe = getFeiertage(bundesland, anzeigeJahr);
  const feiertageMap: Record<string, string> = {};
  for (const feiertag of feiertageListe) {
    // Lokales Datum ohne Zeitzone-Verschiebung verwenden
    const datum = feiertag.datum;
    const datumStr = `${datum.getFullYear()}-${String(datum.getMonth() + 1).padStart(2, '0')}-${String(datum.getDate()).padStart(2, '0')}`;
    feiertageMap[datumStr] = feiertag.name;
  }

  const vorjahr = anzeigeJahr - 1;
  const naechstesJahr = anzeigeJahr + 1;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Seitentitel und Jahres-Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Kalender</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            Urlaubsübersicht {anzeigeJahr}
          </p>
        </div>

        {/* Jahres-Navigation */}
        <div className="flex items-center gap-2">
          <Link
            href={`/kalender?jahr=${vorjahr}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-slate-100 transition-colors shadow-sm"
            aria-label={`Jahr ${vorjahr} anzeigen`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {vorjahr}
          </Link>

          <span className="px-3 py-2 text-sm font-semibold text-gray-900 dark:text-slate-100 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg min-w-16 text-center">
            {anzeigeJahr}
          </span>

          <Link
            href={`/kalender?jahr=${naechstesJahr}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-slate-100 transition-colors shadow-sm"
            aria-label={`Jahr ${naechstesJahr} anzeigen`}
          >
            {naechstesJahr}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Kalender-Legende */}
      <div className="flex items-start gap-6 mb-5">
        <div className="flex flex-col items-center gap-1">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: 'var(--color-primary)' }}
            aria-hidden="true"
          />
          <span className="text-gray-500 dark:text-slate-400" style={{ fontSize: '10px' }}>Urlaub</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: 'var(--color-warning)' }}
            aria-hidden="true"
          />
          <span className="text-gray-500 dark:text-slate-400" style={{ fontSize: '10px' }}>Feiertag</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span
            className="w-4 h-4 rounded ring-2 ring-blue-500 dark:ring-blue-400 bg-white dark:bg-slate-800 shrink-0"
            aria-hidden="true"
          />
          <span className="text-gray-500 dark:text-slate-400" style={{ fontSize: '10px' }}>Heute</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 bg-gray-300 dark:bg-slate-600"
            aria-hidden="true"
          />
          <span className="text-gray-500 dark:text-slate-400" style={{ fontSize: '10px' }}>Wochenende</span>
        </div>
      </div>

      {/* Bundesland-Hinweis */}
      <div className="mb-5 flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="text-gray-400 dark:text-slate-500"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        Feiertage für Bundesland{' '}
        <strong className="text-gray-700 dark:text-slate-200">{bundesland}</strong> —{' '}
        <Link href="/einstellungen" className="text-blue-600 dark:text-blue-400 hover:underline">
          Ändern
        </Link>
      </div>

      {/* Jahreskalender (Client Component) */}
      <Jahreskalender
        jahr={anzeigeJahr}
        feiertageMap={feiertageMap}
        eintraege={eintraege}
        wochenendeZählt={wochenendeZählt}
        hervorgehobenVon={hervorgehobenVon}
        hervorgehobenBis={hervorgehobenBis}
      />

      {/* Einträgsverwaltung — alle Einträge des Jahres als Tabelle */}
      <EintraegeTabelle
        eintraege={eintraege}
        feiertage={feiertageMap}
        wochenendeZählt={wochenendeZählt}
        jahr={anzeigeJahr}
      />
    </div>
  );
}
