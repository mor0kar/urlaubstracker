'use client';

import { useState } from 'react';
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
}

export default function Jahreskalender({
  jahr,
  feiertageMap,
  eintraege,
  wochenendeZählt,
}: JahreskalenderProps) {
  // State für Neu-Anlegen-Modal
  const [modalDatum, setModalDatum] = useState<Date | null>(null);
  // State für Bearbeiten-Modal
  const [bearbeitenEintrag, setBearbeitenEintrag] = useState<Urlaubseintrag | null>(null);

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
          // Einträge für diesen Monat filtern
          const monatsBeginn = new Date(jahr, monat, 1)
            .toISOString()
            .slice(0, 10);
          const monatsEnde = new Date(jahr, monat + 1, 0)
            .toISOString()
            .slice(0, 10);

          const monatsEintraege = eintraege.filter(
            (e) => e.von_datum <= monatsEnde && e.bis_datum >= monatsBeginn,
          );

          return (
            <div
              key={monat}
              className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 shadow-sm"
            >
              <Monatskalender
                jahr={jahr}
                monat={monat}
                feiertageMap={feiertageMap}
                eintraege={monatsEintraege}
                wochenendeZählt={wochenendeZählt}
                onUrlaubEintragen={handleUrlaubEintragen}
                onBearbeiten={handleBearbeitenÖffnen}
              />
            </div>
          );
        })}
      </div>

      {/* Legende */}
      <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">
          Legende
        </h3>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <LegendeEintrag farbe="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600" label="Arbeitstag" />
          <LegendeEintrag farbe="bg-[var(--color-weekend)]" label="Wochenende" />
          <LegendeEintrag farbe="bg-[var(--color-warning-light)]" label="Feiertag" />
          <LegendeEintrag farbe="bg-[var(--color-vacation)]" label="Urlaub" />
          <LegendeEintrag farbe="bg-purple-100 dark:bg-purple-900/40" label="Sonderurlaub" />
        </div>
      </div>

      {/* Urlaub-eintragen-Modal */}
      {modalDatum && (
        <UrlaubsModal
          vonDatum={modalDatum.toISOString().slice(0, 10)}
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

function LegendeEintrag({
  farbe,
  label,
}: {
  farbe: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-block w-4 h-4 rounded ${farbe}`}
        aria-hidden="true"
      />
      <span className="text-xs text-gray-600 dark:text-slate-300">{label}</span>
    </div>
  );
}
