/**
 * In-memory token blacklist for force logout functionality
 * In production, consider using Redis for persistence across server restarts
 */

class TokenBlacklist {
  constructor() {
    this.blacklist = new Map();
    this.cleanupInterval = setInterval(() => this.prune(), 60000); // Clean up every minute
  }

  /**
   * Add a token to blacklist
   * @param {string} jti - JWT ID
   * @param {number} exp - Expiration timestamp
   */
  add(jti, exp) {
    this.blacklist.set(jti, exp);
  }

  /**
   * Check if a token is blacklisted
   * @param {string} jti - JWT ID
   * @returns {boolean}
   */
  has(jti) {
    return this.blacklist.has(jti);
  }

  /**
   * Remove expired tokens from blacklist
   */
  prune() {
    const now = Math.floor(Date.now() / 1000);
    for (const [jti, exp] of this.blacklist.entries()) {
      if (exp < now) {
        this.blacklist.delete(jti);
      }
    }
  }

  /**
   * Get blacklist size (for monitoring)
   * @returns {number}
   */
  size() {
    return this.blacklist.size;
  }

  /**
   * Clear all tokens (for testing/reset)
   */
  clear() {
    this.blacklist.clear();
  }

  /**
   * Cleanup on server shutdown
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Export singleton instance
const tokenBlacklist = new TokenBlacklist();

// Handle process termination
process.on('SIGINT', () => tokenBlacklist.destroy());
process.on('SIGTERM', () => tokenBlacklist.destroy());

module.exports = tokenBlacklist;
