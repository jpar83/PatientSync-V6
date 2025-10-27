import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import type { Doctor } from '../../lib/types';
import { Btn } from '../ui/Btn';
import { Input } from '../ui/Input';
import { Plus, Loader2, Edit, Save, X, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { toast } from '../../lib/toast';
import ListSkeleton from '../ui/ListSkeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const DoctorsPanel: React.FC = () => {
    const queryClient = useQueryClient();
    const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);
    const [editingFormState, setEditingFormState] = useState<Partial<Doctor>>({});
    const [showAddForm, setShowAddForm] = useState(false);
    const [formState, setFormState] = useState({
        name: '',
        phone_number: '',
        fax_number: '',
        office_contact_name: '',
        office_contact_email: '',
        office_phone_number: '',
    });

    const { data: doctors = [], isLoading: loading } = useQuery<Doctor[]>({
        queryKey: ['doctors'],
        queryFn: async () => {
            const { data, error } = await supabase.from('doctors').select('*').order('name');
            if (error) throw error;
            return data || [];
        }
    });

    const addMutation = useMutation({
        mutationFn: async (newDoctor: typeof formState) => {
            const { error } = await supabase.from('doctors').insert(newDoctor);
            if (error) throw error;
        },
        onSuccess: () => {
            toast('Doctor added successfully.', 'ok');
            queryClient.invalidateQueries({ queryKey: ['doctors'] });
            setFormState({ name: '', phone_number: '', fax_number: '', office_contact_name: '', office_contact_email: '', office_phone_number: '' });
            setShowAddForm(false);
        },
        onError: (error: any) => {
            toast(`Error: ${error.message}`, 'err');
        }
    });

    const updateMutation = useMutation({
        mutationFn: async (updateData: { id: string, payload: Partial<Doctor> }) => {
            const { error } = await supabase.from('doctors').update(updateData.payload).eq('id', updateData.id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast('Doctor updated successfully.', 'ok');
            queryClient.invalidateQueries({ queryKey: ['doctors'] });
            setEditingDoctorId(null);
            setEditingFormState({});
        },
        onError: (error: any) => {
            toast(`Error updating doctor: ${error.message}`, 'err');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('doctors').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast('Doctor deleted.', 'ok');
            queryClient.invalidateQueries({ queryKey: ['doctors'] });
        },
        onError: (error: any) => {
            toast(`Error deleting doctor: ${error.message}`, 'err');
        }
    });

    const handleInputChange = (field: keyof typeof formState, value: string) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    };
    
    const handleEditingInputChange = (field: keyof Doctor, value: string) => {
        setEditingFormState(prev => ({ ...prev, [field]: value }));
    };

    const addDoctor = () => {
        if (!formState.name.trim()) {
            toast('Doctor name is required.', 'err');
            return;
        }
        addMutation.mutate(formState);
    };

    const deleteDoctor = (id: string) => {
        if (window.confirm('Are you sure you want to delete this doctor?')) {
            deleteMutation.mutate(id);
        }
    };
    
    const handleEditClick = (doctor: Doctor) => {
        setEditingDoctorId(doctor.id);
        setEditingFormState(doctor);
    };

    const handleCancelEdit = () => {
        setEditingDoctorId(null);
        setEditingFormState({});
    };

    const handleUpdateDoctor = () => {
        if (!editingDoctorId) return;
        const { id, created_at, ...updatePayload } = editingFormState;
        updateMutation.mutate({ id: editingDoctorId, payload: updatePayload });
    };

    const isSaving = addMutation.isPending || updateMutation.isPending;

    return (
        <div className="soft-card max-w-4xl fade-in">
            <div className="p-4 border-b">
                <h2 className="text-base font-semibold text-gray-800">Manage Doctors</h2>
                <p className="text-xs text-gray-500 mt-1">Add, edit, or remove referring physician details.</p>
            </div>
            <div className="p-4 space-y-4">
                <div className="border-b pb-4">
                    <button onClick={() => setShowAddForm(s => !s)} className="w-full flex justify-between items-center text-left font-medium">
                        Add New Doctor
                        {showAddForm ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    <AnimatePresence>
                    {showAddForm && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="pt-4 space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Input label="Doctor's Full Name" id="docName" value={formState.name} onChange={e => handleInputChange('name', e.target.value)} required />
                                    <Input label="Doctor's Phone" id="docPhone" value={formState.phone_number} onChange={e => handleInputChange('phone_number', e.target.value)} />
                                    <Input label="Doctor's Fax" id="docFax" value={formState.fax_number} onChange={e => handleInputChange('fax_number', e.target.value)} />
                                    <Input label="Office Contact Name" id="officeContact" value={formState.office_contact_name} onChange={e => handleInputChange('office_contact_name', e.target.value)} />
                                    <Input label="Office Contact Email" id="officeEmail" type="email" value={formState.office_contact_email} onChange={e => handleInputChange('office_contact_email', e.target.value)} />
                                    <Input label="Office Phone" id="officePhone" value={formState.office_phone_number} onChange={e => handleInputChange('office_phone_number', e.target.value)} />
                                </div>
                                <Btn onClick={addDoctor} disabled={isSaving} size="sm">
                                    {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                                    Add Doctor
                                </Btn>
                            </div>
                        </motion.div>
                    )}
                    </AnimatePresence>
                </div>

                <div>
                    <h3 className="font-medium text-gray-700 mb-2">Existing Doctors</h3>
                    {loading ? (
                        <ListSkeleton />
                    ) : (
                        <div className="space-y-2 max-h-[30rem] overflow-y-auto pr-2">
                            {doctors.length === 0 ? (
                                <div className="text-center py-10 px-4 text-gray-500 bg-gray-50 rounded-lg">
                                    <p className="text-sm">No doctors have been added yet.</p>
                                </div>
                            ) : doctors.map(d => (
                                <div key={d.id} className="soft-card p-3 lift elevate">
                                    <AnimatePresence mode="wait">
                                    {editingDoctorId === d.id ? (
                                        <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <Input label="Doctor's Full Name" value={editingFormState.name || ''} onChange={e => handleEditingInputChange('name', e.target.value)} />
                                                <Input label="Doctor's Phone" value={editingFormState.phone_number || ''} onChange={e => handleEditingInputChange('phone_number', e.target.value)} />
                                                <Input label="Doctor's Fax" value={editingFormState.fax_number || ''} onChange={e => handleEditingInputChange('fax_number', e.target.value)} />
                                                <Input label="Office Contact Name" value={editingFormState.office_contact_name || ''} onChange={e => handleEditingInputChange('office_contact_name', e.target.value)} />
                                                <Input label="Office Contact Email" type="email" value={editingFormState.office_contact_email || ''} onChange={e => handleEditingInputChange('office_contact_email', e.target.value)} />
                                                <Input label="Office Phone" value={editingFormState.office_phone_number || ''} onChange={e => handleEditingInputChange('office_phone_number', e.target.value)} />
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <Btn variant="ghost" size="sm" onClick={handleCancelEdit} disabled={isSaving}>Cancel</Btn>
                                                <Btn size="sm" onClick={handleUpdateDoctor} disabled={isSaving}>
                                                    {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                                    Save
                                                </Btn>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-between items-start">
                                            <div className="text-sm">
                                                <p className="font-bold text-gray-800">{d.name}</p>
                                                <p className="text-gray-500">{d.phone_number || 'No phone'}</p>
                                            </div>
                                            <div className="flex gap-1.5 self-start flex-shrink-0">
                                                <Btn variant="outline" size="sm" onClick={() => handleEditClick(d)} aria-label={`Edit ${d.name}`}><Edit className="h-3 w-3" /></Btn>
                                                <Btn variant="outline" size="sm" onClick={() => deleteDoctor(d.id)} aria-label={`Delete ${d.name}`}><Trash2 className="h-3 w-3" /></Btn>
                                            </div>
                                        </motion.div>
                                    )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DoctorsPanel;
