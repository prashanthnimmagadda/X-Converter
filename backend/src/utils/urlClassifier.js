/**
 * URL Classifier for X (Twitter) content
 * Determines if a URL is an Article, Post, or Thread
 */

class URLClassifier {
  /**
   * Classify the X URL
   * @param {string} url - The X URL to classify
   * @returns {Object} - Classification result { type: 'article'|'post'|'thread', valid: boolean }
   */
  static classify(url) {
    try {
      const urlObj = new URL(url);

      // Validate domain
      if (!this.isXDomain(urlObj.hostname)) {
        return { type: null, valid: false, error: 'Invalid X domain' };
      }

      const pathname = urlObj.pathname;

      // Check if it's an article (long-form content)
      // X articles are typically at: x.com/i/articles/<id> or twitter.com/i/articles/<id>
      if (pathname.includes('/i/articles/')) {
        return { type: 'article', valid: true };
      }

      // Check if it's a post/status
      // Format: x.com/<username>/status/<id>
      const statusMatch = pathname.match(/^\/([^\/]+)\/status\/(\d+)/);
      if (statusMatch) {
        const username = statusMatch[1];
        const tweetId = statusMatch[2];

        return {
          type: 'post',
          valid: true,
          username,
          tweetId,
          // We'll determine if it's a thread during rendering
          needsThreadCheck: true
        };
      }

      return { type: null, valid: false, error: 'Unknown URL format' };
    } catch (error) {
      return { type: null, valid: false, error: 'Invalid URL format' };
    }
  }

  /**
   * Check if hostname is a valid X domain
   * @param {string} hostname - The hostname to check
   * @returns {boolean}
   */
  static isXDomain(hostname) {
    const validDomains = [
      'x.com',
      'www.x.com',
      'twitter.com',
      'www.twitter.com',
      'mobile.twitter.com',
      'mobile.x.com'
    ];

    return validDomains.includes(hostname.toLowerCase());
  }

  /**
   * Normalize URL to standard format
   * @param {string} url - The URL to normalize
   * @returns {string} - Normalized URL
   */
  static normalize(url) {
    try {
      const urlObj = new URL(url);

      // Convert twitter.com to x.com for consistency
      if (urlObj.hostname.includes('twitter.com')) {
        urlObj.hostname = urlObj.hostname.replace('twitter.com', 'x.com');
      }

      // Remove query parameters that don't affect content
      const paramsToKeep = ['s']; // Keep share tracking if needed
      const newSearchParams = new URLSearchParams();

      for (const param of paramsToKeep) {
        if (urlObj.searchParams.has(param)) {
          newSearchParams.set(param, urlObj.searchParams.get(param));
        }
      }

      urlObj.search = newSearchParams.toString();

      return urlObj.toString();
    } catch (error) {
      return url;
    }
  }
}

module.exports = URLClassifier;
