// Algorithmus zur Berechnung optimaler Brückentag-Urlaubsfenster
import {
  getFeiertage,
  istArbeitstag,
  istFeiertag,
  istWochenende,
  getFeiertagName,
  type Feiertag,
} from './feiertage';

export interface Vorschlag {
  von: Date;           // Erster Tag des freien Blocks (inkl. WE/Feiertage)
  bis: Date;           // Letzter Tag des freien Blocks (inkl. WE/Feiertage)
  urlaubstage: number; // Einzusetzende Arbeitstage (Urlaubstage die man braucht)
  freieTage: number;   // Gesamte freie Tage im Block
  effizienz: number;   // freieTage / urlaubstage — höher = besser
  feiertage: string[]; // Namen der beteiligten Feiertage
  titel: string;       // Kurzbeschreibung, z.B. "Christi Himmelfahrt"
}

/**
 * Berechnet für ein Datum-Fenster die Anzahl benötigter Urlaubstage und die Effizienz.
 */
function berechneVorschlag(
  von: Date,
  bis: Date,
  feiertage: Feiertag[],
): { urlaubstage: number; freieTage: number; feiertagNamen: string[] } {
  let urlaubstage = 0;
  let freieTage = 0;
  const feiertagNamen: string[] = [];

  const aktuell = new Date(von);
  aktuell.setHours(0, 0, 0, 0);
  const endDatum = new Date(bis);
  endDatum.setHours(0, 0, 0, 0);

  while (aktuell <= endDatum) {
    freieTage++;

    if (istFeiertag(aktuell, feiertage)) {
      const name = getFeiertagName(aktuell, feiertage);
      if (name && !feiertagNamen.includes(name)) {
        feiertagNamen.push(name);
      }
    } else if (!istWochenende(aktuell)) {
      // Arbeitstag der kein Feiertag ist → Urlaubstag nötig
      urlaubstage++;
    }

    aktuell.setDate(aktuell.getDate() + 1);
  }

  return { urlaubstage, freieTage, feiertagNamen };
}

/**
 * Erweitert ein Datum-Fenster um angrenzende Wochenenden.
 * Z.B. Freitag Feiertag → Block beginnt schon am Samstag davor nicht.
 * Tatsächlich: WE vor dem Block und WE nach dem Block mit einbeziehen.
 */
function erweitereUmWochenenden(von: Date, bis: Date): { von: Date; bis: Date } {
  const neuesVon = new Date(von);
  const neuesBis = new Date(bis);

  // Wochenende vor dem Block einbeziehen
  const tagVorher = new Date(neuesVon);
  tagVorher.setDate(tagVorher.getDate() - 1);
  while (istWochenende(tagVorher)) {
    neuesVon.setDate(neuesVon.getDate() - 1);
    tagVorher.setDate(tagVorher.getDate() - 1);
  }

  // Wochenende nach dem Block einbeziehen
  const tagDanach = new Date(neuesBis);
  tagDanach.setDate(tagDanach.getDate() + 1);
  while (istWochenende(tagDanach)) {
    neuesBis.setDate(neuesBis.getDate() + 1);
    tagDanach.setDate(tagDanach.getDate() + 1);
  }

  return { von: neuesVon, bis: neuesBis };
}

/**
 * Findet optimale Urlaubsfenster basierend auf Feiertagen.
 * Prüft alle Feiertag-Cluster und erweitert sie um angrenzende Arbeitstage.
 *
 * @param bundesland  Bundesland-Code (z.B. 'NW')
 * @param jahr        Kalenderjahr
 * @param maxUrlaubstage  Maximale Anzahl einzusetzender Urlaubstage pro Vorschlag
 */
export function findeOptimaleUrlaube(
  bundesland: string,
  jahr: number,
  maxUrlaubstage: number,
): Vorschlag[] {
  const feiertage = getFeiertage(bundesland, jahr);
  const vorschlaege: Vorschlag[] = [];
  const verarbeiteteVon = new Set<string>();

  for (const feiertag of feiertage) {
    // Für jeden Feiertag: Fenster von -3 bis +3 Arbeitstagen drumherum prüfen
    for (let vorTagen = 0; vorTagen <= 4; vorTagen++) {
      for (let nachTagen = 0; nachTagen <= 4; nachTagen++) {
        // Startpunkt: X Arbeitstage vor dem Feiertag
        const vonDatum = new Date(feiertag.datum);
        let arbeitstagZähler = 0;

        // Gehe zurück um vorTagen Arbeitstage
        const temp = new Date(feiertag.datum);
        while (arbeitstagZähler < vorTagen) {
          temp.setDate(temp.getDate() - 1);
          if (istArbeitstag(temp, feiertage)) {
            arbeitstagZähler++;
          }
        }
        vonDatum.setTime(temp.getTime());

        // Endpunkt: Y Arbeitstage nach dem Feiertag
        const bisDatum = new Date(feiertag.datum);
        arbeitstagZähler = 0;

        const temp2 = new Date(feiertag.datum);
        while (arbeitstagZähler < nachTagen) {
          temp2.setDate(temp2.getDate() + 1);
          if (istArbeitstag(temp2, feiertage)) {
            arbeitstagZähler++;
          }
        }
        bisDatum.setTime(temp2.getTime());

        // Wochenenden einbeziehen
        const { von, bis } = erweitereUmWochenenden(vonDatum, bisDatum);

        const schlüssel = `${von.toISOString().slice(0, 10)}-${bis.toISOString().slice(0, 10)}`;
        if (verarbeiteteVon.has(schlüssel)) continue;

        const { urlaubstage, freieTage, feiertagNamen } = berechneVorschlag(
          von,
          bis,
          feiertage,
        );

        // Nur interessante Vorschläge: mindestens 1 Urlaubstag, max Limit, Effizienz > 1
        if (
          urlaubstage < 1 ||
          urlaubstage > maxUrlaubstage ||
          freieTage <= urlaubstage
        ) {
          continue;
        }

        // Kein reines Wochenend-Cluster ohne Urlaubstage
        if (feiertagNamen.length === 0) continue;

        verarbeiteteVon.add(schlüssel);

        const effizienz = freieTage / urlaubstage;

        vorschlaege.push({
          von,
          bis,
          urlaubstage,
          freieTage,
          effizienz,
          feiertage: feiertagNamen,
          titel: feiertagNamen[0] ?? 'Brückentag',
        });
      }
    }
  }

  // Duplikate entfernen (gleiche Von/Bis) und nach Effizienz sortieren
  const einzigartig = vorschlaege.sort((a, b) => b.effizienz - a.effizienz);

  // Überlappende Vorschläge zusammenführen — behalte pro Feiertag-Cluster den effizientesten
  const gefiltert: Vorschlag[] = [];
  for (const vorschlag of einzigartig) {
    const hatÜberlappung = gefiltert.some(
      (v) => v.von <= vorschlag.bis && v.bis >= vorschlag.von,
    );
    if (!hatÜberlappung) {
      gefiltert.push(vorschlag);
    } else {
      // Prüfe ob dieser Vorschlag effizienter ist
      const überlappenderIdx = gefiltert.findIndex(
        (v) => v.von <= vorschlag.bis && v.bis >= vorschlag.von,
      );
      if (
        überlappenderIdx >= 0 &&
        vorschlag.effizienz > gefiltert[überlappenderIdx].effizienz
      ) {
        gefiltert[überlappenderIdx] = vorschlag;
      }
    }
  }

  return gefiltert.sort((a, b) => a.von.getTime() - b.von.getTime());
}
