import { useRouter, useFocusEffect } from "expo-router";
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
    ActivityIndicator, Dimensions, FlatList,
    Image, ScrollView, Text, TouchableOpacity, View, Modal
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "@/constants/api";
import { Movie } from "@/constants/types";
import { COLORS, getCategoryIcon } from "@/constants";
import { useLicense } from "@/context/LicenseContext";
import MovieCard from "@/components/MovieCard";

const { width } = Dimensions.get("window");

interface Category {
    _id: string;
    name: string;
    slug: string;
}

export default function Home() {
    const router = useRouter();
    const { hasLicense, getDaysLeft } = useLicense();
    const bannerScrollRef = useRef<ScrollView>(null);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [readIds, setReadIds] = useState<string[]>([]);

    const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([]);
    const [allMovies, setAllMovies] = useState<Movie[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [bannerIndex, setBannerIndex] = useState(0);

    const READ_NOTIF_KEY = "ott_read_notification_ids";

    useEffect(() => {
        AsyncStorage.getItem(READ_NOTIF_KEY).then((val) => {
            if (val) setReadIds(JSON.parse(val));
        });
    }, []);

    const markAsRead = async (notifId: string) => {
        if (readIds.includes(notifId)) return;
        const updated = [...readIds, notifId];
        setReadIds(updated);
        await AsyncStorage.setItem(READ_NOTIF_KEY, JSON.stringify(updated));
    };

    const markAllAsRead = async () => {
        const allIds = notifications.map((n) => n._id);
        const updated = Array.from(new Set([...readIds, ...allIds]));
        setReadIds(updated);
        await AsyncStorage.setItem(READ_NOTIF_KEY, JSON.stringify(updated));
    };

    const formatNotifTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    // Track whether we've already loaded once — avoids re-showing the
    // full-screen spinner (and re-fetching everything) on every tab focus
    const hasLoadedOnce = useRef(false);

    useFocusEffect(
        useCallback(() => {
            if (!hasLoadedOnce.current) {
                fetchData();
            } else {
                // Light background refresh — don't block UI with spinner
                refreshSilently();
            }
        }, [])
    );

    useEffect(() => {
        if (featuredMovies.length <= 1) return;
        const interval = setInterval(() => {
            setBannerIndex((prev) => {
                const next = (prev + 1) % featuredMovies.length;
                bannerScrollRef.current?.scrollTo({ x: next * width, animated: true });
                return next;
            });
        }, 3000);
        return () => clearInterval(interval);
    }, [featuredMovies.length]);

    const fetchData = async () => {
        try {
            // Only request fields the Home screen actually renders — smaller payload, faster parse
            const [featuredRes, allRes, categoriesRes] = await Promise.all([
                api.get("/movies?featured=true&limit=5"),
                api.get("/movies?limit=12"),
                api.get("/categories"),
            ]);
            setFeaturedMovies(featuredRes.data.data || []);
            setAllMovies(allRes.data.data || []);
            setCategories(categoriesRes.data.data || []);
            hasLoadedOnce.current = true;
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }

        // Notifications fetched separately — never blocks the movie grid
        api.get("/notifications")
            .then(({ data }) => setNotifications(data.data || []))
            .catch((error) => console.error("Failed to fetch notifications:", error));
    };

    // Re-fetch on subsequent focuses without flipping the loading spinner back on —
    // keeps currently-rendered movies visible while fresh data loads behind them
    const refreshSilently = async () => {
        try {
            const [featuredRes, allRes, categoriesRes] = await Promise.all([
                api.get("/movies?featured=true&limit=5"),
                api.get("/movies?limit=12"),
                api.get("/categories"),
            ]);
            setFeaturedMovies(featuredRes.data.data || []);
            setAllMovies(allRes.data.data || []);
            setCategories(categoriesRes.data.data || []);
        } catch (error) {
            console.error("Failed to refresh data:", error);
        }

        api.get("/notifications")
            .then(({ data }) => setNotifications(data.data || []))
            .catch(() => {});
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
            {/* Header */}
            <View className="flex-row justify-between items-center px-4 py-3">
                <Text style={{ fontSize: 22, fontWeight: "700", color: COLORS.accent }}>🎬 A2S Cinemas</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                    <TouchableOpacity onPress={() => setShowNotifications(true)} style={{ position: "relative" }}>
                        <Ionicons name="notifications-outline" size={24} color={COLORS.primary} />
                        {notifications.filter(n => !readIds.includes(n._id)).length > 0 && (
                            <View style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent }} />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push("/browse")}>
                        <Ionicons name="search-outline" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Featured Banner */}
                {featuredMovies.length > 0 && (
                    <View className="mb-6">
                        <ScrollView
                            ref={bannerScrollRef}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onScroll={(e) => {
                                const slide = Math.round(e.nativeEvent.contentOffset.x / (width - 32));
                                setBannerIndex(slide);
                            }}
                            scrollEventThrottle={16}
                        >
                            {featuredMovies.map((movie) => (
                                <TouchableOpacity
                                    key={movie._id}
                                    style={{ width: width, height: 220 }}
                                    onPress={() => router.push(`/movie/${movie._id}`)}
                                    activeOpacity={0.9}
                                >
                                    <Image
                                        source={{ uri: movie.poster }}
                                        style={{ width: "100%", height: "100%" }}
                                        resizeMode="cover"
                                    />
                                    <View
                                        style={{
                                            position: "absolute", bottom: 0, left: 0, right: 0,
                                            padding: 16, backgroundColor: "rgba(0,0,0,0.55)"
                                        }}
                                    >
                                        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>
                                            {movie.title}
                                        </Text>
                                        <View className="flex-row items-center mt-1 gap-3">
                                            <Text style={{ color: "#ccc", fontSize: 12 }}>{movie.genre}</Text>
                                            <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: "600" }}>
                                                ₹{movie.price}
                                            </Text>
                                            {hasLicense(movie._id) && (
                                                <View style={{ backgroundColor: COLORS.success, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
                                                    <Text style={{ color: "#fff", fontSize: 10, fontWeight: "600" }}>OWNED</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View className="flex-row justify-center mt-2 gap-2">
                            {featuredMovies.map((_, i) => (
                                <View
                                    key={i}
                                    style={{
                                        height: 6, borderRadius: 3,
                                        width: i === bannerIndex ? 20 : 6,
                                        backgroundColor: i === bannerIndex ? COLORS.accent : "#ccc",
                                    }}
                                />
                            ))}
                        </View>
                    </View>
                )}

                {/* Genre scroll — DYNAMIC from Categories collection */}
                {categories.length > 0 && (
                    <View className="mb-4 px-4">
                        <Text className="text-lg font-bold text-primary mb-3">Browse by Genre</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <TouchableOpacity
                                onPress={() => router.push({ pathname: "/browse", params: { category: "all" } })}
                                style={{
                                    marginRight: 10, paddingHorizontal: 16, paddingVertical: 8,
                                    backgroundColor: COLORS.surface, borderRadius: 20,
                                    flexDirection: "row", alignItems: "center", gap: 6,
                                }}
                            >
                                <Ionicons name="grid-outline" size={14} color={COLORS.primary} />
                                <Text style={{ fontSize: 13, color: COLORS.primary }}>All</Text>
                            </TouchableOpacity>
                            {categories.map((cat) => (
                                <TouchableOpacity
                                    key={cat._id}
                                    onPress={() => router.push({ pathname: "/browse", params: { category: cat.slug } })}
                                    style={{
                                        marginRight: 10, paddingHorizontal: 16, paddingVertical: 8,
                                        backgroundColor: COLORS.surface, borderRadius: 20,
                                        flexDirection: "row", alignItems: "center", gap: 6,
                                    }}
                                >
                                    <Ionicons name={getCategoryIcon(cat.name) as any} size={14} color={COLORS.primary} />
                                    <Text style={{ fontSize: 13, color: COLORS.primary }}>{cat.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* All Movies */}
                <View className="px-4 mb-8">
                    <View className="flex-row justify-between items-center mb-3">
                        <Text className="text-lg font-bold text-primary">All Movies</Text>
                        <TouchableOpacity onPress={() => router.push("/browse")}>
                            <Text style={{ color: COLORS.secondary, fontSize: 13 }}>See all</Text>
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color={COLORS.accent} />
                    ) : (
                        <View className="flex-row flex-wrap justify-between">
                            {allMovies.map((movie) => (
                                <MovieCard
                                    key={movie._id}
                                    movie={movie}
                                    isPurchased={hasLicense(movie._id)}
                                    daysLeft={getDaysLeft(movie._id)}
                                />
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>

            <Modal
                visible={showNotifications}
                transparent
                animationType="slide"
                onRequestClose={() => setShowNotifications(false)}
            >
                <TouchableOpacity
                    style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}
                    activeOpacity={1}
                    onPress={() => setShowNotifications(false)}
                />
                <View style={{
                    backgroundColor: "#fff",
                    borderTopLeftRadius: 20, borderTopRightRadius: 20,
                    paddingTop: 16, paddingBottom: 32, maxHeight: "70%",
                }}>
                    <View style={{
                        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                        paddingHorizontal: 20, paddingBottom: 12,
                        borderBottomWidth: 0.5, borderBottomColor: "#f0f0f0",
                    }}>
                        <Text style={{ fontSize: 16, fontWeight: "700", color: COLORS.primary }}>
                            Notifications
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                            {notifications.length > 0 && (
                                <TouchableOpacity onPress={markAllAsRead}>
                                    <Text style={{ fontSize: 12, color: COLORS.accent, fontWeight: "600" }}>
                                        Mark all read
                                    </Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={() => setShowNotifications(false)}>
                                <Ionicons name="close" size={22} color={COLORS.secondary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {notifications.length === 0 ? (
                        <View style={{ padding: 40, alignItems: "center" }}>
                            <Ionicons name="notifications-off-outline" size={40} color={COLORS.secondary} />
                            <Text style={{ color: COLORS.secondary, marginTop: 12, fontSize: 14 }}>
                                No notifications yet
                            </Text>
                        </View>
                    ) : (
                        <ScrollView>
                            {notifications.map((n) => {
                                const isRead = readIds.includes(n._id);
                                return (
                                    <TouchableOpacity
                                        key={n._id}
                                        onPress={() => {
                                            markAsRead(n._id);
                                            if (n.movieId) {
                                                setShowNotifications(false);
                                                const movieIdVal = typeof n.movieId === "string" ? n.movieId : n.movieId._id;
                                                router.push(`/movie/${movieIdVal}` as any);
                                            }
                                        }}
                                        style={{
                                            flexDirection: "row", alignItems: "flex-start", gap: 12,
                                            paddingHorizontal: 20, paddingVertical: 14,
                                            borderBottomWidth: 0.5, borderBottomColor: "#f5f5f5",
                                            backgroundColor: isRead ? "#fff" : "#fef5f5",
                                        }}
                                    >
                                        <View style={{
                                            width: 36, height: 36, borderRadius: 18,
                                            backgroundColor: COLORS.accent + "15",
                                            justifyContent: "center", alignItems: "center",
                                        }}>
                                            <Ionicons name="film-outline" size={18} color={COLORS.accent} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 14, fontWeight: isRead ? "500" : "700", color: COLORS.primary }}>
                                                {n.title}
                                            </Text>
                                            <Text style={{ fontSize: 13, color: COLORS.secondary, marginTop: 2 }}>
                                                {n.message}
                                            </Text>
                                            <Text style={{ fontSize: 11, color: "#bbb", marginTop: 4 }}>
                                                {formatNotifTime(n.createdAt)}
                                            </Text>
                                        </View>
                                        {!isRead && (
                                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent, marginTop: 4 }} />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    )}
                </View>
            </Modal>
        </SafeAreaView>
    );
}