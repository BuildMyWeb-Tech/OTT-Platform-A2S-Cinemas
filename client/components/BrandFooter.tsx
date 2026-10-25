import { Text, View } from "react-native";
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
            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: showVersion ? 4 : 0 }}>
                Designed & Developed By <Text style={{ fontWeight: "700", color: colors.textSecondary }}>BuildMyWeb</Text>
            </Text>
        </View>
    );
}
