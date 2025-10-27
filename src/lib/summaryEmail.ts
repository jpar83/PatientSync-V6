import { supabase } from "./supabaseClient";
import { writeAuditLog } from "./auditLogger";
import { Order } from "./types";

const DOC_KEYS = ["f2f", "pt_eval", "swo", "dpd"];

export async function sendDailySummary() {
  const resendApiKey = import.meta.env.VITE_RESEND_KEY;
  if (!resendApiKey || resendApiKey === 'YOUR_API_KEY') {
    throw new Error("Resend API key is not configured. Cannot send summary email.");
  }

  const { data: orders, error } = await supabase
    .from("orders")
    .select("*, patients(name, primary_insurance)");

  if (error) {
    throw new Error(`Failed to fetch orders: ${error.message}`);
  }
  if (!orders) {
    throw new Error("No orders found.");
  }

  const typedOrders = orders as Order[];
  const incomplete = typedOrders.filter(o => DOC_KEYS.some(k => !(o as any)[k]));
  const ready = typedOrders.length - incomplete.length;

  const emailBody = `
Hello Kristin,

Here is your daily summary for ${new Date().toLocaleDateString()}:

- Total Open Orders: ${typedOrders.length}
- Ready for PAR: ${ready}
- Incomplete Docs: ${incomplete.length}

Top 5 Cases with Missing Documents:
${incomplete.length > 0 ? incomplete.slice(0, 5).map(o => `- ${o.patients?.name ?? 'Unknown Patient'} (${o.patients?.primary_insurance ?? 'N/A'})`).join("\n") : 'None'}

Have a great day!
- Patient Sync Bot
`;

  const payload = {
    from: "Patient Sync <onboarding@resend.dev>",
    to: "kristinsegalsales@gmail.com",
    subject: `Your Patient Sync Daily Summary`,
    text: emailBody.trim(),
  };

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
    throw new Error(`Failed to send email via Resend: ${errorBody.message}`);
  }

  await writeAuditLog("summary_email_sent", { to: "kristinsegalsales@gmail.com", open_orders: typedOrders.length });
}
