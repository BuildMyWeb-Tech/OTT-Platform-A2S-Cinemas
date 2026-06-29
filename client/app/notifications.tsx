import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import {
    ActivityIndicator, FlatList, StatusBar,
    Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Swipeable } from "react-native-gesture-handler";
import api from "@/constants/api";
import { useTheme } from "@/context/ThemeContext";
import { useNotifications } from "@/context/NotificationContext";
import SplashLoader from "@/components/SplashLoader";

const DELETED_KEY = "ott_deleted_notification_ids";

type FilterTab = "all" | "unread";

export default function NotificationsScreen() {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    // Fix 10 — shared context so marking read here reduces badge on Home immediately
    const { notifications, setNotifications, readIds, markAsRead, markAllAsRead, unreadCount } = useNotifications();

    const [deletedIds, setDeletedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterTab>("all");

    useEffect(() => {
        loadDeleted();
        fetchNotifications();
    }, []);

    const loadDeleted = async () => {
        const val = await AsyncStorage.getItem(DELETED_KEY);
        if (val) setDeletedIds(JSON.parse(val));
    };

    const fetchNotifications = async () => {
        try {
            const { data } = await api.get("/notifications");
            setNotifications(data.data || []);
        } catch (e) {
            console.error("Failed to fetch notifications:", e);
        } finally {
            setLoading(false);
        }
    };

    const deleteNotification = async (id: string) => {
        const updated = [...deletedIds, id];
        setDeletedIds(updated);
        await AsyncStorage.setItem(DELETED_KEY, JSON.stringify(updated));
    };

    const deleteAll = async () => {
        const allIds = notifications.map((n) => n._id);
        const updated = Array.from(new Set([...deletedIds, ...allIds]));
        setDeletedIds(updated);
        await AsyncStorage.setItem(DELETED_KEY, JSON.stringify(updated));
    };

    const handleTap = (n: any) => {
        markAsRead(n._id); // updates shared context — Home badge reduces immediately
        if (n.movieId) {
            const mid = typeof n.movieId === "string" ? n.movieId : n.movieId._id;
            router.push(`/movie/${mid}` as any);
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    };

    const visible = notifications
        .filter((n) => !deletedIds.includes(n._id))
        .filter((n) => filter === "unread" ? !readIds.includes(n._id) : true);

    const visibleUnread = notifications
        .filter((n) => !deletedIds.includes(n._id) && !readIds.includes(n._id)).length;

    if (loading) return <SplashLoader message="Loading notifications..." />;

    const renderRightActions = (id: string) => (
        <TouchableOpacity
            onPress={() => deleteNotification(id)}
            style={{
                backgroundColor: colors.error,
                justifyContent: "center", alignItems: "center",
                width: 80, borderRadius: 12, marginBottom: 10,
            }}
        >
            <Ionicons name="trash-outline" size={22} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600", marginTop: 3 }}>Delete</Text>
        </TouchableOpacity>
    );

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
            <SafeAreaView edges={["top"]} style={{ flex: 1 }}>

                {/* Header */}
                <View style={{
                    flexDirection: "row", alignItems: "center",
                    paddingHorizontal: 20, paddingVertical: 14,
                    borderBottomWidth: 0.5, borderBottomColor: colors.divider,
                }}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{
                            width: 38, height: 38, borderRadius: 19,
                            backgroundColor: colors.surfaceVariant,
                            justifyContent: "center", alignItems: "center", marginRight: 14,
                        }}
                    >
                        <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 20, fontWeight: "800", color: colors.textPrimary }}>Notifications</Text>
                        {visibleUnread > 0 && (
                            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 1 }}>
                                {visibleUnread} unread
                            </Text>
                        )}
                    </View>
                    {visible.length > 0 && (
                        <TouchableOpacity
                            onPress={() => visibleUnread > 0
                                ? markAllAsRead(notifications.map(n => n._id))
                                : deleteAll()
                            }
                            style={{
                                paddingHorizontal: 12, paddingVertical: 7,
                                backgroundColor: colors.surfaceVariant,
                                borderRadius: 8, borderWidth: 0.5, borderColor: colors.border,
                            }}
                        >
                            <Text style={{ fontSize: 12, color: colors.textSecondary, fontWeight: "600" }}>
                                {visibleUnread > 0 ? "Mark all read" : "Clear all"}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Filter tabs */}
                <View style={{ flexDirection: "row", paddingHorizontal: 20, paddingVertical: 12, gap: 8 }}>
                    {(["all", "unread"] as FilterTab[]).map((f) => {
                        const isSelected = filter === f;
                        return (
                            <TouchableOpacity
                                key={f} onPress={() => setFilter(f)}
                                style={{
                                    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20,
                                    backgroundColor: isSelected ? colors.accent : colors.surfaceVariant,
                                    borderWidth: 0.5, borderColor: isSelected ? colors.accent : colors.border,
                                    flexDirection: "row", alignItems: "center", gap: 5,
                                }}
                            >
                                <Text style={{ fontSize: 13, fontWeight: "600", color: isSelected ? "#fff" : colors.textSecondary, textTransform: "capitalize" }}>
                                    {f}
                                </Text>
                                {f === "unread" && visibleUnread > 0 && (
                                    <View style={{
                                        backgroundColor: isSelected ? "rgba(255,255,255,0.3)" : colors.accent,
                                        borderRadius: 8, minWidth: 18, height: 18,
                                        justifyContent: "center", alignItems: "center", paddingHorizontal: 4,
                                    }}>
                                        <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>
                                            {visibleUnread > 9 ? "9+" : String(visibleUnread)}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* List */}
                {visible.length === 0 ? (
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }}>
                        <View style={{
                            width: 80, height: 80, borderRadius: 40,
                            backgroundColor: colors.surfaceVariant,
                            justifyContent: "center", alignItems: "center", marginBottom: 18,
                        }}>
                            <Ionicons name="notifications-off-outline" size={36} color={colors.textMuted} />
                        </View>
                        <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: "700", marginBottom: 8 }}>
                            {filter === "unread" ? "All caught up!" : "No notifications"}
                        </Text>
                        <Text style={{ color: colors.textMuted, fontSize: 14, textAlign: "center", lineHeight: 20 }}>
                            {filter === "unread" ? "You have no unread notifications." : "New movie alerts will appear here."}
                        </Text>
                        {filter === "unread" && (
                            <TouchableOpacity onPress={() => setFilter("all")} style={{ marginTop: 16 }}>
                                <Text style={{ color: colors.accent, fontSize: 14, fontWeight: "600" }}>View all notifications</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <FlatList
                        data={visible}
                        keyExtractor={(item) => item._id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, paddingTop: 4 }}
                        renderItem={({ item }) => {
                            const isRead = readIds.includes(item._id);
                            return (
                                <Swipeable
                                    renderRightActions={() => renderRightActions(item._id)}
                                    overshootRight={false}
                                >
                                    <TouchableOpacity
                                        onPress={() => handleTap(item)}
                                        activeOpacity={0.8}
                                        style={{
                                            flexDirection: "row", alignItems: "flex-start",
                                            backgroundColor: isRead ? colors.card : colors.accentDim,
                                            borderRadius: 14, padding: 14, marginBottom: 10,
                                            borderWidth: 0.5,
                                            borderColor: isRead ? colors.border : colors.accent + "30",
                                            gap: 12,
                                        }}
                                    >
                                        <View style={{
                                            width: 46, height: 46, borderRadius: 23,
                                            backgroundColor: colors.accent + "20",
                                            justifyContent: "center", alignItems: "center", flexShrink: 0,
                                        }}>
                                            <Ionicons name="film" size={22} color={colors.accent} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                                                <Text style={{
                                                    flex: 1, fontSize: 14,
                                                    fontWeight: isRead ? "500" : "700",
                                                    color: colors.textPrimary, lineHeight: 20,
                                                }}>
                                                    {item.title}
                                                </Text>
                                                {!isRead && (
                                                    <View style={{
                                                        width: 8, height: 8, borderRadius: 4,
                                                        backgroundColor: colors.accent,
                                                        marginTop: 5, flexShrink: 0,
                                                    }} />
                                                )}
                                            </View>
                                            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 18 }}>
                                                {item.message}
                                            </Text>
                                            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                                                <Text style={{ fontSize: 11, color: colors.textMuted }}>{formatTime(item.createdAt)}</Text>
                                                {item.movieId && (
                                                    <View style={{
                                                        flexDirection: "row", alignItems: "center", gap: 3,
                                                        backgroundColor: colors.surfaceVariant,
                                                        borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
                                                    }}>
                                                        <Ionicons name="play-outline" size={11} color={colors.accent} />
                                                        <Text style={{ color: colors.accent, fontSize: 11, fontWeight: "600" }}>View Movie</Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                </Swipeable>
                            );
                        }}
                    />
                )}
            </SafeAreaView>
        </View>
    );
}