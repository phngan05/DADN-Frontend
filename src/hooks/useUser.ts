import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/src/services/api';
import { User } from '../types/user';
import Cookies from "js-cookie";
import { useRouter } from 'next/navigation';

const getErrorMessage = (err: unknown, fallback: string) => {
    if (typeof err === "object" && err && "response" in err) {
        const response = (err as { response?: { data?: { detail?: string } } }).response;
        if (response?.data?.detail) return response.data.detail;
    }
    if (err instanceof Error) return err.message;
    return fallback;
};
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
        } catch (err: unknown) {
            const msg = getErrorMessage(err, "Something went wrong");
            setError(msg);
            return null;
        } finally {
            setLoading(false);
        }
    }, [router]);

    const updateUserData = async (nextUser?: User) => {
        setLoading(true);
        try {
            const payload = nextUser ?? userData;
            await apiClient.put(`/user`, {
                full_name: payload.full_name,
                username: payload.username,
                photo_url: payload.photo_url,
            });
            setUserData(payload);
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