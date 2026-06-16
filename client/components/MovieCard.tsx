import { COLORS, LICENSE_STATUS_COLOR } from "@/constants";
import { MovieCardProps } from "@/constants/types";
import { Link } from "expo-router";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

export default function MovieCard({ movie, isPurchased = false, daysLeft = 0 }: MovieCardProps) {
    const statusColor = isPurchased ? LICENSE_STATUS_COLOR(daysLeft, true) : null;

    // Prefer dynamic categories over legacy genre field
    const categoryLabel = (movie.categories && movie.categories.length > 0)
        ? movie.categories.map((c: any) => c.name).join(", ")
        : movie.genre;

    return (
        <Link href={`/movie/${movie._id}`} asChild>
            <TouchableOpacity
                style={{
                    width: "48%", marginBottom: 14,
                    backgroundColor: "#fff",
                    borderRadius: 10,
                    overflow: "hidden",
                    borderWidth: 0.5,
                    borderColor: "#eee",
                }}
                activeOpacity={0.85}
            >
                {/* Poster */}
                <View style={{ height: 180, backgroundColor: "#1a1a2e", position: "relative" }}>
                    <Image
                        source={{ uri: movie.poster }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                    />

                    {/* Price badge */}
                    {!isPurchased && (
                        <View style={{
                            position: "absolute", top: 8, left: 8,
                            backgroundColor: "rgba(0,0,0,0.75)",
                            borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
                        }}>
                            <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>
                                ₹{movie.price}
                            </Text>
                        </View>
                    )}

                    {/* Purchased badge */}
                    {isPurchased && statusColor && (
                        <View style={{
                            position: "absolute", top: 8, right: 8,
                            backgroundColor: statusColor.bg,
                            borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
                        }}>
                            <Text style={{ color: statusColor.text, fontSize: 10, fontWeight: "700" }}>
                                {statusColor.label}
                            </Text>
                        </View>
                    )}

                    {/* Featured badge */}
                    {movie.isFeatured && (
                        <View style={{
                            position: "absolute", bottom: 8, left: 8,
                            backgroundColor: COLORS.accent,
                            borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2,
                        }}>
                            <Text style={{ color: "#fff", fontSize: 9, fontWeight: "700" }}>FEATURED</Text>
                        </View>
                    )}
                </View>

                {/* Info */}
                <View style={{ padding: 10 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: COLORS.primary, marginBottom: 2 }} numberOfLines={1}>
                        {movie.title}
                    </Text>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <Text style={{ fontSize: 11, color: COLORS.secondary }} numberOfLines={1}>
                            {categoryLabel}
                        </Text>
                        <Text style={{ fontSize: 11, color: COLORS.secondary }}>
                            {movie.duration ? `${movie.duration}m` : `${movie.expiryDays}d access`}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        </Link>
    );
}