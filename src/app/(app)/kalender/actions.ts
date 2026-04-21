'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getFeiertage, zähleArbeitstage } from '@/lib/feiertage';

// Validierungsschema für einen neuen Urlaubseintrag
const UrlaubAnlegenSchema = z.object({
  von_datum: z.string().date('Ungültiges Von-Datum'),
  bis_datum: z.string().date('Ungültiges Bis-Datum'),
  kommentar: z.string().max(500).optional(),
  typ: z.enum(['urlaub', 'sonderurlaub']),
  halber_tag: z.enum(['true', 'false']).optional(),
});

/**
 * Legt einen neuen Urlaubseintrag an.
 * Berechnet Arbeitstage serverseitig (Feiertage herausgerechnet).
 */
export async function urlaubAnlegen(
  formData: FormData,
): Promise<{ fehler?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { fehler: 'Nicht authentifiziert. Bitte erneut anmelden.' };
  }

  // Eingaben validieren
  const rohdaten = {
    von_datum: formData.get('von_datum'),
    bis_datum: formData.get('bis_datum'),
    kommentar: formData.get('kommentar') || undefined,
    typ: formData.get('typ'),
    halber_tag: formData.get('halber_tag') || undefined,
  };

  const ergebnis = UrlaubAnlegenSchema.safeParse(rohdaten);
  if (!ergebnis.success) {
    const ersterFehler = ergebnis.error.issues[0];
    return { fehler: ersterFehler?.message ?? 'Ungültige Eingabe.' };
  }

  const { von_datum, kommentar, typ, halber_tag } = ergebnis.data;
  let { bis_datum } = ergebnis.data;

  let arbeitstage: number;

  if (halber_tag === 'true') {
    // Halber Tag: Bis-Datum wird auf Von-Datum gesetzt, 0,5 Arbeitstage
    bis_datum = von_datum;
    arbeitstage = 0.5;
  } else {
    // Datumsreihenfolge prüfen
    if (new Date(von_datum) > new Date(bis_datum)) {
      return { fehler: 'Das Von-Datum muss vor dem Bis-Datum liegen.' };
    }

    // Bundesland des Users laden für korrekte Feiertagsberechnung
    const { data: einstellungen } = await supabase
      .from('settings')
      .select('bundesland')
      .eq('user_id', user.id)
      .single();

    const bundesland = einstellungen?.bundesland ?? 'NW';
    const jahr = new Date(von_datum).getFullYear();

    // Feiertage serverseitig berechnen
    const feiertage = getFeiertage(bundesland, jahr);

    // Falls Urlaub über Jahreswechsel geht, auch nächstes Jahr laden
    const bisJahr = new Date(bis_datum).getFullYear();
    if (bisJahr > jahr) {
      feiertage.push(...getFeiertage(bundesland, bisJahr));
    }

    // Arbeitstage berechnen (Wochenenden + Feiertage herausrechnen)
    arbeitstage = zähleArbeitstage(
      new Date(von_datum),
      new Date(bis_datum),
      feiertage,
    );

    if (arbeitstage === 0) {
      return {
        fehler:
          'Der gewählte Zeitraum enthält keine Arbeitstage (nur Wochenenden/Feiertage).',
      };
    }
  }

  // In Datenbank speichern
  const { error } = await supabase.from('urlaubseintraege').insert({
    user_id: user.id,
    von_datum,
    bis_datum,
    arbeitstage,
    kommentar: kommentar ?? null,
    typ,
    status: 'genehmigt',
  });

  if (error) {
    console.error('[urlaubAnlegen] Datenbankfehler:', error);
    return { fehler: 'Urlaub konnte nicht gespeichert werden.' };
  }

  revalidatePath('/kalender');
  revalidatePath('/dashboard');

  return {};
}

/**
 * Löscht einen Urlaubseintrag anhand seiner ID.
 * Prüft dass der Eintrag dem eingeloggten User gehört.
 */
