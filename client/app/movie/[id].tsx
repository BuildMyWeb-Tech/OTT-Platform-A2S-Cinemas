import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator, Alert, Dimensions,
    Image, ScrollView, Text, TouchableOpacity, View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import api from "@/constants/api";
import { COLORS } from "@/constants";
import { Movie, LicenseCheckResponse } from "@/constants/types";
import { useAuth } from "@/context/AuthContext";
import { useLicense } from "@/context/LicenseContext";

const { width } = Dimensions.get("window");

export default function MovieDetail() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user, isSignedIn } = useAuth();
    const { hasLicense, getDaysLeft, fetchLicenses } = useLicense();

    const [movie, setMovie] = useState<Movie | null>(null);
    const [loading, setLoading] = useState(true);
    const [buyLoading, setBuyLoading] = useState(false);
    const [checkingPayment, setCheckingPayment] = useState(false);

    const owned = id ? hasLicense(id) : false;
    const daysLeft = id ? getDaysLeft(id) : 0;

    useEffect(() => {
        if (id) fetchMovie();
    }, [id]);

    const fetchMovie = async () => {
        try {
            const { data } = await api.get(`/movies/${id}`);
            setMovie(data.data);
        } catch (error) {
            console.error("Failed to fetch movie:", error);
        } finally {
            setLoading(false);
        }
    };

