import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, StatusBar, Text, TouchableOpacity, View } from "react-native";
import api from "@/constants/api";
import { COLORS } from "@/constants";
import SplashLoader from "@/components/SplashLoader";
import VideoPlayerView from "@/components/VideoPlayerView";
import * as ScreenCapture from "expo-screen-capture";

export default function Player() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const [streamUrl, setStreamUrl] = useState<string | null>(null);
    const [licenseExpiry, setLicenseExpiry] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) fetchStreamUrl();
    }, [id]);

    useEffect(() => {
        ScreenCapture.preventScreenCaptureAsync().catch(() => {});
        return () => {
            ScreenCapture.allowScreenCaptureAsync().catch(() => {});
        };
    }, []);

    const fetchStreamUrl = async () => {
        try {
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

            try {
                const streamRes = await api.get(`/stream/${id}`);
                if (streamRes.data.success && streamRes.data.data?.streamUrl) {
                    setStreamUrl(streamRes.data.data.streamUrl);
                    return;
                }
            } catch {}

            try {
                const movieRes = await api.get(`/movies/${id}`);
                const trailerUrl = movieRes.data.data?.trailerUrl;
                if (trailerUrl) {
                    setStreamUrl(trailerUrl);
                    return;
                }
            } catch {}

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

    if (loading) {
        return <SplashLoader message="Loading movies..." />;
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
        <VideoPlayerView
            streamUrl={streamUrl}
            onBack={() => router.back()}
            footerText={licenseExpiry ? `License expires ${new Date(licenseExpiry).toLocaleDateString()}` : undefined}
        />
    );
}