export async function urlaubLöschen(
  id: string,
): Promise<{ fehler?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { fehler: 'Nicht authentifiziert. Bitte erneut anmelden.' };
  }

  if (!id || typeof id !== 'string') {
    return { fehler: 'Ungültige ID.' };
  }

  // RLS stellt sicher dass nur eigene Einträge gelöscht werden können
  const { error } = await supabase
    .from('urlaubseintraege')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('[urlaubLöschen] Datenbankfehler:', error);
    return { fehler: 'Eintrag konnte nicht gelöscht werden.' };
  }

  revalidatePath('/kalender');
  revalidatePath('/dashboard');

  return {};
}

// Validierungsschema für das Bearbeiten eines Eintrags
const UrlaubBearbeitenSchema = z.object({
  id: z.string().uuid('Ungültige ID'),
  von_datum: z.string().date('Ungültiges Von-Datum'),
  bis_datum: z.string().date('Ungültiges Bis-Datum'),
  kommentar: z.string().max(500).optional(),
  typ: z.enum(['urlaub', 'sonderurlaub']),
  halber_tag: z.enum(['true', 'false']).optional(),
});

/**
 * Bearbeitet einen bestehenden Urlaubseintrag.
 * Prüft dass der Eintrag dem eingeloggten User gehört.
 */
export async function urlaubBearbeiten(
  formData: FormData,
): Promise<{ fehler?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { fehler: 'Nicht authentifiziert. Bitte erneut anmelden.' };
  }

  // Eingaben validieren
  const rohdaten = {
    id: formData.get('id'),
    von_datum: formData.get('von_datum'),
    bis_datum: formData.get('bis_datum'),
    kommentar: formData.get('kommentar') || undefined,
    typ: formData.get('typ'),
    halber_tag: formData.get('halber_tag') || undefined,
  };

  const ergebnis = UrlaubBearbeitenSchema.safeParse(rohdaten);
  if (!ergebnis.success) {
    const ersterFehler = ergebnis.error.issues[0];
    return { fehler: ersterFehler?.message ?? 'Ungültige Eingabe.' };
  }

  const { id, von_datum, kommentar, typ, halber_tag } = ergebnis.data;
  let { bis_datum } = ergebnis.data;

  let arbeitstage: number;

  if (halber_tag === 'true') {
    // Halber Tag: Bis-Datum wird auf Von-Datum gesetzt, 0,5 Arbeitstage
    bis_datum = von_datum;
    arbeitstage = 0.5;
  } else {
    // Datumsreihenfolge prüfen
    if (new Date(von_datum) > new Date(bis_datum)) {
      return { fehler: 'Das Von-Datum muss vor dem Bis-Datum liegen.' };
    }

    // Bundesland des Users laden für korrekte Feiertagsberechnung
    const { data: einstellungen } = await supabase
      .from('settings')
      .select('bundesland')
      .eq('user_id', user.id)
      .single();

    const bundesland = einstellungen?.bundesland ?? 'NW';
    const jahr = new Date(von_datum).getFullYear();

    // Feiertage serverseitig berechnen
    const feiertage = getFeiertage(bundesland, jahr);

    // Falls Urlaub über Jahreswechsel geht, auch nächstes Jahr laden
    const bisJahr = new Date(bis_datum).getFullYear();
    if (bisJahr > jahr) {
      feiertage.push(...getFeiertage(bundesland, bisJahr));
    }

    // Arbeitstage berechnen (Wochenenden + Feiertage herausrechnen)
    arbeitstage = zähleArbeitstage(
      new Date(von_datum),
      new Date(bis_datum),
      feiertage,
    );

    if (arbeitstage === 0) {
      return {
        fehler:
          'Der gewählte Zeitraum enthält keine Arbeitstage (nur Wochenenden/Feiertage).',
      };
    }
  }

  // Eintrag aktualisieren — RLS stellt sicher dass nur eigene Einträge geändert werden
  const { error } = await supabase
    .from('urlaubseintraege')
    .update({
      von_datum,
      bis_datum,
      arbeitstage,
      kommentar: kommentar ?? null,
      typ,
    })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('[urlaubBearbeiten] Datenbankfehler:', error);
    return { fehler: 'Eintrag konnte nicht aktualisiert werden.' };
  }

  revalidatePath('/kalender');
  revalidatePath('/dashboard');

  return {};
}
