import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator, Dimensions, FlatList, Image,
    StatusBar, Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/context/ThemeContext";
import { useLicense } from "@/context/LicenseContext";
import { useAuth } from "@/context/AuthContext";
import { License } from "@/constants/types";
import SplashLoader from "@/components/SplashLoader";

const { width } = Dimensions.get("window");
const CARD_W = (width - 48) / 2;
const CARD_H = CARD_W * 1.45;

type Tab = "active" | "expired";

export default function Library() {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const { isSignedIn } = useAuth();
    const { activeLicenses, expiredLicenses, isLoading, fetchLicenses } = useLicense();
    const [tab, setTab] = useState<Tab>("active");

    const displayed = tab === "active" ? activeLicenses : expiredLicenses;

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

    const getDaysLeftColor = (daysLeft: number, isActive: boolean) => {
        if (!isActive) return colors.error;
        if (daysLeft <= 3) return "#FF6B35";
        if (daysLeft <= 7) return colors.warning;
        return colors.success;
    };

    // ── GUEST ─────────────────────────────────────────────────────────────────
    if (!isSignedIn) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.background }}>
                <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
                <SafeAreaView edges={["top"]} style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }}>
                    <View style={{
                        width: 80, height: 80, borderRadius: 40,
                        backgroundColor: colors.surfaceVariant,
                        justifyContent: "center", alignItems: "center", marginBottom: 20,
                    }}>
                        <Ionicons name="library-outline" size={36} color={colors.textMuted} />
                    </View>
                    <Text style={{ fontSize: 20, fontWeight: "700", color: colors.textPrimary, marginBottom: 10 }}>
                        Your Library
                    </Text>
                    <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center", lineHeight: 21, marginBottom: 32 }}>
                        Sign in to access your purchased movies and watch history.
                    </Text>
                    <TouchableOpacity
                        onPress={() => router.push("/sign-in")}
                        style={{
                            backgroundColor: colors.accent, borderRadius: 14,
                            paddingVertical: 15, width: "100%", alignItems: "center",
                        }}
                    >
                        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Sign In</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </View>
        );
    }

    // ── MAIN ──────────────────────────────────────────────────────────────────
    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
            <SafeAreaView edges={["top"]} style={{ flex: 1 }}>

                {/* ── HEADER ── */}
                <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
                    <Text style={{ fontSize: 26, fontWeight: "800", color: colors.textPrimary, marginBottom: 4 }}>
                        My Library
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.textMuted }}>
                        {activeLicenses.length} active · {expiredLicenses.length} expired
                    </Text>
                </View>

                {/* ── TABS ── */}
                <View style={{
                    flexDirection: "row", paddingHorizontal: 20,
                    marginBottom: 16, gap: 10,
                }}>
                    {(["active", "expired"] as Tab[]).map((t) => {
                        const count = t === "active" ? activeLicenses.length : expiredLicenses.length;
                        const isSelected = tab === t;
                        return (
                            <TouchableOpacity
                                key={t}
                                onPress={() => setTab(t)}
                                style={{
                                    flex: 1, paddingVertical: 12,
                                    borderRadius: 12, alignItems: "center",
                                    backgroundColor: isSelected ? colors.accent : colors.surfaceVariant,
                                    borderWidth: 0.5,
                                    borderColor: isSelected ? colors.accent : colors.border,
                                    flexDirection: "row", justifyContent: "center", gap: 6,
                                }}
                            >
                                <Ionicons
                                    name={t === "active" ? "play-circle-outline" : "time-outline"}
                                    size={15}
                                    color={isSelected ? "#fff" : colors.textSecondary}
                                />
                                <Text style={{
                                    fontWeight: "700", fontSize: 13,
                                    color: isSelected ? "#fff" : colors.textSecondary,
                                    textTransform: "capitalize",
                                }}>
                                    {t} ({count})
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* ── CONTENT ── */}
               {isLoading ? (
    <SplashLoader message="Loading your library..." />
) : (
                    <FlatList
                        data={displayed}
                        keyExtractor={(item) => item._id}
                        numColumns={2}
                        onRefresh={fetchLicenses}
                        refreshing={isLoading}
                        columnWrapperStyle={{ paddingHorizontal: 16, gap: 16 }}
                        contentContainerStyle={{ paddingBottom: 32, paddingTop: 4 }}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <LibraryCard
                                license={item}
                                colors={colors}
                                isDark={isDark}
                                tab={tab}
                                onWatch={() => {
                                    const movieId = typeof item.movie === "string" ? item.movie : item.movie?._id;
                                    router.push(`/player/${movieId}` as any);
                                }}
                                onDetail={() => {
                                    const movieId = typeof item.movie === "string" ? item.movie : item.movie?._id;
                                    router.push(`/movie/${movieId}` as any);
                                }}
                                getDaysLeftColor={getDaysLeftColor}
                                formatDate={formatDate}
                            />
                        )}
                        ListEmptyComponent={(
                            <View style={{ alignItems: "center", paddingTop: 80, paddingHorizontal: 32 }}>
                                <View style={{
                                    width: 80, height: 80, borderRadius: 40,
                                    backgroundColor: colors.surfaceVariant,
                                    justifyContent: "center", alignItems: "center", marginBottom: 18,
                                }}>
                                    <Ionicons
                                        name={tab === "active" ? "play-circle-outline" : "time-outline"}
                                        size={36} color={colors.textMuted}
                                    />
                                </View>
                                <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: "700", marginBottom: 10 }}>
                                    {tab === "active" ? "No active movies" : "No expired movies"}
                                </Text>
                                <Text style={{ color: colors.textMuted, fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 24 }}>
                                    {tab === "active"
                                        ? "Movies you purchase will appear here."
                                        : "Expired licenses will be listed here."}
                                </Text>
                                {tab === "active" && (
                                    <TouchableOpacity
                                        onPress={() => router.push("/browse" as any)}
                                        style={{
                                            backgroundColor: colors.accent, borderRadius: 12,
                                            paddingHorizontal: 28, paddingVertical: 13,
                                        }}
                                    >
                                        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
                                            Browse Movies
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    />
                )}
            </SafeAreaView>
        </View>
    );
}

// ── LIBRARY CARD ──────────────────────────────────────────────────────────────
function LibraryCard({ license, colors, isDark, tab, onWatch, onDetail, getDaysLeftColor, formatDate }: {
    license: License; colors: any; isDark: boolean; tab: Tab;
    onWatch: () => void; onDetail: () => void;
    getDaysLeftColor: (d: number, a: boolean) => string;
    formatDate: (d: string) => string;
}) {
    const movie = license.movie;
    const poster = typeof movie === "string" ? undefined : movie?.poster;
    const title = typeof movie === "string" ? "Movie" : (movie?.title ?? "Movie");
    const isWatchable = license.isActive && !license.isRevoked;
    const daysColor = getDaysLeftColor(license.daysLeft, isWatchable);

    return (
        <TouchableOpacity
            onPress={onDetail}
            activeOpacity={0.85}
            style={{ width: CARD_W, marginBottom: 16 }}
        >
            {/* Poster */}
            <View style={{
                width: CARD_W, height: CARD_H,
                borderRadius: 12, overflow: "hidden",
                backgroundColor: colors.card,
            }}>
                {poster ? (
                    <Image
                        source={{ uri: poster }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.surfaceVariant }}>
                        <Ionicons name="film-outline" size={36} color={colors.textMuted} />
                    </View>
                )}

                {/* Gradient overlay */}
                <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.85)"]}
                    locations={[0.45, 1]}
                    style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: CARD_H * 0.55 }}
                />

                {/* Expired overlay */}
                {!isWatchable && (
                    <View style={{
                        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.45)",
                        justifyContent: "center", alignItems: "center",
                    }}>
                        <View style={{
                            backgroundColor: "rgba(0,0,0,0.75)",
                            borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
                        }}>
                            <Text style={{ color: "#FF6B6B", fontSize: 11, fontWeight: "700" }}>EXPIRED</Text>
                        </View>
                    </View>
                )}

                {/* Days left badge */}
                {isWatchable && (
                    <View style={{
                        position: "absolute", top: 8, right: 8,
                        backgroundColor: daysColor + "22",
                        borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
                        borderWidth: 1, borderColor: daysColor + "55",
                    }}>
                        <Text style={{ color: daysColor, fontSize: 10, fontWeight: "700" }}>
                            {license.daysLeft}d
                        </Text>
                    </View>
                )}

                {/* Bottom info inside card */}
                <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 10 }}>
                    <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700", marginBottom: 6 }} numberOfLines={2}>
                        {title}
                    </Text>

                    {/* Watch / Re-purchase button */}
                    {isWatchable ? (
                        <TouchableOpacity
                            onPress={(e) => { e.stopPropagation?.(); onWatch(); }}
                            style={{
                                backgroundColor: colors.accent,
                                borderRadius: 7, paddingVertical: 7,
                                flexDirection: "row", alignItems: "center",
                                justifyContent: "center", gap: 5,
                            }}
                        >
                            <Ionicons name="play" size={12} color="#fff" />
                            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>Watch</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            onPress={(e) => { e.stopPropagation?.(); onDetail(); }}
                            style={{
                                backgroundColor: "rgba(255,255,255,0.15)",
                                borderRadius: 7, paddingVertical: 7,
                                borderWidth: 0.5, borderColor: "rgba(255,255,255,0.3)",
                                flexDirection: "row", alignItems: "center",
                                justifyContent: "center", gap: 5,
                            }}
                        >
                            <Ionicons name="refresh-outline" size={12} color="#fff" />
                            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>Renew</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Expiry text below card */}
            <Text style={{
                color: colors.textMuted, fontSize: 11,
                marginTop: 6, textAlign: "center",
            }}>
                {isWatchable ? `Expires ${formatDate(license.expiryDate)}` : `Expired ${formatDate(license.expiryDate)}`}
            </Text>
        </TouchableOpacity>
    );
}