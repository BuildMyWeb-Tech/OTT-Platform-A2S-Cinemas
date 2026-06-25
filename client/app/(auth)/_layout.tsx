import { Stack } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { View } from "react-native";

export default function AuthRoutesLayout() {
    const { colors } = useTheme();

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
                <Stack.Screen name="sign-in" />
                <Stack.Screen name="sign-up" />
            </Stack>
        </View>
    );
}