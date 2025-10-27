import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

export interface Preferences {
  weeklyReminders: boolean;
  showEmailCenter: boolean;
  rememberDashboardLayout: boolean;
  dashboardLayout: Record<string, boolean>;
}

interface PreferencesContextType {
  prefs: Preferences;
  setPrefs: React.Dispatch<React.SetStateAction<Preferences>>;
}

const defaultPreferences: Preferences = {
  weeklyReminders: true,
  showEmailCenter: true,
  rememberDashboardLayout: false,
  dashboardLayout: {},
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [prefs, setPrefs] = useState<Preferences>(() => {
    try {
      const storedPrefs = localStorage.getItem('patientSync_userPrefs');
      if (storedPrefs) {
        const parsed = JSON.parse(storedPrefs);
        // Merge with defaults to handle new preferences
        return { ...defaultPreferences, ...parsed };
      }
      return defaultPreferences;
    } catch (error) {
      console.error("Failed to parse user preferences from localStorage", error);
      return defaultPreferences;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('patientSync_userPrefs', JSON.stringify(prefs));
    } catch (error) {
      console.error("Failed to save user preferences to localStorage", error);
    }
  }, [prefs]);

  return (
    <PreferencesContext.Provider value={{ prefs, setPrefs }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};
