import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/constants";

export default function RefundPolicy() {
    const router = useRouter();
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
            <View style={{ flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 0.5, borderBottomColor: "#eee" }}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
                    <Ionicons name="arrow-back" size={22} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={{ fontSize: 18, fontWeight: "700", color: COLORS.primary }}>Refund Policy</Text>
            </View>
            <ScrollView style={{ padding: 20 }}>
                <Text style={{ fontSize: 14, color: COLORS.secondary, lineHeight: 22 }}>
                    All purchases on A2S Cinemas grant time-limited streaming access to the selected
                    movie and are processed instantly upon successful payment.
                    {"\n\n"}
                    Refunds may be requested within 24 hours of purchase, provided the movie has not
                    been played (Watch Now not used). Once playback has started, the purchase becomes
                    non-refundable.
                    {"\n\n"}
                    If you experience a technical issue preventing playback (e.g. video not loading),
                    contact support within 24 hours with your order details and we will investigate
                    and issue a refund or replacement access if the issue is verified on our end.
                    {"\n\n"}
                    Approved refunds are processed back to the original payment method via Razorpay
                    within 5-7 business days.
                    {"\n\n"}
                    To request a refund, contact support with your registered email and the movie
                    title purchased.
                    {"\n\n"}
                    Last updated: June 2026.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}