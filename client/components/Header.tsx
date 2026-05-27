import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "@/constants";
import type { HeaderProps } from "@/constants/types";

export default function Header({ title, showBack, showSearch, showLogo }: HeaderProps) {
    const router = useRouter();

    return (
        <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
            <View className="flex-row items-center flex-1">
                {showBack && (
                    <TouchableOpacity onPress={() => router.back()} className="mr-3">
                        <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                )}
                {title && (
                    <Text className="text-xl font-bold text-primary flex-1">
                        {title}
                    </Text>
                )}
                {showLogo && (
                    <Text style={{ fontSize: 20, fontWeight: "700", color: COLORS.accent }}>
                        🎬 A2S Cinemas
                    </Text>
                )}
            </View>
            {showSearch && (
                <TouchableOpacity onPress={() => router.push("/browse" as any)}>
                    <Ionicons name="search-outline" size={24} color={COLORS.primary} />
                </TouchableOpacity>
            )}
        </View>
    );
}