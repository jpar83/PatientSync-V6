import React from 'react';
import { Archive, FileWarning, ShieldX, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDailyActivity } from '@/hooks/useDailyActivity';

const ChangeStrip: React.FC = () => {
    const navigate = useNavigate();
    const { data, isLoading } = useDailyActivity();

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-xs text-muted">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Loading daily changes...</span>
            </div>
        );
    }

    const changes = [
        { label: 'New Denials', value: data?.new_denials || 0, icon: ShieldX, filter: '?stoplight_status=red' },
        { label: 'Docs Completed', value: data?.docs_completed || 0, icon: FileWarning, filter: '' },
        { label: 'Newly Archived', value: data?.newly_archived || 0, icon: Archive, filter: '?archive_status=archived' },
    ];

    const visibleChanges = changes.filter(c => c.value > 0);

    if (visibleChanges.length === 0) {
        return <div className="text-xs text-muted">No significant changes since yesterday.</div>;
    }

    return (
        <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-medium text-muted">Since yesterday:</span>
            {visibleChanges.map(change => (
                <button 
                    key={change.label} 
                    onClick={() => change.filter && navigate(`/referrals${change.filter}`)}
                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={!change.filter}
                    title={change.filter ? `View ${change.label}` : 'No filter available'}
                >
                    <span className="font-semibold text-text">{change.value}</span>
                    <change.icon className="h-3 w-3 text-muted" />
                    <span className="text-muted">{change.label}</span>
                </button>
            ))}
        </div>
    );
};

export default ChangeStrip;
