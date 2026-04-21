'use client';

import { useEffect, useState } from 'react';

const WOCHENTAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

function formatiereDatum(datum: Date): { wochentag: string; tag: string; monat: string; jahr: string } {
  return {
    wochentag: WOCHENTAGE[datum.getDay()],
    tag: String(datum.getDate()),
    monat: MONATE[datum.getMonth()],
    jahr: String(datum.getFullYear()),
  };
}

// Zeigt das aktuelle Datum in der Seitenleiste an.
// Aktualisiert sich automatisch um Mitternacht.
export default function DatumAnzeige() {
  const [datum, setDatum] = useState<Date | null>(null);

  useEffect(() => {
    setDatum(new Date());

    // Um Mitternacht neu laden
    const jetzt = new Date();
    const msBisMitternacht =
      new Date(jetzt.getFullYear(), jetzt.getMonth(), jetzt.getDate() + 1).getTime() - jetzt.getTime();

    const timer = setTimeout(() => {
      setDatum(new Date());
    }, msBisMitternacht);

    return () => clearTimeout(timer);
  }, []);

  if (!datum) return null;

  const { wochentag, tag, monat, jahr } = formatiereDatum(datum);

  return (
    <div className="px-3 py-3 mb-2">
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl px-3 py-2.5 border border-blue-100 dark:border-blue-800">
        <p className="text-xs text-blue-500 dark:text-blue-400 font-medium">{wochentag}</p>
        <p className="text-lg font-bold text-blue-700 dark:text-blue-300 leading-tight">
          {tag}. {monat}
        </p>
        <p className="text-xs text-blue-400 dark:text-blue-500">{jahr}</p>
      </div>
    </div>
  );
}
