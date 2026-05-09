import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/src/services/api';
import { User } from '../types/user';
import Cookies from "js-cookie";
import { useRouter } from 'next/navigation';
export function useUser() {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [userData, setUserData] = useState<User>({
        user_id: "",
        full_name: "",
        photo_url: null,
        username: ""
    });
    const router = useRouter();
    const fetchUserData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = Cookies.get("token");
            if (!token){
                router.push("/login");
                return;
            }
            const response = await apiClient.get(`/user`);
            setUserData(response.data);
            return response.data;
        } catch (err: any) {
            const msg = err.response?.data?.detail || err.message || "Something went wrong";
            setError(msg);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateUserData = async (editedData: Partial<User>) => {
        setLoading(true);
        try {
            await apiClient.put(`/user`, {
                full_name: editedData.full_name || userData.full_name,
                username: editedData.username || userData.username,
                photo_url: editedData.photo_url || userData.photo_url,
            });
            alert("User information updated successfully!");
            return true;
        } catch (error) {
            console.error("Error updating user data:", error);
            alert("Failed to update user information.");
            return false;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, [fetchUserData]);

    return { 
        userData, 
        setUserData, 
        updateUserData,
        loading, 
        error, 
        refreshUser: fetchUserData 
    };
}