/*
  # [Feature] Add Avatar URL to Profiles
  [This operation adds an 'avatar_url' column to the 'profiles' table to store user profile images.]
  ## Query Description: [This is a non-destructive, structural change. It adds a new text column to the 'profiles' table with no default value. Existing data will not be affected. This is required for the new profile picture upload functionality.]
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  ## Structure Details:
  - Table: public.profiles
  - Column Added: avatar_url (TEXT)
  ## Security Implications:
  - RLS Status: Enabled
  - Policy Changes: No (The existing policies on 'profiles' will cover this new column)
  - Auth Requirements: N/A
  ## Performance Impact:
  - Indexes: None
  - Triggers: None
  - Estimated Impact: Negligible.
*/
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;
