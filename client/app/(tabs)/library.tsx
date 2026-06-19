import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator, FlatList, Image,
    Text, TouchableOpacity, View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, LICENSE_STATUS_COLOR } from "@/constants";
import { useLicense } from "@/context/LicenseContext";
import { useAuth } from "@/context/AuthContext";
import { License } from "@/constants/types";

type Tab = "active" | "expired";

export default function Library() {
    const router = useRouter();
    const { isSignedIn } = useAuth();
    const { activeLicenses, expiredLicenses, isLoading, fetchLicenses } = useLicense();
    const [tab, setTab] = useState<Tab>("active");

    const displayed = tab === "active" ? activeLicenses : expiredLicenses;

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

    if (!isSignedIn) {
        return (
            <SafeAreaView className="flex-1 bg-white justify-center items-center px-8" edges={["top"]}>
                <Ionicons name="library-outline" size={64} color={COLORS.secondary} />
                <Text className="text-primary font-bold text-xl mt-4 mb-2">Your Library</Text>
                <Text className="text-secondary text-center mb-6">
                    Sign in to access your purchased movies
                </Text>
                <TouchableOpacity
                    onPress={() => router.push("/sign-in")}
                    style={{ backgroundColor: COLORS.primary, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 50 }}
                >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>Sign In</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
            {/* Header */}
            <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
                <Text style={{ fontSize: 22, fontWeight: "700", color: COLORS.primary }}>My Library</Text>
                <Text style={{ fontSize: 13, color: COLORS.secondary, marginTop: 2 }}>
                    {activeLicenses.length} active · {expiredLicenses.length} expired
                </Text>
            </View>

            {/* Tabs */}
            <View style={{ flexDirection: "row", paddingHorizontal: 16, marginBottom: 12, gap: 8 }}>
                {(["active", "expired"] as Tab[]).map((t) => {
                    const count = t === "active" ? activeLicenses.length : expiredLicenses.length;
                    return (
                        <TouchableOpacity
                            key={t}
                            onPress={() => setTab(t)}
                            style={{
                                flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center",
                                backgroundColor: tab === t ? COLORS.primary : "#f0f0f0",
                            }}
                        >
                            <Text style={{
                                fontWeight: "600", fontSize: 13,
                                color: tab === t ? "#fff" : COLORS.secondary,
                                textTransform: "capitalize",
                            }}>
                                {t} ({count})
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {isLoading ? (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <ActivityIndicator size="large" color={COLORS.accent} />
                </View>
            ) : (
                <FlatList
                    data={displayed}
                    keyExtractor={(item) => item._id}
                    onRefresh={fetchLicenses}
                    refreshing={isLoading}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
                    renderItem={({ item }: { item: License }) => {
                        const movie = item.movie;
                        const sc = LICENSE_STATUS_COLOR(item.daysLeft, item.isActive && !item.isRevoked);
                        const movieId = typeof movie === "string" ? movie : movie?._id;
                        const poster = typeof movie === "string" ? undefined : movie?.poster;
                        const title = typeof movie === "string" ? "Movie" : (movie?.title ?? "Movie");
                        const genre = typeof movie === "string" ? "" : (movie?.genre ?? "");
                        const isWatchable = item.isActive && !item.isRevoked;

                        return (
                            <TouchableOpacity
                                onPress={() => router.push(`/movie/${movieId}` as any)}
                                activeOpacity={0.85}
                                style={{
                                    backgroundColor: "#fff", borderRadius: 12, marginBottom: 12,
                                    borderWidth: 0.5, borderColor: "#eee", flexDirection: "row",
                                    overflow: "hidden",
                                }}
                            >
                                {/* Poster */}
                                <View style={{ width: 90, height: 120, backgroundColor: "#1a1a2e" }}>
                                    {poster ? (
                                        <Image source={{ uri: poster }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                                    ) : (
                                        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                                            <Ionicons name="film-outline" size={32} color="#666" />
                                        </View>
                                    )}
                                </View>

                                {/* Info */}
                                <View style={{ flex: 1, padding: 12 }}>
                                    <Text style={{ fontSize: 15, fontWeight: "600", color: COLORS.primary, marginBottom: 2 }} numberOfLines={1}>
                                        {title}
                                    </Text>
                                    <Text style={{ fontSize: 12, color: COLORS.secondary, marginBottom: 6 }}>{genre}</Text>

                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
                                        <View style={{ backgroundColor: sc.bg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                                            <Text style={{ fontSize: 11, fontWeight: "700", color: sc.text }}>{sc.label}</Text>
                                        </View>
                                        <Text style={{ fontSize: 11, color: COLORS.secondary }}>
                                            {isWatchable
                                                ? `Expires ${formatDate(item.expiryDate)}`
                                                : `Expired ${formatDate(item.expiryDate)}`}
                                        </Text>
                                    </View>

                                    {isWatchable ? (
                                        <TouchableOpacity
                                            onPress={(e) => {
                                                router.push(`/player/${movieId}` as any);
                                            }}
                                            style={{
                                                backgroundColor: COLORS.accent, borderRadius: 8,
                                                paddingVertical: 8, paddingHorizontal: 14,
                                                flexDirection: "row", alignItems: "center", gap: 6,
                                                alignSelf: "flex-start",
                                            }}
                                        >
                                            <Ionicons name="play" size={14} color="#fff" />
                                            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>Watch Now</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <TouchableOpacity
                                            onPress={(e) => {
                                                router.push(`/movie/${movieId}` as any);
                                            }}
                                            style={{
                                                backgroundColor: COLORS.primary, borderRadius: 8,
                                                paddingVertical: 8, paddingHorizontal: 14,
                                                flexDirection: "row", alignItems: "center", gap: 6,
                                                alignSelf: "flex-start",
                                            }}
                                        >
                                            <Ionicons name="refresh-outline" size={14} color="#fff" />
                                            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>Re-purchase</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                    ListEmptyComponent={
                        <View style={{ alignItems: "center", paddingTop: 60 }}>
                            <Ionicons
                                name={tab === "active" ? "play-circle-outline" : "time-outline"}
                                size={56} color={COLORS.secondary}
                            />
                            <Text style={{ color: COLORS.primary, fontWeight: "600", fontSize: 16, marginTop: 12 }}>
                                {tab === "active" ? "No active movies" : "No expired movies"}
                            </Text>
                            {tab === "active" && (
                                <TouchableOpacity
                                    onPress={() => router.push("/browse" as any)}
                                    style={{ marginTop: 16, backgroundColor: COLORS.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 50 }}
                                >
                                    <Text style={{ color: "#fff", fontWeight: "700" }}>Browse Movies</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}