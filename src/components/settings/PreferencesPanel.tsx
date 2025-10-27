import React from 'react';
import { usePreferences } from '../../contexts/PreferencesContext';
import ToggleSwitch from '../ui/ToggleSwitch';

const PreferencesPanel: React.FC = () => {
    const { prefs, setPrefs } = usePreferences();
    const togglePref = (key: keyof typeof prefs) => setPrefs(p => ({ ...p, [key]: !p[key] }));

    return (
        <div className="soft-card max-w-2xl fade-in">
            <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-800">Application Preferences</h2>
                <p className="text-sm text-gray-500 mt-1">Customize your user experience. Changes are saved automatically.</p>
            </div>
            <div className="px-6 pb-6">
                <ToggleSwitch 
                    label="Show Weekly Reminders"
                    description="Display a reminder on the dashboard if it's been over a week."
                    checked={prefs.weeklyReminders}
                    onChange={() => togglePref('weeklyReminders')}
                />
            </div>
        </div>
    );
};

export default PreferencesPanel;
