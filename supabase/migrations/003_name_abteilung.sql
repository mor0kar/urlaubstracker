-- Migration 003: Name, Abteilung und Personalnummer für PDF-Urlaubsantrag
-- Fügt drei optionale Felder zur settings-Tabelle hinzu die für den PDF-Druck benötigt werden.

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS name_vorname TEXT,
  ADD COLUMN IF NOT EXISTS abteilung TEXT,
  ADD COLUMN IF NOT EXISTS personalnummer TEXT;
