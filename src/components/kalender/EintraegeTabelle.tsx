'use client';

import { useState } from 'react';
import type { Urlaubseintrag } from '@/types';
import BearbeitenModal from './BearbeitenModal';
import { urlaubLöschen } from '@/app/(app)/kalender/actions';

interface EintraegeTabelleProp {
  eintraege: Urlaubseintrag[];
  feiertage: Record<string, string>;
  wochenendeZählt: boolean;
  jahr: number;
}

const MONATSNAMEN_KURZ = [
  'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun',
  'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez',
];

function formatDatum(s: string): string {
  const d = new Date(s + 'T00:00:00');
  return `${d.getDate()}. ${MONATSNAMEN_KURZ[d.getMonth()]}`;
}

function formatArbeitstage(n: number): string {
  if (n === 0.5) return '0,5';
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1).replace('.', ',');
}

export default function EintraegeTabelle({
  eintraege,
  feiertage,
  wochenendeZählt,
  jahr,
}: EintraegeTabelleProp) {
  const [bearbeitenEintrag, setBearbeitenEintrag] = useState<Urlaubseintrag | null>(null);
  const [löschKandidat, setLöschKandidat] = useState<string | null>(null);
  const [löschFehler, setLöschFehler] = useState<string | undefined>();
  const [lädt, setLädt] = useState(false);

  const handleLöschen = async () => {
    if (!löschKandidat) return;
    setLädt(true);
    const ergebnis = await urlaubLöschen(löschKandidat);
    setLädt(false);
    if (ergebnis.fehler) {
      setLöschFehler(ergebnis.fehler);
    } else {
      setLöschKandidat(null);
      setLöschFehler(undefined);
    }
  };

  // Neueste zuerst
  const sortiert = [...eintraege].sort(
    (a, b) => b.von_datum.localeCompare(a.von_datum),
  );

  const urlaubseintraege = sortiert.filter((e) => e.typ === 'urlaub');
  const sonderurlaubseintraege = sortiert.filter((e) => e.typ === 'sonderurlaub');

  const gesamtUrlaub = urlaubseintraege.reduce((s, e) => s + e.arbeitstage, 0);
  const gesamtSonderurlaub = sonderurlaubseintraege.reduce((s, e) => s + e.arbeitstage, 0);

  return (
    <>
      <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {/* Kopfzeile */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">
              Alle Einträge {jahr}
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              {sortiert.length === 0
                ? 'Keine Einträge'
                : `${sortiert.length} ${sortiert.length === 1 ? 'Eintrag' : 'Einträge'} · ${formatArbeitstage(gesamtUrlaub)} Urlaubstage`}
            </p>
          </div>
        </div>

        {/* Fehleranzeige */}
        {löschFehler && (
          <div className="px-5 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-700">
            <p className="text-sm text-red-700 dark:text-red-300">{löschFehler}</p>
          </div>
        )}

        {/* Leerer Zustand */}
        {sortiert.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Noch keine Einträge für {jahr} vorhanden.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop-Tabelle */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-700/50 text-left">
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                      Von
                    </th>
                    <th className="px-3 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                      Bis
                    </th>
                    <th className="px-3 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide text-right">
                      Tage
                    </th>
                    <th className="px-3 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                      Art
                    </th>
                    <th className="px-3 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                      Kommentar
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide text-right">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {sortiert.map((eintrag) => (
                    <tr
                      key={eintrag.id}
                      className={`group hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors ${
                        löschKandidat === eintrag.id
                          ? 'bg-red-50 dark:bg-red-900/20'
                          : ''
                      }`}
                    >
                      <td className="px-5 py-3 font-medium text-gray-900 dark:text-slate-100 whitespace-nowrap">
                        {formatDatum(eintrag.von_datum)}
                      </td>
                      <td className="px-3 py-3 text-gray-600 dark:text-slate-300 whitespace-nowrap">
                        {eintrag.von_datum === eintrag.bis_datum
                          ? <span className="text-gray-300 dark:text-slate-600">—</span>
                          : formatDatum(eintrag.bis_datum)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-gray-900 dark:text-slate-100 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center justify-center min-w-8 rounded-md px-1.5 py-0.5 text-xs font-semibold ${
                            eintrag.typ === 'sonderurlaub'
                              ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                          }`}
                        >
                          {formatArbeitstage(eintrag.arbeitstage)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-gray-600 dark:text-slate-300 whitespace-nowrap">
                        {eintrag.typ === 'sonderurlaub' ? 'Sonderurlaub' : 'Urlaub'}
                      </td>
                      <td className="px-3 py-3 text-gray-500 dark:text-slate-400 max-w-48 truncate">
                        {eintrag.kommentar ?? (
                          <span className="text-gray-300 dark:text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        {löschKandidat === eintrag.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                              Wirklich löschen?
                            </span>
                            <button
                              type="button"
                              onClick={handleLöschen}
                              disabled={lädt}
                              className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
                            >
                              {lädt ? '...' : 'Ja'}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setLöschKandidat(null); setLöschFehler(undefined); }}
                              className="rounded-md border border-gray-300 dark:border-slate-600 px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                            >
                              Abbrechen
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setBearbeitenEintrag(eintrag)}
                              className="rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                            >
                              Bearbeiten
                            </button>
                            <button
                              type="button"
                              onClick={() => { setLöschKandidat(eintrag.id); setLöschFehler(undefined); }}
                              className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-2.5 py-1 text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                            >
                              Löschen
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Summenzeile */}
                <tfoot>
                  <tr className="bg-gray-50 dark:bg-slate-700/50 border-t border-gray-200 dark:border-slate-600">
                    <td colSpan={2} className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                      Gesamt
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="inline-flex items-center justify-center min-w-8 rounded-md px-1.5 py-0.5 text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                        {formatArbeitstage(gesamtUrlaub)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500 dark:text-slate-400">
                      Urlaubstage
                      {gesamtSonderurlaub > 0 && (
                        <span className="ml-2 text-purple-600 dark:text-purple-400">
                          + {formatArbeitstage(gesamtSonderurlaub)} Sonderurlaub
                        </span>
                      )}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile-Karten */}
            <div className="sm:hidden divide-y divide-gray-100 dark:divide-slate-700">
              {sortiert.map((eintrag) => (
                <div
                  key={eintrag.id}
                  className={`px-4 py-3 ${
                    löschKandidat === eintrag.id
                      ? 'bg-red-50 dark:bg-red-900/20'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                        {formatDatum(eintrag.von_datum)}
                        {eintrag.von_datum !== eintrag.bis_datum && (
                          <> – {formatDatum(eintrag.bis_datum)}</>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                        {formatArbeitstage(eintrag.arbeitstage)}{' '}
                        {eintrag.arbeitstage === 0.5 ? 'halber Arbeitstag' : eintrag.arbeitstage === 1 ? 'Arbeitstag' : 'Arbeitstage'}
                        {' · '}
                        {eintrag.typ === 'sonderurlaub' ? 'Sonderurlaub' : 'Urlaub'}
                        {eintrag.kommentar && ` · ${eintrag.kommentar}`}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center justify-center min-w-8 rounded-md px-1.5 py-0.5 text-xs font-bold ${
                        eintrag.typ === 'sonderurlaub'
                          ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                      }`}
                    >
                      {formatArbeitstage(eintrag.arbeitstage)}
                    </span>
                  </div>

                  {löschKandidat === eintrag.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-600 dark:text-red-400 font-medium flex-1">
                        Wirklich löschen?
                      </span>
                      <button
                        type="button"
                        onClick={handleLöschen}
                        disabled={lädt}
                        className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
                      >
                        {lädt ? '...' : 'Ja, löschen'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setLöschKandidat(null); setLöschFehler(undefined); }}
                        className="rounded-md border border-gray-300 dark:border-slate-600 px-3 py-1 text-xs font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        Abbrechen
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setBearbeitenEintrag(eintrag)}
                        className="flex-1 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                      >
                        Bearbeiten
                      </button>
                      <button
                        type="button"
                        onClick={() => { setLöschKandidat(eintrag.id); setLöschFehler(undefined); }}
                        className="flex-1 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                      >
                        Löschen
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Mobile Summe */}
              <div className="px-4 py-3 bg-gray-50 dark:bg-slate-700/50">
                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                  Gesamt: {formatArbeitstage(gesamtUrlaub)} Urlaubstage
                  {gesamtSonderurlaub > 0 && (
                    <span className="ml-1 text-purple-600 dark:text-purple-400">
                      + {formatArbeitstage(gesamtSonderurlaub)} Sonderurlaub
                    </span>
                  )}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bearbeiten-Modal */}
      {bearbeitenEintrag && (
        <BearbeitenModal
          eintrag={bearbeitenEintrag}
          onSchließen={() => setBearbeitenEintrag(null)}
          feiertage={feiertage}
          wochenendeZählt={wochenendeZählt}
        />
      )}
    </>
  );
}
