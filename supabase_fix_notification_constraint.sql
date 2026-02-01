-- Fix for notifications check constraint
-- The 'evaluation_report' type was missing or the specific constraint was outdated.

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
ADD CONSTRAINT notifications_type_check
CHECK (type IN ('evaluation_report', 'session_alert', 'milestone', 'alert'));

-- Verify policies are enabled (optional, good practice)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
