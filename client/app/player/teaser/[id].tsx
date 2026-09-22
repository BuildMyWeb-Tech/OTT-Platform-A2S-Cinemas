import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StatusBar, Text, TouchableOpacity, View } from "react-native";
import api from "@/constants/api";
import { COLORS } from "@/constants";
import SplashLoader from "@/components/SplashLoader";
import VideoPlayerView from "@/components/VideoPlayerView";

/**
 * Plays an uploaded teaser in-app, the same way the full movie plays — but with
 * no license/purchase check at all. Anyone can open this, signed in or not.
 */
export default function TeaserPlayer() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const [streamUrl, setStreamUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        api.get(`/movies/${id}/teaser`)
            .then(({ data }) => {
                if (data.success && data.data?.streamUrl) setStreamUrl(data.data.streamUrl);
                else setError("Teaser not available");
            })
            .catch((err) => setError(err.response?.data?.message || "Failed to load teaser"))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return <SplashLoader message="Loading teaser..." />;
    }

    if (error || !streamUrl) {
        return (
            <View style={{ flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center", padding: 24 }}>
                <StatusBar barStyle="light-content" backgroundColor="#000" />
                <Ionicons name="alert-circle-outline" size={56} color={COLORS.accent} />
                <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700", marginTop: 16, textAlign: "center" }}>
                    Cannot Play Teaser
                </Text>
                <Text style={{ color: "#999", fontSize: 14, textAlign: "center", marginTop: 8, marginBottom: 24 }}>
                    {error || "No teaser available"}
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
            footerText="Preview — purchase to watch the full movie"
        />
    );
}
