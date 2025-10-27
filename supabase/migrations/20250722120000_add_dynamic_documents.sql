/*
          # [Operation Name]
          Create Dynamic Document System

          ## Query Description: [This script sets up the database structure for a dynamic, patient-specific document tracking system. It creates a new `document_templates` table to store all possible document types, seeds it with a comprehensive list of standard and specialized documents, and adds two new columns to the `patients` table: `required_documents` (an array to list which documents are needed for a specific patient) and `document_status` (a JSON object to track the status of each required document, e.g., "Complete" or "Missing"). This operation is non-destructive and adds new capabilities without altering existing data.]
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true
          
          ## Structure Details:
          - Adds new table: `public.document_templates`
          - Adds new columns to `public.patients`: `required_documents` (text[]), `document_status` (jsonb)
          
          ## Security Implications:
          - RLS Status: Enabled on new `document_templates` table.
          - Policy Changes: Adds read-only policy for authenticated users on the new table.
          - Auth Requirements: None
          
          ## Performance Impact:
          - Indexes: Adds primary key and unique constraint on the new table.
          - Triggers: None
          - Estimated Impact: Negligible performance impact. Adds new structures for future features.
          */

-- Create the document_templates table to store all possible document types.
CREATE TABLE IF NOT EXISTS public.document_templates (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    category text NOT NULL,
    name text NOT NULL,
    abbrev text,
    description text,
    is_standard boolean DEFAULT true,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT document_templates_pkey PRIMARY KEY (id),
    CONSTRAINT document_templates_name_key UNIQUE (name)
);

-- Add comments for clarity
COMMENT ON TABLE public.document_templates IS 'Stores templates for all possible patient-related documents.';
COMMENT ON COLUMN public.document_templates.category IS 'The category the document belongs to (e.g., Standard, Mobility, Respiratory).';
COMMENT ON COLUMN public.document_templates.name IS 'The full name of the document (e.g., Face-to-Face).';
COMMENT ON COLUMN public.document_templates.abbrev IS 'A short abbreviation for the document (e.g., F2F).';
COMMENT ON COLUMN public.document_templates.is_standard IS 'Indicates if this is a default, standard document for most patients.';

-- Enable Row Level Security on the new table
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to read templates
CREATE POLICY "Allow authenticated users to read document templates" ON public.document_templates
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

-- Allow admins full access (for future management)
CREATE POLICY "Allow full access for admins" ON public.document_templates
AS PERMISSIVE FOR ALL
TO service_role
USING (true);


