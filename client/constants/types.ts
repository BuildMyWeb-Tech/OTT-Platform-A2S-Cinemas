export interface User {
    _id: string;
    name: string;
    email: string;
    role: "user" | "admin";
    image?: string;
    isBlocked: boolean;
    purchasedMovies: string[];
    createdAt: string;
}

export interface Movie {
    _id: string;
    title: string;
    description: string;
    genre: string;
    price: number;
    poster: string;
    trailerUrl?: string;
    duration?: number;
    expiryDays: number;
    isFeatured: boolean;
    isActive: boolean;
    categoryId?: string | { _id: string; name: string };
    ratings: { average: number; count: number };
    createdAt: string;
}

export interface License {
    _id: string;
    movie: Movie;
    expiryDate: string;
    isActive: boolean;
    daysLeft: number;
    isRevoked: boolean;
}

export interface Purchase {
    _id: string;
    movie: Movie;
    razorpayOrderId: string;
    razorpayPaymentId?: string;
    amountPaid: number;
    purchaseDate: string;
    expiryDate: string;
    status: "pending" | "active" | "expired" | "failed";
}

export interface StreamResponse {
    streamUrl: string;
    expiresAt: string;
    licenseExpiresAt: string;
}

export interface LicenseCheckResponse {
    hasAccess: boolean;
    expiresAt?: string;
    daysLeft?: number;
    message?: string;
}

export interface Category {
    _id: string;
    name: string;
    description?: string;
    isActive: boolean;
}

export type MovieCardProps = {
    movie: Movie;
    isPurchased?: boolean;
    daysLeft?: number;
};

export type LicenseCardProps = {
    license: License;
    onWatch: () => void;
    onRepurchase: () => void;
};

export type CategoryItemProps = {
    item: { id: string | number; name: string; icon: string };
    isSelected?: boolean;
    onPress?: () => void;
};

export type HeaderProps = {
    title?: string;
    showBack?: boolean;
    showSearch?: boolean;
    showLogo?: boolean;
};