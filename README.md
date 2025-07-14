# Taste Trail

A modern restaurant review platform connecting food enthusiasts, influencers, and restaurant owners.

## Features Implemented (Week 1)

### Day 1: Authentication System ✅
- User registration with role selection (User, Influencer, Restaurant Owner)
- JWT-based authentication with refresh tokens
- Login/logout functionality
- Protected routes with middleware
- Beautiful glass-morphism UI design

### Day 2-5: Coming Soon
- User profiles and role management
- Restaurant directory with search
- Review system with media uploads
- Social features (likes, comments)

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: JWT with refresh tokens
- **UI Components**: Custom components with Radix UI

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### PostgreSQL Setup

1. **Install PostgreSQL** (if not already installed):
   - **macOS**: `brew install postgresql@16` or download from [postgresql.org](https://www.postgresql.org/download/)
   - **Ubuntu/Debian**: `sudo apt-get install postgresql postgresql-contrib`
   - **Windows**: Download installer from [postgresql.org](https://www.postgresql.org/download/)
   
   **Note for macOS Homebrew users**: If `psql` command is not found, add PostgreSQL to your PATH:
   ```bash
   echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   ```

2. **Start PostgreSQL service**:
   - **macOS**: `brew services start postgresql` or `pg_ctl -D /usr/local/var/postgres start`
   - **Ubuntu/Debian**: `sudo service postgresql start`
   - **Windows**: PostgreSQL starts automatically after installation

3. **Create the database**:
```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# Create the database
CREATE DATABASE tastetrailv2;

# Create a user (optional, if not using postgres user)
CREATE USER yourusername WITH ENCRYPTED PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE tastetrailv2 TO yourusername;

# Exit PostgreSQL
\q
```

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd taste-trail
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables:
```bash
cp .env.example .env
```

4. Update the `.env` file with your PostgreSQL credentials:
```env
# If using default postgres user:
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/tastetrailv2?schema=public"

# If using custom user:
DATABASE_URL="postgresql://yourusername:yourpassword@localhost:5432/tastetrailv2?schema=public"

# Update these with secure values:
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"
```

5. Push the database schema:
```bash
npm run db:push
```

6. Seed the database with sample data:
```bash
npm run db:seed
```

7. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Database Seeding

The seeder creates:
- 46 users (1 admin, 10 influencers, 5 owners, 30 regular users)
- 100 restaurants with realistic data
- 500 reviews with ratings and images
- 2000+ likes and 1000+ comments

### Test Accounts

After seeding, you can login with these test accounts:

- **Admin**: admin@tastetrail.com / admin123
- **Influencer**: influencer1@example.com / password123
- **Restaurant Owner**: owner1@example.com / password123
- **Regular User**: user1@example.com / password123

## Project Structure

```
taste-trail/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication routes
│   ├── (main)/            # Main application routes
│   └── api/               # API routes
├── components/            # Reusable UI components
├── lib/                   # Utilities and configurations
├── prisma/                # Database schema and seeders
└── public/                # Static assets
```

## Development Status

- [x] Day 1: Authentication System
- [ ] Day 2: User Profiles & Role Management
- [ ] Day 3: Restaurant Management
- [ ] Day 4: Review System
- [ ] Day 5: Social Features

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push database schema
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio

## Contributing

This is a development project for learning purposes. Feel free to explore and modify as needed.

## Troubleshooting

### Common Issues

1. **Database connection errors**:
   - Make sure PostgreSQL is running: `pg_ctl status` or `brew services list | grep postgresql`
   - Verify your database exists: `psql -U postgres -c "\l" | grep tastetrailv2`
   - Check your credentials in the `.env` file

2. **Permission denied errors**:
   - If using macOS, you might need to create a database with your system username:
     ```bash
     createdb tastetrailv2
     ```

3. **Port already in use**:
   - The app runs on port 3000 by default. If it's in use, you can change it:
     ```bash
     PORT=3001 npm run dev
     ```

4. **Prisma errors**:
   - Clear Prisma cache: `npx prisma generate`
   - Reset database: `npx prisma db push --force-reset`

### Quick Database Setup (Alternative Method)

If you're having trouble with psql, you can use createdb command:

```bash
# For default postgres user
createdb -U postgres tastetrailv2

# For your system user (macOS/Linux)
createdb tastetrailv2
```

## License

MIT