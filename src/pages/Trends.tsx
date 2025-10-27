import React, { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Loader2, TrendingUp, Calendar, CheckCircle2 } from "lucide-react";
import { getWeek } from "../lib/utils";
import type { Order } from "../lib/types";
import { mockOrders } from '../lib/mockData';

const TrendKpiCard: React.FC<{ title: string; value: string; icon: React.ElementType }> = ({ title, value, icon: Icon }) => (
    <div className="kpi-tile bg-white dark:bg-zinc-900">
        <div className="flex items-center gap-3">
            <div className="bg-teal-100 dark:bg-teal-900/50 p-2 rounded-lg">
                <Icon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
                <p className="text-xs text-muted">{title}</p>
                <p className="text-base font-semibold text-text">{value}</p>
            </div>
        </div>
    </div>
);

export default function Trends() {
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrendData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("orders").select("created_at, is_archived, document_status, patients(required_documents)");
      if (error) throw error;
      
      let sourceData = data as Order[];
      if (import.meta.env.DEV && (!sourceData || sourceData.length === 0)) {
          console.log("Using mock data for trends page.");
          sourceData = mockOrders as Order[];
      }

      const map: Record<string, { week: string; "New Referrals": number; "Docs Ready": number; "Archived": number }> = {};
      
      sourceData.forEach((o) => {
        const week = getWeek(new Date(o.created_at));
        if (!map[week]) {
          map[week] = { week, "New Referrals": 0, "Docs Ready": 0, "Archived": 0 };
        }
        map[week]["New Referrals"]++;

        const requiredDocs = o.patients?.required_documents || [];
        const isReady = requiredDocs.length > 0 && requiredDocs.every(doc => o.document_status?.[doc] === 'Complete');
        
        if (isReady) {
          map[week]["Docs Ready"]++;
        }
        if (o.is_archived) {
          map[week]["Archived"]++;
        }
      });
      
      const sortedData = Object.values(map).sort((a, b) => a.week.localeCompare(b.week));
      setTrendData(sortedData);

    } catch (err) {
      console.error("Error fetching trend data:", err);
      setTrendData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrendData();
  }, [fetchTrendData]);

  const kpiMetrics = useMemo(() => {
    if (trendData.length === 0) return { total: 0, busiestWeek: 'N/A', readyRate: 0 };
    const total = trendData.reduce((sum, item) => sum + item['New Referrals'], 0);
    const busiestWeekItem = trendData.reduce((max, item) => item['New Referrals'] > max['New Referrals'] ? item : max, trendData[0]);
    const totalReady = trendData.reduce((sum, item) => sum + item['Docs Ready'], 0);
    const readyRate = total > 0 ? Math.round((totalReady / total) * 100) : 0;
    return {
        total,
        busiestWeek: `${busiestWeekItem.week} (${busiestWeekItem['New Referrals']} referrals)`,
        readyRate,
    }
  }, [trendData]);

  return (
    <div className="h-full overflow-y-auto space-y-4 px-4 sm:px-6 lg:px-8 py-6 pb-nav-safe">
      <div className="kpi-grid">
        <TrendKpiCard title="Total Referrals (Period)" value={kpiMetrics.total.toString()} icon={TrendingUp} />
        <TrendKpiCard title="Busiest Week" value={kpiMetrics.busiestWeek} icon={Calendar} />
        <TrendKpiCard title="Avg. 'Docs Ready' Rate" value={`${kpiMetrics.readyRate}%`} icon={CheckCircle2} />
      </div>
      <div className="soft-card p-3 md:p-4">
        <div className="table-wrap sticky-header">
            {loading ? (
                <div className="flex justify-center items-center h-80">
                    <Loader2 className="h-10 w-10 animate-spin text-teal-500" />
                </div>
            ) : trendData.length < 2 ? (
                <div className="flex justify-center items-center h-80">
                    <p className="text-gray-500 text-sm">Not enough data to display trends. Check back after more activity.</p>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="week" stroke="var(--color-muted)" fontSize={12} />
                    <YAxis stroke="var(--color-muted)" fontSize={12} allowDecimals={false} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'var(--color-surface)',
                            borderColor: 'var(--color-border)',
                            borderRadius: '0.5rem',
                            fontSize: '12px',
                        }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="New Referrals" stroke="#4f46e5" strokeWidth={2} name="New Referrals" />
                    <Line type="monotone" dataKey="Docs Ready" stroke="#16a34a" strokeWidth={2} name="Docs Ready" />
                    <Line type="monotone" dataKey="Archived" stroke="#f59e0b" strokeWidth={2} name="Archived" />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </div>
      </div>
    </div>
  );
}
