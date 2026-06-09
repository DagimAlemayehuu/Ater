-- Purge Notion Database Assets Migration
-- Purpose: Remove all deprecated Notion integration tables and columns to clean up the Supabase schema.

-- 1. Drop any Notion-related tables if they exist
DROP TABLE IF EXISTS public.notion_sync_state CASCADE;
DROP TABLE IF EXISTS public.notion_databases CASCADE;

-- 2. Drop Notion-specific columns from profiles table if they exist
ALTER TABLE public.profiles DROP COLUMN IF EXISTS notion_token;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS notion_workspace_id;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS notion_sync_enabled;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS notion_credentials;
