import { supabase } from './supabaseClient';
import type { Order } from './types';
import type { jsPDF } from 'jspdf';
import { writeAuditLog } from './auditLogger';

export async function sendVendorEmail(order: Order, pdfDoc: jsPDF, userEmail: string | undefined) {
  const resendApiKey = import.meta.env.VITE_RESEND_KEY;
  if (!resendApiKey || resendApiKey === 'YOUR_API_KEY') {
    throw new Error("Resend API key is not configured. Cannot send vendor email.");
  }

  if (!order.vendor_id) {
    throw new Error("Order does not have a vendor assigned. Cannot send email.");
  }

  const { data: vendor } = await supabase
    .from("vendors")
    .select("email, name")
    .eq("id", order.vendor_id)
    .single();

  if (!vendor?.email) {
    throw new Error(`Vendor "${vendor?.name || 'Unknown'}" does not have a registered email.`);
  }

  const patientName = order.patients?.name ?? order.patient_name ?? "a patient";
  
  // Create a log entry
  const { data: logEntry, error: logInsertError } = await supabase
    .from('vendor_log')
    .insert({
        patient_name: patientName,
        vendor_name: vendor.name,
        status: 'pending',
        sent_by: userEmail || 'System'
    })
    .select()
    .single();

  if (logInsertError) {
      console.error("Failed to create vendor log entry:", logInsertError);
      // Proceed with email sending anyway, but log the error
  }

  const pdfB64 = pdfDoc.output('datauristring').split(',')[1];
  
  const payload = {
    to: vendor.email,
    from: "Patient Sync <onboarding@resend.dev>", // Replace with your verified Resend domain
    subject: `New PAR Packet for ${patientName}`,
    text: `Hello ${vendor.name},\n\nAttached is the preauthorization packet for ${patientName}.\n\nThank you,\nPatient's Choice DME`,
    attachments: [{
        filename: `${patientName.replace(/\s/g, "_")}_PAR.pdf`,
        content: pdfB64,
    }],
  };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(`Failed to send email: ${errorBody.message}`);
    }
    
    console.log(`Email successfully sent to ${vendor.email}`);
    await writeAuditLog("email_sent", { changed_by: userEmail, changed_user: patientName, vendor: vendor.name });

    // Update log to 'sent'
    if (logEntry) {
        await supabase.from('vendor_log').update({ status: 'sent' }).eq('id', logEntry.id);
    }

  } catch (error) {
    console.error("Error sending vendor email:", error);
    // Update log to 'failed'
    if (logEntry) {
        await supabase.from('vendor_log').update({ status: 'failed' }).eq('id', logEntry.id);
    }
    throw error; // Re-throw the error to be caught by the calling function
  }
}
