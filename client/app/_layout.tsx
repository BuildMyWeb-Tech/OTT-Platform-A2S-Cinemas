import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/context/AuthContext";
import { LicenseProvider } from "@/context/LicenseContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import Toast from "react-native-toast-message";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useEffect, useState } from "react";
import SplashLoader from "@/components/SplashLoader";

function AppContent() {
    const { isDark, colors } = useTheme();
    const [appReady, setAppReady] = useState(false);

    useEffect(() => {
        // Warm up Render backend on app open — prevents cold start delay
        fetch("https://ott-platform-a2s-cinemas.onrender.com/health")
            .catch(() => {});
        // Small delay to let theme preference load from AsyncStorage
        // before rendering screens so there's no theme flash
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
                {/* Main tabs */}
                <Stack.Screen name="(tabs)" />

                {/* Auth screens */}
                <Stack.Screen name="(auth)" />

                {/* Movie detail + player */}
                <Stack.Screen name="movie/[id]" options={{ animation: "slide_from_right" }} />
                <Stack.Screen name="player/[id]" options={{ animation: "fade" }} />

                {/* Payment */}
                <Stack.Screen name="payment/callback" />

                {/* Support pages */}
                <Stack.Screen name="support/index" />
                <Stack.Screen name="support/privacy" />
                <Stack.Screen name="support/refund" />
                <Stack.Screen name="support/terms" />

                {/* Purchase history */}
                <Stack.Screen name="purchases/index" />
                <Stack.Screen name="purchases/[id]" />

                {/* Notifications full screen */}
                <Stack.Screen name="notifications" options={{ animation: "slide_from_bottom" }} />

                {/* Admin panel */}
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
                <AuthProvider>
                    <LicenseProvider>
                        <AppContent />
                    </LicenseProvider>
                </AuthProvider>
            </ThemeProvider>
        </GestureHandlerRootView>
    );
}