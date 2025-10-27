import React from "react";
import { supabase } from "../lib/supabaseClient";
import { Archive, RotateCcw } from "lucide-react";
import { writeAuditLog } from "../lib/auditLogger";
import type { Order } from "../lib/types";

interface Props {
    order: Order;
    onDone?: () => void;
}

export default function ArchiveButton({ order, onDone }: Props) {
  const toggleArchive = async () => {
    const newStatus = !order.is_archived;
    const { error } = await supabase
      .from("orders")
      .update({ is_archived: newStatus })
      .eq("id", order.id);
    
    if (!error) {
        await writeAuditLog(newStatus ? 'order_archived' : 'order_restored', { changed_user: order.patients?.name || order.patient_name });
        if (onDone) onDone();
    } else {
        console.error("Failed to toggle archive status:", error);
    }
  };

  const Icon = order.is_archived ? RotateCcw : Archive;
  return (
    <button
      onClick={toggleArchive}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border transition-colors ${
        order.is_archived
          ? "text-blue-600 border-blue-300 bg-blue-50 hover:bg-blue-100"
          : "text-gray-600 border-gray-300 hover:bg-gray-100"
      }`}
      title={order.is_archived ? "Restore from Archive" : "Archive this Order"}
    >
      <Icon className="h-4 w-4" /> {order.is_archived ? "Restore" : "Archive"}
    </button>
  );
}
