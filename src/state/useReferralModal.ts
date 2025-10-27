import { create } from "zustand";
import type { Patient, Order } from "../lib/types";
import { docTemplates, DocKey } from "@/lib/docMapping";

type Mode = "quick" | "full";

export type ReferralForm = Partial<Patient> & Partial<Order> & {
    stoplight_status?: 'green' | 'yellow' | 'red';
};

// Find the standard template and get its keys to use as the default
const standardTemplate = docTemplates.find(t => t.id === 'standard_wc');
const defaultRequiredDocs = standardTemplate ? standardTemplate.keys : [];

const initialForm: ReferralForm = {
    name: "",
    primary_insurance: "",
    referral_source: "Clinic",
    referral_date: new Date().toISOString().split('T')[0],
    dob: "",
    gender: "",
    referring_physician: "",
    pcp_name: "",
    pcp_phone: "",
    phone_number: "",
    email: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    zip: "",
    preferred_contact_method: "",
    required_documents: defaultRequiredDocs, // Set default here
    document_status: {},
    stoplight_status: 'green',
};

interface RefState {
  open: boolean;
  mode: Mode;
  form: ReferralForm;
  openNew: (mode?: Mode, seed?: Partial<ReferralForm>) => void;
  close: () => void;
  setForm: (patch: Partial<ReferralForm>) => void;
  setMode: (m: Mode) => void;
}

export const useReferralModal = create<RefState>((set) => ({
  open: false,
  mode: "quick",
  form: initialForm,
  openNew: (mode = "quick", seed = {}) =>
    set(() => ({ open: true, mode, form: { ...initialForm, ...seed } })),
  close: () => set({ open: false, form: initialForm }),
  setForm: (patch) => set((s) => ({ form: { ...s.form, ...patch } })),
  setMode: (m) => set({ mode: m }),
}));
