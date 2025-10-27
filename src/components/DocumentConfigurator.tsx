import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import type { Patient, Order, DocumentTemplate } from '@/lib/types';
import { Loader2, Check, X, HelpCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/Checkbox';
import { Select } from '@/components/ui/Select';
import { Btn } from '@/components/ui/Btn';

interface DocumentConfiguratorProps {
  patient: Partial<Patient>;
  order: Partial<Order>;
  onPatientUpdate: (field: keyof Patient, value: any) => void;
  onOrderUpdate: (field: keyof Order, value: any) => void;
}

const DocumentConfigurator: React.FC<DocumentConfiguratorProps> = ({ patient, order, onPatientUpdate, onOrderUpdate }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('Standard');

  const { data: templates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['document_templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('document_templates').select('*').eq('is_active', true);
      if (error) throw error;
      return data as DocumentTemplate[];
    },
  });

  const groupedTemplates = useMemo(() => {
    if (!templates) return {};
    return templates.reduce((acc, t) => {
      const category = t.category || 'General';
      if (!acc[category]) acc[category] = [];
      acc[category].push(t);
      return acc;
    }, {} as Record<string, DocumentTemplate[]>);
  }, [templates]);

  const templateOptions = useMemo(() => {
    if (!templates) return [{ label: 'Standard', value: 'Standard' }];
    const uniqueCategories = Array.from(new Set(['Standard', ...templates.map(t => t.category).filter(Boolean)]));
    return uniqueCategories.map(c => ({ label: c, value: c }));
  }, [templates]);

  const handleToggleRequired = (abbrev: string, isChecked: boolean) => {
    const currentRequired = patient.required_documents || [];
    const newRequired = isChecked
      ? [...currentRequired, abbrev]
      : currentRequired.filter(d => d !== abbrev);
    onPatientUpdate('required_documents', Array.from(new Set(newRequired)));
  };

  const applyTemplate = () => {
    if (!templates) return;
    let templateDocs: string[] = [];
    if (selectedTemplate === 'Standard') {
        templateDocs = templates.filter(t => t.is_standard).map(t => t.abbrev);
    } else {
        templateDocs = templates.filter(t => t.category === selectedTemplate).map(t => t.abbrev);
    }
    onPatientUpdate('required_documents', Array.from(new Set([...(patient.required_documents || []), ...templateDocs])));
  };

  if (isLoadingTemplates) {
    return <div className="flex justify-center items-center h-40"><Loader2 className="h-6 w-6 animate-spin text-teal-500" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <Select
          label="Select Template"
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value)}
          options={templateOptions}
          wrapperClassName="flex-1"
        />
        <Btn variant="outline" onClick={applyTemplate}>Apply Template</Btn>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {Object.entries(groupedTemplates).map(([category, docs]) => (
          <div key={category}>
            <h4 className="font-semibold text-gray-600 text-sm mb-2">{category}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
              {docs.map(doc => {
                const isRequired = patient.required_documents?.includes(doc.abbrev);
                const status = order.document_status?.[doc.abbrev];
                return (
                  <div key={doc.abbrev} className="flex items-center justify-between p-2 rounded-md bg-gray-50 border">
                    <Checkbox
                      label={doc.name}
                      checked={!!isRequired}
                      onChange={(e) => handleToggleRequired(doc.abbrev, e.target.checked)}
                    />
                    <div className="flex items-center gap-2">
                        {status === 'Complete' && <Check className="h-4 w-4 text-green-500" />}
                        {status === 'Missing' && <X className="h-4 w-4 text-red-500" />}
                        <div title={doc.description} className="cursor-help text-gray-400 hover:text-gray-600">
                            <HelpCircle className="h-4 w-4" />
                        </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentConfigurator;
