import { useState } from 'react';
import apiClient from '@/src/services/api';

const getErrorMessage = (err: unknown, fallback: string) => {
    if (typeof err === "object" && err && "response" in err) {
        const response = (err as { response?: { data?: { detail?: string } } }).response;
        if (response?.data?.detail) return response.data.detail;
    }
    if (err instanceof Error) return err.message;
    return fallback;
};

export function useDeviceControl() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateStatus = async (feed_key: string, value: number) => {
        setLoading(true);
        setError(null);
        try {
            await apiClient.put(`/record`, {
                feed_key: feed_key,
                value: value,
            });
            return true;
        } catch (err: unknown) {
            const msg = getErrorMessage(err, "Something went wrong");
            setError(msg);
            return false;
        } finally {
            setLoading(false);
        }
    };
    const verifyPassword = async (inputPassword: string) => {
        try {
            const response = await apiClient.post("/door", { 
                password: inputPassword 
            });
            
            return response.data;
        } catch (err: unknown) {
            const msg = getErrorMessage(err, "Incorrect Password!");
            setError(msg);
            return false;
        }
    }

    const updatePassword = async (oldPassword: string, newPassword: string) => {
        try {
            const response = await apiClient.put("/door", { 
                old_password: oldPassword,
                new_password: newPassword,
            });
            return response.data            
        } catch (err: unknown) {
            const msg = getErrorMessage(err, "Update password failed!");
            setError(msg);
        }
    }
    return { updateStatus, verifyPassword, updatePassword, loading, error };
}