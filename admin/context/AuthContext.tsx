"use client";
import {
    createContext, useContext, useEffect,
    useState, ReactNode
} from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { AdminUser } from "@/lib/types";

interface AuthContextType {
    user: AdminUser | null;
    token: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<AdminUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Read from localStorage — runs only on client, never on server
        try {
            const storedToken = localStorage.getItem("admin_token");
            const storedUser = localStorage.getItem("admin_user");
            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
                console.log("[AuthContext] Session restored from localStorage");
            } else {
                console.log("[AuthContext] No stored session found");
            }
        } catch (e) {
            console.error("[AuthContext] Failed to parse stored session:", e);
            localStorage.removeItem("admin_token");
            localStorage.removeItem("admin_user");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const login = async (email: string, password: string) => {
        try {
            console.log("[AuthContext] Logging in:", email);
            const { data } = await api.post("/auth/login", { email, password });

            if (!data.success) {
                return { success: false, message: data.message };
            }
            if (data.data.role !== "admin") {
                return { success: false, message: "Access denied. Admin accounts only." };
            }

            localStorage.setItem("admin_token", data.token);
            localStorage.setItem("admin_user", JSON.stringify(data.data));
            setToken(data.token);
            setUser(data.data);
            console.log("[AuthContext] Login successful:", data.data.email);
            return { success: true };
        } catch (err: any) {
            console.error("[AuthContext] Login error:", err?.response?.data || err?.message);
            return {
                success: false,
                message: err.response?.data?.message || "Login failed",
            };
        }
    };

    const logout = () => {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
        setToken(null);
        setUser(null);
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}