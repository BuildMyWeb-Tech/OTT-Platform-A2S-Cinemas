import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";

function SupportPage({ title, children }: { title: string; children: React.ReactNode }) {
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
                    <Text style={{ fontSize: 20, fontWeight: "800", color: colors.textPrimary }}>{title}</Text>
                </View>
                <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
                    {children}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

export default function RefundPolicy() {
    const { colors } = useTheme();
    return (
        <SupportPage title="Refund Policy">
            <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 24 }}>
                All purchases on A2S Cinemas grant time-limited streaming access to the selected
                movie and are processed instantly upon successful payment.
                {"\n\n"}
                Refunds may be requested within 24 hours of purchase, provided the movie has not
                been played. Once playback has started, the purchase is non-refundable.
                {"\n\n"}
                If you experience a technical issue preventing playback, contact support within
                24 hours with your order details and we will investigate and issue a refund if
                the issue is verified.
                {"\n\n"}
                Approved refunds are processed back to the original payment method via Razorpay
                within 5–7 business days.
                {"\n\n"}
                Last updated: June 2026.
            </Text>
        </SupportPage>
    );
}