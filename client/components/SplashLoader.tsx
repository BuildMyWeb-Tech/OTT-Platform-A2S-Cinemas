import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, Easing, StatusBar, Text, View } from "react-native";
import { useTheme } from "@/context/ThemeContext";

const { width, height } = Dimensions.get("window");

export default function SplashLoader({ message = "Loading..." }: { message?: string }) {
    const { colors, isDark } = useTheme();

    // Rotation animation for the spinner ring
    const spinAnim = useRef(new Animated.Value(0)).current;
    // Fade + scale in for the logo
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    // Pulse for the dot indicator
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Logo entrance
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1, duration: 400,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1, tension: 60, friction: 8,
                useNativeDriver: true,
            }),
        ]).start();

        // Continuous spinner rotation
        Animated.loop(
            Animated.timing(spinAnim, {
                toValue: 1, duration: 1200,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        // Pulse animation on the dots
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 0.4, duration: 600,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1, duration: 600,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
    });

    return (
        <View style={{
            flex: 1,
            width, height,
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
        }}>
            <StatusBar
                barStyle={isDark ? "light-content" : "dark-content"}
                backgroundColor={colors.background}
            />

            <Animated.View style={{
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
                alignItems: "center",
            }}>
                {/* Outer spinner ring */}
                <View style={{ width: 110, height: 110, justifyContent: "center", alignItems: "center" }}>
                    <Animated.View style={{
                        position: "absolute",
                        width: 110, height: 110,
                        borderRadius: 55,
                        borderWidth: 3,
                        borderColor: "transparent",
                        borderTopColor: colors.accent,
                        borderRightColor: colors.accent + "55",
                        transform: [{ rotate: spin }],
                    }} />

                    {/* Inner static ring */}
                    <View style={{
                        position: "absolute",
                        width: 90, height: 90,
                        borderRadius: 45,
                        borderWidth: 1,
                        borderColor: colors.border,
                    }} />

                    {/* Logo circle */}
                    <View style={{
                        width: 74, height: 74,
                        borderRadius: 37,
                        backgroundColor: colors.accent,
                        justifyContent: "center",
                        alignItems: "center",
                        shadowColor: colors.accent,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.5,
                        shadowRadius: 12,
                        elevation: 10,
                    }}>
                        <Text style={{ fontSize: 32 }}>🎬</Text>
                    </View>
                </View>

                {/* Brand name */}
                <View style={{ marginTop: 24, alignItems: "center" }}>
                    <Text style={{
                        fontSize: 26, fontWeight: "800",
                        color: colors.textPrimary,
                        letterSpacing: 1,
                    }}>
                        A2S Cinemas
                    </Text>
                    <View style={{
                        width: 40, height: 3, borderRadius: 2,
                        backgroundColor: colors.accent,
                        marginTop: 8,
                    }} />
                </View>

                {/* Loading dots */}
                <View style={{ flexDirection: "row", gap: 6, marginTop: 40 }}>
                    {[0, 1, 2].map((i) => (
                        <AnimatedDot key={i} delay={i * 180} colors={colors} />
                    ))}
                </View>

                {/* Message */}
                <Text style={{
                    color: colors.textMuted, fontSize: 13,
                    marginTop: 14, fontWeight: "500",
                    letterSpacing: 0.3,
                }}>
                    {message}
                </Text>
            </Animated.View>
        </View>
    );
}

// Staggered dot animation
function AnimatedDot({ delay, colors }: { delay: number; colors: any }) {
    const anim = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        setTimeout(() => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(anim, {
                        toValue: 1, duration: 400,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim, {
                        toValue: 0.3, duration: 400,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }, delay);
    }, []);

    return (
        <Animated.View style={{
            width: 8, height: 8, borderRadius: 4,
            backgroundColor: colors.accent,
            opacity: anim,
            transform: [{
                scale: anim.interpolate({
                    inputRange: [0.3, 1],
                    outputRange: [0.7, 1],
                }),
            }],
        }} />
    );
}