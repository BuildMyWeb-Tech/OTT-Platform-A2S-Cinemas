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

export default function SignUp() {
    const router = useRouter();
    const { register } = useAuth();
    const { colors, isDark } = useTheme();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSignUp = async () => {
        if (!name || !email || !password) {
            return Toast.show({ type: "error", text1: "Missing fields", text2: "Please fill in all fields" });
        }
        if (password.length < 6) {
            return Toast.show({ type: "error", text1: "Weak password", text2: "Password must be at least 6 characters" });
        }
        setLoading(true);
        const result = await register(name.trim(), email.trim().toLowerCase(), password);
        setLoading(false);
        if (result.success) {
            Toast.show({ type: "success", text1: "Account created!", text2: "Welcome to A2S Cinemas" });
            router.replace("/");
        } else {
            Toast.show({ type: "error", text1: "Registration failed", text2: result.message || "Something went wrong" });
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

                        {/* Logo + heading */}
                        <View style={{ alignItems: "center", marginBottom: 36, marginTop: 20 }}>
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

                        {/* Full Name */}
                        <View style={{ marginBottom: 16 }}>
                            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 8 }}>
                                Full Name
                            </Text>
                            <TextInput
                                style={{
                                    backgroundColor: colors.inputBg,
                                    borderWidth: 1, borderColor: colors.inputBorder,
                                    borderRadius: 14, padding: 16,
                                    fontSize: 15, color: colors.inputText,
                                }}
                                placeholder="John Doe"
                                placeholderTextColor={colors.inputPlaceholder}
                                value={name}
                                onChangeText={setName}
                                returnKeyType="next"
                            />
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
                                    placeholder="Min. 6 characters"
                                    placeholderTextColor={colors.inputPlaceholder}
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={setPassword}
                                    returnKeyType="go"
                                    onSubmitEditing={handleSignUp}
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

                        {/* Create account button */}
                        <TouchableOpacity
                            style={{
                                backgroundColor: colors.accent,
                                borderRadius: 14, paddingVertical: 17,
                                alignItems: "center", marginBottom: 20,
                                opacity: loading ? 0.7 : 1,
                            }}
                            onPress={handleSignUp}
                            disabled={loading}
                            activeOpacity={0.85}
                        >
                            {loading
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                                    Create Account
                                </Text>
                            }
                        </TouchableOpacity>

                        {/* Sign in link */}
                        <View style={{ flexDirection: "row", justifyContent: "center", gap: 4 }}>
                            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                                Already have an account?
                            </Text>
                            <Link href="/sign-in">
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