import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePreferences } from '../../contexts/PreferencesContext';
import { supabase } from '../../lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '../../lib/toast';
import { Btn } from '../ui/Btn';
import { Input } from '../ui/Input';
import ToggleSwitch from '../ui/ToggleSwitch';
import { Loader2, Save, KeyRound, Camera, AlertTriangle } from 'lucide-react';

const ProfilePanel: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const { prefs, setPrefs } = usePreferences();
    const queryClient = useQueryClient();

    const [fullName, setFullName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const { data: profile, isLoading: isLoadingProfile } = useQuery({
        queryKey: ['userProfile', user?.id],
        queryFn: async () => {
            if (!user) return null;
            const { data, error } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single();
            
            if (error && error.code === 'PGRST116') {
                return null; // Profile doesn't exist, which is a valid state.
            }
            if (error) throw error;

            return data as { full_name: string | null; avatar_url: string | null; };
        },
        enabled: !!user,
    });

    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || '');
        } else if (user) {
            setFullName(user.user_metadata.full_name || '');
        }
    }, [profile, user]);

    const profileUpdateMutation = useMutation({
        mutationFn: async (name: string) => {
            if (!user) throw new Error("User not authenticated");

            // 1. Update Supabase Auth user metadata
            const { data: { user: updatedUser }, error: authError } = await supabase.auth.updateUser({
                data: { full_name: name }
            });
            if (authError) throw authError;
            if (!updatedUser) throw new Error("Failed to update auth user.");

            // 2. Upsert into the public.profiles table to create or update
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    full_name: name,
                    email: user.email,
                }, {
                    onConflict: 'id'
                });

            if (profileError) throw profileError;
        },
        onSuccess: async () => {
            await refreshUser();
            queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['all_profiles_for_timeline'] });
            toast('Profile updated successfully.', 'ok');
        },
        onError: (error: any) => {
            toast(`Failed to update profile: ${error.message}`, 'err');
        }
    });

    const passwordUpdateMutation = useMutation({
        mutationFn: async (password: string) => {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
        },
        onSuccess: () => {
            toast('Password updated successfully.', 'ok');
            setNewPassword('');
            setConfirmPassword('');
        },
        onError: (error: any) => {
            toast(`Failed to update password: ${error.message}`, 'err');
        }
    });
    
    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0 || !user) return;

        const file = event.target.files[0];
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}.${fileExt}`;

        setIsUploading(true);
        try {
            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            const publicUrl = `${data.publicUrl}?t=${new Date().getTime()}`;

            const { error: userUpdateError } = await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
            if (userUpdateError) throw userUpdateError;

            const { error: profileUpsertError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    avatar_url: publicUrl,
                    email: user.email,
                }, { onConflict: 'id' });
            if (profileUpsertError) throw profileUpsertError;
            
            await refreshUser();
            queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] });
            toast('Avatar updated!', 'ok');
        } catch (error: any) {
            if (error.message === 'Bucket not found') {
                toast('Setup Required: Please create a public "avatars" bucket in your Supabase storage.', 'err');
            } else {
                toast(`Avatar upload failed: ${error.message}`, 'err');
            }
            console.error(error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleProfileSave = (e: React.FormEvent) => {
        e.preventDefault();
        profileUpdateMutation.mutate(fullName);
    };

    const handlePasswordSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            toast('Password must be at least 6 characters long.', 'err');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast('Passwords do not match.', 'err');
            return;
        }
        passwordUpdateMutation.mutate(newPassword);
    };

    const togglePref = (key: keyof typeof prefs) => {
        if (key === 'rememberDashboardLayout' && prefs.rememberDashboardLayout) {
            // When turning off, clear the saved layout
            setPrefs(p => ({ ...p, [key]: !p[key], dashboardLayout: {} }));
        } else {
            setPrefs(p => ({ ...p, [key]: !p[key] }));
        }
    };

    if (isLoadingProfile) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-6 w-6 animate-spin text-teal-500" /></div>;
    }
    
    const avatarUrl = user?.user_metadata.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${fullName || user?.email}`;

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Profile Info Section */}
            <div className="soft-card">
                <div className="p-4 border-b">
                    <h2 className="text-base font-semibold text-gray-800">Profile Information</h2>
                    <p className="text-xs text-gray-500 mt-1">Manage your personal details.</p>
                </div>
                <form onSubmit={handleProfileSave} className="p-4 space-y-4">
                    <div className="flex items-center gap-4">
                        <img className="h-16 w-16 rounded-full bg-gray-200 object-cover" src={avatarUrl} alt="User avatar" />
                        <div className="flex-1">
                            <label htmlFor="avatar-upload" className="cursor-pointer group">
                                <div className="flex items-center gap-2 text-sm font-medium text-accent">
                                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                                    <span>{isUploading ? 'Uploading...' : 'Change Avatar'}</span>
                                </div>
                                <p className="text-xs text-muted">Note: Requires 'avatars' storage bucket.</p>
                            </label>
                            <input type="file" id="avatar-upload" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploading} />
                        </div>
                    </div>
                    <Input label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                    <Input label="Email Address" value={user?.email || ''} readOnly disabled />
                    <div className="flex justify-end">
                        <Btn type="submit" disabled={profileUpdateMutation.isPending} size="sm">
                            {profileUpdateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            Save Profile
                        </Btn>
                    </div>
                </form>
            </div>

            {/* Password Section */}
            <div className="soft-card">
                <div className="p-4 border-b">
                    <h2 className="text-base font-semibold text-gray-800">Change Password</h2>
                </div>
                <form onSubmit={handlePasswordSave} className="p-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
                        <Input label="Confirm New Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
                    </div>
                     {newPassword && newPassword !== confirmPassword && (
                        <div className="flex items-center text-xs text-red-600 gap-1.5">
                            <AlertTriangle className="h-4 w-4" /> Passwords do not match.
                        </div>
                    )}
                    <div className="flex justify-end">
                        <Btn type="submit" variant="outline" size="sm" disabled={passwordUpdateMutation.isPending || !newPassword || newPassword !== confirmPassword}>
                            {passwordUpdateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <KeyRound className="h-4 w-4 mr-2" />}
                            Update Password
                        </Btn>
                    </div>
                </form>
            </div>

            {/* Preferences Section */}
            <div className="soft-card">
                <div className="p-4 border-b">
                    <h2 className="text-base font-semibold text-gray-800">Application Preferences</h2>
                    <p className="text-xs text-gray-500 mt-1">Customize your user experience.</p>
                </div>
                <div className="p-4">
                    <ToggleSwitch 
                        label="Remember Dashboard Layout"
                        description="Save the expanded/collapsed state of dashboard sections."
                        checked={prefs.rememberDashboardLayout}
                        onChange={() => togglePref('rememberDashboardLayout')}
                    />
                    <ToggleSwitch 
                        label="Show Weekly Reminders"
                        description="Display a reminder on the dashboard if it's been over a week."
                        checked={prefs.weeklyReminders}
                        onChange={() => togglePref('weeklyReminders')}
                    />
                    <ToggleSwitch 
                        label="Show Email Center in Nav"
                        description="Include a direct link to the Email Center in the navigation menus."
                        checked={prefs.showEmailCenter}
                        onChange={() => togglePref('showEmailCenter')}
                    />
                </div>
            </div>
        </div>
    );
};

export default ProfilePanel;
