import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { Loader2 } from "lucide-react";
import { cn } from "../lib/utils";

const AuditLog: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [highlightedRow, setHighlightedRow] = useState<string | null>(null);
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
        const { data, error } = await supabase.from("audit_log").select("id, timestamp, action, changed_by, changed_user, details").order("timestamp", { ascending: false });
        if (error) throw error;
        setRows(data || []);
    } catch (error) {
        console.error("Error fetching audit logs:", error);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    const focusId = searchParams.get('focus');
    if (focusId && rows.length > 0) {
        const row = rowRefs.current[focusId];
        if (row) {
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightedRow(focusId);
            setTimeout(() => setHighlightedRow(null), 2500);
        }
        setSearchParams({}, { replace: true });
    }
  }, [rows, searchParams, setSearchParams]);

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-[var(--compact-gap)] pb-nav-safe md:pb-8">
      <div className="soft-card overflow-x-auto">
        {loading ? (
            <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-teal-500" /></div>
        ) : (
            <table className="min-w-full text-sm table-compact">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                <tr>
                    <th className="text-left">Action</th>
                    <th className="text-left">Performed By</th>
                    <th className="text-left">Affected Entity</th>
                    <th className="text-left">Timestamp</th>
                    <th className="text-left">Details</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
                {rows.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-12 px-6 text-gray-500">No audit log entries found.</td></tr>
                ) : rows.map((r) => (
                <tr key={r.id} ref={el => rowRefs.current[r.id] = el} className={cn("hover:bg-emerald-50/40 transition-colors", highlightedRow === r.id && 'bg-teal-50')}>
                    <td className="font-mono text-xs bg-gray-50 rounded-md text-gray-700">{r.action}</td>
                    <td className="text-gray-500">{r.changed_by}</td>
                    <td className="text-gray-500">{r.changed_user || 'N/A'}</td>
                    <td className="text-gray-500">{new Date(r.timestamp).toLocaleString()}</td>
                    <td>
                        <pre className="text-xs text-gray-500 bg-gray-50 p-2 rounded-md max-w-md overflow-x-auto">{JSON.stringify(r.details, null, 2)}</pre>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        )}
      </div>
    </div>
  );
};
export default AuditLog;
