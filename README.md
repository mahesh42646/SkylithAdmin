# SkylithAdmin

Modern Admin Dashboard with Advanced Attendance Management System

## 🚀 Features

- **Employee Management** - Complete CRUD operations with role-based permissions
- **Attendance System** - Punch in/out with camera capture and GPS location tracking
- **Mobile App** - Flutter-based attendance app for iOS and Android
- **Dashboard Analytics** - Real-time statistics and reports
- **Project Management** - Track projects, tasks, and team collaboration
- **Role-Based Access Control** - Granular permission system
- **Secure Authentication** - JWT-based authentication with secure password hashing

## 📱 Tech Stack

### Frontend
- **Next.js 16** - React framework with server-side rendering
- **Bootstrap 5** - Responsive UI components
- **Chart.js** - Data visualization
- **React Icons** - Icon library

### Backend
- **Node.js & Express** - RESTful API server
- **MongoDB** - NoSQL database
- **JWT** - Authentication & authorization
- **Multer** - File upload handling

### Mobile App
- **Flutter** - Cross-platform mobile development
- **Dart** - Programming language

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 5+
- npm or yarn

### Automated Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/mahesh42646/SkylithAdmin.git
cd SkylithAdmin

# Run setup script
chmod +x setup.sh
./setup.sh
```

The setup script will:
- Check dependencies
- Create environment files
- Install packages
- Seed database with admin user
- Provide instructions to start the app

### Manual Setup

#### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
node scripts/seedRoles.js
node scripts/seedAdmin.js
node server.js
```

#### 2. Frontend Setup
```bash
# From project root
npm install
cp .env.example .env.local
# Edit .env.local with your configuration
npm run dev
```

#### 3. Access Application
- **Frontend:** http://localhost:3002
- **Backend API:** http://localhost:4002/api
- **Admin Login:**
  - Email: `admin@gmail.com`
  - Password: `admin@123`

## 🌐 Production Deployment

For detailed production deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)

### Production URLs
- **Frontend:** https://skylith.cloud
- **Backend API:** https://skylith.cloud/api

## 📂 Project Structure

```
SkylithAdmin/
├── backend/                 # Backend API
│   ├── controllers/         # Request handlers
│   ├── routes/             # API routes
│   ├── schemas/            # MongoDB models
│   ├── middleware/         # Custom middleware
│   ├── scripts/            # Database seed scripts
│   └── server.js           # Entry point
├── src/                    # Frontend source
│   ├── app/                # Next.js pages
│   ├── components/         # React components
│   ├── pages/              # Page components
│   └── utils/              # Utility functions
├── attendance_app/         # Flutter mobile app (not in git)
├── .env.example           # Frontend env example
├── .env.local             # Frontend local env (gitignored)
├── .env.production        # Frontend production env (gitignored)
└── DEPLOYMENT.md          # Deployment guide
```

## 🔑 Environment Variables

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4002/api
NEXT_PUBLIC_UPLOAD_BASE_URL=http://localhost:4002
PORT=3002
```

### Backend (`backend/.env`)
```env
PORT=4002
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/admin-dashboard
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3002
```

## 📱 Mobile App Setup

The Flutter mobile app is located in the `attendance_app/` directory but is excluded from git.

To set up the mobile app:
1. Install Flutter SDK
2. Navigate to `attendance_app/`
3. Update API base URL in `lib/utils/constants.dart`
4. Run `flutter pub get`
5. Run `flutter run`

## 🔐 Default Credentials

**Admin Account:**
- Email: `admin@gmail.com`
- Password: `admin@123`

⚠️ **Important:** Change the admin password immediately after first login!

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Attendance
- `GET /api/attendance` - Get all attendance records
- `POST /api/attendance/punch-in` - Punch in
- `POST /api/attendance/punch-out` - Punch out
- `GET /api/attendance/today` - Get today's attendance
- `GET /api/attendance/my-attendance` - Get user's attendance

### Projects & Tasks
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create project
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task

## 🧪 Testing

```bash
# Frontend tests
npm test

# Backend tests
cd backend
npm test
```

## 🚢 Deployment

### Docker Deployment (Coming Soon)
```bash
docker-compose up -d
```

### Manual Deployment
See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions on deploying to:
- VPS (Ubuntu/Debian)
- Cloud platforms (AWS, GCP, Azure)
- Using Nginx reverse proxy
- SSL certificate setup

## 📝 Available Scripts

### Frontend
- `npm run dev` - Start development server (port 3002)
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Backend
- `node server.js` - Start backend server
- `node scripts/seedAdmin.js` - Seed admin user
- `node scripts/seedRoles.js` - Seed default roles

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- **Mahesh** - Initial work - [mahesh42646](https://github.com/mahesh42646)

## 🆘 Support

For support and questions:
- Create an issue: [GitHub Issues](https://github.com/mahesh42646/SkylithAdmin/issues)
- Email: support@skylith.cloud

## 🎯 Roadmap

- [ ] Docker containerization
- [ ] Real-time notifications
- [ ] Advanced reporting features
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Export to PDF/Excel
- [ ] Email notifications
- [ ] Two-factor authentication

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Bootstrap team for the UI components
- MongoDB team for the database
- Flutter team for cross-platform mobile development

---

**Made with ❤️ by Skylith Team**
