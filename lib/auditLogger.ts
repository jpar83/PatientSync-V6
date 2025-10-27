import { supabase } from "./supabaseClient";
import { useAuth } from "@/contexts/AuthContext";

export async function writeAuditLog(
  action: string,
  details: {
    changed_by?: string | null;
    changed_user?: string | null;
    [key: string]: any;
  }
) {
  try {
    let { changed_by, changed_user, ...restDetails } = details;

    if (!changed_by) {
        // This hook can only be called in components, so we get the user from supabase directly.
        const { data: { user } } = await supabase.auth.getUser();
        changed_by = user?.email || "System";
    }

    const { error } = await supabase.from("audit_log").insert([
      {
        action,
        changed_by,
        changed_user: changed_user || null,
        details: restDetails,
      },
    ]);
    if (error) {
        console.error("Audit Log Error:", error);
    }
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}
