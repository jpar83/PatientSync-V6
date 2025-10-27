import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Files, BarChart3, Settings, History, Briefcase, Archive, Megaphone, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { AUTHORIZED_ADMINS } from '@/lib/constants';

const NAV_STRUCTURE = [
    {
        name: 'Primary',
        items: [
            { name: 'Dashboard', href: '/', icon: LayoutDashboard },
            { name: 'Referrals', href: '/referrals', icon: Files },
            { name: 'Patients', href: '/patients', icon: Users },
            { name: 'Marketing', href: '/marketing', icon: Megaphone },
            { name: 'Payers', href: '/my-accounts', icon: Briefcase },
        ]
    },
    {
        name: 'Insights',
        items: [
            { name: 'Trends', href: '/trends', icon: BarChart3 },
        ]
    },
    {
        name: 'More',
        items: [
             { name: 'Archived', href: '/archived', icon: Archive },
        ]
    },
    {
        name: 'Administration',
        adminOnly: true,
        items: [
            { name: 'Settings', href: '/settings', icon: Settings },
            { name: 'Audit Log', href: '/audit-log', icon: History },
        ]
    }
];

const NavItem: React.FC<{ item: any }> = ({ item }) => (
    <NavLink
      to={item.href}
      end={item.href === '/'}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 px-2 py-2 text-base rounded-lg focus-ring',
          isActive ? 'bg-teal-50 text-teal-700 font-semibold dark:bg-teal-900/50 dark:text-teal-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium'
        )
      }
    >
      {({ isActive }) => (
        <>
          <item.icon
            className={cn(
              'h-5 w-5',
              isActive ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
            )}
          />
          {item.name}
        </>
      )}
    </NavLink>
);

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const isAuthorizedAdmin = useMemo(() => AUTHORIZED_ADMINS.includes(user?.email || ''), [user]);

  return (
    <div className="hidden md:flex md:w-48 md:fixed md:inset-y-0">
      <div className="flex min-h-0 flex-1 flex-col bg-surface border-r border-border-color">
        <div className="flex h-12 items-center px-4">
          <span className="text-lg font-bold text-accent">Patient Sync</span>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          <nav id="tour-step-5-nav" className="space-y-3">
            {NAV_STRUCTURE.map((group) => {
              if (group.adminOnly && !isAuthorizedAdmin) return null;
              
              const visibleItems = group.items;

              if (visibleItems.length === 0) return null;

              return (
                <div key={group.name}>
                  {group.name !== 'Primary' && (
                    <h3 className="px-2 text-xs font-semibold uppercase text-muted tracking-wider mb-1">
                      {group.name}
                    </h3>
                  )}
                  <div className="space-y-0.5">
                    {visibleItems.map((item) => <NavItem key={item.name} item={item} />)}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
