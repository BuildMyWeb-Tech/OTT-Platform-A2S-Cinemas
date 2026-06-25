import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/context/AuthContext";
import { LicenseProvider } from "@/context/LicenseContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import Toast from "react-native-toast-message";
import { GestureHandlerRootView } from "react-native-gesture-handler";

function AppContent() {
    const { isDark } = useTheme();

    return (
        <>
            <StatusBar style={isDark ? "light" : "dark"} />
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="movie/[id]" />
                <Stack.Screen name="player/[id]" />
                <Stack.Screen name="payment/callback" />
                <Stack.Screen name="support" />
                <Stack.Screen name="purchases" />
            </Stack>
            <Toast />
        </>
    );
}

export default function RootLayout() {
    return (
    <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
            <AuthProvider>
                <LicenseProvider>
                    <AppContent />
                </LicenseProvider>
            </AuthProvider>
        </ThemeProvider>
    </GestureHandlerRootView>
);
}