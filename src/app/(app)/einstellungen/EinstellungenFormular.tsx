'use client';

import { useActionState } from 'react';
import { einstellungenSpeichern } from './actions';
import type { BundeslandCode } from '@/types';

interface EinstellungenFormularProps {
  bundeslaender: typeof import('@/types').BUNDESLAENDER;
  aktuellesBundesland: BundeslandCode;
  aktuelleUrlaubstage: number;
  aktuellesWochenendeZählt: boolean;
}

interface Zustand {
  fehler?: string;
  gespeichert?: boolean;
}

const initialZustand: Zustand = {};

export default function EinstellungenFormular({
  bundeslaender,
  aktuellesBundesland,
  aktuelleUrlaubstage,
  aktuellesWochenendeZählt,
}: EinstellungenFormularProps) {
  const [zustand, aktion, lädt] = useActionState<Zustand, FormData>(
    async (_vorheriger, formData) => {
      const ergebnis = await einstellungenSpeichern(formData);
      if (ergebnis.fehler) return { fehler: ergebnis.fehler };
      return { gespeichert: true };
    },
    initialZustand,
  );

  const gespeichert = !lädt && zustand.gespeichert === true;

  return (
    <form action={aktion} className="space-y-6">
      {/* Bundesland */}
      <div>
        <label
          htmlFor="bundesland"
          className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5"
        >
          Bundesland
        </label>
        <select
          id="bundesland"
          name="bundesland"
          defaultValue={aktuellesBundesland}
          className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-900 dark:text-slate-100 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
        >
          {(
            Object.entries(bundeslaender) as [BundeslandCode, string][]
          ).map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
          Bestimmt die gesetzlichen Feiertage in deiner Region.
        </p>
      </div>

      {/* Urlaubstage pro Jahr */}
      <div>
        <label
          htmlFor="urlaubstage_pro_jahr"
          className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5"
        >
          Urlaubstage pro Jahr
        </label>
        <input
          id="urlaubstage_pro_jahr"
          type="number"
          name="urlaubstage_pro_jahr"
          defaultValue={aktuelleUrlaubstage}
          min={1}
          max={50}
          className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-900 dark:text-slate-100 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
          Dein jährlicher Urlaubsanspruch (ohne Übertrag aus dem Vorjahr).
        </p>
      </div>

      {/* Wochenende-Einstellung */}
      <div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <label
              htmlFor="wochenende_zaehlt"
              className="text-sm font-medium text-gray-700 dark:text-slate-300"
            >
              Wochenende zählt als Urlaubstag
            </label>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              Aktivieren wenn Samstag/Sonntag in deinem Betrieb Arbeitstage sind
            </p>
          </div>
          <input
            id="wochenende_zaehlt"
            type="checkbox"
            name="wochenende_zaehlt"
            defaultChecked={aktuellesWochenendeZählt}
            className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-slate-700 shrink-0"
          />
        </div>
      </div>

      {/* Fehlermeldung */}
      {zustand.fehler && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-4 py-3">
          <p className="text-sm text-red-800 dark:text-red-300">{zustand.fehler}</p>
        </div>
      )}

      {/* Erfolgsmeldung */}
      {gespeichert && (
        <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 px-4 py-3">
          <p className="text-sm text-green-800 dark:text-green-300">
            Einstellungen erfolgreich gespeichert.
          </p>
        </div>
      )}

      {/* Speichern-Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={lädt}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {lädt ? 'Wird gespeichert...' : 'Einstellungen speichern'}
        </button>
      </div>
    </form>
  );
}
