import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/context/AuthContext";
import { LicenseProvider } from "@/context/LicenseContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { NotificationProvider } from "@/context/NotificationContext";
import Toast from "react-native-toast-message";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useEffect, useState } from "react";
import SplashLoader from "@/components/SplashLoader";

function AppContent() {
    const { isDark, colors } = useTheme();
    const [appReady, setAppReady] = useState(false);

    useEffect(() => {
        fetch("https://ott-platform-a2s-cinemas.onrender.com/health").catch(() => {});
        setTimeout(() => setAppReady(true), 300);
    }, []);

    if (!appReady) {
        return <SplashLoader message="Starting up..." />;
    }

    return (
        <>
            <StatusBar style={isDark ? "light" : "dark"} />
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: colors.background },
                    animation: "fade",
                }}
            >
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="movie/[id]" options={{ animation: "slide_from_right" }} />
                <Stack.Screen name="player/[id]" options={{ animation: "fade" }} />
                <Stack.Screen name="payment/callback" />
                <Stack.Screen name="support/index" />
                <Stack.Screen name="support/privacy" />
                <Stack.Screen name="support/refund" />
                <Stack.Screen name="support/terms" />
                <Stack.Screen name="purchases/index" />
                <Stack.Screen name="purchases/[id]" />
                <Stack.Screen name="notifications" options={{ animation: "slide_from_bottom" }} />
                <Stack.Screen name="admin" />
            </Stack>
            <Toast />
        </>
    );
}

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <ThemeProvider>
                <NotificationProvider>
                    <AuthProvider>
                        <LicenseProvider>
                            <AppContent />
                        </LicenseProvider>
                    </AuthProvider>
                </NotificationProvider>
            </ThemeProvider>
        </GestureHandlerRootView>
    );
}