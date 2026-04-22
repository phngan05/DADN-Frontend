export interface FaceID {
    id: string;
    full_name: string;
    is_active: boolean;
    photo_url: string | null;
    created_at: Date;
}