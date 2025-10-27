/*
          # Create Insurance Providers Management
          This migration creates a new table to store a canonical list of insurance providers and adds the necessary security rules and functions to manage them.

          ## Query Description:
          - **CREATE TABLE insurance_providers:** Establishes a new table to centrally manage insurance provider names. This helps ensure data consistency.
          - **CREATE FUNCTION block_delete_if_insurance_in_use:** Creates a database trigger function. This function runs before any deletion on the `insurance_providers` table and checks if the provider's name is currently used in the `patients` table. If it is, the deletion is blocked, preventing orphaned data.
          - **CREATE TRIGGER on_insurance_provider_delete:** Attaches the trigger function to the `insurance_providers` table.
          - **CREATE FUNCTION get_insurance_provider_usage:** Creates an RPC function that efficiently returns a list of all insurance providers along with a count of how many patients are associated with each. The frontend will use this to know which "Delete" buttons to disable.
          - **RLS Policies:** Enables Row Level Security on the new table and adds policies to allow authenticated users to read and manage the providers.
          
          This operation is safe and non-destructive to existing data.

          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true (the table and functions can be dropped)
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes (adds new policies for the new table)
          - Auth Requirements: Authenticated users
          */

-- 1. Create the new table for insurance providers
CREATE TABLE IF NOT EXISTS public.insurance_providers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    created_at timestamptz DEFAULT now()
);

-- 2. Create a trigger function to prevent deletion if in use
CREATE OR REPLACE FUNCTION public.block_delete_if_insurance_in_use()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.patients WHERE primary_insurance = OLD.name) THEN
        RAISE EXCEPTION 'Cannot delete insurance provider "%" because it is still in use by one or more patients.', OLD.name;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach the trigger to the table
DROP TRIGGER IF EXISTS on_insurance_provider_delete ON public.insurance_providers;
CREATE TRIGGER on_insurance_provider_delete
BEFORE DELETE ON public.insurance_providers
FOR EACH ROW EXECUTE FUNCTION public.block_delete_if_insurance_in_use();

-- 4. Create an RPC function to get usage counts efficiently
CREATE OR REPLACE FUNCTION public.get_insurance_provider_usage()
RETURNS TABLE(name text, patient_count bigint) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ip.name,
        COUNT(p.id) as patient_count
    FROM
        public.insurance_providers ip
    LEFT JOIN
        public.patients p ON ip.name = p.primary_insurance
    GROUP BY
        ip.name
    ORDER BY
        ip.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Enable RLS and set up policies
ALTER TABLE public.insurance_providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read providers" ON public.insurance_providers;
CREATE POLICY "Allow authenticated users to read providers"
ON public.insurance_providers FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage providers" ON public.insurance_providers;
CREATE POLICY "Allow authenticated users to manage providers"
ON public.insurance_providers FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 6. Grant execute permissions on the new function
GRANT EXECUTE ON FUNCTION public.get_insurance_provider_usage() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_insurance_provider_usage() TO anon;
