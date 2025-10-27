import React, { useState, useRef, useEffect } from 'react';
import { useQuickNoteModal } from '@/state/useQuickNoteModal';
import { Dialog, DialogContent, DialogHeader, DialogFooter } from './ui/Dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/Textarea';
import { Checkbox } from './ui/Checkbox';
import { Loader2, Search } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { addNote } from '@/api/notes.api';
import { toast } from '@/lib/toast';
import { useNavigate } from 'react-router-dom';
import type { Patient } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

const PatientSearchInput: React.FC<{
    selectedPatient: Patient | null;
    onSelect: (patient: Patient | null) => void;
}> = ({ selectedPatient, onSelect }) => {
    const [inputValue, setInputValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const debouncedSearchTerm = useDebounce(inputValue, 300);
    const ref = useRef<HTMLDivElement>(null);
    useOnClickOutside(ref, () => setIsOpen(false));

    const { data: activePatients, isLoading: isLoadingActive } = useQuery({
        queryKey: ['active_patients_for_quick_note'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('patients')
                .select('*')
                .or('archived.is.null,archived.eq.false')
                .order('name')
                .limit(20);
            if (error) throw error;
            return data as Patient[];
        },
        enabled: isOpen && !debouncedSearchTerm,
        staleTime: 5 * 60 * 1000,
    });

    const { data: searchResults, isLoading: isLoadingSearch } = useQuery({
        queryKey: ['patient_search_for_quick_note', debouncedSearchTerm],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('patients')
                .select('*')
                .ilike('name', `%${debouncedSearchTerm}%`)
                .limit(10);
            if (error) throw error;
            return data as Patient[];
        },
        enabled: isOpen && debouncedSearchTerm.length > 1,
    });

    const isLoading = isLoadingActive || isLoadingSearch;
    const results = debouncedSearchTerm.length > 1 ? searchResults : activePatients;

    if (selectedPatient) {
        return (
            <div className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-lg flex justify-between items-center">
                <span className="font-medium">{selectedPatient.name}</span>
                <Button variant="ghost" size="sm" onClick={() => onSelect(null)}>Change</Button>
            </div>
        );
    }

    return (
        <div ref={ref} className="relative">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    type="text"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Search for a patient..."
                    className="w-full pl-9 pr-9 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900"
                />
                {isLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted" />}
            </div>
            <AnimatePresence>
                {isOpen && (results && results.length > 0) && (
                    <motion.ul
                        initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                        className="absolute z-10 mt-1 w-full bg-surface border border-border-color rounded-lg shadow-lg max-h-60 overflow-auto p-1"
                    >
                        {results.map(patient => (
                            <li key={patient.id} onClick={() => { onSelect(patient); setIsOpen(false); setInputValue(''); }}
                                className="px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 flex justify-between items-center">
                                <span>{patient.name}</span>
                                {patient.archived && <span className="text-xs text-red-500 bg-red-100 dark:bg-red-900/50 px-1.5 py-0.5 rounded-full">Archived</span>}
                            </li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
};


export default function QuickNoteModal() {
    const { isOpen, closeModal } = useQuickNoteModal();
    const navigate = useNavigate();
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [body, setBody] = useState('');
    const [isPinned, setIsPinned] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const reset = () => {
        setSelectedPatient(null);
        setBody('');
        setIsPinned(false);
        setIsSaving(false);
    };

    const handleClose = () => {
        reset();
        closeModal();
    };

    const handleSave = async () => {
        if (!selectedPatient || !body.trim()) {
            toast('Patient and note body are required.', 'err');
            return;
        }
        setIsSaving(true);
        try {
            await addNote({
                patient_id: selectedPatient.id,
                body,
                is_pinned: isPinned,
                source: 'manual',
            });
            toast('Note added successfully.', 'ok', {
                label: 'Open patient',
                onClick: () => navigate(`/patient/${selectedPatient.id}`),
            });
            handleClose();
        } catch (error: any) {
            toast(`Error: ${error.message}`, 'err');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>Quick Note</DialogHeader>
                <div className="p-6 space-y-4">
                    <PatientSearchInput selectedPatient={selectedPatient} onSelect={setSelectedPatient} />
                    <Textarea
                        label="Note"
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        rows={5}
                        placeholder="Enter your note..."
                        disabled={!selectedPatient}
                    />
                    <Checkbox
                        label="Pin this note to the top of the timeline"
                        checked={isPinned}
                        onChange={e => setIsPinned(e.target.checked)}
                        disabled={!selectedPatient}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving || !selectedPatient || !body.trim()}>
                        {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Save Note
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
