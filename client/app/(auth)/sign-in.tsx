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

export default function SignIn() {
    const router = useRouter();
    const { login } = useAuth();
    const { colors, isDark } = useTheme();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSignIn = async () => {
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

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
            <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                    keyboardVerticalOffset={Platform.OS === "android" ? 24 : 0}
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

                        {/* Logo + heading */}
                        <View style={{ alignItems: "center", marginBottom: 40, marginTop: 20 }}>
                            <Text style={{ fontSize: 30, fontWeight: "800", color: colors.accent, marginBottom: 6 }}>
                                🎬 A2S Cinemas
                            </Text>
                            <Text style={{ fontSize: 26, fontWeight: "700", color: colors.textPrimary, marginBottom: 6 }}>
                                Welcome Back
                            </Text>
                            <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                                Sign in to continue watching
                            </Text>
                        </View>

                        {/* Email */}
                        <View style={{ marginBottom: 16 }}>
                            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 8 }}>
                                Email
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

                        {/* Password */}
                        <View style={{ marginBottom: 28 }}>
                            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 8 }}>
                                Password
                            </Text>
                            <View style={{
                                flexDirection: "row", alignItems: "center",
                                backgroundColor: colors.inputBg,
                                borderWidth: 1, borderColor: colors.inputBorder,
                                borderRadius: 14, paddingHorizontal: 16, paddingVertical: 4,
                            }}>
                                <TextInput
                                    style={{ flex: 1, fontSize: 15, color: colors.inputText, paddingVertical: 12 }}
                                    placeholder="••••••••"
                                    placeholderTextColor={colors.inputPlaceholder}
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={setPassword}
                                    returnKeyType="go"
                                    onSubmitEditing={handleSignIn}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                                    <Ionicons
                                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                                        size={22}
                                        color={colors.textMuted}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Sign in button */}
                        <TouchableOpacity
                            style={{
                                backgroundColor: loading || !email || !password ? colors.surfaceVariant : colors.accent,
                                borderRadius: 14, paddingVertical: 17,
                                alignItems: "center", marginBottom: 20,
                            }}
                            onPress={handleSignIn}
                            disabled={loading || !email || !password}
                            activeOpacity={0.85}
                        >
                            {loading
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={{
                                    color: loading || !email || !password ? colors.textMuted : "#fff",
                                    fontWeight: "700", fontSize: 16,
                                }}>
                                    Sign In
                                </Text>
                            }
                        </TouchableOpacity>

                        {/* Sign up link */}
                        <View style={{ flexDirection: "row", justifyContent: "center", gap: 4 }}>
                            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                                Don't have an account?
                            </Text>
                            <Link href="/sign-up">
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