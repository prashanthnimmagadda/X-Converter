/**
 * URL Classifier for X/Twitter content.
 */

class URLClassifier {
  static classify(url) {
    try {
      const urlObj = new URL(url);

      if (!this.isXDomain(urlObj.hostname)) {
        return { type: null, valid: false, error: 'Invalid X/Twitter domain' };
      }

      const pathname = this.normalisePathname(urlObj.pathname);

      if (/^\/i\/articles\/[A-Za-z0-9_-]+\/?$/.test(pathname)) {
        return { type: 'article', valid: true, articleId: pathname.split('/').pop() };
      }

      const statusMatch = pathname.match(/^\/([^/]+)\/status(?:es)?\/(\d+)\/?$/);
      if (statusMatch) {
        const username = decodeURIComponent(statusMatch[1]);
        const tweetId = statusMatch[2];

        if (!this.isValidUsername(username)) {
          return { type: null, valid: false, error: 'Invalid X/Twitter username' };
        }

        return {
          type: 'post',
          valid: true,
          username,
          tweetId,
          needsThreadCheck: true
        };
      }

      return { type: null, valid: false, error: 'Unsupported X/Twitter URL format' };
    } catch (_) {
      return { type: null, valid: false, error: 'Invalid URL format' };
    }
  }

  static isXDomain(hostname) {
    const normalised = hostname.toLowerCase();
    return [
      'x.com',
      'www.x.com',
      'mobile.x.com',
      'twitter.com',
      'www.twitter.com',
      'mobile.twitter.com'
    ].includes(normalised);
  }

  static isValidUsername(username) {
    return /^[A-Za-z0-9_]{1,15}$/.test(username);
  }

  static normalisePathname(pathname) {
    return pathname.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
  }

  static normalize(url) {
    try {
      const trimmed = String(url || '').trim();
      const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      const urlObj = new URL(withProtocol);

      urlObj.protocol = 'https:';
      urlObj.hostname = urlObj.hostname
        .toLowerCase()
        .replace(/^mobile\./, '')
        .replace(/^www\./, '')
        .replace('twitter.com', 'x.com');

      urlObj.pathname = this.normalisePathname(urlObj.pathname);

      const keepParams = new Set(['s']);
      for (const key of Array.from(urlObj.searchParams.keys())) {
        if (!keepParams.has(key)) {
          urlObj.searchParams.delete(key);
        }
      }

      urlObj.hash = '';
      return urlObj.toString();
    } catch (_) {
      return String(url || '').trim();
    }
  }
}

module.exports = URLClassifier;
