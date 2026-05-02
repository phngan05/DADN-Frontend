import { useState, useEffect, useCallback } from 'react';
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
        // Thay url này bằng endpoint SSE của Backend (ví dụ: /noti/stream)
        // Lưu ý: EventSource thuần không gửi kèm Custom Header (như Authorization) dễ dàng được.
        // Nếu API cần Token, bạn có thể dùng URL: `/noti/stream?token=abc`
        const sseUrl = `${process.env.NEXT_PUBLIC_API_URL}/noti/${userId}`; 
        const eventSource = new EventSource(sseUrl);

        // Lắng nghe sự kiện khi có danh sách hoặc thông báo mới
        eventSource.onmessage = (event) => {
            try {
                const newData = JSON.parse(event.data);
                
                // Tùy vào Backend trả về 1 list mới hay chỉ 1 item mới
                // Giả sử backend trả về toàn bộ list mới:
                setNotifications(newData);
                
                setLoading(false);
                setError(null);
            } catch (err) {
                console.error("Error parsing SSE data:", err);
            }
        };

        // Xử lý lỗi kết nối
        eventSource.onerror = (err) => {
            console.error("SSE Connection Error:", err);
            setError("Mất kết nối với máy chủ thông báo");
            setLoading(false);
            eventSource.close(); // Đóng nếu cần, hoặc để trình duyệt tự reconnect
        };

        // Clean up: Đóng kết nối khi component unmount
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