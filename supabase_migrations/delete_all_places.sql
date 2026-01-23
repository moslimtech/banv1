-- Migration: Delete all places
-- WARNING: This will delete all places and related data

-- Delete all related data first (CASCADE should handle this, but being explicit)
DELETE FROM messages WHERE place_id IN (SELECT id FROM places);
DELETE FROM posts WHERE place_id IN (SELECT id FROM places);
DELETE FROM products WHERE place_id IN (SELECT id FROM places);
DELETE FROM place_employees WHERE place_id IN (SELECT id FROM places);
DELETE FROM employee_requests WHERE place_id IN (SELECT id FROM places);
DELETE FROM place_visits WHERE place_id IN (SELECT id FROM places);

-- Delete all places
DELETE FROM places;
