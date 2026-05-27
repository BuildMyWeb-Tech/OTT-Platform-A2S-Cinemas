export const COLORS = {
    primary: "#111111",
    secondary: "#666666",
    background: "#FFFFFF",
    surface: "#F7F7F7",
    accent: "#E50914",       // Netflix-style red for OTT
    success: "#1D9E75",
    warning: "#EF9F27",
    border: "#EEEEEE",
    error: "#FF4444",
    card: "#1A1A2E",         // dark card for movie posters
};

export const GENRES = [
    { id: "all", name: "All", icon: "grid-outline" },
    { id: "Action", name: "Action", icon: "flash-outline" },
    { id: "Drama", name: "Drama", icon: "film-outline" },
    { id: "Comedy", name: "Comedy", icon: "happy-outline" },
    { id: "Thriller", name: "Thriller", icon: "warning-outline" },
    { id: "Horror", name: "Horror", icon: "skull-outline" },
    { id: "Romance", name: "Romance", icon: "heart-outline" },
    { id: "SciFi", name: "Sci-Fi", icon: "planet-outline" },
    { id: "Documentary", name: "Docs", icon: "camera-outline" },
    { id: "Animation", name: "Animation", icon: "color-palette-outline" },
];

export const PROFILE_MENU = [
    { id: 1, title: "My Library", icon: "library-outline", route: "/(tabs)/library" },
    { id: 2, title: "Purchase History", icon: "receipt-outline", route: "/purchases" },
    { id: 3, title: "Settings", icon: "settings-outline", route: "/" },
];

export const LICENSE_STATUS_COLOR = (daysLeft: number, isActive: boolean) => {
    if (!isActive) return { bg: "#fcebeb", text: "#a32d2d", label: "Expired" };
    if (daysLeft <= 3) return { bg: "#faeeda", text: "#633806", label: `${daysLeft}d left` };
    if (daysLeft <= 7) return { bg: "#fef9ee", text: "#ef9f27", label: `${daysLeft}d left` };
    return { bg: "#e8f8f0", text: "#0f6e56", label: `${daysLeft}d left` };
};