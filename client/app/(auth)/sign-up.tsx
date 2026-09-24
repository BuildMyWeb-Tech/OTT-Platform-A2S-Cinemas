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

export default function SignUp() {
    const router = useRouter();
    const { redirectTo } = useLocalSearchParams<{ redirectTo?: string }>();
    const { colors, isDark } = useTheme();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);

    const PHONE_REGEX = /^[6-9]\d{9}$/;

    const handleSendOTP = async () => {
        if (!name.trim()) {
            return Toast.show({ type: "error", text1: "Name required", text2: "Enter your full name" });
        }
        if (!email.trim()) {
            return Toast.show({ type: "error", text1: "Email required", text2: "Enter your email address" });
        }
        if (!PHONE_REGEX.test(phone.trim())) {
            return Toast.show({ type: "error", text1: "Phone required", text2: "Enter a valid 10-digit mobile number" });
        }
        setLoading(true);
        try {
            const { data } = await api.post("/auth/otp/send", {
                identifier: email.trim().toLowerCase(),
                type: "email",
                purpose: "register",
                name: name.trim(),
            }, { timeout: 15_000 });
            if (data.success) {
                Toast.show({ type: "success", text1: "OTP sent!", text2: data.message });
                router.push({
                    pathname: "/(auth)/otp-verify" as any,
                    params: {
                        identifier: email.trim().toLowerCase(),
                        type: "email",
                        purpose: "register",
                        name: name.trim(),
                        phone: phone.trim(),
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
            setLoading(false);
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
                            onPress={() => router.back()}
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
                        <View style={{ alignItems: "center", marginBottom: 32, marginTop: 20 }}>
                            <Text style={{ fontSize: 30, fontWeight: "800", color: colors.accent, marginBottom: 6 }}>
                                🎬 A2S Cinemas
                            </Text>
                            <Text style={{ fontSize: 26, fontWeight: "700", color: colors.textPrimary, marginBottom: 6 }}>
                                Create Account
                            </Text>
                            <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                                Sign up to start watching
                            </Text>
                        </View>

                        {/* Full Name — always shown */}
                        <View style={{ marginBottom: 16 }}>
                            <Text style={{
                                fontSize: 13, fontWeight: "600",
                                color: colors.textSecondary, marginBottom: 8,
                            }}>
                                Full Name
                            </Text>
                            <TextInput
                                style={{
                                    backgroundColor: colors.inputBg,
                                    borderWidth: 1, borderColor: colors.inputBorder,
                                    borderRadius: 14, padding: 16,
                                    fontSize: 15, color: colors.inputText,
                                }}
                                placeholder="Ajai Kumar"
                                placeholderTextColor={colors.inputPlaceholder}
                                value={name}
                                onChangeText={setName}
                                returnKeyType="next"
                            />
                        </View>

                        {/* Email — always shown */}
                        <View style={{ marginBottom: 16 }}>
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
                                returnKeyType="next"
                            />
                        </View>

                        {/* Phone — always shown */}
                        <View style={{ marginBottom: 16 }}>
                            <Text style={{
                                fontSize: 13, fontWeight: "600",
                                color: colors.textSecondary, marginBottom: 8,
                            }}>
                                Phone Number
                            </Text>
                            <TextInput
                                style={{
                                    backgroundColor: colors.inputBg,
                                    borderWidth: 1, borderColor: colors.inputBorder,
                                    borderRadius: 14, padding: 16,
                                    fontSize: 15, color: colors.inputText,
                                }}
                                placeholder="9876543210"
                                placeholderTextColor={colors.inputPlaceholder}
                                keyboardType="number-pad"
                                maxLength={10}
                                value={phone}
                                onChangeText={(t) => setPhone(t.replace(/\D/g, "").slice(0, 10))}
                                returnKeyType="done"
                            />
                        </View>

                        {/* Send OTP to Email */}
                        <TouchableOpacity
                            onPress={handleSendOTP}
                            disabled={loading || !email.trim() || !name.trim() || !PHONE_REGEX.test(phone.trim())}
                            style={{
                                backgroundColor: loading || !email.trim() || !name.trim() || !PHONE_REGEX.test(phone.trim())
                                    ? colors.surfaceVariant
                                    : colors.accent,
                                borderRadius: 14, paddingVertical: 17,
                                alignItems: "center", marginBottom: 20,
                                flexDirection: "row", justifyContent: "center", gap: 8,
                            }}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons
                                        name="mail-outline"
                                        size={18}
                                        color={!email.trim() || !name.trim() ? colors.textMuted : "#fff"}
                                    />
                                    <Text style={{
                                        color: !email.trim() || !name.trim() ? colors.textMuted : "#fff",
                                        fontWeight: "700", fontSize: 16,
                                    }}>
                                        Send OTP to Email
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Sign in link */}
                        <View style={{ flexDirection: "row", justifyContent: "center", gap: 4 }}>
                            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                                Already have an account?
                            </Text>
                            <Link href={{ pathname: "/sign-in", params: redirectTo ? { redirectTo } : {} }}>
                                <Text style={{ color: colors.accent, fontWeight: "700", fontSize: 14 }}>
                                    Login
                                </Text>
                            </Link>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}