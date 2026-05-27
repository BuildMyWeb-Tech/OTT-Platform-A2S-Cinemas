import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator, Alert, StatusBar,
    Text, TouchableOpacity, View
} from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import api from "@/constants/api";
import { COLORS } from "@/constants";

export default function Player() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const [streamUrl, setStreamUrl] = useState<string | null>(null);
    const [licenseExpiry, setLicenseExpiry] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showControls, setShowControls] = useState(true);

    useEffect(() => {
        if (id) fetchStreamUrl();
    }, [id]);

    const fetchStreamUrl = async () => {
        try {
            // Step 1: check license
            const licenseRes = await api.get(`/license/check/${id}`);
            if (!licenseRes.data.hasAccess) {
                Alert.alert(
                    "No Access",
                    "You need to purchase this movie to watch it.",
                    [
                        { text: "Buy Now", onPress: () => router.back() },
                        { text: "Cancel", style: "cancel", onPress: () => router.back() },
                    ]
                );
                return;
            }
            setLicenseExpiry(licenseRes.data.expiresAt);

            // Step 2: try stream endpoint
            try {
                const streamRes = await api.get(`/stream/${id}`);
                if (streamRes.data.success && streamRes.data.data?.streamUrl) {
                    setStreamUrl(streamRes.data.data.streamUrl);
                    return;
                }
            } catch {
                // Stream endpoint failed (no CloudFront configured) — fall back to trailer
            }

            // Step 3: fallback — get movie trailerUrl for testing
            try {
                const movieRes = await api.get(`/movies/${id}`);
                const trailerUrl = movieRes.data.data?.trailerUrl;
                if (trailerUrl) {
                    setStreamUrl(trailerUrl);
                    return;
                }
            } catch {
                // ignore
            }

            setError("Video not available. AWS CloudFront not configured.");
        } catch (err: any) {
            const code = err.response?.data?.code;
            if (code === "LICENSE_REQUIRED") {
                Alert.alert(
                    "No Access",
                    "Purchase this movie to watch it.",
                    [
                        { text: "Buy Now", onPress: () => router.back() },
                        { text: "Cancel", style: "cancel", onPress: () => router.back() },
                    ]
                );
            } else {
                setError(err.response?.data?.message || "Failed to load video");
            }
        } finally {
            setLoading(false);
        }
    };

    const player = useVideoPlayer(streamUrl ?? null, (p) => {
        p.loop = false;
        if (streamUrl) p.play();
    });

    useEffect(() => {
        if (!showControls) return;
        const t = setTimeout(() => setShowControls(false), 3000);
        return () => clearTimeout(t);
    }, [showControls]);

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
                <StatusBar barStyle="light-content" backgroundColor="#000" />
                <ActivityIndicator size="large" color={COLORS.accent} />
                <Text style={{ color: "#fff", marginTop: 12 }}>Loading video...</Text>
            </View>
        );
    }

    if (error || !streamUrl) {
        return (
            <View style={{ flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center", padding: 24 }}>
                <StatusBar barStyle="light-content" backgroundColor="#000" />
                <Ionicons name="alert-circle-outline" size={56} color={COLORS.accent} />
                <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700", marginTop: 16, textAlign: "center" }}>
                    Cannot Play Video
                </Text>
                <Text style={{ color: "#999", fontSize: 14, textAlign: "center", marginTop: 8, marginBottom: 24 }}>
                    {error || "No stream URL available"}
                </Text>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{ backgroundColor: COLORS.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 50 }}
                >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#000" }}>
            <StatusBar hidden />
            <TouchableOpacity
                style={{ flex: 1 }}
                activeOpacity={1}
                onPress={() => setShowControls((prev) => !prev)}
            >
                <VideoView
                    player={player}
                    style={{ flex: 1 }}
                    allowsFullscreen
                    allowsPictureInPicture
                    contentFit="contain"
                />

                {showControls && (
                    <View style={{
                        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "space-between",
                    }}>
                        {/* Top */}
                        <View style={{ flexDirection: "row", alignItems: "center", padding: 16, paddingTop: 48 }}>
                            <TouchableOpacity
                                onPress={() => { player.pause(); router.back(); }}
                                style={{
                                    width: 40, height: 40, borderRadius: 20,
                                    backgroundColor: "rgba(0,0,0,0.5)",
                                    justifyContent: "center", alignItems: "center",
                                }}
                            >
                                <Ionicons name="arrow-back" size={22} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {/* Centre play/pause */}
                        <View style={{ alignItems: "center" }}>
                            <TouchableOpacity
                                onPress={() => {
                                    if (player.playing) player.pause();
                                    else player.play();
                                    setShowControls(true);
                                }}
                                style={{
                                    width: 64, height: 64, borderRadius: 32,
                                    backgroundColor: "rgba(0,0,0,0.6)",
                                    justifyContent: "center", alignItems: "center",
                                }}
                            >
                                <Ionicons name={player.playing ? "pause" : "play"} size={32} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {/* Bottom */}
                        <View style={{ padding: 16, paddingBottom: 32 }}>
                            {licenseExpiry && (
                                <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, textAlign: "center" }}>
                                    License expires {new Date(licenseExpiry).toLocaleDateString()}
                                </Text>
                            )}
                        </View>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
}