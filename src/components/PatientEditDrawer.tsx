import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from '../lib/supabaseClient';
import { Loader2, Edit } from 'lucide-react';
import SlideOver from './ui/SlideOver';
import { Btn } from './ui/Btn';
import { writeAuditLog } from '../lib/auditLogger';
import { useAuth } from '../contexts/AuthContext';
import type { Patient, Order } from '../lib/types';
import { toast } from '../lib/toast';
import ViewPatientDetails from './ViewPatientDetails';
import EditPatientDetails from './EditPatientDetails';

interface PatientEditDrawerProps {
    patientId: string | null;
    onClose: () => void;
    onUpdate: () => void;
}

const recommendedFields: (keyof Patient)[] = ['name', 'dob', 'pcp_name', 'phone_number', 'address_line1', 'city', 'zip', 'primary_insurance'];

const PatientEditDrawer: React.FC<PatientEditDrawerProps> = ({ patientId, onClose, onUpdate }) => {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isEditMode && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isEditMode]);

  useEffect(() => {
    const fetchPatientData = async () => {
        if (!patientId) {
            setPatient(null);
            setOrder(null);
            setIsEditMode(false);
            return;
        }
        setIsLoading(true);
        setIsEditMode(false); // Always open in view mode
        const { data: patientData, error: patientError } = await supabase.from('patients').select('*').eq('id', patientId).single();
        if (patientError) {
            toast('Failed to fetch patient details.', 'err');
            onClose();
            setIsLoading(false);
            return;
        }
        
        const { data: orderData } = await supabase.from('orders').select('*, vendors(name, email)').eq('patient_id', patientId).order('created_at', { ascending: false }).limit(1).single();

        setPatient(patientData as Patient);
        setOrder(orderData as Order | null);
        setIsLoading(false);
    };
    fetchPatientData();
  }, [patientId, onClose]);

  const handleSave = async (patientData: Partial<Patient>, orderData: Partial<Order>) => {
    if (!patient) return;
    setIsSaving(true);
    const patientPayload = { ...patientData };
    delete patientPayload.id;
    delete patientPayload.created_at;
    if (patientPayload.dob === '') { patientPayload.dob = null; }

    try {
      const { data: updatedPatient, error: patientUpdateError } = await supabase.from('patients').update(patientPayload).eq('id', patient.id).select().single();
      if (patientUpdateError) throw patientUpdateError;
      
      if(order?.id) {
        const orderPayload = { ...orderData };
        delete orderPayload.id; delete orderPayload.created_at; delete orderPayload.patients; delete orderPayload.vendors;
        const { error: orderUpdateError } = await supabase.from('orders').update(orderPayload).eq('id', order.id);
        if (orderUpdateError) throw orderUpdateError;
      }
      
      await writeAuditLog('patient_update', { changed_by: user?.email, changed_user: patientPayload.name || patient.name, patient_id: patient.id });
      
      const missingRecommended = recommendedFields.some(field => !patientData[field]);
      if (missingRecommended) toast('Saved with missing recommended fields.', 'warning');
      else toast('Patient details saved successfully.', 'ok');
      
      setPatient(updatedPatient as Patient);
      onUpdate();
      setIsEditMode(false);
    } catch (error: any) {
      console.error("Failed to save patient details:", error);
      if (error.code === '23505') toast('This email address is already in use.', 'err');
      else toast(`Failed to save patient details.`, 'err');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleSaveWrapper = async (patientData: Partial<Patient>, orderData: Partial<Order>) => {
    await handleSave(patientData, orderData);
  };

  if (!patientId) return null;

  return (
    <SlideOver 
        isOpen={true} 
        onClose={onClose} 
        title={patient?.name?.toUpperCase() || "Patient Details"}
        headerContent={
            !isLoading && patient && !isEditMode && (
              <Btn variant="outline" size="sm" onClick={() => setIsEditMode(true)}>
                <Edit className="w-4 h-4 mr-2" /> Edit
              </Btn>
            )
        }
    >
        {isLoading ? (
            <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-teal-500" /></div>
        ) : patient ? (
            <div ref={scrollContainerRef} className="p-6 h-full">
              <AnimatePresence mode="wait">
                {isEditMode ? (
                  <motion.div
                    key="edit"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                  >
                    <EditPatientDetails 
                        patient={patient} 
                        order={order}
                        onSave={handleSaveWrapper}
                        onCancel={() => setIsEditMode(false)}
                        isSaving={isSaving}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="view"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                  >
                    <ViewPatientDetails patient={patient} order={order} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
        ) : (
            <div className="p-6 text-center text-muted">Patient not found.</div>
        )}
    </SlideOver>
  );
};

export default PatientEditDrawer;
