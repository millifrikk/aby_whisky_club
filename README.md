# 🥃 Åby Whisky Club Management System

An enterprise-grade web application for managing whisky club activities, member ratings, events, and comprehensive administration with advanced search capabilities.

![Whisky Club](https://img.shields.io/badge/Project-Whisky%20Club-amber)
![Node.js](https://img.shields.io/badge/Backend-Node.js-green)
![React](https://img.shields.io/badge/Frontend-React-blue)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue)
![Docker](https://img.shields.io/badge/Container-Docker-blue)
![Completion](https://img.shields.io/badge/Completion-95%25-brightgreen)

## 🎯 Project Status: **95% Complete (69/73 Settings)**

### Latest Achievement: **Phase B - Intelligent Fuzzy Search System**
- ✅ **Fuzzy Search Engine**: Fuse.js integration with typo tolerance
- ✅ **Smart Keyword Mapping**: 200+ intelligent associations
- ✅ **Advanced Highlighting**: Precise match detection and relevance scoring
- ✅ **Professional UI**: Real-time search with visual feedback

## 🚀 Key Features

### **Enterprise Administration (95% Complete)**
- **69/73 Settings Connected**: Near-complete admin system with live functionality
- **Intelligent Fuzzy Search**: Fuse.js engine with typo tolerance and 200+ keyword associations
- **Advanced Security**: 2FA, enhanced authentication, session management, account protection
- **Content Management**: AI-powered moderation, analytics dashboard, data retention
- **Email Infrastructure**: Complete SMTP integration with automated workflows

### **Core Functionality**
- **Whisky Management**: 300+ distilleries database with intelligent selection
- **User System**: Authentication, profiles, member directory
- **Rating System**: Detailed whisky ratings and reviews with configurable scales
- **Events Management**: Club events with RSVP and notification systems
- **Internationalization**: English/Swedish with flag selector (🇺🇸🇸🇪)

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js framework
- **PostgreSQL** database with advanced migrations
- **JWT** authentication with 2FA support
- **SMTP** email integration with NodeMailer
- **speakeasy** for TOTP generation
- **bcrypt** for secure password hashing

### Frontend
- **React 18** with Vite build system
- **Tailwind CSS** with dark mode support
- **React Router** for navigation
- **React i18next** for internationalization
- **Fuse.js** for fuzzy search capabilities
- **Lucide React** for professional icons

### Infrastructure
- **Docker Compose** for development environment
- **PostgreSQL** container with persistent data
- **Volume mapping** for real-time development

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
- ✅ **Complete User System**: Registration, login, profile management with JWT authentication
- ✅ **Role-based Access Control**: Admin/Member permissions with dynamic content protection
- ✅ **Advanced Privacy Controls**: Public/private profiles, username hiding, avatar management
- ✅ **Guest Access Management**: Configurable guest browsing with admin-controlled restrictions
- ✅ **Member Directory**: Professional member listing with search, privacy controls, and responsive design
- ✅ **Registration Control**: Admin-controlled registration availability and approval workflows

### 🥃 **Whisky Catalog & Management**
- ✅ **Comprehensive Database**: 300+ distilleries with sophisticated search and autocomplete
- ✅ **Advanced Filtering**: Region, type, age, ABV with smart auto-population
- ✅ **Dual Layout System**: Card and Table view with persistent user preferences
- ✅ **Interactive Interface**: Clickable rows, responsive design, and view persistence
- ✅ **Admin Controls**: Configurable pagination, featured whiskies count, bottle size defaults
- ✅ **Content Management**: Approval workflows, submission guidelines, bulk operations

### ⭐ **Advanced Rating System**
- ✅ **Multi-Scale Support**: Configurable 5, 10, or 100-point rating scales
- ✅ **Detailed Scoring**: Overall + dimensional ratings (appearance, nose, palate, finish)
- ✅ **Review Management**: Configurable tasting notes requirements and review functionality
- ✅ **Rating Analytics**: Automatic calculations, statistics, and top-rated leaderboards
- ✅ **Privacy Controls**: Public/private ratings, guest rating access configuration
- ✅ **Notification System**: Email alerts for new ratings with customizable templates

### 🎉 **Event Management System**
- ✅ **Complete Event Lifecycle**: Creation, editing, RSVP management, automated reminders
- ✅ **RSVP System**: Guest management, attendance tracking, and confirmation emails
- ✅ **Event Calendar**: Upcoming events display with filtering and search
- ✅ **Automated Notifications**: Configurable reminder scheduling and email integration
- ✅ **Admin Controls**: Event approval, moderation, and bulk management tools

### 👨‍💼 **Comprehensive Admin System**
- ✅ **Advanced Analytics**: Statistics, performance monitoring, usage tracking
- ✅ **User Management**: Role assignment, status control, approval workflows
- ✅ **Content Moderation**: Review queue, publish/unpublish, bulk actions
- ✅ **System Health**: Metrics monitoring, performance analytics, backup systems
- ✅ **Settings Management**: 73 configurable settings with 54 active integrations (74%)

### 📧 **Email & Communication**
- ✅ **SMTP Integration**: Complete email server configuration and authentication
- ✅ **Notification System**: Welcome emails, rating alerts, event reminders
- ✅ **Template Management**: Customizable email templates and signatures
- ✅ **Automated Communications**: Weekly digests, event reminders, approval notifications

### 🛡️ **Enterprise-Grade Security System**
- ✅ **Two-Factor Authentication (2FA)**: Complete TOTP system with QR codes and backup codes
- ✅ **Enhanced Password Security**: Dynamic complexity rules, strength indicators, common password detection
- ✅ **Advanced Session Management**: Configurable timeouts, session monitoring, JWT enhancement
- ✅ **Email Verification & Password Reset**: Secure token-based verification and reset workflows
- ✅ **Account Protection**: Failed login tracking, account lockout, rate limiting protection
- ✅ **Security API Integration**: Password requirements, session info, 2FA management endpoints

### 🔍 **Intelligent Search System (Phase B)**
- ✅ **Fuzzy Search Engine**: Fuse.js integration with configurable thresholds and typo tolerance
- ✅ **Smart Keyword Mapping**: 200+ intelligent associations across 10 categories (2FA, email, password, etc.)
- ✅ **Advanced Highlighting**: Precise match detection with yellow highlighting and relevance scoring
- ✅ **Professional UI**: Real-time search toggle, enhanced filters, visual feedback indicators
- ✅ **Error Resilience**: Comprehensive fallback mechanisms and graceful degradation

### 🚀 **Advanced Admin Features (Phase 16)**
- ✅ **Content Moderation**: AI-powered review system with auto-approval and manual review queue
- ✅ **Advanced Analytics**: Comprehensive metrics dashboard with user engagement and behavior analysis
- ✅ **Data Retention Management**: GDPR-compliant data lifecycle policies with automated cleanup
- ✅ **Maintenance Mode**: Complete site management controls with custom messaging
- ✅ **Data Export**: GDPR-compliant user data export with multiple formats (JSON, CSV, ZIP)

### 🌍 **Internationalization & UI**
- ✅ **Multi-language Support**: English/Swedish with real-time switching and localStorage persistence
- ✅ **Flag-based Language Selector**: Clean, intuitive country flag interface
- ✅ **Responsive Design**: Optimized for desktop, tablet, and mobile with consistent theming
- ✅ **Cross-device Access**: Network-accessible for local device viewing
- ✅ **Dynamic Branding**: Configurable colors, logos, and site customization (backend ready)

## 📈 Development Phases Completed

✅ **Phase 1:** Backend Foundation (Express.js, PostgreSQL, Authentication)  
✅ **Phase 2:** Frontend Setup (React, Authentication, Basic UI)  
✅ **Phase 2.5:** Rating System Implementation  
✅ **Phase 3:** User Profile Management  
✅ **Phase 4:** News & Events Frontend  
✅ **Phase 5:** Admin Panel Enhancements  
✅ **Phase 6:** Internationalization System (English/Swedish)  
✅ **Phase 7:** Advanced UI Enhancements & Table Layout System  
✅ **Phase 8:** Frontend Localization Components & Documentation  
✅ **Phase 9:** Distillery Integration & Production Bug Fixes  
✅ **Phase 10:** Enterprise Admin Settings System  
✅ **Phase 11:** Comprehensive Admin Settings Integration (46/73 settings - 63%)  
✅ **Phase 13:** Enterprise-Grade Security System Implementation (54/73 settings - 74%)

### Default Admin Credentials

After seeding the database, use these credentials to access the admin panel:

- **Email:** admin@abywhiskyclub.com
- **Password:** AdminPass123!

## 📚 API Documentation

### Authentication Endpoints
```
POST   /api/auth/register              - User registration
POST   /api/auth/login                 - User login
POST   /api/auth/login/2fa             - Complete 2FA login
GET    /api/auth/profile               - Get user profile
PUT    /api/auth/profile               - Update user profile
GET    /api/auth/password-requirements - Get password complexity rules
GET    /api/auth/session-info          - Get session information
POST   /api/auth/request-password-reset - Request password reset
POST   /api/auth/reset-password        - Reset password with token
POST   /api/auth/verify-email          - Verify email address
POST   /api/auth/resend-verification   - Resend email verification
```

### Security & 2FA Endpoints
```
GET    /api/two-factor/status          - Check 2FA status
POST   /api/two-factor/setup           - Initialize 2FA setup
POST   /api/two-factor/verify-setup    - Verify 2FA setup
POST   /api/two-factor/disable         - Disable 2FA
POST   /api/two-factor/regenerate-backup-codes - Regenerate backup codes
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