// server/src/routes/search.route.js
import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { 
  search, 
  getTrending, 
  searchSuggestions, 
  getSearchHistory,
  getPopularSearches 
} from '../controllers/search.controller.js';

const router = express.Router();

router.get('/', protectRoute, search);
router.get('/trending', protectRoute, getTrending);
router.get('/suggestions', protectRoute, searchSuggestions);
router.get('/history', protectRoute, getSearchHistory);
router.get('/popular', protectRoute, getPopularSearches);

export default router;