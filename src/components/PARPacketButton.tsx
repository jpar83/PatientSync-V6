import React, { useState, useMemo } from "react";
import { FileText, Loader2, Mail, Check } from "lucide-react";
import type { Order, DocumentTemplate } from "../lib/types";
import { generateBrandedPDF } from "../lib/pdfUtils";
import { sendVendorEmail } from "../lib/emailService";
import { useAuth } from "../contexts/AuthContext";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { toast } from '../lib/toast';

interface Props {
  order: Order;
}

type LoadingState = 'idle' | 'generating' | 'sending' | 'done';

const PARPacketButton: React.FC<Props> = ({ order }) => {
  const { user } = useAuth();
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');

  const { data: templates } = useQuery({
    queryKey: ['document_templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('document_templates').select('*');
      if (error) throw error;
      return data as DocumentTemplate[];
    },
    staleTime: Infinity,
  });

  const isReady = useMemo(() => {
    const required = order.patients?.required_documents || [];
    if (required.length === 0) return false;
    return required.every(doc => order.document_status?.[doc] === 'Complete');
  }, [order]);

  if (!isReady) {
    return null;
  }

  const generateAndSend = async () => {
    if (!templates) return;
    setLoadingState('generating');
    try {
      let logoDataUrl: string | undefined;
      const doc = generateBrandedPDF(order, templates, logoDataUrl);
      
      setLoadingState('sending');
      await sendVendorEmail(order, doc, user?.email);
      toast('PAR Packet sent successfully!', 'ok');
      setLoadingState('done');
      setTimeout(() => setLoadingState('idle'), 2000);

    } catch (error: any) {
      console.error("Failed to generate and send PDF:", error);
      if (error.message.includes('Resend API key is not configured')) {
          toast('Email failed: Resend API key is not configured.', 'err');
      } else {
          toast(`Failed to send email: ${error.message}`, 'err');
      }
      setLoadingState('idle');
    }
  };

  const buttonContent: Record<LoadingState, React.ReactNode> = {
    idle: <><FileText className="h-4 w-4" /> PAR Packet</>,
    generating: <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>,
    sending: <><Mail className="h-4 w-4 animate-spin" /> Sending...</>,
    done: <><Check className="h-4 w-4" /> Sent!</>,
  };

  return (
    <button
      onClick={generateAndSend}
      disabled={loadingState !== 'idle'}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {buttonContent[loadingState]}
    </button>
  );
};

export default PARPacketButton;
