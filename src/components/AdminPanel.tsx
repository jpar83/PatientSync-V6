import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/lib/toast';
import { writeAuditLog } from '@/lib/auditLogger';
import { AUTHORIZED_ADMINS } from '@/lib/constants';
import { mockProfiles } from '@/lib/mockData';
import type { Profile, Patient } from '@/lib/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Shield, Search, User, UserCheck, AlertTriangle, ChevronRight, Users, Trash2, GitMerge } from 'lucide-react';
import { Btn } from '@/components/ui/Btn';
import { Input } from '@/components/ui/Input';
import SimpleConfirmationModal from '@/components/ui/SimpleConfirmationModal';
import ResetConfirmationModal from '@/components/ui/ResetConfirmationModal';
import SlideOver from '@/components/ui/SlideOver';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

// Sub-component for Duplicate Finder
const DuplicatePatientManager: React.FC = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const [mergeCandidateGroup, setMergeCandidateGroup] = useState<Patient[] | null>(null);

    const { data: duplicates, isLoading } = useQuery({
        queryKey: ['patientDuplicates'],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('find_patient_duplicates');
            if (error) throw error;
            return data as Patient[];
        },
        enabled: AUTHORIZED_ADMINS.includes(user?.email || ''),
    });

    const mergeMutation = useMutation({
        mutationFn: async (duplicatesToMerge: Patient[]) => {
            const ids = duplicatesToMerge.map(d => d.id);
            const { data: masterId, error } = await supabase.rpc('merge_patients', { ids });
            if (error) throw error;
            return { masterId, mergedCount: ids.length };
        },
        onSuccess: ({ masterId, mergedCount }) => {
            toast(`Successfully merged ${mergedCount} records.`, 'ok');
            queryClient.invalidateQueries({ queryKey: ['patientDuplicates'] });
            // The SQL function now handles audit logging.
        },
        onError: (error: any) => {
            toast(`Merge failed: ${error.message}`, 'err');
        },
        onSettled: () => {
            setMergeCandidateGroup(null);
        }
    });

    const groupedDuplicates = useMemo(() => {
        if (!duplicates) return {};
        return duplicates.reduce((acc, patient) => {
            const email = patient.email?.toLowerCase().trim() || 'unknown';
            if (!acc[email]) acc[email] = [];
            acc[email].push(patient);
            return acc;
        }, {} as Record<string, Patient[]>);
    }, [duplicates]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-40"><Loader2 className="h-6 w-6 animate-spin text-teal-500" /></div>;
    }
    
    const duplicateGroups = Object.values(groupedDuplicates).filter(group => group.length > 1);

    if (duplicateGroups.length === 0) {
        return <p className="text-sm text-gray-500 text-center py-4">No duplicate patient records found.</p>;
    }

    return (
        <div className="space-y-4">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                    <div className="flex-shrink-0"><AlertTriangle className="h-5 w-5 text-yellow-400" /></div>
                    <div className="ml-3"><p className="text-sm text-yellow-700">Found {duplicateGroups.length} groups of duplicate records based on email. Merging is permanent.</p></div>
                </div>
            </div>
            <div className="max-h-96 overflow-y-auto pr-2 space-y-3">
                {duplicateGroups.map((patients, index) => (
                    <div key={index} className="soft-card p-4 bg-gray-50 lift elevate">
                        <div className="flex justify-between items-center">
                            <p className="font-semibold text-gray-800">{patients[0].email}</p>
                            <Btn size="sm" variant="outline" onClick={() => setMergeCandidateGroup(patients)}>
                                <GitMerge className="h-4 w-4 mr-2" /> Review & Merge
                            </Btn>
                        </div>
                        <ul className="text-xs text-gray-600 mt-2 space-y-1">
                            {patients.map(p => (
                                <li key={p.id} className="flex justify-between">
                                    <span>{p.name}</span>
                                    <span className="text-gray-400">Created: {new Date(p.created_at).toLocaleDateString()}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
            <SimpleConfirmationModal
                isOpen={!!mergeCandidateGroup}
                onClose={() => setMergeCandidateGroup(null)}
                onConfirm={() => {
                    if (mergeCandidateGroup) {
                        mergeMutation.mutate(mergeCandidateGroup);
                    }
                }}
                isLoading={mergeMutation.isPending}
                title="Confirm Patient Merge"
                message={`Are you sure you want to merge these ${mergeCandidateGroup?.length} records? The most complete and recent record will be kept as the primary. This action cannot be undone.`}
                confirmButtonText="Yes, Merge Records"
            />
        </div>
    );
};


const AdminPanel: React.FC = () => {
    const { user, loading: authLoading } = useAuth();
    const queryClient = useQueryClient();
    
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [profilesLoading, setProfilesLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [roleModalState, setRoleModalState] = useState<{ isOpen: boolean; profile?: Profile; newRole?: 'admin' | 'user' }>({ isOpen: false });
    const [isRoleManagerOpen, setIsRoleManagerOpen] = useState(false);

    const isAuthorized = useMemo(() => AUTHORIZED_ADMINS.includes(user?.email || ''), [user]);

    const { data: fetchedProfiles, isLoading: isProfilesLoading } = useQuery({
        queryKey: ['profiles'],
        queryFn: async () => {
            const { data, error } = await supabase.from('profiles').select('id, email, role, created_at, full_name').order('created_at', { ascending: false });
            if (error) throw error;
            
            let finalProfiles = (data as Profile[]) || [];

            if (import.meta.env.DEV && finalProfiles.length < 5) {
                const existingEmails = new Set(finalProfiles.map(p => p.email));
                const mockDataToAdd = mockProfiles.filter(p => !existingEmails.has(p.email));
                finalProfiles = [...finalProfiles, ...mockDataToAdd];
            }
            return finalProfiles;
        },
        enabled: isAuthorized,
    });

    useEffect(() => {
        if (fetchedProfiles) {
            setProfiles(fetchedProfiles);
        }
        setProfilesLoading(isProfilesLoading);
    }, [fetchedProfiles, isProfilesLoading]);

    const handleUpdateRole = async () => {
        if (!roleModalState.profile || !roleModalState.newRole || !isAuthorized) return;
        const { profile, newRole } = roleModalState;
        try {
            if (AUTHORIZED_ADMINS.includes(profile.email) && newRole === 'user') {
                toast('Cannot demote the primary administrator.', 'err');
                setRoleModalState({ isOpen: false });
                return;
            }

            if (profile.id.includes('-') && !profile.created_at.startsWith('20')) {
                toast('This is mock data and cannot be modified.', 'ok');
                setRoleModalState({ isOpen: false });
                return;
            }

            const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', profile.id);
            if (error) throw error;
            await writeAuditLog('role_update', { changed_by: user?.email, changed_user: profile.email, details: { new_role: newRole } });
            toast(`Role updated successfully for ${profile.email}.`, 'ok');
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
        } catch (err) {
            console.error('Failed to update role:', err);
            toast('Failed to update role.', 'err');
        } finally {
            setRoleModalState({ isOpen: false });
        }
    };

    const openRoleModal = (profile: Profile) => {
        const newRole = profile.role === 'admin' ? 'user' : 'admin';
        setRoleModalState({ isOpen: true, profile, newRole });
    };

    const filteredProfiles = useMemo(() => {
        return profiles.filter(p => 
            p.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            (p.full_name && p.full_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
        );
    }, [profiles, debouncedSearchTerm]);

    // === Data Management Logic ===
    const [showHardResetModal, setShowHardResetModal] = useState(false);
    const [showSoftResetModal, setShowSoftResetModal] = useState(false);
    const [isHardResetting, setIsHardResetting] = useState(false);
    const [isSoftResetting, setIsSoftResetting] = useState(false);
    const [message, setMessage] = useState('');
    const [buttonDisabled, setButtonDisabled] = useState(false);

    const handleConfirmHardReset = async () => {
        setIsHardResetting(true);
        setMessage('');
        try {
            const { error } = await supabase.from('patients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (error) throw error;
            localStorage.removeItem('patientSync_userPrefs');
            localStorage.removeItem('patientSync_lastReminder');
            await writeAuditLog('dataset_reset', { changed_by: user?.email });
            setMessage('All referral data cleared successfully. The page will now reload.');
            setShowHardResetModal(false);
            setButtonDisabled(true);
            setTimeout(() => window.location.reload(), 3000);
        } catch (error) {
            console.error("Failed to reset dataset:", error);
            setMessage('An error occurred during the hard reset. Please check the console.');
        } finally {
            setIsHardResetting(false);
        }
    };

    const handleConfirmSoftReset = async () => {
        setIsSoftResetting(true);
        setMessage('');
        try {
            const { data, error } = await supabase.from('orders').delete().eq('is_archived', true).select();
            if (error) throw error;
            await writeAuditLog('archived_cleared', { changed_by: user?.email, details: { count: data?.length || 0 } });
            setMessage(`${data?.length || 0} archived records have been cleared. The page will now reload.`);
            setShowSoftResetModal(false);
            setButtonDisabled(true);
            setTimeout(() => window.location.reload(), 3000);
        } catch (error) {
            console.error("Failed to perform soft reset:", error);
            setMessage('An error occurred during the soft reset. Please check the console.');
        } finally {
            setIsSoftResetting(false);
        }
    };

    if (authLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-teal-500" /></div>;
    }

    return (
        <div className="space-y-8 max-w-4xl">
            <div 
                className="soft-card p-6 cursor-pointer group lift elevate fade-in"
                onClick={() => setIsRoleManagerOpen(true)}
            >
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800">Admin Role Management</h2>
                        <p className="text-sm text-gray-500 mt-1">Click to view, promote, or demote users.</p>
                    </div>
                    <div className="flex items-center">
                        {profilesLoading ? (
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400 mr-4" />
                        ) : (
                            <div className="hidden sm:flex -space-x-2 overflow-hidden mr-4">
                                {profiles.slice(0, 4).map(p => (
                                    <img key={p.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-white" src={`https://api.dicebear.com/7.x/initials/svg?seed=${p.full_name || p.email}`} alt={p.email} title={p.email} />
                                ))}
                                {profiles.length > 4 && <div className="flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-white bg-gray-200 text-xs font-medium text-gray-600">+{profiles.length - 4}</div>}
                            </div>
                        )}
                        <ChevronRight className="h-6 w-6 text-gray-400 group-hover:text-teal-600 transition-colors" />
                    </div>
                </div>
            </div>

            <div className="soft-card elevate fade-in">
                <div className="p-6 border-b">
                    <h2 className="text-lg font-semibold text-gray-800">Data Integrity Tools</h2>
                    <p className="text-sm text-gray-500 mt-1">Tools for maintaining a clean database.</p>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <h3 className="font-semibold text-gray-700">Duplicate Patient Finder</h3>
                        <p className="text-sm text-gray-500 mt-1 mb-3">Find and merge patient records that have the same email address.</p>
                        <DuplicatePatientManager />
                    </div>
                </div>
            </div>

            <div className="soft-card elevate fade-in">
                <div className="p-6 border-b">
                    <h2 className="text-lg font-semibold text-gray-800">Data Management</h2>
                    <p className="text-sm text-gray-500 mt-1">For emergency use only. Actions are permanent and audited.</p>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <h3 className="font-semibold text-gray-700">Clear Archived Records</h3>
                        <p className="text-sm text-gray-500 mt-1 mb-3">This will permanently delete all orders that are currently archived. This is useful for periodic cleanup and does not affect active referrals.</p>
                        <Btn variant="outline" onClick={() => setShowSoftResetModal(true)} disabled={buttonDisabled || isSoftResetting} className="!text-amber-600 !border-amber-400 hover:!bg-amber-50">
                            {isSoftResetting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 'Clear Archived Referrals'}
                        </Btn>
                    </div>
                    <div className="border-t pt-6">
                        <h3 className="font-semibold text-red-700">Full Dataset Reset</h3>
                        <div className="bg-red-50 border-l-4 border-red-400 p-4 my-3">
                            <div className="flex">
                                <div className="flex-shrink-0"><AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" /></div>
                                <div className="ml-3"><p className="text-sm text-red-700">This will **permanently delete all patient and referral records**. This action cannot be undone and is for emergency use only.</p></div>
                            </div>
                        </div>
                        <Btn variant="outline" onClick={() => setShowHardResetModal(true)} disabled={buttonDisabled || isHardResetting} className="!text-red-600 !border-red-300 hover:!bg-red-50">
                            {isHardResetting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : '🧨 Reset Full Dataset'}
                        </Btn>
                    </div>
                    {message && <p className="text-sm font-medium text-teal-600 mt-4">{message}</p>}
                </div>
            </div>

            <SlideOver isOpen={isRoleManagerOpen} onClose={() => setIsRoleManagerOpen(false)} title="Admin Role Management">
                <div className="p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <p className="text-sm text-gray-500">Promote or demote users. Actions are audited.</p>
                        <div className="flex-shrink-0 bg-teal-50 text-teal-700 text-sm font-semibold px-3 py-1.5 rounded-lg flex items-center gap-2 self-start sm:self-center">
                            <Shield className="h-4 w-4" />
                            Authorized Admin: Jeff Parrish
                        </div>
                    </div>
                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input 
                            label="Search by email or name"
                            id="search-users-drawer"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Filter users..."
                            className="pl-10"
                        />
                    </div>
                    {profilesLoading ? (
                        <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-teal-500" /></div>
                    ) : (
                        <>
                            <div className="hidden md:block overflow-x-auto">
                                <table className="min-w-full w-full text-sm">
                                    <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                                        <tr>
                                            <th className="p-3 text-left">Name</th>
                                            <th className="p-3 text-left">Email</th>
                                            <th className="p-3 text-left">Role</th>
                                            <th className="p-3 text-left">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {filteredProfiles.map(p => (
                                        <tr key={p.id} className="hover:bg-emerald-50/40">
                                            <td className="p-3 font-medium text-gray-800">{p.full_name || '—'}</td>
                                            <td className="p-3 text-gray-600">{p.email}</td>
                                            <td className="p-3">
                                            <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', p.role === 'admin' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700')}>
                                                {p.role}
                                            </span>
                                            </td>
                                            <td className="p-3">
                                            {p.email === user?.email ? (
                                                <span className="text-xs text-gray-400 italic px-3 py-1.5">Current Admin (You)</span>
                                            ) : (
                                                <Btn variant="outline" size="sm" onClick={() => openRoleModal(p)}>
                                                {p.role === 'admin' ? 'Revert to User' : 'Promote to Admin'}
                                                </Btn>
                                            )}
                                            </td>
                                        </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="md:hidden space-y-3">
                                {filteredProfiles.map(p => (
                                    <div key={p.id} className="bg-gray-50 rounded-lg border p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium text-gray-800 break-all">{p.full_name || 'No Name'}</p>
                                                <p className="text-sm text-gray-500 break-all">{p.email}</p>
                                            </div>
                                            <span className={cn('flex-shrink-0 ml-2 px-2 py-0.5 rounded-full text-xs font-semibold', p.role === 'admin' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700')}>
                                                {p.role}
                                            </span>
                                        </div>
                                        {p.email === user?.email ? (
                                            <div className="flex items-center justify-center w-full text-xs text-gray-500 italic py-2 rounded-lg bg-gray-100 border">
                                                (This is your account)
                                            </div>
                                        ) : (
                                            <Btn variant="outline" size="sm" onClick={() => openRoleModal(p)} className="w-full">
                                                {p.role === 'admin' ? <><User className="h-4 w-4 mr-2" /> Revert to User</> : <><UserCheck className="h-4 w-4 mr-2" /> Promote to Admin</>}
                                            </Btn>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </SlideOver>

            <SimpleConfirmationModal
                isOpen={roleModalState.isOpen}
                onClose={() => setRoleModalState({ isOpen: false })}
                onConfirm={handleUpdateRole}
                isLoading={profilesLoading}
                title="Confirm Role Change"
                message={`Are you sure you want to change the role of ${roleModalState.profile?.email} to "${roleModalState.newRole}"?`}
                confirmButtonText="Yes, Change Role"
            />
            <ResetConfirmationModal isOpen={showHardResetModal} onClose={() => setShowHardResetModal(false)} onConfirm={handleConfirmHardReset} isResetting={isHardResetting} />
            <SimpleConfirmationModal
                isOpen={showSoftResetModal}
                onClose={() => setShowSoftResetModal(false)}
                onConfirm={handleConfirmSoftReset}
                isLoading={isSoftResetting}
                title="Confirm Soft Reset"
                message="Are you sure you want to permanently delete all archived records? This action cannot be undone."
                confirmButtonText="Yes, Delete Archived"
                confirmButtonVariant="primary"
            />
        </div>
    );
};

export default AdminPanel;
