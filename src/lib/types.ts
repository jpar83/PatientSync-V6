import { Database } from './database.types';

// New Enum types
export type LeadStatus = 'Prospect' | 'Warm' | 'Active' | 'Dormant' | 'Lost';
export type TouchpointType = 'Call' | 'Email' | 'Drop-in' | 'Meeting' | 'In-Service' | 'Other';
export type InServiceStatus = 'Planned' | 'Confirmed' | 'Done' | 'Cancelled';

// From `document_templates` table
export type DocumentTemplate = Database['public']['Tables']['document_templates']['Row'];

// New Note Type
export type PatientNote = Database['public']['Tables']['patient_notes']['Row'] & {
  profiles: Pick<Profile, 'full_name' | 'avatar_url'> | null;
};

// New table types from migration
export type Equipment = Database['public']['Tables']['equipment']['Row'] & {
  category?: "Wheelchair" | "Power Wheelchair" | "Scooter" | "Seating" | "Respiratory" | "Wound" | "Other" | null;
  notes?: string | null;
};
export type Denial = Database['public']['Tables']['denials']['Row'] & {
  payer?: string | null;
  reason_code?: string | null;
  reason_text?: string | null;
  stage_at_denial?: string | null;
  appeal_filed?: boolean | null;
  resolved?: boolean | null;
  notes?: string | null;
  appeal_date?: string | null;
  appeal_outcome?: string | null;
};
export type Regression = Database['public']['Tables']['regressions']['Row'];
export type InsuranceProvider = Database['public']['Tables']['insurance_providers']['Row'];

// From `patients` table
export type Patient = Database['public']['Tables']['patients']['Row'] & {
  gender?: string | null;
  phone_number?: string | null;
  email?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_relationship?: string | null;
  emergency_contact_phone?: string | null;
  policy_number?: string | null;
  group_number?: string | null;
  insurance_notes?: string | null;
  pcp_name?: string | null;
  referring_physician?: string | null;
  updated_hash?: string | null;
  source?: string | null;
  last_imported_at?: string | null;
  archived?: boolean | null;
  merged_into?: string | null;
  pcp_phone?: string | null;
  preferred_contact_method?: string | null;
  insurance_verified?: boolean | null;
  // Dynamic Document Fields
  required_documents?: string[] | null;
  telehealth_enabled?: boolean | null;
  financial_assistance?: boolean | null;
  // Snapshot PDF fields
  diagnosis?: string | null;
  height?: string | null;
  weight?: string | null;
  avatar_url?: string | null;
  // Normalized Insurance
  insurance_provider_id?: string | null;
  insurance_providers?: { name: string } | null;
  // Stoplight Status
  stoplight_status?: 'green' | 'yellow' | 'red' | null;
  // Joined Data
  patient_notes?: PatientNote[];
};

// From `orders` table
export type Order = Database['public']['Tables']['orders']['Row'] & {
  patients: Patient | null;
  vendors: Pick<Vendor, 'name' | 'email'> | null;
  clinical_notes?: string | null;
  mobility_needs?: string | null;
  equipment_requested?: string | null;
  pt_eval_date?: string | null;
  f2f_date?: string | null;
  assigned_rep?: string | null;
  market_rep?: string | null;
  date_received?: string | null;
  authorization_number?: string | null;
  order_date?: string | null;
  // Dynamic Document Fields
  document_status?: Record<string, 'Complete' | 'Missing' | 'Pending'> | null;
  // New Admin Fields
  case_type?: string | null;
  payer_region?: string | null;
  referral_source?: string | null;
  // Snapshot PDF fields
  justification?: string | null;
  // Stoplight Status
  stoplight_status?: 'green' | 'yellow' | 'red' | null;
  // Joined Data
  denials?: Denial[];
  equipment?: Equipment[];
  workflow_history?: WorkflowHistoryEntry[];
  patient_notes?: PatientNote[];
};

export type Doctor = Database['public']['Tables']['doctors']['Row'];
export type Vendor = Database['public']['Tables']['vendors']['Row'];
export type WorkflowHistoryEntry = Database['public']['Tables']['workflow_history']['Row'];
export type AuditLogEntry = Database['public']['Tables']['audit_log']['Row'];

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  firstName?: string | null;
  lastName?: string | null;
  role: 'admin' | 'user';
  created_at: string;
  avatar_url?: string | null;
  archived_at?: string | null;
};

// Marketing Hub Types
export type MarketingLead = Database['public']['Tables']['marketing_leads']['Row'] & {
    last_contact_date?: string | null;
    last_contact_purpose?: string | null;
    // New fields from migration
    source?: string | null;
    priority?: number | null;
    lead_status?: LeadStatus | null;
    last_contacted_at?: string | null;
    next_action_at?: string | null;
    primary_contact_id?: string | null;
    street?: string | null;
    suite?: string | null;
    full_address?: string | null;
    zip?: string | null;
    tags?: string[] | null;
    lead_score?: number | null;
    converted_to?: 'vendor' | 'account' | null;
    converted_ref_id?: string | null;
    deleted_at?: string | null;
    phone?: string | null;
    phone_extension?: string | null;
};
export type MarketingContact = Database['public']['Tables']['marketing_contacts']['Row'] & {
    // New fields from migration
    role?: string | null;
    phone?: string | null;
    email?: string | null;
    is_primary?: boolean | null;
    notes?: string | null;
};
export type MarketingTouchpoint = Database['public']['Tables']['marketing_touchpoints']['Row'] & { 
    marketing_leads: Pick<MarketingLead, 'name'> | null;
    // New fields from migration
    type?: TouchpointType | null;
    outcome?: string | null;
    follow_up_at?: string | null;
    duration_mins?: number | null;
};
export type MarketingInService = Database['public']['Tables']['marketing_in_services']['Row'] & { 
    marketing_leads: Pick<MarketingLead, 'name'> | null;
    // Status should use the new enum
    status?: InServiceStatus;
};

// RPC Function Types
export type DenialSummary = {
    patient_id: string;
    patient_name: string;
    denial_count: number;
};


export type WorkflowStage =
  | "Referral Received"
  | "Patient Intake & Demographics"
  | "Insurance Verification"
  | "Clinical Review"
  | "ATP / PT Assessment"
  | "Documentation Verification"
  | "Preauthorization (PAR)"
  | "Vendor / Order Processing"
  | "Delivery & Billing"
  | "Post-Delivery Follow-up / Archive";

export type KpiData = {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
};

export type ArchiveFilter = "active" | "archived" | "all";
