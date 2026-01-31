-- DÉSACTIVATION COMPLÈTE DE RLS POUR LE DÉVELOPPEMENT
-- Exécute ce script dans ton SQL Editor Supabase
-- ⚠️ À NE PAS UTILISER EN PRODUCTION ⚠️

-- Désactiver RLS sur toutes les tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE children DISABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE cognitive_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE neurologist_settings DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques (pour nettoyer)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "workspaces_insert" ON workspaces;
DROP POLICY IF EXISTS "workspaces_select" ON workspaces;
DROP POLICY IF EXISTS "workspace_members_select" ON workspace_members;
DROP POLICY IF EXISTS "workspace_members_insert" ON workspace_members;
DROP POLICY IF EXISTS "workspace_members_update" ON workspace_members;
DROP POLICY IF EXISTS "workspace_members_delete" ON workspace_members;
DROP POLICY IF EXISTS "children_all" ON children;
DROP POLICY IF EXISTS "game_sessions_all" ON game_sessions;
DROP POLICY IF EXISTS "cognitive_scores_all" ON cognitive_scores;
DROP POLICY IF EXISTS "neurologist_settings_all" ON neurologist_settings;
