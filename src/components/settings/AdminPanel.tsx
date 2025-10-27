import React, { useState, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from '../../lib/toast';
import { writeAuditLog } from '../../lib/auditLogger';
import { AUTHORIZED_ADMINS } from '../../lib/constants';
import { mockProfiles } from '../../lib/mockData';
import type { Profile, Patient } from '../../lib/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Shield, Search, User, UserCheck, AlertTriangle, ChevronRight, Users, Trash2, GitMerge, RotateCcw } from 'lucide-react';
import { Btn } from '../ui/Btn';
import { Input } from '../ui/Input';
import SimpleConfirmationModal from '../ui/SimpleConfirmationModal';
import ResetConfirmationModal from '../ui/ResetConfirmationModal';
import SlideOver from '../ui/SlideOver';
import { cn } from '../../lib/utils';
import ToggleSwitch from '../ui/ToggleSwitch';
import { useDebounce } from '../../hooks/useDebounce';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';

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
        return <div className="flex justify-center items-center h-32"><Loader2 className="h-5 w-5 animate-spin text-teal-500" /></div>;
    }
    
    const duplicateGroups = Object.values(groupedDuplicates).filter(group => group.length > 1);

    if (duplicateGroups.length === 0) {
        return <p className="text-xs text-gray-500 text-center py-3">No duplicate patient records found.</p>;
    }

    return (
        <div className="space-y-3">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
                <div className="flex">
                    <div className="flex-shrink-0"><AlertTriangle className="h-4 w-4 text-yellow-400" /></div>
                    <div className="ml-2"><p className="text-xs text-yellow-700">Found {duplicateGroups.length} groups of duplicate records based on email. Merging is permanent.</p></div>
                </div>
            </div>
            <div className="max-h-80 overflow-y-auto pr-2 space-y-2">
                {duplicateGroups.map((patients, index) => (
                    <div key={index} className="soft-card p-3 bg-gray-50 lift elevate">
                        <div className="flex justify-between items-center">
                            <p className="font-semibold text-gray-800 text-sm">{patients[0].email}</p>
                            <Btn size="sm" variant="outline" onClick={() => setMergeCandidateGroup(patients)}>
                                <GitMerge className="h-3 w-3 mr-1.5" /> Review & Merge
                            </Btn>
                        </div>
                        <ul className="text-xs text-gray-600 mt-1.5 space-y-1">
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
    
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [roleModalState, setRoleModalState] = useState<{ isOpen: boolean; profile?: Profile; newRole?: 'admin' | 'user' }>({ isOpen: false });
    const [isRoleManagerOpen, setIsRoleManagerOpen] = useState(false);
    const [showArchived, setShowArchived] = useState(false);
    const [userToModify, setUserToModify] = useState<{ profile: Profile; action: 'archive' | 'restore' } | null>(null);

    const isAuthorized = useMemo(() => AUTHORIZED_ADMINS.includes(user?.email || ''), [user]);

    const { data: profiles = [], isLoading: profilesLoading } = useQuery({
        queryKey: ['profiles'],
        queryFn: async () => {
            const { data, error } = await supabase.from('profiles').select('id, email, role, created_at, full_name, archived_at').order('created_at', { ascending: false });
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

    const roleMutation = useMutation({
        mutationFn: async ({ profile, newRole }: { profile: Profile; newRole: 'admin' | 'user' }) => {
            if (AUTHORIZED_ADMINS.includes(profile.email) && newRole === 'user') {
                throw new Error('Cannot demote the primary administrator.');
            }
            if (profile.id.includes('-') && !profile.created_at.startsWith('20')) {
                return;
            }
            const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', profile.id);
            if (error) throw error;
            await writeAuditLog('role_update', { changed_by: user?.email, changed_user: profile.email, details: { new_role: newRole } });
        },
        onSuccess: (_, variables) => {
            toast(`Role updated successfully for ${variables.profile.email}.`, 'ok');
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
        },
        onError: (error: any) => {
            toast(error.message || 'Failed to update role.', 'err');
        },
        onSettled: () => {
            setRoleModalState({ isOpen: false });
        }
    });

    const archiveMutation = useMutation({
        mutationFn: async ({ profile, action }: { profile: Profile; action: 'archive' | 'restore' }) => {
            const newArchivedAt = action === 'archive' ? new Date().toISOString() : null;
            const { error } = await supabase.from('profiles').update({ archived_at: newArchivedAt }).eq('id', profile.id);
            if (error) throw error;
            await writeAuditLog(action === 'archive' ? 'user_archived' : 'user_restored', { changed_by: user?.email, changed_user: profile.email });
        },
        onSuccess: (_, variables) => {
            toast(`User ${variables.profile.email} has been ${variables.action}d.`, 'ok');
            queryClient.invalidateQueries({ queryKey: ['profiles'] });
        },
        onError: (error: any) => {
            toast(`Error: ${error.message}`, 'err');
        },
        onSettled: () => {
            setUserToModify(null);
        }
    });

    const handleUpdateRole = () => {
        if (!roleModalState.profile || !roleModalState.newRole) return;
        roleMutation.mutate({ profile: roleModalState.profile, newRole: roleModalState.newRole });
    };

    const openRoleModal = (profile: Profile) => {
        const newRole = profile.role === 'admin' ? 'user' : 'admin';
        setRoleModalState({ isOpen: true, profile, newRole });
    };

    const openArchiveModal = (profile: Profile) => {
        const action = profile.archived_at ? 'restore' : 'archive';
        setUserToModify({ profile, action });
    };

    const handleArchiveConfirm = () => {
        if (!userToModify) return;
        archiveMutation.mutate(userToModify);
    };

    const filteredProfiles = useMemo(() => {
        return profiles
            .filter(p => showArchived ? true : !p.archived_at)
            .filter(p => 
                p.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                (p.full_name && p.full_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
            );
    }, [profiles, debouncedSearchTerm, showArchived]);

    // === Data Management Logic ===
    const [showHardResetModal, setShowHardResetModal] = useState(false);
    const [showSoftResetModal, setShowSoftResetModal] = useState(false);
    const [isHardResetting, setIsHardResetting] = useState(false);
    const [isSoftResetting, setIsSoftResetting] = useState(false);
    const [isExportingNotes, setIsExportingNotes] = useState(false);
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
    
    const handleExportNotes = async () => {
        setIsExportingNotes(true);
        try {
            const { data, error } = await supabase.rpc('export_all_notes');
            if (error) throw error;
            
            const csv = Papa.unparse(data as any[]);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            saveAs(blob, `patient_notes_export_${new Date().toISOString().split('T')[0]}.csv`);
            toast('Notes exported successfully.', 'ok');
        } catch (error: any) {
            toast(`Failed to export notes: ${error.message}`, 'err');
        } finally {
            setIsExportingNotes(false);
        }
    };

    if (authLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-6 w-6 animate-spin text-teal-500" /></div>;
    }

    return (
        <div className="space-y-6 max-w-4xl">
            <div 
                className="soft-card p-4 cursor-pointer group lift elevate fade-in"
                onClick={() => setIsRoleManagerOpen(true)}
            >
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-base font-semibold text-gray-800">User Management</h2>
                        <p className="text-xs text-gray-500 mt-1">Click to view, promote, demote, or archive users.</p>
                    </div>
                    <div className="flex items-center">
                        {profilesLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin text-gray-400 mr-3" />
                        ) : (
                            <div className="hidden sm:flex -space-x-2 overflow-hidden mr-3">
                                {profiles.filter(p => !p.archived_at).slice(0, 4).map(p => (
                                    <img key={p.id} className="inline-block h-7 w-7 rounded-full ring-2 ring-white" src={`https://api.dicebear.com/7.x/initials/svg?seed=${p.full_name || p.email}`} alt={p.email} title={p.email} />
                                ))}
                                {profiles.filter(p => !p.archived_at).length > 4 && <div className="flex items-center justify-center h-7 w-7 rounded-full ring-2 ring-white bg-gray-200 text-xs font-medium text-gray-600">+{profiles.filter(p => !p.archived_at).length - 4}</div>}
                            </div>
                        )}
                        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-teal-600 transition-colors" />
                    </div>
                </div>
            </div>

            <div className="soft-card elevate fade-in">
                <div className="p-4 border-b">
                    <h2 className="text-base font-semibold text-gray-800">Data Integrity Tools</h2>
                    <p className="text-xs text-gray-500 mt-1">Tools for maintaining a clean database.</p>
                </div>
                <div className="p-4 space-y-4">
                    <div>
                        <h3 className="font-medium text-gray-700">Duplicate Patient Finder</h3>
                        <p className="text-xs text-gray-500 mt-1 mb-2">Find and merge patient records that have the same email address.</p>
                        <DuplicatePatientManager />
                    </div>
                </div>
            </div>

            <div className="soft-card elevate fade-in">
                <div className="p-4 border-b">
                    <h2 className="text-base font-semibold text-gray-800">Data Management</h2>
                    <p className="text-xs text-gray-500 mt-1">For emergency use only. Actions are permanent and audited.</p>
                </div>
                <div className="p-4 space-y-4">
                    <div className="border-b pb-4">
                        <h3 className="font-medium text-gray-700">Export Notes</h3>
                        <p className="text-xs text-gray-500 mt-1 mb-2">Export all patient notes to a CSV file.</p>
                        <Btn variant="outline" size="sm" onClick={handleExportNotes} disabled={isExportingNotes}>
                            {isExportingNotes ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                            Export All Notes (CSV)
                        </Btn>
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-700">Clear Archived Records</h3>
                        <p className="text-xs text-gray-500 mt-1 mb-2">This will permanently delete all orders that are currently archived. This is useful for periodic cleanup and does not affect active referrals.</p>
                        <Btn variant="outline" size="sm" onClick={() => setShowSoftResetModal(true)} disabled={buttonDisabled || isSoftResetting} className="!text-amber-600 !border-amber-400 hover:!bg-amber-50">
                            {isSoftResetting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 'Clear Archived Referrals'}
                        </Btn>
                    </div>
                    <div className="border-t pt-4">
                        <h3 className="font-medium text-red-700">Full Dataset Reset</h3>
                        <div className="bg-red-50 border-l-4 border-red-400 p-3 my-2">
                            <div className="flex">
                                <div className="flex-shrink-0"><AlertTriangle className="h-4 w-4 text-red-400" aria-hidden="true" /></div>
                                <div className="ml-2"><p className="text-xs text-red-700">This will **permanently delete all patient and referral records**. This action cannot be undone and is for emergency use only.</p></div>
                            </div>
                        </div>
                        <Btn variant="outline" size="sm" onClick={() => setShowHardResetModal(true)} disabled={buttonDisabled || isHardResetting} className="!text-red-600 !border-red-300 hover:!bg-red-50">
                            {isHardResetting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : '🧨 Reset Full Dataset'}
                        </Btn>
                    </div>
                    {message && <p className="text-sm font-medium text-teal-600 mt-3">{message}</p>}
                </div>
            </div>

            <SlideOver isOpen={isRoleManagerOpen} onClose={() => setIsRoleManagerOpen(false)} title="User Management">
                <div className="p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <p className="text-sm text-gray-500">Promote, demote, or archive users. Actions are audited.</p>
                        <div className="flex-shrink-0 bg-teal-50 text-teal-700 text-xs font-semibold px-2 py-1 rounded-md flex items-center gap-1.5 self-start sm:self-center">
                            <Shield className="h-4 w-4" />
                            Authorized Admin: {user?.user_metadata.full_name || user?.email}
                        </div>
                    </div>
                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                            label="Search by email or name"
                            id="search-users-drawer"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Filter users..."
                            className="pl-9"
                        />
                    </div>
                    <ToggleSwitch
                        label="Show archived users"
                        checked={showArchived}
                        onChange={() => setShowArchived(s => !s)}
                    />
                    {profilesLoading ? (
                        <div className="flex justify-center items-center h-64"><Loader2 className="h-6 w-6 animate-spin text-teal-500" /></div>
                    ) : (
                        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                            {filteredProfiles.map(p => (
                                <div key={p.id} className={cn("bg-gray-50 rounded-lg border p-3 space-y-2", p.archived_at && "opacity-60")}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium text-gray-800 break-all">{p.full_name || 'No Name'}</p>
                                            <p className="text-sm text-gray-500 break-all">{p.email}</p>
                                        </div>
                                        <span className={cn('flex-shrink-0 ml-2 px-2 py-0.5 rounded-full text-xs font-semibold', p.role === 'admin' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700')}>
                                            {p.role}
                                        </span>
                                    </div>
                                    {p.archived_at && <p className="text-xs text-red-600 font-medium">Archived on {new Date(p.archived_at).toLocaleDateString()}</p>}
                                    {p.email === user?.email ? (
                                        <div className="flex items-center justify-center w-full text-xs text-gray-500 italic py-1.5 rounded-lg bg-gray-100 border">
                                            (This is your account)
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Btn variant="outline" size="sm" onClick={() => openRoleModal(p)} className="flex-1">
                                                {p.role === 'admin' ? <><User className="h-4 w-4 mr-1" /> Revert to User</> : <><UserCheck className="h-4 w-4 mr-1" /> Promote</>}
                                            </Btn>
                                            <Btn variant="outline" size="sm" onClick={() => openArchiveModal(p)} className="flex-1">
                                                {p.archived_at ? <><RotateCcw className="h-4 w-4 mr-1" /> Restore</> : <><Trash2 className="h-4 w-4 mr-1" /> Archive</>}
                                            </Btn>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </SlideOver>

            <SimpleConfirmationModal
                isOpen={roleModalState.isOpen}
                onClose={() => setRoleModalState({ isOpen: false })}
                onConfirm={handleUpdateRole}
                isLoading={roleMutation.isPending}
                title="Confirm Role Change"
                message={`Are you sure you want to change the role of ${roleModalState.profile?.email} to "${roleModalState.newRole}"?`}
                confirmButtonText="Yes, Change Role"
            />
            <SimpleConfirmationModal
                isOpen={!!userToModify}
                onClose={() => setUserToModify(null)}
                onConfirm={handleArchiveConfirm}
                isLoading={archiveMutation.isPending}
                title={`Confirm User ${userToModify?.action === 'archive' ? 'Archival' : 'Restoration'}`}
                message={`Are you sure you want to ${userToModify?.action} the user ${userToModify?.profile.email}?`}
                confirmButtonText={`Yes, ${userToModify?.action}`}
                confirmButtonVariant={userToModify?.action === 'archive' ? 'danger' : 'primary'}
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
