import React from 'react';
import type { MarketingInService } from '@/lib/types';
import { Calendar, CheckCircle, XCircle, Clock, MoreVertical, User, Users, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

const statusConfig = {
    Planned: { icon: Clock, color: 'text-blue-500' },
    Confirmed: { icon: Calendar, color: 'text-purple-500' },
    Done: { icon: CheckCircle, color: 'text-green-500' },
    Cancelled: { icon: XCircle, color: 'text-red-500' },
};

interface EventCardProps {
    event: MarketingInService;
    onEdit: () => void;
    onDelete: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onEdit, onDelete }) => {
    const config = statusConfig[event.status as keyof typeof statusConfig] || statusConfig.Planned;
    const Icon = config.icon;
    
    const startTime = event.start_at ? new Date(event.start_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'N/A';
    const endTime = event.end_at ? new Date(event.end_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : null;

    return (
        <div className="soft-card p-4 space-y-3">
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text truncate">{event.topic}</p>
                    <p className="text-sm text-muted truncate">{event.marketing_leads?.name || 'Unknown Lead'}</p>
                </div>
                <div className="flex items-center gap-1">
                    <div className={cn("flex items-center gap-2 text-sm font-medium px-2 py-1 rounded-full", config.color)}>
                        <Icon className="h-4 w-4" />
                        <span className="font-semibold">{event.status}</span>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded-full text-muted hover:bg-gray-100 dark:hover:bg-zinc-800"><MoreVertical className="h-4 w-4" /></button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onEdit}>Edit Event</DropdownMenuItem>
                            <DropdownMenuItem onClick={onDelete} className="text-red-600">Delete Event</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            
            <div className="text-sm text-muted space-y-1.5">
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span>{startTime} {endTime && `- ${endTime}`}</span>
                </div>
                {event.location && (
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{event.location}</span>
                    </div>
                )}
                {event.assigned_to && (
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4 flex-shrink-0" />
                        <span>Assigned to: {event.assigned_to}</span>
                    </div>
                )}
                {event.attendees && (
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 flex-shrink-0" />
                        <span>{event.attendees} attendees</span>
                    </div>
                )}
            </div>

            {event.notes && (
                <p className="text-sm text-muted bg-gray-50 dark:bg-zinc-800/50 p-3 rounded-lg border dark:border-zinc-800">
                    {event.notes}
                </p>
            )}
        </div>
    );
};

export default EventCard;
