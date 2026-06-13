import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator, Dimensions, FlatList,
    Image, ScrollView, Text, TouchableOpacity, View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
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

    const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([]);
    const [allMovies, setAllMovies] = useState<Movie[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [bannerIndex, setBannerIndex] = useState(0);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
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
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
            {/* Header */}
            <View className="flex-row justify-between items-center px-4 py-3">
                <Text style={{ fontSize: 22, fontWeight: "700", color: COLORS.accent }}>🎬 A2S Cinemas</Text>
                <TouchableOpacity onPress={() => router.push("/browse")}>
                    <Ionicons name="search-outline" size={24} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Featured Banner */}
                {featuredMovies.length > 0 && (
                    <View className="mb-6">
                        <ScrollView
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
        </SafeAreaView>
    );
}