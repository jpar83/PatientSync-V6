import React from 'react';
import type { MarketingInService } from '@/lib/types';
import { Calendar, CheckCircle, XCircle, Clock, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

const statusConfig = {
    Scheduled: { icon: Clock, color: 'text-blue-500' },
    Completed: { icon: CheckCircle, color: 'text-green-500' },
    Proposed: { icon: Calendar, color: 'text-purple-500' },
    Canceled: { icon: XCircle, color: 'text-red-500' },
};

interface InServiceCardProps {
    event: MarketingInService;
    onEdit: () => void;
    onDelete: () => void;
}

const InServiceCard: React.FC<InServiceCardProps> = ({ event, onEdit, onDelete }) => {
    const config = statusConfig[event.status as keyof typeof statusConfig] || statusConfig.Proposed;
    const Icon = config.icon;
    const time = new Date(event.date_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    return (
        <div className="soft-card p-4">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="font-semibold text-text">{event.topic}</p>
                    <p className="text-sm text-muted">{event.location}</p>
                </div>
                <div className="flex items-center gap-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Icon className={cn("h-4 w-4", config.color)} />
                        <span className={cn("font-semibold", config.color)}>{event.status}</span>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded-full text-muted hover:bg-gray-100 dark:hover:bg-zinc-800"><MoreVertical className="h-4 w-4" /></button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onEdit}>Edit In-service</DropdownMenuItem>
                            <DropdownMenuItem onClick={onDelete} className="text-red-600">Delete In-service</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            <div className="text-sm text-muted mt-2 pt-2 border-t border-border-color/50">
                {time}
            </div>
        </div>
    );
};

export default InServiceCard;
