import { useState, useEffect } from 'react';
import apiClient from '@/src/services/api';
import { Notification } from '../types/noti';
import Cookies from "js-cookie"
export function useNotification() {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // 1. Hàm cập nhật trạng thái đã đọc (giữ nguyên fetch vì đây là gửi data lên)
    const updateRead = async () => {
        try {
            await apiClient.patch(`/noti`);
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            return true;
        } catch (error) {
            console.error("Error updating notifications:", error);
            return false;
        }
    };

    // 2. Thiết lập kết nối SSE
    useEffect(() => {
        let eventSource: EventSource | null = null;
        let retryTimer: ReturnType<typeof setTimeout> | null = null;

        const connect = () => {
            const userId = Cookies.get("userId");
            const baseUrl = process.env.NEXT_PUBLIC_API_URL;
            if (!userId || !baseUrl) {
                setLoading(false);
                return;
            }

            setLoading(true);
            const sseUrl = `${baseUrl}/noti/${userId}`;
            eventSource = new EventSource(sseUrl);

            // Lắng nghe sự kiện khi có danh sách hoặc thông báo mới
            eventSource.onmessage = (event) => {
                try {
                    const newData = JSON.parse(event.data);
                    setNotifications(newData);
                    setLoading(false);
                    setError(null);
                } catch (err) {
                    console.error("Error parsing SSE data:", err);
                }
            };

            eventSource.onerror = () => {
                setError("Mất kết nối với máy chủ thông báo");
                setLoading(false);
                eventSource?.close();
                eventSource = null;

                if (!retryTimer) {
                    retryTimer = setTimeout(() => {
                        retryTimer = null;
                        connect();
                    }, 5000);
                }
            };
        };

        connect();

        return () => {
            eventSource?.close();
            if (retryTimer) {
                clearTimeout(retryTimer);
            }
        };
    }, []);

    return { 
       notifications,
       updateRead,
       loading,
       error
    };
}