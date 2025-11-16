// server/src/swagger.js
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NETSPHERE API Documentation',
      version: '1.0.0',
      description: 'Comprehensive API documentation for NETSPHERE - A modern full-stack social media platform',
      contact: {
        name: 'NETSPHERE Support',
        email: 'support@netsphere.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:5001',
        description: 'Development server',
      },
      {
        url: 'https://api.netsphere.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'jwt',
          description: 'JWT token stored in HTTP-only cookie',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'User ID' },
            username: { type: 'string', description: 'Unique username' },
            email: { type: 'string', format: 'email' },
            fullName: { type: 'string' },
            bio: { type: 'string' },
            avatar: { type: 'string' },
            role: { type: 'string', enum: ['user', 'admin'] },
            status: { type: 'string', enum: ['active', 'suspended', 'banned'] },
            followers: { type: 'array', items: { type: 'string' } },
            following: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Post: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            author: { type: 'string' },
            content: { type: 'string' },
            images: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  url: { type: 'string' },
                  publicId: { type: 'string' },
                },
              },
            },
            videos: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  url: { type: 'string' },
                  publicId: { type: 'string' },
                  duration: { type: 'number' },
                  thumbnail: { type: 'string' },
                },
              },
            },
            reactions: {
              type: 'object',
              properties: {
                like: { type: 'array', items: { type: 'string' } },
                love: { type: 'array', items: { type: 'string' } },
                haha: { type: 'array', items: { type: 'string' } },
                wow: { type: 'array', items: { type: 'string' } },
                sad: { type: 'array', items: { type: 'string' } },
                angry: { type: 'array', items: { type: 'string' } },
              },
            },
            status: { type: 'string', enum: ['published', 'flagged', 'removed'] },
            privacy: { type: 'string', enum: ['public', 'followers', 'private'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Comment: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            post: { type: 'string' },
            author: { type: 'string' },
            content: { type: 'string' },
            rootId: { type: 'string' },
            immediateParent: { type: 'string' },
            replyToUserId: { type: 'string' },
            reactions: { type: 'object' },
            isDeleted: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Message: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            senderId: { type: 'string' },
            receiverId: { type: 'string' },
            text: { type: 'string' },
            image: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            recipient: { type: 'string' },
            sender: { type: 'string' },
            type: { type: 'string', enum: ['like', 'comment', 'follow', 'repost', 'reply'] },
            post: { type: 'string' },
            comment: { type: 'string' },
            isRead: { type: 'boolean' },
            groupKey: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Report: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            reporter: { type: 'string' },
            post: { type: 'string' },
            reason: {
              type: 'string',
              enum: ['spam', 'harassment', 'hate_speech', 'violence', 'nudity', 'false_information', 'scam', 'intellectual_property', 'self_harm', 'other'],
            },
            description: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'reviewed', 'resolved', 'dismissed'] },
            reviewedBy: { type: 'string' },
            reviewedAt: { type: 'string', format: 'date-time' },
            adminNotes: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                code: { type: 'string' },
                details: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Unauthorized - Authentication required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: { message: 'Authentication required', code: 'UNAUTHORIZED' },
              },
            },
          },
        },
        Forbidden: {
          description: 'Forbidden - Insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: { message: 'Access denied. Admin only.', code: 'FORBIDDEN' },
              },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: { message: 'Resource not found', code: 'NOT_FOUND' },
              },
            },
          },
        },
        BadRequest: {
          description: 'Bad Request - Invalid input',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                error: { message: 'Invalid input', code: 'BAD_REQUEST', details: [] },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Authentication', description: 'Authentication and authorization endpoints' },
      { name: 'Users', description: 'User management endpoints' },
      { name: 'Posts', description: 'Post management and interaction endpoints' },
      { name: 'Comments', description: 'Comment management endpoints' },
      { name: 'Messages', description: 'Direct messaging endpoints' },
      { name: 'Notifications', description: 'Notification management endpoints' },
      { name: 'Search', description: 'Search and discovery endpoints' },
      { name: 'Reports', description: 'Content reporting endpoints' },
      { name: 'Admin', description: 'Admin-only management endpoints' },
      { name: 'Statistics', description: 'Platform statistics and usage endpoints' },
    ],
  },
  apis: ['./src/docs/*.yaml'], // Point to YAML documentation files
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerUi, swaggerSpec };
