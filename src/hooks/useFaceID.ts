import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/src/services/api';
import { FaceID } from '../types/faceid';

const getErrorMessage = (err: unknown, fallback: string) => {
    if (typeof err === "object" && err && "response" in err) {
        const response = (err as { response?: { data?: { detail?: string } } }).response;
        if (response?.data?.detail) return response.data.detail;
    }
    if (err instanceof Error) return err.message;
    return fallback;
};

export function useFaceID() {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [faceids, setFaceids] = useState<FaceID[] | null>(null);

    const fetchFaceids = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get(`/faceid`);
            setFaceids(response.data.map((faceid: FaceID) => ({
                id: faceid.id,
                full_name: faceid.full_name,
                photo_url: faceid.photo_url,
                is_active: faceid.is_active,
                created_at: faceid.created_at,
            })));
            return response.data;
        } catch (err: unknown) {
            const msg = getErrorMessage(err, "Something went wrong");
            setError(msg);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);
    

    useEffect(() => {
        fetchFaceids();
    }, [fetchFaceids]);

    const updateFaceidStatus = useCallback(async (id: string, is_active: boolean) => {
        try {
            const response = await apiClient.patch(`/faceid`,{
                "id": id,
                "is_active": is_active,
            });
            setFaceids(prevFaceids => 
                prevFaceids?.map(faceid => 
                    faceid.id === id ? { ...faceid, is_active: is_active } : faceid
                ) || null
            );
            return response.data;
        } catch (err: unknown) {
            const msg = getErrorMessage(err, "Something went wrong");
            setError(msg);
            return null;
        }
    }, []);

    return { 
        faceids,
        loading,
        error,
        updateFaceidStatus,
        refreshFaceid: fetchFaceids
    };
}