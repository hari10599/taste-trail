#!/usr/bin/env node

const crypto = require('crypto');

console.log('🔐 Generating secure secrets for production deployment...\n');

// Generate secure random secrets
const jwtSecret = crypto.randomBytes(64).toString('hex');
const jwtRefreshSecret = crypto.randomBytes(64).toString('hex');
const nextAuthSecret = crypto.randomBytes(64).toString('hex');

console.log('Copy these to your Render Environment Variables:\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`JWT_REFRESH_SECRET=${jwtRefreshSecret}`);
console.log(`NEXTAUTH_SECRET=${nextAuthSecret}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

console.log('\n✅ All secrets are 512-bit (64 bytes) for maximum security');
console.log('⚠️  Never commit these secrets to your repository');
console.log('📋 Add them to Render Dashboard > Your Service > Environment tab');