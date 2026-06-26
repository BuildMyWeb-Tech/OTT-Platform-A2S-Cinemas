import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/context/AuthContext";
import { LicenseProvider } from "@/context/LicenseContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import Toast from "react-native-toast-message";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useEffect , useState} from "react";
import SplashLoader from "@/components/SplashLoader";

function AppContent() {
    const { isDark, colors } = useTheme();
    const [appReady, setAppReady] = useState(false);

    useEffect(() => {
        // Warm up backend on app open
        fetch("https://ott-platform-a2s-cinemas.onrender.com/health")
            .catch(() => {});
        // Small delay to let theme load from AsyncStorage
        setTimeout(() => setAppReady(true), 300);
    }, []);

    if (!appReady) {
        return <SplashLoader message="Starting up..." />;
    }

    return (
        <>
            <StatusBar style={isDark ? "light" : "dark"} />
            <Stack screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
            }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="movie/[id]" />
                <Stack.Screen name="player/[id]" />
                <Stack.Screen name="payment/callback" />
                <Stack.Screen name="support" />
                <Stack.Screen name="purchases" />
                <Stack.Screen name="notifications" />
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