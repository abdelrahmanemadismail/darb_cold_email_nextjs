/**
 * Rate Limiter Utility for Apollo API
 * 
 * Provides configurable rate limiting to respect API quotas
 * and prevent hitting rate limits.
 */

export interface RateLimiterOptions {
  /** Delay in milliseconds between requests */
  delayMs?: number;
  /** Maximum requests per minute */
  requestsPerMinute?: number;
}

export class ApolloRateLimiter {
  private delayMs: number;
  private requestsPerMinute: number;
  private requestTimestamps: number[] = [];

  constructor(options: RateLimiterOptions = {}) {
    this.delayMs = options.delayMs ?? 1000; // Default 1 second
    this.requestsPerMinute = options.requestsPerMinute ?? 60; // Default 60/min
  }

  /**
   * Wait for the appropriate delay before making a request
   */
  async wait(): Promise<void> {
    const now = Date.now();
    
    // Clean up old timestamps (older than 1 minute)
    this.requestTimestamps = this.requestTimestamps.filter(
      (timestamp) => now - timestamp < 60000
    );

    // Check if we're at the rate limit
    if (this.requestTimestamps.length >= this.requestsPerMinute) {
      const oldestRequest = this.requestTimestamps[0];
      const waitTime = 60000 - (now - oldestRequest) + 100; // Add 100ms buffer
      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    // Apply base delay
    await new Promise((resolve) => setTimeout(resolve, this.delayMs));

    // Record this request
    this.requestTimestamps.push(Date.now());
  }

  /**
   * Reset the rate limiter (useful for testing or after errors)
   */
  reset(): void {
    this.requestTimestamps = [];
  }
}
