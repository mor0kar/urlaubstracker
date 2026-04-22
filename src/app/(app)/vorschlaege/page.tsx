import { createClient } from '@/lib/supabase/server';
import { findeOptimaleUrlaube } from '@/lib/brückentage';
import VorschlagsKarte from '@/components/vorschlaege/VorschlagsKarte';

// Das aktuelle Jahr ist 2026 (laut Projektkontext)
const AKTUELLES_JAHR = new Date().getFullYear();
// Maximale Urlaubstage pro Vorschlag
const MAX_URLAUBSTAGE = 5;

export default async function VorschlaegeSeite() {
  const supabase = await createClient();

  // Bundesland des Users laden
  const { data: einstellungen } = await supabase
    .from('settings')
    .select('bundesland, urlaubstage_pro_jahr')
    .single();

  const bundesland = einstellungen?.bundesland ?? 'NW';

  // Brückentagsvorschläge berechnen — nur zukünftige anzeigen
  const heute = new Date();
  heute.setHours(0, 0, 0, 0);

  const vorschlaege = findeOptimaleUrlaube(
    bundesland,
    AKTUELLES_JAHR,
    MAX_URLAUBSTAGE,
  ).filter((v) => v.bis >= heute);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Seitentitel */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">
          Brückentagsvorschläge
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
          Optimale Urlaubsfenster für {AKTUELLES_JAHR} in{' '}
          <strong className="text-gray-700 dark:text-slate-300">{bundesland}</strong>
        </p>
      </div>

      {/* Erklärungsbanner */}
      <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-5 py-4">
        <p className="text-sm text-green-900 dark:text-green-300">
          <strong>Wie funktioniert das?</strong> Der Algorithmus findet Fenster
          wo du mit möglichst wenigen Urlaubstagen möglichst viele freie Tage
          bekommst — indem du Brückentage zwischen Feiertagen und Wochenenden
          nutzt.
        </p>
      </div>

      {/* Vorschläge */}
      {vorschlaege.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-8 text-center shadow-sm">
          <p className="text-gray-500 dark:text-slate-400 text-sm">
            Keine Brückentagsvorschläge für {AKTUELLES_JAHR} gefunden.
          </p>
          <p className="text-gray-400 dark:text-slate-500 text-xs mt-2">
            Überprüfe dein Bundesland in den{' '}
            <a href="/einstellungen" className="text-blue-600 dark:text-blue-400 hover:underline">
              Einstellungen
            </a>
            .
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">
            {vorschlaege.length}{' '}
            {vorschlaege.length === 1 ? 'Vorschlag' : 'Vorschläge'} gefunden —
            sortiert nach Kalender-Reihenfolge
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vorschlaege.map((vorschlag, index) => {
              const vonStr = `${vorschlag.von.getFullYear()}-${String(vorschlag.von.getMonth() + 1).padStart(2, '0')}-${String(vorschlag.von.getDate()).padStart(2, '0')}`;
              const bisStr = `${vorschlag.bis.getFullYear()}-${String(vorschlag.bis.getMonth() + 1).padStart(2, '0')}-${String(vorschlag.bis.getDate()).padStart(2, '0')}`;

              return (
                <VorschlagsKarte
                  key={`${vonStr}-${index}`}
                  titel={vorschlag.titel}
                  von={vonStr}
                  bis={bisStr}
                  urlaubstage={vorschlag.urlaubstage}
                  freieTage={vorschlag.freieTage}
                  effizienz={vorschlag.effizienz}
                  feiertage={vorschlag.feiertage}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
