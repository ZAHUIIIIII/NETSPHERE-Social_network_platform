// client/src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useAuthStore } from "../store/useAuthStore";
import { useParams, useNavigate } from 'react-router-dom';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileTabs from '../components/profile/ProfileTabs';
import ProfilePosts from '../components/profile/ProfilePosts';
import ProfileSaved from '../components/profile/ProfileSaved';
import ProfileReposts from '../components/profile/ProfileReposts';
import EditProfileModal from '../components/profile/EditProfileModal';
import { getUserProfile, getUserPosts } from '../services/profileApi';
import { getUserReposts } from '../services/api';
import toast from 'react-hot-toast';
import { Loader, ArrowLeft } from 'lucide-react';

const ProfilePage = () => {
  const { username } = useParams();
  const { authUser, updateProfile: updateAuthUserProfile } = useAuthStore();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [reposts, setReposts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [repostsLoading, setRepostsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [showEditModal, setShowEditModal] = useState(false);
  
  const isOwnProfile = !username || username === authUser?.username;

  useEffect(() => {
    // Only fetch if we don't have the profile data or username changes
    if (!profileUser || username !== profileUser.username) {
      fetchProfile();
    }
  }, [username]);

  // Listen for post created event from Navbar
  useEffect(() => {
    if (!isOwnProfile) return; // Only refresh on own profile
    
    const handlePostCreated = async () => {
      console.log('📝 New post created, refreshing profile posts...');
      if (profileUser?._id) {
        const userPosts = await getUserPosts(profileUser._id);
        setPosts(userPosts || []);
      }
    };

    window.addEventListener('postCreated', handlePostCreated);
    return () => window.removeEventListener('postCreated', handlePostCreated);
  }, [isOwnProfile, profileUser?._id]);

  const fetchProfile = async () => {
    try {
      // Only show loading on initial load
      if (!profileUser) {
        setLoading(true);
      }

      const targetUsername = isOwnProfile ? authUser?.username : username;
      if (!targetUsername) return;

      const userData = await getUserProfile(targetUsername);
      
      if (userData) {
        setProfileUser(userData);
        const userPosts = await getUserPosts(userData._id);
        setPosts(userPosts || []);
        
        // Only update auth user data if it's actually different
        if (isOwnProfile && JSON.stringify(authUser) !== JSON.stringify(userData)) {
          updateAuthUserProfile(userData);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchReposts = async () => {
    if (!profileUser?._id) return;
    
    try {
      setRepostsLoading(true);
      const data = await getUserReposts(profileUser._id);
      setReposts(data || []);
    } catch (error) {
      console.error('Error fetching reposts:', error);
      toast.error('Failed to load reposts');
    } finally {
      setRepostsLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'reposts' && reposts.length === 0) {
      fetchReposts();
    }
  };

  const handleRepostRemoved = (repostId) => {
    // Remove the repost from the local state
    setReposts(prev => prev.filter(repost => repost._id !== repostId));
  };

  const handleProfileUpdate = (updatedData) => {
    setProfileUser({ ...profileUser, ...updatedData });
    setShowEditModal(false);
    fetchProfile(); // Refresh to get latest data
  };

    const handleFollowChange = async (data) => {
    try {
      // Only update if the following status actually changed
      if (profileUser.isFollowing !== data.isFollowing) {
        // Immediately update UI with the new following status
        setProfileUser(prev => ({
          ...prev,
          isFollowing: data.isFollowing,
          followers: data.isFollowing 
            ? [...(prev.followers || []), authUser]
            : (prev.followers || []).filter(f => f._id !== authUser?._id)
        }));

        if (!isOwnProfile && authUser) {
          // Update auth user's following count locally
          const newFollowing = data.isFollowing
            ? [...(authUser.following || []), profileUser]
            : (authUser.following || []).filter(f => f._id !== profileUser?._id);

          const newAuthUserData = {
            ...authUser,
            following: newFollowing
          };

          // Only update if there's an actual change
          if (JSON.stringify(authUser) !== JSON.stringify(newAuthUserData)) {
            updateAuthUserProfile(newAuthUserData);
          }
        }
      }
    } catch (error) {
      console.error('Error updating user data:', error);
      toast.error('Failed to update follow status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">😕</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">User not found</h2>
          <p className="text-gray-600 mb-8 text-lg">
            The profile you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all font-semibold"
          >
            <ArrowLeft size={20} />
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Profile Header */}
      <ProfileHeader 
        user={profileUser}
        posts={posts}
        isOwnProfile={isOwnProfile}
        onEditClick={() => setShowEditModal(true)}
        onFollowChange={handleFollowChange}
      />

      {/* Tabs */}
      <ProfileTabs 
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isOwnProfile={isOwnProfile}
      />

      {/* Tab Content */}
      <div className="max-w-5xl mx-auto p-4 pb-8">
        <div className="mt-6">
          {activeTab === 'posts' && (
            <ProfilePosts 
              posts={posts}
              isOwnProfile={isOwnProfile}
              onPostsUpdate={fetchProfile}
            />
          )}
          {activeTab === 'reposts' && (
            <ProfileReposts 
              reposts={reposts}
              loading={repostsLoading}
              onRepostRemoved={handleRepostRemoved}
            />
          )}
          {activeTab === 'saved' && isOwnProfile && (
            <ProfileSaved userId={profileUser._id} />
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditProfileModal
          user={profileUser}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
};


export default ProfilePage;