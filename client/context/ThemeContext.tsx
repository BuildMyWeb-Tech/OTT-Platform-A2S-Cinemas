import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";

const THEME_KEY = "ott_theme_preference";

export type ThemeMode = "light" | "dark" | "system";

export interface ThemeColors {
    background: string;
    surface: string;
    surfaceVariant: string;
    card: string;
    cardElevated: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textInverse: string;
    accent: string;
    accentDim: string;
    success: string;
    warning: string;
    error: string;
    border: string;
    divider: string;
    overlay: string;
    skeleton: string;
    tabBar: string;
    tabBarBorder: string;
    tabBarActive: string;
    tabBarInactive: string;
    badgeBg: string;
    badgeText: string;
    inputBg: string;
    inputBorder: string;
    inputText: string;
    inputPlaceholder: string;
}

const LIGHT_COLORS: ThemeColors = {
    background: "#FFFFFF",
    surface: "#F7F7F7",
    surfaceVariant: "#F0F0F0",
    card: "#FFFFFF",
    cardElevated: "#FFFFFF",
    textPrimary: "#111111",
    textSecondary: "#555555",
    textMuted: "#999999",
    textInverse: "#FFFFFF",
    accent: "#E50914",
    accentDim: "#E5091420",
    success: "#1D9E75",
    warning: "#EF9F27",
    error: "#FF4444",
    border: "#EEEEEE",
    divider: "#F0F0F0",
    overlay: "rgba(0,0,0,0.5)",
    skeleton: "#E8E8E8",
    tabBar: "#FFFFFF",
    tabBarBorder: "#F0F0F0",
    tabBarActive: "#E50914",
    tabBarInactive: "#AAAAAA",
    badgeBg: "#F0F0F0",
    badgeText: "#555555",
    inputBg: "#F5F5F5",
    inputBorder: "#E8E8E8",
    inputText: "#111111",
    inputPlaceholder: "#999999",
};

const DARK_COLORS: ThemeColors = {
    background: "#0A0A0F",
    surface: "#141418",
    surfaceVariant: "#1C1C22",
    card: "#1A1A22",
    cardElevated: "#22222C",
    textPrimary: "#F0F0F0",
    textSecondary: "#AAAAAA",
    textMuted: "#666666",
    textInverse: "#111111",
    accent: "#E50914",
    accentDim: "#E5091425",
    success: "#1D9E75",
    warning: "#EF9F27",
    error: "#FF4444",
    border: "#2A2A35",
    divider: "#1E1E28",
    overlay: "rgba(0,0,0,0.75)",
    skeleton: "#1E1E28",
    tabBar: "#0F0F16",
    tabBarBorder: "#1E1E28",
    tabBarActive: "#E50914",
    tabBarInactive: "#555566",
    badgeBg: "#22222C",
    badgeText: "#AAAAAA",
    inputBg: "#1A1A22",
    inputBorder: "#2A2A35",
    inputText: "#F0F0F0",
    inputPlaceholder: "#555566",
};

interface ThemeContextType {
    mode: ThemeMode;
    isDark: boolean;
    colors: ThemeColors;
    setMode: (mode: ThemeMode) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    mode: "dark",
    isDark: true,
    colors: DARK_COLORS,
    setMode: () => {},
    toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemScheme = useColorScheme();
    const [mode, setModeState] = useState<ThemeMode>("dark");

    useEffect(() => {
        AsyncStorage.getItem(THEME_KEY).then((saved) => {
            if (saved === "light" || saved === "dark" || saved === "system") {
                setModeState(saved);
            }
        });
    }, []);

    const setMode = async (newMode: ThemeMode) => {
        setModeState(newMode);
        await AsyncStorage.setItem(THEME_KEY, newMode);
    };

    // FIX: use mode state directly, not derived isDark, to avoid stale closure
    const toggleTheme = () => {
        setModeState((currentMode) => {
            // If system, treat as whatever system currently is, then toggle
            const currentlyDark =
                currentMode === "dark" ? true :
                currentMode === "light" ? false :
                systemScheme === "dark";

            const next: ThemeMode = currentlyDark ? "light" : "dark";
            // Persist async without blocking state update
            AsyncStorage.setItem(THEME_KEY, next).catch(() => {});
            return next;
        });
    };

    const isDark =
        mode === "dark" ? true :
        mode === "light" ? false :
        systemScheme === "dark";

    const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

    return (
        <ThemeContext.Provider value={{ mode, isDark, colors, setMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
export { LIGHT_COLORS, DARK_COLORS };