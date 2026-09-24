import { useEffect } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import api from "@/constants/api";
import { useAuth } from "@/context/AuthContext";

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

// Registers this device for push notifications (asks OS permission, gets an
// Expo push token) and saves it against the signed-in user so the server can
// target them. Runs once per sign-in.
export function usePushNotifications() {
    const { isSignedIn } = useAuth();

    useEffect(() => {
        if (!isSignedIn) return;

        (async () => {
            try {
                if (Platform.OS === "android") {
                    await Notifications.setNotificationChannelAsync("default", {
                        name: "default",
                        importance: Notifications.AndroidImportance.DEFAULT,
                    });
                }

                const { status: existingStatus } = await Notifications.getPermissionsAsync();
                let finalStatus = existingStatus;
                if (existingStatus !== "granted") {
                    const { status } = await Notifications.requestPermissionsAsync();
                    finalStatus = status;
                }
                if (finalStatus !== "granted") return;

                const projectId = Constants.expoConfig?.extra?.eas?.projectId;
                const tokenResponse = await Notifications.getExpoPushTokenAsync(
                    projectId ? { projectId } : undefined
                );

                await api.put("/auth/push-token", { pushToken: tokenResponse.data });
            } catch (e) {
                console.log("[push] registration skipped:", e);
            }
        })();
    }, [isSignedIn]);
}
