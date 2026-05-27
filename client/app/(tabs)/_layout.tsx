import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { COLORS } from "@/constants";
import { useLicense } from "@/context/LicenseContext";

export default function TabLayout() {
    const { activeLicenses } = useLicense();   // use activeLicenses directly

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: COLORS.accent,
                tabBarInactiveTintColor: "#CDCDE0",
                tabBarShowLabel: true,
                tabBarLabelStyle: { fontSize: 10, marginBottom: 2 },
                tabBarStyle: {
                    backgroundColor: "#fff",
                    borderTopWidth: 1,
                    borderTopColor: "#F0F0F0",
                    height: 60,
                    paddingTop: 6,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="browse"
                options={{
                    title: "Browse",
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "search" : "search-outline"} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="library"
                options={{
                    title: "My Library",
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "library" : "library-outline"} size={24} color={color} />
                    ),
                    tabBarBadge: activeLicenses.length > 0 ? activeLicenses.length : undefined,
                    tabBarBadgeStyle: { backgroundColor: COLORS.accent },
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}