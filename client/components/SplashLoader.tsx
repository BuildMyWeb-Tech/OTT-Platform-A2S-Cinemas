import React, { useEffect, useRef } from "react";
import {
    Animated, Easing, Image, StyleSheet, Text, View,
} from "react-native";
import { useTheme } from "@/context/ThemeContext";

interface Props {
    message?: string;
}

export default function SplashLoader({ message = "Loading..." }: Props) {
    const { colors, isDark } = useTheme();
    const spin = useRef(new Animated.Value(0)).current;
    const fade = useRef(new Animated.Value(0)).current;
    const [imageError, setImageError] = React.useState(false);

    useEffect(() => {
        // Spin the ring
        Animated.loop(
            Animated.timing(spin, {
                toValue: 1,
                duration: 1200,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        // Fade in
        Animated.timing(fade, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();
    }, []);

    const rotate = spin.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
    });

    return (
        <Animated.View style={[styles.container, { backgroundColor: colors.background, opacity: fade }]}>

            {/* Spinning ring */}
            <View style={styles.ringWrapper}>
                <Animated.View style={[styles.ring, { borderTopColor: colors.accent, transform: [{ rotate }] }]} />

                {/* Logo inside ring */}
                <View style={styles.logoCircle}>
                    {!imageError ? (
                        <Image
                            source={require("../assets/images/a2s-logo.png")}
                            style={styles.logoImage}
                            resizeMode="contain"
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        /* Fallback when image fails to load */
                        <View style={[styles.logoFallback, { backgroundColor: colors.accent }]}>
                            <Text style={styles.logoFallbackText}>A2S</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* App name */}
            <Text style={[styles.appName, { color: colors.textPrimary }]}>
                A2S Cinemas
            </Text>

            {/* Loading message with animated dots */}
            <DotsLoader message={message} color={colors.textMuted} />

        </Animated.View>
    );
}

function DotsLoader({ message, color }: { message: string; color: string }) {
    const dot1 = useRef(new Animated.Value(0.3)).current;
    const dot2 = useRef(new Animated.Value(0.3)).current;
    const dot3 = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const animate = (dot: Animated.Value, delay: number) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
                    Animated.timing(dot, { toValue: 0.3, duration: 300, useNativeDriver: true }),
                    Animated.delay(600),
                ])
            ).start();

        animate(dot1, 0);
        animate(dot2, 200);
        animate(dot3, 400);
    }, []);

    return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 }}>
            <Text style={{ fontSize: 13, color, fontWeight: "500" }}>{message}</Text>
            {[dot1, dot2, dot3].map((dot, i) => (
                <Animated.View
                    key={i}
                    style={{
                        width: 4, height: 4, borderRadius: 2,
                        backgroundColor: color, opacity: dot,
                    }}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 20,
    },
    ringWrapper: {
        width: 110,
        height: 110,
        justifyContent: "center",
        alignItems: "center",
    },
    ring: {
        position: "absolute",
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 3,
        borderColor: "transparent",
    },
    logoCircle: {
        width: 82,
        height: 82,
        borderRadius: 41,
        overflow: "hidden",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0A0A0F",
    },
    logoImage: {
        width: 82,
        height: 82,
    },
    logoFallback: {
        width: 82,
        height: 82,
        borderRadius: 41,
        justifyContent: "center",
        alignItems: "center",
    },
    logoFallbackText: {
        color: "#fff",
        fontSize: 22,
        fontWeight: "900",
        letterSpacing: 1,
    },
    appName: {
        fontSize: 22,
        fontWeight: "800",
        letterSpacing: 0.5,
    },
});