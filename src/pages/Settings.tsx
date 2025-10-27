import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { AUTHORIZED_ADMINS } from '../lib/constants';
import ProfilePanel from '../components/settings/ProfilePanel';
import DoctorsPanel from '../components/settings/DoctorsPanel';
import VendorsPanel from '../components/settings/VendorsPanel';
import AdminPanel from '../components/settings/AdminPanel';
import InsurancePanel from '../components/settings/InsurancePanel';

type SettingsTab = 'profile' | 'doctors' | 'vendors' | 'insurance' | 'admin';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const isAdmin = useMemo(() => AUTHORIZED_ADMINS.includes(user?.email || ''), [user]);

  return (
    <div className="h-full overflow-y-auto space-y-[var(--compact-gap)] pb-nav-safe px-4 sm:px-6 lg:px-8 py-6">
      
      <div className="border-b border-gray-200 dark:border-zinc-800">
        <nav id="tour-settings-tabs" className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
          <TabButton name="Profile" isActive={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
          <TabButton name="Manage Doctors" isActive={activeTab === 'doctors'} onClick={() => setActiveTab('doctors')} />
          <TabButton name="Manage Vendors" isActive={activeTab === 'vendors'} onClick={() => setActiveTab('vendors')} />
          <TabButton name="Manage Insurance" isActive={activeTab === 'insurance'} onClick={() => setActiveTab('insurance')} />
          {isAdmin && <TabButton name="Admin Tools" isActive={activeTab === 'admin'} onClick={() => setActiveTab('admin')} />}
        </nav>
      </div>

      <div id="tour-settings-panel" className="pt-4">
        {activeTab === 'profile' && <ProfilePanel />}
        {activeTab === 'doctors' && <DoctorsPanel />}
        {activeTab === 'vendors' && <VendorsPanel />}
        {activeTab === 'insurance' && <InsurancePanel />}
        {activeTab === 'admin' && isAdmin && <AdminPanel />}
      </div>
    </div>
  );
};

const TabButton: React.FC<{ name: string; isActive: boolean; onClick: () => void }> = ({ name, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={cn(
            'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm focus-ring rounded-t-md',
            isActive ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-text hover:bg-gray-100 dark:hover:bg-[#2B2B2B]'
        )}
    >
        {name}
    </button>
);

export default Settings;
