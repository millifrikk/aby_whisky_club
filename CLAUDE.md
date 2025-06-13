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
- **Password**: AdminPass123!

### Project Structure
```
aby_whisky_club/
├── backend/          # Node.js/Express API
├── frontend/         # React/Vite SPA with i18n & table layout
├── docker-compose.yml
└── CLAUDE.md        # This file
```

## 🆕 Latest Features (Phase 11 Phase 2)

### Advanced User Management Integration
- **14/73 Settings Connected**: Admin settings now control live functionality across the application
- **Member Directory**: Complete member listing with search, privacy controls, and responsive design
- **Authentication System**: Fixed password hashing issues, proper login flow, and approval workflows
- **Guest Browsing Control**: Dynamic access control based on admin settings with proper loading states
- **Registration Management**: Real-time control of user registration availability and approval requirements

### New Features Implemented
- **🔍 Member Directory Page**: Professional member listing with search functionality, avatar display, profile stats
- **🔐 Enhanced Authentication**: Fixed password hashing, improved login flow, proper approval status handling
- **👥 Privacy Controls**: Username hiding, profile visibility, guest browsing restrictions based on admin settings
- **📋 Settings Integration**: Registration control, member directory visibility, profile privacy all controlled by admin panel
- **🌐 Navigation Enhancement**: Members link with authentication filtering and internationalization support

### Settings Successfully Connected (14 total)
- **Authentication & Access**: `allow_registration`, `registration_approval_required`, `allow_guest_browsing`
- **User Management**: `member_directory_visible`, `allow_public_profiles`, `enable_user_avatars`
- **Content Control**: `max_whiskies_per_page`, `featured_whiskies_count`, `max_rating_scale`, `default_whisky_bottle_size`
- **Appearance**: `primary_color`, `secondary_color`, `site_logo_url`, `hero_background_image`, `club_motto`, `footer_text`, `site_name`

### Technical Improvements
- **Loading State Management**: Proper handling of settings loading to prevent race conditions
- **Public Settings API**: Key settings made accessible to frontend for real-time control
- **Component Architecture**: Enhanced settings context and hook patterns for reusable settings access
- **Error Handling**: Improved error messaging and fallback states throughout user management features

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
*Last updated: 2025-06-13*
*Project: Åby Whisky Club Management System*
*Status: Phase 11 Phase 2 In Progress - Advanced User Management Integration*
*Features: 14/73 admin settings connected to live functionality, member directory, authentication system*