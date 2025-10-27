import { create } from "zustand";
import type { Denial } from "@/lib/types";

type DenialForm = Partial<Denial>;

const initialForm: DenialForm = {
    denial_date: new Date().toISOString().split('T')[0],
    reason_text: 'Documentation Missing',
    notes: '',
    appeal_filed: false,
    appeal_date: null,
    appeal_outcome: 'Pending',
    payer: '',
    reason_code: '',
    stage_at_denial: '',
    resolved: false,
};

interface DenialModalState {
  isOpen: boolean;
  editingDenial: Denial | null;
  orderId: string | null;
  form: DenialForm;
  openModal: (orderId: string, denialToEdit?: Denial | null) => void;
  closeModal: () => void;
  setForm: (patch: Partial<DenialForm>) => void;
}

export const useDenialModal = create<DenialModalState>((set) => ({
  isOpen: false,
  editingDenial: null,
  orderId: null,
  form: initialForm,
  openModal: (orderId, denialToEdit = null) =>
    set({ 
        isOpen: true, 
        orderId,
        editingDenial: denialToEdit, 
        form: denialToEdit ? { ...denialToEdit } : { ...initialForm, order_id: orderId } 
    }),
  closeModal: () => set({ isOpen: false, editingDenial: null, orderId: null, form: initialForm }),
  setForm: (patch) => set((s) => ({ form: { ...s.form, ...patch } })),
}));
