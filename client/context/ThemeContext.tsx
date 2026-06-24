import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";

const THEME_KEY = "ott_theme_preference";

export type ThemeMode = "light" | "dark" | "system";

export interface ThemeColors {
    // Backgrounds
    background: string;
    surface: string;
    surfaceVariant: string;
    card: string;
    cardElevated: string;

    // Text
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textInverse: string;

    // Brand
    accent: string;
    accentDim: string;

    // Status
    success: string;
    warning: string;
    error: string;

    // UI elements
    border: string;
    divider: string;
    overlay: string;
    skeleton: string;

    // Navigation
    tabBar: string;
    tabBarBorder: string;
    tabBarActive: string;
    tabBarInactive: string;

    // Badges / pills
    badgeBg: string;
    badgeText: string;

    // Input
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
    mode: "system",
    isDark: false,
    colors: LIGHT_COLORS,
    setMode: () => {},
    toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemScheme = useColorScheme();
    const [mode, setModeState] = useState<ThemeMode>("dark"); // default dark for OTT

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

    const toggleTheme = () => {
        const next = isDark ? "light" : "dark";
        setMode(next);
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