// client/src/pages/SearchPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Search, TrendingUp, X, Filter, Hash, Image as ImageIcon, Video, User, MessageCircle, Heart } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { searchAll, getTrending, getSearchSuggestions } from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const SearchPage = () => {
  const { authUser } = useAuthStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
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
  const [showFilters, setShowFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const searchTimeoutRef = useRef(null);
  
  const [filters, setFilters] = useState({
    contentTypes: {
      textPosts: false,
      photos: false,
      videos: false
    },
    sortBy: 'Most Relevant',
    location: ''
  });

  useEffect(() => {
    loadTrending();
    
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading recent searches:', e);
      }
    }
  }, []);

  const loadTrending = async () => {
    try {
      const data = await getTrending();
      setTrendingTopics(data.trending || []);
    } catch (error) {
      console.error('Error loading trending:', error);
    }
  };

  const fetchSuggestions = async (query) => {
    if (!query.trim()) {
      setSuggestions({ users: [], hashtags: [] });
      return;
    }

    try {
      const data = await getSearchSuggestions(query);
      console.log('Suggestions received:', data);
      setSuggestions(data.suggestions || { users: [], hashtags: [] });
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleSearchInputChange = (value) => {
    setSearchQuery(value);
    setShowSuggestions(true);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  const handleSearch = async (query = searchQuery) => {
    if (!query.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    console.log('Searching for:', query);
    setIsSearching(true);
    setShowSuggestions(false);
    setHasSearched(true);

    try {
      // Save to recent searches
      const newRecentSearches = [
        query,
        ...recentSearches.filter(s => s !== query)
      ].slice(0, 10);
      
      setRecentSearches(newRecentSearches);
      localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches));

      // Perform search
      const searchParams = {
        type: activeTab === 'all' ? 'users' : activeTab, // Default to users when searching from suggestions
        sortBy: filters.sortBy
      };

      console.log('Search params:', searchParams);
      
      const data = await searchAll(query, searchParams);
      console.log('Search results:', data);

      setSearchResults(data.results || { users: [], posts: [], hashtags: [] });
      setTotalCounts(data.totalCounts || { users: 0, posts: 0, hashtags: 0 });
      
      if (data.totalCounts.users === 0 && data.totalCounts.posts === 0) {
        toast('No results found', { icon: '🔍' });
      } else {
        toast.success(`Found ${data.totalCounts.users + data.totalCounts.posts} results`);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error(error.response?.data?.message || 'Failed to search');
    } finally {
      setIsSearching(false);
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
    toast.success('Recent searches cleared');
  };

  const removeRecentSearch = (searchToRemove) => {
    const updated = recentSearches.filter(s => s !== searchToRemove);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const toggleContentType = (type) => {
    setFilters(prev => ({
      ...prev,
      contentTypes: {
        ...prev.contentTypes,
        [type]: !prev.contentTypes[type]
      }
    }));
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = Math.floor((now - new Date(date)) / 1000);

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const UserResult = ({ user }) => (
    <div
      onClick={() => navigate(`/profile/${user.username}`)}
      className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
    >
      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-[2px]">
        <div className="h-full w-full rounded-full bg-white flex items-center justify-center overflow-hidden">
          {user.avatar ? (
            <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-700 font-bold">{user.username?.charAt(0).toUpperCase() || 'U'}</span>
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">{user.username}</p>
        {user.bio && <p className="text-sm text-gray-500 truncate">{user.bio}</p>}
        {user.email && <p className="text-xs text-gray-400 truncate">{user.email}</p>}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          toast.success('Follow feature coming soon!');
        }}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
      >
        Follow
      </button>
    </div>
  );

  const PostResult = ({ post }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4 flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 p-[2px]">
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
        <div className="px-4">
          <img src={post.images[0]} alt="" className="w-full max-h-64 object-cover rounded-lg" />
        </div>
      )}

      <div className="px-4 py-3 flex items-center gap-6 text-sm text-gray-600">
        <span className="flex items-center gap-1">
          <Heart size={16} />
          {post.likes?.length || 0}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle size={16} />
          {post.comments?.length || 0}
        </span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      <div className="max-w-4xl mx-auto p-4">
        {/* Search Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for posts, people, hashtags, and places..."
                value={searchQuery}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    console.log('Enter pressed, searching...');
                    handleSearch();
                  }
                }}
                onFocus={() => searchQuery && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />

              {/* Search Suggestions Dropdown */}
              {showSuggestions && (suggestions.users.length > 0 || suggestions.hashtags.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50 animate-fadeIn">
                  {suggestions.users.length > 0 && (
                    <div className="p-2">
                      <p className="text-xs font-semibold text-gray-500 px-3 py-2">USERS</p>
                      {suggestions.users.map((suggestion, index) => (
                        <div
                          key={`user-${index}`}
                          onMouseDown={() => {
                            console.log('User suggestion clicked:', suggestion.value);
                            setSearchQuery(suggestion.value);
                            setActiveTab('users'); // Set tab to users when clicking user suggestion
                            handleSearch(suggestion.value);
                          }}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                        >
                          {suggestion.avatar ? (
                            <img src={suggestion.avatar} alt="" className="w-8 h-8 rounded-full" />
                          ) : (
                            <User size={16} className="text-gray-400" />
                          )}
                          <span className="text-sm font-medium">{suggestion.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {suggestions.hashtags.length > 0 && (
                    <div className="p-2 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 px-3 py-2">HASHTAGS</p>
                      {suggestions.hashtags.map((suggestion, index) => (
                        <div
                          key={`hashtag-${index}`}
                          onMouseDown={() => {
                            console.log('Hashtag suggestion clicked:', suggestion.value);
                            setSearchQuery(`#${suggestion.value}`);
                            handleSearch(`#${suggestion.value}`);
                          }}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                        >
                          <Hash size={16} className="text-gray-400" />
                          <span className="text-sm">#{suggestion.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3 rounded-full transition-colors ${
                showFilters ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Filter className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          {hasSearched && (totalCounts.users > 0 || totalCounts.posts > 0) && (
            <div className="flex items-center gap-2 mt-4 border-t border-gray-200 pt-4">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'users' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Users ({totalCounts.users})
              </button>
              <button
                onClick={() => setActiveTab('posts')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'posts' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Posts ({totalCounts.posts})
              </button>
            </div>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Search Filters</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Sort By</h4>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Most Relevant">Most Relevant</option>
                <option value="Most Recent">Most Recent</option>
                <option value="Most Popular">Most Popular</option>
                <option value="Oldest First">Oldest First</option>
              </select>
            </div>

            <button
              onClick={() => {
                setShowFilters(false);
                if (searchQuery) handleSearch();
              }}
              className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Apply Filters
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {isSearching ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Searching...</p>
              </div>
            ) : hasSearched && totalCounts.users === 0 && totalCounts.posts === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600">Try different keywords or check your spelling</p>
              </div>
            ) : hasSearched ? (
              <>
                {(activeTab === 'all' || activeTab === 'users') && searchResults.users.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">Users</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {searchResults.users.map(user => (
                        <UserResult key={user._id} user={user} />
                      ))}
                    </div>
                  </div>
                )}

                {(activeTab === 'all' || activeTab === 'posts') && searchResults.posts.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 px-2">Posts</h3>
                    {searchResults.posts.map(post => (
                      <PostResult key={post._id} post={post} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Trending */}
                {trendingTopics.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="h-5 w-5 text-gray-700" />
                      <h2 className="text-lg font-semibold text-gray-900">Trending Now</h2>
                    </div>

                    <div className="space-y-3">
                      {trendingTopics.map((trend, index) => (
                        <div
                          key={trend.hashtag}
                          onClick={() => {
                            setSearchQuery(`#${trend.hashtag}`);
                            handleSearch(`#${trend.hashtag}`);
                          }}
                          className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-gray-500 font-medium text-sm w-6">#{index + 1}</span>
                            <div>
                              <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                #{trend.hashtag}
                              </p>
                              <p className="text-xs text-gray-500">{trend.posts} posts</p>
                            </div>
                          </div>
                          {trend.trending && (
                            <span className="flex items-center gap-1 text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded-full font-medium">
                              <TrendingUp className="h-3 w-3" />
                              Trending
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">Recent Searches</h2>
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
                          className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors group"
                        >
                          <button
                            onClick={() => {
                              setSearchQuery(search);
                              handleSearch(search);
                            }}
                            className="text-sm text-gray-700 group-hover:text-gray-900"
                          >
                            {search}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeRecentSearch(search);
                            }}
                            className="p-1 hover:bg-gray-300 rounded-full transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Search Tips</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Use <strong>#hashtags</strong> to find trending topics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Search <strong>@username</strong> to find people</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Use filters to narrow your results</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>Try different keywords for better results</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Popular Categories</h3>
              <div className="flex flex-wrap gap-2">
                {['Technology', 'Design', 'Photography', 'Travel', 'Food', 'Music', 'Art', 'Sports'].map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setSearchQuery(category);
                      handleSearch(category);
                    }}
                    className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-blue-500 hover:text-white text-gray-700 rounded-full transition-colors"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;