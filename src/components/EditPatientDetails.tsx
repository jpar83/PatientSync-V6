import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import type { Patient, Order } from '../lib/types';
import { usStates, preferredContactMethods } from "../lib/formConstants";
import DocumentConfigurator from "./DocumentConfigurator";

const Section = ({ id, title, children, isOpen, toggle }: { id: string, title: string, children: React.ReactNode, isOpen: boolean, toggle: () => void }) => (
  <div className="py-3">
    <button
      type="button"
      onClick={toggle}
      className="flex justify-between w-full text-left font-semibold text-text hover:text-accent"
    >
      {title}
      {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
    </button>
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key={id}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden mt-3 space-y-3 text-sm"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

interface EditPatientDetailsProps {
    patient: Patient;
    order: Order | null;
    onSave: (patientData: Partial<Patient>, orderData: Partial<Order>) => Promise<void>;
    onCancel: () => void;
    isSaving: boolean;
}

export default function EditPatientDetails({ patient, order, onCancel, onSave, isSaving }: EditPatientDetailsProps) {
  const [patientData, setPatientData] = useState<Partial<Patient>>(patient);
  const [orderData, setOrderData] = useState<Partial<Order>>(order || {});
  const [openSection, setOpenSection] = useState("patient");

  useEffect(() => {
    const formatDate = (dateStr: string | null | undefined) => dateStr ? new Date(dateStr).toISOString().split('T')[0] : '';
    setPatientData({ ...patient, dob: formatDate(patient.dob) });
    setOrderData({ ...order, referral_date: formatDate(order?.referral_date) } || {});
  }, [patient, order]);
  
  const handlePatientChange = (key: keyof Patient, value: any) => {
    setPatientData(p => ({ ...p, [key]: value }));
  };

  const handleOrderChange = (key: keyof Order, value: any) => {
    setOrderData(o => ({ ...o, [key]: value }));
  };

  const toggle = (id: string) => setOpenSection(openSection === id ? "" : id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(patientData, orderData);
  };

  return (
    <form id="patient-edit-form" onSubmit={handleSubmit}>
      <div className="divide-y divide-border-color/80">
        <Section id="patient" title="Patient Information" isOpen={openSection === 'patient'} toggle={() => toggle('patient')}>
          <Input label="Full Name" name="name" value={patientData.name || ''} onChange={(e) => handlePatientChange('name', e.target.value)} isRecommended />
          <Input label="Date of Birth" name="dob" type="date" value={patientData.dob || ''} onChange={(e) => handlePatientChange('dob', e.target.value)} isRecommended />
          <Input label="Gender" name="gender" value={patientData.gender || ''} onChange={(e) => handlePatientChange('gender', e.target.value)} />
          <Input label="Referring Doctor" name="referring_physician" value={patientData.referring_physician || ''} onChange={(e) => handlePatientChange('referring_physician', e.target.value)} />
          <Input label="Primary Care Provider (PCP)" name="pcp_name" value={patientData.pcp_name || ''} onChange={(e) => handlePatientChange('pcp_name', e.target.value)} isRecommended />
          <Input label="PCP Phone/Fax" name="pcp_phone" value={patientData.pcp_phone || ''} onChange={(e) => handlePatientChange('pcp_phone', e.target.value)} />
        </Section>
        
        <Section id="contact" title="Contact Information" isOpen={openSection === 'contact'} toggle={() => toggle('contact')}>
            <Input label="Phone Number" name="phone_number" type="tel" value={patientData.phone_number || ''} onChange={(e) => handlePatientChange('phone_number', e.target.value)} isRecommended />
            <Input label="Email" name="email" type="email" value={patientData.email || ''} onChange={(e) => handlePatientChange('email', e.target.value)} />
            <Input label="Address Line 1" name="address_line1" value={patientData.address_line1 || ''} onChange={(e) => handlePatientChange('address_line1', e.target.value)} wrapperClassName="sm:col-span-2" isRecommended />
            <Input label="Address Line 2" name="address_line2" value={patientData.address_line2 || ''} onChange={(e) => handlePatientChange('address_line2', e.target.value)} wrapperClassName="sm:col-span-2" />
            <Input label="City" name="city" value={patientData.city || ''} onChange={(e) => handlePatientChange('city', e.target.value)} isRecommended />
            <Select label="State" name="state" options={usStates} value={patientData.state || ''} onChange={(e) => handlePatientChange('state', e.target.value)} isRecommended />
            <Input label="ZIP Code" name="zip" value={patientData.zip || ''} onChange={(e) => handlePatientChange('zip', e.target.value)} isRecommended />
            <Select label="Preferred Contact Method" name="preferred_contact_method" options={preferredContactMethods} value={patientData.preferred_contact_method || ''} onChange={(e) => handlePatientChange('preferred_contact_method', e.target.value)} />
        </Section>

        <Section id="insurance" title="Insurance" isOpen={openSection === 'insurance'} toggle={() => toggle('insurance')}>
            <Input label="Primary Insurance" name="primary_insurance" value={patientData.primary_insurance || ''} onChange={(e) => handlePatientChange('primary_insurance', e.target.value)} isRecommended />
            <Input label="Policy Number" name="policy_number" value={patientData.policy_number || ''} onChange={(e) => handlePatientChange('policy_number', e.target.value)} />
            <Input label="Group Number" name="group_number" value={patientData.group_number || ''} onChange={(e) => handlePatientChange('group_number', e.target.value)} />
        </Section>

        <Section id="docs" title="Documents & Exceptions" isOpen={openSection === 'docs'} toggle={() => toggle('docs')}>
            <DocumentConfigurator
                patient={patientData}
                order={orderData}
                onPatientUpdate={(key, val) => handlePatientChange(key as keyof Patient, val)}
                onOrderUpdate={(key, val) => handleOrderChange(key as keyof Order, val)}
            />
        </Section>
      </div>
    </form>
  );
}
