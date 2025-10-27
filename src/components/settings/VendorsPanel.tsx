import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import type { Vendor } from '../../lib/types';
import { Btn } from '../ui/Btn';
import { Input } from '../ui/Input';
import { Plus, Loader2, Edit, Save, X, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { toast } from '../../lib/toast';
import ListSkeleton from '../ui/ListSkeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const VendorsPanel: React.FC = () => {
    const queryClient = useQueryClient();
    const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
    const [editingFormState, setEditingFormState] = useState<Partial<Vendor>>({});
    const [showAddForm, setShowAddForm] = useState(false);
    const [formState, setFormState] = useState({
        name: '',
        email: '',
        contact_name: '',
        phone_number: '',
        city: '',
    });

    const { data: vendors = [], isLoading: loading } = useQuery<Vendor[]>({
        queryKey: ['vendors'],
        queryFn: async () => {
            const { data, error } = await supabase.from('vendors').select('*').order('name');
            if (error) throw error;
            return data || [];
        }
    });

    const addMutation = useMutation({
        mutationFn: async (newVendor: typeof formState) => {
            const { error } = await supabase.from('vendors').insert(newVendor);
            if (error) throw error;
        },
        onSuccess: () => {
            toast('Vendor added successfully.', 'ok');
            queryClient.invalidateQueries({ queryKey: ['vendors'] });
            setFormState({ name: '', email: '', contact_name: '', phone_number: '', city: '' });
            setShowAddForm(false);
        },
        onError: (error: any) => {
            toast(`Error: ${error.message}`, 'err');
        }
    });

    const updateMutation = useMutation({
        mutationFn: async (updateData: { id: string, payload: Partial<Vendor> }) => {
            const { error } = await supabase.from('vendors').update(updateData.payload).eq('id', updateData.id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast('Vendor updated successfully.', 'ok');
            queryClient.invalidateQueries({ queryKey: ['vendors'] });
            setEditingVendorId(null);
            setEditingFormState({});
        },
        onError: (error: any) => {
            toast(`Error updating vendor: ${error.message}`, 'err');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('vendors').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast('Vendor deleted.', 'ok');
            queryClient.invalidateQueries({ queryKey: ['vendors'] });
        },
        onError: (error: any) => {
            toast(`Error deleting vendor: ${error.message}`, 'err');
        }
    });

    const handleInputChange = (field: keyof typeof formState, value: string) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    };

    const handleEditingInputChange = (field: keyof Vendor, value: string) => {
        setEditingFormState(prev => ({ ...prev, [field]: value }));
    };

    const addVendor = () => {
        if (!formState.name.trim()) {
            toast('Vendor name is required.', 'err');
            return;
        }
        addMutation.mutate(formState);
    };

    const deleteVendor = (id: string) => {
        if (window.confirm('Are you sure you want to delete this vendor?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleEditClick = (vendor: Vendor) => {
        setEditingVendorId(vendor.id);
        setEditingFormState(vendor);
    };

    const handleCancelEdit = () => {
        setEditingVendorId(null);
        setEditingFormState({});
    };

    const handleUpdateVendor = () => {
        if (!editingVendorId) return;
        const { id, created_at, ...updatePayload } = editingFormState;
        updateMutation.mutate({ id: editingVendorId, payload: updatePayload });
    };

    const isSaving = addMutation.isPending || updateMutation.isPending;

    return (
        <div className="soft-card max-w-4xl fade-in">
            <div className="p-4 border-b">
                <h2 className="text-base font-semibold text-gray-800">Manage Vendors</h2>
                <p className="text-xs text-gray-500 mt-1">Add, edit, or remove equipment vendor details.</p>
            </div>
            <div className="p-4 space-y-4">
                <div className="border-b pb-4">
                     <button onClick={() => setShowAddForm(s => !s)} className="w-full flex justify-between items-center text-left font-medium">
                        Add New Vendor
                        {showAddForm ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    <AnimatePresence>
                    {showAddForm && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="pt-4 space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Input label="Vendor Name" id="venName" value={formState.name} onChange={e => handleInputChange('name', e.target.value)} required />
                                    <Input label="Vendor Email" id="venEmail" type="email" value={formState.email} onChange={e => handleInputChange('email', e.target.value)} />
                                    <Input label="Contact Name" id="venContact" value={formState.contact_name} onChange={e => handleInputChange('contact_name', e.target.value)} />
                                    <Input label="Phone Number" id="venPhone" value={formState.phone_number} onChange={e => handleInputChange('phone_number', e.target.value)} />
                                    <Input label="City" id="venCity" value={formState.city} onChange={e => handleInputChange('city', e.target.value)} />
                                </div>
                                <Btn onClick={addVendor} disabled={isSaving} size="sm">
                                    {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                                    Add Vendor
                                </Btn>
                            </div>
                        </motion.div>
                    )}
                    </AnimatePresence>
                </div>

                <div>
                    <h3 className="font-medium text-gray-700 mb-2">Existing Vendors</h3>
                    {loading ? (
                        <ListSkeleton />
                    ) : (
                        <div className="space-y-2 max-h-[30rem] overflow-y-auto pr-2">
                            {vendors.length === 0 ? (
                                <div className="text-center py-10 px-4 text-gray-500 bg-gray-50 rounded-lg">
                                    <p className="text-sm">No vendors have been added yet.</p>
                                </div>
                            ) : vendors.map(v => (
                                <div key={v.id} className="soft-card p-3 lift elevate">
                                    <AnimatePresence mode="wait">
                                    {editingVendorId === v.id ? (
                                        <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <Input label="Vendor Name" value={editingFormState.name || ''} onChange={e => handleEditingInputChange('name', e.target.value)} />
                                                <Input label="Vendor Email" type="email" value={editingFormState.email || ''} onChange={e => handleEditingInputChange('email', e.target.value)} />
                                                <Input label="Contact Name" value={editingFormState.contact_name || ''} onChange={e => handleEditingInputChange('contact_name', e.target.value)} />
                                                <Input label="Phone Number" value={editingFormState.phone_number || ''} onChange={e => handleEditingInputChange('phone_number', e.target.value)} />
                                                <Input label="City" value={editingFormState.city || ''} onChange={e => handleEditingInputChange('city', e.target.value)} />
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <Btn variant="ghost" size="sm" onClick={handleCancelEdit} disabled={isSaving}>Cancel</Btn>
                                                <Btn size="sm" onClick={handleUpdateVendor} disabled={isSaving}>
                                                    {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                                    Save
                                                </Btn>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-between items-start">
                                            <div className="text-sm">
                                                <p className="font-bold text-gray-800">{v.name}</p>
                                                <p className="text-gray-500">{v.email || 'No email'}</p>
                                            </div>
                                            <div className="flex gap-1.5 self-start flex-shrink-0">
                                                <Btn variant="outline" size="sm" onClick={() => handleEditClick(v)} aria-label={`Edit ${v.name}`}><Edit className="h-3 w-3" /></Btn>
                                                <Btn variant="outline" size="sm" onClick={() => deleteVendor(v.id)} aria-label={`Delete ${v.name}`}><Trash2 className="h-3 w-3" /></Btn>
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

export default VendorsPanel;
