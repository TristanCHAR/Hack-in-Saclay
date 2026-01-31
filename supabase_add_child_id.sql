-- MIGRATION : Ajouter child_id aux tables de jeu
-- Exécute ce script dans ton SQL Editor Supabase

-- Ajouter child_id aux tables existantes
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS child_id UUID REFERENCES children(id) ON DELETE CASCADE;
ALTER TABLE cognitive_scores ADD COLUMN IF NOT EXISTS child_id UUID REFERENCES children(id) ON DELETE CASCADE;

-- Créer des index pour performance
CREATE INDEX IF NOT EXISTS idx_game_sessions_child ON game_sessions(child_id);
CREATE INDEX IF NOT EXISTS idx_cognitive_scores_child ON cognitive_scores(child_id);

-- Note: Les données existantes auront child_id = NULL
-- Tu peux les nettoyer ou les associer manuellement si besoin
