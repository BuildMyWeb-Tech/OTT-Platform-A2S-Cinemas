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

export default function PrivacyPolicy() {
    const { colors } = useTheme();
    return (
        <SupportPage title="Privacy Policy">
            <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 24 }}>
                A2S Cinemas ("we", "our", "us") respects your privacy. We collect your name, email,
                and payment information solely to provide movie access and process transactions.
                {"\n\n"}
                We do not sell or share your personal data with third parties except payment
                processors (Razorpay) required to complete transactions.
                {"\n\n"}
                Your data is stored securely and you may request deletion of your account at any
                time by contacting support.
                {"\n\n"}
                Last updated: June 2026.
            </Text>
        </SupportPage>
    );
}