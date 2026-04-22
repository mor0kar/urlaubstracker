// PDF-Komponente für den Urlaubsantrag
// Rendert ZWEIMAL denselben Antrag auf einer A4-Seite (Originalbeleg + Kopie)
// Nutzt ausschließlich @react-pdf/renderer Primitives — kein 'use client'!

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

export interface UrlaubsantragDaten {
  nameVorname: string;
  abteilung: string;
  personalnummer?: string;
  vonDatum: string;      // formatiert: "24.10.2026"
  bisDatum: string;
  arbeitstage: number;
  typ: 'urlaub' | 'sonderurlaub';
  urlaubsanspruch: number;   // gesamttage des Jahres (basisAnspruch)
  ltAntrag: number;          // arbeitstage dieses Eintrags
  restanspruch: number;      // verbleibendeTage nach diesem Eintrag
  erstelltAm: string;        // "22.04.2026"
}

const stile = StyleSheet.create({
  seite: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    margin: 20,
    flexDirection: 'column',
  },
  antrag: {
    flex: 1,
    border: '1pt solid black',
    marginBottom: 0,
  },
  trennlinie: {
    borderBottom: '1pt dashed black',
    marginVertical: 8,
  },
  kopfzeile: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: '6pt 8pt',
    borderBottom: '1pt solid black',
  },
  kopfTitel: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
  },
  kopfAnspruch: {
    fontSize: 8,
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 2,
  },
  kopfAnspruchZeile: {
    flexDirection: 'row',
    gap: 4,
  },
  kopfLabel: {
    color: '#6b7280',
  },
  kopfWert: {
    fontFamily: 'Helvetica-Bold',
  },
  belegHinweis: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderBottom: '1pt solid black',
    fontSize: 8,
    color: '#6b7280',
    fontFamily: 'Helvetica-Oblique',
  },
  inhalt: {
    padding: '6pt 8pt',
  },
  checkboxZeile: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 6,
  },
  checkboxEintrag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  checkboxBox: {
    width: 10,
    height: 10,
    border: '1pt solid black',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxHaken: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  hinweisZeile: {
    fontSize: 7,
    color: '#6b7280',
    marginBottom: 6,
    fontFamily: 'Helvetica-Oblique',
  },
  trennstrich: {
    borderBottom: '0.5pt solid #d1d5db',
    marginBottom: 6,
  },
  dreiSpalten: {
    flexDirection: 'row',
    borderBottom: '0.5pt solid #d1d5db',
    marginBottom: 6,
  },
  spalte: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRight: '0.5pt solid #d1d5db',
  },
  spalteLetzte: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  feldLabel: {
    fontSize: 7,
    color: '#6b7280',
    marginBottom: 2,
  },
  feldWert: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  tabelle: {
    border: '1pt solid black',
    marginBottom: 8,
  },
  tabelleKopf: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottom: '1pt solid black',
  },
  tabelleZeile: {
    flexDirection: 'row',
    borderBottom: '0.5pt solid #d1d5db',
  },
  tabelleSpalte1: {
    width: '20%',
    borderRight: '0.5pt solid #d1d5db',
    padding: '3pt 4pt',
  },
  tabelleSpalte2: {
    width: '30%',
    borderRight: '0.5pt solid #d1d5db',
    padding: '3pt 4pt',
  },
  tabelleSpalte3: {
    width: '30%',
    borderRight: '0.5pt solid #d1d5db',
    padding: '3pt 4pt',
  },
  tabelleSpalte4: {
    width: '20%',
    padding: '3pt 4pt',
  },
  tabelleKopfText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
  },
  tabelleText: {
    fontSize: 9,
  },
  unterschriftenZeile: {
    flexDirection: 'row',
    marginTop: 4,
  },
  unterschriftFeld: {
    flex: 1,
    borderRight: '0.5pt solid #d1d5db',
    paddingHorizontal: 4,
    paddingTop: 2,
  },
  unterschriftFeldLetzte: {
    flex: 1,
    paddingHorizontal: 4,
    paddingTop: 2,
  },
  unterschriftLinie: {
    borderBottom: '0.5pt solid black',
    marginTop: 18,
    marginBottom: 3,
  },
  unterschriftLabel: {
    fontSize: 7,
    color: '#6b7280',
  },
});

