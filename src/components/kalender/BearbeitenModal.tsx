'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { urlaubBearbeiten } from '@/app/(app)/kalender/actions';
import type { Urlaubseintrag } from '@/types';

interface BearbeitenModalProps {
  eintrag: Urlaubseintrag;
  onSchließen: () => void;
  // Feiertage als einfache Map datum→name für Frontend-Berechnung
  feiertage: Record<string, string>;
}

/**
 * Berechnet Arbeitstage im Browser (ohne Feiertage/WE).
 * Wird für Live-Vorschau im Modal verwendet.
 * Serverseitig wird nochmal korrekt berechnet.
 */
function lokalDatumStr(datum: Date): string {
  const j = datum.getFullYear();
  const m = String(datum.getMonth() + 1).padStart(2, '0');
  const t = String(datum.getDate()).padStart(2, '0');
  return `${j}-${m}-${t}`;
}

function berechneArbeitstageClient(
  von: string,
  bis: string,
  feiertage: Record<string, string>,
): number {
  if (!von || !bis) return 0;
  const vonDatum = new Date(von + 'T00:00:00');
  const bisDatum = new Date(bis + 'T00:00:00');
  if (vonDatum > bisDatum) return 0;

  let anzahl = 0;
  const aktuell = new Date(vonDatum);
  while (aktuell <= bisDatum) {
    const tag = aktuell.getDay();
    const datumStr = lokalDatumStr(aktuell);
    const istWE = tag === 0 || tag === 6;
    const istFeiertag = datumStr in feiertage;
    if (!istWE && !istFeiertag) anzahl++;
    aktuell.setDate(aktuell.getDate() + 1);
  }
  return anzahl;
}

