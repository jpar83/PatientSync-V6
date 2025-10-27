/*
          # [Feature] Dynamic Document System
          This migration sets up the database schema for a new dynamic document tracking system.

          ## Query Description: This script performs the following actions:
          1. Creates a new `document_templates` table to store all possible document types, categorized and described.
          2. Enables Row Level Security on the new table and adds a policy to allow all authenticated users to read the templates.
          3. Inserts a comprehensive list of seed data into `document_templates`, covering standard, mobility, respiratory, and other document categories.
          4. Adds a `required_documents` text array column to the `patients` table to store a list of document abbreviations required for that specific patient.
          5. Adds a `document_status` JSONB column to the `orders` table to track the completion status of each required document for a specific order.
          This is a non-destructive operation that adds new structures and columns with safe defaults.
          
          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true (by dropping the new table and columns)
          
          ## Structure Details:
          - New Table: `public.document_templates`
          - Affected Table: `public.patients` (new column `required_documents`)
          - Affected Table: `public.orders` (new column `document_status`)
          
          ## Security Implications:
          - RLS Status: Enabled on `document_templates`.
          - Policy Changes: Yes, a new read-only policy is added for `document_templates`.
          - Auth Requirements: Authenticated users can read templates.
          
          ## Performance Impact:
          - Indexes: The new table has a primary key and a unique constraint, which are indexed.
          - Triggers: None.
          - Estimated Impact: Negligible. The changes are additive and should not impact existing query performance.
          */

-- Create the document_templates table
CREATE TABLE public.document_templates (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    category text NOT NULL,
    name text NOT NULL,
    abbrev text NOT NULL UNIQUE,
    description text,
    is_standard boolean DEFAULT true,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT document_templates_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

-- Policies for document_templates
CREATE POLICY "Allow authenticated read access" ON public.document_templates
AS PERMISSIVE FOR SELECT
TO authenticated
USING (true);

-- Seed data for document_templates
INSERT INTO public.document_templates (category, name, abbrev, description, is_standard) VALUES
-- Standard Docs
('Standard', 'Face-to-Face', 'F2F', 'Face-to-face encounter notes with the physician.', true),
('Standard', 'PT Evaluation', 'PT_EVAL', 'Physical Therapy evaluation report.', true),
('Standard', 'Standard Written Order', 'SWO', 'The standard written order from the prescribing physician.', true),
('Standard', 'Detailed Product Description', 'DPD', 'Detailed description of the product being ordered.', true),
('Standard', 'HIPAA Consent', 'HIPAA', 'Patient''s consent form for HIPAA.', false),
('Standard', 'Insurance Card', 'INS_CARD', 'Copy of the patient''s primary and secondary insurance cards.', true),
('Standard', 'Proof of Delivery', 'POD', 'Signed proof of delivery for the equipment.', true),

-- Mobility
('Mobility', 'ATP Evaluation', 'ATP_EVAL', 'Assistive Technology Professional (ATP) evaluation report.', false),
('Mobility', 'Letter of Medical Necessity', 'LMN', 'A letter from the physician explaining the medical necessity of the equipment.', false),
('Mobility', 'Home Assessment', 'HOME_ASSESS', 'Assessment of the patient''s home environment.', false),
('Mobility', 'Seating Evaluation', 'SEAT_EVAL', 'Clinical evaluation for custom seating and positioning.', false),
('Mobility', 'Delivery Ticket', 'DEL_TICKET', 'Ticket or form signed upon delivery.', false),
('Mobility', 'Repair / Service Request', 'REPAIR_REQ', 'Request form for equipment repair or service.', false),

-- Respiratory
('Respiratory', 'Oxygen Qualification', 'O2_QUAL', 'Test results qualifying the patient for oxygen therapy.', false),
('Respiratory', 'Overnight Oximetry', 'OXIMETRY', 'Results from an overnight oximetry test.', false),
('Respiratory', 'PAP/CPAP Setup', 'PAP_SETUP', 'Documentation for PAP/CPAP machine setup and patient training.', false),
('Respiratory', 'RT Evaluation', 'RT_EVAL', 'Respiratory Therapist evaluation report.', false),
('Respiratory', '6-Minute Walk Test', '6MWT', 'Results from a 6-minute walk test for respiratory assessment.', false),

-- Wound Care
('Wound Care', 'Wound Progress Notes', 'WOUND_NOTES', 'Regular progress notes for wound care.', false),
('Wound Care', 'Dressing Log', 'DRESSING_LOG', 'Log of dressing changes for wound care.', false),
('Wound Care', 'NPWT Prescription', 'NPWT_RX', 'Prescription for Negative Pressure Wound Therapy.', false),
('Wound Care', 'Wound Photo Consent', 'WOUND_PHOTO', 'Consent form for taking photos of the wound.', false),

-- Telehealth
('Telehealth', 'Telehealth Evaluation', 'TELE_EVAL', 'Evaluation conducted via telehealth.', false),
('Telehealth', 'Telehealth Consent', 'TELE_CONSENT', 'Patient consent form for telehealth services.', false),
('Telehealth', 'Remote Monitoring Log', 'REMOTE_LOG', 'Log of remote patient monitoring data.', false),

-- Insurance / Admin
('Insurance', 'Authorization Form', 'AUTH_FORM', 'Prior authorization request form.', false),
('Insurance', 'PAR Request', 'PAR_REQ', 'Prior Authorization Request (PAR) submission form.', false),
('Insurance', 'Denial Letter', 'DENIAL', 'Insurance denial letter for an appeal.', false),
('Insurance', 'Financial Hardship Form', 'FIN_HARDSHIP', 'Form for patients applying for financial assistance.', false),
('Insurance', 'Advance Beneficiary Notice', 'ABN', 'Advance Beneficiary Notice of Noncoverage.', false),
('Insurance', 'Insurance Verification', 'INS_VERIFY', 'Internal insurance verification form.', false),
('Insurance', 'Appeal Packet', 'APPEAL', 'Complete packet for an insurance appeal.', false),

-- General / Compliance
('General', 'Chart Notes', 'CHART_NOTES', 'General chart notes from the physician.', false),
('General', 'Vendor Form', 'VENDOR_FORM', 'Any specific form required by the vendor.', false),
('General', 'Delivery Photo', 'DEL_PHOTO', 'Photo taken at the time of delivery.', false),
('General', 'Equipment Serial Log', 'SERIAL_LOG', 'Log of serial numbers for delivered equipment.', false),
('General', 'Misc Upload', 'MISC', 'Miscellaneous uploaded document.', false);

-- Update patients table
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS required_documents text[] DEFAULT ARRAY[]::text[];

-- Update orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS document_status jsonb DEFAULT '{}'::jsonb;
