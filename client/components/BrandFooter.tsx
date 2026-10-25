import { Linking, Text, TouchableOpacity, View } from "react-native";
import Constants from "expo-constants";
import { useTheme } from "@/context/ThemeContext";

export const APP_VERSION = Constants.expoConfig?.version ?? "";

export default function BrandFooter({ showVersion = false }: { showVersion?: boolean }) {
    const { colors } = useTheme();
    return (
        <View style={{ alignItems: "center", paddingVertical: 20 }}>
            {showVersion && (
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>A2S Cinemas v{APP_VERSION}</Text>
            )}
            <TouchableOpacity
                onPress={() => Linking.openURL("https://buildmyweb.info").catch(() => {})}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
                style={{ marginTop: showVersion ? 4 : 0 }}
            >
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                    Designed & Developed By <Text style={{ fontWeight: "700", color: colors.accent }}>BuildMyWeb</Text>
                </Text>
            </TouchableOpacity>
        </View>
    );
}
