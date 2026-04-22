'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

// Zod-Schema für die Einstellungen-Formulardaten
const EinstellungenSchema = z.object({
  bundesland: z.string().min(2).max(2),
  urlaubstage_pro_jahr: z.coerce.number().int().min(1).max(50),
  // Checkbox sendet 'on' wenn aktiviert, nichts wenn deaktiviert
  wochenende_zaehlt: z.boolean().optional().default(false),
});

/**
 * Speichert die Benutzereinstellungen (Bundesland + Urlaubstage).
 * Führt ein Upsert in der settings-Tabelle durch.
 */
export async function einstellungenSpeichern(
  formData: FormData,
): Promise<{ fehler?: string }> {
  const supabase = await createClient();

  // User-ID immer serverseitig aus der Session holen
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { fehler: 'Nicht authentifiziert. Bitte erneut anmelden.' };
  }

  // Eingaben validieren
  // Checkbox-Wert: 'on' wenn aktiviert, null/fehlend wenn deaktiviert
  const rohdaten = {
    bundesland: formData.get('bundesland'),
    urlaubstage_pro_jahr: formData.get('urlaubstage_pro_jahr'),
    wochenende_zaehlt: formData.get('wochenende_zaehlt') === 'on',
  };

  const ergebnis = EinstellungenSchema.safeParse(rohdaten);
  if (!ergebnis.success) {
    const ersterFehler = ergebnis.error.issues[0];
    return {
      fehler: ersterFehler?.message ?? 'Ungültige Eingabe.',
    };
  }

  const { bundesland, urlaubstage_pro_jahr, wochenende_zaehlt } = ergebnis.data;

  // Upsert: anlegen falls noch nicht vorhanden, sonst aktualisieren
  const { error } = await supabase.from('settings').upsert(
    {
      user_id: user.id,
      bundesland,
      urlaubstage_pro_jahr,
      wochenende_zaehlt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  if (error) {
    console.error('[einstellungenSpeichern] Datenbankfehler:', error);
    return { fehler: 'Einstellungen konnten nicht gespeichert werden.' };
  }

  // Dashboard und Kalender neu laden damit Änderungen sichtbar werden
  revalidatePath('/dashboard');
  revalidatePath('/kalender');
  revalidatePath('/vorschlaege');
  revalidatePath('/einstellungen');

  return {};
}
