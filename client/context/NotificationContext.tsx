import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const READ_KEY = "ott_read_notification_ids";

interface NotificationContextType {
    notifications: any[];
    setNotifications: (n: any[]) => void;
    readIds: string[];
    markAsRead: (id: string) => void;
    markAllAsRead: (ids: string[]) => void;
    unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType>({
    notifications: [], setNotifications: () => {},
    readIds: [], markAsRead: () => {}, markAllAsRead: () => {},
    unreadCount: 0,
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [readIds, setReadIds] = useState<string[]>([]);

    useEffect(() => {
        AsyncStorage.getItem(READ_KEY).then((val) => {
            if (val) setReadIds(JSON.parse(val));
        });
    }, []);

    const markAsRead = useCallback((id: string) => {
        setReadIds((prev) => {
            if (prev.includes(id)) return prev;
            const updated = [...prev, id];
            AsyncStorage.setItem(READ_KEY, JSON.stringify(updated)).catch(() => {});
            return updated;
        });
    }, []);

    const markAllAsRead = useCallback((ids: string[]) => {
        setReadIds((prev) => {
            const updated = Array.from(new Set([...prev, ...ids]));
            AsyncStorage.setItem(READ_KEY, JSON.stringify(updated)).catch(() => {});
            return updated;
        });
    }, []);

    const unreadCount = notifications.filter((n) => !readIds.includes(n._id)).length;

    return (
        <NotificationContext.Provider value={{
            notifications, setNotifications,
            readIds, markAsRead, markAllAsRead, unreadCount,
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export const useNotifications = () => useContext(NotificationContext);