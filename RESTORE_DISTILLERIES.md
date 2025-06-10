# 🏭 Restore Distilleries Data

The distilleries table is empty (0 distilleries) but should contain 800+ from WhiskyHunter API.

## Quick Fix Commands

Run these commands to restore the distilleries:

### Option 1: Manual Population (Recommended)
```bash
# Run in backend container
docker-compose exec backend npm run populate-distilleries
```

### Option 2: Full Setup (Includes distilleries)
```bash
# Run in backend container  
docker-compose exec backend npm run setup
```

### Option 3: Direct API Call (Admin endpoint)
```bash
# Make POST request to populate endpoint
curl -X POST http://localhost:3001/api/distilleries/populate/api
```

## Expected Results

After running any of the above commands, you should see:
- ✅ **~800-900 distilleries** populated from WhiskyHunter API
- ✅ **Scottish regions** properly mapped (Speyside, Islay, etc.)
- ✅ **Distillery stats** showing in API responses
- ✅ **Enhanced whisky data** with distillery relationships

## Verification

Check if it worked:
```bash
# Check distillery count in logs or hit the debug endpoint
curl http://localhost:3001/api/distilleries/stats
```

Should return something like:
```json
{
  "total_distilleries": 892,
  "countries": {...},
  "regions": {...}
}
```

## Why This Happened

The distillery data was likely lost due to:
- Docker volume being recreated
- Database being reset during troubleshooting  
- Container rebuild without persistent data

## Prevention

To prevent data loss in future:
- Use named Docker volumes (already configured)
- Regular database backups
- Environment-specific seeding strategies