import { createClient } from '@/lib/supabase/server';
import { getFeiertage } from '@/lib/feiertage';
import type { Urlaubseintrag } from '@/types';
import AlleEintraegeTabelle from '@/components/eintraege/AlleEintraegeTabelle';

export default async function EintraegePage() {
  const supabase = await createClient();

  const [eintraegeResult, einstellungenResult] = await Promise.all([
    supabase
      .from('urlaubseintraege')
      .select('*')
      .order('von_datum', { ascending: false }),
    supabase
      .from('settings')
      .select('bundesland, wochenende_zaehlt')
      .single(),
  ]);

  const eintraege: Urlaubseintrag[] = eintraegeResult.data ?? [];
  const bundesland = einstellungenResult.data?.bundesland ?? 'NW';
  const wochenendeZählt = einstellungenResult.data?.wochenende_zaehlt ?? false;

  // Feiertage für alle vorhandenen Jahre berechnen (für BearbeitenModal-Vorschau)
  const jahre = [...new Set(eintraege.map((e) => new Date(e.von_datum + 'T00:00:00').getFullYear()))];
  const feiertageMap: Record<string, string> = {};
  for (const jahr of jahre) {
    const feiertage = getFeiertage(bundesland, jahr);
    for (const f of feiertage) {
      const d = f.datum;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      feiertageMap[key] = f.name;
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Einträge</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
          Alle Urlaubseinträge — Bearbeiten zum Neuberechnen der Arbeitstage
        </p>
      </div>

      <AlleEintraegeTabelle
        eintraege={eintraege}
        feiertage={feiertageMap}
        wochenendeZählt={wochenendeZählt}
      />
    </div>
  );
}
