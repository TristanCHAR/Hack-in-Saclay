-- MIGRATION COMPLÈTE v6 - Child Auth + Neurologist Permissions
-- Exécute ce script dans ton SQL Editor Supabase

-- ============================================
-- 1. DÉSACTIVER RLS (pour dev)
-- ============================================

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE children DISABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE cognitive_scores DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. AJOUTER AUTH ENFANT (username/password)
-- ============================================

-- Ajouter colonnes si elles n'existent pas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='children' AND column_name='username') THEN
    ALTER TABLE children ADD COLUMN username TEXT UNIQUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='children' AND column_name='password_hash') THEN
    ALTER TABLE children ADD COLUMN password_hash TEXT;
  END IF;
END $$;

-- ============================================
-- 3. TABLE PERMISSIONS NEUROLOGUE
-- ============================================

CREATE TABLE IF NOT EXISTS neurologist_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  neurologist_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Booléens de partage
  share_sessions BOOLEAN DEFAULT false,
  share_scores BOOLEAN DEFAULT false,
  share_reaction_time BOOLEAN DEFAULT false,
  share_inhibition BOOLEAN DEFAULT false,
  share_attention BOOLEAN DEFAULT false,
  share_progress BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(child_id, neurologist_id)
);

ALTER TABLE neurologist_permissions DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. TABLE JEUX ACTIVÉS PAR ENFANT
-- ============================================

CREATE TABLE IF NOT EXISTS child_game_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  enabled_at TIMESTAMPTZ DEFAULT NOW(),
  enabled_by UUID REFERENCES auth.users(id),

  UNIQUE(child_id, game_id)
);

ALTER TABLE child_game_access DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. INDEXES POUR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_children_username ON children(username);
CREATE INDEX IF NOT EXISTS idx_neurologist_permissions_child ON neurologist_permissions(child_id);
CREATE INDEX IF NOT EXISTS idx_neurologist_permissions_neuro ON neurologist_permissions(neurologist_id);
CREATE INDEX IF NOT EXISTS idx_child_game_access_child ON child_game_access(child_id);
CREATE INDEX IF NOT EXISTS idx_child_game_access_enabled ON child_game_access(child_id, enabled);

-- ============================================
-- 6. TRIGGER AUTO-UPDATE TIMESTAMPS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_neurologist_permissions_updated_at ON neurologist_permissions;
CREATE TRIGGER update_neurologist_permissions_updated_at
  BEFORE UPDATE ON neurologist_permissions
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- ============================================
-- TERMINÉ !
-- ============================================
-- Maintenant tu peux :
-- 1. Créer un workspace (parent)
-- 2. Ajouter des enfants avec username/password
-- 3. Inviter des neurologues
-- 4. Gérer le partage de metrics
