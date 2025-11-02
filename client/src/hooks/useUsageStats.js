import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../lib/axios';

/**
 * Custom hook to fetch database and CDN usage statistics
 * Fetches both endpoints in parallel for optimal performance
 * 
 * @returns {Object} { db, cdn, loading, error, refetch }
 * 
 * Example usage:
 * ```jsx
 * const { db, cdn, loading, error, refetch } = useUsageStats();
 * 
 * if (loading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error}</div>;
 * 
 * console.log('MongoDB:', db.name, db.used, db.limit, db.percent);
 * console.log('Cloudinary:', cdn.name, cdn.used, cdn.limit, cdn.percent);
 * ```
 */
const useUsageStats = () => {
  const [db, setDb] = useState(null);
  const [cdn, setCdn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch usage data from both endpoints in parallel
   */
  const fetchUsageData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both endpoints in parallel
      const [dbResponse, cdnResponse] = await Promise.allSettled([
        axiosInstance.get('/admin/db-usage'),
        axiosInstance.get('/admin/cdn-usage')
      ]);

      // Handle MongoDB response
      if (dbResponse.status === 'fulfilled' && dbResponse.value.data.success) {
        setDb(dbResponse.value.data.data);
      } else {
        const dbError = dbResponse.status === 'rejected' 
          ? dbResponse.reason 
          : new Error('Failed to fetch MongoDB usage');
        console.error('MongoDB usage error:', dbError);
        setDb(null);
      }

      // Handle Cloudinary response
      if (cdnResponse.status === 'fulfilled' && cdnResponse.value.data.success) {
        setCdn(cdnResponse.value.data.data);
      } else {
        const cdnError = cdnResponse.status === 'rejected' 
          ? cdnResponse.reason 
          : new Error('Failed to fetch Cloudinary usage');
        console.error('Cloudinary usage error:', cdnError);
        setCdn(null);
      }

      // Set error if both failed
      if (dbResponse.status === 'rejected' && cdnResponse.status === 'rejected') {
        setError('Failed to fetch usage statistics. Please try again later.');
      } else if (dbResponse.status === 'rejected') {
        setError('Failed to fetch database usage.');
      } else if (cdnResponse.status === 'rejected') {
        setError('Failed to fetch CDN usage.');
      }

    } catch (err) {
      console.error('Unexpected error fetching usage stats:', err);
      setError('An unexpected error occurred. Please try again later.');
      setDb(null);
      setCdn(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchUsageData();
  }, [fetchUsageData]);

  /**
   * Manual refetch function
   * Useful for refresh buttons or after admin actions
   */
  const refetch = useCallback(() => {
    fetchUsageData();
  }, [fetchUsageData]);

  return {
    db,
    cdn,
    loading,
    error,
    refetch
  };
};

export default useUsageStats;
