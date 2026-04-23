import type { Urlaubskonto, Urlaubseintrag, Urlaubskontostatus } from '@/types';

/**
 * Berechnet den Urlaubskontostatus für ein bestimmtes Jahr.
 *
 * Übertrag-Regelung (§ 7 BUrlG):
 * Übertragene Urlaubstage aus dem Vorjahr verfallen am 31. März des laufenden Jahres.
 * Tage die vor dem 1. April genommen wurden verbrauchen zuerst den Übertrag.
 * Der nicht genutzte Rest des Übertrags verfällt nach dem 31. März ersatzlos.
 */
export function berechneKontostatus(
  konto: Urlaubskonto,
  eintraege: Urlaubseintrag[],
): Urlaubskontostatus {
  // gesamttage = reiner Basisanspruch des Jahres (ohne Übertrag)
  // Effektiv verfügbar = gesamttage + uebertrag_aus_vorjahr (solange Frist läuft)
  const basisAnspruch = konto.gesamttage;
  const übertrag = konto.uebertrag_aus_vorjahr;

  // Übertrag-Frist: 1. April des jeweiligen Jahres (lokal)
  const übertragFrist = new Date(konto.jahr, 3, 1); // Monat 3 = April
  const heute = new Date();
  const übertragFristAbgelaufen = heute >= übertragFrist;

  // Nur eigene Urlaubseinträge (keine abgelehnten, kein Sonderurlaub)
  const urlaubseintraege = eintraege.filter(
    (e) =>
      new Date(e.von_datum).getFullYear() === konto.jahr &&
      e.status !== 'abgelehnt' &&
      e.typ === 'urlaub',
  );

  const genommeneTage = urlaubseintraege.reduce(
    (summe, e) => summe + e.arbeitstage,
    0,
  );

  // Warnzeitraum: gesamter März
  const warnungStart = new Date(konto.jahr, 2, 1); // 1. März
  const imWarnzeitraum =
    !übertragFristAbgelaufen &&
    heute >= warnungStart &&
    übertrag > 0;

  // April-Meldezeitraum: 1. April bis 30. April
  const aprilEnde = new Date(konto.jahr, 4, 1); // 1. Mai
  const imAprilMeldezeitraum = übertragFristAbgelaufen && heute < aprilEnde;

  let effektivesGesamttage: number;
  let verfallenerÜbertrag = 0;
  let nochNutzbareÜbertragTage = 0;

  if (übertragFristAbgelaufen && übertrag > 0) {
    // Tage vor dem 1. April verbrauchen zuerst den Übertrag
    const tageVorApril = urlaubseintraege
      .filter((e) => new Date(e.von_datum + 'T00:00:00') < übertragFrist)
      .reduce((summe, e) => summe + e.arbeitstage, 0);

    const verbrauchterÜbertrag = Math.min(übertrag, tageVorApril);
    verfallenerÜbertrag = übertrag - verbrauchterÜbertrag;
    effektivesGesamttage = basisAnspruch + verbrauchterÜbertrag;
  } else {
    // Übertrag läuft noch — volle Summe verfügbar
    effektivesGesamttage = basisAnspruch + übertrag;

    if (imWarnzeitraum) {
      // Noch nicht verbrauchte Übertragstage berechnen
      const bisherVerbraucht = urlaubseintraege
        .filter((e) => new Date(e.von_datum + 'T00:00:00') < heute)
        .reduce((summe, e) => summe + e.arbeitstage, 0);

      nochNutzbareÜbertragTage = Math.max(0, übertrag - bisherVerbraucht);
    }
  }

  // Warnung bestimmen
  let übertragWarnung: 'bald-verfallend' | 'verfallen' | null = null;
  if (imWarnzeitraum && nochNutzbareÜbertragTage > 0) {
    übertragWarnung = 'bald-verfallend';
  } else if (imAprilMeldezeitraum && verfallenerÜbertrag > 0) {
    übertragWarnung = 'verfallen';
  }

  return {
    jahr: konto.jahr,
    basisAnspruch,
    gesamttage: effektivesGesamttage,
    uebertragVorjahr: konto.uebertrag_aus_vorjahr,
    genommeneTage,
    beantragteTage: 0,
    verbleibendeTage: effektivesGesamttage - genommeneTage,
    verfallenerÜbertrag,
    nochNutzbareÜbertragTage,
    übertragFristAbgelaufen,
    übertragWarnung,
  };
}

/**
 * Formatiert ein Datum als lesbaren deutschen String (z.B. "15. Juli 2026").
 */
export function formatiereDatum(datum: string): string {
  return new Date(datum).toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Formatiert einen Datumsbereich als lesbaren String (z.B. "15.–19. Juli 2026").
 * Bei gleichem Von- und Bis-Datum: nur ein Datum anzeigen (z.B. "20. April 2026").
 */
export function formatiereDatumsbereich(von: string, bis: string): string {
  const vonDatum = new Date(von + 'T00:00:00');
  const bisDatum = new Date(bis + 'T00:00:00');

  // Gleicher Tag: nur einmal anzeigen
  if (von === bis) {
    return vonDatum.toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  // Gleicher Monat und gleich Jahr: "15.–19. Juli 2026"
  if (
    vonDatum.getMonth() === bisDatum.getMonth() &&
    vonDatum.getFullYear() === bisDatum.getFullYear()
  ) {
    const tag1 = vonDatum.toLocaleDateString('de-DE', { day: 'numeric' });
    const tag2 = bisDatum.toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return `${tag1}–${tag2}`;
  }

  // Unterschiedliche Monate oder Jahre
  return `${vonDatum.toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'short',
  })} – ${bisDatum.toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;
}
