import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator, FlatList, Image,
    StatusBar, Text, TouchableOpacity, View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "@/constants/api";
import { LICENSE_STATUS_COLOR_THEMED } from "@/constants";
import type { Purchase } from "@/constants/types";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import SplashLoader from "@/components/SplashLoader";

export default function Purchases() {
    const router = useRouter();
    const { isSignedIn } = useAuth();
    const { colors, isDark } = useTheme();
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isSignedIn) fetchPurchases();
        else setLoading(false);
    }, [isSignedIn]);

    const fetchPurchases = async () => {
        try {
            const { data } = await api.get("/purchases/my");
            setPurchases(data.data || []);
        } catch (error) {
            console.error("Error fetching purchases:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

    const getDaysLeft = (expiryDate: string) =>
        Math.max(0, Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

    if (loading) return <SplashLoader message="Loading purchases..." />;

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
                    <Text style={{ fontSize: 20, fontWeight: "800", color: colors.textPrimary }}>
                        Purchase History
                    </Text>
                </View>

                {purchases.length === 0 ? (
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }}>
                        <View style={{
                            width: 80, height: 80, borderRadius: 40,
                            backgroundColor: colors.surfaceVariant,
                            justifyContent: "center", alignItems: "center", marginBottom: 18,
                        }}>
                            <Ionicons name="receipt-outline" size={36} color={colors.textMuted} />
                        </View>
                        <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
                            No purchases yet
                        </Text>
                        <Text style={{ color: colors.textSecondary, textAlign: "center", lineHeight: 20, marginBottom: 28 }}>
                            Browse movies and buy access to start watching
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.push("/browse" as any)}
                            style={{ backgroundColor: colors.accent, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 13 }}
                        >
                            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Browse Movies</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={purchases}
                        keyExtractor={(item) => item._id}
                        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => {
                            const daysLeft = getDaysLeft(item.expiryDate);
                            const isActive = item.status === "active" && daysLeft > 0;
                            const sc = LICENSE_STATUS_COLOR_THEMED(daysLeft, isActive, isDark);

                            return (
                                <TouchableOpacity
                                    onPress={() => router.push(`/purchases/${item._id}` as any)}
                                    style={{
                                        backgroundColor: colors.card,
                                        borderRadius: 16, marginBottom: 12, padding: 14,
                                        borderWidth: 0.5, borderColor: colors.border,
                                        flexDirection: "row",
                                    }}
                                    activeOpacity={0.8}
                                >
                                    {/* Poster */}
                                    <View style={{
                                        width: 70, height: 95, borderRadius: 10,
                                        overflow: "hidden", backgroundColor: colors.surfaceVariant, marginRight: 14,
                                    }}>
                                        {item.movie?.poster ? (
                                            <Image source={{ uri: item.movie.poster }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                                        ) : (
                                            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                                                <Ionicons name="film-outline" size={28} color={colors.textMuted} />
                                            </View>
                                        )}
                                    </View>

                                    {/* Info */}
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.textPrimary, marginBottom: 4 }} numberOfLines={1}>
                                            {item.movie?.title || "Movie"}
                                        </Text>
                                        <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 2 }}>
                                            Purchased: {formatDate(item.purchaseDate)}
                                        </Text>
                                        <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 10 }}>
                                            Expires: {formatDate(item.expiryDate)}
                                        </Text>
                                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                            <View style={{ backgroundColor: sc.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                                                <Text style={{ fontSize: 11, fontWeight: "700", color: sc.text }}>{sc.label}</Text>
                                            </View>
                                            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textPrimary }}>
                                                ₹{item.amountPaid}
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        }}
                    />
                )}
            </SafeAreaView>
        </View>
    );
}