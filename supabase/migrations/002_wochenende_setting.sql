-- Migration: Wochenende-Einstellung zu settings-Tabelle hinzufügen
-- Wenn wochenende_zaehlt = true, zählen Samstag und Sonntag als normale Arbeitstage.
-- Standard: false (bisheriges Verhalten — Wochenenden werden herausgerechnet).

ALTER TABLE settings
ADD COLUMN wochenende_zaehlt BOOLEAN NOT NULL DEFAULT false;
