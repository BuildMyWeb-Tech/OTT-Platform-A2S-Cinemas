import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator, KeyboardAvoidingView, Platform,
    ScrollView, StatusBar, Text, TextInput,
    TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import api from "@/constants/api";

export default function SignIn() {
    const router = useRouter();
    const { redirectTo } = useLocalSearchParams<{ redirectTo?: string }>();
    const { login } = useAuth();
    const { colors, isDark } = useTheme();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);

    // Email OTP is the only method shown
    // Password login still works via handlePasswordLogin (kept for admin/backend)
    // Phone OTP hidden entirely

    const handleSendOTP = async () => {
        if (!email.trim()) {
            return Toast.show({ type: "error", text1: "Enter email", text2: "Please enter your email address" });
        }
        setSendingOtp(true);
        try {
            const { data } = await api.post("/auth/otp/send", {
                identifier: email.trim().toLowerCase(),
                type: "email",
                purpose: "login",
            }, { timeout: 15_000 });
            if (data.success) {
                Toast.show({ type: "success", text1: "OTP sent!", text2: data.message });
                router.push({
                    pathname: "/(auth)/otp-verify" as any,
                    params: {
                        identifier: email.trim().toLowerCase(),
                        type: "email",
                        purpose: "login",
                        ...(redirectTo ? { redirectTo } : {}),
                    },
                });
            } else {
                Toast.show({ type: "error", text1: "Failed", text2: data.message });
            }
        } catch (e: any) {
            const isTimeout = e.code === "ECONNABORTED";
            Toast.show({
                type: "error",
                text1: isTimeout ? "Taking too long" : "Error",
                text2: isTimeout
                    ? "OTP is taking too long to send. Please try again."
                    : e.response?.data?.message || "Unable to send OTP right now. Please try again in a moment.",
            });
        } finally {
            setSendingOtp(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
            <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                    keyboardVerticalOffset={24}
                >
                    <ScrollView
                        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 28 }}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Back button */}
                        <TouchableOpacity
                            onPress={() => router.push("/")}
                            style={{
                                position: "absolute", top: 12, left: 0, zIndex: 10,
                                width: 40, height: 40, borderRadius: 20,
                                backgroundColor: colors.surfaceVariant,
                                justifyContent: "center", alignItems: "center",
                            }}
                        >
                            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
                        </TouchableOpacity>

                        {/* Header */}
                        <View style={{ alignItems: "center", marginBottom: 40, marginTop: 20 }}>
                            <Text style={{ fontSize: 30, fontWeight: "800", color: colors.accent, marginBottom: 6 }}>
                                🎬 A2S Cinemas
                            </Text>
                            <Text style={{ fontSize: 26, fontWeight: "700", color: colors.textPrimary, marginBottom: 6 }}>
                                Welcome Back
                            </Text>
                            <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                                Sign in with your email
                            </Text>
                        </View>

                        {/* Email field */}
                        <View style={{ marginBottom: 20 }}>
                            <Text style={{
                                fontSize: 13, fontWeight: "600",
                                color: colors.textSecondary, marginBottom: 8,
                            }}>
                                Email Address
                            </Text>
                            <TextInput
                                style={{
                                    backgroundColor: colors.inputBg,
                                    borderWidth: 1, borderColor: colors.inputBorder,
                                    borderRadius: 14, padding: 16,
                                    fontSize: 15, color: colors.inputText,
                                }}
                                placeholder="user@example.com"
                                placeholderTextColor={colors.inputPlaceholder}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                value={email}
                                onChangeText={setEmail}
                                returnKeyType="send"
                                onSubmitEditing={handleSendOTP}
                                autoFocus={false}
                            />
                        </View>

                        {/* Send OTP button */}
                        <TouchableOpacity
                            onPress={handleSendOTP}
                            disabled={sendingOtp || !email.trim()}
                            style={{
                                backgroundColor: sendingOtp || !email.trim()
                                    ? colors.surfaceVariant
                                    : colors.accent,
                                borderRadius: 14, paddingVertical: 17,
                                alignItems: "center", marginBottom: 20,
                                flexDirection: "row", justifyContent: "center", gap: 8,
                            }}
                        >
                            {sendingOtp ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons
                                        name="mail-outline"
                                        size={18}
                                        color={!email.trim() ? colors.textMuted : "#fff"}
                                    />
                                    <Text style={{
                                        color: !email.trim() ? colors.textMuted : "#fff",
                                        fontWeight: "700", fontSize: 16,
                                    }}>
                                        Send OTP
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Sign up link */}
                        <View style={{ flexDirection: "row", justifyContent: "center", gap: 4 }}>
                            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                                Don&apos;t have an account?
                            </Text>
                            <Link href={{ pathname: "/sign-up", params: redirectTo ? { redirectTo } : {} }}>
                                <Text style={{ color: colors.accent, fontWeight: "700", fontSize: 14 }}>
                                    Sign up
                                </Text>
                            </Link>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}