/**
 * PDF Generator for X/Twitter content.
 */

const fs = require('fs').promises;
const path = require('path');

async function loadPuppeteer() {
  const module = await import('puppeteer');
  return module.default || module;
}

class PDFGenerator {
  constructor() {
    this.browser = null;
  }

  async init() {
    if (!this.browser) {
      const puppeteer = await loadPuppeteer();
      this.browser = await puppeteer.launch({
        headless: 'new',
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ]
      });
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async generate(content, sourceUrl, outputPath) {
    await this.init();
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    const page = await this.browser.newPage();

    try {
      const html = content.type === 'article'
        ? this.generateArticleHTML(content, sourceUrl)
        : content.type === 'thread'
          ? this.generateThreadHTML(content, sourceUrl)
          : this.generatePostHTML(content, sourceUrl);

      await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

      await page.pdf({
        path: outputPath,
        format: 'A4',
        margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: `
          <div style="font-size: 8px; text-align: center; width: 100%; color: #666; padding: 0 15mm;">
            <span>Source: ${this.escapeHtml(sourceUrl)}</span> |
            <span class="pageNumber"></span>/<span class="totalPages"></span>
          </div>
        `
      });

      const filename = this.generateFilename(content);
      return {
        success: true,
        path: outputPath,
        filename,
        size: (await fs.stat(outputPath)).size
      };
    } catch (error) {
      throw new Error(`PDF generation failed: ${error.message}`);
    } finally {
      await page.close().catch(() => {});
    }
  }

  generateArticleHTML(content, sourceUrl) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${this.escapeHtml(content.title || 'X Article')}</title>
  <style>
    ${this.getBaseStyles()}
    h1 { font-size: 28px; margin-bottom: 10px; line-height: 1.3; }
    .author { font-size: 14px; color: #666; margin-bottom: 20px; }
    .content { font-size: 16px; line-height: 1.6; }
    .content img { max-width: 100%; height: auto; margin: 20px 0; border-radius: 8px; }
    .content h2 { font-size: 22px; margin-top: 30px; margin-bottom: 15px; }
    .content h3 { font-size: 18px; margin-top: 25px; margin-bottom: 12px; }
    .content p { margin-bottom: 15px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${this.escapeHtml(content.title || 'X Article')}</h1>
    <div class="author">By ${this.escapeHtml(content.author || 'Unknown Author')}</div>
    <div class="date">${this.formatDate(content.timestamp)}</div>
  </div>
  <div class="content">${content.html || ''}</div>
  ${this.sourceFooter(sourceUrl)}
</body>
</html>`;
  }

  generateThreadHTML(content, sourceUrl) {
    const posts = Array.isArray(content.posts) ? content.posts : [];
    const postsHTML = posts.map((post, index) => `
      <div class="tweet ${index === 0 ? 'first-tweet' : ''}">
        <div class="tweet-header">
          <div class="tweet-author">${this.escapeHtml(post.author || content.author || 'Unknown')}</div>
          <div class="tweet-date">${this.formatDate(post.timestamp)}</div>
        </div>
        <div class="tweet-text">${this.escapeHtml(post.text || '')}</div>
        ${this.imagesHTML(post.images, 'tweet-images')}
      </div>`).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Thread by ${this.escapeHtml(content.author || 'Unknown')}</title>
  <style>
    ${this.getBaseStyles()}
    .thread-header { margin-bottom: 30px; }
    .thread-title { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
    .thread-info { font-size: 14px; color: #666; }
    .tweet { margin-bottom: 20px; padding: 15px; border: 1px solid #e1e8ed; border-radius: 12px; background: #fff; }
    .tweet.first-tweet { border-color: #1da1f2; border-width: 2px; }
    .tweet-header { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 10px; }
    .tweet-author { font-weight: bold; font-size: 15px; }
    .tweet-date { font-size: 13px; color: #666; white-space: nowrap; }
    .tweet-text { font-size: 16px; line-height: 1.5; margin-bottom: 10px; white-space: pre-wrap; }
    .tweet-images { margin-top: 10px; }
    .tweet-images img { max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="thread-header">
    <div class="thread-title">Thread by ${this.escapeHtml(content.author || 'Unknown')}</div>
    <div class="thread-info">${posts.length} posts · ${this.formatDate(content.timestamp)}</div>
  </div>
  <div class="thread-content">${postsHTML}</div>
  ${this.sourceFooter(sourceUrl)}
</body>
</html>`;
  }

  generatePostHTML(content, sourceUrl) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Post by ${this.escapeHtml(content.author || 'Unknown')}</title>
  <style>
    ${this.getBaseStyles()}
    .post { padding: 20px; border: 1px solid #e1e8ed; border-radius: 12px; background: #fff; }
    .post-header { margin-bottom: 15px; }
    .post-author { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
    .post-date { font-size: 14px; color: #666; }
    .post-text { font-size: 16px; line-height: 1.5; margin-bottom: 15px; white-space: pre-wrap; }
    .post-images img { max-width: 100%; height: auto; border-radius: 12px; margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="post">
    <div class="post-header">
      <div class="post-author">${this.escapeHtml(content.author || 'Unknown')}</div>
      <div class="post-date">${this.formatDate(content.timestamp)}</div>
    </div>
    <div class="post-text">${this.escapeHtml(content.text || '')}</div>
    ${this.imagesHTML(content.images, 'post-images')}
  </div>
  ${this.sourceFooter(sourceUrl)}
</body>
</html>`;
  }

  imagesHTML(images, className) {
    if (!Array.isArray(images) || images.length === 0) return '';
    return `<div class="${className}">${images.map(img => {
      const src = this.escapeAttribute(img.src || '');
      const alt = this.escapeAttribute(img.alt || '');
      return src ? `<img src="${src}" alt="${alt}">` : '';
    }).join('')}</div>`;
  }

  sourceFooter(sourceUrl) {
    const safeUrl = this.escapeAttribute(sourceUrl || '');
    return `<div class="footer"><p>Original source: <a href="${safeUrl}">${this.escapeHtml(sourceUrl || '')}</a></p></div>`;
  }

  getBaseStyles() {
    return `
      * { box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        color: #14171a;
        background: #fff;
      }
      a { color: #1da1f2; text-decoration: none; word-break: break-word; }
      .header { margin-bottom: 30px; }
      .date { font-size: 14px; color: #666; margin-top: 5px; }
      .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e1e8ed; font-size: 12px; color: #666; }
    `;
  }

  generateFilename(content) {
    const timestamp = new Date().toISOString().split('T')[0];

    if (content.type === 'article') {
      const title = this.slug(content.title || 'untitled_article', 50);
      return `article_${title}_${timestamp}.pdf`;
    }

    if (content.type === 'thread') {
      const author = this.slug(content.author || 'unknown', 30);
      const count = Number(content.postCount || (Array.isArray(content.posts) ? content.posts.length : 0));
      return `thread_${author}_${count}_${timestamp}.pdf`;
    }

    const author = this.slug(content.author || 'unknown', 30);
    return `post_${author}_${timestamp}.pdf`;
  }

  slug(value, maxLength) {
    const slug = String(value)
      .substring(0, maxLength)
      .replace(/[^a-z0-9]+/gi, '_')
      .replace(/^_+|_+$/g, '')
      .toLowerCase();
    return slug || 'untitled';
  }

  formatDate(dateString) {
    const date = new Date(dateString || Date.now());
    if (Number.isNaN(date.getTime())) {
      return 'Unknown date';
    }
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text ?? '').replace(/[&<>"']/g, m => map[m]);
  }

  escapeAttribute(text) {
    return this.escapeHtml(text).replace(/`/g, '&#096;');
  }
}

module.exports = PDFGenerator;
