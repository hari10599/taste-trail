import Anthropic from '@anthropic-ai/sdk'

// Initialize Anthropic client
let anthropicClient: Anthropic | null = null

function getClaudeClient() {
  if (!anthropicClient && process.env.CLAUDE_API_KEY) {
    anthropicClient = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
    })
  }
  return anthropicClient
}

// Analyze sentiment of review content
export async function analyzeReviewSentiment(content: string): Promise<string | null> {
  const client = getClaudeClient()
  if (!client) {
    console.warn('Claude API key not configured')
    return null
  }

  try {
    // Limit content to save tokens
    const truncatedContent = content.slice(0, 500)
    
    const response = await client.messages.create({
      model: 'claude-3-haiku-20240307', // Use Haiku for cost efficiency
      max_tokens: 10,
      temperature: 0,
      messages: [{
        role: 'user',
        content: `Classify the sentiment of this restaurant review as POSITIVE, NEUTRAL, or NEGATIVE. Reply with only one word:

"${truncatedContent}"`
      }]
    })

    const sentiment = response.content[0].type === 'text' 
      ? response.content[0].text.trim().toUpperCase() 
      : null

    // Validate response
    if (sentiment && ['POSITIVE', 'NEUTRAL', 'NEGATIVE'].includes(sentiment)) {
      return sentiment
    }
    
    return null
  } catch (error) {
    console.error('Sentiment analysis error:', error)
    return null
  }
}

// Extract tags from review content
export async function extractReviewTags(content: string, restaurantName?: string): Promise<string[]> {
  const client = getClaudeClient()
  if (!client) {
    console.warn('Claude API key not configured')
    return []
  }

  try {
    // Limit content to save tokens
    const truncatedContent = content.slice(0, 500)
    
    const response = await client.messages.create({
      model: 'claude-3-haiku-20240307', // Use Haiku for cost efficiency
      max_tokens: 100,
      temperature: 0,
      messages: [{
        role: 'user',
        content: `Extract key tags from this restaurant review. Include only: dish names, cuisine types, and notable attributes (e.g., "cozy", "romantic", "family-friendly"). Return as comma-separated list, max 8 tags:

Restaurant: ${restaurantName || 'Unknown'}
Review: "${truncatedContent}"`
      }]
    })

    if (response.content[0].type === 'text') {
      const tagsText = response.content[0].text.trim()
      const tags = tagsText
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0 && tag.length < 30) // Basic validation
        .slice(0, 8) // Max 8 tags
      
      return tags
    }
    
    return []
  } catch (error) {
    console.error('Tag extraction error:', error)
    return []
  }
}

// Batch analyze multiple reviews (for future use)
export async function batchAnalyzeReviews(reviews: Array<{ id: string; content: string; restaurantName?: string }>) {
  const results = await Promise.all(
    reviews.map(async (review) => {
      const [sentiment, tags] = await Promise.all([
        analyzeReviewSentiment(review.content),
        extractReviewTags(review.content, review.restaurantName)
      ])
      
      return {
        id: review.id,
        sentiment,
        tags
      }
    })
  )
  
  return results
}