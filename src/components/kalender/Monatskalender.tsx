'use client';

import type { Urlaubseintrag } from '@/types';
import KalenderZelle, { type TagTyp } from './KalenderZelle';

// Wochentage-Kürzel (Mo-So)
const WOCHENTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

// Monatsnamen auf Deutsch
const MONATSNAMEN = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

interface MonatskalenderProps {
  jahr: number;
  monat: number; // 0-11
  // Feiertage als Map datum→name (YYYY-MM-DD → Feiertagsname)
  feiertageMap: Record<string, string>;
  // Urlaubseinträge für diesen Monat
  eintraege: Urlaubseintrag[];
  // Wenn true: Wochenenden zählen als Arbeitstage und werden nicht als 'wochenende' markiert
  wochenendeZählt: boolean;
  onUrlaubEintragen: (datum: Date) => void;
  onBearbeiten?: (eintrag: Urlaubseintrag) => void;
}

/**
 * Bestimmt den TagTyp für eine Zelle basierend auf Datum, Feiertagen und Einträgen.
 */
// Lokales Datum als YYYY-MM-DD formatieren — OHNE UTC-Verschiebung.
// datum.toISOString() würde in UTC+2 z.B. den 21. April als "2026-04-20" ausgeben.
function lokalDatumStr(datum: Date): string {
  const j = datum.getFullYear();
  const m = String(datum.getMonth() + 1).padStart(2, '0');
  const t = String(datum.getDate()).padStart(2, '0');
  return `${j}-${m}-${t}`;
}

function bestimmeTagTyp(
  datum: Date,
  feiertageMap: Record<string, string>,
  eintraege: Urlaubseintrag[],
  wochenendeZählt: boolean,
): { tagTyp: TagTyp; feiertagName?: string; eintrag?: Urlaubseintrag } {
  const datumStr = lokalDatumStr(datum);
  const wochentag = datum.getDay();
  const istWE = wochentag === 0 || wochentag === 6;

  // Feiertage immer zuerst prüfen — unabhängig von der Wochenende-Einstellung
  const feiertagName = feiertageMap[datumStr];
  if (feiertagName) {
    return { tagTyp: 'feiertag', feiertagName };
  }

  // Wochenende: nur als solches markieren wenn wochenendeZählt = false
  // Bei wochenendeZählt = true werden Wochenenden wie normale Arbeitstage behandelt
  if (istWE && !wochenendeZählt) {
    return { tagTyp: 'wochenende' };
  }

  // Urlaubseintrag prüfen — für Arbeitstage (inkl. Wochenende wenn wochenendeZählt)
  const eintrag = eintraege.find(
    (e) => e.von_datum <= datumStr && e.bis_datum >= datumStr,
  );

  if (eintrag) {
    if (eintrag.typ === 'sonderurlaub') {
      return { tagTyp: 'sonderurlaub', eintrag };
    }
    return { tagTyp: 'urlaub', eintrag };
  }

  return { tagTyp: 'normal' };
}

export default function Monatskalender({
  jahr,
  monat,
  feiertageMap,
  eintraege,
  wochenendeZählt,
  onUrlaubEintragen,
  onBearbeiten,
}: MonatskalenderProps) {
  // Erster Tag des Monats
  const ersterTag = new Date(jahr, monat, 1);
  // Letzter Tag des Monats
  const letzterTag = new Date(jahr, monat + 1, 0);

  // Wochentag des ersten Tages (0=So, 1=Mo, ... 6=Sa → umrechnen auf Mo=0)
  const ersterWochentag = (ersterTag.getDay() + 6) % 7; // Mo=0, So=6

  // Leere Zellen vor dem ersten Tag
  const leereVorZellen = Array.from({ length: ersterWochentag });

  // Alle Tage des Monats
  const tage = Array.from({ length: letzterTag.getDate() }, (_, i) => {
    return new Date(jahr, monat, i + 1);
  });

  // Leere Zellen nach dem letzten Tag (auffüllen auf vollständige Wochen)
  const gesamtZellen = ersterWochentag + letzterTag.getDate();
  const leereNachZellen = Array.from({
    length: (7 - (gesamtZellen % 7)) % 7,
  });

  return (
    <div>
      {/* Monatsname */}
      <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200 mb-2">
        {MONATSNAMEN[monat]}
      </h3>

      {/* Wochentag-Kopfzeile */}
      <div className="grid grid-cols-7 mb-1">
        {WOCHENTAGE.map((tag) => (
          <div
            key={tag}
            className="text-center text-xs font-medium text-gray-400 dark:text-slate-500 py-1"
            aria-hidden="true"
          >
            {tag}
          </div>
        ))}
      </div>

      {/* Tages-Grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {/* Leere Zellen vor dem ersten Tag */}
        {leereVorZellen.map((_, i) => (
          <div key={`vor-${i}`} className="aspect-square" aria-hidden="true" />
        ))}

        {/* Tage */}
        {tage.map((datum) => {
          const { tagTyp, feiertagName, eintrag } = bestimmeTagTyp(
            datum,
            feiertageMap,
            eintraege,
            wochenendeZählt,
          );
          return (
            <KalenderZelle
              key={datum.toISOString()}
              datum={datum}
              tagTyp={tagTyp}
              feiertagName={feiertagName}
              eintrag={eintrag}
              onUrlaubEintragen={onUrlaubEintragen}
              onBearbeiten={onBearbeiten}
            />
          );
        })}

        {/* Leere Zellen nach dem letzten Tag */}
        {leereNachZellen.map((_, i) => (
          <div key={`nach-${i}`} className="aspect-square" aria-hidden="true" />
        ))}
      </div>
    </div>
  );
}
