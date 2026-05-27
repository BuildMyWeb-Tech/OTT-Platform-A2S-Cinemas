import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "@/constants/api";
import { User } from "@/constants/types";

type AuthContextType = {
    user: User | null;
    token: string | null;
    isSignedIn: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
    register: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load persisted token on app start
    useEffect(() => {
        loadStoredAuth();
    }, []);

    const loadStoredAuth = async () => {
        try {
            const storedToken = await AsyncStorage.getItem("ott_token");
            const storedUser = await AsyncStorage.getItem("ott_user");
            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error("Failed to load stored auth:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            const { data } = await api.post("/auth/login", { email, password });
            if (data.success) {
                await AsyncStorage.setItem("ott_token", data.token);
                await AsyncStorage.setItem("ott_user", JSON.stringify(data.data));
                setToken(data.token);
                setUser(data.data);
                return { success: true };
            }
            return { success: false, message: data.message };
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || "Login failed",
            };
        }
    };

    const register = async (name: string, email: string, password: string) => {
        try {
            const { data } = await api.post("/auth/register", { name, email, password });
            if (data.success) {
                await AsyncStorage.setItem("ott_token", data.token);
                await AsyncStorage.setItem("ott_user", JSON.stringify(data.data));
                setToken(data.token);
                setUser(data.data);
                return { success: true };
            }
            return { success: false, message: data.message };
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || "Registration failed",
            };
        }
    };

    const logout = async () => {
        await AsyncStorage.removeItem("ott_token");
        await AsyncStorage.removeItem("ott_user");
        setToken(null);
        setUser(null);
    };

    const refreshUser = async () => {
        try {
            const { data } = await api.get("/auth/me");
            if (data.success) {
                setUser(data.data);
                await AsyncStorage.setItem("ott_user", JSON.stringify(data.data));
            }
        } catch (error) {
            console.error("Failed to refresh user:", error);
        }
    };

    return (
        <AuthContext.Provider value={{
            user, token,
            isSignedIn: !!token,
            isLoading,
            login, register, logout, refreshUser,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
}