'use client';

import { useState, useEffect } from 'react';

// Lokales Datum als YYYY-MM-DD ohne UTC-Verschiebung
function lokalDatumStr(datum: Date): string {
  const j = datum.getFullYear();
  const m = String(datum.getMonth() + 1).padStart(2, '0');
  const t = String(datum.getDate()).padStart(2, '0');
  return `${j}-${m}-${t}`;
}
import type { Urlaubseintrag } from '@/types';
import Monatskalender from './Monatskalender';
import UrlaubsModal from './UrlaubsModal';
import BearbeitenModal from './BearbeitenModal';

interface JahreskalenderProps {
  jahr: number;
  // Feiertage als Map datum→name (YYYY-MM-DD → Feiertagsname)
  feiertageMap: Record<string, string>;
  // Alle Urlaubseinträge für das Jahr
  eintraege: Urlaubseintrag[];
  // Wenn true: Wochenenden zählen als Arbeitstage (Schicht-/Wochenendbetrieb)
  wochenendeZählt: boolean;
  // Optionaler Hervorhebungsbereich (aus Brückentagsvorschlag)
  hervorgehobenVon?: string;
  hervorgehobenBis?: string;
}

export default function Jahreskalender({
  jahr,
  feiertageMap,
  eintraege,
  wochenendeZählt,
  hervorgehobenVon,
  hervorgehobenBis,
}: JahreskalenderProps) {
  // State für Neu-Anlegen-Modal
  const [modalDatum, setModalDatum] = useState<Date | null>(null);
  // State für Bearbeiten-Modal
  const [bearbeitenEintrag, setBearbeitenEintrag] = useState<Urlaubseintrag | null>(null);

  // Zum hervorgehobenen Monat scrollen, sobald die Seite geladen ist
  useEffect(() => {
    if (!hervorgehobenVon) return;
    const monat = new Date(hervorgehobenVon + 'T00:00:00').getMonth();
    const el = document.getElementById(`kalender-monat-${monat}`);
    if (el) {
      // Kurze Verzögerung damit das Layout vollständig gerendert ist
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [hervorgehobenVon]);

  const handleUrlaubEintragen = (datum: Date) => {
    setModalDatum(datum);
  };

  const handleModalSchließen = () => {
    setModalDatum(null);
  };

  const handleBearbeitenÖffnen = (eintrag: Urlaubseintrag) => {
    setBearbeitenEintrag(eintrag);
  };

  const handleBearbeitenSchließen = () => {
    setBearbeitenEintrag(null);
  };

  return (
    <>
      {/* 12-Monats-Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 12 }, (_, monat) => {
          // Einträge für diesen Monat filtern (lokal formatiert, kein UTC-Versatz)
          const monatsBeginn = lokalDatumStr(new Date(jahr, monat, 1));
          const monatsEnde = lokalDatumStr(new Date(jahr, monat + 1, 0));

          const monatsEintraege = eintraege.filter(
            (e) => e.von_datum <= monatsEnde && e.bis_datum >= monatsBeginn,
          );

          return (
            <div
              key={monat}
              id={`kalender-monat-${monat}`}
              className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 shadow-sm scroll-mt-4"
            >
              <Monatskalender
                jahr={jahr}
                monat={monat}
                feiertageMap={feiertageMap}
                eintraege={monatsEintraege}
                wochenendeZählt={wochenendeZählt}
                hervorgehobenVon={hervorgehobenVon}
                hervorgehobenBis={hervorgehobenBis}
                onUrlaubEintragen={handleUrlaubEintragen}
                onBearbeiten={handleBearbeitenÖffnen}
              />
            </div>
          );
        })}
      </div>

      {/* Legende */}
      <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {/* Urlaub */}
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: '#4A9EFF' }}
              aria-hidden="true"
            />
            <span className="text-xs text-gray-600 dark:text-slate-300">Urlaub</span>
          </div>
          {/* Feiertag */}
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: '#F59E0B' }}
              aria-hidden="true"
            />
            <span className="text-xs text-gray-600 dark:text-slate-300">Feiertag</span>
          </div>
          {/* Heute */}
          <div className="flex items-center gap-2">
            <span
              className="inline-flex w-4 h-4 rounded items-center justify-center ring-2 ring-blue-500 dark:ring-blue-400 bg-white dark:bg-slate-800 shrink-0"
              aria-hidden="true"
            />
            <span className="text-xs text-gray-600 dark:text-slate-300">Heute</span>
          </div>
          {/* Wochenende */}
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full shrink-0 bg-gray-300 dark:bg-slate-600"
              aria-hidden="true"
            />
            <span className="text-xs text-gray-600 dark:text-slate-300">Wochenende</span>
          </div>
          {/* Sonderurlaub */}
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full shrink-0 bg-purple-400 dark:bg-purple-500"
              aria-hidden="true"
            />
            <span className="text-xs text-gray-600 dark:text-slate-300">Sonderurlaub</span>
          </div>
          {/* Vorschlag-Indikator — nur wenn aktiv */}
          {hervorgehobenVon && (
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full shrink-0 bg-teal-400 dark:bg-teal-500"
                aria-hidden="true"
              />
              <span className="text-xs text-gray-600 dark:text-slate-300">Vorschlag</span>
            </div>
          )}
        </div>
      </div>

      {/* Urlaub-eintragen-Modal */}
      {modalDatum && (
        <UrlaubsModal
          vonDatum={lokalDatumStr(modalDatum)}
          onSchließen={handleModalSchließen}
          feiertage={feiertageMap}
          wochenendeZählt={wochenendeZählt}
        />
      )}

      {/* Urlaub-bearbeiten-Modal */}
      {bearbeitenEintrag && (
        <BearbeitenModal
          eintrag={bearbeitenEintrag}
          onSchließen={handleBearbeitenSchließen}
          feiertage={feiertageMap}
          wochenendeZählt={wochenendeZählt}
        />
      )}
    </>
  );
}

