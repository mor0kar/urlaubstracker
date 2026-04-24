'use client';

import { useState } from 'react';
import type { Urlaubseintrag } from '@/types';
import BearbeitenModal from '@/components/kalender/BearbeitenModal';
import { urlaubLöschen } from '@/app/(app)/kalender/actions';
import { alleArbeitstageNeuberechnen } from '@/app/(app)/eintraege/actions';

interface Props {
  eintraege: Urlaubseintrag[];
  feiertage: Record<string, string>;
  wochenendeZählt: boolean;
}

const MONATSNAMEN_KURZ = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

function formatDatum(s: string): string {
  const d = new Date(s + 'T00:00:00');
  return `${d.getDate()}. ${MONATSNAMEN_KURZ[d.getMonth()]}`;
}

function formatArbeitstage(n: number): string {
  if (n === 0.5) return '0,5';
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1).replace('.', ',');
}

export default function AlleEintraegeTabelle({ eintraege, feiertage, wochenendeZählt }: Props) {
  const [bearbeitenEintrag, setBearbeitenEintrag] = useState<Urlaubseintrag | null>(null);
  const [löschKandidat, setLöschKandidat] = useState<string | null>(null);
  const [löschFehler, setLöschFehler] = useState<string | undefined>();
  const [lädt, setLädt] = useState(false);
  const [neuberechnungStatus, setNeuberechnungStatus] = useState<{
    aktualisiert?: number;
    gesamt?: number;
    fehler?: string;
  } | null>(null);
  const [neuberechnungLädt, setNeuberechnungLädt] = useState(false);

  // Nach Jahr gruppieren, neueste Jahre zuerst
  const nachJahr = eintraege.reduce<Record<number, Urlaubseintrag[]>>((acc, e) => {
    const jahr = new Date(e.von_datum + 'T00:00:00').getFullYear();
    (acc[jahr] ??= []).push(e);
    return acc;
  }, {});
  const jahre = Object.keys(nachJahr)
    .map(Number)
    .sort((a, b) => b - a);

  const handleLöschen = async () => {
    if (!löschKandidat) return;
    setLädt(true);
    const result = await urlaubLöschen(löschKandidat);
    setLädt(false);
    if (result.fehler) {
      setLöschFehler(result.fehler);
    } else {
      setLöschKandidat(null);
      setLöschFehler(undefined);
    }
  };

  const handleNeuberechnen = async () => {
    setNeuberechnungLädt(true);
    setNeuberechnungStatus(null);
    const result = await alleArbeitstageNeuberechnen();
    setNeuberechnungLädt(false);
    setNeuberechnungStatus(result);
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {/* Kopfzeile */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">
              Alle Einträge
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              {eintraege.length === 0
                ? 'Keine Einträge vorhanden'
                : `${eintraege.length} ${eintraege.length === 1 ? 'Eintrag' : 'Einträge'} insgesamt`}
            </p>
          </div>
          <button
            type="button"
            onClick={handleNeuberechnen}
            disabled={neuberechnungLädt || eintraege.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-xs font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors shadow-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className={neuberechnungLädt ? 'animate-spin' : undefined}
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {neuberechnungLädt ? 'Berechnet …' : 'Arbeitstage neuberechnen'}
          </button>
        </div>

        {/* Neuberechnungs-Rückmeldung */}
        {neuberechnungStatus && (
          <div
            className={`px-5 py-3 text-xs border-b ${
              neuberechnungStatus.fehler
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300'
                : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            {neuberechnungStatus.fehler
              ? `Fehler: ${neuberechnungStatus.fehler}`
              : neuberechnungStatus.aktualisiert === 0
                ? `Alle ${neuberechnungStatus.gesamt} Einträge sind bereits korrekt.`
                : `${neuberechnungStatus.aktualisiert} von ${neuberechnungStatus.gesamt} Einträgen aktualisiert.`}
          </div>
        )}

        {/* Löschen-Fehler */}
        {löschFehler && (
          <div className="px-5 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-700">
            <p className="text-xs text-red-700 dark:text-red-300">{löschFehler}</p>
          </div>
        )}

        {/* Leerer Zustand */}
        {eintraege.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Noch keine Urlaubseinträge vorhanden.
            </p>
          </div>
        ) : (
          jahre.map((jahr) => {
            const jahresEintraege = [...(nachJahr[jahr] ?? [])].sort((a, b) =>
              b.von_datum.localeCompare(a.von_datum),
            );
            const gesamtUrlaub = jahresEintraege
              .filter((e) => e.typ === 'urlaub')
              .reduce((s, e) => s + e.arbeitstage, 0);
            const gesamtSonder = jahresEintraege
              .filter((e) => e.typ === 'sonderurlaub')
              .reduce((s, e) => s + e.arbeitstage, 0);

            return (
              <div key={jahr}>
                {/* Jahres-Trennzeile */}
                <div className="px-5 py-2 bg-gray-50 dark:bg-slate-700/50 border-y border-gray-100 dark:border-slate-700 flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase tracking-wide">
                    {jahr}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-slate-500">
                    · {jahresEintraege.length} {jahresEintraege.length === 1 ? 'Eintrag' : 'Einträge'}
                    {' · '}{formatArbeitstage(gesamtUrlaub)} Urlaubstage
                    {gesamtSonder > 0 && ` · ${formatArbeitstage(gesamtSonder)} Sonderurlaub`}
                  </span>
                </div>

                {/* Desktop-Tabelle */}
                <div className="hidden sm:block">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                      {jahresEintraege.map((eintrag) => (
                        <tr
                          key={eintrag.id}
                          className={`hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors ${
                            löschKandidat === eintrag.id ? 'bg-red-50 dark:bg-red-900/20' : ''
                          }`}
                        >
                          {/* Zeitraum */}
                          <td className="px-5 py-3 whitespace-nowrap">
                            <span className="font-medium text-gray-900 dark:text-slate-100">
                              {formatDatum(eintrag.von_datum)}
                            </span>
                            {eintrag.von_datum !== eintrag.bis_datum && (
                              <span className="text-gray-400 dark:text-slate-500">
                                {' – '}
                                {formatDatum(eintrag.bis_datum)}
                              </span>
                            )}
                          </td>

                          {/* Arbeitstage-Badge */}
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center justify-center min-w-8 rounded-md px-1.5 py-0.5 text-xs font-semibold ${
                                eintrag.typ === 'sonderurlaub'
                                  ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200'
                                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                              }`}
                            >
                              {formatArbeitstage(eintrag.arbeitstage)}
                            </span>
                            <span className="ml-1 text-xs text-gray-400 dark:text-slate-500">
                              {eintrag.arbeitstage === 1 ? 'Tag' : 'Tage'}
                            </span>
                          </td>

                          {/* Typ */}
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                eintrag.typ === 'sonderurlaub'
                                  ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300'
                              }`}
                            >
                              {eintrag.typ === 'sonderurlaub' ? 'Sonderurlaub' : 'Urlaub'}
                            </span>
                          </td>

                          {/* Kommentar */}
                          <td className="px-3 py-3 text-gray-500 dark:text-slate-400 max-w-xs truncate">
                            {eintrag.kommentar ?? (
                              <span className="text-gray-300 dark:text-slate-600">—</span>
                            )}
                          </td>

                          {/* Aktionen */}
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
                                  {lädt ? '…' : 'Ja'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLöschKandidat(null);
                                    setLöschFehler(undefined);
                                  }}
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
                                  onClick={() => {
                                    setLöschKandidat(eintrag.id);
                                    setLöschFehler(undefined);
                                  }}
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
                  </table>
                </div>

                {/* Mobile-Karten */}
                <div className="sm:hidden divide-y divide-gray-100 dark:divide-slate-700">
                  {jahresEintraege.map((eintrag) => (
                    <div
                      key={eintrag.id}
                      className={`px-4 py-3 ${
                        löschKandidat === eintrag.id ? 'bg-red-50 dark:bg-red-900/20' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                            {formatDatum(eintrag.von_datum)}
                            {eintrag.von_datum !== eintrag.bis_datum &&
                              ` – ${formatDatum(eintrag.bis_datum)}`}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                            {formatArbeitstage(eintrag.arbeitstage)}{' '}
                            {eintrag.arbeitstage === 1 ? 'Arbeitstag' : 'Arbeitstage'}
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
                            {lädt ? '…' : 'Ja, löschen'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setLöschKandidat(null);
                              setLöschFehler(undefined);
                            }}
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
                            onClick={() => {
                              setLöschKandidat(eintrag.id);
                              setLöschFehler(undefined);
                            }}
                            className="flex-1 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                          >
                            Löschen
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
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
