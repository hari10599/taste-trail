# 🌱 Seeding Database on Render Free Tier

Since Shell access is not available on the free tier, here are the best methods:

## Method 1: API Endpoint (Easiest) ✅

### Step 1: Add Environment Variable in Render
1. Go to your Web Service in Render Dashboard
2. Click **Environment** tab
3. Add new variable:
   ```
   SEED_SECRET=your-super-secret-seed-key-change-this
   ```
4. Click **Save Changes** (this will trigger a redeploy)

### Step 2: Wait for Deployment
Wait for your service to finish deploying with the new environment variable.

### Step 3: Check Database Status
```bash
curl https://your-app-name.onrender.com/api/admin/seed
```

### Step 4: Run Seed
```bash
curl -X POST https://your-app-name.onrender.com/api/admin/seed \
  -H "x-seed-secret: your-super-secret-seed-key-change-this"
```

### Step 5: Verify Success
The response will show:
```json
{
  "success": true,
  "message": "Database seeded successfully!",
  "data": {
    "admin": {
      "email": "admin@tastetrail.com",
      "password": "TasteTrail2025!"
    },
    "demoUser": {
      "email": "demo@tastetrail.com",
      "password": "demo123"
    },
    "restaurantsCreated": 3
  }
}
```

### Step 6: DELETE THE SEED ENDPOINT! ⚠️
**IMPORTANT**: After seeding, delete the file:
1. Delete `app/api/admin/seed/route.ts`
2. Commit and push to remove the endpoint

## Method 2: Local Machine with External Database URL

### Step 1: Get External Database URL
1. Go to your PostgreSQL instance in Render
2. Copy the **External Database URL** (not internal)

### Step 2: Run Seed Locally
```bash
# Clone your repo locally
git clone https://github.com/hari10599/taste-trail.git
cd taste-trail

# Install dependencies
npm install

# Set database URL and run seed
DATABASE_URL="your-external-postgres-url" node scripts/seed-simple.js
```

## Method 3: One-Time Manual SQL

### Step 1: Connect to Database
Use any PostgreSQL client (pgAdmin, TablePlus, etc.) with your External Database URL

### Step 2: Run SQL Commands
```sql
-- Create admin user (password: TasteTrail2025!)
INSERT INTO "User" (id, email, password, name, role, verified, "createdAt", "updatedAt")
VALUES (
  'clxxxxxxxxxxxxxxxx', -- Generate a cuid
  'admin@tastetrail.com',
  '$2a$10$YourHashedPasswordHere', -- Use bcrypt to hash
  'Admin User',
  'ADMIN',
  true,
  NOW(),
  NOW()
);
```

## Quick Test After Seeding

### Test Login
```bash
# Test admin login
curl -X POST https://your-app-name.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tastetrail.com","password":"TasteTrail2025!"}'
```

### Check Health
```bash
curl https://your-app-name.onrender.com/api/health
```

## Credentials Created

### Admin Account
- Email: `admin@tastetrail.com`
- Password: `TasteTrail2025!`
- Role: ADMIN

### Demo Account
- Email: `demo@tastetrail.com`
- Password: `demo123`
- Role: USER

### Sample Data
- 3 restaurants in San Francisco
- Ready for testing all features

## ⚠️ Security Notes

1. **Change passwords** immediately after first login
2. **Delete seed endpoint** after use
3. **Never commit** SEED_SECRET to repository
4. **Use strong** seed secrets in production

## Troubleshooting

### "Unauthorized - Invalid seed secret"
- Check SEED_SECRET is set in Render environment
- Make sure no spaces in the secret
- Service needs to redeploy after adding env var

### "Database already seeded"
- Database already has data
- This is safe - prevents duplicate data

### Connection Issues
- Ensure database is in same region as web service
- Check DATABASE_URL is correct in Render
- Free tier databases sleep after inactivity

---

**Recommended**: Use Method 1 (API Endpoint) - it's the easiest and works perfectly with free tier!