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
          <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500" aria-hidden="true">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
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
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
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

  // Übertrag-Badge: nur anzeigen wenn noch relevant
  const übertragBadge = (() => {
    // Kein Übertrag vorhanden → nichts anzeigen
    if (status.uebertragVorjahr === 0) return null;

    // Nach dem 1. April: Übertrag teilweise verfallen
    if (status.übertragFristAbgelaufen && status.verfallenerÜbertrag > 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400">
          {status.verfallenerÜbertrag} {status.verfallenerÜbertrag === 1 ? 'Übertragstag' : 'Übertragstage'} verfallen
        </span>
      );
    }

    // Nach dem 1. April: Übertrag vollständig verbraucht → nichts anzeigen
    if (status.übertragFristAbgelaufen && status.verfallenerÜbertrag === 0) {
      return null;
    }

    // Vor dem 1. April: aktiver Übertrag
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
        +{status.uebertragVorjahr} {status.uebertragVorjahr === 1 ? 'Übertragstag' : 'Übertragstage'}
      </span>
    );
  })();

  // Übertrag-Stat: nur vor dem 1. April oder bei Verfall relevant
  const übertragStatWert = (() => {
    if (status.uebertragVorjahr === 0) return '—';
    if (status.übertragFristAbgelaufen && status.verfallenerÜbertrag === 0) return '—';
    if (status.verfallenerÜbertrag > 0) return '0';
    return `+${status.uebertragVorjahr}`;
  })();

  return (
    <div className="space-y-4">
      <ÜbertragBanner status={status} />
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {/* Gradient-Akzentstreifen */}
        <div
          className="h-1"
          style={{ background: 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-success) 100%)' }}
        />
        <div className="p-6">
          {/* Kopfzeile */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                Urlaubskonto {status.jahr}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-900 dark:text-slate-50 leading-none">
                  {status.verbleibendeTage}
                </span>
                <span className="text-base text-gray-400 dark:text-slate-500 font-normal">
                  / {status.basisAnspruch} verfügbar
                </span>
              </div>
            </div>
            {übertragBadge}
          </div>

          {/* Fortschrittsbalken */}
          <div
            className="h-2 bg-gray-100 dark:bg-slate-700/80 rounded-full overflow-hidden mb-5"
            role="progressbar"
            aria-valuenow={status.genommeneTage}
            aria-valuemax={status.basisAnspruch}
            aria-label={`${status.genommeneTage} von ${status.basisAnspruch} Urlaubstagen genommen`}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${genommenprozent}%`,
                background: 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary) 100%)',
              }}
            />
          </div>

          {/* Statistiken */}
          <div className="grid grid-cols-3 gap-3">
            {/* Genommen */}
            <div className="rounded-xl p-3 bg-gray-50 dark:bg-slate-700/40">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </span>
                <p className="text-xs text-gray-500 dark:text-slate-400 leading-none">Genommen</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-slate-100 leading-none">
                {status.genommeneTage}
              </p>
            </div>

            {/* Verfügbar */}
            <div className="rounded-xl p-3 bg-gray-50 dark:bg-slate-700/40">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
                <p className="text-xs text-gray-500 dark:text-slate-400 leading-none">Verfügbar</p>
              </div>
              <p className="text-2xl font-bold leading-none" style={{ color: 'var(--color-success)' }}>
                {status.verbleibendeTage}
              </p>
            </div>

            {/* Übertrag */}
            <div className="rounded-xl p-3 bg-gray-50 dark:bg-slate-700/40">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-6 h-6 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500 dark:text-orange-400" aria-hidden="true">
                    <polyline points="17 1 21 5 17 9"/>
                    <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                    <polyline points="7 23 3 19 7 15"/>
                    <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                  </svg>
                </span>
                <p className="text-xs text-gray-500 dark:text-slate-400 leading-none">Übertrag</p>
              </div>
              <p className={`text-2xl font-bold leading-none ${
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
          href="/eintraege"
          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
        >
          Alle ansehen
        </Link>
      </div>

      <ul className="divide-y divide-gray-100 dark:divide-slate-700/60">
        {eintraege.map((eintrag) => {
          const istSonder = eintrag.typ === 'sonderurlaub';
          const statusPunktFarbe =
            eintrag.status === 'genehmigt'
              ? 'var(--color-success)'
              : eintrag.status === 'beantragt'
                ? 'var(--color-warning)'
                : 'var(--color-primary)';

          return (
            <li key={eintrag.id} className="py-3 flex items-center gap-3">
              {/* Icon-Box */}
              <span
                className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                  istSonder
                    ? 'bg-purple-50 dark:bg-purple-900/20'
                    : 'bg-blue-50 dark:bg-blue-900/20'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={istSonder ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'} aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
                  {formatiereDatumsbereich(eintrag.von_datum, eintrag.bis_datum)}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  {eintrag.arbeitstage === 0.5 ? '½' : eintrag.arbeitstage}{' '}
                  {eintrag.arbeitstage === 1 ? 'Tag' : 'Tage'}
                  {eintrag.kommentar && ` · ${eintrag.kommentar}`}
                </p>
              </div>
              {/* Status-Dot */}
              <span
                className="shrink-0 rounded-full"
                style={{ width: '6px', height: '6px', backgroundColor: statusPunktFarbe, flexShrink: 0 }}
                aria-hidden="true"
              />
            </li>
          );
        })}
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
            className="group flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 px-4 py-3.5 text-sm font-medium text-gray-700 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all shadow-sm"
          >
            <span className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 flex items-center justify-center transition-colors shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </span>
            <span className="group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">Kalender öffnen</span>
          </Link>
          <Link
            href="/vorschlaege"
            className="group flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 px-4 py-3.5 text-sm font-medium text-gray-700 dark:text-slate-300 hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-md transition-all shadow-sm"
          >
            <span className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/30 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/50 flex items-center justify-center transition-colors shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 dark:text-amber-400" aria-hidden="true">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </span>
            <span className="group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">Brückentagsvorschläge</span>
          </Link>
          <Link
            href="/einstellungen"
            className="group flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 px-4 py-3.5 text-sm font-medium text-gray-700 dark:text-slate-300 hover:border-gray-400 dark:hover:border-slate-500 hover:shadow-md transition-all shadow-sm"
          >
            <span className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-slate-700 group-hover:bg-gray-200 dark:group-hover:bg-slate-600 flex items-center justify-center transition-colors shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 dark:text-slate-400" aria-hidden="true">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
              </svg>
            </span>
            <span className="group-hover:text-gray-900 dark:group-hover:text-slate-100 transition-colors">Einstellungen</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
