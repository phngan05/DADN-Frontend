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
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            return true;
        } catch (error) {
            console.error("Error updating notifications:", error);
            return false;
        }
    };

    // 2. Thiết lập kết nối SSE
    useEffect(() => {
        setLoading(true);
        
        const userId = Cookies.get("userId")

        const sseUrl = `${process.env.NEXT_PUBLIC_API_URL}/noti/${userId}`; 
        const eventSource = new EventSource(sseUrl);

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

        eventSource.onerror = (err) => {
            console.error("SSE Connection Error:", err);
            setError("Mất kết nối với máy chủ thông báo");
            setLoading(false);
            eventSource.close(); 
        };

        return () => {
            eventSource.close();
        };
    }, []);

    return { 
       notifications,
       updateRead,
       loading,
       error
    };
}