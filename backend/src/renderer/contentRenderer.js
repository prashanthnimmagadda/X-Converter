/**
 * Content Renderer for X/Twitter content.
 * Uses Puppeteer to render dynamic public pages and extract PDF-ready content.
 */

const DEFAULT_TIMEOUT = Number(process.env.MAX_PROCESSING_TIME || 30000);

async function loadPuppeteer() {
  const module = await import('puppeteer');
  return module.default || module;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class ContentRenderer {
  constructor() {
    this.browser = null;
  }

  async init() {
    if (!this.browser) {
      const puppeteer = await loadPuppeteer();
      const launchOptions = {
        headless: 'new',
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        protocolTimeout: DEFAULT_TIMEOUT + 10000,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--disable-features=IsolateOrigins,site-per-process'
        ]
      };

      this.browser = await puppeteer.launch(launchOptions);
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async render(url, classification) {
    await this.init();
    const page = await this.browser.newPage();

    try {
      await page.setDefaultTimeout(DEFAULT_TIMEOUT);
      await page.setDefaultNavigationTimeout(DEFAULT_TIMEOUT);
      await page.setViewport({ width: 900, height: 1400, deviceScaleFactor: 2 });
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0 Safari/537.36'
      );
      await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-GB,en;q=0.9' });

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: DEFAULT_TIMEOUT });
      await this.waitForContent(page, classification.type);

      let content;
      if (classification.type === 'article') {
        content = await this.extractArticle(page);
      } else if (classification.type === 'post') {
        const isThread = await this.detectThread(page, classification.username);
        if (isThread) {
          content = await this.extractThread(page, classification.username);
          content.isThread = true;
        } else {
          content = await this.extractPost(page);
          content.isThread = false;
        }
      }

      if (!content) {
        throw new Error('No extractable content found');
      }

      return {
        success: true,
        content,
        classification: {
          ...classification,
          type: content.isThread ? 'thread' : classification.type
        }
      };
    } catch (error) {
      const pageText = await page.evaluate(() => document.body?.innerText?.slice(0, 500) || '').catch(() => '');
      const loginWall = /log in|sign in|create account|something went wrong/i.test(pageText);
      const suffix = loginWall
        ? ' Public X/Twitter pages may be behind a login or anti-bot wall; deploy with a reachable Chromium runtime and try a public URL.'
        : '';
      throw new Error(`Rendering failed: ${error.message}.${suffix}`);
    } finally {
      await page.close().catch(() => {});
    }
  }

  async waitForContent(page, type) {
    const selectors = type === 'article'
      ? ['article', '[data-testid="article"]', '[data-testid="articleContent"]']
      : ['[data-testid="tweet"]', 'article'];

    await Promise.race([
      Promise.any(selectors.map(selector => page.waitForSelector(selector, { timeout: 15000 }))).catch(() => null),
      delay(15000)
    ]);

    await delay(1500);
  }

  async extractArticle(page) {
    return await page.evaluate(() => {
      const article = document.querySelector('[data-testid="articleContent"]')?.closest('article') || document.querySelector('article');

      if (!article) {
        throw new Error('Article content not found');
      }

      const clone = article.cloneNode(true);
      clone.querySelectorAll('nav, [role="navigation"], [data-testid="advertisement"], aside, button, svg').forEach(el => el.remove());

      const titleEl = clone.querySelector('h1') || clone.querySelector('[role="heading"]');
      const title = titleEl ? titleEl.innerText.trim() : 'Untitled Article';
      const authorEl = clone.querySelector('[data-testid="User-Name"]') || clone.querySelector('a[href^="/"]');
      const author = authorEl ? authorEl.innerText.trim() : 'Unknown Author';
      const contentEl = clone.querySelector('[data-testid="articleContent"]') || clone;
      const images = Array.from(contentEl.querySelectorAll('img')).map(img => ({ src: img.src, alt: img.alt || '' }));

      return {
        type: 'article',
        title,
        author,
        html: contentEl.innerHTML,
        images,
        timestamp: new Date().toISOString()
      };
    });
  }

  async detectThread(page, username) {
    return await page.evaluate((username) => {
      const tweets = Array.from(document.querySelectorAll('[data-testid="tweet"], article'));
      if (tweets.length <= 1) return false;

      let sameAuthorCount = 0;
      const authorHref = `/${String(username).toLowerCase()}`;
      for (const tweet of tweets) {
        const links = Array.from(tweet.querySelectorAll('a[href]'));
        const byAuthor = links.some(link => (link.getAttribute('href') || '').toLowerCase().startsWith(authorHref));
        if (byAuthor) {
          sameAuthorCount += 1;
          if (sameAuthorCount >= 2) return true;
        }
      }
      return false;
    }, username);
  }

  async extractPost(page) {
    return await page.evaluate(() => {
      const tweet = document.querySelector('[data-testid="tweet"]') || document.querySelector('article');

      if (!tweet) {
        throw new Error('Tweet content not found');
      }

      const authorEl = tweet.querySelector('[data-testid="User-Name"]');
      const author = authorEl ? authorEl.innerText.trim() : 'Unknown';
      const timeEl = tweet.querySelector('time');
      const timestamp = timeEl ? timeEl.getAttribute('datetime') : new Date().toISOString();
      const textEl = tweet.querySelector('[data-testid="tweetText"]');
      const text = textEl ? textEl.innerText.trim() : tweet.innerText.trim();
      const images = Array.from(tweet.querySelectorAll('img[src*="media"], img[src*="twimg"]'))
        .filter(img => !/profile_images/.test(img.src))
        .map(img => ({ src: img.src, alt: img.alt || '' }));

      if (!text && images.length === 0) {
        throw new Error('Tweet content was empty');
      }

      return { type: 'post', author, timestamp, text, images };
    });
  }

  async extractThread(page, username) {
    return await page.evaluate((username) => {
      const tweets = Array.from(document.querySelectorAll('[data-testid="tweet"], article'));
      const threadPosts = [];
      const authorHref = `/${String(username).toLowerCase()}`;

      for (const tweet of tweets) {
        const links = Array.from(tweet.querySelectorAll('a[href]'));
        const byAuthor = links.some(link => (link.getAttribute('href') || '').toLowerCase().startsWith(authorHref));

        if (byAuthor) {
          const authorEl = tweet.querySelector('[data-testid="User-Name"]');
          const author = authorEl ? authorEl.innerText.trim() : username;
          const timeEl = tweet.querySelector('time');
          const timestamp = timeEl ? timeEl.getAttribute('datetime') : new Date().toISOString();
          const textEl = tweet.querySelector('[data-testid="tweetText"]');
          const text = textEl ? textEl.innerText.trim() : tweet.innerText.trim();
          const images = Array.from(tweet.querySelectorAll('img[src*="media"], img[src*="twimg"]'))
            .filter(img => !/profile_images/.test(img.src))
            .map(img => ({ src: img.src, alt: img.alt || '' }));

          if (text || images.length) {
            threadPosts.push({ author, timestamp, text, images });
          }
        }
      }

      if (threadPosts.length === 0) {
        throw new Error('Thread content not found');
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
