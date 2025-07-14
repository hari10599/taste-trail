# Running Database Seed on Render Production

## 📋 Prerequisites
- Render PostgreSQL database deployed
- Web service deployed and connected
- Database URL available in environment variables

## 🚀 Method 1: Using Render Shell (Recommended)

### Step 1: Access Render Shell
1. Go to your **Web Service** in Render Dashboard
2. Click on **"Shell"** tab in the left sidebar
3. Wait for the shell to connect

### Step 2: Run Seed Command
```bash
# In the Render shell, run:
npm run db:seed
```

If that doesn't work due to TypeScript, try:
```bash
# Install ts-node temporarily
npm install -g ts-node

# Run seed directly
npx ts-node prisma/seed.ts
```

## 🔧 Method 2: One-Time Job

### Step 1: Create a One-Time Job Script
Create `scripts/seed-production.js`:
```javascript
const { exec } = require('child_process');

console.log('Starting production database seed...');

exec('npx prisma db seed', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
  if (stderr) {
    console.error(`stderr: ${stderr}`);
  }
  console.log(`stdout: ${stdout}`);
  console.log('Seed completed successfully!');
  process.exit(0);
});
```

### Step 2: Deploy and Run
1. Commit and push the script
2. In Render Dashboard, go to your Web Service
3. Click **"Manual Deploy"** → **"Clear build cache & deploy"**
4. Once deployed, use the Shell to run:
   ```bash
   node scripts/seed-production.js
   ```

## 🖥️ Method 3: Local Machine with Production Database

### Step 1: Set Production Database URL Locally
```bash
# Create .env.production file
echo "DATABASE_URL=postgresql://username:password@hostname:port/database" > .env.production
```

### Step 2: Run Seed with Production Database
```bash
# Load production env and run seed
DATABASE_URL="your-render-postgres-external-url" npm run db:seed
```

⚠️ **Warning**: Use EXTERNAL database URL when connecting from local machine

## 🤖 Method 4: GitHub Actions (Automated)

### Step 1: Create GitHub Action
Create `.github/workflows/seed-database.yml`:
```yaml
name: Seed Production Database

on:
  workflow_dispatch:  # Manual trigger

jobs:
  seed:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Generate Prisma Client
        run: npx prisma generate
        
      - name: Seed Database
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: npm run db:seed
```

### Step 2: Add Secret
1. Go to GitHub repo → Settings → Secrets
2. Add `DATABASE_URL` with your Render PostgreSQL URL

### Step 3: Run Workflow
1. Go to Actions tab in GitHub
2. Select "Seed Production Database"
3. Click "Run workflow"

## 📝 Method 5: Custom Seed Endpoint (For Testing)

### Step 1: Create Seed API Route
Create `app/api/admin/seed/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import bcrypt from 'bcryptjs'

// IMPORTANT: Remove this endpoint after seeding!
export async function POST(request: NextRequest) {
  try {
    // Verify admin token or secret
    const authHeader = request.headers.get('x-seed-secret')
    if (authHeader !== process.env.SEED_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Run minimal seed logic here
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    // Create admin user
    await prisma.user.create({
      data: {
        email: 'admin@tastetrail.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN',
        verified: true,
      }
    })

    return NextResponse.json({ message: 'Seed completed' })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 })
  }
}
```

### Step 2: Add Environment Variable
In Render, add:
```
SEED_SECRET=your-super-secret-seed-key
```

### Step 3: Trigger Seed
```bash
curl -X POST https://your-app.onrender.com/api/admin/seed \
  -H "x-seed-secret: your-super-secret-seed-key"
```

### Step 4: Remove Endpoint
Delete the file after seeding!

## 🎯 Quick Seed Commands

### Essential Data Only
If you want to seed just the essentials:
```bash
# Create a minimal seed script
cat > prisma/seed-minimal.ts << 'EOF'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  await prisma.user.create({
    data: {
      email: 'admin@tastetrail.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      verified: true,
      profile: {
        create: {
          bio: 'Platform Administrator'
        }
      }
    }
  })
  
  console.log('Admin user created!')
  console.log('Email: admin@tastetrail.com')
  console.log('Password: admin123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
EOF

# Run it
npx ts-node prisma/seed-minimal.ts
```

## ⚠️ Important Notes

1. **Backup First**: Always backup production data before seeding
2. **Check Existing Data**: Seed script might fail if data already exists
3. **External vs Internal URL**: 
   - Use INTERNAL URL when running from Render services
   - Use EXTERNAL URL when running from local machine
4. **Performance**: Seeding might take time with large datasets
5. **Idempotency**: Make seed scripts idempotent (safe to run multiple times)

## 🔍 Verify Seed Success

### Check in Render Shell
```bash
# Connect to database
npx prisma studio

# Or query directly
npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"User\";"
```

### Check via API
```bash
# Test login with seeded user
curl -X POST https://your-app.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tastetrail.com","password":"admin123"}'
```

## 🆘 Troubleshooting

### Common Issues

1. **"Cannot find module"**
   ```bash
   npm install
   npx prisma generate
   ```

2. **"Connection refused"**
   - Check DATABASE_URL is correct
   - Ensure using correct URL (internal vs external)

3. **"Unique constraint violation"**
   - Data already exists
   - Clear tables first or modify seed script

4. **"Permission denied"**
   - Check database user permissions
   - Ensure database allows connections

### Reset Database (Danger!)
```bash
# Only in development/testing!
npx prisma migrate reset --force
```

---

**Recommended**: Use Method 1 (Render Shell) for simplicity and security.