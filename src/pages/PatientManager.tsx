import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useSearch } from '../contexts/SearchContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Edit } from 'lucide-react';
import { Btn } from '../components/ui/Btn';
import TableSkeleton from '../components/ui/TableSkeleton';
import { highlight } from '../lib/highlight';
import type { Patient } from '../lib/types';
import PatientEditDrawer from '../components/PatientEditDrawer';

const PatientManager: React.FC = () => {
    const { term, setTerm } = useSearch();
    const navigate = useNavigate();
    const { id: patientIdFromParams } = useParams<{ id: string }>();
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

    useEffect(() => {
        if (patientIdFromParams) {
            setSelectedPatientId(patientIdFromParams);
        }
    }, [patientIdFromParams]);

    const { data: patients, isLoading, refetch } = useQuery({
        queryKey: ['patients', term],
        queryFn: async () => {
            let query = supabase.from('patients').select('*').order('name', { ascending: true });
            if (term.trim()) {
                query = query.or(`name.ilike.%${term.trim()}%,email.ilike.%${term.trim()}%`);
            }
            const { data, error } = await query;
            if (error) throw error;
            return data as Patient[];
        },
    });

    const handleNewPatient = () => {
        navigate('/referrals?add=true');
    };

    const handleEditPatient = (patientId: string) => {
        setSelectedPatientId(patientId);
    };
    
    const handleCloseDrawer = () => {
        setSelectedPatientId(null);
        if (patientIdFromParams) {
            navigate('/patients', { replace: true });
        }
    };

    return (
        <div className="p-4 md:p-6 overflow-y-auto h-[calc(100vh-180px)] min-h-[400px]">
            <div className="space-y-6 py-6">
                <header className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold text-gray-800">Patient Manager</h1>
                    <Btn onClick={handleNewPatient}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Patient Referral
                    </Btn>
                </header>

                <div className="overflow-x-auto rounded-lg border border-gray-100 shadow-sm">
                    {isLoading ? (
                        <TableSkeleton />
                    ) : (
                        <table className="min-w-full w-full text-sm">
                            <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                                <tr>
                                    <th className="p-3 text-left">Name</th>
                                    <th className="p-3 text-left">Email</th>
                                    <th className="p-3 text-left">Phone</th>
                                    <th className="p-3 text-left">Primary Insurance</th>
                                    <th className="p-3 text-left">Source</th>
                                    <th className="p-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {patients && patients.length > 0 ? patients.map(p => (
                                    <tr key={p.id} className="hover:bg-emerald-50/40 transition-colors">
                                        <td className="p-3 font-medium text-gray-900" dangerouslySetInnerHTML={{ __html: highlight(p.name || '—', term) }} />
                                        <td className="p-3 text-gray-500" dangerouslySetInnerHTML={{ __html: highlight(p.email || '—', term) }} />
                                        <td className="p-3 text-gray-500">{p.phone_number || '—'}</td>
                                        <td className="p-3 text-gray-500">{p.primary_insurance || '—'}</td>
                                        <td className="p-3 text-gray-500">{p.source || 'Manual'}</td>
                                        <td className="p-3 text-center">
                                            <Btn variant="outline" size="sm" onClick={() => handleEditPatient(p.id)}>
                                                <Edit className="h-3 w-3 mr-1.5" /> Edit
                                            </Btn>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={6}>
                                        <div className="text-center py-16 px-6 text-gray-500">
                                            <p className="font-semibold">No Patients Found</p>
                                            {term ? (
                                                <p className="text-sm mt-1">Try a different search term or <button onClick={() => setTerm('')} className="underline text-blue-600">clear the search</button>.</p>
                                            ) : (
                                                <p className="text-sm mt-1">Add a new patient referral to get started.</p>
                                            )}
                                        </div>
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                <PatientEditDrawer
                    patientId={selectedPatientId}
                    onClose={handleCloseDrawer}
                    onUpdate={() => {
                        refetch();
                        handleCloseDrawer();
                    }}
                />
            </div>
        </div>
    );
};

export default PatientManager;
