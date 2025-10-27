import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Btn as Button } from "@/components/ui/Btn";
import ViewPatientDetails from "@/components/ViewPatientDetails";
import EditPatientDetails from "@/components/EditPatientDetails";
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { writeAuditLog } from '../lib/auditLogger';
import { toast } from '../lib/toast';
import type { Patient, Order } from '../lib/types';

export default function PatientDrawerMobile({ patient, open, onClose, onUpdate }: { patient: Patient | null, open: boolean, onClose: () => void, onUpdate: () => void }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (patient) {
        const fetchOrder = async () => {
            const { data } = await supabase.from('orders').select('*, vendors(name, email)').eq('patient_id', patient.id).order('created_at', { ascending: false }).limit(1).single();
            setOrder(data as Order | null);
        };
        fetchOrder();
    } else {
        setOrder(null);
    }
  }, [patient]);

  useEffect(() => {
      setIsEditMode(false);
  }, [patient]);

  if (!patient) return null;
  
  const handleSave = async (patientData: Partial<Patient>, orderData: Partial<Order>) => {
    setIsSaving(true);
    const patientPayload = { ...patientData };
    delete patientPayload.id;
    delete patientPayload.created_at;
    if (patientPayload.dob === '') { patientPayload.dob = null; }

    try {
      const { error: patientUpdateError } = await supabase.from('patients').update(patientPayload).eq('id', patient.id);
      if (patientUpdateError) throw patientUpdateError;
      
      if(order?.id) {
        const orderPayload = { ...orderData };
        delete orderPayload.id; delete orderPayload.created_at; delete orderPayload.patients; delete orderPayload.vendors;
        const { error: orderUpdateError } = await supabase.from('orders').update(orderPayload).eq('id', order.id);
        if (orderUpdateError) throw orderUpdateError;
      }
      
      await writeAuditLog('patient_update', { changed_by: user?.email, changed_user: patientPayload.name || patient.name, patient_id: patient.id });
      
      toast('Patient details saved successfully.', 'ok');
      onUpdate();
      setIsEditMode(false);
    } catch (error: any) {
      console.error("Failed to save patient details:", error);
      toast(`Failed to save patient details.`, 'err');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onClose}>
      <DrawerContent
        className="p-0 rounded-t-2xl h-[95vh] max-h-[95vh] overflow-hidden 
                   shadow-xl bg-white dark:bg-surface relative"
      >
        <motion.div
          layout
          className="sticky top-0 z-20 bg-teal-700 text-white flex justify-between items-center px-4 py-3 shadow-sm"
          initial={false}
          animate={{
            backgroundColor: isEditMode ? "#0f766e" : "#0d9488",
          }}
          transition={{ duration: 0.25 }}
        >
          <h2 className="text-lg font-semibold truncate">
            {patient.name?.toUpperCase() || "PATIENT DETAILS"}
          </h2>
          <div className="flex items-center space-x-2">
            {!isEditMode && (
              <Button
                size="sm"
                variant="outline"
                className="text-sm bg-white/20 hover:bg-white/30 text-white border-white/50"
                onClick={() => setIsEditMode(true)}
              >
                Edit
              </Button>
            )}
            <button
              onClick={onClose}
              className="text-white text-2xl leading-none pb-1"
            >
              ×
            </button>
          </div>
        </motion.div>

        <div className="h-[calc(95vh-60px)] overflow-y-auto p-4 pb-16">
          <AnimatePresence mode="wait">
            {isEditMode ? (
              <motion.div
                key="edit"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                <EditPatientDetails
                  patient={patient}
                  order={order}
                  onCancel={() => setIsEditMode(false)}
                  onSave={handleSave}
                  isSaving={isSaving}
                />
              </motion.div>
            ) : (
              <motion.div
                key="view"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                <ViewPatientDetails patient={patient} order={order} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
