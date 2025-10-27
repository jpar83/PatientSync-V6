import React, { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import MetricsBar from "../components/MetricsBar";
import { Loader2 } from "lucide-react";
import type { Order } from "../lib/types";

const DOC_KEYS = ["f2f", "pt_eval", "swo", "dpd"] as const;

const MyAccountsMobile: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [archivedCount, setArchivedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes, archivedRes] = await Promise.all([
        supabase
          .from("orders")
          .select("*, patients(name, primary_insurance), vendors(name)")
          .eq("is_archived", false),
        supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('is_archived', true)
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (archivedRes.error) throw archivedRes.error;

      setOrders((ordersRes.data as Order[]) || []);
      setArchivedCount(archivedRes.count ?? 0);
    } catch (error) {
      console.error("Error fetching mobile accounts data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const metrics = useMemo(() => {
    const total = orders.length;
    const ready = orders.filter((o) => DOC_KEYS.every((k) => !!o[k])).length;
    const avgDays = 0; // Simplified for mobile
    return { total, ready, avgDays, archived: archivedCount };
  }, [orders, archivedCount]);

  const groupedOrders = useMemo(() => {
    const groups: { [key: string]: Order[] } = {};
    orders.forEach((order) => {
      const key = order.vendors?.name || order.patients?.primary_insurance || "Unassigned";
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(order);
    });
    return groups;
  }, [orders]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-12 w-12 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 overflow-y-auto h-[calc(100vh-180px)] min-h-[400px]">
      <div className="space-y-4 py-6">
        <MetricsBar metrics={metrics} />
        {Object.keys(groupedOrders).length === 0 ? (
          <div className="text-center py-12 px-6 bg-white rounded-xl shadow-sm">
            <p className="text-gray-500">No active accounts to display.</p>
          </div>
        ) : (
          Object.entries(groupedOrders).map(([groupName, orderList]) => {
            const total = orderList.length;
            const ready = orderList.filter((o) =>
              DOC_KEYS.every((k) => !!o[k])
            ).length;
            return (
              <div key={groupName} className="bg-white rounded-xl shadow-sm p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-700 truncate">{groupName}</span>
                  <span className="text-xs font-medium text-gray-500 whitespace-nowrap">
                    {ready}/{total} Ready
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {orderList.map((o) => {
                    const isReady = DOC_KEYS.every((k) => !!o[k]);
                    return (
                      <div
                        key={o.id}
                        title={o.patients?.name || 'Unknown Patient'}
                        className={`px-2 py-1 rounded-lg text-xs font-medium truncate ${
                          isReady
                            ? "border border-green-300 bg-green-50 text-green-800"
                            : "border border-yellow-300 bg-yellow-50 text-yellow-800"
                        }`}
                      >
                        {o.patients?.name || 'Unknown Patient'}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MyAccountsMobile;
