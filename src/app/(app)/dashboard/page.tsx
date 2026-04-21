import { Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { berechneKontostatus, formatiereDatumsbereich } from '@/lib/berechnungen';
import type { Urlaubskonto, Urlaubseintrag } from '@/types';

// Das aktuelle Jahr ist 2026
const AKTUELLES_JAHR = 2026;

// ----------------------------------------------------------------
// Teil-Komponenten (alle Server Components)
// ----------------------------------------------------------------

interface UrlaubskontoKarteProps {
  konto: Urlaubskonto;
  eintraege: Urlaubseintrag[];
}

function ÜbertragBanner({ status }: { status: ReturnType<typeof berechneKontostatus> }) {
  if (!status.übertragWarnung) return null;

  if (status.übertragWarnung === 'bald-verfallend') {
    return (
      <div className="rounded-2xl border-2 border-orange-400 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/20 p-5 shadow-sm">
        <div className="flex gap-4 items-start">
          <span className="text-3xl" aria-hidden="true">⚠️</span>
          <div>
            <p className="font-bold text-orange-900 dark:text-orange-200 text-base">
              Übertrag verfällt am 31. März!
            </p>
            <p className="text-orange-800 dark:text-orange-300 text-sm mt-1">
              Du hast noch{' '}
              <strong className="text-orange-900 dark:text-orange-200 text-lg">
                {status.nochNutzbareÜbertragTage}
              </strong>{' '}
              {status.nochNutzbareÜbertragTage === 1 ? 'Übertragstag' : 'Übertragstage'}{' '}
              aus dem Vorjahr. Diese verfallen unwiderruflich am 31. März — jetzt noch Urlaub eintragen!
            </p>
            <Link
              href="/kalender"
              className="inline-flex items-center mt-3 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
            >
              Urlaub jetzt eintragen →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (status.übertragWarnung === 'verfallen') {
    return (
      <div className="rounded-2xl border-2 border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-900/20 p-5 shadow-sm">
        <div className="flex gap-4 items-start">
          <span className="text-3xl" aria-hidden="true">❌</span>
          <div>
            <p className="font-bold text-red-900 dark:text-red-200 text-base">
              {status.verfallenerÜbertrag}{' '}
              {status.verfallenerÜbertrag === 1 ? 'Übertragstag' : 'Übertragstage'} verfallen
            </p>
            <p className="text-red-800 dark:text-red-300 text-sm mt-1">
              Am 31. März {status.jahr} {status.verfallenerÜbertrag === 1 ? 'ist' : 'sind'}{' '}
              <strong>{status.verfallenerÜbertrag}</strong>{' '}
              nicht genutzte{' '}
              {status.verfallenerÜbertrag === 1 ? 'Übertragstag' : 'Übertragstage'}{' '}
              aus {status.jahr - 1} verfallen.
              Dein Jahresanspruch {status.jahr} beträgt jetzt{' '}
              <strong>{status.gesamttage} Tage</strong>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function UrlaubskontoKarte({ konto, eintraege }: UrlaubskontoKarteProps) {
  const status = berechneKontostatus(konto, eintraege);
  const genommenprozent = Math.min(
    100,
    Math.round((status.genommeneTage / status.basisAnspruch) * 100),
  );

  // Übertrag-Badge: immer anzeigen
  const übertragBadge = (() => {
    if (status.uebertragVorjahr === 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500">
          Kein Übertrag
        </span>
      );
    }
    if (status.verfallenerÜbertrag > 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400">
          {status.verfallenerÜbertrag} {status.verfallenerÜbertrag === 1 ? 'Übertragstag' : 'Übertragstage'} verfallen
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
        +{status.uebertragVorjahr} {status.uebertragVorjahr === 1 ? 'Übertragstag' : 'Übertragstage'}
      </span>
    );
  })();

  // Übertrag-Stat: verbleibende nutzbare Übertragstage
  const übertragStatWert = (() => {
    if (status.uebertragVorjahr === 0) return '—';
    if (status.verfallenerÜbertrag > 0) return '0';
    return `+${status.uebertragVorjahr - status.verfallenerÜbertrag}`;
  })();

  return (
    <div className="space-y-4">
    <ÜbertragBanner status={status} />
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
      {/* Kopfzeile */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide">
            Urlaubskonto {status.jahr}
          </h2>
          <p className="text-3xl font-semibold text-gray-900 dark:text-slate-100 mt-1">
            {status.verbleibendeTage}
            <span className="text-lg font-normal text-gray-400 dark:text-slate-500 ml-1">
              / {status.basisAnspruch} Tage verfügbar
            </span>
          </p>
        </div>
        {übertragBadge}
      </div>

      {/* Fortschrittsbalken */}
      <div
        className="h-2.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden mb-4"
        role="progressbar"
        aria-valuenow={status.genommeneTage}
        aria-valuemax={status.basisAnspruch}
        aria-label={`${status.genommeneTage} von ${status.basisAnspruch} Urlaubstagen genommen`}
      >
        <div
          className="h-full bg-green-500 transition-all rounded-full"
          style={{ width: `${genommenprozent}%` }}
        />
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-0.5">Genommen</p>
          <p className="text-xl font-semibold text-gray-900 dark:text-slate-100">
            {status.genommeneTage}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-0.5">Verfügbar</p>
          <p className="text-xl font-semibold text-green-600 dark:text-green-400">
            {status.verbleibendeTage}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-0.5">Übertrag</p>
          <p className={`text-xl font-semibold ${
            übertragStatWert === '—' || übertragStatWert === '0'
              ? 'text-gray-300 dark:text-slate-600'
              : 'text-blue-600 dark:text-blue-400'
          }`}>
            {übertragStatWert}
          </p>
        </div>
      </div>
    </div>
    </div>
  );
}

interface LetzteEintraegeProps {
  eintraege: Urlaubseintrag[];
}

function LetzteEintraege({ eintraege }: LetzteEintraegeProps) {
  if (eintraege.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-4">
          Letzte Einträge
        </h2>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Noch keine Urlaubseinträge vorhanden.{' '}
          <Link href="/kalender" className="text-blue-600 dark:text-blue-400 hover:underline">
            Jetzt eintragen
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">
          Letzte Einträge
        </h2>
        <Link
          href="/kalender"
          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
        >
          Alle ansehen
        </Link>
      </div>

      <ul className="divide-y divide-gray-100 dark:divide-slate-700">
        {eintraege.map((eintrag) => (
          <li key={eintrag.id} className="py-3 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
                {formatiereDatumsbereich(eintrag.von_datum, eintrag.bis_datum)}
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                {eintrag.arbeitstage}{' '}
                {eintrag.arbeitstage === 1 ? 'Arbeitstag' : eintrag.arbeitstage === 0.5 ? 'halber Arbeitstag' : 'Arbeitstage'}
                {eintrag.kommentar && ` · ${eintrag.kommentar}`}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface JahresschnellblickProps {
  konto: Urlaubskonto | undefined;
  eintraege: Urlaubseintrag[];
  jahr: number;
}

function Jahresschnellblick({ konto, eintraege, jahr }: JahresschnellblickProps) {
  if (!konto) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 shadow-sm">
        <p className="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">
          {jahr}
        </p>
        <p className="text-sm text-gray-500 dark:text-slate-400">Kein Konto angelegt</p>
      </div>
    );
  }

  const status = berechneKontostatus(konto, eintraege);
  const verwendetTage = status.genommeneTage + status.beantragteTage;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 shadow-sm">
      <p className="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-2">
        {jahr}
      </p>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-semibold text-gray-900 dark:text-slate-100">
            {verwendetTage}
            <span className="text-sm text-gray-400 dark:text-slate-500 font-normal">
              /{status.basisAnspruch}
            </span>
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Tage verwendet</p>
        </div>
        <p className="text-sm font-medium text-gray-600 dark:text-slate-300">
          {status.verbleibendeTage} frei
        </p>
      </div>
      <div className="mt-3 h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full"
          style={{
            width: `${Math.min(100, Math.round((verwendetTage / status.basisAnspruch) * 100))}%`,
          }}
        />
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// Haupt-Dashboard-Seite (Server Component)
// ----------------------------------------------------------------

export default async function DashboardPage() {
  const supabase = await createClient();

  // Alle Daten parallel laden (kein Wasserfall)
  const [kontenErgebnis, eintraegeErgebnis] = await Promise.all([
    supabase
      .from('urlaubskonten')
      .select('*')
      .order('jahr', { ascending: false }),
    supabase
      .from('urlaubseintraege')
      .select('*')
      .order('von_datum', { ascending: false }),
  ]);

  const alleKonten: Urlaubskonto[] = kontenErgebnis.data ?? [];
  const alleEintraege: Urlaubseintrag[] = eintraegeErgebnis.data ?? [];

  // Aktuelles Konto (2026)
  const aktuellesKonto = alleKonten.find((k) => k.jahr === AKTUELLES_JAHR);

  // Letzte 5 Eintraege (alle Jahre)
  const letzteEintraege = alleEintraege.slice(0, 5);

  // Nur das Vorjahr im Schnellblick anzeigen
  const vorjahr = AKTUELLES_JAHR - 1;
  const eintraegeVorjahr = alleEintraege.filter(
    (e) => new Date(e.von_datum).getFullYear() === vorjahr,
  );
  const kontoVorjahr = alleKonten.find((k) => k.jahr === vorjahr);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Seitentitel */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
          Deine Urlaubsübersicht auf einen Blick
        </p>
      </div>

      <div className="space-y-6">
        {/* Urlaubskonto-Karte (aktuelles Jahr) */}
        {aktuellesKonto ? (
          <UrlaubskontoKarte
            konto={aktuellesKonto}
            eintraege={alleEintraege.filter(
              (e) => new Date(e.von_datum).getFullYear() === AKTUELLES_JAHR,
            )}
          />
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Noch kein Urlaubskonto für {AKTUELLES_JAHR} angelegt.{' '}
              <Link
                href="/einstellungen"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Jetzt einrichten
              </Link>
            </p>
          </div>
        )}

        {/* Letzte Eintraege */}
        <LetzteEintraege eintraege={letzteEintraege} />

        {/* Schnellblick Vorjahr */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">
            Vorjahr
          </h2>
          <Jahresschnellblick
            konto={kontoVorjahr}
            eintraege={eintraegeVorjahr}
            jahr={vorjahr}
          />
        </div>

        {/* Schnelllinks */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/kalender"
            className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 px-4 py-3 text-sm font-medium text-gray-700 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-300 transition-colors shadow-sm"
          >
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
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Kalender öffnen
          </Link>
          <Link
            href="/vorschlaege"
            className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 px-4 py-3 text-sm font-medium text-gray-700 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-300 transition-colors shadow-sm"
          >
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
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Brückentagsvorschläge
          </Link>
          <Link
            href="/einstellungen"
            className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 px-4 py-3 text-sm font-medium text-gray-700 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-300 transition-colors shadow-sm"
          >
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
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
            </svg>
            Einstellungen
          </Link>
        </div>
      </div>
    </div>
  );
}
