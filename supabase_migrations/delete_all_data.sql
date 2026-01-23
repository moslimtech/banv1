-- Migration: Delete all data from specific tables
-- WARNING: This will delete ALL data from the following tables

-- Delete all messages
DELETE FROM messages;

-- Delete all posts
DELETE FROM posts;

-- Delete all products
DELETE FROM products;

-- Delete all places
DELETE FROM places;

-- Delete all employee requests
DELETE FROM employee_requests;

-- Delete all place employees
DELETE FROM place_employees;

-- Delete all place visits
DELETE FROM place_visits;
