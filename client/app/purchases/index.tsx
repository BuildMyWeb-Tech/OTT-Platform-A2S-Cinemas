import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator, FlatList, Image,
    Text, TouchableOpacity, View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/Header";
import api from "@/constants/api";
import { COLORS, LICENSE_STATUS_COLOR } from "@/constants";
import type { Purchase } from "@/constants/types";
import { useAuth } from "@/context/AuthContext";

export default function Purchases() {
    const router = useRouter();
    const { isSignedIn } = useAuth();
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

    return (
        <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
            <Header title="Purchase History" showBack />

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color={COLORS.accent} />
                </View>
            ) : purchases.length === 0 ? (
                <View className="flex-1 justify-center items-center px-8">
                    <Ionicons name="receipt-outline" size={64} color={COLORS.secondary} />
                    <Text className="text-primary font-bold text-xl mt-4 mb-2">No purchases yet</Text>
                    <Text className="text-secondary text-center">
                        Browse movies and buy access to start watching
                    </Text>
                    <TouchableOpacity
                        onPress={() => router.push("/browse" as any)}
                        className="mt-6 bg-primary px-8 py-3 rounded-full"
                    >
                        <Text className="text-white font-bold">Browse Movies</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={purchases}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={{ padding: 16 }}
                    renderItem={({ item }) => {
                        const daysLeft = getDaysLeft(item.expiryDate);
                        const isActive = item.status === "active" && daysLeft > 0;
                        const sc = LICENSE_STATUS_COLOR(daysLeft, isActive);

                        return (
                            <TouchableOpacity
                                onPress={() => router.push(`/purchases/${item._id}` as any)}
                                className="bg-white p-4 rounded-xl mb-4 border border-gray-100 flex-row"
                            >
                                {/* Poster */}
                                <View style={{ width: 64, height: 88, borderRadius: 8, overflow: "hidden", backgroundColor: "#1a1a2e", marginRight: 12 }}>
                                    {item.movie?.poster ? (
                                        <Image source={{ uri: item.movie.poster }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                                    ) : (
                                        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                                            <Ionicons name="film-outline" size={28} color="#666" />
                                        </View>
                                    )}
                                </View>

                                {/* Info */}
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 15, fontWeight: "600", color: COLORS.primary, marginBottom: 4 }} numberOfLines={1}>
                                        {item.movie?.title || "Movie"}
                                    </Text>
                                    <Text style={{ fontSize: 12, color: COLORS.secondary, marginBottom: 4 }}>
                                        Purchased: {formatDate(item.purchaseDate)}
                                    </Text>
                                    <Text style={{ fontSize: 12, color: COLORS.secondary, marginBottom: 8 }}>
                                        Expires: {formatDate(item.expiryDate)}
                                    </Text>
                                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                        <View style={{ backgroundColor: sc.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                                            <Text style={{ fontSize: 11, fontWeight: "700", color: sc.text }}>{sc.label}</Text>
                                        </View>
                                        <Text style={{ fontSize: 14, fontWeight: "700", color: COLORS.primary }}>
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
    );
}