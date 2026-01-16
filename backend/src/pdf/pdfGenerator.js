/**
 * PDF Generator for X content
 * Converts rendered content into high-fidelity PDF documents
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class PDFGenerator {
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
          '--disable-dev-shm-usage'
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
   * Generate PDF from content
   * @param {Object} content - Rendered content object
   * @param {string} sourceUrl - Original source URL
   * @param {string} outputPath - Path to save PDF
   * @returns {Object} - PDF generation result
   */
  async generate(content, sourceUrl, outputPath) {
    await this.init();

    const page = await this.browser.newPage();

    try {
      // Generate HTML based on content type
      let html;
      if (content.type === 'article') {
        html = this.generateArticleHTML(content, sourceUrl);
      } else if (content.type === 'thread') {
        html = this.generateThreadHTML(content, sourceUrl);
      } else {
        html = this.generatePostHTML(content, sourceUrl);
      }

      // Set page content
      await page.setContent(html, {
        waitUntil: 'networkidle0'
      });

      // Generate PDF
      await page.pdf({
        path: outputPath,
        format: 'A4',
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: `
          <div style="font-size: 8px; text-align: center; width: 100%; color: #666; padding: 0 15mm;">
            <span>Source: ${sourceUrl}</span> |
            <span class="pageNumber"></span>/<span class="totalPages"></span>
          </div>
        `
      });

      await page.close();

      // Generate filename
      const filename = this.generateFilename(content);

      return {
        success: true,
        path: outputPath,
        filename,
        size: (await fs.stat(outputPath)).size
      };
    } catch (error) {
      await page.close();
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  /**
   * Generate HTML for article content
   */
  generateArticleHTML(content, sourceUrl) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${this.escapeHtml(content.title)}</title>
  <style>
    ${this.getBaseStyles()}
    h1 {
      font-size: 28px;
      margin-bottom: 10px;
      line-height: 1.3;
    }
    .author {
      font-size: 14px;
      color: #666;
      margin-bottom: 20px;
    }
    .content {
      font-size: 16px;
      line-height: 1.6;
    }
    .content img {
      max-width: 100%;
      height: auto;
      margin: 20px 0;
      border-radius: 8px;
    }
    .content h2 {
      font-size: 22px;
      margin-top: 30px;
      margin-bottom: 15px;
    }
    .content h3 {
      font-size: 18px;
      margin-top: 25px;
      margin-bottom: 12px;
    }
    .content p {
      margin-bottom: 15px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${this.escapeHtml(content.title)}</h1>
    <div class="author">By ${this.escapeHtml(content.author)}</div>
    <div class="date">${this.formatDate(content.timestamp)}</div>
  </div>

  <div class="content">
    ${content.html}
  </div>

  <div class="footer">
    <p>Original source: <a href="${sourceUrl}">${sourceUrl}</a></p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate HTML for thread content
   */
  generateThreadHTML(content, sourceUrl) {
    const postsHTML = content.posts.map((post, index) => `
      <div class="tweet ${index === 0 ? 'first-tweet' : ''}">
        <div class="tweet-header">
          <div class="tweet-author">${this.escapeHtml(post.author)}</div>
          <div class="tweet-date">${this.formatDate(post.timestamp)}</div>
        </div>
        <div class="tweet-text">${this.escapeHtml(post.text)}</div>
        ${post.images.length > 0 ? `
          <div class="tweet-images">
            ${post.images.map(img => `
              <img src="${img.src}" alt="${this.escapeHtml(img.alt)}">
            `).join('')}
          </div>
        ` : ''}
      </div>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Thread by ${this.escapeHtml(content.author)}</title>
  <style>
    ${this.getBaseStyles()}
    .thread-header {
      margin-bottom: 30px;
    }
    .thread-title {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .thread-info {
      font-size: 14px;
      color: #666;
    }
    .tweet {
      margin-bottom: 20px;
      padding: 15px;
      border: 1px solid #e1e8ed;
      border-radius: 12px;
      background: #ffffff;
    }
    .tweet.first-tweet {
      border-color: #1da1f2;
      border-width: 2px;
    }
    .tweet-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .tweet-author {
      font-weight: bold;
      font-size: 15px;
    }
    .tweet-date {
      font-size: 13px;
      color: #666;
    }
    .tweet-text {
      font-size: 16px;
      line-height: 1.5;
      margin-bottom: 10px;
      white-space: pre-wrap;
    }
    .tweet-images {
      margin-top: 10px;
    }
    .tweet-images img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <div class="thread-header">
    <div class="thread-title">Thread by ${this.escapeHtml(content.author)}</div>
    <div class="thread-info">${content.postCount} posts · ${this.formatDate(content.timestamp)}</div>
  </div>

  <div class="thread-content">
    ${postsHTML}
  </div>

  <div class="footer">
    <p>Original source: <a href="${sourceUrl}">${sourceUrl}</a></p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate HTML for single post content
   */
  generatePostHTML(content, sourceUrl) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Post by ${this.escapeHtml(content.author)}</title>
  <style>
    ${this.getBaseStyles()}
    .post {
      padding: 20px;
      border: 1px solid #e1e8ed;
      border-radius: 12px;
      background: #ffffff;
    }
    .post-header {
      margin-bottom: 15px;
    }
    .post-author {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .post-date {
      font-size: 14px;
      color: #666;
    }
    .post-text {
      font-size: 16px;
      line-height: 1.5;
      margin-bottom: 15px;
      white-space: pre-wrap;
    }
    .post-images img {
      max-width: 100%;
      height: auto;
      border-radius: 12px;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <div class="post">
    <div class="post-header">
      <div class="post-author">${this.escapeHtml(content.author)}</div>
      <div class="post-date">${this.formatDate(content.timestamp)}</div>
    </div>

    <div class="post-text">${this.escapeHtml(content.text)}</div>

    ${content.images.length > 0 ? `
      <div class="post-images">
        ${content.images.map(img => `
          <img src="${img.src}" alt="${this.escapeHtml(img.alt)}">
        `).join('')}
      </div>
    ` : ''}
  </div>

  <div class="footer">
    <p>Original source: <a href="${sourceUrl}">${sourceUrl}</a></p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Get base CSS styles
   */
  getBaseStyles() {
    return `
      * {
        box-sizing: border-box;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        color: #14171a;
        background: #ffffff;
      }
      a {
        color: #1da1f2;
        text-decoration: none;
      }
      .header {
        margin-bottom: 30px;
      }
      .date {
        font-size: 14px;
        color: #666;
        margin-top: 5px;
      }
      .footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #e1e8ed;
        font-size: 12px;
        color: #666;
      }
    `;
  }

  /**
   * Generate filename from content
   */
  generateFilename(content) {
    const timestamp = new Date().toISOString().split('T')[0];

    if (content.type === 'article') {
      const title = content.title
        .substring(0, 50)
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase();
      return `article_${title}_${timestamp}.pdf`;
    } else if (content.type === 'thread') {
      const author = content.author.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      return `thread_${author}_${content.postCount}_${timestamp}.pdf`;
    } else {
      const author = content.author.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      return `post_${author}_${timestamp}.pdf`;
    }
  }

  /**
   * Format date for display
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Escape HTML special characters
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}

module.exports = PDFGenerator;
