import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useMemo } from 'react';
import type { Order } from '@/lib/types';
import { daysOld } from '@/lib/utils';
import { isBackward } from '../lib/utils';

interface DateRange {
  from: Date;
  to: Date;
}

const calculateMetricsForPeriod = (orders: Order[], from: Date, to: Date) => {
    const periodOrders = orders.filter(o => {
        const createdAt = new Date(o.created_at);
        return createdAt >= from && createdAt <= to;
    });

    const newReferrals = periodOrders.length;
    
    const readyForPar = periodOrders.filter(o => {
        const required = o.patients?.required_documents || [];
        return required.length > 0 && required.every(d => o.document_status?.[d] === 'Complete');
    }).length;

    const denials = new Set(periodOrders.flatMap(o => o.denials?.map(d => d.order_id) || [])).size;
    
    const regressions = periodOrders.filter(o => 
        o.workflow_history?.some(h => isBackward(h.previous_stage, h.new_stage))
    ).length;

    const totalDocs = periodOrders.reduce((sum, o) => sum + (o.patients?.required_documents?.length || 0), 0);
    const completedDocs = periodOrders.reduce((sum, o) => {
        const required = o.patients?.required_documents || [];
        return sum + required.filter(d => o.document_status?.[d] === 'Complete').length;
    }, 0);
    const docsCompletePercent = totalDocs > 0 ? (completedDocs / totalDocs) * 100 : 0;

    const avgAge = periodOrders.length > 0
        ? periodOrders.reduce((sum, o) => sum + daysOld(o.created_at), 0) / periodOrders.length
        : 0;

    return { newReferrals, readyForPar, denials, regressions, docsCompletePercent, avgAge };
};

export const useDashboardMetrics = (dateRange: DateRange) => {
  const { from, to } = dateRange;
  const periodDuration = (to.getTime() - from.getTime());
  const prevFrom = new Date(from.getTime() - periodDuration);
  const prevTo = new Date(from.getTime() - 1);

  // Fetch data for both current and previous periods to calculate deltas
  const queryRange = {
    from: prevFrom,
    to: to,
  };

  const { data: allOrders, isLoading, isFetching, error } = useQuery<Order[]>({
    queryKey: ['dashboardOrders', queryRange.from, queryRange.to],
    queryFn: async () => {
        const { data, error } = await supabase
            .from('orders')
            .select('*, patients!inner(*), denials(order_id), workflow_history(previous_stage, new_stage)')
            .gte('created_at', queryRange.from.toISOString())
            .lte('created_at', queryRange.to.toISOString())
            .or('is_archived.is.null,is_archived.eq.false');
        if (error) throw error;
        return data as Order[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const metrics = useMemo(() => {
    if (!allOrders) return null;

    const currentMetrics = calculateMetricsForPeriod(allOrders, from, to);
    const prevMetrics = calculateMetricsForPeriod(allOrders, prevFrom, prevTo);

    const calculateDelta = (current: number, prev: number) => {
        if (prev === 0) return current > 0 ? 100 : 0;
        return ((current - prev) / prev) * 100;
    };

    const currentPeriodOrders = allOrders.filter(o => {
        const createdAt = new Date(o.created_at);
        return createdAt >= from && createdAt <= to;
    });

    const kpis = {
      newReferrals: { value: currentMetrics.newReferrals, delta: calculateDelta(currentMetrics.newReferrals, prevMetrics.newReferrals) },
      readyForPar: { value: currentMetrics.readyForPar, delta: calculateDelta(currentMetrics.readyForPar, prevMetrics.readyForPar) },
      denials: { value: currentMetrics.denials, delta: calculateDelta(currentMetrics.denials, prevMetrics.denials) },
      regressions: { value: currentMetrics.regressions, delta: calculateDelta(currentMetrics.regressions, prevMetrics.regressions) },
      docsCompletePercent: { value: currentMetrics.docsCompletePercent, delta: currentMetrics.docsCompletePercent - prevMetrics.docsCompletePercent },
      avgAge: { value: currentMetrics.avgAge, delta: currentMetrics.avgAge - prevMetrics.avgAge },
    };

    const stoplightCounts = currentPeriodOrders.reduce((acc, order) => {
        const status = order.stoplight_status || 'green';
        acc[status]++;
        return acc;
    }, { green: 0, yellow: 0, red: 0 });

    return { kpis, stoplightCounts, orders: currentPeriodOrders };
  }, [allOrders, from, to, prevFrom, prevTo]);

  return {
    metrics,
    isLoading,
    isFetching,
    error,
  };
};
