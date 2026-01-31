-- Migration pour le module Onboarding et Notifications

-- 1. Ajouter le statut onboarding aux enfants
ALTER TABLE children
ADD COLUMN IF NOT EXISTS is_onboarded BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN children.is_onboarded IS 'Vrai si l''enfant a terminé les jeux de placement initiaux';

-- 2. Créer la table des notifications pour les parents
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('evaluation_report', 'session_alert', 'milestone')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_notifications_workspace ON notifications(workspace_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(workspace_id, is_read);

-- RLS pour notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Les membres du workspace peuvent voir leurs notifications
CREATE POLICY "Workspace members can view notifications"
  ON notifications FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Les membres peuvent marquer comme lu (update)
CREATE POLICY "Workspace members can update notifications"
  ON notifications FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Disable RLS temporairement pour faciliter le dev (OPTIONNEL, à retirer en prod)
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
