import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator, Dimensions, FlatList, Image, Modal,
    ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import api from "@/constants/api";
import { getCategoryIcon } from "@/constants";
import { Movie } from "@/constants/types";
import { useLicense } from "@/context/LicenseContext";
import { useTheme } from "@/context/ThemeContext";
import SplashLoader from "@/components/SplashLoader";

const { width } = Dimensions.get("window");
const CARD_W = (width - 48) / 2;
const CARD_H = CARD_W * 1.45;

interface Category { _id: string; name: string; slug: string; }
interface Suggestion { _id: string; title: string; poster: string; price: number; }

export default function Browse() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { colors, isDark } = useTheme();
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
    const [totalCount, setTotalCount] = useState(0);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const searchInputRef = useRef<TextInput>(null);

    useEffect(() => {
        api.get("/categories").then(({ data }) => setCategories(data.data || []));
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
            const p = new URLSearchParams({ page: String(pageNum), limit: "12" });
            if (category !== "all") p.set("category", category);
            if (searchTerm.trim()) p.set("search", searchTerm.trim());
            const { data } = await api.get(`/movies?${p}`);
            const newMovies = data.data || [];
            setMovies((prev) => (reset || pageNum === 1 ? newMovies : [...prev, ...newMovies]));
            setHasMore(pageNum < (data.pagination?.pages ?? 1));
            setTotalCount(data.pagination?.total ?? 0);
        } catch (error) {
            console.error("Failed to fetch movies:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

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
            setSuggestions([]);
            setShowSuggestions(false);
            setPage(1);
            fetchMovies(1, true, selectedCategory, "");
            return;
        }
        searchTimeout.current = setTimeout(() => fetchSuggestions(text), 200);
    };

    const handleSearchSubmit = () => {
        setShowSuggestions(false);
        setPage(1);
        fetchMovies(1, true, selectedCategory, search);
    };

    const clearSearch = () => {
        setSearch("");
        setSuggestions([]);
        setShowSuggestions(false);
        setPage(1);
        fetchMovies(1, true, selectedCategory, "");
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
        ? "All"
        : categories.find((c) => c.slug === selectedCategory)?.name ?? selectedCategory;

    const isSearching = search.trim().length > 0;

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
            <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background }}>

                {/* ── HEADER ── */}
                <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
                    <Text style={{ fontSize: 22, fontWeight: "800", color: colors.textPrimary, marginBottom: 14 }}>
                        Search
                    </Text>

                    {/* Search bar */}
                    <View style={{
                        flexDirection: "row", alignItems: "center",
                        backgroundColor: colors.inputBg,
                        borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
                        borderWidth: 1, borderColor: colors.inputBorder,
                    }}>
                        <Ionicons name="search-outline" size={20} color={colors.textMuted} />
                        <TextInput
                            ref={searchInputRef}
                            style={{
                                flex: 1, marginLeft: 10, fontSize: 15,
                                color: colors.inputText,
                            }}
                            placeholder="Search movies, genres..."
                            placeholderTextColor={colors.inputPlaceholder}
                            value={search}
                            onChangeText={handleSearchChange}
                            onSubmitEditing={handleSearchSubmit}
                            returnKeyType="search"
                            autoCorrect={false}
                        />
                        {search.length > 0 && (
                            <TouchableOpacity onPress={clearSearch} style={{ padding: 2 }}>
                                <View style={{
                                    width: 20, height: 20, borderRadius: 10,
                                    backgroundColor: colors.textMuted,
                                    justifyContent: "center", alignItems: "center",
                                }}>
                                    <Ionicons name="close" size={12} color={colors.background} />
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>

                   {/* Suggestions dropdown — fixed position, max height, scrollable */}
{showSuggestions && suggestions.length > 0 && (
    <View style={{
        position: "absolute", top: 80, left: 0, right: 0,
        backgroundColor: colors.cardElevated,
        borderRadius: 14, zIndex: 999,
        maxHeight: 280,
        shadowColor: "#000", shadowOpacity: 0.25,
        shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
        elevation: 20, overflow: "hidden",
        borderWidth: 0.5, borderColor: colors.border,
        marginHorizontal: 16,
    }}>
        <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
        >
            {suggestions.map((s, i) => (
                <TouchableOpacity
                    key={s._id}
                    onPress={() => handleSuggestionSelect(s)}
                    style={{
                        flexDirection: "row", alignItems: "center", gap: 12,
                        paddingHorizontal: 16, paddingVertical: 12,
                        borderBottomWidth: i < suggestions.length - 1 ? 0.5 : 0,
                        borderBottomColor: colors.divider,
                    }}
                >
                    {s.poster ? (
                        <Image
                            source={{ uri: s.poster }}
                            style={{ width: 36, height: 50, borderRadius: 6 }}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={{
                            width: 36, height: 50, borderRadius: 6,
                            backgroundColor: colors.surfaceVariant,
                            justifyContent: "center", alignItems: "center",
                        }}>
                            <Ionicons name="film-outline" size={16} color={colors.textMuted} />
                        </View>
                    )}
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textPrimary }} numberOfLines={1}>
                            {s.title}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.accent, marginTop: 2, fontWeight: "600" }}>
                            ₹{s.price}
                        </Text>
                    </View>
                    <Ionicons name="arrow-forward" size={16} color={colors.accent} />
                </TouchableOpacity>
            ))}
        </ScrollView>
    </View>
)}
                </View>

                {/* ── CATEGORY PILLS (hidden when actively searching) ── */}
                {!isSearching && (
                    <View style={{ marginTop: 8, marginBottom: 4 }}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                        >
                            {/* All pill */}
                            <TouchableOpacity
                                onPress={() => handleCategorySelect("all")}
                                style={{
                                    paddingHorizontal: 18, paddingVertical: 8,
                                    borderRadius: 20,
                                    backgroundColor: selectedCategory === "all" ? colors.accent : colors.surfaceVariant,
                                    borderWidth: 0.5,
                                    borderColor: selectedCategory === "all" ? colors.accent : colors.border,
                                }}
                            >
                                <Text style={{
                                    fontSize: 13, fontWeight: "600",
                                    color: selectedCategory === "all" ? "#fff" : colors.textSecondary,
                                }}>
                                    All
                                </Text>
                            </TouchableOpacity>

                            {categories.map((cat) => {
                                const isSelected = selectedCategory === cat.slug;
                                return (
                                    <TouchableOpacity
                                        key={cat._id}
                                        onPress={() => handleCategorySelect(cat.slug)}
                                        style={{
                                            paddingHorizontal: 18, paddingVertical: 8,
                                            borderRadius: 20,
                                            backgroundColor: isSelected ? colors.accent : colors.surfaceVariant,
                                            borderWidth: 0.5,
                                            borderColor: isSelected ? colors.accent : colors.border,
                                            flexDirection: "row", alignItems: "center", gap: 6,
                                        }}
                                    >
                                        <Ionicons
                                            name={getCategoryIcon(cat.name) as any}
                                            size={13}
                                            color={isSelected ? "#fff" : colors.textSecondary}
                                        />
                                        <Text style={{
                                            fontSize: 13, fontWeight: "600",
                                            color: isSelected ? "#fff" : colors.textSecondary,
                                        }}>
                                            {cat.name}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}

                {/* ── RESULT COUNT + FILTER BUTTON ── */}
                <View style={{
                    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                    paddingHorizontal: 16, paddingVertical: 10,
                }}>
                    <Text style={{ fontSize: 13, color: colors.textMuted }}>
                        {loading ? "Searching..." : `${totalCount} result${totalCount !== 1 ? "s" : ""}${selectedCategory !== "all" ? ` in ${selectedCategoryName}` : ""}`}
                    </Text>
                    <TouchableOpacity
                        onPress={() => setShowCategoryModal(true)}
                        style={{
                            flexDirection: "row", alignItems: "center", gap: 5,
                            backgroundColor: colors.surfaceVariant,
                            paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
                            borderWidth: 0.5, borderColor: colors.border,
                        }}
                    >
                        <Ionicons name="options-outline" size={15} color={colors.textSecondary} />
                        <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: "500" }}>
                            Filter
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {/* ── MOVIES GRID ── */}
           {loading ? (
    <SplashLoader message="Searching..." />
) : (
                <FlatList
                    data={movies}
                    keyExtractor={(item) => item._id}
                    numColumns={2}
                    columnWrapperStyle={{ justifyContent: "space-between", paddingHorizontal: 16 }}
                    contentContainerStyle={{ paddingBottom: 32, paddingTop: 4 }}
                    showsVerticalScrollIndicator={false}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.4}
                    renderItem={({ item }) => (
                        <BrowseCard
                            movie={item}
                            colors={colors}
                            onPress={() => router.push(`/movie/${item._id}` as any)}
                            owned={hasLicense(item._id)}
                            daysLeft={getDaysLeft(item._id)}
                        />
                    )}
                    ListFooterComponent={loadingMore ? (
                        <View style={{ padding: 20, alignItems: "center" }}>
                            <ActivityIndicator size="small" color={colors.accent} />
                        </View>
                    ) : null}
                    ListEmptyComponent={(
                        <View style={{ alignItems: "center", paddingTop: 80, paddingHorizontal: 32 }}>
                            <View style={{
                                width: 80, height: 80, borderRadius: 40,
                                backgroundColor: colors.surfaceVariant,
                                justifyContent: "center", alignItems: "center", marginBottom: 18,
                            }}>
                                <Ionicons name="film-outline" size={36} color={colors.textMuted} />
                            </View>
                            <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: "700", marginBottom: 8 }}>
                                No movies found
                            </Text>
                            <Text style={{ color: colors.textMuted, fontSize: 14, textAlign: "center", lineHeight: 20 }}>
                                {isSearching
                                    ? `No results for "${search}". Try a different keyword.`
                                    : "No movies in this category yet."}
                            </Text>
                            {isSearching && (
                                <TouchableOpacity onPress={clearSearch} style={{ marginTop: 16 }}>
                                    <Text style={{ color: colors.accent, fontSize: 14, fontWeight: "600" }}>
                                        Clear search
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                />
            )}

            {/* ── CATEGORY FILTER MODAL ── */}
            <Modal
                visible={showCategoryModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowCategoryModal(false)}
            >
                <TouchableOpacity
                    style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}
                    activeOpacity={1}
                    onPress={() => setShowCategoryModal(false)}
                />
                <View style={{
                    backgroundColor: colors.surface,
                    borderTopLeftRadius: 24, borderTopRightRadius: 24,
                    paddingBottom: 40, maxHeight: "65%",
                }}>
                    {/* Handle */}
                    <View style={{
                        width: 36, height: 4, borderRadius: 2,
                        backgroundColor: colors.border,
                        alignSelf: "center", marginVertical: 12,
                    }} />

                    <View style={{
                        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                        paddingHorizontal: 20, paddingBottom: 14,
                        borderBottomWidth: 0.5, borderBottomColor: colors.divider,
                    }}>
                        <Text style={{ fontSize: 17, fontWeight: "700", color: colors.textPrimary }}>
                            Filter by Category
                        </Text>
                        <TouchableOpacity
                            onPress={() => setShowCategoryModal(false)}
                            style={{
                                width: 30, height: 30, borderRadius: 15,
                                backgroundColor: colors.surfaceVariant,
                                justifyContent: "center", alignItems: "center",
                            }}
                        >
                            <Ionicons name="close" size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* All option */}
                        <CategoryFilterRow
                            label="All Categories"
                            icon="grid-outline"
                            isSelected={selectedCategory === "all"}
                            onPress={() => handleCategorySelect("all")}
                            colors={colors}
                        />
                        {categories.map((cat) => (
                            <CategoryFilterRow
                                key={cat._id}
                                label={cat.name}
                                icon={getCategoryIcon(cat.name)}
                                isSelected={selectedCategory === cat.slug}
                                onPress={() => handleCategorySelect(cat.slug)}
                                colors={colors}
                            />
                        ))}
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}

// ── BROWSE CARD ───────────────────────────────────────────────────────────────
function BrowseCard({ movie, colors, onPress, owned, daysLeft }: {
    movie: Movie; colors: any; onPress: () => void; owned: boolean; daysLeft: number;
}) {
    const categoryLabel = (movie.categories && movie.categories.length > 0)
        ? (movie.categories[0] as any).name || movie.genre
        : movie.genre;

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.82}
            style={{ width: CARD_W, marginBottom: 16 }}
        >
            <View style={{
                width: CARD_W, height: CARD_H,
                borderRadius: 12, overflow: "hidden",
                backgroundColor: colors.card,
            }}>
                <Image
                    source={{ uri: movie.poster }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                />

                {/* Gradient overlay */}
                <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.8)"]}
                    locations={[0.5, 1]}
                    style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: CARD_H * 0.5 }}
                />

                {/* Price / owned badge */}
                {owned ? (
                    <View style={{
                        position: "absolute", top: 8, right: 8,
                        backgroundColor: "#1D9E75",
                        borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
                    }}>
                        <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>
                            {daysLeft}d left
                        </Text>
                    </View>
                ) : (
                    <View style={{
                        position: "absolute", top: 8, left: 8,
                        backgroundColor: "rgba(0,0,0,0.75)",
                        borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
                    }}>
                        <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>
                            ₹{movie.price}
                        </Text>
                    </View>
                )}

                {/* Featured badge */}
                {movie.isFeatured && (
                    <View style={{
                        position: "absolute", top: 8, right: owned ? 54 : 8,
                        backgroundColor: colors.accent,
                        borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3,
                    }}>
                        <Text style={{ color: "#fff", fontSize: 8, fontWeight: "800", letterSpacing: 0.5 }}>
                            NEW
                        </Text>
                    </View>
                )}

                {/* Bottom info */}
                <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 10 }}>
                    <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }} numberOfLines={1}>
                        {movie.title}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 }}>
                        {categoryLabel ? (
                            <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 10 }} numberOfLines={1}>
                                {categoryLabel}
                            </Text>
                        ) : null}
                        {movie.duration ? (
                            <>
                                <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>•</Text>
                                <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 10 }}>
                                    {movie.duration}m
                                </Text>
                            </>
                        ) : null}
                    </View>
                </View>

                {/* Ratings */}
                {movie.ratings?.average > 0 && (
                    <View style={{
                        position: "absolute", bottom: 38, right: 8,
                        flexDirection: "row", alignItems: "center", gap: 3,
                        backgroundColor: "rgba(0,0,0,0.6)",
                        borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2,
                    }}>
                        <Ionicons name="star" size={10} color="#FFD700" />
                        <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>
                            {movie.ratings.average.toFixed(1)}
                        </Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}

// ── CATEGORY FILTER ROW ───────────────────────────────────────────────────────
function CategoryFilterRow({ label, icon, isSelected, onPress, colors }: {
    label: string; icon: string; isSelected: boolean; onPress: () => void; colors: any;
}) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={{
                flexDirection: "row", alignItems: "center",
                paddingHorizontal: 20, paddingVertical: 15,
                borderBottomWidth: 0.5, borderBottomColor: colors.divider,
                backgroundColor: isSelected ? colors.accentDim : "transparent",
            }}
        >
            <View style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: isSelected ? colors.accent : colors.surfaceVariant,
                justifyContent: "center", alignItems: "center", marginRight: 14,
            }}>
                <Ionicons
                    name={icon as any}
                    size={17}
                    color={isSelected ? "#fff" : colors.textSecondary}
                />
            </View>
            <Text style={{
                flex: 1, fontSize: 15, fontWeight: isSelected ? "700" : "500",
                color: isSelected ? colors.accent : colors.textPrimary,
            }}>
                {label}
            </Text>
            {isSelected && (
                <View style={{
                    width: 22, height: 22, borderRadius: 11,
                    backgroundColor: colors.accent,
                    justifyContent: "center", alignItems: "center",
                }}>
                    <Ionicons name="checkmark" size={13} color="#fff" />
                </View>
            )}
        </TouchableOpacity>
    );
}