import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/constants";
import { useLicense } from "@/context/LicenseContext";

export default function PaymentCallback() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { fetchLicenses } = useLicense();

    const status = params.status as string;
    const movieId = params.movie_id as string;
    const reason = params.reason as string;

    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (status === "success") {
            setRefreshing(true);
            fetchLicenses().finally(() => setRefreshing(false));
        }
    }, [status]);

    if (refreshing) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
                <ActivityIndicator size="large" color={COLORS.accent} />
                <Text style={{ color: COLORS.secondary, marginTop: 12 }}>Activating your license...</Text>
            </SafeAreaView>
        );
    }

    if (status === "success") {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
                <TouchableOpacity
                    onPress={() => router.replace("/(tabs)/library")}
                    style={{
                        position: "absolute", top: 16, left: 16, zIndex: 10,
                        width: 40, height: 40, borderRadius: 20,
                        backgroundColor: "#f5f5f5",
                        justifyContent: "center", alignItems: "center",
                    }}
                >
                    <Ionicons name="arrow-back" size={22} color={COLORS.primary} />
                </TouchableOpacity>

                <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
                    <View style={{
                        width: 80, height: 80, borderRadius: 40,
                        backgroundColor: "#e8f8f0",
                        justifyContent: "center", alignItems: "center", marginBottom: 20,
                    }}>
                        <Ionicons name="checkmark-circle" size={48} color="#1d9e75" />
                    </View>
                    <Text style={{ fontSize: 22, fontWeight: "700", color: COLORS.primary, marginBottom: 8 }}>
                        Payment Successful!
                    </Text>
                    <Text style={{ fontSize: 14, color: COLORS.secondary, textAlign: "center", marginBottom: 32 }}>
                        Your movie access has been activated. Enjoy watching!
                    </Text>

                    <TouchableOpacity
                        onPress={() => {
                            if (movieId) {
                                router.replace(`/player/${movieId}` as any);
                            } else {
                                router.replace("/(tabs)/library");
                            }
                        }}
                        style={{
                            backgroundColor: COLORS.accent, borderRadius: 50,
                            paddingVertical: 14, paddingHorizontal: 32,
                            flexDirection: "row", alignItems: "center", gap: 8,
                            marginBottom: 12,
                        }}
                    >
                        <Ionicons name="play-circle" size={20} color="#fff" />
                        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Watch Now</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.replace("/(tabs)/library")}>
                        <Text style={{ color: COLORS.secondary, fontSize: 14 }}>Go to My Library</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
            <TouchableOpacity
                onPress={() => router.back()}
                style={{
                    position: "absolute", top: 16, left: 16, zIndex: 10,
                    width: 40, height: 40, borderRadius: 20,
                    backgroundColor: "#f5f5f5",
                    justifyContent: "center", alignItems: "center",
                }}
            >
                <Ionicons name="arrow-back" size={22} color={COLORS.primary} />
            </TouchableOpacity>

            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
                <View style={{
                    width: 80, height: 80, borderRadius: 40,
                    backgroundColor: "#fcebeb",
                    justifyContent: "center", alignItems: "center", marginBottom: 20,
                }}>
                    <Ionicons name="close-circle" size={48} color="#e24b4a" />
                </View>
                <Text style={{ fontSize: 22, fontWeight: "700", color: COLORS.primary, marginBottom: 8 }}>
                    {status === "cancelled" ? "Payment Cancelled" : "Payment Failed"}
                </Text>
                <Text style={{ fontSize: 14, color: COLORS.secondary, textAlign: "center", marginBottom: 32 }}>
                    {status === "cancelled"
                        ? "You cancelled the payment. No charges were made."
                        : `Something went wrong. ${reason ? `(${reason})` : "Please try again."}`}
                </Text>

                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{
                        backgroundColor: COLORS.primary, borderRadius: 50,
                        paddingVertical: 14, paddingHorizontal: 32,
                        marginBottom: 12,
                    }}
                >
                    <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Try Again</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.replace("/")}>
                    <Text style={{ color: COLORS.secondary, fontSize: 14 }}>Go Home</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}