import { COLORS } from "@/constants";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator, Pressable, Text,
    TextInput, TouchableOpacity, View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function SignIn() {
    const router = useRouter();
    const { login } = useAuth();

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
        <SafeAreaView className="flex-1 bg-white justify-center" style={{ padding: 28 }}>
            <TouchableOpacity onPress={() => router.push("/")} className="absolute top-12 z-10">
                <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
            </TouchableOpacity>

            <View className="items-center mb-8">
                <Text style={{ fontSize: 28, fontWeight: "700", color: COLORS.accent, marginBottom: 4 }}>
                    🎬 A2S Cinemas
                </Text>
                <Text className="text-3xl font-bold text-primary mb-2">Welcome Back</Text>
                <Text className="text-secondary">Sign in to continue watching</Text>
            </View>

            {/* Email */}
            <View className="mb-4">
                <Text className="text-primary font-medium mb-2">Email</Text>
                <TextInput
                    className="w-full bg-surface p-4 rounded-xl text-primary"
                    placeholder="user@example.com"
                    placeholderTextColor="#999"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                />
            </View>

            {/* Password with eye icon */}
            <View className="mb-6">
                <Text className="text-primary font-medium mb-2">Password</Text>
                <View style={{
                    flexDirection: "row", alignItems: "center",
                    backgroundColor: "#F7F7F7", borderRadius: 12,
                    paddingHorizontal: 16, paddingVertical: 4,
                }}>
                    <TextInput
                        style={{ flex: 1, fontSize: 16, color: COLORS.primary, paddingVertical: 12 }}
                        placeholder="••••••••"
                        placeholderTextColor="#999"
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                        <Ionicons
                            name={showPassword ? "eye-off-outline" : "eye-outline"}
                            size={22}
                            color={COLORS.secondary}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            <Pressable
                style={{
                    backgroundColor: loading || !email || !password ? "#ccc" : COLORS.primary,
                    borderRadius: 50, paddingVertical: 16, alignItems: "center", marginBottom: 40,
                }}
                onPress={handleSignIn}
                disabled={loading || !email || !password}
            >
                {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Sign In</Text>
                }
            </Pressable>

            <View className="flex-row justify-center">
                <Text className="text-secondary">Don&apos;t have an account? </Text>
                <Link href="/sign-up">
                    <Text className="text-primary font-bold">Sign up</Text>
                </Link>
            </View>
        </SafeAreaView>
    );
}