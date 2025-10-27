/*
          # [Operation Name]
          Enable RLS and Add Read Policies for Patients and Orders

          ## Query Description: [This script enables Row Level Security (RLS) on the `patients` and `orders` tables and creates a baseline policy that allows any authenticated (logged-in) user to read data from them. This is a critical security and functionality fix. Without a SELECT policy, RLS will block all read access by default, leading to empty pages in the application. This change ensures that logged-in users can see the data they are supposed to see.]
          
          ## Metadata:
          - Schema-Category: "Security"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Tables affected: `patients`, `orders`
          - Operations: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`, `CREATE POLICY`
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes
          - Auth Requirements: This policy requires users to be authenticated to read data.
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Negligible. RLS checks are highly optimized in PostgreSQL.
          */

-- Enable Row Level Security on the patients table if not already enabled.
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Enable Row Level Security on the orders table if not already enabled.
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop existing read policies if they exist to ensure a clean state.
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.patients;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.orders;

-- Create a policy that allows any authenticated user to read patient data.
-- This is a safe baseline for an internal application where all users share data.
CREATE POLICY "Allow authenticated read access"
ON public.patients FOR SELECT
TO authenticated
USING (true);

-- Create a policy that allows any authenticated user to read order data.
CREATE POLICY "Allow authenticated read access"
ON public.orders FOR SELECT
TO authenticated
USING (true);
