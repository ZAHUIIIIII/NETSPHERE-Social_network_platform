// client/src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useAuthStore } from "../store/useAuthStore";
import { useParams, useNavigate } from 'react-router-dom';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileTabs from '../components/profile/ProfileTabs';
import ProfilePosts from '../components/profile/ProfilePosts';
import ProfileSaved from '../components/profile/ProfileSaved';
import EditProfileModal from '../components/profile/EditProfileModal';
import { getUserProfile, getUserPosts } from '../services/profileApi';
import toast from 'react-hot-toast';
import { Loader, ArrowLeft, Settings } from 'lucide-react';

const ProfilePage = () => {
  const { username } = useParams();
  const { authUser } = useAuthStore();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [showEditModal, setShowEditModal] = useState(false);
  
  const isOwnProfile = !username || username === authUser?.username;

  useEffect(() => {
    fetchProfile();
  }, [username, authUser]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      let userData;
      
      if (isOwnProfile) {
        userData = authUser;
        setProfileUser(authUser);
      } else {
        userData = await getUserProfile(username);
        setProfileUser(userData);
      }
      
      if (userData?._id) {
        const userPosts = await getUserPosts(userData._id);
        setPosts(userPosts || []);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = (updatedData) => {
    setProfileUser({ ...profileUser, ...updatedData });
    setShowEditModal(false);
    fetchProfile(); // Refresh to get latest data
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">😕</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">User not found</h2>
          <p className="text-gray-600 mb-8 text-lg">
            The profile you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-8 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-semibold shadow-lg hover:shadow-xl"
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
      />

      {/* Tabs */}
      <ProfileTabs 
        activeTab={activeTab}
        onTabChange={setActiveTab}
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