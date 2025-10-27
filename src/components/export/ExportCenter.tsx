import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/button';
import { useExportCenter, ExportConfig } from '@/state/useExportCenter';
import { reportSchemas, ReportType, ColumnDefinition } from '@/lib/export/reportSchemas';
import { generateExport } from '@/lib/export/generateExport';
import { Loader2, FileUp, ListChecks, CheckCircle, Download, ChevronDown, ChevronRight } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from '@/lib/toast';

const StepIndicator: React.FC<{ current: number, total: number }> = ({ current, total }) => (
  <div className="flex justify-center items-center gap-2">
    {Array.from({ length: total }).map((_, i) => (
      <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i + 1 <= current ? 'bg-accent' : 'bg-gray-300'}`} />
    ))}
  </div>
);

const StepWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
        {children}
    </motion.div>
);

const timezones = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Phoenix', 'Pacific/Honolulu'];
const dateFormats = ['MMM d, yyyy h:mm a', 'MM/dd/yyyy', 'yyyy-MM-dd HH:mm'];

const ExportCenter: React.FC = () => {
  const { isOpen, closeModal, step, nextStep, prevStep, config, setConfig } = useExportCenter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [estimatedRows, setEstimatedRows] = useState<number | null>(null);

  const availableReports = useMemo(() => {
    return Object.entries(reportSchemas)
      .map(([key, schema]) => ({ 
          value: key, 
          label: schema.label,
          disabled: schema.columns.length === 0,
       }));
  }, []);

  useEffect(() => {
    if (isOpen && config.reportType) {
      const schema = reportSchemas[config.reportType as ReportType];
      if (schema && (!config.columns || config.columns.length === 0)) {
        setConfig({ columns: schema.columns.filter(c => c.isDefault).map(c => c.key) });
      }
    }
  }, [isOpen, config.reportType, config.columns, setConfig]);
  
  const { data: fetchedData, isLoading: isLoadingData } = useQuery({
    queryKey: ['export_data', config.reportType, config.filters],
    queryFn: async () => {
      const schema = reportSchemas[config.reportType as ReportType];
      if (!schema || schema.columns.length === 0) return [];
      
      let query = supabase.from(schema.view).select('*', { count: 'exact' });

      if (config.filters.patients && config.filters.patients.length > 0) {
        query = query.in('patient_id', config.filters.patients);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      setEstimatedRows(count);
      return data;
    },
    enabled: isOpen && step === 3 && !!config.reportType,
  });

  const handleGenerate = async () => {
    if (!config.reportType || !fetchedData) return;
    setIsGenerating(true);
    const schema = reportSchemas[config.reportType as ReportType];
    const selectedColumns = schema.columns.filter(c => config.columns.includes(c.key));

    const result = await generateExport({
      data: fetchedData,
      reportName: schema.label,
      columns: selectedColumns,
      config,
    });

    if (result.success) {
      toast(`Export "${result.filename}" started.`, 'ok');
      closeModal();
    } else {
      toast('Export failed. Check console for details.', 'err');
    }
    setIsGenerating(false);
  };

  const renderStep = () => {
    const schema = config.reportType ? reportSchemas[config.reportType as ReportType] : null;
    switch (step) {
      case 1: // Format & Report
        return (
          <StepWrapper>
            <div className="space-y-6">
              <Select
                label="Report Type"
                value={config.reportType}
                onChange={(e) => setConfig({ reportType: e.target.value as ReportType, columns: [] })}
                options={availableReports}
              />
              <Select
                label="File Format"
                value={config.format}
                onChange={(e) => setConfig({ format: e.target.value as 'xlsx' | 'csv' | 'pdf' | 'docx' })}
                options={[
                    { value: 'xlsx', label: 'Excel (.xlsx)' }, 
                    { value: 'csv', label: 'CSV (.csv)' },
                    { value: 'pdf', label: 'PDF (.pdf)' },
                    { value: 'docx', label: 'Word (.docx)' },
                ]}
              />
            </div>
          </StepWrapper>
        );
      case 2: // Filters & Columns
        if (!schema) return <p>Please select a report type first.</p>;
        return (
          <StepWrapper>
            <div className="space-y-6">
                <div>
                    <h4 className="font-medium text-text mb-2">Columns</h4>
                    <div className="max-h-48 overflow-y-auto space-y-2 p-3 border rounded-lg bg-gray-50 dark:bg-zinc-800/50">
                        {schema.columns.map(col => (
                            <Checkbox
                                key={col.key}
                                label={col.label}
                                checked={config.columns.includes(col.key)}
                                onChange={() => {
                                    const newCols = config.columns.includes(col.key)
                                        ? config.columns.filter(c => c !== col.key)
                                        : [...config.columns, col.key];
                                    setConfig({ columns: newCols });
                                }}
                            />
                        ))}
                    </div>
                     <div className="mt-3">
                        <ToggleSwitch
                            label="Include Protected Health Information (PHI)"
                            checked={config.includePHI}
                            onChange={(checked) => {
                                const phiKeys = schema.columns.filter(c => c.isPHI).map(c => c.key);
                                let newCols;
                                if (checked) {
                                    newCols = Array.from(new Set([...config.columns, ...phiKeys]));
                                } else {
                                    newCols = config.columns.filter(c => !phiKeys.includes(c));
                                }
                                setConfig({ includePHI: checked, columns: newCols });
                            }}
                        />
                    </div>
                </div>
                <div>
                    <h4 className="font-medium text-text mb-2">Formatting</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Select label="Timezone" value={config.timezone} onChange={e => setConfig({ timezone: e.target.value })} options={timezones.map(tz => ({ label: tz, value: tz }))} />
                        <Select label="Date Format" value={config.dateFormat} onChange={e => setConfig({ dateFormat: e.target.value })} options={dateFormats.map(df => ({ label: df, value: df }))} />
                    </div>
                    <div className="mt-4 p-3 border rounded-lg bg-gray-50 dark:bg-zinc-800/50">
                        <ToggleSwitch
                            label="Normalize Fields"
                            checked={config.normalization.normalizeDates}
                            onChange={checked => setConfig({ normalization: { ...config.normalization, normalizeDates: checked, normalizeEnums: checked, normalizeBooleans: checked, normalizeEmpty: checked } })}
                        />
                    </div>
                </div>
            </div>
          </StepWrapper>
        );
      case 3: // Review & Generate
        if (!schema) return <p>Please select a report type first.</p>;
        return (
          <StepWrapper>
            <div className="space-y-4 text-sm">
                <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                    <p><span className="font-semibold">Report:</span> {schema.label}</p>
                    <p><span className="font-semibold">Format:</span> {config.format.toUpperCase()}</p>
                    <p><span className="font-semibold">Columns:</span> {config.columns.length} of {schema.columns.length} selected</p>
                    <p><span className="font-semibold">Estimated Rows:</span> {isLoadingData ? <Loader2 className="h-4 w-4 inline animate-spin" /> : estimatedRows ?? 'N/A'}</p>
                </div>
            </div>
          </StepWrapper>
        );
      default:
        return null;
    }
  };

  const stepTitles = [
    { icon: FileUp, title: 'Select Report & Format' },
    { icon: ListChecks, title: 'Customize Columns & Formatting' },
    { icon: CheckCircle, title: 'Review & Generate' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <DialogContent className="max-w-xl h-[70vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {React.createElement(stepTitles[step - 1].icon, { className: "h-5 w-5 text-accent" })}
            <span>{stepTitles[step - 1].title}</span>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4">
            <AnimatePresence mode="wait">
                {renderStep()}
            </AnimatePresence>
        </div>
        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between items-center">
            <StepIndicator current={step} total={3} />
            <div className="flex gap-2">
                <Button variant="outline" onClick={prevStep} disabled={step === 1 || isGenerating}>Back</Button>
                {step < 3 ? (
                    <Button onClick={nextStep} disabled={!config.reportType || (reportSchemas[config.reportType as ReportType]?.columns.length === 0)}>Next</Button>
                ) : (
                    <Button onClick={handleGenerate} disabled={isGenerating || isLoadingData}>
                        {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                        Generate Export
                    </Button>
                )}
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportCenter;
