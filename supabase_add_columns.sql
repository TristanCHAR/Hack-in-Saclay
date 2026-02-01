-- Ajouter les colonnes manquantes à la table children
ALTER TABLE children
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS session_duration INTEGER DEFAULT 15;

-- Ajouter un commentaire pour clarifier
COMMENT ON COLUMN children.age IS 'Âge de l''enfant en années';
COMMENT ON COLUMN children.session_duration IS 'Durée maximale d''une session de jeu en minutes';
