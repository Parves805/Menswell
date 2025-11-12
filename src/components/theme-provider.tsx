
'use client';

import { useEffect } from 'react';
import type { ThemeSettings } from '@/lib/types';

const THEME_SETTINGS_KEY = 'themeSettings';

const defaultThemeSettings: ThemeSettings = {
    primary: "19 89% 54%",
    background: "24 69% 93%",
    accent: "354 89% 54%",
};

function applyTheme(settings: ThemeSettings) {
    const root = document.documentElement;
    root.style.setProperty('--primary', settings.primary);
    root.style.setProperty('--background', settings.background);
    root.style.setProperty('--accent', settings.accent);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const loadTheme = () => {
        try {
            const savedSettingsJson = localStorage.getItem(THEME_SETTINGS_KEY);
            const settings = savedSettingsJson 
                ? { ...defaultThemeSettings, ...JSON.parse(savedSettingsJson) } 
                : defaultThemeSettings;
            applyTheme(settings);
        } catch (error) {
            console.error("Failed to load theme settings, using defaults.", error);
            applyTheme(defaultThemeSettings);
        }
    };
    
    loadTheme();
    
    // Listen for changes from other tabs/windows
    window.addEventListener('storage', (event) => {
        if (event.key === THEME_SETTINGS_KEY) {
            loadTheme();
        }
    });

    // We can also poll as a fallback for the admin panel changes
    const interval = setInterval(loadTheme, 2000);

    return () => {
        window.removeEventListener('storage', loadTheme);
        clearInterval(interval);
    }
  }, []);

  return <>{children}</>;
}

    