const handleBuy = async () => {
    if (!isSignedIn) {
        return Alert.alert(
            "Sign in required",
            "Please sign in to purchase movies",
            [
                { text: "Sign In", onPress: () => router.push("/sign-in") },
                { text: "Cancel", style: "cancel" },
            ]
        );
    }

    setBuyLoading(true);

    try {
        const orderRes = await api.post("/payment/create-order", {
            movieId: id,
        });

        if (!orderRes.data.success) {
            Alert.alert(
                "Error",
                orderRes.data.message || "Failed to create order"
            );
            return;
        }

        const { orderId, amount, currency, key } =
            orderRes.data.data;

        const serverIp =
            process.env.EXPO_PUBLIC_SERVER_IP ||
            "192.168.1.10";

        const port =
            process.env.EXPO_PUBLIC_API_PORT || "5000";

        const payUrl =
            `http://${serverIp}:${port}/api/payment/pay/${orderId}` +
            `?amount=${amount}` +
            `&currency=${currency || "INR"}` +
            `&key=${key}` +
            `&movieTitle=${encodeURIComponent(movie?.title || "")}` +
            `&movieId=${id}`;

        // Opens Razorpay payment page
        await WebBrowser.openBrowserAsync(payUrl, {
            dismissButtonStyle: "close",
        });

        // Browser closed → check payment status
        setCheckingPayment(true);

        let attempts = 0;
        const maxAttempts = 6;

        const checkLicense = async (): Promise<boolean> => {
            try {
                const res = await api.get(`/license/check/${id}`);
                return res.data.hasAccess === true;
            } catch {
                return false;
            }
        };

        const poll = async () => {
            while (attempts < maxAttempts) {
                const hasAccess = await checkLicense();

                if (hasAccess) {
                    // Refresh license context
                    await fetchLicenses();

                    // Re-fetch movie
                    await fetchMovie();

                    // Navigate to callback success screen
                    router.replace({
                        pathname: "/payment/callback",
                        params: {
                            status: "success",
                            movie_id: id as string,
                        },
                    } as any);

                    return;
                }

                attempts++;

                await new Promise((resolve) =>
                    setTimeout(resolve, 1000)
                );
            }

            // Probably cancelled
            Alert.alert(
                "Payment not completed",
                "You can try again anytime."
            );
        };

        await poll();
    } catch (error: any) {
        console.error("Payment error:", error);

        Alert.alert(
            "Payment failed",
            "Something went wrong. Please try again."
        );
    } finally {
        setCheckingPayment(false);
        setBuyLoading(false);
    }
};

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color={COLORS.accent} />
            </SafeAreaView>
        );
    }

    if (!movie) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <Text>Movie not found</Text>
            </SafeAreaView>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#fff" }}>
            <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
                {/* Poster */}
                <View style={{ height: 320, backgroundColor: "#1a1a2e", position: "relative" }}>
                    <Image
                        source={{ uri: movie.poster }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                    />
                    {/* Gradient overlay */}
                    <View style={{
                        position: "absolute", bottom: 0, left: 0, right: 0, height: 120,
                        backgroundColor: "rgba(0,0,0,0.6)",
                    }} />

                    {/* Back button */}
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{
                            position: "absolute", top: 52, left: 16,
                            width: 40, height: 40, borderRadius: 20,
                            backgroundColor: "rgba(0,0,0,0.5)",
                            justifyContent: "center", alignItems: "center",
                        }}
                    >
                        <Ionicons name="arrow-back" size={22} color="#fff" />
                    </TouchableOpacity>

                    {/* Owned badge */}
                    {owned && (
                        <View style={{
                            position: "absolute", top: 52, right: 16,
                            backgroundColor: "#1d9e75", borderRadius: 8,
                            paddingHorizontal: 10, paddingVertical: 4,
                        }}>
                            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
                                OWNED · {daysLeft}d left
                            </Text>
                        </View>
                    )}
                </View>

                {/* Info */}
                <View style={{ padding: 16 }}>
                    <Text style={{ fontSize: 24, fontWeight: "700", color: COLORS.primary, marginBottom: 8 }}>
                        {movie.title}
                    </Text>

                    {/* Meta row */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
                        <View style={{ backgroundColor: "#f0f0f0", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 }}>
                            <Text style={{ fontSize: 12, color: COLORS.primary, fontWeight: "600" }}>{movie.genre}</Text>
                        </View>
                        {movie.duration && (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                <Ionicons name="time-outline" size={14} color={COLORS.secondary} />
                                <Text style={{ fontSize: 12, color: COLORS.secondary }}>{movie.duration} min</Text>
                            </View>
                        )}
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <Ionicons name="star" size={14} color="#FFD700" />
                            <Text style={{ fontSize: 12, color: COLORS.secondary }}>
                                {movie.ratings.average.toFixed(1)} ({movie.ratings.count})
                            </Text>
                        </View>
                    </View>

                    {/* Access info */}
                    <View style={{
                        backgroundColor: "#f8f8f8", borderRadius: 10, padding: 12,
                        flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 10,
                    }}>
                        <Ionicons name="key-outline" size={18} color={COLORS.primary} />
                        <Text style={{ fontSize: 13, color: COLORS.secondary, flex: 1 }}>
                            {owned
                                ? `You have ${daysLeft} days of access remaining`
                                : `₹${movie.price} · ${movie.expiryDays} days access`}
                        </Text>
                    </View>

                    {/* Description */}
                    <Text style={{ fontSize: 15, fontWeight: "600", color: COLORS.primary, marginBottom: 8 }}>
                        About
                    </Text>
                    <Text style={{ fontSize: 14, color: COLORS.secondary, lineHeight: 22 }}>
                        {movie.description}
                    </Text>
                </View>
            </ScrollView>

            {/* Sticky CTA */}
            <View style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                backgroundColor: "#fff", padding: 16,
                borderTopWidth: 0.5, borderTopColor: "#eee",
                flexDirection: "row", gap: 12,
            }}>
                {owned ? (
                    <TouchableOpacity
                        onPress={() => router.push(`/player/${movie._id}` as any)}
                        style={{
                            flex: 1, backgroundColor: COLORS.accent, borderRadius: 50,
                            paddingVertical: 16, alignItems: "center",
                            flexDirection: "row", justifyContent: "center", gap: 8,
                        }}
                    >
                        <Ionicons name="play-circle" size={22} color="#fff" />
                        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Watch Now</Text>
                    </TouchableOpacity>
                ) : (
                    <>
                        <View style={{ flex: 1, justifyContent: "center" }}>
                            <Text style={{ fontSize: 20, fontWeight: "700", color: COLORS.primary }}>₹{movie.price}</Text>
                            <Text style={{ fontSize: 12, color: COLORS.secondary }}>{movie.expiryDays} days access</Text>
                        </View>
                        <TouchableOpacity
                            onPress={handleBuy}
                            disabled={buyLoading}
                            style={{
                                flex: 1.5, backgroundColor: COLORS.primary, borderRadius: 50,
                                paddingVertical: 16, alignItems: "center",
                                flexDirection: "row", justifyContent: "center", gap: 8,
                            }}
                        >
                            {buyLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="bag-outline" size={20} color="#fff" />
                                    <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Buy Access</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </>
                )}
            </View>
            {checkingPayment && (
    <View
        style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 100,
        }}
    >
        <ActivityIndicator
            size="large"
            color={COLORS.accent}
        />

        <Text
            style={{
                color: "#fff",
                marginTop: 12,
                fontSize: 14,
                fontWeight: "600",
            }}
        >
            Verifying payment...
        </Text>
    </View>
)}
        </View>
    );
}