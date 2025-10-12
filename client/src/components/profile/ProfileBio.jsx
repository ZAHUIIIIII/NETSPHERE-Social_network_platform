import React from 'react';
import { MapPin, Link as LinkIcon, Calendar, Briefcase } from 'lucide-react';

const ProfileBio = ({ user }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm mt-4 mx-4 p-6">
      {/* Bio */}
      {user?.bio && (
        <p className="text-gray-800 text-base leading-relaxed mb-4">
          {user.bio}
        </p>
      )}

      {/* Details */}
      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
        {user?.website && (
          <a 
            href={user.website} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-blue-500 transition-colors"
          >
            <LinkIcon size={16} />
            <span className="hover:underline">
              {user.website.replace(/^https?:\/\//, '')}
            </span>
          </a>
        )}

        {user?.location && (
          <div className="flex items-center gap-1.5">
            <MapPin size={16} />
            <span>{user.location}</span>
          </div>
        )}

        {user?.work && (
          <div className="flex items-center gap-1.5">
            <Briefcase size={16} />
            <span>{user.work}</span>
          </div>
        )}

        {user?.createdAt && (
          <div className="flex items-center gap-1.5">
            <Calendar size={16} />
            <span>
              Joined {new Date(user.createdAt).toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileBio;