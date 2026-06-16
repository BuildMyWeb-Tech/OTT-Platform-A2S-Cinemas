import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, HELP_CENTER_MENU } from "@/constants";

export default function HelpCenter() {
    const router = useRouter();
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
            <View style={{ flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 0.5, borderBottomColor: "#eee" }}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
                    <Ionicons name="arrow-back" size={22} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={{ fontSize: 18, fontWeight: "700", color: COLORS.primary }}>Help Center</Text>
            </View>
            <ScrollView style={{ padding: 16 }}>
                <View style={{ backgroundColor: "#fff", borderRadius: 12, borderWidth: 0.5, borderColor: "#eee" }}>
                    {HELP_CENTER_MENU.map((item, index) => (
                        <TouchableOpacity
                            key={item.id}
                            onPress={() => router.push(item.route as any)}
                            style={{
                                flexDirection: "row", alignItems: "center", padding: 16,
                                borderBottomWidth: index !== HELP_CENTER_MENU.length - 1 ? 0.5 : 0,
                                borderBottomColor: "#f0f0f0",
                            }}
                        >
                            <View style={{
                                width: 38, height: 38, borderRadius: 19,
                                backgroundColor: COLORS.surface,
                                justifyContent: "center", alignItems: "center", marginRight: 14,
                            }}>
                                <Ionicons name={item.icon as any} size={18} color={COLORS.primary} />
                            </View>
                            <Text style={{ flex: 1, fontSize: 15, color: COLORS.primary, fontWeight: "500" }}>
                                {item.title}
                            </Text>
                            <Ionicons name="chevron-forward" size={18} color={COLORS.secondary} />
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}