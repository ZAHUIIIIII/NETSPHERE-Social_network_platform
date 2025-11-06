// server/src/routes/search.route.js
import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { filterBlockedUsers } from '../middleware/block.middleware.js';
import { 
  search, 
  getTrending, 
  searchSuggestions,
  getPopularSearches 
} from '../controllers/search.controller.js';

const router = express.Router();

router.get('/', protectRoute, filterBlockedUsers, search);
router.get('/trending', protectRoute, filterBlockedUsers, getTrending);
router.get('/suggestions', protectRoute, filterBlockedUsers, searchSuggestions);
router.get('/popular', protectRoute, getPopularSearches);

export default router;