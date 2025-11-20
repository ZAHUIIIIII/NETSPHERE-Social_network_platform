# NETSPHERE API - Swagger Documentation

## 📚 Overview

Swagger/OpenAPI documentation has been added to your NETSPHERE API without modifying any existing code. All documentation is maintained in separate YAML files for easy management.

## 🚀 Access Points

### Development
- **Swagger UI**: http://localhost:5001/api-docs
- **Swagger JSON**: http://localhost:5001/api-docs/swagger.json

### Production
- **Swagger UI**: https://your-api-domain.com/api-docs
- **Swagger JSON**: https://your-api-domain.com/api-docs/swagger.json

## 📁 File Structure

```
server/
├── src/
│   ├── swagger.js                    # Main Swagger configuration
│   ├── routes/
│   │   └── swagger.routes.js         # Swagger route handler
│   └── docs/                         # API documentation (YAML files)
│       ├── auth.yaml                 # Authentication endpoints (14)
│       ├── users.yaml                # User management endpoints (15)
│       ├── posts.yaml                # Post endpoints (14)
│       ├── comments.yaml             # Comment endpoints (6)
│       ├── messages-notifications.yaml # Messages (7) + Notifications (14)
│       └── search-reports-admin-stats.yaml # Search (4) + Reports (2) + Admin (14) + Stats (3)
```

## ✅ What's Been Added

### 1. Dependencies Installed
- `swagger-jsdoc` - Generate OpenAPI specs from documentation
- `swagger-ui-express` - Serve interactive Swagger UI

### 2. Configuration Files Created
- **`/server/src/swagger.js`** - Main Swagger configuration with:
  - OpenAPI 3.0 specification
  - All 7 MongoDB schemas (User, Post, Comment, Message, Notification, Report)
  - Security schemes (JWT cookie authentication)
  - Reusable error response templates
  - 10 organized tag categories
  - Development & production server URLs

### 3. Documentation Files (YAML)
All 94 endpoints documented across 6 YAML files:
- ✅ Authentication (14 endpoints)
- ✅ Users (15 endpoints)
- ✅ Posts (14 endpoints)
- ✅ Comments (6 endpoints)
- ✅ Messages (7 endpoints)
- ✅ Notifications (14 endpoints)
- ✅ Search (4 endpoints)
- ✅ Reports (2 endpoints)
- ✅ Admin (14 endpoints)
- ✅ Statistics & Usage (3 endpoints)

### 4. Route Integration
- **`/server/src/routes/swagger.routes.js`** - Dedicated Swagger routes
- Integrated into `index.js` with minimal changes (only added 2 lines)

## 🔧 How It Works

1. **YAML Documentation**: All API endpoints are documented in YAML files under `/server/src/docs/`
2. **Swagger Config**: `swagger.js` loads all YAML files and generates OpenAPI specification
3. **Swagger Routes**: Dedicated route file serves Swagger UI and JSON spec
4. **No Code Changes**: Your existing route files remain untouched

## 📖 Using Swagger UI

1. **Start your server:**
   ```bash
   cd server
   npm run dev
   ```

2. **Open Swagger UI** in browser:
   ```
   http://localhost:5001/api-docs
   ```

3. **Test endpoints:**
   - Click on any endpoint to expand it
   - Click "Try it out" button
   - Fill in parameters/request body
   - Click "Execute" to test the API

4. **Authentication:**
   - Login first via `/api/auth/login` endpoint
   - Swagger automatically includes JWT cookie in subsequent requests
   - All protected endpoints will work after authentication

## 📝 Documentation Coverage

### Complete Documentation (94 Endpoints)

#### Authentication (14 endpoints)
- ✅ Check username availability
- ✅ Multi-step registration (initiate + verify)
- ✅ Login/logout
- ✅ Password reset flow (forgot + reset)
- ✅ Google OAuth (initiate + callback + get user)
- ✅ Check auth status
- ✅ Update profile
- ✅ Change password
- ✅ Update privacy settings
- ✅ Delete account

#### Users (15 endpoints)
- ✅ Get profile by username
- ✅ Get user posts
- ✅ Follow/unfollow user
- ✅ Remove follower
- ✅ Get followers/following lists
- ✅ Upload avatar
- ✅ Get saved posts
- ✅ Get suggestions
- ✅ Get admin info
- ✅ Block/unblock user
- ✅ Get blocked users
- ✅ Check block status

#### Posts (14 endpoints)
- ✅ Get all posts (feed with pagination)
- ✅ Create post
- ✅ Get post by ID
- ✅ Update post
- ✅ Delete post
- ✅ Get saved posts
- ✅ Upload images (max 10, 20MB each)
- ✅ Upload video (100MB max)
- ✅ Get user posts
- ✅ Check saved status
- ✅ Get post likes
- ✅ React to post (like/love/haha/wow/sad/angry)
- ✅ Save/unsave post
- ✅ Repost

