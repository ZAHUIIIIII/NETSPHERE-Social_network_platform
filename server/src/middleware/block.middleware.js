import User from '../models/user.model.js';

// Middleware to check if users have blocked each other
export const checkBlockStatus = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const targetUserId = req.params.userId || req.params.id || req.body.receiverId;

    if (!targetUserId || targetUserId === currentUserId.toString()) {
      return next();
    }

    const currentUser = await User.findById(currentUserId).select('blockedUsers blockedBy');
    
    // Check if current user blocked the target user
    const hasBlocked = currentUser.blockedUsers.some(
      id => id.toString() === targetUserId.toString()
    );
    
    // Check if current user is blocked by the target user
    const isBlockedBy = currentUser.blockedBy.some(
      id => id.toString() === targetUserId.toString()
    );

    if (hasBlocked || isBlockedBy) {
      return res.status(403).json({ 
        message: 'This action is not allowed due to blocking',
        blocked: true
      });
    }

    next();
  } catch (error) {
    console.error('Error in checkBlockStatus middleware:', error);
    next();
  }
};

// Middleware to filter out blocked users from results
export const filterBlockedUsers = async (req, res, next) => {
  try {
    const currentUserId = req.user?._id;
    
    if (currentUserId) {
      const currentUser = await User.findById(currentUserId).select('blockedUsers blockedBy');
      
      // Add blocked user IDs to request for filtering
      req.blockedUserIds = [
        ...(currentUser.blockedUsers || []),
        ...(currentUser.blockedBy || [])
      ].map(id => id.toString());
    } else {
      req.blockedUserIds = [];
    }

    next();
  } catch (error) {
    console.error('Error in filterBlockedUsers middleware:', error);
    req.blockedUserIds = [];
    next();
  }
};
