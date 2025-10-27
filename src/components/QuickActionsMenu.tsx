import React, { useState, useRef } from "react";
import { Plus, Upload, Archive, Printer, Loader2, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { printWeeklyReport } from "../lib/printReport";
import { getLogoDataUrl } from "../lib/utils";
import { useOnClickOutside } from "../hooks/useOnClickOutside";
import { Btn } from "./ui/Btn";
import type { Order } from "../lib/types";

interface Metrics { total: number; ready: number; avgDays: number; archived: number; }
interface Props { orders: Order[]; metrics: Metrics; }

export default function QuickActionsMenu({ orders, metrics }: Props) {
  const [open, setOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(menuRef, () => setOpen(false));

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const logoUrl = await getLogoDataUrl();
      printWeeklyReport(orders, metrics, logoUrl);
    } catch (error) {
      console.error("Failed to print weekly report:", error);
    } finally {
      setIsPrinting(false);
    }
  };

  const actions = [
    { icon: Plus, label: "Add Referral", onClick: () => navigate("/referrals?add=true") },
    { icon: Upload, label: "Upload Report", onClick: () => navigate("/referrals?upload=true") },
    { icon: Archive, label: "View Archived", onClick: () => navigate("/archived") },
    { icon: Printer, label: "Print Summary", onClick: handlePrint, loading: isPrinting },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <Btn onClick={() => setOpen(!open)}>
        Quick Actions <ChevronDown className="h-4 w-4 ml-2" />
      </Btn>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white border rounded-xl shadow-lg p-2 z-30">
          {actions.map(({ icon: Icon, label, onClick, loading }) => (
            <button
              key={label}
              onClick={() => {
                onClick();
                setOpen(false);
              }}
              disabled={loading}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md disabled:opacity-50"
            >
              <Icon className="h-4 w-4 text-gray-500" />
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>{label}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
