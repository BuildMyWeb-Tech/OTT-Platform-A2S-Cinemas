import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/constants";

export default function TermsAndConditions() {
    const router = useRouter();
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
            <View style={{ flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 0.5, borderBottomColor: "#eee" }}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
                    <Ionicons name="arrow-back" size={22} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={{ fontSize: 18, fontWeight: "700", color: COLORS.primary }}>Terms & Conditions</Text>
            </View>
            <ScrollView style={{ padding: 20 }}>
                <Text style={{ fontSize: 14, color: COLORS.secondary, lineHeight: 22 }}>
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
                    4. Payments: All payments are processed securely via Razorpay. Prices are listed
                    in INR and are inclusive of applicable taxes unless stated otherwise.
                    {"\n\n"}
                    5. Reviews: User-submitted ratings and reviews must not contain offensive,
                    defamatory, or unlawful content. We reserve the right to moderate or remove
                    any review.
                    {"\n\n"}
                    6. Availability: We strive for uninterrupted service but do not guarantee
                    availability at all times due to maintenance or factors beyond our control.
                    {"\n\n"}
                    7. Changes: These terms may be updated periodically. Continued use of the app
                    constitutes acceptance of the updated terms.
                    {"\n\n"}
                    Last updated: June 2026.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}