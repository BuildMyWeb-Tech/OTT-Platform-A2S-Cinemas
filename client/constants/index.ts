// Legacy COLORS kept for backward compatibility during migration —
// new code should use useTheme().colors instead
export const COLORS = {
    primary: "#111111",
    secondary: "#666666",
    background: "#FFFFFF",
    surface: "#F7F7F7",
    accent: "#E50914",
    success: "#1D9E75",
    warning: "#EF9F27",
    border: "#EEEEEE",
    error: "#FF4444",
    card: "#1A1A2E",
};

export const PROFILE_MENU = [
    { id: 1, title: "My Library", icon: "library-outline", route: "/(tabs)/library" },
    { id: 2, title: "Purchase History", icon: "receipt-outline", route: "/purchases" },
    { id: 3, title: "Help Center", icon: "help-circle-outline", route: "/support" },
];

export const HELP_CENTER_MENU = [
    { id: 1, title: "Privacy Policy", icon: "shield-checkmark-outline", route: "/support/privacy" },
    { id: 2, title: "Refund Policy", icon: "cash-outline", route: "/support/refund" },
    { id: 3, title: "Terms & Conditions", icon: "document-text-outline", route: "/support/terms" },
];

export const LICENSE_STATUS_COLOR = (daysLeft: number, isActive: boolean) => {
    if (!isActive) return { bg: "#fcebeb", text: "#a32d2d", label: "Expired" };
    if (daysLeft <= 3) return { bg: "#faeeda", text: "#633806", label: `${daysLeft}d left` };
    if (daysLeft <= 7) return { bg: "#fef9ee", text: "#ef9f27", label: `${daysLeft}d left` };
    return { bg: "#e8f8f0", text: "#0f6e56", label: `${daysLeft}d left` };
};

// Dark-mode-aware license status colors
export const LICENSE_STATUS_COLOR_THEMED = (
    daysLeft: number,
    isActive: boolean,
    isDark: boolean
) => {
    if (!isActive) return {
        bg: isDark ? "#3D1515" : "#fcebeb",
        text: isDark ? "#FF6B6B" : "#a32d2d",
        label: "Expired"
    };
    if (daysLeft <= 3) return {
        bg: isDark ? "#3D2C0A" : "#faeeda",
        text: isDark ? "#FFB347" : "#633806",
        label: `${daysLeft}d left`
    };
    if (daysLeft <= 7) return {
        bg: isDark ? "#2A2800" : "#fef9ee",
        text: isDark ? "#EF9F27" : "#ef9f27",
        label: `${daysLeft}d left`
    };
    return {
        bg: isDark ? "#0D2E22" : "#e8f8f0",
        text: isDark ? "#1D9E75" : "#0f6e56",
        label: `${daysLeft}d left`
    };
};

export const CATEGORY_ICON_MAP: Record<string, string> = {
    action: "flash-outline",
    drama: "film-outline",
    comedy: "happy-outline",
    thriller: "warning-outline",
    horror: "skull-outline",
    romance: "heart-outline",
    scifi: "planet-outline",
    "sci-fi": "planet-outline",
    documentary: "camera-outline",
    animation: "color-palette-outline",
    other: "ellipsis-horizontal-outline",
};

export const getCategoryIcon = (name: string): string => {
    const key = name.toLowerCase().trim();
    return CATEGORY_ICON_MAP[key] || "pricetag-outline";
};