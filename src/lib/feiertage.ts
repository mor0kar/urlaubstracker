// Wrapper um das date-holidays npm-Paket für deutsche Feiertage je Bundesland
import Holidays from 'date-holidays';

export interface Feiertag {
  datum: Date;
  name: string;
}

/**
 * Gibt alle gesetzlichen (public) Feiertage für ein Bundesland und Jahr zurück.
 */
export function getFeiertage(bundesland: string, jahr: number): Feiertag[] {
  const hd = new Holidays('DE', bundesland);
  const feiertage = hd.getHolidays(jahr);

  return feiertage
    .filter((f) => f.type === 'public')
    .map((f) => ({
      datum: new Date(f.date),
      name: f.name,
    }));
}

/**
 * Prüft ob ein Datum ein Feiertag ist.
 * Vergleich nur nach Jahr, Monat, Tag — nicht nach Uhrzeit.
 */
export function istFeiertag(datum: Date, feiertage: Feiertag[]): boolean {
  return feiertage.some(
    (f) =>
      f.datum.getFullYear() === datum.getFullYear() &&
      f.datum.getMonth() === datum.getMonth() &&
      f.datum.getDate() === datum.getDate(),
  );
}

/**
 * Prüft ob ein Datum ein Wochenende ist (Samstag = 6, Sonntag = 0).
 */
export function istWochenende(datum: Date): boolean {
  const tag = datum.getDay();
  return tag === 0 || tag === 6;
}

/**
 * Prüft ob ein Datum ein Arbeitstag ist (kein Wochenende und kein Feiertag).
 */
export function istArbeitstag(datum: Date, feiertage: Feiertag[]): boolean {
  return !istWochenende(datum) && !istFeiertag(datum, feiertage);
}

/**
 * Zählt Arbeitstage zwischen zwei Daten (beide Grenzen inklusiv).
 * Feiertage und Wochenenden werden herausgerechnet.
 */
export function zähleArbeitstage(
  von: Date,
  bis: Date,
  feiertage: Feiertag[],
): number {
  let anzahl = 0;
  const aktuell = new Date(von);
  aktuell.setHours(0, 0, 0, 0);

  const endDatum = new Date(bis);
  endDatum.setHours(0, 0, 0, 0);

  while (aktuell <= endDatum) {
    if (istArbeitstag(aktuell, feiertage)) {
      anzahl++;
    }
    aktuell.setDate(aktuell.getDate() + 1);
  }

  return anzahl;
}

/**
 * Gibt den Feiertagsnamen für ein Datum zurück, oder null wenn kein Feiertag.
 */
export function getFeiertagName(
  datum: Date,
  feiertage: Feiertag[],
): string | null {
  const gefunden = feiertage.find(
    (f) =>
      f.datum.getFullYear() === datum.getFullYear() &&
      f.datum.getMonth() === datum.getMonth() &&
      f.datum.getDate() === datum.getDate(),
  );
  return gefunden?.name ?? null;
}
