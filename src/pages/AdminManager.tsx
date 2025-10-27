import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../lib/toast';
import { writeAuditLog } from '../lib/auditLogger';
import { AUTHORIZED_ADMINS } from '../lib/constants';
import type { Profile } from '../lib/types';
import { Loader2, Shield, Search, User, UserCheck } from 'lucide-react';
import { Btn } from '../components/ui/Btn';
import { Input } from '../components/ui/Input';
import SimpleConfirmationModal from '../components/ui/SimpleConfirmationModal';
import { cn } from '../lib/utils';

const AdminManager: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalState, setModalState] = useState<{ isOpen: boolean; profile?: Profile; newRole?: 'admin' | 'user' }>({ isOpen: false });

  const isAuthorized = useMemo(() => AUTHORIZED_ADMINS.includes(user?.email || ''), [user]);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('profiles').select('id, email, role, created_at, full_name').order('created_at', { ascending: false });
      if (error) throw error;
      setProfiles(data as Profile[] || []);
    } catch (err) {
      console.error('Error fetching profiles:', err);
      toast('Failed to fetch user profiles.', 'err');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthorized) {
        toast('You do not have permission to manage roles.', 'err');
        navigate('/');
      } else {
        fetchProfiles();
      }
    }
  }, [user, authLoading, isAuthorized, navigate, fetchProfiles]);

  const handleUpdateRole = async () => {
    if (!modalState.profile || !modalState.newRole || !isAuthorized) return;

    const { profile, newRole } = modalState;

    try {
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', profile.id);
      if (error) throw error;

      await writeAuditLog('role_update', {
        changed_by: user?.email,
        changed_user: profile.email,
        previous_role: profile.role,
        new_role: newRole,
      });

      toast(`Role updated successfully for ${profile.email}.`, 'ok');
      fetchProfiles();
    } catch (err) {
      console.error('Failed to update role:', err);
      toast('Failed to update role.', 'err');
    } finally {
      setModalState({ isOpen: false });
    }
  };

  const openModal = (profile: Profile) => {
    const newRole = profile.role === 'admin' ? 'user' : 'admin';
    setModalState({ isOpen: true, profile, newRole });
  };

  const filteredProfiles = useMemo(() => {
    return profiles.filter(p => 
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.full_name && p.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [profiles, searchTerm]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-12 w-12 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
            <p className="text-sm text-gray-500">Settings ▸ Admin Manager</p>
            <h1 className="text-2xl font-bold text-gray-800">Admin Role Management</h1>
        </div>
        <div className="flex-shrink-0 bg-teal-50 text-teal-700 text-sm font-semibold px-3 py-1.5 rounded-lg flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Authorized Admin: Jeff Parrish
        </div>
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input 
            label="Search by email or name"
            id="search-users"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Filter users..."
            wrapperClassName="max-w-sm"
            className="pl-10"
        />
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl shadow-md overflow-x-auto">
        <table className="min-w-full w-full text-sm">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredProfiles.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
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
                    <Btn variant="outline" onClick={() => openModal(p)}>
                      {p.role === 'admin' ? 'Revert to User' : 'Promote to Admin'}
                    </Btn>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredProfiles.map(p => (
            <div key={p.id} className="bg-white rounded-xl shadow-md p-4 space-y-3">
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
                    <div className="flex items-center justify-center w-full text-xs text-gray-500 italic py-2 rounded-lg bg-gray-50 border">
                        (This is your account)
                    </div>
                ) : (
                    <Btn variant="outline" onClick={() => openModal(p)} className="w-full">
                        {p.role === 'admin' ? <><User className="h-4 w-4 mr-2" /> Revert to User</> : <><UserCheck className="h-4 w-4 mr-2" /> Promote to Admin</>}
                    </Btn>
                )}
            </div>
        ))}
      </div>

      <SimpleConfirmationModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false })}
        onConfirm={handleUpdateRole}
        isLoading={loading}
        title="Confirm Role Change"
        message={`Are you sure you want to change the role of ${modalState.profile?.email} to "${modalState.newRole}"?`}
        confirmButtonText="Yes, Change Role"
      />
    </div>
  );
};

export default AdminManager;
