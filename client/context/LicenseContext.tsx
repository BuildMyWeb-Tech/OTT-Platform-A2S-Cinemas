import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import api from "@/constants/api";
import { License } from "@/constants/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/context/AuthContext";

type LicenseContextType = {
    licenses: License[];
    activeLicenses: License[];
    expiredLicenses: License[];
    hasLicense: (movieId: string) => boolean;
    getDaysLeft: (movieId: string) => number;
    fetchLicenses: () => Promise<void>;
    isLoading: boolean;
};

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

export function LicenseProvider({ children }: { children: ReactNode }) {
    const [licenses, setLicenses] = useState<License[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { isSignedIn, isLoading: authLoading } = useAuth();

    const fetchLicenses = async () => {
        try {
            const token = await AsyncStorage.getItem("ott_token");
            if (!token) {
                setLicenses([]);
                return;
            }
            setIsLoading(true);
            const { data } = await api.get("/license/my");
            if (data.success) {
                setLicenses(data.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch licenses:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Wait for auth to finish loading before fetching
    useEffect(() => {
        if (authLoading) return; // auth still loading from AsyncStorage
        if (isSignedIn) {
            fetchLicenses();
        } else {
            setLicenses([]); // clear on logout
        }
    }, [isSignedIn, authLoading]);

    const activeLicenses = licenses.filter((l) => l.isActive && !l.isRevoked);
    const expiredLicenses = licenses.filter((l) => !l.isActive || l.isRevoked);

    const hasLicense = (movieId: string): boolean => {
        return licenses.some((l) => {
            const id = typeof l.movie === "string" ? l.movie : l.movie?._id;
            return id === movieId && l.isActive && !l.isRevoked;
        });
    };

    const getDaysLeft = (movieId: string): number => {
        const license = licenses.find((l) => {
            const id = typeof l.movie === "string" ? l.movie : l.movie?._id;
            return id === movieId;
        });
        return license?.daysLeft ?? 0;
    };

    return (
        <LicenseContext.Provider value={{
            licenses, activeLicenses, expiredLicenses,
            hasLicense, getDaysLeft, fetchLicenses, isLoading,
        }}>
            {children}
        </LicenseContext.Provider>
    );
}

export function useLicense() {
    const context = useContext(LicenseContext);
    if (!context) throw new Error("useLicense must be used within LicenseProvider");
    return context;
}