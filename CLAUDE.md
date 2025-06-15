# Åby Whisky Club Development Guide

## 🚨 Docker Command Guidelines
- All docker commands should be run/executed by the user
- Provide instructions in case a command needs to be executed

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

### Database Commands (When Needed)
```bash
# Add missing system settings to database
docker exec aby_whisky_db psql -U whisky_admin -d aby_whisky_club -c "INSERT INTO system_settings (key, value, data_type, category, description, is_public, is_readonly, validation_rules, created_at, updated_at) VALUES ('enable_dark_mode', 'true', 'boolean', 'appearance', 'Enable dark mode toggle for users', true, false, '{\"type\": \"boolean\"}', NOW(), NOW()) ON CONFLICT (key) DO NOTHING;"

# Check database settings
docker exec aby_whisky_db psql -U whisky_admin -d aby_whisky_club -c "SELECT key, value, data_type FROM system_settings WHERE key = 'enable_dark_mode';"
```

[Rest of the existing content remains the same...]