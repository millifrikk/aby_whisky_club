# Quick Database Setup Guide

## 🚨 No Whiskies Showing? Here's How to Fix It

### **Method 1: Automatic Fix (Recommended)**
The backend now automatically checks and seeds the database on startup. Simply restart your Docker containers:

```bash
# Stop containers
docker-compose down

# Start containers (this will trigger auto-seeding)
docker-compose up --build
```

### **Method 2: Manual Database Seeding**
If the automatic seeding doesn't work, run these commands:

```bash
# Option A: Run in Docker container
docker-compose exec backend npm run seed

# Option B: Run full database initialization
docker-compose exec backend npm run init-db

# Option C: Run setup + seeding
docker-compose exec backend npm run setup
docker-compose exec backend npm run seed
```

### **Method 3: Complete Database Reset**
If you want to start fresh:

```bash
# Stop containers
docker-compose down

# Remove database volume
docker volume rm aby_whisky_club_postgres_data

# Start containers (fresh database)
docker-compose up --build
```

## 📊 Expected Sample Data

After seeding, you should have:

### **Whiskies (6 total)**:
1. **Macallan 18 Year Old** - Speyside (Featured)
2. **Lagavulin 16 Year Old** - Islay (Featured) 
3. **Glenfiddich 21 Year Old** - Speyside
4. **Ardbeg 10 Year Old** - Islay (Featured)
5. **Yamazaki 12 Year Old** - Japan (Featured)
6. **Buffalo Trace Bourbon** - Kentucky

### **Users (4 total)**:
- **Admin**: admin@abywhiskyclub.com / AdminPass123!
- **Members**: 
  - erik@example.com / MemberPass123!
  - anna@example.com / MemberPass123!
  - lars@example.com / MemberPass123!

### **News & Events (4 total)**:
- Welcome announcement
- Monthly tasting events
- New arrivals news
- Educational workshops

## 🔧 Troubleshooting

### **Still No Data?**
1. Check backend logs for errors:
   ```bash
   docker-compose logs backend
   ```

2. Verify database connection:
   ```bash
   docker-compose exec backend npm run migrate
   ```

3. Check if tables exist:
   ```bash
   docker-compose exec postgres psql -U whisky_admin -d aby_whisky_club -c "\dt"
   ```

### **API Not Responding?**
1. Test health endpoint: http://localhost:3001/api/health
2. Test whiskies endpoint: http://localhost:3001/api/whiskies
3. Check backend container is running: `docker-compose ps`

### **Frontend Not Loading Data?**
1. Check browser console for errors
2. Verify API connection in Network tab
3. Ensure backend is running on port 3001

## 🎯 Quick Test

After setup, test these features:
1. **Browse Whiskies**: http://localhost:3000/whiskies
2. **Login**: Use admin@abywhiskyclub.com / AdminPass123!
3. **Rate a Whisky**: Click on any whisky and rate it
4. **View Ratings**: http://localhost:3000/ratings

## 🚀 What Changed

### **New Auto-Initialization**
- Backend now automatically checks for data on startup
- Runs seeding only if database is empty
- Provides clear console output about data status
- No manual intervention needed

### **Available Commands**
- `npm run init-db` - Full database initialization
- `npm run seed` - Manual seeding only
- `npm run setup` - Schema setup only
- `npm run migrate` - Run migrations only