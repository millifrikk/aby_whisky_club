# Åby Whisky Club Development Guide

## 🐳 Docker Commands Quick Reference

### Starting New Development Session
```bash
docker-compose up -d --build
```
- Use `--build` to ensure latest changes are included
- Rebuilds images with updated dependencies
- Use this when starting work or after major changes

### Regular Development Restarts
```bash
# Restart specific service (recommended)
docker-compose restart frontend
docker-compose restart backend

# Restart specific services
docker-compose restart frontend backend

# Restart all services
docker-compose restart
```

### Checking Status
```bash
docker-compose ps
docker logs aby_whisky_frontend --tail 20
docker logs aby_whisky_backend --tail 20
```

### End of Session (Optional)
```bash
docker-compose stop
```

## 🌍 Internationalization (i18n)

### Current Languages
- 🇺🇸 **English** (default)
- 🇸🇪 **Swedish** 

### Adding New Translations
1. Add translation keys to:
   - `frontend/src/locales/en/translation.json`
   - `frontend/src/locales/sv/translation.json`
2. Use in components: `const { t } = useTranslation(); t('key.name')`
3. Restart frontend: `docker-compose restart frontend`

### Language Selector
- Located in navigation (🇺🇸🇸🇪 flags)
- Preference saved in localStorage
- Real-time switching without page reload

## 🔧 Development Environment

### URLs
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **Database**: PostgreSQL on port 5432

### Default Admin Credentials
- **Email**: admin@abywhiskyclub.com
- **Password**: AdminPass123

### Project Structure
```
aby_whisky_club/
├── backend/          # Node.js/Express API
├── frontend/         # React/Vite SPA with i18n & table layout
├── docker-compose.yml
└── CLAUDE.md        # This file
```

## 🆕 Latest Features (Phase 14)

### Advanced Admin Settings Search System Implementation
- **🎯 55/73 Settings Connected (75%)**: Complete search functionality added to admin settings
- **🟢 41 Fully Functional**: Search system + enhanced security + previous functionality 
- **🟡 14 Partially Functional**: Backend ready, frontend implementation in progress
- **🔴 18 Not Implemented**: Advanced features for future development

### Major Features Implemented

#### **🔍 Complete Admin Settings Search System (Phase A)**
- **Real-time Search**: Instant filtering as you type with 300ms debouncing
- **Multi-field Matching**: Searches across setting names, descriptions, keywords, synonyms, and categories
- **Smart Keyword Mapping**: Intelligent matching (e.g., "2fa" finds two-factor auth settings)
- **Search Mode Switching**: Seamless transition between category view and search results
- **Advanced Highlighting**: Yellow highlighting of matching terms in search results
- **Professional UI**: Clean search interface with filters, suggestions, and result counts
- **Error Resilience**: Comprehensive error handling with fallback mechanisms
- **Theme Consistent**: Properly styled to match application theme

### Security Features Implemented

#### **🔐 Complete Two-Factor Authentication (2FA) System**
- **TOTP Support**: Time-based one-time passwords with QR code generation using `speakeasy` library
- **Backup Codes**: Secure backup code system with bcrypt hashing and one-time use
- **Frontend Integration**: Professional setup modal, login component, and settings management
- **Database Migration**: Successfully applied 2FA fields to users table
- **Complete Workflow**: Setup, verification, login, disable, and regenerate backup codes

#### **🛡️ Enhanced Password Security**
- **Dynamic Complexity Rules**: Admin-configurable password requirements
- **Real-time Validation**: Password strength indicators and requirements display
- **Common Password Detection**: Prevention of weak and common passwords
- **Personal Info Prevention**: Blocks passwords containing username/email
- **API Integration**: Password requirements endpoint for frontend validation

#### **⏱️ Advanced Session Management**
- **Configurable Timeouts**: Session and idle timeout management
- **Session Monitoring**: Real-time session expiry warnings with SessionWarning component
- **JWT Enhancement**: Enhanced token management with session metadata
- **Activity Tracking**: User activity monitoring and session refresh capabilities

#### **📧 Email Verification & Password Reset**
- **Secure Token System**: Cryptographically secure token generation and validation
- **Professional UI**: EmailVerificationPage and PasswordResetPage with QR codes and status tracking
- **Token Expiry**: Configurable token expiration and resend functionality
- **Enhanced Security**: Secure password reset workflow with complexity validation

#### **🔒 Account Protection**
- **Failed Login Tracking**: Configurable failed attempt limits with account lockout
- **Account Lockout**: Time-based account lockout with configurable duration
- **Security Middleware**: Enhanced authentication flow with security checks
- **Rate Limiting**: Protection against brute force attacks

#### **🔧 Security API Integration**
- **Password Requirements API**: `/api/auth/password-requirements` for frontend validation
- **Session Info API**: `/api/auth/session-info` for session monitoring
- **2FA Management**: Complete 2FA setup, verification, and management endpoints
- **Enhanced Auth Flow**: Updated login flow with 2FA support and proper error handling

