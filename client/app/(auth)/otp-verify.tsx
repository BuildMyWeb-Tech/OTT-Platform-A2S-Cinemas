import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator, KeyboardAvoidingView, Platform,
    ScrollView, StatusBar, Text, TextInput,
    TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function OTPVerify() {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const { loginWithOTP } = useAuth();
    const params = useLocalSearchParams<{
        identifier: string;
        type: "phone" | "email";
        purpose: "login" | "register";
        name?: string;
    }>();

    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const inputRefs = useRef<(TextInput | null)[]>([]);

    useEffect(() => {
        let timer: ReturnType<typeof setInterval>;
        if (countdown > 0) {
            timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) { setCanResend(true); return 0; }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [countdown]);

    const handleOtpChange = (value: string, index: number) => {
        if (!/^\d*$/.test(value)) return; // digits only
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1); // take last digit
        setOtp(newOtp);
        // Auto-advance
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
        // Auto-submit when all 6 filled
        if (value && index === 5) {
            const fullOtp = [...newOtp.slice(0, 5), value.slice(-1)].join("");
            if (fullOtp.length === 6) handleVerify(fullOtp);
        }
    };

    const handleKeyPress = (key: string, index: number) => {
        if (key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async (otpValue?: string) => {
        const finalOtp = otpValue || otp.join("");
        if (finalOtp.length !== 6) {
            return Toast.show({ type: "error", text1: "Enter 6-digit OTP" });
        }
        setLoading(true);
        const result = await loginWithOTP(
            params.identifier,
            params.type,
            finalOtp,
            params.purpose,
            params.name,
        );
        setLoading(false);
        if (result.success) {
            router.replace("/");
        } else {
            Toast.show({ type: "error", text1: "Verification failed", text2: result.message });
            // Clear OTP on error
            setOtp(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
        }
    };

    const handleResend = async () => {
        if (!canResend) return;
        setResendLoading(true);
        try {
            const api = (await import("@/constants/api")).default;
            const { data } = await api.post("/auth/otp/send", {
                identifier: params.identifier,
                type: params.type,
                purpose: params.purpose,
                name: params.name,
            });
            if (data.success) {
                Toast.show({ type: "success", text1: "OTP resent!" });
                setCountdown(60);
                setCanResend(false);
                setOtp(["", "", "", "", "", ""]);
                inputRefs.current[0]?.focus();
            } else {
                Toast.show({ type: "error", text1: data.message });
            }
        } catch (e: any) {
            Toast.show({ type: "error", text1: e.response?.data?.message || "Failed to resend" });
        } finally {
            setResendLoading(false);
        }
    };

    const maskedId = params.type === "phone"
        ? `+91 ****${params.identifier.slice(-4)}`
        : `${params.identifier.slice(0, 3)}***@${params.identifier.split("@")[1]}`;

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
            <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 28 }} keyboardShouldPersistTaps="handled">

                        {/* Back */}
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={{ position: "absolute", top: 12, left: 0, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceVariant, justifyContent: "center", alignItems: "center" }}
                        >
                            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
                        </TouchableOpacity>

                        {/* Header */}
                        <View style={{ alignItems: "center", marginBottom: 40, marginTop: 20 }}>
                            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.accent + "20", justifyContent: "center", alignItems: "center", marginBottom: 20 }}>
                                <Ionicons name={params.type === "phone" ? "phone-portrait-outline" : "mail-outline"} size={32} color={colors.accent} />
                            </View>
                            <Text style={{ fontSize: 24, fontWeight: "800", color: colors.textPrimary, marginBottom: 10 }}>
                                Verify OTP
                            </Text>
                            <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center", lineHeight: 20 }}>
                                Enter the 6-digit code sent to
                            </Text>
                            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.textPrimary, marginTop: 4 }}>
                                {maskedId}
                            </Text>
                        </View>

                        {/* OTP Input Boxes */}
                        <View style={{ flexDirection: "row", justifyContent: "center", gap: 10, marginBottom: 32 }}>
                            {otp.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={(ref) => { inputRefs.current[index] = ref; }}
                                    value={digit}
                                    onChangeText={(val) => handleOtpChange(val, index)}
                                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                                    style={{
                                        width: 46, height: 56, borderRadius: 12,
                                        borderWidth: digit ? 2 : 1.5,
                                        borderColor: digit ? colors.accent : colors.inputBorder,
                                        backgroundColor: colors.inputBg,
                                        textAlign: "center", fontSize: 22, fontWeight: "700",
                                        color: colors.inputText,
                                    }}
                                    keyboardType="number-pad"
                                    maxLength={1}
                                    autoFocus={index === 0}
                                    selectTextOnFocus
                                />
                            ))}
                        </View>

                        {/* Verify Button */}
                        <TouchableOpacity
                            onPress={() => handleVerify()}
                            disabled={loading || otp.join("").length !== 6}
                            style={{
                                backgroundColor: otp.join("").length === 6 ? colors.accent : colors.surfaceVariant,
                                borderRadius: 14, paddingVertical: 17,
                                alignItems: "center", marginBottom: 24,
                            }}
                        >
                            {loading
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={{ color: otp.join("").length === 6 ? "#fff" : colors.textMuted, fontWeight: "700", fontSize: 16 }}>
                                    Verify & Continue
                                </Text>
                            }
                        </TouchableOpacity>

                        {/* Resend */}
                        <View style={{ alignItems: "center" }}>
                            {canResend ? (
                                <TouchableOpacity onPress={handleResend} disabled={resendLoading}>
                                    {resendLoading
                                        ? <ActivityIndicator size="small" color={colors.accent} />
                                        : <Text style={{ color: colors.accent, fontWeight: "600", fontSize: 14 }}>Resend OTP</Text>
                                    }
                                </TouchableOpacity>
                            ) : (
                                <Text style={{ color: colors.textMuted, fontSize: 14 }}>
                                    Resend OTP in <Text style={{ color: colors.textPrimary, fontWeight: "600" }}>{countdown}s</Text>
                                </Text>
                            )}
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}