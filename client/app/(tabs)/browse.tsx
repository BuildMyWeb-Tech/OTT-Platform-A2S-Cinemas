import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator, FlatList, Modal, ScrollView,
    Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "@/constants/api";
import { COLORS } from "@/constants";
import { Movie } from "@/constants/types";
import { useLicense } from "@/context/LicenseContext";
import MovieCard from "@/components/MovieCard";

interface Category {
    _id: string;
    name: string;
    slug: string;
}

interface Suggestion {
    _id: string;
    title: string;
    poster: string;
    price: number;
}

export default function Browse() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { hasLicense, getDaysLeft } = useLicense();

    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [categories, setCategories] = useState<Category[]>([]);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Fetch categories on mount
    useEffect(() => {
        api.get("/categories").then(({ data }) => {
            setCategories(data.data || []);
        });
    }, []);

    const fetchMovies = async (
        pageNum = 1,
        reset = false,
        category = selectedCategory,
        searchTerm = ""
    ) => {
        if (pageNum === 1) setLoading(true);
        else setLoadingMore(true);
        try {
            const params = new URLSearchParams({ page: String(pageNum), limit: "12" });
            if (category !== "all") params.set("category", category);
            if (searchTerm.trim()) params.set("search", searchTerm.trim());

            const { data } = await api.get(`/movies?${params}`);
            const newMovies = data.data || [];
            setMovies((prev) => (reset || pageNum === 1 ? newMovies : [...prev, ...newMovies]));
            setHasMore(pageNum < (data.pagination?.pages ?? 1));
        } catch (error) {
            console.error("Failed to fetch movies:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    // Fetch suggestions as user types
    const fetchSuggestions = async (q: string) => {
        if (!q.trim()) { setSuggestions([]); setShowSuggestions(false); return; }
        try {
            const { data } = await api.get(`/movies/search/suggestions?q=${encodeURIComponent(q)}`);
            setSuggestions(data.data || []);
            setShowSuggestions(true);
        } catch { setSuggestions([]); }
    };

    const handleSearchChange = (text: string) => {
        setSearch(text);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        if (!text.trim()) {
            // Cleared — restore full list
            setSuggestions([]);
            setShowSuggestions(false);
            setPage(1);
            fetchMovies(1, true, selectedCategory, "");
            return;
        }
        // Debounce suggestions
        searchTimeout.current = setTimeout(() => {
            fetchSuggestions(text);
        }, 200);
    };

    const handleSearchSubmit = () => {
        setShowSuggestions(false);
        setPage(1);
        fetchMovies(1, true, selectedCategory, search);
    };

    const handleSuggestionSelect = (movie: Suggestion) => {
        setShowSuggestions(false);
        router.push(`/movie/${movie._id}` as any);
    };

    useFocusEffect(
        useCallback(() => {
            const catParam = (params.category as string) || "all";
            setSearch("");
            setSuggestions([]);
            setShowSuggestions(false);
            setSelectedCategory(catParam);
            setMovies([]);
            setPage(1);
            setHasMore(true);
            fetchMovies(1, true, catParam, "");
        }, [params.category])
    );

    const handleCategorySelect = (slug: string) => {
        setSelectedCategory(slug);
        setSearch("");
        setSuggestions([]);
        setShowSuggestions(false);
        setShowCategoryModal(false);
        setMovies([]);
        setPage(1);
        setHasMore(true);
        fetchMovies(1, true, slug, "");
    };

    const loadMore = () => {
        if (!hasMore || loadingMore || showSuggestions) return;
        const next = page + 1;
        setPage(next);
        fetchMovies(next, false, selectedCategory, search);
    };

    const selectedCategoryName = selectedCategory === "all"
        ? "All Categories"
        : categories.find((c) => c.slug === selectedCategory)?.name ?? selectedCategory;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
            {/* Search bar */}
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
                        onChangeText={handleSearchChange}
                        onSubmitEditing={handleSearchSubmit}
                        returnKeyType="search"
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => {
                            setSearch("");
                            setSuggestions([]);
                            setShowSuggestions(false);
                            setPage(1);
                            fetchMovies(1, true, selectedCategory, "");
                        }}>
                            <Ionicons name="close-circle" size={18} color={COLORS.secondary} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                    <View style={{
                        position: "absolute", top: 62, left: 16, right: 16,
                        backgroundColor: "#fff", borderRadius: 12, zIndex: 100,
                        shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 8,
                        shadowOffset: { width: 0, height: 4 }, elevation: 8,
                        borderWidth: 1, borderColor: "#f0f0f0",
                    }}>
                        {suggestions.map((s, i) => (
                            <TouchableOpacity
                                key={s._id}
                                onPress={() => handleSuggestionSelect(s)}
                                style={{
                                    flexDirection: "row", alignItems: "center", gap: 10,
                                    paddingHorizontal: 14, paddingVertical: 10,
                                    borderBottomWidth: i < suggestions.length - 1 ? 0.5 : 0,
                                    borderBottomColor: "#f0f0f0",
                                }}
                            >
                                <Ionicons name="search-outline" size={14} color="#999" />
                                <Text style={{ fontSize: 14, color: COLORS.primary, flex: 1 }} numberOfLines={1}>
                                    {s.title}
                                </Text>
                                <Text style={{ fontSize: 12, color: COLORS.secondary }}>₹{s.price}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            {/* Category dropdown button */}
            <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
                <TouchableOpacity
                    onPress={() => setShowCategoryModal(true)}
                    style={{
                        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                        backgroundColor: "#f5f5f5", borderRadius: 12,
                        paddingHorizontal: 14, paddingVertical: 10,
                    }}
                >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Ionicons name="filter-outline" size={16} color={COLORS.secondary} />
                        <Text style={{
                            fontSize: 14, color: selectedCategory !== "all" ? COLORS.accent : COLORS.secondary,
                            fontWeight: selectedCategory !== "all" ? "600" : "400",
                        }}>
                            {selectedCategoryName}
                        </Text>
                    </View>
                    <Ionicons name="chevron-down" size={16} color={COLORS.secondary} />
                </TouchableOpacity>
            </View>

            {/* Count */}
            <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
                <Text style={{ fontSize: 13, color: COLORS.secondary }}>
                    {movies.length} movie{movies.length !== 1 ? "s" : ""}
                    {selectedCategory !== "all" ? ` in ${selectedCategoryName}` : ""}
                </Text>
            </View>

            {/* Movies grid */}
            {loading ? (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <ActivityIndicator size="large" color={COLORS.accent} />
                </View>
            ) : (
                <FlatList
                    data={movies}
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

            {/* Category selection modal */}
            <Modal
                visible={showCategoryModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowCategoryModal(false)}
            >
                <TouchableOpacity
                    style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}
                    activeOpacity={1}
                    onPress={() => setShowCategoryModal(false)}
                />
                <View style={{
                    backgroundColor: "#fff",
                    borderTopLeftRadius: 20, borderTopRightRadius: 20,
                    paddingTop: 16, paddingBottom: 40, maxHeight: "60%",
                }}>
                    <View style={{
                        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                        paddingHorizontal: 20, paddingBottom: 12,
                        borderBottomWidth: 0.5, borderBottomColor: "#f0f0f0",
                    }}>
                        <Text style={{ fontSize: 16, fontWeight: "700", color: COLORS.primary }}>
                            Sort by Category
                        </Text>
                        <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                            <Ionicons name="close" size={22} color={COLORS.secondary} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView>
                        {/* All Categories option */}
                        <TouchableOpacity
                            onPress={() => handleCategorySelect("all")}
                            style={{
                                flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                                paddingHorizontal: 20, paddingVertical: 14,
                                borderBottomWidth: 0.5, borderBottomColor: "#f8f8f8",
                                backgroundColor: selectedCategory === "all" ? COLORS.accent + "0D" : "#fff",
                            }}
                        >
                            <Text style={{
                                fontSize: 15,
                                color: selectedCategory === "all" ? COLORS.accent : COLORS.primary,
                                fontWeight: selectedCategory === "all" ? "600" : "400",
                            }}>
                                All Categories
                            </Text>
                            {selectedCategory === "all" && (
                                <Ionicons name="checkmark" size={18} color={COLORS.accent} />
                            )}
                        </TouchableOpacity>

                        {categories.map((cat) => (
                            <TouchableOpacity
                                key={cat._id}
                                onPress={() => handleCategorySelect(cat.slug)}
                                style={{
                                    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                                    paddingHorizontal: 20, paddingVertical: 14,
                                    borderBottomWidth: 0.5, borderBottomColor: "#f8f8f8",
                                    backgroundColor: selectedCategory === cat.slug ? COLORS.accent + "0D" : "#fff",
                                }}
                            >
                                <Text style={{
                                    fontSize: 15,
                                    color: selectedCategory === cat.slug ? COLORS.accent : COLORS.primary,
                                    fontWeight: selectedCategory === cat.slug ? "600" : "400",
                                }}>
                                    {cat.name}
                                </Text>
                                {selectedCategory === cat.slug && (
                                    <Ionicons name="checkmark" size={18} color={COLORS.accent} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </Modal>
        </SafeAreaView>
    );
}