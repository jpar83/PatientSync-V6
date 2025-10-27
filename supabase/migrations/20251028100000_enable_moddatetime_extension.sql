/*
          # [Operation Name]
          Enable moddatetime extension

          ## Query Description: [This script enables the `moddatetime` PostgreSQL extension, which is required for automatically updating `updated_at` timestamps on tables. This is a safe, one-time setup operation.]
          
          ## Metadata:
          - Schema-Category: ["Safe"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [false]
          
          ## Structure Details:
          - Enables the `moddatetime` extension within the `extensions` schema.
          
          ## Security Implications:
          - RLS Status: [N/A]
          - Policy Changes: [No]
          - Auth Requirements: [Admin privileges required to run]
          
          ## Performance Impact:
          - Indexes: [None]
          - Triggers: [None]
          - Estimated Impact: [Negligible]
          */
create extension if not exists moddatetime with schema extensions;
