import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "@/constants/api";
import { LICENSE_STATUS_COLOR_THEMED } from "@/constants";
import type { Purchase } from "@/constants/types";
import { useTheme } from "@/context/ThemeContext";
import SplashLoader from "@/components/SplashLoader";

export default function PurchaseDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { colors, isDark } = useTheme();
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

    if (loading) return <SplashLoader message="Loading purchase..." />;

    if (!purchase) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}>
                <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
                <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: "600", marginTop: 16 }}>Purchase not found</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
                    <Text style={{ color: colors.accent, fontSize: 14, fontWeight: "600" }}>Go back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

    const daysLeft = Math.max(0, Math.ceil((new Date(purchase.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    const isActive = purchase.status === "active" && daysLeft > 0;
    const sc = LICENSE_STATUS_COLOR_THEMED(daysLeft, isActive, isDark);

    const InfoRow = ({ label, value }: { label: string; value: string }) => (
        <View style={{
            flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
            paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: colors.divider,
        }}>
            <Text style={{ fontSize: 13, color: colors.textMuted, fontWeight: "500" }}>{label}</Text>
            <Text style={{ fontSize: 13, color: colors.textPrimary, fontWeight: "600", textAlign: "right", flex: 1, marginLeft: 16 }} numberOfLines={1}>
                {value}
            </Text>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
            <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
                {/* Header */}
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
                    <Text style={{ fontSize: 20, fontWeight: "800", color: colors.textPrimary }}>Purchase Detail</Text>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
                    {/* Movie hero card */}
                    <View style={{
                        backgroundColor: colors.card, borderRadius: 16, padding: 16,
                        borderWidth: 0.5, borderColor: colors.border,
                        flexDirection: "row", marginBottom: 16,
                    }}>
                        <View style={{
                            width: 90, height: 124, borderRadius: 10,
                            overflow: "hidden", backgroundColor: colors.surfaceVariant, marginRight: 16,
                        }}>
                            {purchase.movie?.poster ? (
                                <Image source={{ uri: purchase.movie.poster }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                            ) : (
                                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                                    <Ionicons name="film-outline" size={32} color={colors.textMuted} />
                                </View>
                            )}
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.textPrimary, marginBottom: 4 }}>
                                {purchase.movie?.title}
                            </Text>
                            <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 12 }}>
                                {purchase.movie?.genre}
                            </Text>
                            <View style={{ backgroundColor: sc.bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" }}>
                                <Text style={{ fontSize: 12, fontWeight: "700", color: sc.text }}>{sc.label}</Text>
                            </View>
                        </View>
                    </View>

                    {/* License details */}
                    <View style={{
                        backgroundColor: colors.card, borderRadius: 16, padding: 16,
                        borderWidth: 0.5, borderColor: colors.border, marginBottom: 16,
                    }}>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.textPrimary, marginBottom: 4 }}>
                            License Details
                        </Text>
                        <InfoRow label="Purchase Date" value={formatDate(purchase.purchaseDate)} />
                        <InfoRow label="Expiry Date" value={formatDate(purchase.expiryDate)} />
                        <InfoRow label="Days Remaining" value={isActive ? `${daysLeft} days` : "Expired"} />
                        <View style={{ paddingVertical: 12 }}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                <Text style={{ fontSize: 13, color: colors.textMuted, fontWeight: "500" }}>Status</Text>
                                <View style={{ backgroundColor: sc.bg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                                    <Text style={{ fontSize: 12, fontWeight: "700", color: sc.text }}>
                                        {purchase.status.toUpperCase()}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Payment details */}
                    <View style={{
                        backgroundColor: colors.card, borderRadius: 16, padding: 16,
                        borderWidth: 0.5, borderColor: colors.border, marginBottom: 24,
                    }}>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.textPrimary, marginBottom: 4 }}>
                            Payment
                        </Text>
                        <InfoRow label="Amount Paid" value={`₹${purchase.amountPaid}`} />
                        <InfoRow label="Payment ID" value={purchase.razorpayPaymentId || "Pending"} />
                        <View style={{ paddingVertical: 12 }}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <Text style={{ fontSize: 13, color: colors.textMuted, fontWeight: "500" }}>Order ID</Text>
                                <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: "right", flex: 1, marginLeft: 16 }} numberOfLines={1}>
                                    {purchase.razorpayOrderId}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* CTA */}
                    {isActive ? (
                        <TouchableOpacity
                            onPress={() => router.push(`/player/${purchase.movie?._id}` as any)}
                            style={{
                                backgroundColor: colors.accent, borderRadius: 14,
                                paddingVertical: 16, alignItems: "center",
                                flexDirection: "row", justifyContent: "center", gap: 8,
                            }}
                        >
                            <Ionicons name="play-circle-outline" size={22} color="#fff" />
                            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Watch Now</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            onPress={() => router.push(`/movie/${purchase.movie?._id}` as any)}
                            style={{
                                backgroundColor: colors.surfaceVariant, borderRadius: 14,
                                paddingVertical: 16, alignItems: "center",
                                borderWidth: 1, borderColor: colors.accent,
                                flexDirection: "row", justifyContent: "center", gap: 8,
                            }}
                        >
                            <Ionicons name="refresh-outline" size={22} color={colors.accent} />
                            <Text style={{ color: colors.accent, fontWeight: "700", fontSize: 16 }}>Re-purchase</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}