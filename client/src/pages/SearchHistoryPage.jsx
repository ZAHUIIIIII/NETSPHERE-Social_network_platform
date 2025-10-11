import React, { useState, useEffect } from 'react';
import { History, Trash2 } from 'lucide-react';

const SearchHistoryPage = () => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // Load from localStorage or API
    const stored = localStorage.getItem('searchHistory');
    if (stored) {
      setHistory(JSON.parse(stored));
    }
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Search History</h2>
          </div>
          <button
            onClick={() => {
              setHistory([]);
              localStorage.removeItem('searchHistory');
            }}
            className="text-red-500 hover:text-red-600"
          >
            <Trash2 size={20} />
          </button>
        </div>

        <div className="space-y-2">
          {history.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">{item.query}</p>
                <p className="text-sm text-gray-500">{new Date(item.timestamp).toLocaleDateString()}</p>
              </div>
              <span className="text-sm text-gray-500">{item.resultCount} results</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchHistoryPage;