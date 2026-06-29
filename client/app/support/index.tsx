import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HELP_CENTER_MENU } from "@/constants";
import { useTheme } from "@/context/ThemeContext";

export default function HelpCenter() {
    const router = useRouter();
    const { colors, isDark } = useTheme();

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
            <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
                <View style={{
                    flexDirection: "row", alignItems: "center",
                    paddingHorizontal: 16, paddingVertical: 14,
                    borderBottomWidth: 0.5, borderBottomColor: colors.divider,
                }}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{
                            width: 38, height: 38, borderRadius: 19,
                            backgroundColor: colors.surfaceVariant,
                            justifyContent: "center", alignItems: "center", marginRight: 14,
                        }}
                    >
                        <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 20, fontWeight: "800", color: colors.textPrimary }}>Help Center</Text>
                </View>

                <ScrollView style={{ flex: 1, padding: 16 }}>
                    <View style={{
                        backgroundColor: colors.card, borderRadius: 16,
                        borderWidth: 0.5, borderColor: colors.border, overflow: "hidden",
                    }}>
                        {HELP_CENTER_MENU.map((item, index) => (
                            <TouchableOpacity
                                key={item.id}
                                onPress={() => router.push(item.route as any)}
                                style={{
                                    flexDirection: "row", alignItems: "center", padding: 16,
                                    borderBottomWidth: index !== HELP_CENTER_MENU.length - 1 ? 0.5 : 0,
                                    borderBottomColor: colors.divider,
                                }}
                            >
                                <View style={{
                                    width: 38, height: 38, borderRadius: 19,
                                    backgroundColor: colors.surfaceVariant,
                                    justifyContent: "center", alignItems: "center", marginRight: 14,
                                }}>
                                    <Ionicons name={item.icon as any} size={18} color={colors.textSecondary} />
                                </View>
                                <Text style={{ flex: 1, fontSize: 15, color: colors.textPrimary, fontWeight: "500" }}>
                                    {item.title}
                                </Text>
                                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}