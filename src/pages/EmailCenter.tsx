import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { sendDailySummary } from "../lib/summaryEmail";
import { sendVendorEmail } from "../lib/emailService";
import { generateBrandedPDF } from "../lib/pdfUtils";
import { Btn } from "../components/ui/Btn";
import { Mail, Send, Loader2, Check } from "lucide-react";
import WeeklyReminder from "../components/WeeklyReminder";
import type { Order, DocumentTemplate } from "../lib/types";
import { useQuery } from '@tanstack/react-query';
import { toast } from '../lib/toast';

const EmailCenter: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryStatus, setSummaryStatus] = useState<'idle' | 'success'>('idle');
  const [vendorSendState, setVendorSendState] = useState<Record<string, 'sending' | 'sent'>>({});

  const { data: templates } = useQuery({
    queryKey: ['document_templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('document_templates').select('*');
      if (error) throw error;
      return data as DocumentTemplate[];
    },
    staleTime: Infinity,
  });

  const fetchReadyOrders = useCallback(async () => {
    setPageLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*, patients(*), vendors(*)")
        .eq("is_archived", false);

      if (error) throw error;
      
      const readyOrders = (data as Order[]).filter((o) => {
        const required = o.patients?.required_documents || [];
        if (required.length === 0) return true;
        return required.every(d => o.document_status?.[d] === 'Complete');
      });
      setOrders(readyOrders);

    } catch (error) {
      console.error("Error fetching ready orders:", error);
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReadyOrders();
  }, [fetchReadyOrders]);

  const handleSummary = async () => {
    setSummaryLoading(true);
    try {
      await sendDailySummary();
      setSummaryStatus('success');
      toast('Daily summary sent successfully!', 'ok');
    } catch (error: any) {
      console.error("Failed to send summary email:", error);
      if (error.message.includes('Resend API key is not configured')) {
        toast('Email failed: Resend API key is not configured.', 'err');
      } else {
        toast(`Failed to send summary: ${error.message}`, 'err');
      }
    } finally {
      setSummaryLoading(false);
      setTimeout(() => setSummaryStatus('idle'), 3000);
    }
  };

  const handleVendorSend = async (order: Order) => {
    if (!templates) return;
    setVendorSendState(prev => ({ ...prev, [order.id]: 'sending' }));
    try {
      let logoDataUrl: string | undefined;
      const pdfDoc = generateBrandedPDF(order, templates, logoDataUrl);
      await sendVendorEmail(order, pdfDoc, user?.email);
      setVendorSendState(prev => ({ ...prev, [order.id]: 'sent' }));
      toast(`PAR Packet sent for ${order.patients?.name}.`, 'ok');
    } catch (error: any) {
      console.error(`Failed to send manual email for order ${order.id}:`, error);
      if (error.message.includes('Resend API key is not configured')) {
        toast('Email failed: Resend API key is not configured.', 'err');
      } else {
        toast(`Failed to send email: ${error.message}`, 'err');
      }
      setVendorSendState(prev => {
        const newState = { ...prev };
        delete newState[order.id];
        return newState;
      });
    }
  };

  return (
    <div className="h-full overflow-y-auto space-y-[var(--compact-gap)] pb-nav-safe md:pb-8">
      <WeeklyReminder />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
        <Btn onClick={handleSummary} disabled={summaryLoading}>
            {summaryLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : (summaryStatus === 'success' ? <Check className="h-4 w-4 mr-2" /> : <Mail className="h-4 w-4 mr-2" />)}
            {summaryLoading ? 'Sending...' : (summaryStatus === 'success' ? 'Summary Sent!' : 'Send Daily Summary')}
        </Btn>
      </div>

      <div className="soft-card overflow-x-auto">
        {pageLoading ? (
            <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-teal-500" /></div>
        ) : (
            <table className="min-w-full w-full text-sm table-compact">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                <tr>
                <th className="text-left">Patient</th>
                <th className="text-left">Insurance</th>
                <th className="text-left">Vendor</th>
                <th className="text-left">Status</th>
                <th className="text-center">Action</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
                {orders.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-12 px-6 text-gray-500">No orders are currently ready for PAR.</td></tr>
                ) : orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                    <td className="font-medium text-gray-900">{o.patients?.name}</td>
                    <td className="text-gray-500">{o.patients?.primary_insurance}</td>
                    <td className="text-gray-500">{o.vendors?.name || "—"}</td>
                    <td className="font-semibold text-green-600">Ready for PAR</td>
                    <td className="text-center">
                    <Btn
                        variant="outline"
                        size="sm"
                        onClick={() => handleVendorSend(o)}
                        disabled={!o.vendor_id || !o.vendors?.email || !!vendorSendState[o.id]}
                        title={!o.vendor_id || !o.vendors?.email ? 'Vendor or vendor email missing' : 'Send PAR Packet'}
                    >
                        {vendorSendState[o.id] === 'sending' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : (vendorSendState[o.id] === 'sent' ? <Check className="h-4 w-4 mr-2" /> : <Send className="h-4 w-4 mr-2" />)}
                        {vendorSendState[o.id] === 'sending' ? 'Sending...' : (vendorSendState[o.id] === 'sent' ? 'Sent' : 'Send Packet')}
                    </Btn>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        )}
      </div>
    </div>
  );
}

export default EmailCenter;
