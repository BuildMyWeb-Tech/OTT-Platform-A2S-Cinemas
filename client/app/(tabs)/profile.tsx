import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Dimensions, Modal, ScrollView,
    StatusBar, Text, TextInput, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import ThemeToggle from "@/components/ThemeToggle";
import ConfirmModal from "@/components/ConfirmModal";
import Toast from "react-native-toast-message";
import api from "@/constants/api";

const { width } = Dimensions.get("window");

function MenuRow({ icon, label, onPress, colors, isLast = false, danger = false, rightContent }: {
    icon: string; label: string; onPress: () => void;
    colors: any; isLast?: boolean; danger?: boolean; rightContent?: React.ReactNode;
}) {
    return (
        <TouchableOpacity
            onPress={onPress} activeOpacity={0.7}
            style={{
                flexDirection: "row", alignItems: "center",
                paddingHorizontal: 16, paddingVertical: 15,
                borderBottomWidth: isLast ? 0 : 0.5, borderBottomColor: colors.divider,
            }}
        >
            <View style={{
                width: 38, height: 38, borderRadius: 10,
                backgroundColor: danger ? "#E5091415" : colors.surfaceVariant,
                justifyContent: "center", alignItems: "center", marginRight: 14,
            }}>
                <Ionicons name={icon as any} size={18} color={danger ? colors.accent : colors.textSecondary} />
            </View>
            <Text style={{ flex: 1, fontSize: 15, fontWeight: "500", color: danger ? colors.accent : colors.textPrimary }}>
                {label}
            </Text>
            {rightContent ?? <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />}
        </TouchableOpacity>
    );
}

function SectionCard({ children, colors }: { children: React.ReactNode; colors: any }) {
    return (
        <View style={{
            backgroundColor: colors.card, borderRadius: 16, marginBottom: 16,
            borderWidth: 0.5, borderColor: colors.border, overflow: "hidden",
        }}>
            {children}
        </View>
    );
}

function PwField({ label, value, onChangeText, show, onToggle, colors }: {
    label: string; value: string; onChangeText: (t: string) => void;
    show: boolean; onToggle: () => void; colors: any;
}) {
    return (
        <View>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 7, fontWeight: "500" }}>{label}</Text>
            <View style={{
                flexDirection: "row", alignItems: "center",
                backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder,
                borderRadius: 12, paddingHorizontal: 14, paddingVertical: 4,
            }}>
                <TextInput
                    value={value} onChangeText={onChangeText}
                    secureTextEntry={!show} placeholder="••••••••"
                    placeholderTextColor={colors.inputPlaceholder}
                    style={{ flex: 1, fontSize: 15, color: colors.inputText, paddingVertical: 10 }}
                />
                <TouchableOpacity onPress={onToggle} style={{ padding: 4 }}>
                    <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textMuted} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

