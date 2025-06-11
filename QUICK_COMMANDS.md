# Quick Commands Reference

## Development Commands

### Docker Operations
```bash
# Start the application
docker-compose up -d

# Stop the application
docker-compose down

# View logs
docker-compose logs backend
docker-compose logs frontend

# Restart backend only
docker-compose restart backend
```

### Git Operations
```bash
# Check status
git status

# Add and commit changes
git add .
git commit -m "Your commit message"

# Push to GitHub
git push origin main

# Pull latest changes
git pull origin main
```

### URLs
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- Admin Panel: http://localhost:3000/admin

### Database
- Host: localhost:5432
- Database: aby_whisky_club
- User: postgres
- Password: postgres123

### Admin Access
- Email: admin@abywhiskyclub.com
- Password: AdminPass123!

## Troubleshooting
- If port conflicts: Stop other PostgreSQL instances
- If container issues: `docker-compose down && docker-compose up --build`
- If database issues: Check Docker logs and restart containers