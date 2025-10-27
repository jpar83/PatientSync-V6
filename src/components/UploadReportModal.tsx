import React, { useState, useCallback } from 'react';
import { useUploadModal } from '@/state/useUploadModal';
import { Dialog, DialogContent, DialogHeader, DialogFooter } from './ui/Dialog';
import { Button } from './ui/button';
import { Loader2, Upload, FileCheck, FilePlus, FileClock, GitMerge, ChevronDown, ChevronRight } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabaseClient';
import importMapping from '../../schemas/import_mapping.json';
import { toast } from '@/lib/toast';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { writeAuditLog } from '@/lib/auditLogger';
import { cn } from '@/lib/utils';
import { docTemplates } from '@/lib/docMapping';
import { diffRecord, applyChangesWithRule } from '@/lib/utils';
import type { Patient, Order } from '@/lib/types';
import { Checkbox } from './ui/Checkbox';
import { motion, AnimatePresence } from 'framer-motion';
import ToggleSwitch from './ui/ToggleSwitch';

type Step = 'upload' | 'review' | 'importing' | 'complete';

interface NewRecord {
  data: Partial<Patient> & Partial<Order>;
  originalRow: number;
}

interface UpdatedRecord {
  patient: Patient & { orders: Order[] };
  newData: Partial<Patient> & Partial<Order>;
  changes: {
    entity: 'patient' | 'order';
    field: string;
    from: any;
    to: any;
  }[];
}

interface SkippedRecord {
  data: Partial<Patient> & Partial<Order>;
  reason: string;
}

interface ReviewData {
  newRecords: NewRecord[];
  updatedRecords: UpdatedRecord[];
  skippedRecords: SkippedRecord[];
}

const mapRow = (row: Record<string, any>) => {
    const mappedRow: Record<string, any> = {};
    for (const key in importMapping.fields) {
        const newKey = importMapping.fields[key as keyof typeof importMapping.fields];
        if (row[key]) {
            mappedRow[newKey] = row[key];
        }
    }
    return { ...mappedRow, ...importMapping.constants, ...importMapping.defaults };
};

