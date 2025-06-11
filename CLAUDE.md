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

## 🆕 Latest Features (Phase 10)

### Enterprise Admin Settings System
- **60+ Professional Settings**: Comprehensive configuration across 8 categories
- **Smart UI Components**: Color pickers, live previews, enum dropdowns, textarea detection
- **Category Organization**: 🎨 Appearance, 📧 Email, 👤 Privacy, 🎉 Events, 📊 Analytics, 🚀 Features, 🌍 Localization
- **Advanced Validation**: Pattern matching, enum constraints, range validation with custom error messages
- **Professional UX**: Save/Reset functionality, change detection, validation feedback

### Admin Settings Categories
- **🎨 Appearance & Branding**: Logo/favicon URLs, brand colors (live color pickers), hero images, club motto, footer text
- **📧 Email & Notifications**: SMTP configuration, welcome templates (textarea), email signatures, notification preferences
- **👤 Privacy & User Management**: Registration policies, password requirements, profile settings, approval workflows
- **🎉 Events & Social Features**: Event capacity, waitlists, RSVP deadlines, photo uploads, social sharing
- **📊 Analytics & Performance**: Google Analytics integration, leaderboards, backup schedules, maintenance mode
- **🚀 Features & Functionality**: Rating scales (enum), content approval, comparison tools, wishlists, featured content
- **🌍 Localization & Regional**: Language settings (enum), currency codes (pattern validation), date formats, timezone

### Production-Ready Configuration
- **Live Previews**: Real-time color swatches, image previews, validation hints
- **Smart Input Detection**: Automatic email/password/URL/color input types based on field names
- **Enterprise Validation**: Comprehensive backend validation with enum support and pattern matching
- **Category Filtering**: Professional category-based organization with icons and color coding

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
*Last updated: 2025-12-11*
*Project: Åby Whisky Club Management System*
*Status: Enterprise-ready with comprehensive admin settings system (Phase 10 Complete)*
*Features: 60+ professional settings, live previews, smart UI components, 8 configuration categories*