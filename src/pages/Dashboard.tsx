import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Package, FileCheck, ShieldX, GitMerge, Clock, ListTodo, AlertOctagon, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import EmptyState from '@/components/ui/EmptyState';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import WorkflowPipelineChart from '@/components/dashboard/WorkflowPipelineChart';
import DashboardKpiCard from '@/components/dashboard/DashboardKpiCard';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import DashboardSection from '@/components/dashboard/DashboardSection';
import DateRangePicker from '@/components/dashboard/DateRangePicker';
import ChangeStrip from '@/components/dashboard/ChangeStrip';
import StoplightAnalytics from '@/components/dashboard/StoplightAnalytics';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import type { AuditLogEntry } from '@/lib/types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [dateRange, setDateRange] = useState(() => {
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    const to = toParam ? new Date(toParam) : new Date();
    const from = fromParam ? new Date(fromParam) : new Date(new Date().setDate(to.getDate() - 6));
    return { from, to };
  });

  const { metrics, isLoading, isFetching, error } = useDashboardMetrics(dateRange);

  const { data: activityFeed = [], isLoading: isLoadingActivity } = useQuery<AuditLogEntry[]>({
    queryKey: ['dashboardActivityFeed'],
    queryFn: async () => {
        const { data, error } = await supabase
            .from('audit_log')
            .select('*')
            .in('action', ['stage_change', 'note_added', 'regression'])
            .order('timestamp', { ascending: false })
            .limit(10);
        if (error) throw error;
        return data;
    },
    staleTime: 60 * 1000, // 1 minute
  });

  const handleDateRangeChange = (newRange: { from: Date, to: Date }) => {
    setDateRange(newRange);
    setSearchParams({
      from: newRange.from.toISOString().split('T')[0],
      to: newRange.to.toISOString().split('T')[0],
    });
  };

  const kpiCards = metrics ? [
    { title: "New Referrals", value: metrics.kpis.newReferrals.value.toString(), icon: Package, delta: metrics.kpis.newReferrals.delta, onClick: () => navigate('/referrals') },
    { title: "Ready for PAR", value: metrics.kpis.readyForPar.value.toString(), icon: FileCheck, delta: metrics.kpis.readyForPar.delta, onClick: () => navigate('/referrals') },
    { title: "Denials", value: metrics.kpis.denials.value.toString(), icon: ShieldX, delta: metrics.kpis.denials.delta, onClick: () => navigate('/referrals?stoplight_status=red') },
    { title: "Regressions", value: metrics.kpis.regressions.value.toString(), icon: GitMerge, delta: metrics.kpis.regressions.delta, onClick: () => navigate('/referrals') },
    { title: "Docs Complete", value: `${metrics.kpis.docsCompletePercent.value.toFixed(0)}%`, icon: FileCheck, delta: metrics.kpis.docsCompletePercent.delta, deltaType: 'percent' as const, onClick: () => navigate('/referrals') },
    { title: "Avg. Referral Age", value: `${metrics.kpis.avgAge.value.toFixed(1)}d`, icon: Clock, delta: metrics.kpis.avgAge.delta },
  ] : [];

  return (
    <div className="h-full overflow-y-auto">
      <header className="border-b border-border-color px-4 sm:px-6 lg:px-8 py-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-xl font-bold text-text">Dashboard</h1>
            <DateRangePicker value={dateRange} onChange={handleDateRangeChange} />
        </div>
        <ChangeStrip />
        <div id="tour-step-1-kpis" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="soft-card p-3 h-24 animate-pulse bg-gray-100 dark:bg-zinc-800" />
            ))
          ) : (
            kpiCards.map((kpi) => (
                <DashboardKpiCard key={kpi.title} {...kpi} />
            ))
          )}
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-4 pb-nav-safe">
        {isLoading ? (
          <div className="flex justify-center items-center h-96"><Loader2 className="h-10 w-10 animate-spin text-accent" /></div>
        ) : error ? (
            <EmptyState title="Error Loading Dashboard" message={error.message} />
        ) : !metrics || !metrics.orders ? (
          <EmptyState title="No Data" message="Could not load dashboard data for the selected period." />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <DashboardSection id="workflow-pipeline" title="Workflow Pipeline" icon={Package}>
                <WorkflowPipelineChart orders={metrics.orders} />
              </DashboardSection>
              <DashboardSection id="my-queue" title="My Queue" icon={ListTodo}>
                <EmptyState title="Coming Soon" message="Your actionable queue of tasks will appear here." />
              </DashboardSection>
            </div>
            <div className="lg:col-span-1 space-y-4">
              <DashboardSection id="stoplight-status" title="Stoplight Status" icon={AlertOctagon}>
                <StoplightAnalytics counts={metrics.stoplightCounts} />
              </DashboardSection>
              <DashboardSection id="recent-activity" title="Recent Activity" icon={Activity}>
                <ActivityFeed feed={activityFeed} isLoading={isLoadingActivity} />
              </DashboardSection>
               <DashboardSection id="top-issues" title="Top Issues" icon={AlertOctagon}>
                <EmptyState title="Coming Soon" message="Actionable insights on top issues will appear here." />
              </DashboardSection>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
