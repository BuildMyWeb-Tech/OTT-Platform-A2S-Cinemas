import React from "react";
import { TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";

export default function ThemeToggle({ size = 22 }: { size?: number }) {
    const { isDark, toggleTheme, colors } = useTheme();

    return (
        <TouchableOpacity
            onPress={toggleTheme}
            style={{
                width: size + 16,
                height: size + 16,
                borderRadius: (size + 16) / 2,
                backgroundColor: colors.surfaceVariant,
                justifyContent: "center",
                alignItems: "center",
            }}
            activeOpacity={0.7}
        >
            <Ionicons
                name={isDark ? "sunny-outline" : "moon-outline"}
                size={size}
                color={isDark ? "#FFD700" : colors.textSecondary}
            />
        </TouchableOpacity>
    );
}