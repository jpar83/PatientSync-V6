import React, { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { usePreferences } from "../contexts/PreferencesContext";

export default function WeeklyReminder() {
  const { prefs } = usePreferences();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!prefs.weeklyReminders) {
      setShow(false);
      return;
    }

    const lastReminderDismissed = localStorage.getItem("patientSync_lastReminder");
    if (!lastReminderDismissed) {
      setShow(true);
      return;
    }
    
    const lastDate = new Date(lastReminderDismissed);
    const now = new Date();
    const diffDays = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays >= 7) {
      setShow(true);
    }
  }, [prefs.weeklyReminders]);

  const dismiss = () => {
    localStorage.setItem("patientSync_lastReminder", new Date().toISOString());
    setShow(false);
  };

  if (!show) {
    return null;
  }

  return (
    <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg flex justify-between items-center mb-4 shadow-sm">
      <div className="flex items-center gap-3">
        <Bell className="h-6 w-6 text-amber-500" />
        <div>
            <p className="font-semibold">Weekly Check-in</p>
            <p className="text-sm">It’s been a week since your last summary. Time to review your metrics or email an update?</p>
        </div>
      </div>
      <button onClick={dismiss} className="p-2 rounded-full hover:bg-amber-100 text-amber-700" title="Dismiss">
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
