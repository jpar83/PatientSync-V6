-- Drop existing views if they exist to ensure a clean slate
DROP VIEW IF EXISTS view_notes_by_patient;
DROP VIEW IF EXISTS view_patient_details;
DROP VIEW IF EXISTS view_patient_history;
DROP VIEW IF EXISTS view_patients_all_wide;

-- View for notes joined with patient and user info
CREATE OR REPLACE VIEW view_notes_by_patient AS
SELECT
  p.id AS patient_id,
  p.name AS patient_name,
  p.primary_insurance AS payer,
  n.id AS note_id,
  n.body,
  n.source,
  n.stage_from,
  n.stage_to,
  u.full_name AS created_by_name,
  n.created_at
FROM patient_notes n
JOIN patients p ON p.id = n.patient_id
LEFT JOIN profiles u ON u.id = n.created_by;

-- View for core patient details with last note date
CREATE OR REPLACE VIEW view_patient_details AS
SELECT
  p.id AS patient_id,
  p.name AS patient_name,
  p.dob,
  p.phone_number,
  p.email,
  p.primary_insurance AS payer,
  o.workflow_stage AS current_stage,
  p.par_readiness,
  p.created_at,
  p.updated_at,
  (SELECT MAX(n.created_at) FROM patient_notes n WHERE n.patient_id = p.id) AS last_note_at
FROM patients p
LEFT JOIN (
    SELECT 
        patient_id, 
        workflow_stage,
        ROW_NUMBER() OVER(PARTITION BY patient_id ORDER BY created_at DESC) as rn
    FROM orders
) o ON p.id = o.patient_id AND o.rn = 1;


-- View for a unified patient event history
CREATE OR REPLACE VIEW view_patient_history AS
SELECT
  t.patient_id,
  t.patient_name,
  t.event_type,
  t.event_at,
  t.who,
  t.details_json
FROM (
  -- Stage changes
  SELECT
    p.id AS patient_id,
    p.name AS patient_name,
    'stage_change'::text AS event_type,
    h.changed_at AS event_at,
    u.full_name AS who,
    jsonb_build_object('from', h.stage_from, 'to', h.stage_to) AS details_json
  FROM stage_history h
  JOIN patients p ON p.id = h.patient_id
  LEFT JOIN profiles u ON u.id = h.changed_by

  UNION ALL

  -- Notes
  SELECT
    p.id,
    p.name,
    'note'::text,
    n.created_at,
    u.full_name,
    jsonb_build_object('source', n.source, 'body', n.body, 'stage_from', n.stage_from, 'stage_to', n.stage_to)
  FROM patient_notes n
  JOIN patients p ON p.id = n.patient_id
  LEFT JOIN profiles u ON u.id = n.created_by

  UNION ALL

  -- Denials
  SELECT
    o.patient_id,
    p.name,
    'denial'::text,
    d.created_at,
    'System'::text, -- denials table has no created_by
    to_jsonb(d) - 'order_id'
  FROM denials d
  JOIN orders o ON o.id = d.order_id
  JOIN patients p ON p.id = o.patient_id

  UNION ALL

  -- Equipment
  SELECT
    o.patient_id,
    p.name,
    'equipment'::text,
    e.created_at,
    'System'::text, -- equipment table has no created_by
    to_jsonb(e) - 'order_id'
  FROM equipment e
  JOIN orders o ON o.id = e.order_id
  JOIN patients p ON p.id = o.patient_id
) t;

-- Wide view for a snapshot of all patients
CREATE OR REPLACE VIEW view_patients_all_wide AS
SELECT
  p.id,
  p.name,
  p.dob,
  p.email,
  p.phone_number,
  p.address_line1,
  p.city,
  p.state,
  p.zip,
  p.primary_insurance,
  p.par_readiness,
  (
    SELECT o.workflow_stage
    FROM orders o
    WHERE o.patient_id = p.id
    ORDER BY o.created_at DESC
    LIMIT 1
  ) AS current_stage,
  (
    SELECT MAX(n.created_at)
    FROM patient_notes n
    WHERE n.patient_id = p.id
  ) AS last_note_at,
  (
    SELECT d.reason
    FROM denials d
    JOIN orders o ON o.id = d.order_id
    WHERE o.patient_id = p.id
    ORDER BY d.denial_date DESC
    LIMIT 1
  ) AS latest_denial_reason,
  (
    SELECT e.model
    FROM equipment e
    JOIN orders o ON o.id = e.order_id
    WHERE o.patient_id = p.id
    ORDER BY e.date_delivered DESC
    LIMIT 1
  ) AS latest_equipment_model
FROM
  patients p;


-- Grant usage on the new views to authenticated users
GRANT SELECT ON view_notes_by_patient TO authenticated;
GRANT SELECT ON view_patient_details TO authenticated;
GRANT SELECT ON view_patient_history TO authenticated;
GRANT SELECT ON view_patients_all_wide TO authenticated;
