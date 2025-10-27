import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { RotateCcw, Loader2 } from "lucide-react";
import { Btn } from "../components/ui/Btn";
import { writeAuditLog } from "../lib/auditLogger";
import type { Order } from "../lib/types";

const Archived: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchArchived = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*, patients(name, primary_insurance)")
        .eq("is_archived", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders((data as Order[]) || []);
    } catch (error) {
      console.error("Error fetching archived orders:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArchived();
  }, [fetchArchived]);

  const restoreOrder = async (order: Order) => {
    const { error } = await supabase
      .from("orders")
      .update({ is_archived: false })
      .eq("id", order.id);
    
    if (!error) {
      await writeAuditLog('order_restored', { changed_user: order.patients?.name || order.patient_name });
      fetchArchived();
    } else {
      console.error("Failed to restore order:", error);
    }
  };

  return (
    <div className="h-full overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-[var(--compact-gap)] pb-nav-safe">
      <div className="soft-card overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-teal-500" /></div>
        ) : (
          <table className="min-w-full w-full text-sm table-compact">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
              <tr>
                <th className="text-left">Patient</th>
                <th className="text-left">Insurance</th>
                <th className="text-left">Last Active Stage</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-12 px-6 text-gray-500">There are no archived orders.</td></tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="font-medium text-gray-900">{o.patients?.name || o.patient_name}</td>
                    <td className="text-gray-500">{o.patients?.primary_insurance || 'N/A'}</td>
                    <td className="text-gray-500">{o.workflow_stage}</td>
                    <td className="text-center">
                      <Btn
                        variant="outline"
                        size="sm"
                        onClick={() => restoreOrder(o)}
                        title="Restore this order to the active list"
                      >
                        <RotateCcw className="h-3 w-3 mr-1.5" />
                        Restore
                      </Btn>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Archived;
