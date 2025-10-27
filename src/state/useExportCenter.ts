import { create } from 'zustand';

export type ExportFormat = 'xlsx' | 'pdf' | 'docx' | 'csv';
export type ReportType = 'notes_by_patient' | 'patient_details' | 'patient_history' | 'patients_all_wide' | 'denials' | 'equipment';

export interface NormalizationOptions {
  normalizeDates: boolean;
  normalizeEnums: boolean;
  normalizeBooleans: boolean;
  normalizeEmpty: boolean;
  normalizePhone: boolean;
  normalizePayer: boolean;
}

export interface ExportConfig {
  format: ExportFormat;
  reportType: ReportType;
  filters: Record<string, any>;
  columns: string[];
  includePHI: boolean;
  timezone: string;
  dateFormat: string;
  normalization: NormalizationOptions;
}

interface ExportCenterState {
  isOpen: boolean;
  step: number;
  config: ExportConfig;
  openModal: (initialConfig?: Partial<ExportConfig>) => void;
  closeModal: () => void;
  nextStep: () => void;
  prevStep: () => void;
  setConfig: (patch: Partial<ExportConfig>) => void;
  reset: () => void;
}

const initialConfig: ExportConfig = {
  format: 'xlsx',
  reportType: 'patient_details',
  filters: {
    status: 'active',
    dateField: 'created_at',
    dateRange: { from: null, to: null },
    payers: [],
    stages: [],
    tags: [],
    patients: [],
  },
  columns: [],
  includePHI: false,
  timezone: 'America/Chicago',
  dateFormat: 'MMM d, yyyy h:mm a',
  normalization: {
    normalizeDates: true,
    normalizeEnums: true,
    normalizeBooleans: true,
    normalizeEmpty: true,
    normalizePhone: false,
    normalizePayer: false,
  },
};

export const useExportCenter = create<ExportCenterState>((set) => ({
  isOpen: false,
  step: 1,
  config: initialConfig,
  openModal: (initial = {}) => {
    const reportType = initial.reportType || initialConfig.reportType;
    set({ 
      isOpen: true, 
      step: 1, 
      config: { ...initialConfig, ...initial, reportType } 
    });
  },
  closeModal: () => set({ isOpen: false }),
  nextStep: () => set((state) => ({ step: Math.min(3, state.step + 1) })),
  prevStep: () => set((state) => ({ step: Math.max(1, state.step - 1) })),
  setConfig: (patch) => set((state) => ({ config: { ...state.config, ...patch } })),
  reset: () => set({ config: initialConfig, step: 1 }),
}));
