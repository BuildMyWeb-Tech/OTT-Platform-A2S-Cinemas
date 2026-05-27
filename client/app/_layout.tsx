import { Stack, useRouter } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/context/AuthContext";
import { LicenseProvider } from "@/context/LicenseContext";
import Toast from "react-native-toast-message";
import "@/global.css";
import { useEffect } from "react";
import * as Linking from "expo-linking";

export default function RootLayout() {
    const router = useRouter();

   useEffect(() => {
    const sub = Linking.addEventListener("url", ({ url }) => {
        const parsed = Linking.parse(url);
        // Changed: "client" scheme (matches app.json)
        if (parsed.scheme === "client" && parsed.path === "payment") {
            router.push({
                pathname: "/payment/callback",
                params: {
                    status: parsed.queryParams?.status as string,
                    movie_id: parsed.queryParams?.movie_id as string,
                    reason: parsed.queryParams?.reason as string,
                },
            } as any);
        }
    });

    Linking.getInitialURL().then((url) => {
        if (!url) return;
        const parsed = Linking.parse(url);
        if (parsed.scheme === "client" && parsed.path === "payment") {
            router.push({
                pathname: "/payment/callback",
                params: {
                    status: parsed.queryParams?.status as string,
                    movie_id: parsed.queryParams?.movie_id as string,
                    reason: parsed.queryParams?.reason as string,
                },
            } as any);
        }
    });

    return () => sub.remove();
}, []);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <AuthProvider>
                <LicenseProvider>
                    <Stack screenOptions={{ headerShown: false }} />
                    <Toast />
                </LicenseProvider>
            </AuthProvider>
        </GestureHandlerRootView>
    );
}