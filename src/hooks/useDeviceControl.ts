import { useState } from 'react';
import apiClient from '@/src/services/api';

export function useDeviceControl() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateStatus = async (feed_key: string, value: number) => {
        setLoading(true);
        setError(null);
        try {
            await apiClient.put(`record`, {
                feed_key: feed_key,
                value: value,
            });
            return true;
        } catch (err: any) {
            setError(err.message || "Something went wrong");
            return false;
        } finally {
            setLoading(false);
        }
    };

    return { updateStatus, loading, error };
}