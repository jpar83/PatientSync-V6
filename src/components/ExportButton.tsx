import React, { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Btn } from "./ui/Btn";
import type { Order } from "../lib/types";

interface Props {
  data: Order[];
  filename: string;
}

// Helper to flatten the nested order data for clean CSV export
const flattenOrderForExport = (order: Order) => ({
  patient_name: order.patients?.name ?? order.patient_name ?? 'N/A',
  insurance_primary: order.patients?.primary_insurance ?? 'N/A',
  workflow_stage: order.workflow_stage ?? 'N/A',
  status: order.status ?? 'N/A',
  last_stage_change: order.last_stage_change ? new Date(order.last_stage_change).toLocaleDateString() : 'N/A',
  referral_date: order.referral_date ? new Date(order.referral_date).toLocaleDateString() : 'N/A',
  chair_type: order.chair_type ?? 'N/A',
  accessories: order.accessories ?? 'N/A',
  f2f_complete: order.f2f ? 'Yes' : 'No',
  pt_eval_complete: order.pt_eval ? 'Yes' : 'No',
  swo_complete: order.swo ? 'Yes' : 'No',
  dpd_complete: order.dpd ? 'Yes' : 'No',
  is_archived: order.is_archived ? 'Yes' : 'No',
  rep_name: order.rep_name ?? 'N/A',
});

const ExportButton: React.FC<Props> = ({ data, filename }) => {
  const [loading, setLoading] = useState(false);

  const handleExport = () => {
    if (!data || data.length === 0) {
      alert("No data to export.");
      return;
    }

    setLoading(true);

    try {
      const flattenedData = data.map(flattenOrderForExport);
      const headers = Object.keys(flattenedData[0]);
      
      const csvContent = [
        headers.join(","),
        ...flattenedData.map((row: any) =>
          headers.map((header) => JSON.stringify(row[header] ?? "")).join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to export CSV:", error);
      alert("An error occurred during export.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Btn
      variant="outline"
      onClick={handleExport}
      disabled={loading || data.length === 0}
      title={data.length === 0 ? "No data to export" : "Export current view to CSV"}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      {loading ? "Exporting..." : "Export CSV"}
    </Btn>
  );
};

export default ExportButton;
