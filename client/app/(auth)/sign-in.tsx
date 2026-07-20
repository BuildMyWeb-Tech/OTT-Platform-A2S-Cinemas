import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator, KeyboardAvoidingView, Platform,
    ScrollView, StatusBar, Text, TextInput,
    TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import api from "@/constants/api";

type LoginMode = "password" | "email_otp" | "phone_otp";

export default function SignIn() {
    const router = useRouter();
    const { login } = useAuth();
    const { colors, isDark } = useTheme();

    const [mode, setMode] = useState<LoginMode>("password");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const phoneEnabled = process.env.EXPO_PUBLIC_PHONE_OTP_ENABLED === "yes";
    const emailOtpEnabled = process.env.EXPO_PUBLIC_EMAIL_OTP_ENABLED === "yes";

    const handlePasswordLogin = async () => {
        if (!email || !password) {
            return Toast.show({ type: "error", text1: "Missing fields", text2: "Enter email and password" });
        }
        setLoading(true);
        const result = await login(email.trim().toLowerCase(), password);
        setLoading(false);
        if (result.success) {
            router.replace("/");
        } else {
            Toast.show({ type: "error", text1: "Login failed", text2: result.message || "Invalid credentials" });
        }
    };

    const handleSendOTP = async () => {
        const identifier = mode === "phone_otp" ? phone.trim() : email.trim().toLowerCase();
        const type = mode === "phone_otp" ? "phone" : "email";

        if (!identifier) {
            return Toast.show({ type: "error", text1: "Required", text2: `Enter your ${type === "phone" ? "mobile number" : "email"}` });
        }

        setLoading(true);
        try {
            const { data } = await api.post("/auth/otp/send", {
                identifier,
                type,
                purpose: "login",
            });
            if (data.success) {
                Toast.show({ type: "success", text1: "OTP sent!", text2: data.message });
                router.push({
                    pathname: "/otp-verify" as any,
                    params: { identifier, type, purpose: "login" },
                });
            } else {
                Toast.show({ type: "error", text1: "Failed", text2: data.message });
            }
        } catch (e: any) {
            Toast.show({ type: "error", text1: "Error", text2: e.response?.data?.message || "Failed to send OTP" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
            <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === "android" ? 24 : 0}>
                    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 28 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

                        <TouchableOpacity
                            onPress={() => router.push("/")}
                            style={{ position: "absolute", top: 12, left: 0, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceVariant, justifyContent: "center", alignItems: "center" }}
                        >
                            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
                        </TouchableOpacity>

                        <View style={{ alignItems: "center", marginBottom: 32, marginTop: 20 }}>
                            <Text style={{ fontSize: 30, fontWeight: "800", color: colors.accent, marginBottom: 6 }}>🎬 A2S Cinemas</Text>
                            <Text style={{ fontSize: 26, fontWeight: "700", color: colors.textPrimary, marginBottom: 6 }}>Welcome Back</Text>
                            <Text style={{ fontSize: 14, color: colors.textSecondary }}>Sign in to continue watching</Text>
                        </View>

                        {/* ── MODE TABS ── */}
                        <View style={{ flexDirection: "row", backgroundColor: colors.surfaceVariant, borderRadius: 12, padding: 4, marginBottom: 24, gap: 4 }}>
                            <TouchableOpacity
                                onPress={() => setMode("password")}
                                style={{ flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: "center", backgroundColor: mode === "password" ? colors.background : "transparent" }}
                            >
                                <Text style={{ fontSize: 13, fontWeight: "600", color: mode === "password" ? colors.textPrimary : colors.textMuted }}>Password</Text>
                            </TouchableOpacity>
                            {emailOtpEnabled && (
                                <TouchableOpacity
                                    onPress={() => setMode("email_otp")}
                                    style={{ flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: "center", backgroundColor: mode === "email_otp" ? colors.background : "transparent" }}
                                >
                                    <Text style={{ fontSize: 13, fontWeight: "600", color: mode === "email_otp" ? colors.textPrimary : colors.textMuted }}>Email OTP</Text>
                                </TouchableOpacity>
                            )}
                            {phoneEnabled && (
                                <TouchableOpacity
                                    onPress={() => setMode("phone_otp")}
                                    style={{ flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: "center", backgroundColor: mode === "phone_otp" ? colors.background : "transparent" }}
                                >
                                    <Text style={{ fontSize: 13, fontWeight: "600", color: mode === "phone_otp" ? colors.textPrimary : colors.textMuted }}>Phone OTP</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* ── PASSWORD MODE ── */}
                        {mode === "password" && (
                            <>
                                <View style={{ marginBottom: 16 }}>
                                    <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 8 }}>Email</Text>
                                    <TextInput
                                        style={{ backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 14, padding: 16, fontSize: 15, color: colors.inputText }}
                                        placeholder="user@example.com"
                                        placeholderTextColor={colors.inputPlaceholder}
                                        autoCapitalize="none" keyboardType="email-address"
                                        value={email} onChangeText={setEmail} returnKeyType="next"
                                    />
                                </View>
                                <View style={{ marginBottom: 28 }}>
                                    <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 8 }}>Password</Text>
                                    <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 4 }}>
                                        <TextInput
                                            style={{ flex: 1, fontSize: 15, color: colors.inputText, paddingVertical: 12 }}
                                            placeholder="••••••••" placeholderTextColor={colors.inputPlaceholder}
                                            secureTextEntry={!showPassword} value={password} onChangeText={setPassword}
                                            returnKeyType="go" onSubmitEditing={handlePasswordLogin}
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                                            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color={colors.textMuted} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={{ backgroundColor: loading || !email || !password ? colors.surfaceVariant : colors.accent, borderRadius: 14, paddingVertical: 17, alignItems: "center", marginBottom: 20 }}
                                    onPress={handlePasswordLogin} disabled={loading || !email || !password}
                                >
                                    {loading ? <ActivityIndicator color="#fff" /> : (
                                        <Text style={{ color: !email || !password ? colors.textMuted : "#fff", fontWeight: "700", fontSize: 16 }}>Sign In</Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}

                        {/* ── EMAIL OTP MODE ── */}
                        {mode === "email_otp" && (
                            <>
                                <View style={{ marginBottom: 28 }}>
                                    <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 8 }}>Email Address</Text>
                                    <TextInput
                                        style={{ backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 14, padding: 16, fontSize: 15, color: colors.inputText }}
                                        placeholder="user@example.com" placeholderTextColor={colors.inputPlaceholder}
                                        autoCapitalize="none" keyboardType="email-address"
                                        value={email} onChangeText={setEmail} returnKeyType="send" onSubmitEditing={handleSendOTP}
                                    />
                                </View>
                                <TouchableOpacity
                                    style={{ backgroundColor: loading || !email ? colors.surfaceVariant : colors.accent, borderRadius: 14, paddingVertical: 17, alignItems: "center", marginBottom: 20, flexDirection: "row", justifyContent: "center", gap: 8 }}
                                    onPress={handleSendOTP} disabled={loading || !email}
                                >
                                    {loading ? <ActivityIndicator color="#fff" /> : (
                                        <>
                                            <Ionicons name="mail-outline" size={18} color={!email ? colors.textMuted : "#fff"} />
                                            <Text style={{ color: !email ? colors.textMuted : "#fff", fontWeight: "700", fontSize: 16 }}>Send OTP</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}

                        {/* ── PHONE OTP MODE ── */}
                        {mode === "phone_otp" && (
                            <>
                                <View style={{ marginBottom: 28 }}>
                                    <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 8 }}>Mobile Number</Text>
                                    <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 14, paddingHorizontal: 16 }}>
                                        <Text style={{ fontSize: 15, color: colors.textSecondary, marginRight: 8, paddingVertical: 16 }}>+91</Text>
                                        <View style={{ width: 1, height: 24, backgroundColor: colors.border, marginRight: 12 }} />
                                        <TextInput
                                            style={{ flex: 1, fontSize: 15, color: colors.inputText, paddingVertical: 16 }}
                                            placeholder="9876543210" placeholderTextColor={colors.inputPlaceholder}
                                            keyboardType="phone-pad" maxLength={10}
                                            value={phone} onChangeText={setPhone} returnKeyType="send" onSubmitEditing={handleSendOTP}
                                        />
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={{ backgroundColor: loading || phone.length < 10 ? colors.surfaceVariant : colors.accent, borderRadius: 14, paddingVertical: 17, alignItems: "center", marginBottom: 20, flexDirection: "row", justifyContent: "center", gap: 8 }}
                                    onPress={handleSendOTP} disabled={loading || phone.length < 10}
                                >
                                    {loading ? <ActivityIndicator color="#fff" /> : (
                                        <>
                                            <Ionicons name="phone-portrait-outline" size={18} color={phone.length < 10 ? colors.textMuted : "#fff"} />
                                            <Text style={{ color: phone.length < 10 ? colors.textMuted : "#fff", fontWeight: "700", fontSize: 16 }}>Send OTP</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}

                        <View style={{ flexDirection: "row", justifyContent: "center", gap: 4 }}>
                            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Don't have an account?</Text>
                            <Link href="/sign-up"><Text style={{ color: colors.accent, fontWeight: "700", fontSize: 14 }}>Sign up</Text></Link>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}