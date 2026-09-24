import User from "../models/User.js";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

// Expo caps each request at 100 messages — chunk accordingly.
function chunk<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}

export async function sendPushToAllUsers(title: string, body: string, data?: Record<string, any>) {
    try {
        const users = await User.find({ pushToken: { $exists: true, $ne: null } }).select("pushToken");
        const tokens = users.map((u) => u.pushToken).filter((t): t is string => !!t && t.startsWith("ExponentPushToken"));
        if (tokens.length === 0) return;

        for (const batch of chunk(tokens, 100)) {
            const messages = batch.map((to) => ({ to, sound: "default", title, body, data: data || {} }));
            await fetch(EXPO_PUSH_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify(messages),
            }).catch((err) => console.error("[push] send failed:", err.message));
        }
    } catch (error: any) {
        console.error("[push] sendPushToAllUsers error:", error.message);
    }
}
