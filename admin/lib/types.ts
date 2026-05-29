export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
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
  videoKey: string;
  trailerUrl?: string;
  duration?: number;
  expiryDays: number;
  isFeatured: boolean;
  isActive: boolean;
  categoryId?: string | { _id: string; name: string };
  ratings: { average: number; count: number };
  createdAt: string;
}

export interface Category {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Purchase {
  _id: string;
  user: AdminUser | string;
  movie: Movie | string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  amountPaid: number;
  purchaseDate: string;
  expiryDate: string;
  status: "pending" | "active" | "expired" | "failed";
  createdAt: string;
}

export interface License {
  _id: string;
  user: AdminUser | string;
  movie: Movie | string;
  purchase: Purchase | string;
  expiryDate: string;
  isRevoked: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalMovies: number;
  totalRevenue: number;
  totalPurchases: number;
  activeLicenses: number;
  recentPurchases?: Purchase[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
