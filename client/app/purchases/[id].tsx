import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/Header";
import api from "@/constants/api";
import { COLORS, LICENSE_STATUS_COLOR } from "@/constants";
import type { Purchase } from "@/constants/types";
import SplashLoader from "@/components/SplashLoader";

export default function PurchaseDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [purchase, setPurchase] = useState<Purchase | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchPurchase(); }, [id]);

    const fetchPurchase = async () => {
        try {
            const { data } = await api.get(`/purchases/${id}`);
            setPurchase(data.data);
        } catch (error) {
            console.error("Error fetching purchase:", error);
        } finally {
            setLoading(false);
        }
    };

   if (loading) {
    return <SplashLoader message="Loading movies..." />;
}

    if (!purchase) {
        return (
            <SafeAreaView className="flex-1 bg-surface justify-center items-center">
                <Text>Purchase not found</Text>
            </SafeAreaView>
        );
    }

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

    const daysLeft = Math.max(0, Math.ceil((new Date(purchase.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    const isActive = purchase.status === "active" && daysLeft > 0;
    const sc = LICENSE_STATUS_COLOR(daysLeft, isActive);

    return (
        <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
            <Header title="Purchase Detail" showBack />

            <ScrollView className="flex-1 px-4 pt-4">
                {/* Movie poster + title */}
                <View className="bg-white p-4 rounded-xl mb-4 border border-gray-100 flex-row">
                    <View style={{ width: 80, height: 110, borderRadius: 8, overflow: "hidden", backgroundColor: "#1a1a2e", marginRight: 14 }}>
                        {purchase.movie?.poster ? (
                            <Image source={{ uri: purchase.movie.poster }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                        ) : (
                            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                                <Ionicons name="film-outline" size={32} color="#666" />
                            </View>
                        )}
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 17, fontWeight: "700", color: COLORS.primary, marginBottom: 4 }}>
                            {purchase.movie?.title}
                        </Text>
                        <Text style={{ fontSize: 12, color: COLORS.secondary, marginBottom: 8 }}>
                            {purchase.movie?.genre}
                        </Text>
                        <View style={{ backgroundColor: sc.bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" }}>
                            <Text style={{ fontSize: 12, fontWeight: "700", color: sc.text }}>{sc.label}</Text>
                        </View>
                    </View>
                </View>

                {/* License info */}
                <View className="bg-white p-4 rounded-xl mb-4 border border-gray-100">
                    <Text className="text-lg font-bold text-primary mb-4">License Details</Text>
                    {[
                        ["Purchase Date", formatDate(purchase.purchaseDate)],
                        ["Expiry Date", formatDate(purchase.expiryDate)],
                        ["Days Remaining", isActive ? `${daysLeft} days` : "Expired"],
                        ["Status", purchase.status.toUpperCase()],
                    ].map(([label, value]) => (
                        <View key={label} className="flex-row justify-between mb-3">
                            <Text className="text-secondary">{label}</Text>
                            <Text className="text-primary font-medium">{value}</Text>
                        </View>
                    ))}
                </View>

                {/* Payment info */}
                <View className="bg-white p-4 rounded-xl mb-4 border border-gray-100">
                    <Text className="text-lg font-bold text-primary mb-4">Payment</Text>
                    {[
                        ["Amount Paid", `₹${purchase.amountPaid}`],
                        ["Payment ID", purchase.razorpayPaymentId || "Pending"],
                        ["Order ID", purchase.razorpayOrderId],
                    ].map(([label, value]) => (
                        <View key={label} className="flex-row justify-between mb-3">
                            <Text className="text-secondary">{label}</Text>
                            <Text className="text-primary font-medium text-right flex-1 ml-4" numberOfLines={1}>{value}</Text>
                        </View>
                    ))}
                </View>

                {/* CTA */}
                <View className="pb-8">
                    {isActive ? (
                        <TouchableOpacity
                            onPress={() => router.push(`/player/${purchase.movie?._id}` as any)}
                            style={{ backgroundColor: COLORS.accent, borderRadius: 50, padding: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
                        >
                            <Ionicons name="play-circle-outline" size={22} color="#fff" />
                            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Watch Now</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            onPress={() => router.push(`/movie/${purchase.movie?._id}` as any)}
                            style={{ backgroundColor: COLORS.primary, borderRadius: 50, padding: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
                        >
                            <Ionicons name="refresh-outline" size={22} color="#fff" />
                            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Re-purchase</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}