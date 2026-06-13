// client/app/support/privacy.tsx (same pattern for refund.tsx, terms.tsx)
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/constants";

export default function PrivacyPolicy() {
    const router = useRouter();
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
            <View style={{ flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 0.5, borderBottomColor: "#eee" }}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
                    <Ionicons name="arrow-back" size={22} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={{ fontSize: 18, fontWeight: "700", color: COLORS.primary }}>Privacy Policy</Text>
            </View>
            <ScrollView style={{ padding: 20 }}>
                <Text style={{ fontSize: 14, color: COLORS.secondary, lineHeight: 22 }}>
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
            </ScrollView>
        </SafeAreaView>
    );
}