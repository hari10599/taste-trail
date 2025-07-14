# Taste Trail - Product Requirements Document

## Overview
Taste Trail is a restaurant review platform connecting food enthusiasts, influencers, and restaurant owners. Features include social timeline, interactive maps, review system, and verification for influencers and owners.

## Tech Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Shadcn/ui, React Query, Zustand
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL, Redis
- **Infrastructure**: Render hosting, ImageKit CDN, Mapbox GL JS
- **Auth**: JWT with refresh tokens

## Core Features

### 1. User System
- **Roles**: User, Verified Influencer, Verified Owner, Admin, Moderator
- **Auth**: Email/password, JWT tokens, email verification, password reset
- **Profile**: Avatar, bio, location, dietary preferences

### 2. Restaurant Management
- **Info**: Name, location, hours, price range ($-$$$$), categories, amenities
- **Media**: Cover photo, gallery (50 images max)
- **Discovery**: Search, filters (category, price, rating, distance), sorting

### 3. Review System
- **Required**: Restaurant, rating (1-5), content (50-2000 chars)
- **Optional**: Title, media (10 images), dishes, price/person
- **Features**: Edit, delete, like, comment, share, report

### 4. Social Timeline
- **Views**: All, Trending, Verified Only, High-rated (4+), Following
- **Algorithm**: `score = (likes*0.4 + comments*0.3 + shares*0.2 + rating*0.1) / age^1.5`

### 5. Influencer Features
- **Verification**: 10K+ followers, food content, manual review
- **Profile**: Custom URL, social links, follower count, verified badge

### 6. Owner Dashboard
- **Analytics**: Rating trends, review count, demographics
- **Management**: Hide/promote reviews, respond, multi-restaurant support

### 7. Admin Panel
- **Users**: Role management, activate/deactivate
- **Moderation**: Review queue, reports, ban/unban
- **Stats**: Platform analytics, user counts

### 8. Map Features
- **Mapbox**: Interactive markers, clustering, filters
- **Location**: Nearby search, distance calculation, user location

### 9. Additional Features
- **Search**: Global search across restaurants, reviews, users
- **Notifications**: In-app, email, push (PWA)
- **Media**: ImageKit integration, 10MB limit, auto-compression
- **Mobile**: Responsive design, PWA support


## API Structure
```
/api/auth/* (register, login, logout, refresh)
/api/users/* (profile, follow, settings)
/api/restaurants/* (CRUD, search, nearby)
/api/reviews/* (CRUD, timeline, like, comment)
/api/admin/* (users, moderation, stats)
```

## 30-Day Implementation Plan

### Week 1: Foundation ✅
**Day 1: Authentication** ✅
- Backend: Next.js setup, Prisma, JWT auth endpoints
- Frontend: Login/register pages, protected routes
- Deliverable: Working auth system

**Day 2: User Profiles** ✅
- Backend: Profile CRUD, roles, email verification
- Frontend: Dashboard, profile management, settings
- Deliverable: Complete user system

**Day 3: Restaurants** ✅
- Backend: Restaurant CRUD, search, filters
- Frontend: Listing page, details, search UI
- Deliverable: Restaurant directory

**Day 4: Reviews** ✅
- Backend: Review CRUD, media uploads
- Frontend: Review forms, display, ratings
- Deliverable: Review system

**Day 5: Social Features** ✅
- Backend: Likes, comments, sharing
- Frontend: Interactive buttons, comment threads
- Deliverable: Social interactions

### Week 2: Advanced Features
**Day 6: Timeline** ✅
- Backend: Timeline queries, trending algorithm
- Frontend: Timeline UI, infinite scroll
- Deliverable: Social timeline

**Day 7: Maps** ✅
- Backend: Geospatial queries, nearby search
- Frontend: Mapbox integration, markers
- Deliverable: Interactive map

**Day 8: Influencers** ✅
- Backend: Verification system, influencer profiles
- Frontend: Verification flow, public profiles
- Deliverable: Influencer system

**Day 9: Owner Dashboard**
- Backend: Owner APIs, analytics
- Frontend: Dashboard UI, review management
- Deliverable: Owner tools

**Day 10: Search**
- Backend: Full-text search, autocomplete
- Frontend: Global search, filters
- Deliverable: Advanced search

### Week 3: Admin & Polish
**Day 11: Admin Dashboard**
- Backend: Admin APIs, moderation
- Frontend: Admin UI, user management
- Deliverable: Admin panel

**Day 12: Moderation**
- Backend: Reporting, content filtering
- Frontend: Report UI, moderation tools
- Deliverable: Moderation system

**Day 13: Media CDN**
- Backend: ImageKit integration
- Frontend: Upload components, gallery
- Deliverable: Media management

**Day 14: Notifications**
- Backend: Notification system
- Frontend: Notification center
- Deliverable: Real-time notifications

**Day 15: Mobile/PWA**
- Backend: Mobile APIs
- Frontend: Responsive UI, PWA setup
- Deliverable: Mobile-ready app

### Week 4: Enhancement
**Day 16: Performance**
- Backend: Caching, optimization
- Frontend: Lazy loading, code splitting
- Deliverable: Optimized app

**Day 17: Analytics**
- Backend: Analytics APIs
- Frontend: Charts, dashboards
- Deliverable: Analytics system

**Day 18: Recommendations**
- Backend: Recommendation engine
- Frontend: Personalized sections
- Deliverable: Smart recommendations

**Day 19: Social Enhancement**
- Backend: Following system
- Frontend: Activity feed
- Deliverable: Enhanced social

**Day 20: Gamification**
- Backend: Points, badges
- Frontend: Achievements UI
- Deliverable: Gamification


## UI/UX Guidelines
- **Colors**: Primary #FF6B6B (coral), Secondary #4ECDC4 (teal)
- **Typography**: Inter for all text
- **Components**: 8px border radius, subtle shadows, 200ms transitions
- **Responsive**: Mobile-first design

## Development Guidelines
- **Daily Structure**: 40% backend, 40% frontend, 20% testing
- **Git Flow**: main → develop → feature/day-X
- **Testing**: Unit tests, E2E tests, 80% coverage
- **Deploy**: Daily to staging, weekly to production

## Security Requirements
- Password hashing (bcrypt)
- Input validation
- Rate limiting
- HTTPS everywhere
- Regular security audits

## Future Enhancements
- Native mobile apps
- Video reviews
- AI recommendations
- Reservation integration
- Loyalty programs
- Multi-vendor ordering

---
**Version**: 1.0 | **Status**: Ready for Implementation