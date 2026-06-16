import { COLORS } from "@/constants";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput,
    TouchableOpacity, View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function SignUp() {
    const router = useRouter();
    const { register } = useAuth();

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
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === "android" ? 24 : 0}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 28 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <TouchableOpacity onPress={() => router.push("/")} style={{ position: "absolute", top: 12, left: 28, zIndex: 10 }}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
                    </TouchableOpacity>

                    <View className="items-center mb-8">
                        <Text style={{ fontSize: 28, fontWeight: "700", color: COLORS.accent, marginBottom: 4 }}>
                            🎬 A2S Cinemas
                        </Text>
                        <Text className="text-3xl font-bold text-primary mb-2">Create Account</Text>
                        <Text className="text-secondary">Sign up to start watching</Text>
                    </View>

                    {/* Full Name */}
                    <View className="mb-4">
                        <Text className="text-primary font-medium mb-2">Full Name</Text>
                        <TextInput
                            className="w-full bg-surface p-4 rounded-xl text-primary"
                            placeholder="John Doe"
                            placeholderTextColor="#999"
                            value={name}
                            onChangeText={setName}
                            returnKeyType="next"
                        />
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
                            returnKeyType="next"
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
                                placeholder="Min. 6 characters"
                                placeholderTextColor="#999"
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
                                    color={COLORS.secondary}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={{
                            backgroundColor: COLORS.primary, borderRadius: 50,
                            paddingVertical: 16, alignItems: "center", marginBottom: 24,
                        }}
                        onPress={handleSignUp}
                        disabled={loading}
                    >
                        {loading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Create Account</Text>
                        }
                    </TouchableOpacity>

                    <View className="flex-row justify-center mb-8">
                        <Text className="text-secondary">Already have an account? </Text>
                        <Link href="/sign-in">
                            <Text className="text-primary font-bold">Login</Text>
                        </Link>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}