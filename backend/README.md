# Admin Dashboard Backend API

A secure Node.js/Express backend API for the Admin Dashboard application.

## Features

- ✅ MongoDB integration with Mongoose
- ✅ JWT authentication
- ✅ Role-based access control (RBAC)
- ✅ Permission-based authorization
- ✅ File upload support (images)
- ✅ Audit logging
- ✅ CORS configuration
- ✅ Security middleware (Helmet, Rate Limiting)
- ✅ Environment-based configuration

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or remote)
- npm or yarn

## Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/admin-dashboard
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
FRONTEND_URL=http://localhost:3000
FRONTEND_URL_ALT=http://localhost:3001
```

5. Make sure MongoDB is running:
```bash
# On Linux/Mac
sudo systemctl start mongod
# or
mongod

# On Windows
net start MongoDB
```

## Running the Server

### Development Mode (with auto-reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

The server will start on `http://localhost:4000`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register new user (Admin only)
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users` - Get all users (with pagination, search, filters)
- `GET /api/users/:id` - Get single user
- `POST /api/users` - Create user (Admin only)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin only)
- `POST /api/users/:id/avatar` - Upload user avatar

### Admin
- `GET /api/admin/stats` - Get dashboard statistics
- `GET /api/admin/audit-logs` - Get audit logs

### Health Check
- `GET /api/health` - Server health check

## Project Structure

```
backend/
├── config/
│   └── database.js          # MongoDB connection
├── controllers/
│   ├── authController.js    # Authentication logic
│   └── userController.js    # User CRUD operations
├── middleware/
│   ├── auth.js              # JWT authentication & authorization
│   └── upload.js            # File upload configuration
├── routes/
│   ├── authRoutes.js        # Auth routes
│   ├── userRoutes.js        # User routes
│   └── adminRoutes.js       # Admin routes
├── schemas/
│   ├── userSchema.js        # User model
│   ├── projectSchema.js     # Project model
│   ├── taskSchema.js        # Task model
│   └── auditLogSchema.js    # Audit log model
├── utils/
│   ├── generateToken.js     # JWT token generation
│   ├── createAuditLog.js    # Audit log creation
│   └── permissions.js       # Permission constants
├── uploads/
│   ├── admin/               # Admin uploads
│   ├── users/               # User uploads
│   ├── public/              # Public uploads
│   └── team/                # Team uploads
├── server.js                # Main server file
├── package.json
└── .env                     # Environment variables
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 4000 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/admin-dashboard |
| `JWT_SECRET` | JWT secret key | (required) |
| `JWT_EXPIRE` | JWT expiration time | 7d |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:3000 |
| `FRONTEND_URL_ALT` | Alternative frontend URL | http://localhost:3001 |
| `MAX_FILE_SIZE` | Max file upload size (bytes) | 5242880 (5MB) |

## Security Features

- **Helmet**: Sets various HTTP headers for security
- **Rate Limiting**: Prevents abuse (100 requests per 15 minutes)
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt for password encryption
- **CORS**: Configured for specific origins
- **Input Validation**: Express-validator for request validation

## Database Models

### User
- name, email, password (hashed)
- role (admin, management, team_member)
- status (active, inactive)
- permissions array
- avatar, department
- timestamps

### Project
- title, description, status, progress
- priority, teamMembers, createdBy
- deadline, startDate, completedDate
- tags, attachments

### Task
- title, description, assignee
- projectId, priority, status
- dueDate, completedDate
- createdBy, attachments, comments

### AuditLog
- action, user, resourceType, resourceId
- details, ipAddress, userAgent
- timestamp

## API Usage Examples

### Login
```javascript
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": { ...user }
}
```

### Get Users (with pagination)
```javascript
GET /api/users?page=1&limit=10&status=active&role=admin
Authorization: Bearer <token>
```

### Create User
```javascript
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "team_member",
  "department": "IT",
  "permissions": ["view_dashboard", "view_tasks"]
}
```

## Notes

- All protected routes require JWT token in Authorization header
- Admin role has access to all endpoints
- Permissions are checked for specific actions
- File uploads are stored in role-specific directories
- Audit logs track all important actions

