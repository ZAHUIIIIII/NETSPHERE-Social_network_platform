// server/src/routes/search.route.js
import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { search, getTrending, searchSuggestions } from '../controllers/search.controller.js';

const router = express.Router();

router.get('/', protectRoute, search);
router.get('/trending', protectRoute, getTrending);
router.get('/suggestions', protectRoute, searchSuggestions);

export default router;