-- ============================================================
-- Migration 001: Initiales Schema für UrlaubsPlaner
-- ============================================================

-- ------------------------------------------------------------
-- Tabelle: settings
-- Benutzereinstellungen (1 Eintrag pro User)
-- ------------------------------------------------------------
CREATE TABLE settings (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  bundesland            TEXT        NOT NULL DEFAULT 'NW',
  urlaubstage_pro_jahr  INTEGER     NOT NULL DEFAULT 28,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Tabelle: urlaubskonten
-- Jahresurlaubskonto (1 Eintrag pro User pro Jahr)
-- Hinweis: gesamttage = Basisanspruch + Übertrag aus Vorjahr
-- ------------------------------------------------------------
CREATE TABLE urlaubskonten (
  id                     UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID           REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  jahr                   INTEGER        NOT NULL,
  gesamttage             NUMERIC(4,1)   NOT NULL,
  uebertrag_aus_vorjahr  NUMERIC(4,1)   NOT NULL DEFAULT 0,
  UNIQUE(user_id, jahr)
);

-- ------------------------------------------------------------
-- Tabelle: urlaubseintraege
-- Einzelne Urlaubsblöcke mit Start- und Enddatum
-- Halbe Tage: arbeitstage = 0.5, von_datum = bis_datum
-- ------------------------------------------------------------
CREATE TABLE urlaubseintraege (
  id           UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID           REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  von_datum    DATE           NOT NULL,
  bis_datum    DATE           NOT NULL,
  arbeitstage  NUMERIC(4,1)   NOT NULL,
  typ          TEXT           NOT NULL DEFAULT 'urlaub'
                              CHECK (typ IN ('urlaub', 'sonderurlaub')),
  kommentar    TEXT,
  status       TEXT           NOT NULL DEFAULT 'geplant'
                              CHECK (status IN ('geplant', 'beantragt', 'genehmigt', 'abgelehnt')),
  created_at   TIMESTAMPTZ    DEFAULT NOW(),
  CONSTRAINT von_vor_bis CHECK (von_datum <= bis_datum)
);

-- ------------------------------------------------------------
-- Row Level Security aktivieren
-- ------------------------------------------------------------
ALTER TABLE settings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE urlaubskonten    ENABLE ROW LEVEL SECURITY;
ALTER TABLE urlaubseintraege ENABLE ROW LEVEL SECURITY;

-- Jeder User sieht und bearbeitet nur seine eigenen Daten
CREATE POLICY "users_own_settings" ON settings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_own_konten" ON urlaubskonten
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_own_eintraege" ON urlaubseintraege
  FOR ALL USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- Index für häufige Abfragen
-- ------------------------------------------------------------
CREATE INDEX idx_urlaubseintraege_user_datum
  ON urlaubseintraege(user_id, von_datum);

CREATE INDEX idx_urlaubskonten_user_jahr
  ON urlaubskonten(user_id, jahr);
