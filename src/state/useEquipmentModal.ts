import { create } from "zustand";
import type { Equipment } from "@/lib/types";

type EquipmentForm = Partial<Equipment>;

const initialForm: EquipmentForm = {
    category: 'Power Wheelchair',
    equipment_type: 'Power Wheelchair',
    model: '',
    serial_number: '',
    vendor_id: null,
    date_delivered: null,
    status: 'Pending Setup',
    notes: '',
    is_returned: false,
    date_returned: null,
    is_repaired: false,
    date_repaired: null,
};

interface EquipmentModalState {
  isOpen: boolean;
  editingEquipment: Equipment | null;
  orderId: string | null;
  form: EquipmentForm;
  openModal: (orderId: string, equipmentToEdit?: Equipment | null) => void;
  closeModal: () => void;
  setForm: (patch: Partial<EquipmentForm>) => void;
}

export const useEquipmentModal = create<EquipmentModalState>((set) => ({
  isOpen: false,
  editingEquipment: null,
  orderId: null,
  form: initialForm,
  openModal: (orderId, equipmentToEdit = null) =>
    set({ 
        isOpen: true, 
        orderId,
        editingEquipment: equipmentToEdit, 
        form: equipmentToEdit ? { ...equipmentToEdit } : { ...initialForm, order_id: orderId } 
    }),
  closeModal: () => set({ isOpen: false, editingEquipment: null, orderId: null, form: initialForm }),
  setForm: (patch) => set((s) => ({ form: { ...s.form, ...patch } })),
}));
