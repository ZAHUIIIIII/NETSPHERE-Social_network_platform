/**
 * Get a consistent avatar URL for a user
 * If user has an avatar, return it
 * Otherwise, return the local default avatar
 * 
 * @param {Object} user - User object with avatar and username
 * @returns {string} Avatar URL
 */
export const getAvatarUrl = (user) => {
  const defaultAvatar = '/assets/avatars/default-avatar.svg';
  
  if (!user) return defaultAvatar;
  
  // If user has an avatar, use it
  if (user.avatar && user.avatar.trim() !== '') {
    return user.avatar;
  }
  
  // Return local default avatar
  return defaultAvatar;
};

/**
 * Get user initials for fallback display
 * @param {Object} user - User object with username/name
 * @returns {string} User initials (1-2 characters)
 */
export const getUserInitials = (user) => {
  if (!user) return 'U';
  
  const name = user.username || user.name || 'User';
  const parts = name.trim().split(/\s+/);
  
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  
  return name.substring(0, 1).toUpperCase();
};
