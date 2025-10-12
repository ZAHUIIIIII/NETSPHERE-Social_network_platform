import React, { useState, useEffect } from 'react';
import { useAuthStore } from "../store/useAuthStore";
import { useParams } from 'react-router-dom';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileStats from '../components/profile/ProfileStats';
import ProfileBio from '../components/profile/ProfileBio';
import ProfileTabs from '../components/profile/ProfileTabs';
import ProfilePosts from '../components/profile/ProfilePosts';
import ProfileSaved from '../components/profile/ProfileSaved';
import ProfilePhotos from '../components/profile/ProfilePhotos';
import EditProfileModal from '../components/profile/EditProfileModal';
import { getUserProfile, getUserPosts } from '../services/profileApi';
import toast from 'react-hot-toast';
import { Loader } from 'lucide-react';

const ProfilePage = () => {
  const { username } = useParams();
  const { authUser } = useAuthStore();
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
      if (isOwnProfile) {
        setProfileUser(authUser);
      } else {
        const userData = await getUserProfile(username);
        setProfileUser(userData);
      }
      
      const userPosts = await getUserPosts(isOwnProfile ? authUser?._id : profileUser?._id);
      setPosts(userPosts);
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
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">User not found</h2>
          <p className="text-gray-600">The profile you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto">
        {/* Profile Header */}
        <ProfileHeader 
          user={profileUser}
          isOwnProfile={isOwnProfile}
          onEditClick={() => setShowEditModal(true)}
        />

        {/* Stats */}
        <ProfileStats 
          posts={posts.length}
          followers={profileUser.followers?.length || 0}
          following={profileUser.following?.length || 0}
        />

        {/* Bio */}
        <ProfileBio user={profileUser} />

        {/* Tabs */}
        <ProfileTabs 
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Tab Content */}
        <div className="px-4 pb-8">
          {activeTab === 'posts' && (
            <ProfilePosts 
              posts={posts}
              isOwnProfile={isOwnProfile}
              onPostsUpdate={fetchProfile}
            />
          )}
          {activeTab === 'saved' && (
            <ProfileSaved userId={profileUser._id} />
          )}
          {activeTab === 'photos' && (
            <ProfilePhotos posts={posts} />
          )}
          {activeTab === 'tagged' && (
            <div className="text-center py-12 text-gray-500">
              Tagged photos coming soon
            </div>
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