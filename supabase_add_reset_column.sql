-- Ajouter une colonne pour suivre le dernier reset de session
ALTER TABLE children
ADD COLUMN IF NOT EXISTS last_session_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Commentaire pour clarifier
COMMENT ON COLUMN children.last_session_reset IS 'Horodatage du dernier reset manuel de la session par le parent';