-- Seed the document_templates table with default and specialized documents.
-- Using ON CONFLICT to make the script safely re-runnable.
INSERT INTO public.document_templates (category, name, abbrev, description, is_standard)
VALUES
    ('Standard', 'Face-to-Face', 'F2F', 'Face-to-face encounter notes with the physician.', true),
    ('Standard', 'PT Evaluation', 'PT_EVAL', 'Physical Therapy evaluation report.', true),
    ('Standard', 'Standard Written Order', 'SWO', 'The standard written order from the prescribing physician.', true),
    ('Standard', 'Detailed Product Description', 'DPD', 'Detailed description of the product being ordered.', true),
    ('Standard', 'HIPAA Consent', 'HIPAA', 'Patient''s consent form for HIPAA compliance.', false),
    ('Standard', 'Insurance Card', 'INS_CARD', 'Copy of the patient''s primary and secondary insurance cards.', true),
    ('Standard', 'Proof of Delivery', 'POD', 'Signed proof of delivery for the equipment.', false),
    ('Mobility', 'ATP Evaluation', 'ATP_EVAL', 'Assistive Technology Professional (ATP) evaluation for complex mobility equipment.', false),
    ('Mobility', 'Letter of Medical Necessity', 'LMN', 'A detailed letter from the physician justifying the medical necessity of the equipment.', false),
    ('Mobility', 'Home Assessment', 'HOME_ASSESS', 'Assessment of the patient''s home environment for equipment compatibility and safety.', false),
    ('Mobility', 'Seating Evaluation', 'SEAT_EVAL', 'Evaluation for custom seating and positioning needs.', false),
    ('Mobility', 'Delivery Ticket', 'DEL_TICKET', 'Ticket or form signed by the patient upon delivery of equipment.', false),
    ('Mobility', 'Repair / Service Request', 'REPAIR_REQ', 'Form for requesting equipment repair or service.', false),
    ('Respiratory', 'Oxygen Qualification', 'O2_QUAL', 'Documentation qualifying the patient for home oxygen therapy.', false),
    ('Respiratory', 'Overnight Oximetry', 'OXIMETRY', 'Results from an overnight oximetry test to assess oxygen saturation.', false),
    ('Respiratory', 'PAP/CPAP Setup', 'PAP_SETUP', 'Setup and compliance form for PAP/CPAP equipment.', false),
    ('Respiratory', 'RT Evaluation', 'RT_EVAL', 'Respiratory Therapist evaluation report.', false),
    ('Respiratory', '6-Minute Walk Test', '6MWT', 'Results from a 6-minute walk test, often required for oxygen qualification.', false),
    ('Wound Care', 'Wound Progress Notes', 'WOUND_NOTES', 'Regular progress notes detailing the status of a wound.', false),
    ('Wound Care', 'Dressing Log', 'DRESS_LOG', 'Log of dressing changes and supplies used for wound care.', false),
    ('Wound Care', 'NPWT Prescription', 'NPWT_RX', 'Prescription for Negative Pressure Wound Therapy.', false),
    ('Wound Care', 'Wound Photo Consent', 'PHOTO_CONSENT', 'Patient consent for taking photos of the wound for documentation.', false),
    ('Telehealth', 'Telehealth Evaluation', 'TELE_EVAL', 'Evaluation conducted via a telehealth appointment.', false),
    ('Telehealth', 'Telehealth Consent', 'TELE_CONSENT', 'Patient consent form for receiving services via telehealth.', false),
    ('Telehealth', 'Remote Monitoring Log', 'REMOTE_LOG', 'Log of data from remote patient monitoring devices.', false),
    ('Insurance / Admin', 'Authorization Form', 'AUTH_FORM', 'Form submitted to the payer for prior authorization.', false),
    ('Insurance / Admin', 'PAR Request', 'PAR_REQ', 'Prior Authorization Request form, often payer-specific.', false),
    ('Insurance / Admin', 'Denial Letter', 'DENIAL', 'Official denial letter from the insurance payer for an appeal.', false),
    ('Insurance / Admin', 'Financial Hardship Form', 'FIN_HARDSHIP', 'Form for patients applying for financial assistance or a reduced payment plan.', false),
    ('Insurance / Admin', 'Advance Beneficiary Notice', 'ABN', 'Advance Beneficiary Notice of Noncoverage, for Medicare patients.', false),
    ('Insurance / Admin', 'Insurance Verification', 'INS_VERIFY', 'Internal form documenting insurance verification details.', false),
    ('Insurance / Admin', 'Appeal Packet', 'APPEAL', 'The complete packet of documents submitted for an insurance appeal.', false),
    ('General / Compliance', 'Chart Notes', 'CHART_NOTES', 'General chart notes from the physician or clinic related to the order.', false),
    ('General / Compliance', 'Vendor Form', 'VENDOR_FORM', 'Any specific form required by the equipment vendor.', false),
    ('General / Compliance', 'Delivery Photo', 'DEL_PHOTO', 'Photo of the equipment delivered to the patient or their home.', false),
    ('General / Compliance', 'Equipment Serial Log', 'SERIAL_LOG', 'Log of the equipment''s serial number for tracking.', false),
    ('General / Compliance', 'Misc Upload', 'MISC', 'A category for any miscellaneous document that doesn''t fit elsewhere.', false)
ON CONFLICT (name) DO NOTHING;

-- Add new columns to the patients table to track required documents and their status.
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS required_documents text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS document_status jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.patients.required_documents IS 'An array of document names (from document_templates) required for this patient.';
COMMENT ON COLUMN public.patients.document_status IS 'A JSON object tracking the status of each required document, e.g., {"F2F": "Complete", "SWO": "Missing"}.';
