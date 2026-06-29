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

export default function TermsAndConditions() {
    const { colors } = useTheme();
    return (
        <SupportPage title="Terms & Conditions">
            <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 24 }}>
                By using the A2S Cinemas app, you agree to the following terms.
                {"\n\n"}
                1. Account: You are responsible for maintaining the confidentiality of your
                account credentials and for all activity under your account.
                {"\n\n"}
                2. Content Access: Purchases grant a personal, non-transferable, time-limited
                license to stream the selected movie within the access period shown at purchase.
                Access does not constitute ownership of the content.
                {"\n\n"}
                3. Usage: You may not download, record, redistribute, or publicly exhibit any
                content from the app. Licenses may be revoked for violation of these terms.
                {"\n\n"}
                4. Payments: All payments are processed securely via Razorpay. Prices are in
                INR inclusive of applicable taxes unless stated otherwise.
                {"\n\n"}
                5. Reviews: User-submitted ratings and reviews must not contain offensive,
                defamatory, or unlawful content. We reserve the right to moderate or remove
                any review.
                {"\n\n"}
                6. Availability: We strive for uninterrupted service but do not guarantee
                availability at all times due to maintenance or factors beyond our control.
                {"\n\n"}
                7. Changes: These terms may be updated periodically. Continued use constitutes
                acceptance of the updated terms.
                {"\n\n"}
                Last updated: June 2026.
            </Text>
        </SupportPage>
    );
}