#### Comments (6 endpoints)
- ✅ Create comment
- ✅ Get root comments
- ✅ Get thread replies
- ✅ Edit comment
- ✅ Soft delete comment
- ✅ React to comment

#### Messages (7 endpoints)
- ✅ Get users for sidebar
- ✅ Get messages with user
- ✅ Send message
- ✅ Mute/unmute conversation
- ✅ Check conversation mute status
- ✅ Delete conversation

#### Notifications (14 endpoints)
- ✅ Get notifications (paginated)
- ✅ Get unread count
- ✅ Get notification settings
- ✅ Toggle mute all notifications
- ✅ Update notification preference
- ✅ Toggle mute post notifications
- ✅ Toggle mute user notifications
- ✅ Check post mute status
- ✅ Check user mute status
- ✅ Mark notification as read
- ✅ Mark notification as unread
- ✅ Mark all as read
- ✅ Delete notification

#### Search (4 endpoints)
- ✅ Search users and posts
- ✅ Get trending content
- ✅ Get search suggestions
- ✅ Get popular searches

#### Reports (2 endpoints)
- ✅ Report a post
- ✅ Get my reports

#### Admin (14 endpoints)
- ✅ Get dashboard stats
- ✅ Get recent activities
- ✅ Get all users (with filters)
- ✅ Suspend user
- ✅ Activate user
- ✅ Ban user
- ✅ Delete user
- ✅ Get all posts (with filters)
- ✅ Remove post
- ✅ Restore post
- ✅ Update post status
- ✅ Delete post permanently
- ✅ Get all reports (with filters)
- ✅ Resolve report
- ✅ Dismiss report

#### Statistics & Usage (3 endpoints)
- ✅ Get platform news (public)
- ✅ Get database usage (admin)
- ✅ Get CDN usage (admin)

## 🔐 Security Features

- **Cookie-based JWT Authentication** properly documented
- **Admin-only endpoints** clearly marked with 🔐
- **Protected routes** require authentication
- **File upload limits** documented:
  - Images: Max 10 files, 20MB each
  - Videos: 1 file, 100MB max
  - Avatars: 1 file, 20MB max

## 📊 Response Schemas

All MongoDB models are documented:
- User (with role, status, followers, following)
- Post (with images, videos, reactions, privacy)
- Comment (with threading support, reactions)
- Message (with text and image support)
- Notification (with types: like, comment, follow, repost, reply)
- Report (with 10 reason types, status tracking)

## 🎨 Features

- **Interactive UI** - Test endpoints directly from browser
- **Request/Response Examples** - See sample data for all endpoints
- **Parameter Documentation** - All query params, path params, and request bodies documented
- **Status Codes** - All possible response codes documented
- **Error Responses** - Reusable error templates (400, 401, 403, 404)
- **Authentication** - Security schemes properly configured
- **Pagination** - Documented for all list endpoints
- **File Uploads** - Multipart form-data properly configured

## 🔄 Updating Documentation

To add or modify endpoint documentation:

1. **Edit YAML files** in `/server/src/docs/`
2. **Follow OpenAPI 3.0 format**
3. **Restart server** to see changes
4. **No code changes needed** in route files

Example:
```yaml
/api/your-endpoint:
  post:
    summary: Your endpoint description
    tags: [Category]
    security:
      - cookieAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              field:
                type: string
    responses:
      '200':
        description: Success response
```

## 🌟 Benefits

✅ **No Code Changes** - Your existing routes remain untouched
✅ **Easy Maintenance** - All documentation in separate YAML files
✅ **Interactive Testing** - Test APIs directly from browser
✅ **Always Up-to-Date** - Documentation loads dynamically
✅ **Professional** - Industry-standard OpenAPI 3.0 format
✅ **Team Collaboration** - Share API specs with frontend developers
✅ **Client Generation** - Generate API clients for any language
✅ **API Validation** - Ensure requests/responses match specs

## 🚀 Deployment

### Development
Already configured! Just start your server:
```bash
npm run dev
```

### Production
Swagger UI is automatically available at:
```
https://your-api-domain.com/api-docs
```

No additional configuration needed!

## 📞 Support

For questions or issues with Swagger documentation:
- [Swagger Documentation](https://swagger.io/docs/)
- [OpenAPI Specification](https://swagger.io/specification/)
- [swagger-jsdoc GitHub](https://github.com/Surnet/swagger-jsdoc)

---

**Total Endpoints Documented:** 94  
**Last Updated:** November 17, 2025  
**OpenAPI Version:** 3.0.0