export default function Profile() {
    const router = useRouter();
    const { colors, isDark, mode, setMode } = useTheme();
    const { user, isSignedIn, logout, refreshUser } = useAuth();

    const [signOutVisible, setSignOutVisible] = useState(false);
    const [editNameVisible, setEditNameVisible] = useState(false);
    const [changePwVisible, setChangePwVisible] = useState(false);
    const [newName, setNewName] = useState(user?.name || "");
    const [saving, setSaving] = useState(false);

    const [oldPw, setOldPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [changingPw, setChangingPw] = useState(false);

    const openEditName = () => { setNewName(user?.name || ""); setEditNameVisible(true); };

    const saveName = async () => {
        if (!newName.trim()) {
            Toast.show({ type: "error", text1: "Error", text2: "Name cannot be empty" });
            return;
        }
        setSaving(true);
        try {
            await api.put("/auth/profile", { name: newName.trim() });
            await refreshUser?.();
            setEditNameVisible(false);
            Toast.show({ type: "success", text1: "Done", text2: "Name updated successfully" });
        } catch {
            Toast.show({ type: "error", text1: "Error", text2: "Failed to update name" });
        } finally { setSaving(false); }
    };

    const changePassword = async () => {
    if (!oldPw || !newPw || !confirmPw) {
        Toast.show({ type: "error", text1: "Error", text2: "Please fill in all fields" }); return;
    }
    if (newPw.length < 6) {
        Toast.show({ type: "error", text1: "Error", text2: "New password must be at least 6 characters" }); return;
    }
    if (newPw !== confirmPw) {
        Toast.show({ type: "error", text1: "Error", text2: "New passwords do not match" }); return;
    }
    setChangingPw(true);
    try {
        // DEBUG — log what's being sent
        console.log("[changePassword] Calling PUT /auth/change-password");
        console.log("[changePassword] Payload:", { oldPassword: oldPw ? "***" : "EMPTY", newPassword: newPw ? "***" : "EMPTY" });

        const response = await api.put("/auth/change-password", { oldPassword: oldPw, newPassword: newPw });

        // DEBUG — log response
        console.log("[changePassword] Response:", JSON.stringify(response.data));

        setChangePwVisible(false);
        setOldPw(""); setNewPw(""); setConfirmPw("");
        Toast.show({ type: "success", text1: "Done", text2: "Password changed successfully" });
    } catch (e: any) {
        // DEBUG — log full error
        console.log("[changePassword] Error status:", e?.response?.status);
        console.log("[changePassword] Error data:", JSON.stringify(e?.response?.data));
        console.log("[changePassword] Error message:", e?.message);
        console.log("[changePassword] Request URL:", e?.config?.url);
        console.log("[changePassword] Request baseURL:", e?.config?.baseURL);

        Toast.show({ type: "error", text1: "Error", text2: e.response?.data?.message || "Failed to change password" });
    } finally { setChangingPw(false); }
};

    if (!isSignedIn) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.background }}>
                <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
                <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
                    <View style={{
                        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                        paddingHorizontal: 20, paddingVertical: 12,
                    }}>
                        <Text style={{ fontSize: 22, fontWeight: "800", color: colors.textPrimary }}>Profile</Text>
                        <ThemeToggle size={20} />
                    </View>
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }}>
                        <View style={{
                            width: 90, height: 90, borderRadius: 45,
                            backgroundColor: colors.surfaceVariant,
                            justifyContent: "center", alignItems: "center", marginBottom: 20,
                        }}>
                            <Ionicons name="person-outline" size={40} color={colors.textMuted} />
                        </View>
                        <Text style={{ fontSize: 22, fontWeight: "700", color: colors.textPrimary, marginBottom: 10 }}>
                            Welcome to A2S Cinemas
                        </Text>
                        <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center", lineHeight: 21, marginBottom: 32 }}>
                            Sign in to access your library, purchases, and personalised experience.
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.push("/sign-in")}
                            style={{ backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 15, width: "100%", alignItems: "center" }}
                        >
                            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Sign In</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => router.push("/sign-up")}
                            style={{
                                marginTop: 14, borderRadius: 14, paddingVertical: 15,
                                width: "100%", alignItems: "center",
                                backgroundColor: colors.surfaceVariant, borderWidth: 0.5, borderColor: colors.border,
                            }}
                        >
                            <Text style={{ color: colors.textPrimary, fontWeight: "700", fontSize: 16 }}>Create Account</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    const avatarLetter = user?.name?.charAt(0)?.toUpperCase() || "U";

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                <View style={{ height: 200, position: "relative" }}>
                    <LinearGradient
                        colors={isDark ? ["#1a0a0a", "#1a0010", "#0A0A0F"] : ["#ffeaea", "#fff0f0", "#ffffff"]}
                        style={{ flex: 1 }}
                    />
                    <SafeAreaView edges={["top"]} style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
                        <View style={{
                            flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                            paddingHorizontal: 20, paddingVertical: 12,
                        }}>
                            <Text style={{ fontSize: 22, fontWeight: "800", color: colors.textPrimary }}>Profile</Text>
                            <ThemeToggle size={20} />
                        </View>
                    </SafeAreaView>
                    <View style={{ position: "absolute", bottom: -36, left: 0, right: 0, alignItems: "center" }}>
                        <View style={{
                            width: 80, height: 80, borderRadius: 40,
                            backgroundColor: colors.accent, justifyContent: "center", alignItems: "center",
                            borderWidth: 4, borderColor: colors.background,
                        }}>
                            <Text style={{ color: "#fff", fontSize: 32, fontWeight: "800" }}>{avatarLetter}</Text>
                        </View>
                    </View>
                </View>

                <View style={{ alignItems: "center", marginTop: 46, marginBottom: 24, paddingHorizontal: 20 }}>
                    <Text style={{ fontSize: 20, fontWeight: "800", color: colors.textPrimary }}>{user?.name}</Text>
                    <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 4 }}>{user?.email}</Text>
                    <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                        <TouchableOpacity
                            onPress={openEditName}
                            style={{
                                flexDirection: "row", alignItems: "center", gap: 5,
                                paddingHorizontal: 16, paddingVertical: 8,
                                backgroundColor: colors.surfaceVariant,
                                borderRadius: 20, borderWidth: 0.5, borderColor: colors.border,
                            }}
                        >
                            <Ionicons name="pencil-outline" size={14} color={colors.textSecondary} />
                            <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: "600" }}>Edit Name</Text>
                        </TouchableOpacity>
                        {user?.role === "admin" && (
                            <TouchableOpacity
                                onPress={() => router.push("/admin" as any)}
                                style={{
                                    flexDirection: "row", alignItems: "center", gap: 5,
                                    paddingHorizontal: 16, paddingVertical: 8,
                                    backgroundColor: colors.accent, borderRadius: 20,
                                }}
                            >
                                <Ionicons name="shield-checkmark-outline" size={14} color="#fff" />
                                <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>Admin Panel</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <View style={{ paddingHorizontal: 16 }}>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textMuted, marginBottom: 8, paddingHorizontal: 4, textTransform: "uppercase", letterSpacing: 1 }}>
                        My Content
                    </Text>
                    <SectionCard colors={colors}>
                        <MenuRow icon="library-outline" label="My Library" onPress={() => router.push("/(tabs)/library" as any)} colors={colors} />
                        <MenuRow icon="receipt-outline" label="Purchase History" onPress={() => router.push("/purchases" as any)} colors={colors} isLast />
                    </SectionCard>

                    <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textMuted, marginBottom: 8, paddingHorizontal: 4, textTransform: "uppercase", letterSpacing: 1 }}>
                        Appearance
                    </Text>
                    <SectionCard colors={colors}>
                        <View style={{
                            flexDirection: "row", alignItems: "center",
                            paddingHorizontal: 16, paddingVertical: 15,
                            borderBottomWidth: 0.5, borderBottomColor: colors.divider,
                        }}>
                            <View style={{
                                width: 38, height: 38, borderRadius: 10,
                                backgroundColor: colors.surfaceVariant,
                                justifyContent: "center", alignItems: "center", marginRight: 14,
                            }}>
                                <Ionicons name={isDark ? "moon" : "sunny"} size={18} color={isDark ? "#a78bfa" : "#f59e0b"} />
                            </View>
                            <Text style={{ flex: 1, fontSize: 15, fontWeight: "500", color: colors.textPrimary }}>Dark Mode</Text>
                            <ThemeToggle size={18} />
                        </View>
                        <View style={{ padding: 16 }}>
                            <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 10, fontWeight: "600" }}>THEME MODE</Text>
                            <View style={{ flexDirection: "row", gap: 8 }}>
                                {(["light", "dark", "system"] as const).map((m) => (
                                    <TouchableOpacity
                                        key={m} onPress={() => setMode(m)}
                                        style={{
                                            flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center",
                                            backgroundColor: mode === m ? colors.accent : colors.surfaceVariant,
                                            borderWidth: 0.5, borderColor: mode === m ? colors.accent : colors.border,
                                        }}
                                    >
                                        <Ionicons
                                            name={m === "light" ? "sunny-outline" : m === "dark" ? "moon-outline" : "phone-portrait-outline"}
                                            size={16} color={mode === m ? "#fff" : colors.textSecondary}
                                        />
                                        <Text style={{ fontSize: 11, fontWeight: "700", marginTop: 4, color: mode === m ? "#fff" : colors.textSecondary, textTransform: "capitalize" }}>
                                            {m}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </SectionCard>

                    <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textMuted, marginBottom: 8, paddingHorizontal: 4, textTransform: "uppercase", letterSpacing: 1 }}>
                        Account
                    </Text>
                    <SectionCard colors={colors}>
                        <MenuRow icon="lock-closed-outline" label="Change Password" onPress={() => setChangePwVisible(true)} colors={colors} />
                        {/* Fix 9 — route to support/index not /support */}
                        <MenuRow icon="help-circle-outline" label="Help Center" onPress={() => router.push("/support" as any)} colors={colors} isLast />

                    </SectionCard>

                    <SectionCard colors={colors}>
                        {/* Fix 4 — ConfirmModal replaces system Alert */}
                        <MenuRow icon="log-out-outline" label="Sign Out" onPress={() => setSignOutVisible(true)} colors={colors} isLast danger rightContent={<View />} />
                    </SectionCard>

                    <Text style={{ textAlign: "center", color: colors.textMuted, fontSize: 12, marginTop: 8 }}>
                        A2S Cinemas v1.0.0
                    </Text>
                </View>
            </ScrollView>

            {/* Fix 4 — Custom red ConfirmModal for sign out */}
            <ConfirmModal
                visible={signOutVisible}
                title="Sign Out"
                message="Are you sure you want to sign out?"
                confirmLabel="Sign Out"
                cancelLabel="Cancel"
                danger
                onConfirm={async () => {
                    setSignOutVisible(false);
                    await logout();
                    router.replace("/sign-in");
                }}
                onCancel={() => setSignOutVisible(false)}
            />

            {/* Edit Name Modal */}
            <Modal visible={editNameVisible} transparent animationType="fade" onRequestClose={() => setEditNameVisible(false)}>
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "center", padding: 24 }}>
                    <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 24 }}>
                        <Text style={{ fontSize: 17, fontWeight: "700", color: colors.textPrimary, marginBottom: 16 }}>Edit Name</Text>
                        <TextInput
                            value={newName} onChangeText={setNewName} placeholder="Your name"
                            placeholderTextColor={colors.inputPlaceholder}
                            style={{
                                backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder,
                                borderRadius: 12, padding: 14, fontSize: 15, color: colors.inputText, marginBottom: 20,
                            }}
                        />
                        <View style={{ flexDirection: "row", gap: 10 }}>
                            <TouchableOpacity
                                onPress={() => setEditNameVisible(false)}
                                style={{
                                    flex: 1, paddingVertical: 14, borderRadius: 12,
                                    backgroundColor: colors.surfaceVariant, alignItems: "center",
                                    borderWidth: 0.5, borderColor: colors.border,
                                }}
                            >
                                <Text style={{ color: colors.textSecondary, fontWeight: "600" }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={saveName} disabled={saving}
                                style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.accent, alignItems: "center" }}
                            >
                                <Text style={{ color: "#fff", fontWeight: "700" }}>{saving ? "Saving..." : "Save"}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Change Password Modal */}
            <Modal visible={changePwVisible} transparent animationType="slide" onRequestClose={() => setChangePwVisible(false)}>
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" }}>
                    <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
                        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: 20 }} />
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.textPrimary }}>Change Password</Text>
                            <TouchableOpacity
                                onPress={() => { setChangePwVisible(false); setOldPw(""); setNewPw(""); setConfirmPw(""); }}
                                style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: colors.surfaceVariant, justifyContent: "center", alignItems: "center" }}
                            >
                                <Ionicons name="close" size={16} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <PwField label="Current Password" value={oldPw} onChangeText={setOldPw} show={showOld} onToggle={() => setShowOld(!showOld)} colors={colors} />
                        <View style={{ height: 12 }} />
                        <PwField label="New Password" value={newPw} onChangeText={setNewPw} show={showNew} onToggle={() => setShowNew(!showNew)} colors={colors} />
                        <View style={{ height: 12 }} />
                        <PwField label="Confirm New Password" value={confirmPw} onChangeText={setConfirmPw} show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} colors={colors} />
                        <View style={{ height: 24 }} />
                        <TouchableOpacity
                            onPress={changePassword} disabled={changingPw}
                            style={{ backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 16, alignItems: "center" }}
                        >
                            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                                {changingPw ? "Updating..." : "Update Password"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}