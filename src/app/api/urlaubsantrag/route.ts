// API Route: Urlaubsantrag als PDF herunterladen
// GET /api/urlaubsantrag?id=<urlaubseintrag-id>
// Gibt ein PDF zurück das direkt heruntergeladen werden kann.

import { type NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import type { ReactElement } from 'react';
import type { DocumentProps } from '@react-pdf/renderer';
import { createClient } from '@/lib/supabase/server';
import { berechneKontostatus } from '@/lib/berechnungen';
import UrlaubsantragPdf, {
  type UrlaubsantragDaten,
} from '@/lib/pdf/UrlaubsantragPdf';

export const dynamic = 'force-dynamic';

// Datum aus ISO-String als DD.MM.YYYY formatieren
function formatiereDatumDE(isoString: string): string {
  const [jahr, monat, tag] = isoString.slice(0, 10).split('-');
  return `${tag}.${monat}.${jahr}`;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // 1. Auth prüfen
  const {
    data: { user },
    error: authFehler,
  } = await supabase.auth.getUser();

  if (authFehler || !user) {
    return NextResponse.json(
      { error: 'Nicht authentifiziert.' },
      { status: 401 },
    );
  }

  // 2. ?id= Parameter aus URL lesen
  const { searchParams } = new URL(request.url);
  const eintragId = searchParams.get('id');

  if (!eintragId) {
    return NextResponse.json(
      { error: 'Parameter "id" fehlt.' },
      { status: 400 },
    );
  }

  // 3. Urlaubseintrag laden (RLS stellt sicher dass nur eigene Einträge lesbar sind)
  const { data: eintrag, error: eintragFehler } = await supabase
    .from('urlaubseintraege')
    .select('*')
    .eq('id', eintragId)
    .single();

  if (eintragFehler || !eintrag) {
    return NextResponse.json(
      { error: 'Urlaubseintrag nicht gefunden.' },
      { status: 404 },
    );
  }

  // 4. Settings laden (name_vorname, abteilung, personalnummer)
  const { data: settings, error: settingsFehler } = await supabase
    .from('settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (settingsFehler || !settings) {
    return NextResponse.json(
      { error: 'Benutzereinstellungen nicht gefunden.' },
      { status: 404 },
    );
  }

  // 5. Urlaubskonto für das Jahr laden + alle Einträge → berechneKontostatus
  const jahr = new Date(eintrag.von_datum).getFullYear();

  const { data: konto } = await supabase
    .from('urlaubskonten')
    .select('*')
    .eq('user_id', user.id)
    .eq('jahr', jahr)
    .single();

  // Wenn kein explizites Konto vorhanden: Standardwerte aus Settings verwenden
  const urlaubskonto = konto ?? {
    id: '',
    user_id: user.id,
    jahr,
    gesamttage: settings.urlaubstage_pro_jahr,
    uebertrag_aus_vorjahr: 0,
  };

  const { data: alleEintraege } = await supabase
    .from('urlaubseintraege')
    .select('*')
    .eq('user_id', user.id);

  const kontostatus = berechneKontostatus(
    urlaubskonto,
    alleEintraege ?? [],
  );

  // Restanspruch nach diesem Eintrag = verbleibendeTage ohne diesen Eintrag minus die Tage des Eintrags
  // Da berechneKontostatus alle Einträge inkl. diesem berücksichtigt, ist verbleibendeTage bereits korrekt
  const restanspruch = kontostatus.verbleibendeTage;

  // 6. Datumsformatierung
  const vonDatum = formatiereDatumDE(eintrag.von_datum);
  const bisDatum = formatiereDatumDE(eintrag.bis_datum);
  const erstelltAm = formatiereDatumDE(new Date().toISOString());

  // 7. PDF-Daten zusammenstellen
  const pdfDaten: UrlaubsantragDaten = {
    nameVorname: settings.name_vorname ?? '',
    abteilung: settings.abteilung ?? '',
    personalnummer: settings.personalnummer ?? undefined,
    vonDatum,
    bisDatum,
    arbeitstage: eintrag.arbeitstage,
    typ: eintrag.typ === 'sonderurlaub' ? 'sonderurlaub' : 'urlaub',
    urlaubsanspruch: kontostatus.basisAnspruch,
    ltAntrag: eintrag.arbeitstage,
    restanspruch,
    erstelltAm,
  };

  // 8. PDF rendern und als Buffer zurückgeben
  try {
    const pdfElement = React.createElement(
      UrlaubsantragPdf,
      { daten: pdfDaten },
    ) as ReactElement<DocumentProps>;

    const pdfBuffer = await renderToBuffer(pdfElement);

    const dateiname = `Urlaubsantrag_${eintrag.von_datum}.pdf`;

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${dateiname}"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    });
  } catch (renderFehler) {
    console.error('[urlaubsantrag] PDF-Render-Fehler:', renderFehler);
    return NextResponse.json(
      { error: 'PDF konnte nicht erstellt werden.' },
      { status: 500 },
    );
  }
}
