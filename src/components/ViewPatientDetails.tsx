import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { Patient, Order, Equipment, Denial } from '../lib/types';
import DocumentationRequirements from './DocumentationRequirements';
import DenialPanel from './DenialPanel';
import EquipmentPanel from './EquipmentPanel';
import { LabelChip } from './ui/LabelChip';

const Field: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <div className="flex items-baseline gap-x-3 text-sm py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-b-0">
    <div className="flex-shrink-0"><LabelChip>{label}</LabelChip></div>
    <span className="text-gray-800 dark:text-gray-200 font-medium break-words">{value || '—'}</span>
  </div>
);

const Section: React.FC<{
  id: string;
  title: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  toggle: () => void;
}> = ({ id, title, children, isOpen, toggle }) => (
  <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
    <button
      className="flex justify-between w-full text-left font-semibold text-text p-3"
      onClick={toggle}
    >
      <div className="flex-1">{title}</div>
      {isOpen ? (
        <ChevronDown className="w-5 h-5 text-muted" />
      ) : (
        <ChevronRight className="w-5 h-5 text-muted" />
      )}
    </button>
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key={id}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="overflow-hidden"
        >
          <div className="px-3 pb-3 space-y-0.5 text-sm text-muted">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

interface ViewPatientDetailsProps {
  patient: Patient;
  order: Order | null;
  equipment: Equipment[];
  denials: Denial[];
}

export default function ViewPatientDetails({ patient, order, equipment, denials }: ViewPatientDetailsProps) {
  const [openSection, setOpenSection] = useState("");

  const { completedCount, totalRequired, hasMissing } = useMemo(() => {
    const required = patient.required_documents || [];
    if (required.length === 0) return { completedCount: 0, totalRequired: 0, hasMissing: false };
    
    const completed = required.filter(docAbbrev => order?.document_status?.[docAbbrev] === 'Complete').length;
    return {
        completedCount: completed,
        totalRequired: required.length,
        hasMissing: completed < required.length
    };
  }, [patient.required_documents, order?.document_status]);

  const toggleSection = (id: string) => {
    setOpenSection(prev => (prev === id ? "" : id));
  };
  
  const docSectionTitle = (
    <div className="flex flex-col">
        <span>Documentation Requirements</span>
        <div className="flex items-center gap-2 mt-1">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                <div 
                    className={`h-1 rounded-full ${hasMissing ? 'bg-amber-500' : 'bg-teal-500'}`}
                    style={{ width: `${totalRequired > 0 ? (completedCount/totalRequired)*100 : 100}%` }}
                />
            </div>
            <span className="text-xs font-medium text-muted whitespace-nowrap">{completedCount} / {totalRequired}</span>
        </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <Section id="patient" title="Patient Information" isOpen={openSection === 'patient'} toggle={() => toggleSection('patient')}>
        <Field label="Full Name" value={patient.name} />
        <Field label="Date of Birth" value={patient.dob ? new Date(patient.dob).toLocaleDateString() : ''} />
        <Field label="Gender" value={patient.gender} />
        <Field label="Referring Doctor" value={patient.referring_physician} />
        <Field label="Primary Care Provider (PCP)" value={patient.pcp_name} />
        <Field label="PCP Phone/Fax" value={patient.pcp_phone} />
      </Section>

      <Section id="contact" title="Contact Information" isOpen={openSection === 'contact'} toggle={() => toggleSection('contact')}>
        <Field label="Phone Number" value={patient.phone_number} />
        <Field label="Email" value={patient.email} />
        <Field label="Address Line 1" value={patient.address_line1} />
        <Field label="Address Line 2" value={patient.address_line2} />
        <Field label="City" value={patient.city} />
        <Field label="State" value={patient.state} />
        <Field label="Zip" value={patient.zip} />
      </Section>

      <Section id="docs" title={docSectionTitle} isOpen={openSection === 'docs'} toggle={() => toggleSection('docs')}>
        <DocumentationRequirements patient={patient} order={order} />
      </Section>

      <Section id="equipment" title={`🩺 Equipment (${equipment.length})`} isOpen={openSection === 'equipment'} toggle={() => toggleSection('equipment')}>
        <EquipmentPanel orderId={order?.id || ''} />
      </Section>

      <Section id="denials" title={`🚫 Denials & Appeals (${denials.length})`} isOpen={openSection === 'denials'} toggle={() => toggleSection('denials')}>
        <DenialPanel orderId={order?.id || ''} patientId={patient.id} />
      </Section>

      <Section id="admin" title="Administrative" isOpen={openSection === 'admin'} toggle={() => toggleSection('admin')}>
        <Field label="Insurance" value={patient.primary_insurance} />
        <Field label="Account" value={order?.vendors?.name || '—'} />
        <Field label="Case Type" value={order?.case_type || '—'} />
        <Field label="Referral Source" value={order?.referral_source || '—'} />
        <Field label="Payer Region" value={order?.payer_region || '—'} />
        <Field label="Status" value={patient.archived ? 'Archived' : 'Active'} />
      </Section>
    </div>
  );
}
