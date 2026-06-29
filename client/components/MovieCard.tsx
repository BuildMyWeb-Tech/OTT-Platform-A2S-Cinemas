import { useTheme } from "@/context/ThemeContext";
import { MovieCardProps } from "@/constants/types";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Dimensions, Image, Text, TouchableOpacity, View } from "react-native";

const { width } = Dimensions.get("window");
const CARD_W = (width - 48) / 2;
const CARD_H = CARD_W * 1.45;

export default function MovieCard({ movie, isPurchased = false, daysLeft = 0 }: MovieCardProps) {
    const { colors } = useTheme();

    const categoryLabel = (movie.categories && movie.categories.length > 0)
        ? (movie.categories[0] as any).name || movie.genre
        : movie.genre;

    return (
        <Link href={`/movie/${movie._id}`} asChild>
            <TouchableOpacity style={{ width: CARD_W, marginBottom: 16 }} activeOpacity={0.82}>
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

                    <LinearGradient
                        colors={["transparent", "rgba(0,0,0,0.8)"]}
                        locations={[0.5, 1]}
                        style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: CARD_H * 0.5 }}
                    />

                    {/* Price badge — top LEFT — only when not owned */}
                    {!isPurchased && (
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

                    {/* Owned badge — top RIGHT */}
                    {isPurchased && (
                        <View style={{
                            position: "absolute", top: 8, right: 8,
                            backgroundColor: "#1D9E75",
                            borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
                        }}>
                            <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>
                                {daysLeft}d left
                            </Text>
                        </View>
                    )}

                    {/* NEW badge — BOTTOM LEFT always, never overlaps top badges */}
                    {movie.isFeatured && (
                        <View style={{
                            position: "absolute", bottom: 36, left: 8,
                            backgroundColor: "#E50914",
                            borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3,
                        }}>
                            <Text style={{ color: "#fff", fontSize: 8, fontWeight: "800", letterSpacing: 0.5 }}>
                                NEW
                            </Text>
                        </View>
                    )}

                    {/* Bottom info overlay */}
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
        </Link>
    );
}