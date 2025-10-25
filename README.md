# Fresh Flow Store

A comprehensive supermarket management system built with React frontend and Node.js backend.

## Project Overview

Fresh Flow Store is a modern, full-stack supermarket management application featuring:

- 🔐 **Authentication & Authorization**: JWT-based authentication with role-based access control
- 👥 **User Management**: Complete user administration with different roles and departments
- 📊 **Dashboard**: Real-time analytics and reporting
- 🛒 **Inventory Management**: Product and stock management
- 💰 **Billing System**: Point-of-sale and transaction management
- 📈 **Reports**: Comprehensive business analytics

## Tech Stack

### Frontend
- **React 18** with Vite
- **TypeScript/JavaScript**
- **shadcn/ui** components
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Router** for navigation
- **React Query** for data fetching

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **express-validator** for input validation
- **Helmet** for security headers
- **CORS** for cross-origin requests

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Frontend Setup

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd fresh-flow-store

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Run setup script (Linux/macOS)
chmod +x setup.sh
./setup.sh

# Or run setup script (Windows)
setup.bat

# Or manual setup:
npm install
npm run create-admin
npm run dev
```

The backend API will be available at `http://localhost:5000`

### Default Admin Credentials
- **Email**: admin@supermart.com
- **Password**: admin123

⚠️ **Important**: Change the default admin password after first login!

## Project Structure

```
fresh-flow-store/
├── src/                    # Frontend source code
│   ├── components/         # Reusable UI components
│   ├── pages/              # Page components
│   ├── contexts/           # React contexts (Auth, etc.)
│   ├── services/           # API services
│   └── hooks/              # Custom React hooks
├── backend/                # Backend source code
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Express middleware
│   └── scripts/            # Utility scripts
└── public/                 # Static assets
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### User Management
- `GET /api/users` - Get all users (paginated)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Deactivate user
- `GET /api/users/stats/overview` - Get user statistics

### Health Check
- `GET /api/health` - API health status

## User Roles & Permissions

- **Admin**: Full system access
- **Manager**: User management and reporting access
- **Employee**: Basic system access
- **Cashier**: Limited access for billing operations

## Development

### Frontend Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Backend Development
```bash
npm run dev          # Start development server with nodemon
npm start            # Start production server
npm run create-admin # Create default admin user
```

## Environment Variables

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

### Backend (config.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/fresh-flow-store
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
```

## Security Features

- Password hashing with bcryptjs
- JWT token-based authentication
- Rate limiting to prevent brute force attacks
- CORS protection
- Input validation and sanitization
- Security headers with Helmet
- Role-based access control

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Deployment

### Frontend
The frontend can be deployed to any static hosting service:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

### Backend
The backend can be deployed to:
- Heroku
- AWS EC2
- DigitalOcean
- Railway
- Render

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the GitHub repository.
