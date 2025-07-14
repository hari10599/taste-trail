# 🌱 Automatic Database Seeding

The Taste Trail application now includes automatic database seeding that runs when the server starts for the first time. This is perfect for Render deployments!

## How It Works

1. **On Server Start**: When the Next.js server starts, it checks if `AUTO_SEED=true`
2. **Database Check**: It checks if the database is empty (no users)
3. **Auto Seed**: If empty, it automatically creates initial data
4. **One-Time Only**: If data exists, it skips seeding

## Setup Instructions

### For Render Deployment

1. **Add Environment Variable** in Render Dashboard:
   ```
   AUTO_SEED=true
   ```

2. **Deploy**: The seed will run automatically when the server starts

3. **After First Run**: Set `AUTO_SEED=false` to prevent re-seeding
   - Or just remove the environment variable

## What Gets Created

### Users
- **Admin Account**
  - Email: `admin@tastetrail.com`
  - Password: `TasteTrail2025!`
  - Role: ADMIN

- **Demo Account**
  - Email: `demo@tastetrail.com`
  - Password: `demo123`
  - Role: USER

### Sample Data
- 3 restaurants in San Francisco
- Complete with images, hours, and details

## Monitoring

Watch the Render logs during deployment:
```
🌱 Checking if database needs seeding...
🚀 Starting automatic database seed...
✅ Auto-seed completed successfully!
📧 Admin: admin@tastetrail.com / TasteTrail2025!
📧 Demo: demo@tastetrail.com / demo123
🍽️ Created 3 sample restaurants
```

## Security Notes

1. **Change Passwords**: Update default passwords after first login
2. **Disable After Use**: Set `AUTO_SEED=false` after initial seed
3. **Production Ready**: Safe for production use

## Advantages

- ✅ **No Manual Steps**: Completely automatic
- ✅ **Free Tier Friendly**: No Shell access needed
- ✅ **Idempotent**: Safe to run multiple times
- ✅ **Zero Configuration**: Just set one env variable
- ✅ **Production Safe**: Only runs when explicitly enabled

## Troubleshooting

### Seed Not Running?
- Check `AUTO_SEED=true` is set in environment
- Check Render logs for any errors
- Ensure database connection is working

### Already Seeded?
- The auto-seed skips if any users exist
- This prevents duplicate data

### Want to Re-seed?
1. Clear the database (careful!)
2. Set `AUTO_SEED=true`
3. Restart the service

---

This feature makes deployment on Render's free tier super easy - just set `AUTO_SEED=true` and deploy! 🚀