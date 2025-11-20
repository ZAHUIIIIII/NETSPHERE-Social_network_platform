import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { checkBlockStatus, filterBlockedUsers } from '../middleware/block.middleware.js';
import { 
  getUsersForSidebar,
  getAllUsersForNewMessage,
  getMessages, 
  sendMessage,
  toggleMuteConversation,
  checkConversationMuteStatus,
  deleteConversation
} from '../controllers/message.controller.js';


const router = express.Router();

router.get("/users/all", protectRoute, filterBlockedUsers, getAllUsersForNewMessage);
router.get("/users", protectRoute, filterBlockedUsers, getUsersForSidebar);
router.get("/:id", protectRoute, checkBlockStatus, getMessages);
router.post("/send/:id", protectRoute, checkBlockStatus, sendMessage);

// Conversation mute settings
router.post("/conversation/:id/mute/toggle", protectRoute, toggleMuteConversation);
router.get("/conversation/:id/mute/status", protectRoute, checkConversationMuteStatus);

// Delete conversation (one-sided)
router.delete("/conversation/:id", protectRoute, deleteConversation);

export default router;