// Eine einzelne Antrag-Hälfte (oben = Originalbeleg, unten = Kopie)
function AntragHalfte({
  daten,
  belegArt,
}: {
  daten: UrlaubsantragDaten;
  belegArt: 'Originalbeleg für Mitarbeiter' | 'Kopie für Personalakte';
}) {
  const istUrlaub = daten.typ === 'urlaub';

  return (
    <View style={stile.antrag}>
      {/* Kopfzeile: Titel + Anspruchs-Übersicht */}
      <View style={stile.kopfzeile}>
        <Text style={stile.kopfTitel}>Urlaubsantrag</Text>
        <View style={stile.kopfAnspruch}>
          <View style={stile.kopfAnspruchZeile}>
            <Text style={stile.kopfLabel}>Urlaubsanspruch:</Text>
            <Text style={stile.kopfWert}>{daten.urlaubsanspruch} Tage</Text>
          </View>
          <View style={stile.kopfAnspruchZeile}>
            <Text style={stile.kopfLabel}>lt. Antrag:</Text>
            <Text style={stile.kopfWert}>{daten.ltAntrag} Tage</Text>
          </View>
          <View style={stile.kopfAnspruchZeile}>
            <Text style={stile.kopfLabel}>Restanspruch:</Text>
            <Text style={stile.kopfWert}>{daten.restanspruch} Tage</Text>
          </View>
        </View>
      </View>

      {/* Belegart-Hinweis */}
      <Text style={stile.belegHinweis}>{belegArt}</Text>

      {/* Inhalt */}
      <View style={stile.inhalt}>
        {/* Checkboxen: Urlaub / Sonderurlaub */}
        <View style={stile.checkboxZeile}>
          <View style={stile.checkboxEintrag}>
            <View style={stile.checkboxBox}>
              {istUrlaub && <Text style={stile.checkboxHaken}>X</Text>}
            </View>
            <Text>Urlaub</Text>
          </View>
          <View style={stile.checkboxEintrag}>
            <View style={stile.checkboxBox}>
              {!istUrlaub && <Text style={stile.checkboxHaken}>X</Text>}
            </View>
            <Text>Sonderurlaub</Text>
          </View>
        </View>

        {/* Hinweistext */}
        <Text style={stile.hinweisZeile}>Zutreffendes bitte ankreuzen</Text>
        <View style={stile.trennstrich} />

        {/* 3-Spalten: Name | Abteilung | Pers.-Nr. */}
        <View style={stile.dreiSpalten}>
          <View style={stile.spalte}>
            <Text style={stile.feldLabel}>Name, Vorname</Text>
            <Text style={stile.feldWert}>{daten.nameVorname || '–'}</Text>
          </View>
          <View style={stile.spalte}>
            <Text style={stile.feldLabel}>Abteilung</Text>
            <Text style={stile.feldWert}>{daten.abteilung || '–'}</Text>
          </View>
          <View style={stile.spalteLetzte}>
            <Text style={stile.feldLabel}>Pers.-Nr.</Text>
            <Text style={stile.feldWert}>{daten.personalnummer || '–'}</Text>
          </View>
        </View>

        {/* Urlaubs-Tabelle */}
        <View style={stile.tabelle}>
          <View style={stile.tabelleKopf}>
            <View style={stile.tabelleSpalte1}>
              <Text style={stile.tabelleKopfText}>Art</Text>
            </View>
            <View style={stile.tabelleSpalte2}>
              <Text style={stile.tabelleKopfText}>am / vom</Text>
            </View>
            <View style={stile.tabelleSpalte3}>
              <Text style={stile.tabelleKopfText}>bis</Text>
            </View>
            <View style={stile.tabelleSpalte4}>
              <Text style={stile.tabelleKopfText}>Arbeitstage</Text>
            </View>
          </View>
          <View style={stile.tabelleZeile}>
            <View style={stile.tabelleSpalte1}>
              <Text style={stile.tabelleText}>
                {istUrlaub ? 'Urlaub' : 'Sonderurlaub'}
              </Text>
            </View>
            <View style={stile.tabelleSpalte2}>
              <Text style={stile.tabelleText}>{daten.vonDatum}</Text>
            </View>
            <View style={stile.tabelleSpalte3}>
              <Text style={stile.tabelleText}>{daten.bisDatum}</Text>
            </View>
            <View style={stile.tabelleSpalte4}>
              <Text style={stile.tabelleText}>{daten.arbeitstage}</Text>
            </View>
          </View>
        </View>

        {/* Unterschriftenzeile */}
        <View style={stile.unterschriftenZeile}>
          <View style={stile.unterschriftFeld}>
            <View style={stile.unterschriftLinie} />
            <Text style={stile.unterschriftLabel}>
              Datum, Unterschrift Mitarbeiter
            </Text>
          </View>
          <View style={stile.unterschriftFeld}>
            <View style={stile.unterschriftLinie} />
            <Text style={stile.unterschriftLabel}>
              Datum, Unterschrift Vertretung
            </Text>
          </View>
          <View style={stile.unterschriftFeldLetzte}>
            <View style={stile.unterschriftLinie} />
            <Text style={stile.unterschriftLabel}>
              Datum, Unterschrift Vorgesetzter
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// Hauptkomponente: Zwei Anträge auf einer A4-Seite
export default function UrlaubsantragPdf({ daten }: { daten: UrlaubsantragDaten }) {
  return (
    <Document
      title={`Urlaubsantrag ${daten.vonDatum}`}
      author={daten.nameVorname}
      creator="UrlaubsPlaner"
    >
      <Page size="A4" style={stile.seite}>
        {/* Oberer Antrag: Originalbeleg für Mitarbeiter */}
        <AntragHalfte
          daten={daten}
          belegArt="Originalbeleg für Mitarbeiter"
        />

        {/* Gestrichelte Trennlinie */}
        <View style={stile.trennlinie} />

        {/* Unterer Antrag: Kopie für Personalakte */}
        <AntragHalfte
          daten={daten}
          belegArt="Kopie für Personalakte"
        />
      </Page>
    </Document>
  );
}
