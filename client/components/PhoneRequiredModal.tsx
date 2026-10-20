import { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import api from "@/constants/api";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

const PHONE_REGEX = /^[6-9]\d{9}$/;

// Blocking prompt shown to any signed-in (non-admin) user who has no phone number
// on file — covers accounts created before the phone field existed.
export default function PhoneRequiredModal() {
    const { colors } = useTheme();
    const { isSignedIn, token, refreshUser } = useAuth();
    const [visible, setVisible] = useState(false);
    const [phone, setPhone] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!isSignedIn) { setVisible(false); return; }
        api.get("/auth/me")
            .then(({ data }) => {
                if (data.success && data.data && !data.data.phone && data.data.role !== "admin") setVisible(true);
            })
            .catch(() => {});
    }, [isSignedIn, token]);

    const save = async () => {
        if (!PHONE_REGEX.test(phone)) {
            Toast.show({ type: "error", text1: "Invalid number", text2: "Enter a valid 10-digit mobile number" });
            return;
        }
        setSaving(true);
        try {
            await api.put("/auth/profile", { phone });
            await refreshUser?.();
            setVisible(false);
            Toast.show({ type: "success", text1: "Thanks!", text2: "Phone number saved" });
        } catch (e: any) {
            Toast.show({ type: "error", text1: "Error", text2: e.response?.data?.message || "Could not save phone number" });
        } finally { setSaving(false); }
    };

    if (!visible) return null;

    return (
        <Modal visible transparent animationType="fade" onRequestClose={() => {}}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", padding: 24 }}>
                <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 26, alignItems: "center" }}>
                    <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: colors.accent + "20", justifyContent: "center", alignItems: "center", marginBottom: 16 }}>
                        <Ionicons name="call-outline" size={28} color={colors.accent} />
                    </View>
                    <Text style={{ fontSize: 18, fontWeight: "800", color: colors.textPrimary, marginBottom: 8, textAlign: "center" }}>
                        Add your mobile number
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: "center", lineHeight: 20, marginBottom: 18 }}>
                        We use it for important updates and new release announcements. This is required to continue.
                    </Text>
                    <TextInput
                        value={phone}
                        onChangeText={(t) => setPhone(t.replace(/\D/g, "").slice(0, 10))}
                        placeholder="9876543210"
                        placeholderTextColor={colors.inputPlaceholder}
                        keyboardType="number-pad"
                        maxLength={10}
                        style={{
                            width: "100%", backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder,
                            borderRadius: 12, padding: 14, fontSize: 16, color: colors.inputText, marginBottom: 16, textAlign: "center",
                        }}
                    />
                    <TouchableOpacity
                        onPress={save}
                        disabled={saving || !PHONE_REGEX.test(phone)}
                        style={{
                            width: "100%", paddingVertical: 15, borderRadius: 14, alignItems: "center",
                            backgroundColor: PHONE_REGEX.test(phone) ? colors.accent : colors.surfaceVariant,
                        }}
                    >
                        {saving ? <ActivityIndicator color="#fff" /> : (
                            <Text style={{ color: PHONE_REGEX.test(phone) ? "#fff" : colors.textMuted, fontWeight: "700", fontSize: 16 }}>Save & Continue</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
