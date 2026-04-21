import type { Tables, TablesInsert, TablesUpdate } from './database.types';

// ------------------------------------------------------------
// Datenbank-Zeilentypen (direkt aus generiertem Schema)
// ------------------------------------------------------------
export type Settings         = Tables<'settings'>;
export type Urlaubskonto     = Tables<'urlaubskonten'>;
export type Urlaubseintrag   = Tables<'urlaubseintraege'>;

// Insert/Update-Typen für Formulare und API-Calls
export type SettingsInsert        = TablesInsert<'settings'>;
export type UrlaubskontоInsert    = TablesInsert<'urlaubskonten'>;
export type UrlaubseintragInsert  = TablesInsert<'urlaubseintraege'>;
export type SettingsUpdate        = TablesUpdate<'settings'>;
export type UrlaubskontоUpdate    = TablesUpdate<'urlaubskonten'>;
export type UrlaubseintragUpdate  = TablesUpdate<'urlaubseintraege'>;

// ------------------------------------------------------------
// Abgeleitete / berechnete Typen
// ------------------------------------------------------------

// Urlaubskonto mit berechneten Werten (für Dashboard)
export interface Urlaubskontostatus {
  jahr:                    number;
  basisAnspruch:           number;   // reiner Jahresanspruch laut Vertrag (z.B. immer 28)
  gesamttage:              number;   // effektiv verfügbar inkl. Übertrag (für Berechnungen)
  uebertragVorjahr:        number;   // ursprünglicher Übertrag (zur Anzeige)
  genommeneTage:           number;
  beantragteTage:          number;   // immer 0, bleibt für Typkompatibilität
  verbleibendeTage:        number;
  verfallenerÜbertrag:     number;
  nochNutzbareÜbertragTage: number;
  übertragWarnung:         'bald-verfallend' | 'verfallen' | null;
}

// Urlaubstyp-Konstanten
export const URLAUBSTYP = {
  URLAUB:       'urlaub',
  SONDERURLAUB: 'sonderurlaub',
} as const;
export type Urlaubstyp = typeof URLAUBSTYP[keyof typeof URLAUBSTYP];

// Status-Konstanten
export const URLAUBSSTATUS = {
  GEPLANT:    'geplant',
  BEANTRAGT:  'beantragt',
  GENEHMIGT:  'genehmigt',
  ABGELEHNT:  'abgelehnt',
} as const;
export type Urlaubsstatus = typeof URLAUBSSTATUS[keyof typeof URLAUBSSTATUS];

// Bundesland-Codes
export const BUNDESLAENDER = {
  BB: 'Brandenburg',
  BE: 'Berlin',
  BW: 'Baden-Württemberg',
  BY: 'Bayern',
  HB: 'Bremen',
  HE: 'Hessen',
  HH: 'Hamburg',
  MV: 'Mecklenburg-Vorpommern',
  NI: 'Niedersachsen',
  NW: 'Nordrhein-Westfalen',
  RP: 'Rheinland-Pfalz',
  SH: 'Schleswig-Holstein',
  SL: 'Saarland',
  SN: 'Sachsen',
  ST: 'Sachsen-Anhalt',
  TH: 'Thüringen',
} as const;
export type BundeslandCode = keyof typeof BUNDESLAENDER;
