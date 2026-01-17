-- Migration: Add employee_id to messages table
-- This allows tracking which employee sent a message (for replying as place)

ALTER TABLE messages
ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES place_employees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_messages_employee_id ON messages(employee_id) WHERE employee_id IS NOT NULL;

COMMENT ON COLUMN messages.employee_id IS 'ID of the employee who sent this message (if sent by employee, not owner)';
