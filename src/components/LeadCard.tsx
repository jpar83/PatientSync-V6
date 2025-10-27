import React from 'react';
import type { MarketingLead } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Building, Hospital, Stethoscope, Handshake, MoreVertical, MessageSquare, Calendar, Zap, MapPin, CheckCircle, Phone } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Button } from './ui/button';

const typeConfig = {
    Clinic: { icon: Stethoscope },
    Hospital: { icon: Hospital },
    SNF: { icon: Building },
    PCP: { icon: Stethoscope },
    DME: { icon: Handshake },
    Other: { icon: Building },
};

const statusConfig = {
    Prospect: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    Warm: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    Active: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    Dormant: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    Lost: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
};

interface LeadCardProps {
  lead: MarketingLead;
  onEdit: () => void;
  onDelete: () => void;
  onAddTouchpoint: () => void;
  onSchedule: () => void;
  onConvert: () => void;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, onEdit, onDelete, onAddTouchpoint, onSchedule, onConvert }) => {
    const TypeIcon = (typeConfig[lead.type as keyof typeof typeConfig] || { icon: Building }).icon;
    const statusColor = statusConfig[lead.lead_status as keyof typeof statusConfig] || statusConfig.Prospect;

    const nextActionDate = lead.next_action_at ? new Date(lead.next_action_at) : null;
    const isOverdue = nextActionDate && nextActionDate < new Date();

    return (
        <div className="soft-card flex flex-col h-full lift elevate p-3 space-y-2.5">
            <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <TypeIcon className="h-4 w-4 text-muted flex-shrink-0" />
                        <h3 className="font-semibold text-text truncate">{lead.name}</h3>
                    </div>
                    <p className="text-xs text-muted truncate">{lead.city}, {lead.state} • {lead.type}</p>
                    {lead.full_address && (
                        <a href={`https://maps.google.com/?q=${encodeURIComponent(lead.full_address)}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{lead.full_address}</span>
                        </a>
                    )}
                    {lead.phone && (
                        <div className="flex items-center gap-1 text-xs text-muted mt-1">
                            <Phone className="h-3 w-3" />
                            <span>{lead.phone}{lead.phone_extension ? ` x${lead.phone_extension}` : ''}</span>
                        </div>
                    )}
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="p-1 -mr-1 rounded-full text-muted hover:bg-gray-100 dark:hover:bg-zinc-800"><MoreVertical className="h-4 w-4" /></button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={onEdit}>Edit Lead</DropdownMenuItem>
                        <DropdownMenuItem onClick={onDelete} className="text-red-600">Delete Lead</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            
            <div className="flex items-center justify-between gap-2 text-xs">
                <span className={cn("px-2 py-0.5 rounded-full font-semibold", statusColor)}>
                    {lead.lead_status || 'Prospect'}
                </span>
                {nextActionDate && (
                    <div className={cn("flex items-center gap-1 font-medium", isOverdue ? 'text-red-500' : 'text-muted')}>
                        <Zap className="h-3 w-3" />
                        <span>{nextActionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-1.5 pt-2 border-t border-border-color/50">
                <Button variant="ghost" size="sm" className="flex-1 text-xs h-9 min-w-[44px]" onClick={onAddTouchpoint}>
                    <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Log
                </Button>
                <Button variant="ghost" size="sm" className="flex-1 text-xs h-9 min-w-[44px]" onClick={onSchedule}>
                    <Calendar className="h-3.5 w-3.5 mr-1.5" /> Schedule
                </Button>
                {lead.converted_to ? (
                    <div className="flex-1 text-xs h-9 min-w-[44px] flex items-center justify-center font-semibold text-green-600">
                        <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Converted
                    </div>
                ) : (
                    <Button variant="ghost" size="sm" className="flex-1 text-xs text-accent h-9 min-w-[44px]" onClick={onConvert}>
                        Convert
                    </Button>
                )}
            </div>
        </div>
    );
};

export default LeadCard;
