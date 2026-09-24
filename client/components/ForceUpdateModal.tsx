import { useEffect, useState } from "react";
import { Modal, View, Text, TouchableOpacity, Linking, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import api from "@/constants/api";
import { useTheme } from "@/context/ThemeContext";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.a2scinemas.app";

// "1.2.10" -> [1,2,10]; compares part by part, missing parts treated as 0.
function isVersionBelow(current: string, min: string): boolean {
    const c = current.split(".").map((n) => parseInt(n, 10) || 0);
    const m = min.split(".").map((n) => parseInt(n, 10) || 0);
    for (let i = 0; i < Math.max(c.length, m.length); i++) {
        const cv = c[i] ?? 0;
        const mv = m[i] ?? 0;
        if (cv < mv) return true;
        if (cv > mv) return false;
    }
    return false;
}

export default function ForceUpdateModal() {
    const { colors } = useTheme();
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        api.get("/config/version")
            .then(({ data }) => {
                const currentVersion = Constants.expoConfig?.version || "0.0.0";
                const { minVersion, updateMessage } = data.data;
                if (minVersion && isVersionBelow(currentVersion, minVersion)) {
                    setMessage(updateMessage || "A new version of A2S Cinemas is available. Please update to continue.");
                    setVisible(true);
                }
            })
            .catch(() => {});
    }, []);

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", padding: 28 }}>
                <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 28, alignItems: "center" }}>
                    <View style={{
                        width: 64, height: 64, borderRadius: 32,
                        backgroundColor: colors.accent + "20",
                        justifyContent: "center", alignItems: "center", marginBottom: 18,
                    }}>
                        <Ionicons name="cloud-download-outline" size={30} color={colors.accent} />
                    </View>
                    <Text style={{ fontSize: 19, fontWeight: "800", color: colors.textPrimary, marginBottom: 10, textAlign: "center" }}>
                        Update Required
                    </Text>
                    <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center", lineHeight: 21, marginBottom: 24 }}>
                        {message}
                    </Text>
                    <TouchableOpacity
                        onPress={() => Linking.openURL(Platform.OS === "android" ? PLAY_STORE_URL : PLAY_STORE_URL)}
                        style={{ backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 15, width: "100%", alignItems: "center" }}
                    >
                        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Update Now</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}
