import React from "react";
import ConfirmModal from "@/components/ConfirmModal";

interface Props {
    visible: boolean;
    onSignIn: () => void;
    onCancel: () => void;
    message?: string;
}

/**
 * Themed replacement for the native "Sign in required" Alert.
 * Built on ConfirmModal so it shares the app's modal look; Android back closes it
 * (Modal onRequestClose -> onCancel).
 */
export default function SignInRequiredModal({
    visible, onSignIn, onCancel, message = "Please sign in to purchase movies",
}: Props) {
    return (
        <ConfirmModal
            visible={visible}
            title="Sign in required"
            message={message}
            icon="🔒"
            confirmLabel="SIGN IN"
            cancelLabel="CANCEL"
            onConfirm={onSignIn}
            onCancel={onCancel}
        />
    );
}
