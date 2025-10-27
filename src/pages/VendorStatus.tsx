import React, { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import { CheckCircle, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";
import { mockVendorLogs } from '../lib/mockData';
import EmptyState from "@/components/ui/EmptyState";

type Status = 'all' | 'sent' | 'pending' | 'failed';

const STATUS_CONFIG: Record<string, { icon: React.ElementType, color: string, bg: string }> = {
  sent: { icon: CheckCircle, color: "text-green-700 dark:text-green-300", bg: "bg-green-50 dark:bg-green-900/20" },
  pending: { icon: Clock, color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-900/20" },
  failed: { icon: AlertTriangle, color: "text-red-700 dark:text-red-300", bg: "bg-red-50 dark:bg-red-900/20" },
};

const VendorLogItem: React.FC<{ log: any }> = ({ log }) => {
    const config = STATUS_CONFIG[log.status] || STATUS_CONFIG.pending;
    const Icon = config.icon;
    return (
        <li className="soft-card p-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div>
                    <p className="font-semibold text-text">{log.patient_name}</p>
                    <p className="text-sm text-muted">to <span className="font-medium text-text">{log.vendor_name}</span></p>
                </div>
                <div className={cn("flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg", config.color, config.bg)}>
                    <Icon className="h-4 w-4" />
                    <span>{log.status.charAt(0).toUpperCase() + log.status.slice(1)}</span>
                </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border-color/50 text-xs text-muted flex justify-between">
                <span>Sent by: {log.sent_by}</span>
                <time dateTime={log.sent_at}>{new Date(log.sent_at).toLocaleString()}</time>
            </div>
        </li>
    );
};

const VendorStatus: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<Status>('all');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
        const { data, error } = await supabase.from("vendor_log").select("*").order("sent_at", { ascending: false });
        if (error) throw error;
        
        if (import.meta.env.DEV && (!data || data.length === 0)) {
            console.log("Using mock data for vendor status page.");
            setLogs(mockVendorLogs);
        } else {
            setLogs(data || []);
        }
    } catch (error) {
        console.error("Error fetching vendor logs:", error);
        setLogs([]);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = useMemo(() => {
      if (statusFilter === 'all') return logs;
      return logs.filter(log => log.status === statusFilter);
  }, [logs, statusFilter]);

  return (
    <div className="h-full overflow-y-auto space-y-4 p-4 md:p-6 pb-nav-safe md:pb-8">
        <div className="soft-card p-3 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-muted mr-2">Filter by status:</span>
            {(['all', 'sent', 'pending', 'failed'] as Status[]).map(status => (
                <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                        statusFilter === status
                            ? "bg-teal-600 text-white shadow"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700"
                    )}
                >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
            ))}
        </div>

        {loading ? (
            <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-teal-500" /></div>
        ) : filteredLogs.length === 0 ? (
            <EmptyState 
                title="No Logs Found"
                message={statusFilter === 'all' ? "No vendor email logs have been recorded yet." : `No logs match the status "${statusFilter}".`}
            />
        ) : (
            <ul className="space-y-3">
                {filteredLogs.map(log => <VendorLogItem key={log.id} log={log} />)}
            </ul>
        )}
    </div>
  );
};

export default VendorStatus;
