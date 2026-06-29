import React from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "@/context/ThemeContext";

interface ConfirmModalProps {
    visible: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    danger?: boolean;
}

export default function ConfirmModal({
    visible, title, message,
    confirmLabel = "Confirm", cancelLabel = "Cancel",
    onConfirm, onCancel, danger = false,
}: ConfirmModalProps) {
    const { colors } = useTheme();

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
            <View style={{
                flex: 1, backgroundColor: "rgba(0,0,0,0.65)",
                justifyContent: "center", alignItems: "center", padding: 32,
            }}>
                <View style={{
                    backgroundColor: colors.surface,
                    borderRadius: 20, padding: 24, width: "100%",
                    borderWidth: 0.5, borderColor: colors.border,
                }}>
                    {/* Icon */}
                    <View style={{
                        width: 52, height: 52, borderRadius: 26,
                        backgroundColor: danger ? "#E5091420" : colors.surfaceVariant,
                        justifyContent: "center", alignItems: "center",
                        alignSelf: "center", marginBottom: 16,
                    }}>
                        <Text style={{ fontSize: 24 }}>{danger ? "⚠️" : "ℹ️"}</Text>
                    </View>

                    <Text style={{
                        fontSize: 18, fontWeight: "700",
                        color: colors.textPrimary,
                        textAlign: "center", marginBottom: 10,
                    }}>
                        {title}
                    </Text>
                    <Text style={{
                        fontSize: 14, color: colors.textSecondary,
                        textAlign: "center", lineHeight: 20, marginBottom: 24,
                    }}>
                        {message}
                    </Text>

                    <View style={{ flexDirection: "row", gap: 10 }}>
                        <TouchableOpacity
                            onPress={onCancel}
                            style={{
                                flex: 1, paddingVertical: 14, borderRadius: 12,
                                backgroundColor: colors.surfaceVariant,
                                alignItems: "center",
                                borderWidth: 0.5, borderColor: colors.border,
                            }}
                        >
                            <Text style={{ color: colors.textSecondary, fontWeight: "600", fontSize: 15 }}>
                                {cancelLabel}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={onConfirm}
                            style={{
                                flex: 1, paddingVertical: 14, borderRadius: 12,
                                backgroundColor: danger ? "#E50914" : colors.accent,
                                alignItems: "center",
                            }}
                        >
                            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
                                {confirmLabel}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}