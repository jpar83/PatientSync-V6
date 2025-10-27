import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { AUTHORIZED_ADMINS } from '@/lib/constants';
import { LayoutDashboard, Files, BarChart3, Settings, History, Briefcase, Archive, Megaphone, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

type Props = { open: boolean; onClose: () => void };

const NavItem: React.FC<{ item: any; onClose: () => void }> = ({ item, onClose }) => (
    <NavLink
      to={item.href}
      onClick={onClose}
      end={item.href === '/'}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 px-2 py-2 text-base font-semibold rounded-lg',
          isActive ? 'bg-teal-50 text-teal-700' : 'text-gray-700 hover:bg-gray-50'
        )
      }
    >
      {({ isActive }) => (
        <>
          <item.icon
            className={cn(
              'h-5 w-5',
              isActive ? 'text-teal-500' : 'text-gray-400 group-hover:text-gray-500'
            )}
            aria-hidden="true"
          />
          {item.name}
        </>
      )}
    </NavLink>
);

const MobileNav: React.FC<Props> = ({ open, onClose }) => {
  const { user } = useAuth();
  const isAuthorizedAdmin = useMemo(() => AUTHORIZED_ADMINS.includes(user?.email || ''), [user]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/30"
            aria-hidden="true"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '0%' }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg p-4 flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-bold text-teal-600">Patient Sync</span>
              <button onClick={onClose} className="p-2 rounded hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <nav className="flex-1 overflow-y-auto space-y-3">
              {NAV_STRUCTURE.map((group) => {
                if (group.adminOnly && !isAuthorizedAdmin) return null;
                
                const visibleItems = group.items;

                if (visibleItems.length === 0) return null;

                return (
                  <div key={group.name}>
                    {group.name !== 'Primary' && (
                      <h3 className="px-2 text-xs font-semibold uppercase text-gray-500 tracking-wider mb-1">
                        {group.name}
                      </h3>
                    )}
                    <div className="space-y-1">
                      {visibleItems.map((item) => <NavItem key={item.name} item={item} onClose={onClose} />)}
                    </div>
                  </div>
                );
              })}
            </nav>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
export default MobileNav;
