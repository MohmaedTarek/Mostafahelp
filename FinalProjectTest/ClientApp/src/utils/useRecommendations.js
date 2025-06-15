import { useState, useCallback } from 'react';
import { getTopRatedPlaces, getSmartRecommendations, getNearbyPlaces } from './api';

export const useRecommendations = () => {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getTopRated = useCallback(async (topN = 10) => {
        setLoading(true);
        setError(null);
        try {
            const response = await getTopRatedPlaces(topN);
            if (response.success) {
                setRecommendations(response.data);
                return response.data;
            } else {
                throw new Error(response.message || 'Failed to fetch top rated places');
            }
        } catch (err) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const getSmartRecommendationsHook = useCallback(async (requestData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await getSmartRecommendations(requestData);
            if (response.success) {
                setRecommendations(response.data);
                return response.data;
            } else {
                throw new Error(response.message || 'Failed to fetch recommendations');
            }
        } catch (err) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const getNearbyPlacesHook = useCallback(async (lat, lon, topN = 10) => {
        setLoading(true);
        setError(null);
        try {
            const response = await getNearbyPlaces(lat, lon, topN);
            if (response.success) {
                setRecommendations(response.data);
                return response.data;
            } else {
                throw new Error(response.message || 'Failed to fetch nearby places');
            }
        } catch (err) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        recommendations,
        loading,
        error,
        getTopRated,
        getSmartRecommendations: getSmartRecommendationsHook,
        getNearbyPlaces: getNearbyPlacesHook,
    };
};