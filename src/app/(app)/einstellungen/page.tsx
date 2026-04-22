import { createClient } from '@/lib/supabase/server';
import { BUNDESLAENDER, type BundeslandCode } from '@/types';
import EinstellungenFormular from './EinstellungenFormular';
import type { Settings } from '@/types';

export default async function EinstellungenSeite() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Aktuelle Einstellungen laden (kann null sein beim ersten Aufruf)
  const { data: settings } = user
    ? await supabase
        .from('settings')
        .select('*')
        .eq('user_id', user.id)
        .single()
    : { data: null };

  const aktuelleSettings: Settings | null = settings ?? null;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Seitentitel */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Einstellungen</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
          Bundesland und Urlaubsanspruch konfigurieren
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100">
            Persönliche Angaben
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            Diese Angaben werden für die Feiertagsberechnung und den
            Urlaubsanspruch verwendet.
          </p>
        </div>

        <div className="px-6 py-5">
          <EinstellungenFormular
            bundeslaender={BUNDESLAENDER}
            aktuellesBundesland={
              (aktuelleSettings?.bundesland as BundeslandCode | undefined) ??
              'NW'
            }
            aktuelleUrlaubstage={
              aktuelleSettings?.urlaubstage_pro_jahr ?? 30
            }
            aktuellesWochenendeZählt={
              aktuelleSettings?.wochenende_zaehlt ?? false
            }
          />
        </div>
      </div>

      {/* Info-Hinweis */}
      <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl px-5 py-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Hinweis:</strong> Das Bundesland bestimmt welche gesetzlichen
          Feiertage bei der Urlaubsberechnung berücksichtigt werden.
          Brückentagsvorschläge werden ebenfalls bundeslandspezifisch berechnet.
        </p>
      </div>
    </div>
  );
}
