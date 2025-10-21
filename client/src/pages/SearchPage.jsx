import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, TrendingUp, X, Filter, Hash, User, MessageCircle, Heart, Clock, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { searchAll, getTrending, getSearchSuggestions, getPopularSearches } from '../services/api';
import { formatTime } from '../lib/utils';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';

const SearchPage = () => {
  const { authUser } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get query from URL if present
  const urlQuery = searchParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [searchResults, setSearchResults] = useState({
    users: [],
    posts: [],
    hashtags: []
  });
  const [totalCounts, setTotalCounts] = useState({
    users: 0,
    posts: 0,
    hashtags: 0
  });
  const [suggestions, setSuggestions] = useState({ users: [], hashtags: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [popularSearches, setPopularSearches] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const searchTimeoutRef = useRef(null);
  const searchInputRef = useRef(null);
  
  const [filters, setFilters] = useState({
    sortBy: 'Most Relevant'
  });

  // Load initial data
  useEffect(() => {
    loadTrending();
    loadPopularSearches();
    loadRecentSearches();
    
    // If URL has query, search immediately
    if (urlQuery) {
      setHasSearched(false); // Reset to trigger search
      handleSearch(urlQuery);
    }
  }, []); // Only run once on mount

  // Handle URL query changes
  useEffect(() => {
    const newUrlQuery = searchParams.get('q') || '';
    if (newUrlQuery && newUrlQuery !== searchQuery) {
      setSearchQuery(newUrlQuery);
      handleSearch(newUrlQuery);
    }
  }, [searchParams.get('q')]);

  const loadTrending = async () => {
    try {
      const data = await getTrending();
      setTrendingTopics(data.trending || []);
    } catch (error) {
      console.error('Error loading trending:', error);
      // Don't show error toast for background data
    }
  };

  const loadPopularSearches = async () => {
    try {
      const data = await getPopularSearches();
      setPopularSearches(data.popular?.slice(0, 8) || []);
    } catch (error) {
      console.error('Error loading popular searches:', error);
      // Don't show error toast for background data
    }
  };

  const loadRecentSearches = () => {
    try {
      const stored = localStorage.getItem('recentSearches');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate it's an array
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed);
        }
      }
    } catch (e) {
      console.error('Error loading recent searches:', e);
      // Clear corrupted data
      localStorage.removeItem('recentSearches');
    }
  };

  const fetchSuggestions = useCallback(async (query) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions({ users: [], hashtags: [] });
      return;
    }

    try {
      const data = await getSearchSuggestions(query);
      setSuggestions(data.suggestions || { users: [], hashtags: [] });
    } catch (error) {
      if (error.name !== 'CanceledError') {
        console.error('Error fetching suggestions:', error);
        // Don't show error toast for suggestions
      }
      setSuggestions({ users: [], hashtags: [] });
    }
  }, []);

  const handleSearchInputChange = (value) => {
    setSearchQuery(value);
    
    // Show suggestions when typing
    if (value.trim().length >= 2) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setSuggestions({ users: [], hashtags: [] });
    }

    // Update URL
    if (value.trim()) {
      setSearchParams({ q: value }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }

    // Debounced suggestions
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  const handleSearch = async (query = searchQuery) => {
    const trimmedQuery = query.trim();
    
    if (!trimmedQuery) {
      toast.error('Please enter a search term');
      return;
    }

    setIsSearching(true);
    setShowSuggestions(false);
    setHasSearched(true);

    try {
      // Save to recent searches
      saveRecentSearch(trimmedQuery);

      // Determine search type based on query and active tab
      let searchType = activeTab === 'all' ? undefined : activeTab;
      let processedQuery = trimmedQuery;
      
      // If query starts with #, search posts and remove # for API
      if (trimmedQuery.startsWith('#')) {
        searchType = 'posts';
        processedQuery = trimmedQuery.substring(1); // Remove # for API
        setActiveTab('posts'); // Switch to posts tab
      }
      // If query starts with @, search users and remove @
      else if (trimmedQuery.startsWith('@')) {
        searchType = 'users';
        processedQuery = trimmedQuery.substring(1); // Remove @ symbol
        setActiveTab('users'); // Switch to users tab
      }

      // Map filter sortBy to API parameter
      const sortByMap = {
        'Most Relevant': 'relevant',
        'Most Recent': 'recent',
        'Most Popular': 'popular',
        'Oldest First': 'oldest'
      };

      const searchParams = {
        type: searchType,
        sortBy: sortByMap[filters.sortBy] || 'relevant',
        skip: 0,
        limit: 20
      };

      const data = await searchAll(processedQuery, searchParams);

      // Ensure we have valid data structure
      const results = data.results || { users: [], posts: [], hashtags: [] };
      const counts = data.totalCounts || { users: 0, posts: 0, hashtags: 0 };

      setSearchResults(results);
      setTotalCounts(counts);
      
      const totalResults = counts.users + counts.posts + (counts.hashtags || 0);
      
      if (totalResults === 0) {
        toast('No results found', { icon: '🔍' });
      } else {
        toast.success(`Found ${totalResults} result${totalResults !== 1 ? 's' : ''}`);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error(error.response?.data?.message || 'Failed to search. Please try again.');
      
      // Reset results on error
      setSearchResults({ users: [], posts: [], hashtags: [] });
      setTotalCounts({ users: 0, posts: 0, hashtags: 0 });
    } finally {
      setIsSearching(false);
    }
  };

  const saveRecentSearch = (query) => {
    try {
      const cleanQuery = query.trim();
      if (!cleanQuery) return;

      const newRecentSearches = [
        cleanQuery,
        ...recentSearches.filter(s => s.toLowerCase() !== cleanQuery.toLowerCase())
      ].slice(0, 10); // Keep only 10 most recent
      
      setRecentSearches(newRecentSearches);
      localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches));
    } catch (e) {
      console.error('Error saving recent search:', e);
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('recentSearches');
      toast.success('Recent searches cleared');
    } catch (e) {
      console.error('Error clearing recent searches:', e);
    }
  };

  const removeRecentSearch = (searchToRemove) => {
    const updated = recentSearches.filter(s => s !== searchToRemove);
    setRecentSearches(updated);
    try {
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    } catch (e) {
      console.error('Error removing recent search:', e);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Re-search with new tab filter if we have results
    if (hasSearched && searchQuery.trim()) {
      handleSearch(searchQuery);
    }
  };

  const formatNumber = (num) => {
    if (!num || num === 0) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const UserResult = ({ user }) => (
    <div
      onClick={() => navigate(`/profile/${user.username}`)}
      className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-lg cursor-pointer transition-all duration-200 group"
    >
      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-[2px] flex-shrink-0">
        <div className="h-full w-full rounded-full bg-white flex items-center justify-center overflow-hidden">
          {user.avatar ? (
            <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-700 font-bold">{user.username?.charAt(0).toUpperCase() || 'U'}</span>
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
          {user.username}
        </p>
        {user.bio && <p className="text-sm text-gray-500 truncate">{user.bio}</p>}
        {user.email && !user.bio && <p className="text-xs text-gray-400 truncate">{user.email}</p>}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          toast.success('Follow feature coming soon!');
        }}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium opacity-0 group-hover:opacity-100"
      >
        Follow
      </button>
    </div>
  );

  const PostResult = ({ post }) => {
    // Use comment count from post data (will be accurate from unlimited nesting system)
    const commentCount = post.comments?.length || 0;
    
    return (
      <div 
        onClick={() => navigate(`/post/${post._id}`)}
        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer"
      >
        <div className="p-4 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-[2px] flex-shrink-0">
              <div className="h-full w-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                {post.author?.avatar ? (
                  <img src={post.author.avatar} alt={post.author.username} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-700 font-bold text-sm">
                    {post.author?.username?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{post.author?.username || 'Anonymous'}</h3>
            <p className="text-xs text-gray-500">{formatTime(post.createdAt)}</p>
          </div>
        </div>
      </div>

      {post.content && (
        <div className="px-4 pb-3">
          <p className="text-gray-800 whitespace-pre-wrap line-clamp-3">{post.content}</p>
        </div>
      )}

      {post.images && post.images.length > 0 && (
        <div className="px-4 pb-3">
          <img src={post.images[0]} alt="" className="w-full max-h-64 object-cover rounded-lg" />
        </div>
      )}

      <div className="px-4 py-3 flex items-center gap-6 text-sm text-gray-600 border-t border-gray-100">
        <span className="flex items-center gap-1">
          <Heart size={16} />
          {formatNumber(post.likes?.length || 0)}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle size={16} />
          {formatNumber(commentCount)}
        </span>
      </div>
    </div>
  );
};

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      <div className="max-w-4xl mx-auto p-4">
        {/* Enhanced Search Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 animate-slideUp">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search for posts, people, hashtags..."
                value={searchQuery}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  } else if (e.key === 'Escape') {
                    setShowSuggestions(false);
                  }
                }}
                onFocus={() => {
                  if (searchQuery.trim().length >= 2) {
                    setShowSuggestions(true);
                  }
                }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-full text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                autoComplete="off"
                spellCheck="false"
              />

              {/* Enhanced Suggestions Dropdown */}
              {showSuggestions && (suggestions.users.length > 0 || suggestions.hashtags.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 animate-fadeIn max-h-96 overflow-y-auto">
                  {suggestions.users.length > 0 && (
                    <div className="p-2">
                      <div className="flex items-center gap-2 px-3 py-2">
                        <User size={14} className="text-gray-400" />
                        <p className="text-xs font-semibold text-gray-500 uppercase">Users</p>
                      </div>
                      {suggestions.users.map((suggestion, index) => (
                        <div
                          key={`user-${suggestion._id || index}`}
                          onMouseDown={() => {
                            setSearchQuery(suggestion.value);
                            setActiveTab('users');
                            handleSearch(suggestion.value);
                          }}
                          className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                        >
                          {suggestion.avatar ? (
                            <img src={suggestion.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-xs font-medium">{suggestion.value.charAt(0).toUpperCase()}</span>
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-900">{suggestion.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {suggestions.hashtags.length > 0 && (
                    <div className="p-2 border-t border-gray-100">
                      <div className="flex items-center gap-2 px-3 py-2">
                        <Hash size={14} className="text-gray-400" />
                        <p className="text-xs font-semibold text-gray-500 uppercase">Hashtags</p>
                      </div>
                      {suggestions.hashtags.map((suggestion, index) => (
                        <div
                          key={`hashtag-${index}`}
                          onMouseDown={() => {
                            setSearchQuery(`#${suggestion.value}`);
                            setActiveTab('posts');
                            handleSearch(`#${suggestion.value}`);
                          }}
                          className="flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                              <Hash size={14} className="text-blue-500" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">#{suggestion.value}</span>
                          </div>
                          {suggestion.count && (
                            <span className="text-xs text-gray-500">{formatNumber(suggestion.count)} posts</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchParams({});
                  setSearchResults({ users: [], posts: [], hashtags: [] });
                  setTotalCounts({ users: 0, posts: 0, hashtags: 0 });
                  setHasSearched(false);
                  setActiveTab('all');
                  searchInputRef.current?.focus();
                }}
                className="p-3 hover:bg-gray-100 rounded-full transition-colors"
                title="Clear search"
              >
                <X size={20} className="text-gray-600" />
              </button>
            )}

            <button
              onClick={() => handleSearch()}
              disabled={isSearching || !searchQuery.trim()}
              className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-3 hover:bg-gray-100 rounded-full transition-colors relative"
              title="Filters"
            >
              <Filter size={20} className="text-gray-600" />
              {filters.sortBy !== 'Most Relevant' && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
              )}
            </button>
          </div>

          {/* Filter Dropdown */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg animate-slideUp">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Sort By</h3>
              <div className="flex flex-wrap gap-2">
                {['Most Relevant', 'Most Recent', 'Most Popular', 'Oldest First'].map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setFilters({ ...filters, sortBy: option });
                      if (hasSearched && searchQuery.trim()) {
                        handleSearch();
                      }
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      filters.sortBy === option
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search Results or Empty State */}
        {!hasSearched ? (
          <div className="space-y-6">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-slideUp">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock size={18} className="text-gray-400" />
                    <h2 className="text-lg font-bold text-gray-900">Recent Searches</h2>
                  </div>
                  <button
                    onClick={clearRecentSearches}
                    className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full group hover:bg-gray-100 transition-colors"
                    >
                      <button
                        onClick={() => {
                          setSearchQuery(search);
                          handleSearch(search);
                        }}
                        className="text-sm text-gray-700 font-medium"
                      >
                        {search}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRecentSearch(search);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} className="text-gray-500 hover:text-gray-700" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Topics */}
            {trendingTopics.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-slideUp">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={18} className="text-orange-500" />
                  <h2 className="text-lg font-bold text-gray-900">Trending Now</h2>
                </div>
                <div className="space-y-3">
                  {trendingTopics.map((topic, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setSearchQuery(`#${topic.hashtag}`);
                        handleSearch(`#${topic.hashtag}`);
                      }}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-gray-300 w-6">{index + 1}</span>
                        <div>
                          <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            #{topic.hashtag}
                          </p>
                          <p className="text-sm text-gray-500">{formatNumber(topic.posts)} posts</p>
                        </div>
                      </div>
                      {topic.trending && (
                        <span className="px-2 py-1 bg-orange-50 text-orange-600 text-xs font-semibold rounded-full flex items-center gap-1">
                          <TrendingUp size={12} />
                          Trending
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Searches */}
            {popularSearches.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-slideUp">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={18} className="text-purple-500" />
                  <h2 className="text-lg font-bold text-gray-900">Popular Searches</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {popularSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchQuery(`#${search.term}`);
                        handleSearch(`#${search.term}`);
                      }}
                      className="px-4 py-2 bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 transition-colors text-sm font-medium"
                    >
                      #{search.term}
                      {search.count && (
                        <span className="ml-2 text-xs text-purple-500">
                          {formatNumber(search.count)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Tips */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-sm border border-blue-100 p-6 animate-slideUp">
              <h2 className="text-lg font-bold text-gray-900 mb-3">💡 Search Tips</h2>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Use <strong>#hashtag</strong> to search for posts with specific tags</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Use <strong>@username</strong> to find specific users</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Search by keywords to find relevant posts and content</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Use filters to sort results by relevance, recency, or popularity</span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div>
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden animate-slideUp">
              <div className="flex border-b border-gray-200">
                {[
                  { key: 'all', label: 'All', count: totalCounts.users + totalCounts.posts },
                  { key: 'users', label: 'Users', count: totalCounts.users },
                  { key: 'posts', label: 'Posts', count: totalCounts.posts }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => handleTabChange(tab.key)}
                    className={`flex-1 px-6 py-4 text-sm font-semibold transition-all relative ${
                      activeTab === tab.key
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                        activeTab === tab.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                    {activeTab === tab.key && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Results */}
            {isSearching ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="inline-block h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-600 font-medium">Searching...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Users Results */}
                {(activeTab === 'all' || activeTab === 'users') && searchResults.users.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-slideUp">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <User size={18} className="text-blue-500" />
                        Users ({searchResults.users.length})
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {searchResults.users.map((user) => (
                        <UserResult key={user._id} user={user} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Posts Results */}
                {(activeTab === 'all' || activeTab === 'posts') && searchResults.posts.length > 0 && (
                  <div className="space-y-4 animate-slideUp">
                    <div className="flex items-center gap-2 px-2">
                      <MessageCircle size={18} className="text-blue-500" />
                      <h3 className="font-bold text-gray-900">Posts ({searchResults.posts.length})</h3>
                    </div>
                    {searchResults.posts.map((post) => (
                      <PostResult key={post._id} post={post} />
                    ))}
                  </div>
                )}

                {/* No Results */}
                {searchResults.users.length === 0 && searchResults.posts.length === 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center animate-slideUp">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No results found</h3>
                    <p className="text-gray-600 mb-6">
                      We couldn't find any results for "<strong>{searchQuery}</strong>"
                    </p>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>Try:</p>
                      <ul className="space-y-1">
                        <li>• Checking your spelling</li>
                        <li>• Using different keywords</li>
                        <li>• Searching for hashtags or usernames</li>
                        <li>• Making your search more general</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;