/*
  # Create patient_notes table and related objects

  This migration introduces a dedicated table for storing patient notes, separating them from the general audit log. It includes columns for note content, source tracking (manual vs. automated), pinning, and tagging capabilities.

  ## Query Description: This script creates the `patient_notes` table, enables Row Level Security (RLS), and sets up policies to ensure users can only access and manage their own notes. It also adds an `updated_at` trigger to automatically track modifications. This is a structural change and is non-destructive.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (with a down migration)

  ## Structure Details:
  - Tables created: `patient_notes`
  - Indexes created: `idx_patient_notes_patient`, `idx_patient_notes_tags`
  - Triggers created: `set_updated_at` on `patient_notes`
  - RLS policies created: `notes_read`, `notes_insert`, `notes_update`, `notes_delete` on `patient_notes`
  - Extensions enabled: `moddatetime`

  ## Security Implications:
  - RLS Status: Enabled on `patient_notes`.
  - Policy Changes: Yes, new policies are added for the `patient_notes` table.
  - Auth Requirements: Policies are based on `auth.uid()`, requiring an authenticated user.

  ## Performance Impact:
  - Indexes: Adds two new indexes to speed up queries on `patient_id` and `tags`.
  - Triggers: Adds a trigger that runs on every update to the `patient_notes` table.
  - Estimated Impact: Low. The impact is minimal and localized to the new table.
*/

-- Enable the moddatetime extension to automatically update `updated_at` timestamps.
CREATE EXTENSION IF NOT EXISTS moddatetime;

-- Create the patient_notes table
CREATE TABLE public.patient_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    body text NOT NULL,
    source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'stage_change')),
    stage_from text,
    stage_to text,
    is_pinned boolean NOT NULL DEFAULT false,
    tags text[] NOT NULL DEFAULT '{}',
    created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add comments to the table and columns for clarity
COMMENT ON TABLE public.patient_notes IS 'Stores notes related to patients, separate from the main audit log.';
COMMENT ON COLUMN public.patient_notes.source IS 'Indicates if the note was created manually by a user or automatically during a stage change.';
COMMENT ON COLUMN public.patient_notes.is_pinned IS 'If true, the note will be displayed at the top of the notes list.';
COMMENT ON COLUMN public.patient_notes.tags IS 'Array of tags for categorizing and filtering notes.';

-- Create indexes for performance
CREATE INDEX idx_patient_notes_patient ON public.patient_notes(patient_id, created_at DESC);
CREATE INDEX idx_patient_notes_tags ON public.patient_notes USING gin(tags);

-- Create the trigger for updating `updated_at`
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.patient_notes
FOR EACH ROW
EXECUTE PROCEDURE moddatetime(updated_at);

-- Enable Row Level Security
ALTER TABLE public.patient_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "notes_read" ON public.patient_notes
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "notes_insert" ON public.patient_notes
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "notes_update" ON public.patient_notes
FOR UPDATE USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

CREATE POLICY "notes_delete" ON public.patient_notes
FOR DELETE USING (auth.uid() = created_by);