export default function BearbeitenModal({
  eintrag,
  onSchließen,
  feiertage,
}: BearbeitenModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Initialen Zustand aus dem bestehenden Eintrag befüllen
  const [von, setVon] = useState(eintrag.von_datum);
  const [bis, setBis] = useState(eintrag.bis_datum);
  const [typ, setTyp] = useState<'urlaub' | 'sonderurlaub'>(
    eintrag.typ === 'sonderurlaub' ? 'sonderurlaub' : 'urlaub',
  );
  const [kommentar, setKommentar] = useState(eintrag.kommentar ?? '');
  const [halberTag, setHalberTag] = useState(eintrag.arbeitstage === 0.5);
  const [fehler, setFehler] = useState<string | undefined>();
  const [lädt, setLädt] = useState(false);

  // Client-seitige Arbeitstage-Berechnung für Vorschau
  const arbeitstage = halberTag ? 0.5 : berechneArbeitstageClient(von, bis, feiertage);

  // Dialog öffnen wenn montiert
  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  // ESC schließt Modal
  const handleDialogClose = useCallback(() => {
    onSchließen();
  }, [onSchließen]);

  // Klick außerhalb schließt Modal
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) {
        dialogRef.current?.close();
      }
    },
    [],
  );

  const handleAbsenden = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFehler(undefined);
    setLädt(true);

    const formData = new FormData(e.currentTarget);
    const ergebnis = await urlaubBearbeiten(formData);

    if (ergebnis.fehler) {
      setFehler(ergebnis.fehler);
      setLädt(false);
    } else {
      dialogRef.current?.close();
    }
  };

  // Wenn Halber Tag aktiviert wird: bis_datum auf von_datum setzen
  const handleHalberTagToggle = (aktiviert: boolean) => {
    setHalberTag(aktiviert);
    if (aktiviert) {
      setBis(von);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={handleDialogClose}
      onClick={handleBackdropClick}
      className="m-auto w-full max-w-md rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0 shadow-xl backdrop:bg-black/40 open:flex open:flex-col"
      aria-labelledby="bearbeiten-modal-titel"
      aria-modal="true"
    >
      {/* Kopfzeile */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
        <h2 id="bearbeiten-modal-titel" className="text-base font-semibold text-gray-900 dark:text-slate-100">
          Urlaub bearbeiten
        </h2>
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label="Dialog schließen"
          className="rounded-lg p-1.5 text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Formular */}
      <form onSubmit={handleAbsenden} className="px-6 py-5 space-y-4">
        {/* Versteckte Eintrag-ID */}
        <input type="hidden" name="id" value={eintrag.id} />
        {/* Halber-Tag-Flag für Server Action */}
        {halberTag && <input type="hidden" name="halber_tag" value="true" />}

        {/* Halber Tag Checkbox */}
        <div className="flex items-center gap-3">
          <input
            id="halber_tag_bearbeiten"
            type="checkbox"
            checked={halberTag}
            onChange={(e) => handleHalberTagToggle(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-slate-700"
          />
          <label
            htmlFor="halber_tag_bearbeiten"
            className="text-sm font-medium text-gray-700 dark:text-slate-300 cursor-pointer"
          >
            Halber Tag
          </label>
        </div>

        {/* Von-Datum */}
        <div>
          <label
            htmlFor="bearbeiten_von_datum"
            className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1"
          >
            Von
          </label>
          <input
            id="bearbeiten_von_datum"
            type="date"
            name="von_datum"
            required
            value={von}
            onChange={(e) => {
              setVon(e.target.value);
              if (bis < e.target.value) setBis(e.target.value);
              if (halberTag) setBis(e.target.value);
            }}
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm text-gray-900 dark:text-slate-100 dark:bg-slate-700 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
        </div>

        {/* Bis-Datum (ausgeblendet bei Halber Tag) */}
        {!halberTag && (
          <div>
            <label
              htmlFor="bearbeiten_bis_datum"
              className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1"
            >
              Bis
            </label>
            <input
              id="bearbeiten_bis_datum"
              type="date"
              name="bis_datum"
              required
              value={bis}
              min={von}
              onChange={(e) => setBis(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm text-gray-900 dark:text-slate-100 dark:bg-slate-700 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </div>
        )}
        {/* Verstecktes Bis-Datum bei Halber Tag */}
        {halberTag && <input type="hidden" name="bis_datum" value={von} />}

        {/* Live-Berechnung Arbeitstage */}
        {von && (halberTag || bis) && (
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 px-4 py-2.5">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <span className="font-semibold">{halberTag ? '0,5' : arbeitstage}</span>{' '}
              {halberTag ? 'halber Arbeitstag' : arbeitstage === 1 ? 'Arbeitstag' : 'Arbeitstage'}
              {!halberTag && arbeitstage === 0 && (
                <span className="ml-1 text-orange-700 dark:text-orange-400">
                  (nur Wochenenden/Feiertage)
                </span>
              )}
            </p>
          </div>
        )}

        {/* Typ */}
        <div>
          <label
            htmlFor="bearbeiten_typ"
            className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1"
          >
            Art
          </label>
          <select
            id="bearbeiten_typ"
            name="typ"
            value={typ}
            onChange={(e) =>
              setTyp(e.target.value as 'urlaub' | 'sonderurlaub')
            }
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-gray-900 dark:text-slate-100 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
          >
            <option value="urlaub">Urlaub</option>
            <option value="sonderurlaub">Sonderurlaub</option>
          </select>
        </div>

        {/* Kommentar */}
        <div>
          <label
            htmlFor="bearbeiten_kommentar"
            className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1"
          >
            Kommentar{' '}
            <span className="font-normal text-gray-400 dark:text-slate-500">(optional)</span>
          </label>
          <input
            id="bearbeiten_kommentar"
            type="text"
            name="kommentar"
            value={kommentar}
            onChange={(e) => setKommentar(e.target.value)}
            maxLength={500}
            placeholder="z.B. Familienurlaub, Dienstreise..."
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-sm text-gray-900 dark:text-slate-100 dark:bg-slate-700 placeholder-gray-400 dark:placeholder-slate-500 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
        </div>

        {/* Fehlermeldung */}
        {fehler && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-4 py-3">
            <p className="text-sm text-red-800 dark:text-red-300">{fehler}</p>
          </div>
        )}

        {/* Aktionen */}
        <div className="flex gap-3 justify-end pt-1">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="rounded-lg border border-gray-200 dark:border-slate-600 px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={lädt || (!halberTag && arbeitstage === 0)}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {lädt ? 'Wird gespeichert...' : 'Speichern'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