const ReviewStep: React.FC<{
    reviewData: ReviewData;
    onConfirm: (selections: { new: NewRecord[], updated: UpdatedRecord[] }, autoMerge: boolean) => void;
    onCancel: () => void;
    isImporting: boolean;
}> = ({ reviewData, onConfirm, onCancel, isImporting }) => {
    const [selectedNew, setSelectedNew] = useState<number[]>(() => reviewData.newRecords.map((_, i) => i));
    const [selectedUpdated, setSelectedUpdated] = useState<number[]>(() => reviewData.updatedRecords.map((_, i) => i));
    const [autoMerge, setAutoMerge] = useState(true);

    const handleConfirm = () => {
        onConfirm({
            new: selectedNew.map(i => reviewData.newRecords[i]),
            updated: selectedUpdated.map(i => reviewData.updatedRecords[i]),
        }, autoMerge);
    };

    const Accordion: React.FC<{ title: React.ReactNode, children: React.ReactNode, defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
        const [isOpen, setIsOpen] = useState(defaultOpen);
        return (
            <div className="border rounded-lg">
                <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-t-lg">
                    <div className="font-medium">{title}</div>
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                <AnimatePresence>
                    {isOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                            <div className="p-3">{children}</div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    return (
        <>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="p-3 border rounded-lg bg-gray-50 dark:bg-zinc-800/50">
                    <ToggleSwitch
                        label="Auto-merge safe changes"
                        description="Won’t overwrite a non-empty field with an empty one."
                        checked={autoMerge}
                        onChange={setAutoMerge}
                    />
                </div>
                <Accordion defaultOpen title={<div className="flex items-center gap-2"><FilePlus className="h-4 w-4 text-green-500" /> New Records ({reviewData.newRecords.length})</div>}>
                    <div className="space-y-2">
                        {reviewData.newRecords.map((rec, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-zinc-800 rounded">
                                <Checkbox checked={selectedNew.includes(i)} onChange={() => setSelectedNew(s => s.includes(i) ? s.filter(x => x !== i) : [...s, i])} label="" />
                                <span>{rec.data.patient_name}</span>
                            </div>
                        ))}
                    </div>
                </Accordion>
                <Accordion title={<div className="flex items-center gap-2"><GitMerge className="h-4 w-4 text-blue-500" /> Updated Records ({reviewData.updatedRecords.length})</div>}>
                    <div className="space-y-2">
                        {reviewData.updatedRecords.map((rec, i) => (
                            <div key={i} className="p-2 bg-gray-100 dark:bg-zinc-800 rounded">
                                <div className="flex items-center gap-2">
                                    <Checkbox checked={selectedUpdated.includes(i)} onChange={() => setSelectedUpdated(s => s.includes(i) ? s.filter(x => x !== i) : [...s, i])} label="" />
                                    <span className="font-semibold">{rec.patient.name}</span>
                                </div>
                                <ul className="text-xs mt-1 pl-6 space-y-0.5">
                                    {rec.changes.map(c => (
                                        <li key={`${c.entity}-${c.field}`}>
                                            <span className="font-medium">{c.field}:</span> {JSON.stringify(c.from)} → <span className="font-semibold text-accent">{JSON.stringify(c.to)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </Accordion>
                <Accordion title={<div className="flex items-center gap-2"><FileClock className="h-4 w-4 text-amber-500" /> Skipped Records ({reviewData.skippedRecords.length})</div>}>
                    <ul className="text-sm space-y-1">
                        {reviewData.skippedRecords.map((rec, i) => <li key={i} className="p-2 bg-gray-100 dark:bg-zinc-800 rounded">{rec.data.patient_name} <span className="text-xs text-muted">({rec.reason})</span></li>)}
                    </ul>
                </Accordion>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={onCancel} disabled={isImporting}>Discard</Button>
                <Button onClick={handleConfirm} disabled={isImporting || (selectedNew.length === 0 && selectedUpdated.length === 0)}>
                    {isImporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Apply Selected Changes
                </Button>
            </DialogFooter>
        </>
    );
};


export default function UploadReportModal() {
    const { isOpen, closeModal } = useUploadModal();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [step, setStep] = useState<Step>('upload');
    const [reviewData, setReviewData] = useState<ReviewData | null>(null);
    const [repName, setRepName] = useState<string>('');
    const [fileName, setFileName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [importResult, setImportResult] = useState({ imported: 0, skipped: 0, updated: 0 });
    const [importDateOverride, setImportDateOverride] = useState('');
    const [stoplightStatusForImport, setStoplightStatusForImport] = useState<'green' | 'yellow' | 'red'>('green');

    const resetState = () => {
        setStep('upload');
        setReviewData(null);
        setRepName('');
        setFileName('');
        setError(null);
        setImportResult({ imported: 0, skipped: 0, updated: 0 });
        setImportDateOverride('');
        setStoplightStatusForImport('green');
    };

    const handleClose = () => {
        resetState();
        closeModal();
    };

    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        
        setError(null);
        setFileName(file.name);
        setStep('review');
        setReviewData(null);

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = event.target?.result;
                let rows: any[];
                let rep = '';

                if (file.name.endsWith('.csv')) {
                    const result = Papa.parse(data as string, { header: true, skipEmptyLines: true });
                    rows = result.data;
                    rep = importMapping?.constants?.rep_name || 'Unknown Rep';
                } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                    const workbook = XLSX.read(new Uint8Array(data as ArrayBuffer), { type: 'array', cellDates: true });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const rawA1 = (worksheet['A1']?.v ?? '').toString();
                    rep = rawA1.replace(/^.*?:\s*/i, '').trim() || importMapping?.constants?.rep_name || 'Unknown Rep';
                    rows = XLSX.utils.sheet_to_json(worksheet, { range: 1 });
                } else {
                    throw new Error("Unsupported file type. Please use CSV or XLSX.");
                }

                setRepName(rep);

                const mappedRows = rows.map(row => mapRow(row));
                const norm = (s: any) => (s ?? '').toString().trim().toLowerCase();
                const dedupeKeys = mappedRows.map(r => `${norm(r.patient_name)}|${norm(r.insurance_primary)}`).filter(Boolean);

                if (dedupeKeys.length === 0) {
                    setReviewData({ newRecords: mappedRows.map((m, i) => ({ data: m, originalRow: i + 2 })), updatedRecords: [], skippedRecords: [] });
                    return;
                }

                const { data: existingPatients, error: dbError } = await supabase
                    .from('patients')
                    .select('*, orders(*)')
                    .in('name', mappedRows.map(r => r.patient_name).filter(Boolean));

                if (dbError) throw dbError;

                const newRecords: NewRecord[] = [];
                const updatedRecords: UpdatedRecord[] = [];
                const skippedRecords: SkippedRecord[] = [];

                mappedRows.forEach((row, i) => {
                    const patientName = row.patient_name;
                    const primaryInsurance = row.insurance_primary;
                    const existingPatient = (existingPatients as any[])?.find(p => norm(p.name) === norm(patientName) && norm(p.primary_insurance) === norm(primaryInsurance));

                    if (!existingPatient) {
                        newRecords.push({ data: row, originalRow: i + 2 });
                    } else {
                        const latestOrder = existingPatient.orders?.sort((a: Order, b: Order) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] || {};
                        
                        const patientDataFromRow = { name: row.patient_name, primary_insurance: row.insurance_primary };
                        const orderDataFromRow = { chair_type: row.chair_type, accessories: row.accessories };

                        const patientChanges = diffRecord(existingPatient, patientDataFromRow);
                        const orderChanges = diffRecord(latestOrder, orderDataFromRow);
                        
                        const allChanges = [
                            ...patientChanges.map(c => ({ ...c, entity: 'patient' as const })),
                            ...orderChanges.map(c => ({ ...c, entity: 'order' as const })),
                        ];

                        if (allChanges.length > 0) {
                            updatedRecords.push({
                                patient: existingPatient,
                                newData: row,
                                changes: allChanges,
                            });
                        } else {
                            skippedRecords.push({ data: row, reason: 'No changes detected' });
                        }
                    }
                });

                setReviewData({ newRecords, updatedRecords, skippedRecords });

            } catch (err: any) {
                setError(err.message || "Failed to parse file.");
                setStep('upload');
            }
        };
        if (file.name.endsWith('.csv')) {
            reader.readAsText(file);
        } else {
            reader.readAsArrayBuffer(file);
        }
    }, []);

    const handleImport = async (selections: { new: NewRecord[], updated: UpdatedRecord[] }, autoMerge: boolean) => {
        setStep('importing');
        let importedCount = 0;
        let updatedCount = 0;

        try {
            // --- NEW RECORDS ---
            if (selections.new.length > 0) {
                // 1. Get or create Insurance Provider IDs
                const uniqueInsurances = Array.from(new Set(selections.new.map(rec => rec.data.insurance_primary).filter(Boolean)));
                const providerIdMap = new Map<string, string>();

                for (const insName of uniqueInsurances) {
                    if (!insName) continue;
                    const { data: existing } = await supabase.from('insurance_providers').select('id').ilike('name', insName).single();
                    if (existing) {
                        providerIdMap.set(insName, existing.id);
                    } else {
                        const { data: created } = await supabase.from('insurance_providers').insert({ name: insName.toUpperCase(), source: 'import' }).select('id').single();
                        if (created) {
                            providerIdMap.set(insName, created.id);
                        }
                    }
                }

                // 2. Create Patients
                const standardTemplate = docTemplates.find(t => t.id === 'standard_wc');
                const defaultRequiredDocs = standardTemplate ? standardTemplate.keys : [];

                const patientPayloads = selections.new.map(rec => ({
                    name: rec.data.patient_name,
                    primary_insurance: rec.data.insurance_primary,
                    insurance_provider_id: rec.data.insurance_primary ? providerIdMap.get(rec.data.insurance_primary) : null,
                    required_documents: defaultRequiredDocs,
                    stoplight_status: stoplightStatusForImport,
                }));
                const { data: newPatients, error: patientError } = await supabase.from('patients').insert(patientPayloads).select();
                if (patientError) throw patientError;
                if (!newPatients) throw new Error("Patient creation returned no data.");

                // 3. Create Orders
                const orderPayloads = newPatients.map((p, i) => {
                    const originalData = selections.new[i].data;
                    return {
                        patient_id: p.id,
                        chair_type: originalData.chair_type, // Mapped from 'Name'
                        accessories: originalData.accessories, // Mapped from 'First Item'
                        workflow_stage: originalData.workflow_stage || 'Referral Received',
                        status: originalData.status || 'Pending Intake',
                        rep_name: repName,
                        referral_date: importDateOverride ? new Date(importDateOverride).toISOString() : new Date().toISOString(),
                        stoplight_status: stoplightStatusForImport,
                    };
                });
                const { data: newOrders, error: orderError } = await supabase.from('orders').insert(orderPayloads).select();
                if (orderError) throw orderError;
                if (!newOrders) throw new Error("Order creation returned no data.");

                // 4. Create Equipment records
                const equipmentPayloads = newOrders.map((order, i) => {
                    const originalData = selections.new[i].data;
                    if (!originalData.chair_type) return null;
                    return {
                        order_id: order.id,
                        category: 'Power Wheelchair', // Defaulting category
                        equipment_type: originalData.chair_type,
                        model: originalData.chair_type,
                        notes: originalData.accessories,
                    };
                }).filter(Boolean);

                if (equipmentPayloads.length > 0) {
                    const { error: equipmentError } = await supabase.from('equipment').insert(equipmentPayloads as any);
                    if (equipmentError) {
                        console.error("Error inserting equipment records:", equipmentError);
                        toast('Partial success: Patients/orders created, but failed to create equipment records.', 'warning');
                    }
                }
                
                importedCount = newPatients.length;
            }

            // --- UPDATED RECORDS ---
            if (selections.updated.length > 0) {
                for (const rec of selections.updated) {
                    const patientChanges = rec.changes.filter(c => c.entity === 'patient');
                    const orderChanges = rec.changes.filter(c => c.entity === 'order');

                    if (patientChanges.length > 0) {
                        const patientPayload = autoMerge
                            ? applyChangesWithRule(rec.patient, patientChanges)
                            : patientChanges.reduce((acc, change) => ({ ...acc, [change.field]: change.to }), {});
                        await supabase.from('patients').update(patientPayload).eq('id', rec.patient.id);
                    }
                    if (orderChanges.length > 0 && rec.patient.orders[0]) {
                        const orderPayload = autoMerge
                            ? applyChangesWithRule(rec.patient.orders[0], orderChanges)
                            : orderChanges.reduce((acc, change) => ({ ...acc, [change.field]: change.to }), {});
                        await supabase.from('orders').update(orderPayload).eq('id', rec.patient.orders[0].id);
                    }
                }
                updatedCount = selections.updated.length;
            }

            await writeAuditLog('report_uploaded', {
                changed_by: user?.email,
                details: { fileName, repName, imported: importedCount, updated: updatedCount, skipped: reviewData?.skippedRecords.length || 0 }
            });

            toast(`${importedCount} new records imported, ${updatedCount} records updated.`, 'ok');
            queryClient.invalidateQueries({ queryKey: ['referrals_direct_all'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard_orders_all'] });
            setImportResult({ imported: importedCount, updated: updatedCount, skipped: reviewData?.skippedRecords.length || 0 });
            setStep('complete');

        } catch (error: any) {
            console.error("Failed to import records:", error);
            toast(`Import failed: ${error.message}`, 'err');
            setStep('review');
        }
    };

    const renderContent = () => {
        switch (step) {
            case 'upload':
                return (
                    <>
                        <DialogHeader>Upload Report</DialogHeader>
                        <div className="p-6 text-center">
                            <label htmlFor="file-upload" className="cursor-pointer w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                                <Upload className="h-10 w-10 text-gray-400" />
                                <p className="mt-2 text-sm font-semibold text-text">Click to upload or drag and drop</p>
                                <p className="text-xs text-muted">CSV or XLSX file</p>
                            </label>
                            <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".csv, .xlsx, .xls" />
                            {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
                        </div>
                    </>
                );
            case 'review':
                if (!reviewData) {
                    return <div className="p-12 flex flex-col items-center justify-center gap-4"><Loader2 className="h-10 w-10 animate-spin text-accent" /><p className="text-muted">Analyzing file...</p></div>;
                }
                return (
                    <>
                        <DialogHeader>Review Changes Before Import</DialogHeader>
                        <ReviewStep reviewData={reviewData} onConfirm={handleImport} onCancel={handleClose} isImporting={false} />
                    </>
                );
            case 'importing':
                return <div className="p-12 flex flex-col items-center justify-center gap-4"><Loader2 className="h-10 w-10 animate-spin text-accent" /><p className="text-muted">Importing records...</p></div>;
            case 'complete':
                return (
                    <div className="p-6 text-center space-y-4">
                        <FileCheck className="h-12 w-12 text-green-500 mx-auto" />
                        <h3 className="text-lg font-semibold text-text">Import Complete</h3>
                        <p className="text-muted">{importResult.imported} new records imported.</p>
                        <p className="text-muted">{importResult.updated} existing records updated.</p>
                        <p className="text-muted">{importResult.skipped} duplicate records were skipped.</p>
                        <Button onClick={handleClose}>Done</Button>
                    </div>
                );
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className={step === 'review' ? 'max-w-2xl' : 'max-w-md'}>
                {renderContent()}
            </DialogContent>
        </Dialog>
    );
}
