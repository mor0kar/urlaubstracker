'use client';

import { useState } from 'react';
import type { Urlaubseintrag } from '@/types';
import { urlaubLöschen } from '@/app/(app)/kalender/actions';

export type TagTyp =
  | 'normal'
  | 'wochenende'
  | 'feiertag'
  | 'urlaub'
  | 'sonderurlaub'
  | 'leer';

interface KalenderZelleProps {
  datum: Date;
  tagTyp: TagTyp;
  feiertagName?: string;
  eintrag?: Urlaubseintrag;
  istHeute?: boolean;
  istHervorgehoben?: boolean;
  onUrlaubEintragen?: (datum: Date) => void;
  onBearbeiten?: (eintrag: Urlaubseintrag) => void;
}

const zellenKlassen: Record<TagTyp, string> = {
  normal:
    'bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer',
  wochenende:
    'bg-[var(--color-weekend)] dark:bg-slate-700/60 text-gray-400 dark:text-slate-500 cursor-default',
  feiertag:
    'bg-amber-50 dark:bg-amber-800/30 text-gray-700 dark:text-amber-200 cursor-default',
  urlaub:
    'bg-blue-200 dark:bg-blue-600 text-blue-900 dark:text-white cursor-pointer',
  sonderurlaub:
    'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 cursor-pointer',
  leer: 'bg-gray-50 dark:bg-slate-900',
};

export default function KalenderZelle({
  datum,
  tagTyp,
  feiertagName,
  eintrag,
  istHeute = false,
  istHervorgehoben = false,
  onUrlaubEintragen,
  onBearbeiten,
}: KalenderZelleProps) {
  const [tooltipSichtbar, setTooltipSichtbar] = useState(false);
  const [löschFehler, setLöschFehler] = useState<string | undefined>();

  if (tagTyp === 'leer') {
    return (
      <div className="aspect-square" aria-hidden="true" />
    );
  }

  const tagNummer = datum.getDate();
  const datumString = datum.toISOString().slice(0, 10);

  // Hervorhebung (Vorschlag) nur bei normal/wochenende anwenden — Urlaub/Feiertag behalten ihre Farbe
  const hervorgehobenKlasse =
    istHervorgehoben && (tagTyp === 'normal' || tagTyp === 'wochenende')
      ? tagTyp === 'wochenende'
        ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 cursor-default'
        : 'bg-teal-100 dark:bg-teal-700/50 text-teal-900 dark:text-teal-100 hover:bg-teal-200 dark:hover:bg-teal-700/70 cursor-pointer'
      : zellenKlassen[tagTyp];

  const handleKlick = () => {
    if (tagTyp === 'feiertag' || tagTyp === 'wochenende') return;
    if (eintrag) {
      setTooltipSichtbar((v) => !v);
    } else if (tagTyp === 'normal' && onUrlaubEintragen) {
      onUrlaubEintragen(datum);
    }
  };

  const handleLöschen = async () => {
    if (!eintrag) return;
    setLöschFehler(undefined);
    const ergebnis = await urlaubLöschen(eintrag.id);
    if (ergebnis.fehler) {
      setLöschFehler(ergebnis.fehler);
    } else {
      setTooltipSichtbar(false);
    }
  };

  const handleBearbeiten = () => {
    if (!eintrag || !onBearbeiten) return;
    setTooltipSichtbar(false);
    onBearbeiten(eintrag);
  };

  return (
    <div className="relative aspect-square">
      <button
        type="button"
        onClick={handleKlick}
        aria-label={`${tagNummer}. ${feiertagName ?? (eintrag ? `Urlaub: ${eintrag.kommentar ?? eintrag.typ}` : 'Arbeitstag')}`}
        title={feiertagName}
        className={`
          w-full h-full flex items-center justify-center rounded text-xs font-medium
          transition-colors relative
          ${hervorgehobenKlasse}
          ${istHeute ? 'ring-2 ring-blue-500 dark:ring-blue-400 ring-inset' : ''}
        `}
        data-datum={datumString}
      >
        <span
          className={
            istHeute
              ? 'w-5 h-5 flex items-center justify-center rounded-full bg-blue-600 dark:bg-blue-500 text-white font-bold leading-none'
              : undefined
          }
        >
          {tagNummer}
        </span>
        {/* Feiertag-Punkt */}
        {tagTyp === 'feiertag' && (
          <span
            className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-yellow-500"
            aria-hidden="true"
          />
        )}
      </button>

      {/* Tooltip/Popover für belegte Tage */}
      {tooltipSichtbar && eintrag && (
        <>
          {/* Hintergrund-Overlay zum Schließen */}
          <button
            type="button"
            className="fixed inset-0 z-10"
            onClick={() => setTooltipSichtbar(false)}
            aria-label="Popover schließen"
            tabIndex={-1}
          />
          <div
            role="tooltip"
            className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg p-3"
          >
            <p className="text-xs font-semibold text-gray-900 dark:text-slate-100 mb-1 capitalize">
              {eintrag.typ === 'sonderurlaub' ? 'Sonderurlaub' : 'Urlaub'}
            </p>
            {eintrag.kommentar && (
              <p className="text-xs text-gray-600 dark:text-slate-300 mb-2">{eintrag.kommentar}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">
              {eintrag.arbeitstage}{' '}
              {eintrag.arbeitstage === 1 ? 'Arbeitstag' : eintrag.arbeitstage === 0.5 ? 'halber Arbeitstag' : 'Arbeitstage'}
            </p>
            {löschFehler && (
              <p className="text-xs text-red-600 dark:text-red-400 mb-1">{löschFehler}</p>
            )}
            <div className="flex gap-1.5">
              {/* Bearbeiten-Button */}
              {onBearbeiten && (
                <button
                  type="button"
                  onClick={handleBearbeiten}
                  className="flex-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                >
                  Bearbeiten
                </button>
              )}
              {/* PDF-Download-Button */}
              <a
                href={`/api/urlaubsantrag?id=${eintrag.id}`}
                download
                className="flex-1 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-center"
              >
                PDF
              </a>
              {/* Löschen-Button */}
              <button
                type="button"
                onClick={handleLöschen}
                className="flex-1 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-2 py-1 text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                Löschen
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
