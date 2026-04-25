export interface Notification{
    noti_id: string;
    title: string;
    body: string;
    noti_type: string;
    device_category: string;
    is_read: boolean;
    created_at: Date;
    user_id: string;
}