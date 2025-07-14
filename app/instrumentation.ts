export async function register() {
  // This runs when Next.js server starts
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🚀 Next.js server starting...')
    
    // Run auto-seed if enabled
    if (process.env.AUTO_SEED === 'true') {
      const { autoSeedDatabase } = await import('@/lib/db/auto-seed')
      await autoSeedDatabase()
    }
  }
}