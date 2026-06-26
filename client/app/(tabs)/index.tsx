import { useRouter, useFocusEffect } from "expo-router";
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
    ActivityIndicator, Dimensions, Image, ScrollView,
    Text, TouchableOpacity, View, Modal, StatusBar
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import api from "@/constants/api";
import { Movie } from "@/constants/types";
import { getCategoryIcon } from "@/constants";
import { useLicense } from "@/context/LicenseContext";
import { useTheme } from "@/context/ThemeContext";
import ThemeToggle from "@/components/ThemeToggle";
import SplashLoader from "@/components/SplashLoader";

const { width, height } = Dimensions.get("window");
const BANNER_HEIGHT = height * 0.52;

interface Category { _id: string; name: string; slug: string; }
interface CategorySection { category: Category; movies: Movie[]; }

export default function Home() {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const { hasLicense, getDaysLeft } = useLicense();
    const bannerScrollRef = useRef<ScrollView>(null);

    const [notifications, setNotifications] = useState<any[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [readIds, setReadIds] = useState<string[]>([]);

    const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([]);
    const [allMovies, setAllMovies] = useState<Movie[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [categorySections, setCategorySections] = useState<CategorySection[]>([]);
    const [loading, setLoading] = useState(true);
    const [bannerIndex, setBannerIndex] = useState(0);
    const hasLoadedOnce = useRef(false);

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

    useFocusEffect(
        useCallback(() => {
            if (!hasLoadedOnce.current) {
                fetchData();
            } else {
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
        }, 4000);
        return () => clearInterval(interval);
    }, [featuredMovies.length]);

    const buildCategorySections = (cats: Category[], movies: Movie[]): CategorySection[] => {
        return cats
            .map((cat) => ({
                category: cat,
                movies: movies.filter((m) =>
                    m.categories?.some((c: any) =>
                        (typeof c === "string" ? c : c._id) === cat._id ||
                        (typeof c === "object" && c.slug === cat.slug)
                    )
                ),
            }))
            .filter((s) => s.movies.length > 0);
    };

const fetchData = async () => {
    try {
        const { data } = await api.get("/home");
        const { featured, movies, categories, notifications: notifs } = data.data;
        setFeaturedMovies(featured || []);
        setAllMovies(movies || []);
        setCategories(categories || []);
        setNotifications(notifs || []);
        setCategorySections(buildCategorySections(categories || [], movies || []));
        hasLoadedOnce.current = true;
    } catch (error) {
        console.error("Failed to fetch home data:", error);
    } finally {
        setLoading(false);
    }
};

const refreshSilently = async () => {
    try {
        const { data } = await api.get("/home");
        const { featured, movies, categories, notifications: notifs } = data.data;
        setFeaturedMovies(featured || []);
        setAllMovies(movies || []);
        setCategories(categories || []);
        setNotifications(notifs || []);
        setCategorySections(buildCategorySections(categories || [], movies || []));
    } catch {}
};

    const unreadCount = notifications.filter((n) => !readIds.includes(n._id)).length;
    const currentBanner = featuredMovies[bannerIndex];

   if (loading) {
    return <SplashLoader message="Loading movies..." />;
}

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 32 }}
            >
                {/* ── HERO BANNER ── */}
{featuredMovies.length > 0 && (
    <View style={{ height: BANNER_HEIGHT, position: "relative" }}>
        <ScrollView
            ref={bannerScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={(e) => {
                const slide = Math.round(e.nativeEvent.contentOffset.x / width);
                setBannerIndex(slide);
            }}
        >
            {featuredMovies.map((movie) => (
                <View key={movie._id} style={{ width, height: BANNER_HEIGHT }}>
                    <Image
                        source={{ uri: movie.poster }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                    />
                    {/* Bottom gradient for text readability */}
                    <LinearGradient
                        colors={["transparent", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.92)"]}
                        locations={[0.3, 0.65, 1]}
                        style={{
                            position: "absolute", bottom: 0, left: 0, right: 0,
                            height: BANNER_HEIGHT * 0.65,
                        }}
                    />
                </View>
            ))}
        </ScrollView>

        {/* Permanent top gradient — ensures header is ALWAYS readable
            regardless of which poster image is showing */}
        <LinearGradient
            colors={["rgba(0,0,0,0.72)", "rgba(0,0,0,0.35)", "transparent"]}
            locations={[0, 0.4, 1]}
            style={{
                position: "absolute", top: 0, left: 0, right: 0,
                height: 130, zIndex: 15,
            }}
            pointerEvents="none"
        />

        {/* Header overlay — sits ABOVE both gradients */}
        <SafeAreaView
            edges={["top"]}
            style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 20 }}
        >
            <View style={{
                flexDirection: "row", alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 16, paddingVertical: 10,
            }}>
                {/* Brand — always white, always visible */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={{ fontSize: 13 }}>🎬</Text>
                    <Text style={{
                        fontSize: 20, fontWeight: "800", color: "#FFFFFF",
                        letterSpacing: 0.5,
                        // Text shadow so it pops even on very bright posters
                        textShadowColor: "rgba(0,0,0,0.8)",
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 4,
                    }}>
                        A2S Cinemas
                    </Text>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <ThemeToggle size={20} />
                    <TouchableOpacity
                        onPress={() => router.push("/notifications" as any)}
                        style={{ position: "relative" }}
                    >
                        <Ionicons name="notifications-outline" size={24} color="#fff" />
                        {unreadCount > 0 && (
                            <View style={{
                                position: "absolute", top: -3, right: -3,
                                backgroundColor: colors.accent,
                                borderRadius: 8, minWidth: 16, height: 16,
                                justifyContent: "center", alignItems: "center",
                                paddingHorizontal: 3,
                            }}>
                                <Text style={{ color: "#fff", fontSize: 9, fontWeight: "700" }}>
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push("/browse")}>
                        <Ionicons name="search-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>

        {/* Banner info + CTA — unchanged */}
        {currentBanner && (
            <View style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                paddingHorizontal: 20, paddingBottom: 20, zIndex: 10,
            }}>
                <View style={{ flexDirection: "row", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                    {(currentBanner.categories && currentBanner.categories.length > 0
                        ? currentBanner.categories.map((c: any) => c.name || c)
                        : [currentBanner.genre]
                    ).filter(Boolean).map((tag: string, i: number) => (
                        <View key={i} style={{
                            backgroundColor: "rgba(255,255,255,0.18)",
                            borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3,
                        }}>
                            <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>{tag}</Text>
                        </View>
                    ))}
                    {currentBanner.duration && (
                        <View style={{
                            backgroundColor: "rgba(255,255,255,0.18)",
                            borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3,
                            flexDirection: "row", alignItems: "center", gap: 3,
                        }}>
                            <Ionicons name="time-outline" size={11} color="#fff" />
                            <Text style={{ color: "#fff", fontSize: 11 }}>{currentBanner.duration}m</Text>
                        </View>
                    )}
                </View>

                <Text style={{
                    color: "#fff", fontSize: 26, fontWeight: "800",
                    marginBottom: 14, lineHeight: 32, letterSpacing: 0.3,
                    textShadowColor: "rgba(0,0,0,0.6)",
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 6,
                }} numberOfLines={2}>
                    {currentBanner.title}
                </Text>

                <View style={{ flexDirection: "row", gap: 10 }}>
                    <TouchableOpacity
                        onPress={() => {
                            if (hasLicense(currentBanner._id)) {
                                router.push(`/player/${currentBanner._id}` as any);
                            } else {
                                router.push(`/movie/${currentBanner._id}` as any);
                            }
                        }}
                        style={{
                            flex: 1, backgroundColor: colors.accent,
                            borderRadius: 8, paddingVertical: 13,
                            flexDirection: "row", alignItems: "center",
                            justifyContent: "center", gap: 8,
                        }}
                    >
                        <Ionicons name="play" size={18} color="#fff" />
                        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
                            {hasLicense(currentBanner._id) ? "Watch Now" : "Get Access"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push(`/movie/${currentBanner._id}` as any)}
                        style={{
                            paddingHorizontal: 20, paddingVertical: 13,
                            backgroundColor: "rgba(255,255,255,0.2)",
                            borderRadius: 8,
                            flexDirection: "row", alignItems: "center", gap: 6,
                        }}
                    >
                        <Ionicons name="information-circle-outline" size={18} color="#fff" />
                        <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>Info</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )}

        {/* Dot indicators */}
        <View style={{
            position: "absolute", bottom: -18, left: 0, right: 0,
            flexDirection: "row", justifyContent: "center", gap: 5, zIndex: 10,
        }}>
            {featuredMovies.map((_, i) => (
                <TouchableOpacity
                    key={i}
                    onPress={() => {
                        setBannerIndex(i);
                        bannerScrollRef.current?.scrollTo({ x: i * width, animated: true });
                    }}
                >
                    <View style={{
                        height: 3, borderRadius: 2,
                        width: i === bannerIndex ? 24 : 6,
                        backgroundColor: i === bannerIndex ? colors.accent : "rgba(255,255,255,0.35)",
                    }} />
                </TouchableOpacity>
            ))}
        </View>
    </View>
)}

                {/* ── CONTENT SECTIONS ── */}
                <View style={{ marginTop: featuredMovies.length > 0 ? 30 : 16 }}>

                    {/* Genre pill row */}
                    {categories.length > 0 && (
                        <View style={{ marginBottom: 24 }}>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                            >
                                <TouchableOpacity
                                    onPress={() => router.push({ pathname: "/browse", params: { category: "all" } })}
                                    style={{
                                        paddingHorizontal: 16, paddingVertical: 8,
                                        backgroundColor: colors.accent,
                                        borderRadius: 20,
                                        flexDirection: "row", alignItems: "center", gap: 5,
                                    }}
                                >
                                    <Ionicons name="grid-outline" size={13} color="#fff" />
                                    <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>All</Text>
                                </TouchableOpacity>
                                {categories.map((cat) => (
                                    <TouchableOpacity
                                        key={cat._id}
                                        onPress={() => router.push({ pathname: "/browse", params: { category: cat.slug } })}
                                        style={{
                                            paddingHorizontal: 16, paddingVertical: 8,
                                            backgroundColor: colors.surfaceVariant,
                                            borderRadius: 20, borderWidth: 0.5,
                                            borderColor: colors.border,
                                            flexDirection: "row", alignItems: "center", gap: 5,
                                        }}
                                    >
                                        <Ionicons name={getCategoryIcon(cat.name) as any} size={13} color={colors.textSecondary} />
                                        <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: "500" }}>{cat.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Featured / New Releases row */}
                    {featuredMovies.length > 0 && (
                        <HorizontalRow
                            title="New Releases"
                            movies={featuredMovies}
                            colors={colors}
                            onSeeAll={() => router.push({ pathname: "/browse", params: { category: "all" } })}
                            onMoviePress={(id) => router.push(`/movie/${id}` as any)}
                            hasLicense={hasLicense}
                            getDaysLeft={getDaysLeft}
                        />
                    )}

                    {/* Per-category rows */}
                    {categorySections.map((section) => (
                        <HorizontalRow
                            key={section.category._id}
                            title={section.category.name}
                            movies={section.movies}
                            colors={colors}
                            onSeeAll={() => router.push({ pathname: "/browse", params: { category: section.category.slug } })}
                            onMoviePress={(id) => router.push(`/movie/${id}` as any)}
                            hasLicense={hasLicense}
                            getDaysLeft={getDaysLeft}
                        />
                    ))}

                    {/* All Movies row — fallback when no category sections exist */}
                    {categorySections.length === 0 && allMovies.length > 0 && (
                        <HorizontalRow
                            title="All Movies"
                            movies={allMovies}
                            colors={colors}
                            onSeeAll={() => router.push("/browse" as any)}
                            onMoviePress={(id) => router.push(`/movie/${id}` as any)}
                            hasLicense={hasLicense}
                            getDaysLeft={getDaysLeft}
                        />
                    )}
                </View>
            </ScrollView>

            {/* ── NOTIFICATIONS MODAL ── */}
            <Modal
                visible={showNotifications}
                transparent
                animationType="slide"
                onRequestClose={() => setShowNotifications(false)}
            >
                <TouchableOpacity
                    style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}
                    activeOpacity={1}
                    onPress={() => setShowNotifications(false)}
                />
                <View style={{
                    backgroundColor: colors.surface,
                    borderTopLeftRadius: 24, borderTopRightRadius: 24,
                    paddingTop: 8, paddingBottom: 40, maxHeight: "72%",
                }}>
                    {/* Handle bar */}
                    <View style={{
                        width: 36, height: 4, borderRadius: 2,
                        backgroundColor: colors.border,
                        alignSelf: "center", marginBottom: 16,
                    }} />

                    <View style={{
                        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                        paddingHorizontal: 20, paddingBottom: 14,
                        borderBottomWidth: 0.5, borderBottomColor: colors.divider,
                    }}>
                        <Text style={{ fontSize: 17, fontWeight: "700", color: colors.textPrimary }}>
                            Notifications
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                            {unreadCount > 0 && (
                                <TouchableOpacity onPress={markAllAsRead}>
                                    <Text style={{ fontSize: 13, color: colors.accent, fontWeight: "600" }}>
                                        Mark all read
                                    </Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                onPress={() => setShowNotifications(false)}
                                style={{
                                    width: 30, height: 30, borderRadius: 15,
                                    backgroundColor: colors.surfaceVariant,
                                    justifyContent: "center", alignItems: "center",
                                }}
                            >
                                <Ionicons name="close" size={16} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {notifications.length === 0 ? (
                        <View style={{ padding: 48, alignItems: "center" }}>
                            <View style={{
                                width: 64, height: 64, borderRadius: 32,
                                backgroundColor: colors.surfaceVariant,
                                justifyContent: "center", alignItems: "center", marginBottom: 14,
                            }}>
                                <Ionicons name="notifications-off-outline" size={28} color={colors.textMuted} />
                            </View>
                            <Text style={{ color: colors.textMuted, fontSize: 15, fontWeight: "500" }}>
                                No notifications yet
                            </Text>
                        </View>
                    ) : (
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {notifications.map((n) => {
                                const isRead = readIds.includes(n._id);
                                return (
                                    <TouchableOpacity
                                        key={n._id}
                                        onPress={() => {
                                            markAsRead(n._id);
                                            if (n.movieId) {
                                                setShowNotifications(false);
                                                const mid = typeof n.movieId === "string" ? n.movieId : n.movieId._id;
                                                router.push(`/movie/${mid}` as any);
                                            }
                                        }}
                                        style={{
                                            flexDirection: "row", alignItems: "flex-start", gap: 14,
                                            paddingHorizontal: 20, paddingVertical: 14,
                                            borderBottomWidth: 0.5, borderBottomColor: colors.divider,
                                            backgroundColor: isRead ? "transparent" : colors.accentDim,
                                        }}
                                    >
                                        <View style={{
                                            width: 42, height: 42, borderRadius: 21,
                                            backgroundColor: colors.accent + "20",
                                            justifyContent: "center", alignItems: "center",
                                            flexShrink: 0,
                                        }}>
                                            <Ionicons name="film" size={20} color={colors.accent} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{
                                                fontSize: 14,
                                                fontWeight: isRead ? "500" : "700",
                                                color: colors.textPrimary,
                                                marginBottom: 3,
                                            }}>
                                                {n.title}
                                            </Text>
                                            <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>
                                                {n.message}
                                            </Text>
                                            <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 5 }}>
                                                {formatNotifTime(n.createdAt)}
                                            </Text>
                                        </View>
                                        {!isRead && (
                                            <View style={{
                                                width: 8, height: 8, borderRadius: 4,
                                                backgroundColor: colors.accent, marginTop: 6,
                                            }} />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    )}
                </View>
            </Modal>
        </View>
    );
}

// ── HORIZONTAL ROW COMPONENT ──────────────────────────────────────────────────
interface RowProps {
    title: string;
    movies: Movie[];
    colors: any;
    onSeeAll: () => void;
    onMoviePress: (id: string) => void;
    hasLicense: (id: string) => boolean;
    getDaysLeft: (id: string) => number;
}

function HorizontalRow({ title, movies, colors, onSeeAll, onMoviePress, hasLicense, getDaysLeft }: RowProps) {
    if (movies.length === 0) return null;

    return (
        <View style={{ marginBottom: 28 }}>
            {/* Section header */}
            <View style={{
                flexDirection: "row", alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 16, marginBottom: 12,
            }}>
                <Text style={{ fontSize: 17, fontWeight: "700", color: colors.textPrimary }}>
                    {title}
                </Text>
                <TouchableOpacity onPress={onSeeAll} style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                    <Text style={{ fontSize: 13, color: colors.accent, fontWeight: "600" }}>See all</Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.accent} />
                </TouchableOpacity>
            </View>

            {/* Horizontal scroll */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            >
                {movies.map((movie) => (
                    <PosterCard
                        key={movie._id}
                        movie={movie}
                        colors={colors}
                        onPress={() => onMoviePress(movie._id)}
                        owned={hasLicense(movie._id)}
                        daysLeft={getDaysLeft(movie._id)}
                    />
                ))}
            </ScrollView>
        </View>
    );
}

// ── POSTER CARD COMPONENT ─────────────────────────────────────────────────────
interface PosterCardProps {
    movie: Movie;
    colors: any;
    onPress: () => void;
    owned: boolean;
    daysLeft: number;
}

function PosterCard({ movie, colors, onPress, owned, daysLeft }: PosterCardProps) {
    const CARD_W = 130;
    const CARD_H = 185;

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            style={{ width: CARD_W }}
        >
            <View style={{
                width: CARD_W, height: CARD_H,
                borderRadius: 10, overflow: "hidden",
                backgroundColor: colors.card,
            }}>
                <Image
                    source={{ uri: movie.poster }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                />

                {/* Bottom gradient */}
                <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.75)"]}
                    style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60 }}
                />

                {/* Price / owned badge */}
                {owned ? (
                    <View style={{
                        position: "absolute", top: 7, right: 7,
                        backgroundColor: "#1D9E75",
                        borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2,
                    }}>
                        <Text style={{ color: "#fff", fontSize: 9, fontWeight: "700" }}>
                            {daysLeft}d left
                        </Text>
                    </View>
                ) : (
                    <View style={{
                        position: "absolute", top: 7, left: 7,
                        backgroundColor: "rgba(0,0,0,0.72)",
                        borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2,
                    }}>
                        <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>
                            ₹{movie.price}
                        </Text>
                    </View>
                )}

                {/* Featured ribbon */}
                {movie.isFeatured && (
                    <View style={{
                        position: "absolute", bottom: 7, left: 7,
                        backgroundColor: "#E50914",
                        borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2,
                    }}>
                        <Text style={{ color: "#fff", fontSize: 8, fontWeight: "800", letterSpacing: 0.5 }}>
                            FEATURED
                        </Text>
                    </View>
                )}
            </View>

            {/* Title below card */}
            <Text
                style={{
                    color: colors.textPrimary, fontSize: 12, fontWeight: "600",
                    marginTop: 7, lineHeight: 16,
                }}
                numberOfLines={2}
            >
                {movie.title}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                {(movie.categories && movie.categories.length > 0)
                    ? (movie.categories[0] as any).name || movie.genre
                    : movie.genre}
            </Text>
        </TouchableOpacity>
    );
}