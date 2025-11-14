
'use client';

import { useEffect, useState } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import type { ThemeSettings } from '@/lib/types';

const defaultThemeSettings: ThemeSettings = {
    primary: "#F26522",
    background: "#F9EBE1",
    accent: "#F2223A",
};

function hexToHsl(hex: string): string | null {
    if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)) {
        return null;
    }

    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
    }

    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return `${h} ${s}% ${l}%`;
}


function applyTheme(settings: ThemeSettings) {
    const root = document.documentElement;

    const primaryHsl = hexToHsl(settings.primary);
    const backgroundHsl = hexToHsl(settings.background);
    const accentHsl = hexToHsl(settings.accent);

    if (primaryHsl) root.style.setProperty('--primary', primaryHsl);
    if (backgroundHsl) root.style.setProperty('--background', backgroundHsl);
    if (accentHsl) root.style.setProperty('--accent', accentHsl);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  useEffect(() => {
    const settingsRef = doc(firestore, 'settings', 'store');
    
    const unsub = onSnapshot(settingsRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data().themeSettings) {
            applyTheme({ ...defaultThemeSettings, ...docSnap.data().themeSettings });
        } else {
            applyTheme(defaultThemeSettings);
        }
        setIsThemeLoaded(true);
    }, (error) => {
        console.error("Failed to load theme settings from Firestore, using defaults.", error);
        applyTheme(defaultThemeSettings);
        setIsThemeLoaded(true);
    });

    return () => unsub();
  }, []);

  if (!isThemeLoaded) {
      return null;
  }

  return <>{children}</>;
}
