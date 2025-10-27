import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';
import { Loader2, Plus } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import type { MarketingLead, MarketingTouchpoint, MarketingInService, LeadStatus, MarketingEventType, InServiceStatus } from '@/lib/types';
import LeadCard from '@/components/LeadCard';
import JournalTimeline from '@/components/JournalTimeline';
import EventsView from '@/components/EventsView';
import SimpleConfirmationModal from '@/components/ui/SimpleConfirmationModal';
import { useMarketingModal, MarketingModalMode } from '@/state/useMarketingModal';
import { useConvertLeadModal } from '@/state/useConvertLeadModal';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import MarketingFilterBar from '@/components/marketing/MarketingFilterBar';
import NestedLeadModal from '@/components/NestedLeadModal';

type MarketingView = 'leads' | 'journal' | 'events';

const TabButton: React.FC<{ name: string; isActive: boolean; onClick: () => void }> = ({ name, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={cn(
            'whitespace-nowrap pb-2 px-1 border-b-2 font-medium text-sm focus-ring rounded-t-md',
            isActive ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-text hover:border-gray-300 dark:hover:border-gray-600'
        )}
    >
        {name}
    </button>
);

const Marketing: React.FC = () => {
    const [activeView, setActiveView] = useState<MarketingView>('leads');
    const [itemToDelete, setItemToDelete] = useState<MarketingLead | MarketingTouchpoint | MarketingInService | null>(null);
    const queryClient = useQueryClient();
    const openMarketingModal = useMarketingModal((s) => s.openModal);
    const openConvertModal = useConvertLeadModal((s) => s.openModal);
    
    const [filterBarHeight, setFilterBarHeight] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const tabsRef = useRef<HTMLElement>(null);
    const [tabsHeight, setTabsHeight] = useState(0);

    const [leadFilters, setLeadFilters] = useState({ status: [] as LeadStatus[], type: [] as string[] });
    const [eventFilters, setEventFilters] = useState({ type: [] as MarketingEventType[], status: [] as InServiceStatus[] });

    useEffect(() => {
        const el = tabsRef.current;
        if (el) {
            const observer = new ResizeObserver(() => {
                setTabsHeight(el.offsetHeight);
            });
            observer.observe(el);
            return () => observer.disconnect();
        }
    }, []);

    const { data: leads = [], isLoading: isLoadingLeads } = useQuery<MarketingLead[]>({
        queryKey: ['marketing_leads'],
        queryFn: async () => {
            const { data, error } = await supabase.from('marketing_leads').select('*').is('deleted_at', null);
            if (error) throw new Error(`Failed to fetch leads: ${error.message}`);
            return data || [];
        }
    });

    const { data: touchpoints = [], isLoading: isLoadingTouchpoints } = useQuery<MarketingTouchpoint[]>({
        queryKey: ['marketing_touchpoints'],
        queryFn: async () => {
            const { data, error } = await supabase.from('marketing_touchpoints').select('*, marketing_leads(name)').order('created_at', { ascending: false });
            if (error) throw new Error(`Failed to fetch touchpoints: ${error.message}`);
            return data || [];
        },
        enabled: activeView === 'journal',
    });
    
    const { data: events = [], isLoading: isLoadingEvents } = useQuery<MarketingInService[]>({
        queryKey: ['marketing_in_services'],
        queryFn: async () => {
            const { data, error } = await supabase.from('marketing_in_services').select('*, marketing_leads(name)').order('start_at');
            if (error) throw new Error(`Failed to fetch events: ${error.message}`);
            return data || [];
        },
        enabled: activeView === 'events',
    });

    const filteredLeads = useMemo(() => {
        return leads
            .filter(lead => {
                if (leadFilters.status.length > 0 && !leadFilters.status.includes(lead.lead_status as LeadStatus)) return false;
                if (leadFilters.type.length > 0 && !leadFilters.type.includes(lead.type as string)) return false;
                return true;
            })
            .sort((a, b) => {
                const dateA = a.next_action_at ? new Date(a.next_action_at).getTime() : Infinity;
                const dateB = b.next_action_at ? new Date(b.next_action_at).getTime() : Infinity;
                if (dateA !== dateB) return dateA - dateB;
                const lastContactA = a.last_contacted_at ? new Date(a.last_contacted_at).getTime() : 0;
                const lastContactB = b.last_contacted_at ? new Date(b.last_contacted_at).getTime() : 0;
                return lastContactB - lastContactA;
            });
    }, [leads, leadFilters]);

    const filteredEvents = useMemo(() => {
        if (activeView !== 'events') return [];
        return events.filter(event => {
            if (eventFilters.type.length > 0 && !eventFilters.type.includes(event.event_type as MarketingEventType)) return false;
            if (eventFilters.status.length > 0 && !eventFilters.status.includes(event.status as InServiceStatus)) return false;
            return true;
        });
    }, [events, eventFilters, activeView]);

    const leadStatusOptions = [
        { value: 'Prospect', label: 'Prospect' }, { value: 'Warm', label: 'Warm' },
        { value: 'Active', label: 'Active' }, { value: 'Dormant', label: 'Dormant' }, { value: 'Lost', label: 'Lost' }
    ];

    const leadTypeOptions = useMemo(() => Array.from(new Set(leads.map(l => l.type).filter(Boolean))).map(t => ({ value: t as string, label: t as string })), [leads]);
    const eventStatusOptions = useMemo(() => Array.from(new Set(events.map(e => e.status).filter(Boolean))).map(s => ({ value: s as string, label: s as string })), [events]);

    const getDeleteInfo = () => {
        if (!itemToDelete) return { table: '', id: '', queryKey: '' };
        if ('topic' in itemToDelete) return { table: 'marketing_in_services', id: itemToDelete.id, queryKey: 'marketing_in_services' };
        if ('type' in itemToDelete && 'outcome' in itemToDelete) return { table: 'marketing_touchpoints', id: itemToDelete.id, queryKey: 'marketing_touchpoints' };
        return { table: 'marketing_leads', id: itemToDelete.id, queryKey: 'marketing_leads' };
    };

    const deleteMutation = useMutation({
        mutationFn: async () => {
            const { table, id } = getDeleteInfo();
            if (!table || !id) throw new Error("Item to delete is not valid.");
            if (table === 'marketing_leads') {
                const { error } = await supabase.from(table).update({ deleted_at: new Date().toISOString() }).eq('id', id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from(table).delete().eq('id', id);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            const { queryKey } = getDeleteInfo();
            toast('Item deleted successfully.', 'ok');
            queryClient.invalidateQueries({ queryKey: [queryKey] });
            setItemToDelete(null);
        },
        onError: (error: any) => {
            toast(`Error deleting item: ${error.message}`, 'err');
            setItemToDelete(null);
        }
    });

    const handleEdit = (item: any, mode: MarketingModalMode) => {
        const seedData = { ...item };
        if ((mode === 'event' || mode === 'touchpoint') && item.marketing_leads) {
            seedData.lead_name = item.marketing_leads.name;
        }
        openMarketingModal(mode, seedData, item.id);
    };

    const renderView = () => {
        switch (activeView) {
            case 'leads':
                if (isLoadingLeads) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;
                if (leads.length === 0) return <EmptyState title="No Leads Yet" message="Add your first marketing lead to get started."><Button onClick={() => openMarketingModal('lead')} className="mt-4"><Plus className="h-4 w-4 mr-2" />Add Lead</Button></EmptyState>;
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {filteredLeads.map((lead, index) => 
                            <div key={lead.id} id={index === 0 ? 'tour-marketing-card' : undefined}>
                                <LeadCard 
                                    lead={lead} 
                                    onEdit={() => handleEdit(lead, 'lead')} 
                                    onDelete={() => setItemToDelete(lead)}
                                    onAddTouchpoint={() => openMarketingModal('touchpoint', { lead_id: lead.id, lead_name: lead.name })}
                                    onSchedule={() => openMarketingModal('event', { lead_id: lead.id, lead_name: lead.name, location: lead.full_address, event_type: 'In-Service' })}
                                    onConvert={() => openConvertModal(lead)}
                                />
                            </div>
                        )}
                    </div>
                );
            case 'journal':
                 if (isLoadingTouchpoints) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;
                 if (touchpoints.length === 0) return <EmptyState title="No Journal Entries" message="Log your first touchpoint to see your timeline here."><Button onClick={() => openMarketingModal('touchpoint')} className="mt-4"><Plus className="h-4 w-4 mr-2" />Log Touchpoint</Button></EmptyState>;
                 return <JournalTimeline touchpoints={touchpoints} onEdit={(item) => handleEdit(item, 'touchpoint')} onDelete={setItemToDelete} />;
            case 'events':
                if (isLoadingEvents) return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;
                if (events.length === 0) return <EmptyState title="No Events Scheduled" message="Schedule an event to see your calendar."><Button onClick={() => openMarketingModal('event')} className="mt-4"><Plus className="h-4 w-4 mr-2" />Schedule Event</Button></EmptyState>;
                return <EventsView events={filteredEvents} onEdit={(item) => handleEdit(item, 'event')} onDelete={setItemToDelete} />;
            default:
                return null;
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div ref={scrollContainerRef} className="flex-1 relative overflow-y-auto">
                <div className="sticky top-0 bg-surface/80 dark:bg-zinc-900/80 backdrop-blur-lg z-20">
                    <div className="border-b border-border-color px-4 sm:px-6 lg:px-8">
                        <nav ref={tabsRef} id="tour-marketing-tabs" className="-mb-px flex space-x-4" aria-label="Tabs">
                            <TabButton name="Leads" isActive={activeView === 'leads'} onClick={() => setActiveView('leads')} />
                            <TabButton name="Journal" isActive={activeView === 'journal'} onClick={() => setActiveView('journal')} />
                            <TabButton name="Events" isActive={activeView === 'events'} onClick={() => setActiveView('events')} />
                        </nav>
                    </div>
                </div>
                <MarketingFilterBar
                    activeView={activeView}
                    onHeightChange={setFilterBarHeight}
                    scrollContainerRef={scrollContainerRef}
                    tabsHeight={tabsHeight}
                    leadFilters={leadFilters}
                    onLeadFilterChange={(name, value) => setLeadFilters(f => ({ ...f, [name]: value }))}
                    onClearLeadFilters={() => setLeadFilters({ status: [], type: [] })}
                    leadStatusOptions={leadStatusOptions}
                    leadTypeOptions={leadTypeOptions}
                    eventFilters={eventFilters}
                    onEventFilterChange={(name, value) => setEventFilters(f => ({ ...f, [name]: value }))}
                    onClearEventFilters={() => setEventFilters({ type: [], status: [] })}
                    eventStatusOptions={eventStatusOptions}
                    onScheduleEvent={() => openMarketingModal('event')}
                />
                <div style={{ paddingTop: `${filterBarHeight}px` }} className="px-4 sm:px-6 lg:px-8 py-6 pb-nav-safe">
                    {renderView()}
                </div>
            </div>
            <NestedLeadModal />
            <SimpleConfirmationModal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={() => deleteMutation.mutate()}
                isLoading={deleteMutation.isPending}
                title="Confirm Deletion"
                message="Are you sure you want to permanently delete this item? This action cannot be undone."
                confirmButtonText="Yes, Delete"
                confirmButtonVariant="danger"
            />
        </div>
    );
};

export default Marketing;
