export type ReportType = 'notes_by_patient' | 'patient_details' | 'patient_history' | 'patients_all_wide' | 'denials' | 'equipment';

export interface ColumnDefinition {
  key: string;
  label: string;
  isDefault: boolean;
  isPHI: boolean;
  type?: 'date' | 'string' | 'number' | 'boolean' | 'enum' | 'phone';
}

export const reportSchemas: Record<ReportType, { label: string; view: string; columns: ColumnDefinition[] }> = {
  notes_by_patient: {
    label: 'Notes by Patient',
    view: 'view_notes_by_patient',
    columns: [
      { key: 'patient_name', label: 'Patient Name', isDefault: true, isPHI: true, type: 'string' },
      { key: 'created_at', label: 'Note Date', isDefault: true, isPHI: false, type: 'date' },
      { key: 'created_by_name', label: 'Author', isDefault: true, isPHI: false, type: 'string' },
      { key: 'body', label: 'Note Body', isDefault: true, isPHI: true, type: 'string' },
      { key: 'source', label: 'Source', isDefault: true, isPHI: false, type: 'enum' },
      { key: 'stage_from', label: 'Stage From', isDefault: false, isPHI: false, type: 'enum' },
      { key: 'stage_to', label: 'Stage To', isDefault: false, isPHI: false, type: 'enum' },
      { key: 'payer', label: 'Payer', isDefault: false, isPHI: true, type: 'string' },
      { key: 'patient_id', label: 'Patient ID', isDefault: false, isPHI: true, type: 'string' },
    ],
  },
  patient_details: {
    label: 'Patient Details',
    view: 'view_patient_details',
    columns: [
      { key: 'patient_name', label: 'Patient Name', isDefault: true, isPHI: true, type: 'string' },
      { key: 'dob', label: 'DOB', isDefault: true, isPHI: true, type: 'date' },
      { key: 'phone', label: 'Phone', isDefault: false, isPHI: true, type: 'phone' },
      { key: 'email', label: 'Email', isDefault: false, isPHI: true, type: 'string' },
      { key: 'payer', label: 'Payer', isDefault: true, isPHI: false, type: 'string' },
      { key: 'current_stage', label: 'Current Stage', isDefault: true, isPHI: false, type: 'enum' },
      { key: 'last_note_at', label: 'Last Note Date', isDefault: false, isPHI: false, type: 'date' },
      { key: 'created_at', label: 'Created Date', isDefault: false, isPHI: false, type: 'date' },
      { key: 'patient_id', label: 'Patient ID', isDefault: false, isPHI: true, type: 'string' },
    ],
  },
  // Temporarily disabled until schema is confirmed
  patient_history: {
    label: 'Patient History (Coming Soon)',
    view: 'patient_history',
    columns: [],
  },
  patients_all_wide: {
    label: 'All Patients (Wide) (Coming Soon)',
    view: 'view_patients_all_wide',
    columns: [],
  },
  denials: {
    label: 'Denials & Appeals (Coming Soon)',
    view: 'denials',
    columns: [],
  },
  equipment: {
    label: 'Equipment Issued (Coming Soon)',
    view: 'equipment',
    columns: [],
  },
};
