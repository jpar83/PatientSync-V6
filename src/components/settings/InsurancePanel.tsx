import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { Btn } from '../ui/Btn';
import { Input } from '../ui/Input';
import { Plus, Loader2, Edit, Save, X, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { toast } from '../../lib/toast';
import ListSkeleton from '../ui/ListSkeleton';
import { motion, AnimatePresence } from 'framer-motion';
import SimpleConfirmationModal from '../ui/SimpleConfirmationModal';

interface InsuranceProvider {
    id: string;
    name: string;
    created_at: string;
    source: string | null;
}

const InsurancePanel: React.FC = () => {
    const queryClient = useQueryClient();
    const [showAddForm, setShowAddForm] = useState(false);
    const [newProviderName, setNewProviderName] = useState('');
    const [editingProvider, setEditingProvider] = useState<InsuranceProvider | null>(null);
    const [editingName, setEditingName] = useState('');
    const [providerToDelete, setProviderToDelete] = useState<InsuranceProvider | null>(null);

    const { data: providers = [], isLoading: isLoadingProviders, error: providersError } = useQuery<InsuranceProvider[], Error>({
        queryKey: ['insurance_providers'],
        queryFn: async () => {
            const { data, error } = await supabase.from('insurance_providers').select('*').order('name');
            if (error) throw new Error(error.message);
            return data || [];
        }
    });

    const { data: usedProvidersData } = useQuery({
        queryKey: ['used_insurance_providers'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('patients')
                .select('insurance_provider_id');
            if (error) {
                console.error("Error fetching used providers:", error);
                return [];
            };
            return data;
        },
        enabled: providers.length > 0,
    });

    const usedProviderIdsSet = useMemo(() => {
        if (!usedProvidersData) return new Set<string>();
        return new Set(usedProvidersData.map(p => p.insurance_provider_id).filter(Boolean));
    }, [usedProvidersData]);

    const addMutation = useMutation({
        mutationFn: async (name: string) => {
            const { error } = await supabase.from('insurance_providers').insert({ name, source: 'manual' });
            if (error) throw error;
        },
        onSuccess: () => {
            toast('Insurance provider added successfully.', 'ok');
            queryClient.invalidateQueries({ queryKey: ['insurance_providers'] });
            setNewProviderName('');
            setShowAddForm(false);
        },
        onError: (error: any) => {
            if (error.code === '23505') {
                toast('This provider already exists.', 'warning');
            } else {
                toast(`Error: ${error.message}`, 'err');
            }
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, name }: { id: string, name: string }) => {
            const { error } = await supabase.from('insurance_providers').update({ name }).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast('Provider updated successfully.', 'ok');
            queryClient.invalidateQueries({ queryKey: ['insurance_providers'] });
            setEditingProvider(null);
            setEditingName('');
        },
        onError: (error: any) => {
            toast(`Error: ${error.message}`, 'err');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('insurance_providers').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast('Provider deleted successfully.', 'ok');
            queryClient.invalidateQueries({ queryKey: ['insurance_providers'] });
            setProviderToDelete(null);
        },
        onError: (error: any) => {
            toast(`Error: ${error.message}`, 'err');
            setProviderToDelete(null);
        }
    });

    const handleAdd = () => {
        const trimmedName = newProviderName.trim();
        if (!trimmedName) {
            toast('Provider name cannot be empty.', 'warning');
            return;
        }
        if (providers.some(p => p.name.toUpperCase() === trimmedName.toUpperCase())) {
            toast(`Provider "${trimmedName}" already exists.`, 'warning');
            return;
        }
        addMutation.mutate(trimmedName);
    };

    const handleUpdate = () => {
        if (editingProvider && editingName.trim()) {
            updateMutation.mutate({ id: editingProvider.id, name: editingName.trim() });
        }
    };

    const handleDelete = () => {
        if (providerToDelete) {
            deleteMutation.mutate(providerToDelete.id);
        }
    };
    
    const isSchemaError = providersError?.message.includes('relation "public.insurance_providers" does not exist');

    return (
        <div className="soft-card max-w-4xl fade-in">
            <div className="p-4 border-b">
                <h2 className="text-base font-semibold text-gray-800">Manage Insurance Providers</h2>
                <p className="text-xs text-gray-500 mt-1">Add, edit, or remove insurance providers from the list.</p>
            </div>
            <div className="p-4 space-y-4">
                <div className="border-b pb-4">
                    <button onClick={() => setShowAddForm(s => !s)} className="w-full flex justify-between items-center text-left font-medium">
                        Add New Provider
                        {showAddForm ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    <AnimatePresence>
                    {showAddForm && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="pt-4 flex items-end gap-2">
                                <Input label="Provider Name" id="providerName" value={newProviderName} onChange={e => setNewProviderName(e.target.value)} required wrapperClassName="flex-1" />
                                <Btn onClick={handleAdd} disabled={addMutation.isPending} size="sm">
                                    {addMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                                    Add Provider
                                </Btn>
                            </div>
                        </motion.div>
                    )}
                    </AnimatePresence>
                </div>

                <div>
                    <h3 className="font-medium text-gray-700 mb-2">Existing Providers</h3>
                    {isLoadingProviders ? (
                        <ListSkeleton rows={3} />
                    ) : isSchemaError ? (
                        <div className="text-center py-10 px-4 text-red-600 bg-red-50 rounded-lg">
                            <p className="font-semibold">Table Not Found</p>
                            <p className="text-sm mt-1">The 'insurance_providers' table does not exist. Please run the required database migration.</p>
                        </div>
                    ) : providersError ? (
                         <div className="text-center py-10 px-4 text-red-600 bg-red-50 rounded-lg">
                            <p className="font-semibold">Error Loading Providers</p>
                            <p className="text-sm mt-1">{providersError.message}</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[30rem] overflow-y-auto pr-2">
                            {providers.length === 0 ? (
                                <div className="text-center py-10 px-4 text-gray-500 bg-gray-50 rounded-lg">
                                    <p className="text-sm">No insurance providers have been added yet.</p>
                                </div>
                            ) : providers.map(p => (
                                <div key={p.id} className="soft-card p-3 lift elevate">
                                    <AnimatePresence mode="wait">
                                    {editingProvider?.id === p.id ? (
                                        <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                                            <Input label="Edit Name" value={editingName} onChange={e => setEditingName(e.target.value)} />
                                            <div className="flex justify-end gap-2">
                                                <Btn variant="ghost" size="sm" onClick={() => setEditingProvider(null)} disabled={updateMutation.isPending}>Cancel</Btn>
                                                <Btn size="sm" onClick={handleUpdate} disabled={updateMutation.isPending}>
                                                    {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                                    Save
                                                </Btn>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-between items-center">
                                            <div>
                                                <p className="font-bold text-gray-800 text-sm">{p.name}</p>
                                                {p.source && <span className="text-xs text-muted">Source: {p.source}</span>}
                                            </div>
                                            <div className="flex gap-1.5">
                                                <Btn variant="outline" size="sm" onClick={() => { setEditingProvider(p); setEditingName(p.name); }}><Edit className="h-3 w-3" /></Btn>
                                                <Btn variant="outline" size="sm" onClick={() => setProviderToDelete(p)} disabled={usedProviderIdsSet.has(p.id)} title={usedProviderIdsSet.has(p.id) ? 'Cannot delete: Provider is in use by one or more patients.' : 'Delete Provider'}><Trash2 className="h-3 w-3" /></Btn>
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
            <SimpleConfirmationModal
                isOpen={!!providerToDelete}
                onClose={() => setProviderToDelete(null)}
                onConfirm={handleDelete}
                isLoading={deleteMutation.isPending}
                title="Confirm Deletion"
                message={`Are you sure you want to delete the provider "${providerToDelete?.name}"? This action cannot be undone.`}
                confirmButtonText="Yes, Delete"
                confirmButtonVariant="danger"
            />
        </div>
    );
};

export default InsurancePanel;
