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
    

    useEffect(() => {
        fetchFeeds();
    }, [fetchFeeds]);

    const updateFeeds = useCallback(async (newFeeds: Feed) => {
        try {
            const response = await apiClient.put(`/feed`,{
                feed_id: newFeeds.feed_id,
                feed_key: newFeeds.feed_key,
                category: newFeeds.category
            });
            console.log("Updated feed:", response.data);
            setFeedsData(feedsData?.map(feed => feed.feed_id === newFeeds.feed_id ? newFeeds : feed) || null);
            return response.data;
        } catch (err: any) {
            const msg = err.response?.data?.detail || err.message || "Something went wrong";
            setError(msg);
            return null;
        }
    }, []);

    const deleteFeed = useCallback(async (feedId: string) => {
        try {
            await apiClient.delete(`/feed/${feedId}`);
            setFeedsData(feedsData?.filter(feed => feed.feed_id !== feedId) || null);
            return true;
        } catch (err: any) {
            const msg = err.response?.data?.detail || err.message || "Something went wrong";
            setError(msg);
            return false;
        }
    }, [feedsData]);

    const addNewFeed = async (data: { type: string; key: string }) => {
        try {
            console.log("Adding new feed with data:", data);
            if(feedsData?.some(feed => feed.category === data.type)) {
                return false;
            }
            const response = await apiClient.post("/feed", {
                feed_key: data.key,
                category: data.type
            });
            setFeedsData(prev => prev ? [...prev, {
                feed_id: response.data.feed_id,
                feed_key: data.key,
                category: data.type
            }] : null);
            return true;
        } catch (error) {
            console.error("Error adding new feed:", error);
            return false;
        }
    };

    return { 
        feedsData,
        adafruitData,
        loading,
        error,
        addNewFeed,
        updateFeeds,
        deleteFeed,
        refreshFeeds: fetchFeeds
    };
}