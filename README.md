# 🥃 Åby Whisky Club Management System

A comprehensive web application for managing whisky club activities, member ratings, events, and administration.

![Whisky Club](https://img.shields.io/badge/Project-Whisky%20Club-amber)
![Node.js](https://img.shields.io/badge/Backend-Node.js-green)
![React](https://img.shields.io/badge/Frontend-React-blue)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue)
![Docker](https://img.shields.io/badge/Container-Docker-blue)

## Project Overview

This system provides:
- **Whisky Inventory Management**: Track bottles, distilleries, and tasting notes
- **User Management**: Admin and member authentication with role-based access
- **Rating System**: Detailed whisky ratings and reviews
- **News & Events**: Club announcements and event management
- **Member Engagement**: Social features and community interaction

## Technology Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database
- **Redis** for session management
- **JWT** authentication
- **Sequelize** ORM

### Frontend
- **React.js** with Vite
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Query** for data fetching
- **Chart.js** for analytics

### Infrastructure
- **Docker** containers
- **Docker Compose** for development
- **PostgreSQL** database in Docker

## Quick Start

### Prerequisites
- Docker Desktop installed
- Git (optional)

### Development Setup

1. **Clone or navigate to the project directory:**
   ```bash
   cd C:\Users\emil\OneDrive\Documents\development\aby_whisky_club
   ```

2. **Create environment files:**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   
   # Frontend
   cp frontend/.env.example frontend/.env
   ```

3. **Start the development environment:**
   ```bash
   docker-compose up --build
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Database: localhost:5432

### First Time Setup

After starting the containers for the first time:

1. **Install dependencies** (automatic in Docker)
2. **Run database migrations** (will be automated)
3. **Seed initial data** (optional)

## Project Structure

```
aby_whisky_club/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── config/         # Configuration files
│   │   ├── utils/          # Utility functions
│   │   └── migrations/     # Database migrations
│   ├── package.json
│   └── Dockerfile
├── frontend/               # React.js application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API services
│   │   ├── utils/          # Helper functions
│   │   ├── contexts/       # React contexts
│   │   └── styles/         # CSS and styling
│   ├── public/
│   ├── package.json
│   └── Dockerfile
├── docs/                   # Documentation
│   └── api/               # API documentation
├── docker-compose.yml      # Docker services definition
└── README.md
```

## Development Commands

### Docker Commands
```bash
# Start all services
docker-compose up

# Start with rebuild
docker-compose up --build

# Stop all services
docker-compose down

# View logs
docker-compose logs

# View logs for specific service
docker-compose logs backend
docker-compose logs frontend
```

### Backend Commands (inside container)
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run migrations
npm run migrate

# Seed database
npm run seed
```

### Frontend Commands (inside container)
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

## ✨ Features Implemented

### 🔐 **Authentication & User Management**
- ✅ User registration and login system
- ✅ Role-based access control (Admin/Member)
- ✅ Profile management and preferences
- ✅ Secure JWT authentication

### 🥃 **Whisky Catalog**
- ✅ Comprehensive whisky database with distillery information
- ✅ Advanced filtering (region, type, age, ABV)
- ✅ **Dual Layout System**: Card and Table view with toggle
- ✅ **Interactive Table**: Clickable rows with responsive design
- ✅ **View Persistence**: User layout preference saved across sessions
- ✅ Featured whisky showcase
- ✅ Detailed whisky profiles with tasting notes

### ⭐ **Rating System**
- ✅ Multi-dimensional rating system (nose, taste, finish, overall)
- ✅ User reviews and tasting notes
- ✅ Rating statistics and analytics
- ✅ Top-rated whiskies leaderboard

### 📰 **News & Events Management**
- ✅ Event creation and management
- ✅ RSVP system with guest management
- ✅ News articles and announcements
- ✅ Event calendar and upcoming events

### 👨‍💼 **Admin Dashboard**
- ✅ Comprehensive analytics and statistics
- ✅ User management (roles, status)
- ✅ Content moderation tools
- ✅ System metrics and health monitoring

### 🛡️ **Content Moderation**
- ✅ Review user-generated content
- ✅ Publish/unpublish news and events
- ✅ Flag inappropriate content
- ✅ Bulk content management actions

### 🌍 **Internationalization & UI**
- ✅ **Multi-language Support**: English/Swedish with real-time switching
- ✅ **Flag-based Language Selector**: Clean, intuitive country flag interface
- ✅ **Responsive Design**: Optimized for desktop, tablet, and mobile
- ✅ **Cross-device Access**: Network-accessible for local device viewing
- ✅ **Professional Branding**: Clean typography and consistent theming

## 📈 Development Phases Completed

✅ **Phase 1:** Backend Foundation (Express.js, PostgreSQL, Authentication)  
✅ **Phase 2:** Frontend Setup (React, Authentication, Basic UI)  
✅ **Phase 2.5:** Rating System Implementation  
✅ **Phase 3:** User Profile Management  
✅ **Phase 4:** News & Events Frontend  
✅ **Phase 5:** Admin Panel Enhancements  
✅ **Phase 6:** Internationalization System (English/Swedish)  
✅ **Phase 7:** Advanced UI Enhancements & Table Layout System

### Default Admin Credentials

After seeding the database, use these credentials to access the admin panel:

- **Email:** admin@abywhiskyclub.com
- **Password:** AdminPass123!

## 📚 API Documentation

### Authentication Endpoints
```
POST   /api/auth/register     - User registration
POST   /api/auth/login        - User login
GET    /api/auth/profile      - Get user profile
PUT    /api/auth/profile      - Update user profile
```

### Whisky Endpoints
```
GET    /api/whiskies          - Get all whiskies (with filtering)
GET    /api/whiskies/:id      - Get whisky details
POST   /api/whiskies          - Create whisky (Admin)
PUT    /api/whiskies/:id      - Update whisky (Admin)
DELETE /api/whiskies/:id      - Delete whisky (Admin)
```

### Rating Endpoints
```
GET    /api/ratings/whisky/:id     - Get whisky ratings
POST   /api/ratings               - Create/Update rating
DELETE /api/ratings/:id           - Delete rating
```

### Event Endpoints
```
GET    /api/news-events           - Get all events/news
GET    /api/news-events/:id       - Get event details
POST   /api/news-events           - Create event (Admin)
POST   /api/news-events/:id/rsvp  - RSVP to event
```

### Admin Endpoints
```
GET    /api/admin/dashboard/stats    - Dashboard statistics
GET    /api/admin/users              - Manage users
GET    /api/admin/content/moderation - Content moderation
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Code Style
- Follow ESLint configuration
- Use meaningful commit messages
- Write documentation for new features
- Maintain test coverage

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Credits

### Development Team
- **Emil Fridriksson** - Project Lead & Developer
  - Email: emil@millicentral.com
  - GitHub: [@millifrikk](https://github.com/millifrikk)

### AI Development Assistance
This project was developed with significant assistance from **Claude** (Anthropic's AI assistant) through Claude Code, which provided guidance on:
- Architecture design and implementation
- Backend API development with Express.js and PostgreSQL
- Frontend React components and state management
- Database schema design and migrations
- Admin panel and user management systems
- Content moderation and security features
- Docker containerization and deployment
- Best practices and code optimization

### Acknowledgments
- **Anthropic** for Claude AI assistance
- **Claude Code** development environment
- The open-source community for the excellent tools and libraries used

---

<div align="center">

**🥃 Built with passion for whisky enthusiasts 🥃**

*Generated with [Claude Code](https://claude.ai/code)*

</div>