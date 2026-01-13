/**
 * Custom Error Classes for Apollo Integration
 * 
 * Provides better error context and type safety for error handling
 */

export class ApolloApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly responseBody?: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApolloApiError';
  }

  /**
   * Check if this is a rate limit error
   */
  isRateLimit(): boolean {
    return this.statusCode === 429;
  }

  /**
   * Check if this is a client error (4xx)
   */
  isClientError(): boolean {
    return this.statusCode >= 400 && this.statusCode < 500;
  }

  /**
   * Check if this is a server error (5xx)
   */
  isServerError(): boolean {
    return this.statusCode >= 500;
  }

  /**
   * Get a user-friendly error message
   */
  getUserMessage(): string {
    if (this.isRateLimit()) {
      return 'Apollo API rate limit exceeded. Please wait before trying again.';
    }
    if (this.statusCode === 401) {
      return 'Apollo API authentication failed. Please check your API key.';
    }
    if (this.statusCode === 403) {
      return 'Apollo API access forbidden. Please check your API permissions.';
    }
    if (this.isClientError()) {
      return `Apollo API request failed: ${this.message}`;
    }
    if (this.isServerError()) {
      return 'Apollo API server error. Please try again later.';
    }
    return this.message;
  }
}

export class ApolloValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: unknown
  ) {
    super(message);
    this.name = 'ApolloValidationError';
  }
}

export class ApolloDatabaseError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApolloDatabaseError';
  }
}
