import React from 'react';
import type { MarketingTouchpoint } from '@/lib/types';
import { Phone, Mail, Building, Handshake, Users, Mic, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

const channelConfig = {
    'In-person': { icon: Building, color: 'text-blue-500' },
    'Call': { icon: Phone, color: 'text-green-500' },
    'Email': { icon: Mail, color: 'text-red-500' },
    'Drop-off': { icon: Handshake, color: 'text-purple-500' },
    'Event': { icon: Users, color: 'text-indigo-500' },
    'Other': { icon: Mic, color: 'text-gray-500' },
};

interface JournalCardProps {
    touchpoint: MarketingTouchpoint;
    onEdit: () => void;
    onDelete: () => void;
}

const JournalCard: React.FC<JournalCardProps> = ({ touchpoint, onEdit, onDelete }) => {
    const config = channelConfig[touchpoint.channel as keyof typeof channelConfig] || channelConfig.Other;
    const Icon = config.icon;

    return (
        <div className="soft-card p-4 space-y-3">
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2">
                        <Icon className={cn("h-4 w-4", config.color)} />
                        <span className="font-semibold text-sm text-text">{touchpoint.purpose}</span>
                    </div>
                    <p className="text-xs text-muted mt-1">
                        with <span className="font-medium text-text">{touchpoint.marketing_leads?.name || 'Unknown Lead'}</span>
                    </p>
                </div>
                 <div className="flex items-center gap-1">
                    <span className="text-xs text-muted flex-shrink-0">
                        {new Date(touchpoint.created_at).toLocaleDateString()}
                    </span>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded-full text-muted hover:bg-gray-100 dark:hover:bg-zinc-800"><MoreVertical className="h-4 w-4" /></button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onEdit}>Edit Entry</DropdownMenuItem>
                            <DropdownMenuItem onClick={onDelete} className="text-red-600">Delete Entry</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            {touchpoint.notes && (
                <p className="text-sm text-muted bg-gray-50 dark:bg-zinc-800/50 p-3 rounded-lg border dark:border-zinc-800">
                    {touchpoint.notes}
                </p>
            )}
            <div className="flex justify-between items-center text-xs pt-2 border-t border-border-color/50">
                <span className="font-medium text-muted">Outcome: <span className="font-semibold text-text">{touchpoint.outcome}</span></span>
                {touchpoint.next_step && <span className="text-muted">Next: {touchpoint.next_step}</span>}
            </div>
        </div>
    );
};

export default JournalCard;
