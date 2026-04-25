import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/src/services/api';
import { Notification } from '../types/noti';
export function useNotification() {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>();
    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get<Notification[]>(`/noti`);
            setNotifications(response.data);
            return response.data;
        } catch (err: any) {
            const msg = err.response?.data?.detail || err.message || "Something went wrong";
            setError(msg);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateRead = async () => {
        setLoading(true);
        try {
            await apiClient.patch(`/noti`);
            setNotifications(notifications?.map((n) => ({ ...n, isRead: true })));
            return true;
        } catch (error) {
            console.error("Error updating user data:", error);
            return false;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    return { 
       notifications,
       updateRead,
       fetchNotifications 
    };
}