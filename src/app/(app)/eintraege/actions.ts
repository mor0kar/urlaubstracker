'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getFeiertage, zähleArbeitstage } from '@/lib/feiertage';

export async function alleArbeitstageNeuberechnen(): Promise<{
  fehler?: string;
  aktualisiert?: number;
  gesamt?: number;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { fehler: 'Nicht authentifiziert.' };

  const { data: einstellungen } = await supabase
    .from('settings')
    .select('bundesland, wochenende_zaehlt')
    .eq('user_id', user.id)
    .single();

  const bundesland = einstellungen?.bundesland ?? 'NW';
  const wochenendeZählt = einstellungen?.wochenende_zaehlt ?? false;

  const { data: eintraege, error } = await supabase
    .from('urlaubseintraege')
    .select('*')
    .eq('user_id', user.id);

  if (error || !eintraege) {
    return { fehler: 'Einträge konnten nicht geladen werden.' };
  }

  let aktualisiert = 0;

  for (const eintrag of eintraege) {
    // Halbe Tage: arbeitstage = 0.5 mit von = bis → korrekt, überspringen
    if (eintrag.arbeitstage === 0.5 && eintrag.von_datum === eintrag.bis_datum) {
      continue;
    }

    const vonJahr = new Date(eintrag.von_datum + 'T00:00:00').getFullYear();
    const bisJahr = new Date(eintrag.bis_datum + 'T00:00:00').getFullYear();

    const feiertage = getFeiertage(bundesland, vonJahr);
    if (bisJahr > vonJahr) {
      feiertage.push(...getFeiertage(bundesland, bisJahr));
    }

    const neueArbeitstage = zähleArbeitstage(
      new Date(eintrag.von_datum + 'T00:00:00'),
      new Date(eintrag.bis_datum + 'T00:00:00'),
      feiertage,
      wochenendeZählt,
    );

    if (neueArbeitstage !== eintrag.arbeitstage && neueArbeitstage > 0) {
      const { error: updateFehler } = await supabase
        .from('urlaubseintraege')
        .update({ arbeitstage: neueArbeitstage })
        .eq('id', eintrag.id)
        .eq('user_id', user.id);

      if (!updateFehler) aktualisiert++;
    }
  }

  revalidatePath('/eintraege');
  revalidatePath('/kalender');
  revalidatePath('/dashboard');

  return { aktualisiert, gesamt: eintraege.length };
}
