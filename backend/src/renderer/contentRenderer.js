/**
 * Content Renderer for X (Twitter) content
 * Uses Puppeteer to render dynamic content and prepare for PDF conversion
 */

const puppeteer = require('puppeteer');

class ContentRenderer {
  constructor() {
    this.browser = null;
  }

  /**
   * Initialize the browser
   */
  async init() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ]
      });
    }
  }

  /**
   * Close the browser
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Render X content and return cleaned HTML
   * @param {string} url - The X URL to render
   * @param {Object} classification - URL classification result
   * @returns {Object} - Rendered content data
   */
  async render(url, classification) {
    await this.init();

    const page = await this.browser.newPage();

    try {
      // Set viewport for mobile-optimized width
      await page.setViewport({
        width: 800,
        height: 1200,
        deviceScaleFactor: 2
      });

      // Set user agent
      await page.setUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
      );

      // Navigate to the URL
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for content to load
      await this.waitForContent(page, classification.type);

      // Extract content based on type
      let content;
      if (classification.type === 'article') {
        content = await this.extractArticle(page);
      } else if (classification.type === 'post') {
        // Check if it's a thread
        const isThread = await this.detectThread(page, classification.username);
        if (isThread) {
          content = await this.extractThread(page, classification.username);
          content.isThread = true;
        } else {
          content = await this.extractPost(page);
          content.isThread = false;
        }
      }

      await page.close();

      return {
        success: true,
        content,
        classification: {
          ...classification,
          type: content.isThread ? 'thread' : classification.type
        }
      };
    } catch (error) {
      await page.close();
      throw new Error(`Rendering failed: ${error.message}`);
    }
  }

  /**
   * Wait for content to load based on type
   */
  async waitForContent(page, type) {
    if (type === 'article') {
      // Wait for article content
      await page.waitForSelector('article', { timeout: 15000 }).catch(() => {});
    } else {
      // Wait for tweet content
      await page.waitForSelector('[data-testid="tweet"]', { timeout: 15000 }).catch(() => {});
    }

    // Additional wait for dynamic content
    await page.waitForTimeout(2000);
  }

  /**
   * Extract article content
   */
  async extractArticle(page) {
    return await page.evaluate(() => {
      const article = document.querySelector('article');

      if (!article) {
        throw new Error('Article content not found');
      }

      // Extract title
      const titleEl = article.querySelector('h1') || article.querySelector('[role="heading"]');
      const title = titleEl ? titleEl.innerText : 'Untitled Article';

      // Extract author info
      const authorLink = document.querySelector('a[href*="/"]:not([href*="/status/"])');
      const author = authorLink ? authorLink.innerText : 'Unknown Author';

      // Extract content
      const contentEl = article.querySelector('[data-testid="articleContent"]') || article;

      // Remove unwanted elements
      const unwanted = contentEl.querySelectorAll(
        'nav, [role="navigation"], [data-testid="advertisement"], aside, .login-prompt'
      );
      unwanted.forEach(el => el.remove());

      // Get clean HTML
      const html = contentEl.innerHTML;

      // Extract images
      const images = Array.from(contentEl.querySelectorAll('img')).map(img => ({
        src: img.src,
        alt: img.alt || ''
      }));

      return {
        type: 'article',
        title,
        author,
        html,
        images,
        timestamp: new Date().toISOString()
      };
    });
  }

  /**
   * Detect if a post is part of a thread
   */
  async detectThread(page, username) {
    return await page.evaluate((username) => {
      // Look for "Show more replies" or multiple tweets by the same author
      const tweets = document.querySelectorAll('[data-testid="tweet"]');

      if (tweets.length <= 1) {
        return false;
      }

      // Check if there are multiple tweets by the same author in sequence
      let consecutiveSameAuthor = 0;
      for (const tweet of tweets) {
        const userLink = tweet.querySelector('a[href*="/' + username + '"]');
        if (userLink) {
          consecutiveSameAuthor++;
          if (consecutiveSameAuthor >= 2) {
            return true;
          }
        } else {
          consecutiveSameAuthor = 0;
        }
      }

      return false;
    }, username);
  }

  /**
   * Extract single post
   */
  async extractPost(page) {
    return await page.evaluate(() => {
      const tweet = document.querySelector('[data-testid="tweet"]');

      if (!tweet) {
        throw new Error('Tweet content not found');
      }

      // Extract author info
      const authorEl = tweet.querySelector('[data-testid="User-Name"]');
      const author = authorEl ? authorEl.innerText : 'Unknown';

      // Extract timestamp
      const timeEl = tweet.querySelector('time');
      const timestamp = timeEl ? timeEl.getAttribute('datetime') : new Date().toISOString();

      // Extract text content
      const textEl = tweet.querySelector('[data-testid="tweetText"]');
      const text = textEl ? textEl.innerText : '';

      // Extract images
      const images = Array.from(tweet.querySelectorAll('img[src*="media"]')).map(img => ({
        src: img.src,
        alt: img.alt || ''
      }));

      return {
        type: 'post',
        author,
        timestamp,
        text,
        images
      };
    });
  }

  /**
   * Extract thread (multiple posts by same author)
   */
  async extractThread(page, username) {
    return await page.evaluate((username) => {
      const tweets = Array.from(document.querySelectorAll('[data-testid="tweet"]'));

      const threadPosts = [];

      for (const tweet of tweets) {
        // Check if tweet is by the thread author
        const userLink = tweet.querySelector('a[href*="/' + username + '"]');

        if (userLink) {
          // Extract author info
          const authorEl = tweet.querySelector('[data-testid="User-Name"]');
          const author = authorEl ? authorEl.innerText : username;

          // Extract timestamp
          const timeEl = tweet.querySelector('time');
          const timestamp = timeEl ? timeEl.getAttribute('datetime') : new Date().toISOString();

          // Extract text content
          const textEl = tweet.querySelector('[data-testid="tweetText"]');
          const text = textEl ? textEl.innerText : '';

          // Extract images
          const images = Array.from(tweet.querySelectorAll('img[src*="media"]')).map(img => ({
            src: img.src,
            alt: img.alt || ''
          }));

          threadPosts.push({
            author,
            timestamp,
            text,
            images
          });
        }
      }

      return {
        type: 'thread',
        author: username,
        posts: threadPosts,
        postCount: threadPosts.length,
        timestamp: threadPosts[0]?.timestamp || new Date().toISOString()
      };
    }, username);
  }
}

module.exports = ContentRenderer;
