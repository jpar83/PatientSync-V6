import React from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, FileUp, UserPlus, Megaphone, MessageSquare, Calendar, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useReferralModal } from '@/state/useReferralModal';
import { useUploadModal } from '@/state/useUploadModal';
import { useMarketingModal } from '@/state/useMarketingModal';
import { useProviderModal } from '@/state/useProviderModal';
import { useQuickNoteModal } from '@/state/useQuickNoteModal';

export default function QuickActionsFloating() {
  const location = useLocation();
  const openNewReferral = useReferralModal((s) => s.openNew);
  const openUploadModal = useUploadModal((s) => s.openModal);
  const openMarketingModal = useMarketingModal((s) => s.openModal);
  const openProviderModal = useProviderModal((s) => s.openModal);
  const openQuickNoteModal = useQuickNoteModal(s => s.openModal);

  const path = location.pathname.toLowerCase();

  const actions = React.useMemo(() => {
    if (path.includes('/marketing')) {
      return [
        { label: 'Add Lead', icon: <Megaphone className="w-4 h-4 mr-2" />, action: () => openMarketingModal('lead') },
        { label: 'Log Touchpoint', icon: <MessageSquare className="w-4 h-4 mr-2" />, action: () => openMarketingModal('touchpoint') },
        { label: 'Schedule Event', icon: <Calendar className="w-4 h-4 mr-2" />, action: () => openMarketingModal('event') },
      ];
    }
    if (path.includes('/my-accounts')) {
      return [
        { label: 'Add Provider', icon: <Shield className="w-4 h-4 mr-2" />, action: openProviderModal },
      ];
    }
    // Default actions
    return [
      { label: 'Add Referral', icon: <UserPlus className="w-4 h-4 mr-2" />, action: () => openNewReferral('quick') },
      { label: 'Quick Note', icon: <MessageSquare className="w-4 h-4 mr-2" />, action: openQuickNoteModal },
      { label: 'Upload Report', icon: <FileUp className="w-4 h-4 mr-2" />, action: openUploadModal },
    ];
  }, [path, openNewReferral, openUploadModal, openMarketingModal, openProviderModal, openQuickNoteModal]);

  return (
    <div id="tour-fab" className="fixed bottom-[calc(80px+env(safe-area-inset-bottom))] right-4 md:bottom-8 md:right-8 z-40">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg w-14 h-14 flex items-center justify-center dark:ring-2 dark:ring-white/20 transition-transform duration-200 ease-in-out hover:scale-110 active:scale-95" aria-label="Open quick actions menu">
            <Plus className="h-6 w-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-56 rounded-xl shadow-xl p-1 mb-2">
          {actions.map(action => (
            <DropdownMenuItem key={action.label} onClick={action.action}>
              {action.icon} {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
