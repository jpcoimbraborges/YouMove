'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeMode = 'dark' | 'light' | 'system';
type AccentColor = 'lime' | 'blue' | 'purple' | 'orange' | 'pink' | 'teal';

interface ThemeContextType {
    theme: ThemeMode;
    setTheme: (theme: ThemeMode) => void;
    accentColor: AccentColor;
    setAccentColor: (color: AccentColor) => void;
    aiTipsEnabled: boolean;
    setAiTipsEnabled: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<ThemeMode>('system');
    const [accentColor, setAccentColorState] = useState<AccentColor>('lime');
    const [aiTipsEnabled, setAiTipsEnabledState] = useState<boolean>(true);

    useEffect(() => {
        const savedTheme = localStorage.getItem('youmove_theme') as ThemeMode;
        const savedAccent = localStorage.getItem('youmove_accent') as AccentColor;
        const savedAiTips = localStorage.getItem('youmove_ai_tips');

        if (savedTheme) setThemeState(savedTheme);
        if (savedAccent) setAccentColorState(savedAccent);
        // Default true if not set
        if (savedAiTips !== null) setAiTipsEnabledState(savedAiTips === 'true');
    }, []);

    // Enforce Dark Mode
    useEffect(() => {
        const root = document.documentElement;
        root.classList.add('dark');
        // We no longer toggle 'light' or 'system' as the app is now Dark Mode only.
    }, []);

    useEffect(() => {
        // Apply Accent Color
        const root = document.documentElement;

        const colors: Record<AccentColor, { main: string; light: string; dark: string }> = {
            lime: { main: '#D4FF00', light: '#E4FF5F', dark: '#B3D900' },
            blue: { main: '#3B82F6', light: '#60A5FA', dark: '#2563EB' },
            purple: { main: '#8B5CF6', light: '#A78BFA', dark: '#7C3AED' },
            orange: { main: '#F59E0B', light: '#FBBF24', dark: '#D97706' },
            pink: { main: '#EC4899', light: '#F472B6', dark: '#DB2777' },
            teal: { main: '#10B981', light: '#34D399', dark: '#059669' },
        };

        const selected = colors[accentColor];
        if (selected) {
            root.style.setProperty('--color-accent', selected.main);
            root.style.setProperty('--color-accent-light', selected.light);
            root.style.setProperty('--color-accent-dark', selected.dark);
        }

        localStorage.setItem('youmove_accent', accentColor);
    }, [accentColor]);

    useEffect(() => {
        localStorage.setItem('youmove_ai_tips', String(aiTipsEnabled));
    }, [aiTipsEnabled]);

    const setTheme = (t: ThemeMode) => setThemeState(t);
    const setAccentColor = (c: AccentColor) => setAccentColorState(c);
    const setAiTipsEnabled = (enabled: boolean) => setAiTipsEnabledState(enabled);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, accentColor, setAccentColor, aiTipsEnabled, setAiTipsEnabled }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
