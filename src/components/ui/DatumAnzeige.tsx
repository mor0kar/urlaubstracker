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
      <div className="px-3 py-2.5">
        <p
          className="font-medium uppercase"
          style={{
            fontSize: '10px',
            color: 'var(--color-primary)',
            letterSpacing: '0.06em',
          }}
        >
          {wochentag}
        </p>
        <p
          className="font-bold leading-tight"
          style={{ fontSize: '22px' }}
        >
          {tag}.
        </p>
        <p
          style={{
            fontSize: '11px',
            color: '#8A9BB5',
          }}
        >
          {monat} {jahr}
        </p>
      </div>
    </div>
  );
}