### Updated Settings Implementation Status

#### **🟢 Fully Functional (41 settings)**
- **Admin Tools**: 1 setting - Advanced search functionality across all settings
- **Security Features**: 8 settings - 2FA, password rules, session management, email verification
- **User Management**: 8 settings - Authentication, profiles, access control
- **Content Management**: 8 settings - Whiskies, ratings, reviews, pagination
- **Rating System**: 5 settings - Scales, requirements, privacy, notifications
- **Email System**: 6 settings - SMTP, templates, notifications
- **Analytics**: 5 settings - Statistics, tracking, performance monitoring

#### **🟡 Partially Functional (14 settings)**
- **Appearance**: 7 settings - Colors, logos, branding (backend ready)
- **Advanced Features**: 7 settings - Data export/import, moderation (infrastructure ready)

#### **🔴 Not Implemented (18 settings)**
- **Localization**: 6 settings - Currency, timezone, formatting
- **Social Features**: 6 settings - Messaging, following, sharing
- **API & Integration**: 6 settings - Rate limiting, webhooks, third-party

### Security Dependencies Added
```json
{
  "speakeasy": "^2.0.0",      // 2FA TOTP generation
  "qrcode": "^1.5.4",         // QR code generation
  "qrcode.react": "^3.1.0"    // React QR code component
}
```

### Technical Architecture
- **Search Infrastructure**: Real-time search with multi-field matching and intelligent keyword mapping
- **Frontend Components**: SettingsSearch, SettingsSearchResults with professional UI and error handling
- **Search Algorithm**: Advanced filtering with synonym matching, weight-based scoring, and relevance ranking
- **State Management**: Proper search mode switching with filtered result preservation
- **Error Resilience**: Comprehensive error boundaries and fallback mechanisms
- **2FA Infrastructure**: Complete TOTP + backup code system with proper database integration
- **Security Middleware**: Enhanced password validation and session management
- **Frontend Security**: Professional security UI with TwoFactorSetup, TwoFactorLogin, SecuritySettings
- **API Security**: Comprehensive security endpoints with proper authentication and validation
- **Database Security**: 2FA fields in users table with secure token management

## 🆕 Previous Features (Phase 13)

### Enterprise-Grade Security System
- **Complete 2FA System**: TOTP with QR codes, backup codes, and professional UI
- **Enhanced Password Security**: Dynamic complexity rules and real-time validation
- **Advanced Session Management**: Configurable timeouts and activity monitoring
- **Email Verification & Password Reset**: Secure token system with professional UI
- **Account Protection**: Failed login tracking and account lockout
- **Security API Integration**: Comprehensive security endpoints

## 🆕 Previous Features (Phase 9)

### Advanced Distillery Integration
- **300+ Distilleries Database**: Complete integration with sophisticated search
- **Smart Autocomplete**: Real-time distillery search with visual confirmation
- **Auto-Population**: Region and country fields automatically filled when distillery selected
- **New Distillery Creation**: Modal-based creation with proper validation
- **Database Relationships**: Proper foreign key relationships between whiskies and distilleries

### Production-Ready Bug Fixes
- **Whisky Edit Error**: Resolved "error occurred while updating" issue with proper data type handling
- **Validation System**: Fixed backend validation for distillery creation (URLs, integers, nullable fields)
- **Form Handling**: Enhanced boolean field conversion and calculated field protection
- **Import Fixes**: Resolved critical frontend import errors

### Previous Features (Phase 7-8)
- **Dual Layout System**: Card/Table view toggle with persistent preferences
- **Auto-Population Logic**: Smart region/country filling with regional intelligence
- **Flag-only Language Selector**: Clean 🇺🇸🇸🇪 interface
- **Network Access**: Cross-device viewing on local network

## 📝 Quick Troubleshooting

### Frontend Issues
```bash
# If packages missing after restart
docker exec aby_whisky_frontend npm install
docker-compose restart frontend
```

### Database Issues
```bash
# Reset database
docker-compose down -v
docker-compose up -d --build
```

### General Issues
```bash
# Full reset (nuclear option)
docker-compose down
docker-compose up -d --build
```

## 🎯 Development Workflow

1. **Start session**: `docker-compose up -d --build`
2. **Make changes** to code
3. **Restart relevant service**: `docker-compose restart frontend`
4. **Test changes** at http://localhost:3000
5. **Repeat** steps 2-4 as needed
6. **End session**: `docker-compose stop` (optional)

---
*Last updated: 2025-06-14*
*Project: Åby Whisky Club Management System*
*Status: Phase 14 Completed - Advanced Admin Settings Search System Implementation*
*Features: 55/73 admin settings connected (75%), complete search functionality, enterprise security with 2FA, enhanced authentication*