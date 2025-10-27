import React, { useState, useEffect } from 'react';
import { Checkbox } from './ui/Checkbox';
import type { DocumentFlags } from '../lib/types';
import { AlertTriangle } from 'lucide-react';

interface DocumentsChecklistProps {
  docs: DocumentFlags;
  onChange: (newDocs: DocumentFlags) => void;
  insurance?: string | null;
}

const documentLabels: Record<keyof DocumentFlags, string> = {
  f2f: "F2F Note",
  pt_eval: "PT Evaluation",
  swo: "SWO",
  dpd: "DPD",
  telehealth: "Telehealth Done",
  aor: "AOR Form",
  telehealth_form: "Telehealth Consent",
};

const DocumentsChecklist: React.FC<DocumentsChecklistProps> = ({ docs, onChange, insurance }) => {
  const [isReadyForPAR, setIsReadyForPAR] = useState(true);

  useEffect(() => {
    if (docs) {
      const coreDocsMissing = ["f2f", "pt_eval", "swo", "dpd"].some(k => !docs[k as keyof DocumentFlags]);
      const needsAOR = !!insurance?.toLowerCase().includes("united") && !docs.aor;
      const needsTelehealthForm = docs.telehealth && !docs.telehealth_form;
      
      setIsReadyForPAR(!coreDocsMissing && !needsAOR && !needsTelehealthForm);
    }
  }, [docs, insurance]);

  const items = Object.keys(documentLabels) as (keyof DocumentFlags)[];

  const handleChange = (key: keyof DocumentFlags, checked: boolean) => {
    onChange({ ...docs, [key]: checked });
  };

  return (
    <div className="space-y-4">
       <h3 className="text-base font-semibold text-gray-800">Required Documents</h3>
       
       {!isReadyForPAR && (
         <div className="flex items-start p-3 text-sm text-yellow-800 rounded-lg bg-yellow-50" role="alert">
           <AlertTriangle className="flex-shrink-0 inline w-5 h-5 mr-3"/>
           <div>
             Missing required documentation for PAR submission. Please review the checklist.
           </div>
         </div>
       )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(key => (
          <Checkbox
            key={key}
            label={documentLabels[key]}
            checked={!!docs[key]}
            onChange={e => handleChange(key, e.target.checked)}
          />
        ))}
      </div>
    </div>
  );
};

export default DocumentsChecklist;
