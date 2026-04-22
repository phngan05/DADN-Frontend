import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/src/services/api';
import { FaceID } from '../types/faceid';

export function useFaceID() {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [faceids, setFaceids] = useState<FaceID[] | null>(null);

    const fetchFaceids = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get(`/faceid`);
            console.log("res: ", response.data);
            setFaceids(response.data.map((faceid: FaceID) => ({
                id: faceid.id,
                full_name: faceid.full_name,
                photo_url: faceid.photo_url,
                is_active: faceid.is_active,
                created_at: faceid.created_at,
            })));
            return response.data;
        } catch (err: any) {
            const msg = err.response?.data?.detail || err.message || "Something went wrong";
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
        } catch (err: any) {
            const msg = err.response?.data?.detail || err.message || "Something went wrong";
            setError(msg);
            return null;
        }
    }, []);

    const addNewFaceid = async () => {
        try {
            const response = await apiClient.post("/faceid");
            const faceid: FaceID = response.data
            setFaceids(prev => prev ? [...prev, {
                id: faceid.id,
                full_name: faceid.full_name,
                is_active: faceid.is_active,
                photo_url: faceid.photo_url,
                created_at: faceid.created_at,
            }] : null);
            return true;
        } catch (error) {
            console.error("Error adding new faceid:", error);
            alert("FaceID of this user is already exist!")
            return false;
        }
    };

    return { 
        faceids,
        loading,
        error,
        addNewFaceid,
        updateFaceidStatus,
        refreshFaceid: fetchFaceids
    };
}