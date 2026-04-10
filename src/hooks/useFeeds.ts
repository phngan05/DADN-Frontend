import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/src/services/api';
import { Adafruit, Feed } from '../types/feed';

export function useFeeds() {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [adafruitData, setAdafruitData] = useState<Adafruit | null>(null);
    const [feedsData, setFeedsData] = useState<Feed[] | null>(null);

    const fetchFeeds = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get(`/feed`);
            setFeedsData(response.data.map((feed: Feed) => ({
                    feed_id: feed.feed_id,
                    feed_key: feed.feed_key,
                    category: feed.category
            })));
            setAdafruitData(response.data[0]?.ADAFRUIT_SERVER? {
                server_id: response.data[0].ADAFRUIT_SERVER.server_id,
                username: response.data[0].ADAFRUIT_SERVER.username
            } : null);
            return response.data;
        } catch (err: any) {
            const msg = err.response?.data?.detail || err.message || "Something went wrong";
            setError(msg);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const addNewFeed = async (data: { type: string; key: string }) => {
        try {
            console.log("Adding new feed with data:", data);
            await apiClient.post("/feed", {
                feed_key: data.key,
                category: data.type
            });
        } catch (error) {
            console.error("Error adding new feed:", error);
        }
    };

    useEffect(() => {
        fetchFeeds();
    }, [fetchFeeds]);



    return { 
        feedsData,
        adafruitData,
        loading,
        error,
        addNewFeed,
        refreshFeeds: fetchFeeds
    };
}