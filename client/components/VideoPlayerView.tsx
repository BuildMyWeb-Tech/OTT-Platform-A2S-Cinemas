import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator, Dimensions, PanResponder,
    StatusBar, Text, TouchableOpacity, View,
} from "react-native";
import * as ScreenOrientation from "expo-screen-orientation";
import { useVideoPlayer, VideoView } from "expo-video";
import { COLORS } from "@/constants";

interface Props {
    streamUrl: string;
    onBack: () => void;
    /** Shown centred under the seek bar in portrait mode, e.g. license expiry or "Preview". */
    footerText?: string;
}

/**
 * The actual video surface + custom controls, shared by the full movie player
 * (licensed, gated) and the teaser player (public, no license required).
 * Callers own fetching the stream URL and any access checks — this component
 * only plays whatever URL it's given.
 */
export default function VideoPlayerView({ streamUrl, onBack, footerText }: Props) {
    const [showControls, setShowControls] = useState(true);
    const [isBuffering, setIsBuffering] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        return () => { ScreenOrientation.unlockAsync(); };
    }, []);

    const player = useVideoPlayer(streamUrl, (p) => {
        p.loop = false;
        p.play();
    });

    useEffect(() => {
        if (!player) return;
        const interval = setInterval(() => {
            try {
                setCurrentTime(player.currentTime || 0);
                setDuration(player.duration || 0);
                setIsPlaying(player.playing);
                setIsBuffering(player.status === "loading");
            } catch {}
        }, 250);
        return () => clearInterval(interval);
    }, [player]);

    useEffect(() => {
        if (!showControls) return;
        const t = setTimeout(() => setShowControls(false), 3000);
        return () => clearTimeout(t);
    }, [showControls]);

    const formatTime = (seconds: number) => {
        if (!seconds || !isFinite(seconds)) return "0:00";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const seekBy = (deltaSeconds: number) => {
        if (!player) return;
        const newTime = Math.max(0, Math.min(duration, currentTime + deltaSeconds));
        player.currentTime = newTime;
        setCurrentTime(newTime);
        setShowControls(true);
    };

    const seekTo = (fraction: number) => {
        if (!player || !duration) return;
        const newTime = Math.max(0, Math.min(duration, fraction * duration));
        player.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const togglePlayPause = () => {
        if (!player) return;
        if (isPlaying) player.pause();
        else player.play();
        setShowControls(true);
    };

    const toggleFullscreen = async () => {
        if (!isFullscreen) {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
            setIsFullscreen(true);
        } else {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
            setIsFullscreen(false);
        }
        setShowControls(true);
    };

    const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
    const screenWidth = Dimensions.get("window").width;

    const seekBarResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (evt) => {
            const x = evt.nativeEvent.locationX;
            const fraction = Math.max(0, Math.min(1, x / (screenWidth - 32)));
            seekTo(fraction);
            setShowControls(true);
        },
        onPanResponderRelease: (evt) => {
            const x = evt.nativeEvent.locationX;
            const fraction = Math.max(0, Math.min(1, x / (screenWidth - 32)));
            seekTo(fraction);
        },
    });

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
                    allowsPictureInPicture
                    contentFit="contain"
                    nativeControls={false}
                />

                {isBuffering && (
                    <View style={{
                        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                        justifyContent: "center", alignItems: "center",
                    }}>
                        <ActivityIndicator size="large" color={COLORS.accent} />
                    </View>
                )}

                {showControls && (
                    <View style={{
                        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "space-between",
                    }}>
                        {/* Top */}
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, paddingTop: isFullscreen ? 16 : 48 }}>
                            <TouchableOpacity
                                onPress={() => {
                                    player.pause();
                                    if (isFullscreen) ScreenOrientation.unlockAsync();
                                    onBack();
                                }}
                                style={{
                                    width: 40, height: 40, borderRadius: 20,
                                    backgroundColor: "rgba(0,0,0,0.5)",
                                    justifyContent: "center", alignItems: "center",
                                }}
                            >
                                <Ionicons name="arrow-back" size={22} color="#fff" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={toggleFullscreen}
                                style={{
                                    width: 40, height: 40, borderRadius: 20,
                                    backgroundColor: "rgba(0,0,0,0.5)",
                                    justifyContent: "center", alignItems: "center",
                                }}
                            >
                                <Ionicons name={isFullscreen ? "contract" : "expand"} size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {/* Centre controls — play/pause + seek ±10s, identical in both modes */}
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 32 }}>
                            <TouchableOpacity
                                onPress={() => seekBy(-10)}
                                style={{
                                    width: 48, height: 48, borderRadius: 24,
                                    backgroundColor: "rgba(0,0,0,0.5)",
                                    justifyContent: "center", alignItems: "center",
                                }}
                            >
                                <Ionicons name="play-back" size={24} color="#fff" />
                                <Text style={{ color: "#fff", fontSize: 8, position: "absolute", bottom: 6 }}>10</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={togglePlayPause}
                                style={{
                                    width: 64, height: 64, borderRadius: 32,
                                    backgroundColor: "rgba(0,0,0,0.6)",
                                    justifyContent: "center", alignItems: "center",
                                }}
                            >
                                <Ionicons name={isPlaying ? "pause" : "play"} size={32} color="#fff" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => seekBy(10)}
                                style={{
                                    width: 48, height: 48, borderRadius: 24,
                                    backgroundColor: "rgba(0,0,0,0.5)",
                                    justifyContent: "center", alignItems: "center",
                                }}
                            >
                                <Ionicons name="play-forward" size={24} color="#fff" />
                                <Text style={{ color: "#fff", fontSize: 8, position: "absolute", bottom: 6 }}>10</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Bottom — seek bar + time */}
                        <View style={{ padding: 16, paddingBottom: isFullscreen ? 16 : 32 }}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                                <Text style={{ color: "#fff", fontSize: 12 }}>{formatTime(currentTime)}</Text>
                                <Text style={{ color: "#fff", fontSize: 12 }}>{formatTime(duration)}</Text>
                            </View>
                            <View
                                {...seekBarResponder.panHandlers}
                                style={{ height: 24, justifyContent: "center" }}
                            >
                                <View style={{ height: 4, backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 2 }}>
                                    <View style={{
                                        height: 4, width: `${progressPct}%`,
                                        backgroundColor: COLORS.accent, borderRadius: 2,
                                    }} />
                                </View>
                                <View style={{
                                    position: "absolute",
                                    left: `${progressPct}%`,
                                    width: 12, height: 12, borderRadius: 6,
                                    backgroundColor: COLORS.accent,
                                    marginLeft: -6,
                                }} />
                            </View>
                            {footerText && !isFullscreen && (
                                <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, textAlign: "center", marginTop: 12 }}>
                                    {footerText}
                                </Text>
                            )}
                        </View>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
}
