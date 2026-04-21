-- ============================================================
-- Seed-Daten für UrlaubsPlaner
-- ============================================================
-- Verwendung:
--   1. Einloggen und die eigene user_id aus Supabase Dashboard
--      (Authentication → Users) kopieren
--   2. Den Platzhalter 'DEINE_USER_ID_HIER' unten ersetzen
--   3. Skript im Supabase SQL-Editor ausführen
-- ============================================================

DO $$
DECLARE
  uid UUID := 'DEINE_USER_ID_HIER'::UUID;
BEGIN

  -- ----------------------------------------------------------
  -- Settings
  -- ----------------------------------------------------------
  INSERT INTO settings (user_id, bundesland, urlaubstage_pro_jahr)
  VALUES (uid, 'NW', 28)
  ON CONFLICT (user_id) DO NOTHING;

  -- ----------------------------------------------------------
  -- Urlaubskonten
  -- ----------------------------------------------------------
  -- 2024: Eintritt im August → anteiliger Anspruch 12 Tage
  INSERT INTO urlaubskonten (user_id, jahr, gesamttage, uebertrag_aus_vorjahr)
  VALUES (uid, 2024, 12.0, 0.0)
  ON CONFLICT (user_id, jahr) DO NOTHING;

  -- 2025: 28 Tage + 1,5 Tage Übertrag aus 2024
  INSERT INTO urlaubskonten (user_id, jahr, gesamttage, uebertrag_aus_vorjahr)
  VALUES (uid, 2025, 29.5, 1.5)
  ON CONFLICT (user_id, jahr) DO NOTHING;

  -- 2026: 28 Tage + 7 Tage Übertrag aus 2025
  INSERT INTO urlaubskonten (user_id, jahr, gesamttage, uebertrag_aus_vorjahr)
  VALUES (uid, 2026, 35.0, 7.0)
  ON CONFLICT (user_id, jahr) DO NOTHING;

  -- ----------------------------------------------------------
  -- Urlaubseinträge 2024
  -- ----------------------------------------------------------
  INSERT INTO urlaubseintraege (user_id, von_datum, bis_datum, arbeitstage, typ, kommentar, status) VALUES
    (uid, '2024-10-24', '2024-10-24', 1.0,  'urlaub', 'Ganzer Tag',    'genehmigt'),
    (uid, '2024-10-28', '2024-10-28', 0.5,  'urlaub', 'Halber Tag',    'genehmigt'),
    (uid, '2024-11-06', '2024-11-06', 0.5,  'urlaub', 'Halber Tag',    'genehmigt'),
    (uid, '2024-11-14', '2024-11-15', 2.0,  'urlaub', 'Zwei Tage',     'genehmigt'),
    (uid, '2024-12-11', '2024-12-11', 0.5,  'urlaub', 'Halber Tag',    'genehmigt'),
    (uid, '2024-12-19', '2024-12-20', 2.0,  'urlaub', 'Zwei Tage',     'genehmigt'),
    (uid, '2024-12-27', '2024-12-31', 3.0,  'urlaub', '27. - 31.12.',  'genehmigt');

  -- ----------------------------------------------------------
  -- Urlaubseinträge 2025
  -- ----------------------------------------------------------
  INSERT INTO urlaubseintraege (user_id, von_datum, bis_datum, arbeitstage, typ, kommentar, status) VALUES
    (uid, '2025-01-13', '2025-01-13', 0.5,  'urlaub', 'Halber Tag',        'genehmigt'),
    (uid, '2025-01-14', '2025-01-14', 0.5,  'urlaub', 'Halber Tag',        'genehmigt'),
    (uid, '2025-02-10', '2025-02-11', 2.0,  'urlaub', 'Geburtstags Urlaub','genehmigt'),
    (uid, '2025-03-31', '2025-03-31', 0.5,  'urlaub', 'Halber Tag',        'genehmigt'),
    (uid, '2025-04-22', '2025-04-23', 2.0,  'urlaub', '22. - 23.04.',      'genehmigt'),
    (uid, '2025-05-02', '2025-05-02', 1.0,  'urlaub', 'Brückentag',        'genehmigt'),
    (uid, '2025-05-30', '2025-05-30', 1.0,  'urlaub', 'Brückentag',        'genehmigt'),
    (uid, '2025-06-20', '2025-06-27', 6.0,  'urlaub', 'Hurricane',         'genehmigt'),
    (uid, '2025-07-02', '2025-07-02', 1.0,  'urlaub', 'Einzeltag',         'genehmigt'),
    (uid, '2025-08-04', '2025-08-04', 1.0,  'urlaub', 'Einzeltag',         'genehmigt'),
    (uid, '2025-08-05', '2025-08-05', 1.0,  'urlaub', 'Einzeltag',         'genehmigt'),
    (uid, '2025-08-29', '2025-08-29', 1.0,  'urlaub', 'Einzeltag',         'genehmigt'),
    (uid, '2025-10-06', '2025-10-06', 1.0,  'urlaub', 'Einzeltag',         'genehmigt'),
    (uid, '2025-12-10', '2025-12-12', 3.0,  'urlaub', 'Einzeltag',         'genehmigt'),
    (uid, '2025-12-19', '2025-12-19', 1.0,  'urlaub', 'Einzeltag',         'genehmigt');

  -- ----------------------------------------------------------
  -- Urlaubseinträge 2026
  -- ----------------------------------------------------------
  INSERT INTO urlaubseintraege (user_id, von_datum, bis_datum, arbeitstage, typ, kommentar, status) VALUES
    (uid, '2026-01-05', '2026-01-09', 5.0,  'urlaub',       'Einzeltag',  'genehmigt'),
    (uid, '2026-01-14', '2026-01-16', 3.0,  'urlaub',       'Einzeltag',  'genehmigt'),
    (uid, '2026-02-05', '2026-02-05', 0.0,  'sonderurlaub', 'Sonderurlaub','genehmigt'),
    (uid, '2026-02-06', '2026-02-06', 1.0,  'urlaub',       'Einzeltag',  'genehmigt'),
    (uid, '2026-03-10', '2026-03-10', 0.5,  'urlaub',       'Halber Tag', 'genehmigt'),
    (uid, '2026-03-11', '2026-03-11', 0.5,  'urlaub',       'Halber Tag', 'genehmigt'),
    (uid, '2026-03-24', '2026-03-24', 0.5,  'urlaub',       'Halber Tag', 'genehmigt'),
    (uid, '2026-04-17', '2026-04-17', 1.0,  'urlaub',       'Einzeltag',  'genehmigt'),
    (uid, '2026-04-20', '2026-04-20', 1.0,  'urlaub',       'Einzeltag',  'genehmigt');

END $$;
