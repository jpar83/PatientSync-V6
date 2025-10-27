import { create } from "zustand";

export type MarketingModalMode = 'lead' | 'contact' | 'touchpoint' | 'event';

const initialForm = {
    // Lead fields
    name: '',
    type: 'Clinic',
    street: '',
    suite: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    phone_extension: '',
    lead_status: 'Prospect',
    manualLeadName: '',
    
    // Shared fields
    lead_id: '',
    lead_name: '',
    notes: '',

    // Touchpoint fields
    purpose: 'Follow-up',
    outcome: 'Neutral',
    next_step: '',
    follow_up_at: '',
    
    // Event (formerly In-service) fields
    event_type: 'In-Service',
    topic: '',
    start_at: '',
    end_at: '',
    location: '',
    status: 'Planned',
    assigned_to: null,
    attendees: null,
};

interface MarketingModalState {
  isOpen: boolean;
  mode: MarketingModalMode;
  editingId: string | null;
  form: Record<string, any>;
  originalForm: Record<string, any> | null;
  openModal: (mode?: MarketingModalMode, seed?: Record<string, any>, editingId?: string | null) => void;
  closeModal: () => void;
  setForm: (patch: Record<string, any>) => void;
}

export const useMarketingModal = create<MarketingModalState>((set) => ({
  isOpen: false,
  mode: "lead",
  editingId: null,
  form: initialForm,
  originalForm: null,
  openModal: (mode = "lead", seed = {}, editingId = null) =>
    set(() => {
        const baseForm = { ...initialForm, ...seed };
        
        if (!editingId) {
            if (mode === 'touchpoint') baseForm.type = 'Call';
            if (mode === 'event') baseForm.status = 'Planned';
            if (mode === 'lead') baseForm.type = 'Clinic';
        } else {
            if (mode === 'touchpoint' && seed.type) baseForm.type = seed.type;
            if (mode === 'event' && seed.status) baseForm.status = seed.status;
        }
        
        return { 
            isOpen: true, 
            mode, 
            form: baseForm, 
            originalForm: seed,
            editingId 
        };
    }),
  closeModal: () => set({ isOpen: false, form: initialForm, editingId: null, originalForm: null }),
  setForm: (patch) => set((s) => ({ form: { ...s.form, ...patch } })),
}));
