-- KidoKinetics Supabase Migration
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('parent', 'caregiver', 'neurologist')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workspace members table
CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'parent', 'caregiver', 'neurologist')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- Children table
CREATE TABLE IF NOT EXISTS children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  avatar_config JSONB DEFAULT '{}',
  epilepsy_profile JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Game sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  game_id TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  score NUMERIC,
  metrics JSONB,
  is_diagnostic BOOLEAN DEFAULT FALSE
);

-- Cognitive scores table
CREATE TABLE IF NOT EXISTS cognitive_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  faculty TEXT NOT NULL,
  score NUMERIC NOT NULL,
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Neurologist settings table
CREATE TABLE IF NOT EXISTS neurologist_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE NOT NULL,
  neurologist_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  enabled_games JSONB DEFAULT '["fruit-ninja", "jeu-du-bruit"]',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(child_id, neurologist_id)
);

-- Indexes for performance
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_children_workspace ON children(workspace_id);
CREATE INDEX idx_game_sessions_child ON game_sessions(child_id);
CREATE INDEX idx_cognitive_scores_child ON cognitive_scores(child_id);
CREATE INDEX idx_neurologist_settings_child ON neurologist_settings(child_id);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cognitive_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE neurologist_settings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Workspaces policies
CREATE POLICY "Users can view workspaces they are members of"
  ON workspaces FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspaces.id
      AND workspace_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create workspaces"
  ON workspaces FOR INSERT
  WITH CHECK (true);

-- Workspace members policies
CREATE POLICY "Users can view members of their workspaces"
  ON workspace_members FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add themselves to workspaces"
  ON workspace_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Workspace owners can manage members"
  ON workspace_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role = 'owner'
    )
  );

-- Children policies
CREATE POLICY "Workspace members can view children"
  ON children FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can manage children"
  ON children FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Game sessions policies
CREATE POLICY "Workspace members can view game sessions"
  ON game_sessions FOR SELECT
  USING (
    child_id IN (
      SELECT id FROM children
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Workspace members can create game sessions"
  ON game_sessions FOR INSERT
  WITH CHECK (
    child_id IN (
      SELECT id FROM children
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      )
    )
  );

-- Cognitive scores policies
CREATE POLICY "Workspace members can view cognitive scores"
  ON cognitive_scores FOR SELECT
  USING (
    child_id IN (
      SELECT id FROM children
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Workspace members can create cognitive scores"
  ON cognitive_scores FOR INSERT
  WITH CHECK (
    child_id IN (
      SELECT id FROM children
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      )
    )
  );

-- Neurologist settings policies
CREATE POLICY "Neurologists can manage their settings"
  ON neurologist_settings FOR ALL
  USING (neurologist_id = auth.uid());

CREATE POLICY "Workspace members can view neurologist settings"
  ON neurologist_settings FOR SELECT
  USING (
    child_id IN (
      SELECT id FROM children
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      )
    )
  );

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for neurologist_settings
CREATE TRIGGER update_neurologist_settings_updated_at
  BEFORE UPDATE ON neurologist_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
