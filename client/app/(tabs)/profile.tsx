import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/Header";
import { COLORS, PROFILE_MENU } from "@/constants";
import { useAuth } from "@/context/AuthContext";
import api from "@/constants/api";

export default function Profile() {
    const router = useRouter();
    const { user, isSignedIn, logout, refreshUser } = useAuth();
    const [editVisible, setEditVisible] = useState(false);
    const [newName, setNewName] = useState(user?.name || "");
    const [saving, setSaving] = useState(false);

    const handleLogout = async () => {
        await logout();
        router.replace("/sign-in");
    };

    const openEdit = () => {
        setNewName(user?.name || "");
        setEditVisible(true);
    };

    const saveName = async () => {
        if (!newName.trim()) {
            Alert.alert("Error", "Name cannot be empty");
            return;
        }
        setSaving(true);
        try {
            await api.put("/auth/profile", { name: newName.trim() });
            await refreshUser?.();
            setEditVisible(false);
            Alert.alert("Success", "Name updated successfully");
        } catch (e) {
            Alert.alert("Error", "Failed to update name");
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
            <Header title="Profile" />

            <ScrollView
                className="flex-1 px-4"
                contentContainerStyle={
                    !isSignedIn
                        ? { flex: 1, justifyContent: "center", alignItems: "center" }
                        : { paddingTop: 16 }
                }
            >
                {!isSignedIn ? (
                    <View className="items-center w-full">
                        <View className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center mb-6">
                            <Ionicons name="person" size={40} color={COLORS.secondary} />
                        </View>
                        <Text className="text-primary font-bold text-xl mb-2">Guest User</Text>
                        <Text className="text-secondary text-base mb-8 text-center w-3/4">
                            Log in to access your library and purchases.
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.push("/sign-in")}
                            className="bg-primary w-3/5 py-3 rounded-full items-center"
                        >
                            <Text className="text-white font-bold text-lg">Login / Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <View className="items-center mb-8">
                            <View className="w-20 h-20 rounded-full bg-gray-200 items-center justify-center mb-3">
                                <Ionicons name="person" size={36} color={COLORS.secondary} />
                            </View>
                            <Text className="text-xl font-bold text-primary">{user?.name}</Text>
                            <Text className="text-secondary text-sm">{user?.email}</Text>

                            <TouchableOpacity onPress={openEdit} className="mt-3 flex-row items-center">
                                <Ionicons name="pencil" size={14} color={COLORS.accent} />
                                <Text className="text-accent text-sm font-medium ml-1">Edit Name</Text>
                            </TouchableOpacity>

                            {user?.role === "admin" && (
                                <TouchableOpacity
                                    onPress={() => router.push("/admin" as any)}
                                    className="mt-4 bg-primary px-6 py-2 rounded-full"
                                >
                                    <Text className="text-white font-bold">Admin Panel</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <View className="bg-white rounded-xl border border-gray-100 p-2 mb-4">
                            {PROFILE_MENU.map((item, index) => (
                                <TouchableOpacity
                                    key={item.id}
                                    onPress={() => router.push(item.route as any)}
                                    className={`flex-row items-center p-4 ${
                                        index !== PROFILE_MENU.length - 1 ? "border-b border-gray-100" : ""
                                    }`}
                                >
                                    <View className="w-10 h-10 bg-surface rounded-full items-center justify-center mr-4">
                                        <Ionicons name={item.icon as any} size={20} color={COLORS.primary} />
                                    </View>
                                    <Text className="flex-1 text-primary font-medium">{item.title}</Text>
                                    <Ionicons name="chevron-forward" size={20} color={COLORS.secondary} />
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            className="flex-row items-center justify-center p-4"
                            onPress={handleLogout}
                        >
                            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                            <Text className="text-red-500 font-bold ml-2">Log Out</Text>
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>

            {/* Edit Name Modal */}
            <Modal visible={editVisible} transparent animationType="fade" onRequestClose={() => setEditVisible(false)}>
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 24 }}>
                    <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20 }}>
                        <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 12 }}>Edit Name</Text>
                        <TextInput
                            value={newName}
                            onChangeText={setNewName}
                            placeholder="Your name"
                            style={{
                                borderWidth: 1, borderColor: "#e5e5e5", borderRadius: 10,
                                padding: 12, fontSize: 15, marginBottom: 16,
                            }}
                        />
                        <View style={{ flexDirection: "row", gap: 10 }}>
                            <TouchableOpacity
                                onPress={() => setEditVisible(false)}
                                style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: "#f0f0f0", alignItems: "center" }}
                            >
                                <Text style={{ fontWeight: "600" }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={saveName}
                                disabled={saving}
                                style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: COLORS.accent, alignItems: "center" }}
                            >
                                <Text style={{ color: "#fff", fontWeight: "600" }}>{saving ? "Saving..." : "Save"}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}