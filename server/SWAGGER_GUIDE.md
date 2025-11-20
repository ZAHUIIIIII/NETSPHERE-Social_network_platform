# Swagger API Documentation Guide

## Setup Complete ✅

Swagger UI has been integrated into your NETSPHERE backend with the following setup:

### Access Points:
- **Swagger UI**: `http://localhost:5001/api-docs`
- **Swagger JSON**: `http://localhost:5001/api-docs.json`
- **Production**: `https://your-api-domain.com/api-docs`

### What's Been Done:

1. ✅ Installed dependencies: `swagger-jsdoc` and `swagger-ui-express`
2. ✅ Created `/server/src/config/swagger.js` with complete OpenAPI 3.0 configuration
3. ✅ Integrated Swagger UI into Express server (`/server/src/index.js`)
4. ✅ Added comprehensive JSDoc annotations to all Authentication routes

### Configuration Highlights:

The Swagger configuration includes:
- **Security Schemes**: Cookie-based JWT authentication
- **Schemas**: All 7 MongoDB models (User, Post, Comment, Message, Notification, Report, TempRegistration)
- **Response Templates**: Reusable error responses (Unauthorized, Forbidden, NotFound, etc.)
- **Tags**: 10 organized categories for all endpoints
- **Servers**: Development (localhost:5001) and Production endpoints

---

## Adding Swagger Annotations to Routes

All routes in `auth.routes.js` have been fully documented. Here's how to add annotations to the remaining route files:

### Example: Post Routes

Add these JSDoc comments above each route in `/server/src/routes/post.routes.js`:

```javascript
/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Get all posts (feed)
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 *                 hasMore:
 *                   type: boolean
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', protectRoute, filterBlockedUsers, getPosts);

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: This is my post content
 *               images:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                     publicId:
 *                       type: string
 *               videos:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                     publicId:
 *                       type: string
 *                     duration:
 *                       type: number
 *                     thumbnail:
 *                       type: string
 *               privacy:
 *                 type: string
 *                 enum: [public, followers, private]
 *                 default: public
 *               feeling:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 post:
 *                   $ref: '#/components/schemas/Post'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/', protectRoute, filterBlockedUsers, createPost);

/**
 * @swagger
 * /api/posts/{postId}/react:
 *   post:
 *     summary: React to a post
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reactionType
 *             properties:
 *               reactionType:
 *                 type: string
 *                 enum: [like, love, haha, wow, sad, angry]
 *     responses:
 *       200:
 *         description: Reaction added/updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 reactions:
 *                   type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:postId/react', protectRoute, checkBlockStatus, reactToPost);
```

### Example: User Routes

```javascript
/**
 * @swagger
 * /api/users/profile/{username}:
 *   get:
 *     summary: Get user profile by username
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Username
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 isFollowing:
 *                   type: boolean
 *                 isBlocked:
 *                   type: boolean
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/profile/:username', protectRoute, getUserProfile);

/**
 * @swagger
 * /api/users/{userId}/follow:
 *   post:
 *     summary: Follow a user
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to follow
 *     responses:
 *       200:
 *         description: User followed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post('/:userId/follow', protectRoute, followUser);
```

### Example: Admin Routes

```javascript
/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: number
 *                     totalPosts:
 *                       type: number
 *                     totalComments:
 *                       type: number
 *                     activeUsers:
 *                       type: number
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/stats', protectRoute, isAdmin, getDashboardStats);
```

---

## Swagger Annotation Patterns

### Basic GET Endpoint:
```javascript
/**
 * @swagger
 * /api/resource/{id}:
 *   get:
 *     summary: Brief description
 *     tags: [Category]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
```

### POST with Request Body:
```javascript
/**
 * @swagger
 * /api/resource:
 *   post:
 *     summary: Brief description
 *     tags: [Category]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - field1
 *             properties:
 *               field1:
 *                 type: string
 *               field2:
 *                 type: number
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
```

### File Upload Endpoint:
```javascript
/**
 * @swagger
 * /api/posts/upload:
 *   post:
 *     summary: Upload images
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 imageUrls:
 *                   type: array
 *                   items:
 *                     type: string
 */
```

### Admin-Only Endpoint:
```javascript
/**
 * @swagger
 * /api/admin/users/{userId}/suspend:
 *   put:
 *     summary: Suspend user
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               duration:
 *                 type: number
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: User suspended
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
```

---

## Testing Your Swagger Documentation

1. **Start the server:**
   ```bash
   cd server
   npm run dev
   ```

2. **Access Swagger UI:**
   - Open browser: `http://localhost:5001/api-docs`
   - You should see the interactive API documentation

3. **Test endpoints:**
   - Click "Try it out" on any endpoint
   - Fill in parameters/request body
   - Click "Execute" to test the API directly from Swagger UI

4. **Authentication:**
   - To test protected endpoints, first login via `/api/auth/login`
   - Swagger will automatically include the JWT cookie in subsequent requests

---

## Next Steps

To complete the documentation, add Swagger annotations to:

- ✅ `/server/src/routes/auth.routes.js` (COMPLETED)
- ⏳ `/server/src/routes/post.routes.js` (14 endpoints)
- ⏳ `/server/src/routes/user.route.js` (15 endpoints)
- ⏳ `/server/src/routes/comment.routes.js` (6 endpoints)
- ⏳ `/server/src/routes/message.route.js` (7 endpoints)
- ⏳ `/server/src/routes/notification.routes.js` (14 endpoints)
- ⏳ `/server/src/routes/search.routes.js` (4 endpoints)
- ⏳ `/server/src/routes/report.routes.js` (2 endpoints)
- ⏳ `/server/src/routes/admin.routes.js` (14 endpoints)
- ⏳ `/server/src/routes/usage.routes.js` (2 endpoints)
- ⏳ `/server/src/routes/stats.routes.js` (1 endpoint)

Use the patterns above to document each endpoint. The configuration is already set up to automatically discover and display all documented routes!

---

## Benefits of Swagger Documentation

✅ **Interactive API Testing** - Test endpoints directly in the browser
✅ **Automatic Documentation** - Always up-to-date with code
✅ **Client SDK Generation** - Generate clients for any language
✅ **Team Collaboration** - Share API specs with frontend developers
✅ **API Validation** - Ensure requests/responses match specs
✅ **Professional** - Industry-standard OpenAPI 3.0 format

---

*For questions or issues, refer to the [Swagger JSDoc documentation](https://github.com/Surnet/swagger-jsdoc) or [OpenAPI Specification](https://swagger.io/specification/).*
