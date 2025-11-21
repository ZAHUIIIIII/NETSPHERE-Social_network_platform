import { useState, useEffect } from 'react';
import axios from '../lib/axios';

/**
 * Custom hook to fetch MongoDB and Cloudinary usage data
 * @returns {{ db: Object|null, cdn: Object|null, loading: boolean, error: Error|null }}
 */
export const useUsageData = () => {
  const [db, setDb] = useState(null);
  const [cdn, setCdn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsageData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch both endpoints in parallel
        // Note: axios baseURL already includes '/api', so we only need '/admin/...'
        const [dbResponse, cdnResponse] = await Promise.all([
          axios.get('/admin/db-usage').catch(err => {
            console.error('❌ MongoDB usage fetch error:', err.response?.data || err.message);
            return { data: null };
          }),
          axios.get('/admin/cdn-usage').catch(err => {
            console.error('❌ Cloudinary usage fetch error:', err.response?.data || err.message);
            return { data: null };
          })
        ]);

        setDb(dbResponse.data);
        setCdn(cdnResponse.data);
      } catch (err) {
        console.error('Usage data fetch error:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsageData();

    // Refresh every 5 minutes to match cache TTL
    const interval = setInterval(fetchUsageData, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return { db, cdn, loading, error };
};
