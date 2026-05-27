import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator, FlatList, ScrollView,
    Text, TextInput, TouchableOpacity, View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "@/constants/api";
import { COLORS, GENRES } from "@/constants";
import { Movie } from "@/constants/types";
import { useLicense } from "@/context/LicenseContext";
import MovieCard from "@/components/MovieCard";

export default function Browse() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { hasLicense, getDaysLeft } = useLicense();

    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedGenre, setSelectedGenre] = useState<string>("all");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const fetchMovies = async (pageNum = 1, reset = false, genre = selectedGenre) => {
        if (pageNum === 1) setLoading(true);
        else setLoadingMore(true);
        try {
            const genreParam = genre === "all" ? "" : genre;
            const { data } = await api.get(
                `/movies?page=${pageNum}&limit=12${genreParam ? `&genre=${genreParam}` : ""}`
            );
            const newMovies = data.data || [];
            setMovies((prev) => (reset ? newMovies : [...prev, ...newMovies]));
            setHasMore(pageNum < (data.pagination?.pages ?? 1));
        } catch (error) {
            console.error("Failed to fetch movies:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    // Re-run every time screen comes into focus OR genre param changes
    useFocusEffect(
        useCallback(() => {
            const genreParam = (params.genre as string) || "all";
            setSearch("");
            setSelectedGenre(genreParam);
            setMovies([]);
            setPage(1);
            setHasMore(true);
            fetchMovies(1, true, genreParam);
        }, [params.genre])
    );

    const handleGenreChange = (genre: string) => {
        setSelectedGenre(genre);
        setSearch("");
        setMovies([]);
        setPage(1);
        setHasMore(true);
        fetchMovies(1, true, genre);
    };

    const loadMore = () => {
        if (!hasMore || loadingMore) return;
        const next = page + 1;
        setPage(next);
        fetchMovies(next, false, selectedGenre);
    };

    const filtered = search.trim()
        ? movies.filter((m) =>
              m.title.toLowerCase().includes(search.toLowerCase()) ||
              m.genre.toLowerCase().includes(search.toLowerCase())
          )
        : movies;

    return (
        <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
            {/* Search */}
            <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
                <View style={{
                    flexDirection: "row", alignItems: "center",
                    backgroundColor: "#f5f5f5", borderRadius: 12,
                    paddingHorizontal: 12, paddingVertical: 10,
                }}>
                    <Ionicons name="search-outline" size={20} color={COLORS.secondary} />
                    <TextInput
                        style={{ flex: 1, marginLeft: 8, fontSize: 14, color: COLORS.primary }}
                        placeholder="Search movies..."
                        placeholderTextColor="#999"
                        value={search}
                        onChangeText={setSearch}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch("")}>
                            <Ionicons name="close-circle" size={18} color={COLORS.secondary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Genre chips */}
            <View style={{ paddingVertical: 8 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                    {GENRES.map((g) => (
                        <TouchableOpacity
                            key={g.id}
                            onPress={() => handleGenreChange(g.id)}
                            style={{
                                paddingHorizontal: 14, paddingVertical: 7,
                                borderRadius: 20, marginRight: 8,
                                backgroundColor: selectedGenre === g.id ? COLORS.primary : "#f0f0f0",
                            }}
                        >
                            <Text style={{
                                fontSize: 13, fontWeight: "500",
                                color: selectedGenre === g.id ? "#fff" : COLORS.primary,
                            }}>
                                {g.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Count */}
            <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
                <Text style={{ fontSize: 13, color: COLORS.secondary }}>
                    {filtered.length} movie{filtered.length !== 1 ? "s" : ""}
                    {selectedGenre !== "all" ? ` in ${selectedGenre}` : ""}
                </Text>
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <ActivityIndicator size="large" color={COLORS.accent} />
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item._id}
                    numColumns={2}
                    columnWrapperStyle={{ justifyContent: "space-between", paddingHorizontal: 16 }}
                    contentContainerStyle={{ paddingBottom: 24 }}
                    renderItem={({ item }) => (
                        <MovieCard
                            movie={item}
                            isPurchased={hasLicense(item._id)}
                            daysLeft={getDaysLeft(item._id)}
                        />
                    )}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.3}
                    ListFooterComponent={
                        loadingMore ? (
                            <View style={{ padding: 16, alignItems: "center" }}>
                                <ActivityIndicator size="small" color={COLORS.accent} />
                            </View>
                        ) : null
                    }
                    ListEmptyComponent={
                        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 60 }}>
                            <Ionicons name="film-outline" size={48} color={COLORS.secondary} />
                            <Text style={{ color: COLORS.secondary, marginTop: 12, fontSize: 15 }}>No movies found</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}