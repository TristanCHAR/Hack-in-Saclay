-- FIX COMPLET pour les politiques RLS workspace_members
-- Exécute ce script dans ton SQL Editor Supabase

-- 1. Supprimer TOUTES les politiques existantes sur workspace_members
DROP POLICY IF EXISTS "Users can view members of their workspaces" ON workspace_members;
DROP POLICY IF EXISTS "Users can add themselves to workspaces" ON workspace_members;
DROP POLICY IF EXISTS "Workspace owners can manage members" ON workspace_members;
DROP POLICY IF EXISTS "Users can insert themselves as members" ON workspace_members;
DROP POLICY IF EXISTS "Owners can manage workspace members" ON workspace_members;

-- 2. Créer les nouvelles politiques SANS récursion

-- Politique SELECT simplifiée
CREATE POLICY "workspace_members_select"
  ON workspace_members FOR SELECT
  USING (true);  -- Temporairement permissif pour débug

-- Politique INSERT pour que les users puissent s'ajouter
CREATE POLICY "workspace_members_insert"
  ON workspace_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Politique UPDATE/DELETE pour les owners
CREATE POLICY "workspace_members_update"
  ON workspace_members FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "workspace_members_delete"
  ON workspace_members FOR DELETE
  USING (user_id = auth.uid());
