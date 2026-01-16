/**
 * X Content to PDF Converter - Backend Server
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const URLClassifier = require('./utils/urlClassifier');
const ContentRenderer = require('./renderer/contentRenderer');
const PDFGenerator = require('./pdf/pdfGenerator');

const app = express();
const PORT = process.env.PORT || 3000;
const TEMP_DIR = process.env.TEMP_DIR || './temp';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize temp directory
async function initTempDir() {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create temp directory:', error);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Main conversion endpoint
 * POST /convert
 * Body: { url: string }
 */
app.post('/convert', async (req, res) => {
  const startTime = Date.now();
  let tempFilePath = null;

  try {
    const { url } = req.body;

    // Validate URL
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    console.log(`[${new Date().toISOString()}] Converting URL: ${url}`);

    // Step 1: Classify URL
    const normalizedUrl = URLClassifier.normalize(url);
    const classification = URLClassifier.classify(normalizedUrl);

    if (!classification.valid) {
      return res.status(400).json({
        success: false,
        error: classification.error || 'Invalid URL'
      });
    }

    console.log(`  Classification: ${classification.type}`);

    // Step 2: Render content
    const renderer = new ContentRenderer();
    let renderResult;

    try {
      renderResult = await renderer.render(normalizedUrl, classification);
    } catch (error) {
      console.error('  Rendering error:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to render content',
        details: error.message
      });
    } finally {
      await renderer.close();
    }

    if (!renderResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to render content'
      });
    }

    console.log(`  Content rendered: ${renderResult.classification.type}`);

    // Step 3: Generate PDF
    const pdfGenerator = new PDFGenerator();
    tempFilePath = path.join(TEMP_DIR, `${uuidv4()}.pdf`);

    let pdfResult;

    try {
      pdfResult = await pdfGenerator.generate(
        renderResult.content,
        normalizedUrl,
        tempFilePath
      );
    } catch (error) {
      console.error('  PDF generation error:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to generate PDF',
        details: error.message
      });
    } finally {
      await pdfGenerator.close();
    }

    // Step 4: Send PDF
    const processingTime = Date.now() - startTime;
    console.log(`  PDF generated in ${processingTime}ms: ${pdfResult.filename}`);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pdfResult.filename}"`);
    res.setHeader('X-Processing-Time', processingTime);
    res.setHeader('X-Content-Type', renderResult.classification.type);

    // Send file
    res.sendFile(path.resolve(tempFilePath), async (err) => {
      // Clean up temp file after sending
      try {
        await fs.unlink(tempFilePath);
      } catch (cleanupError) {
        console.error('  Failed to clean up temp file:', cleanupError);
      }

      if (err && !res.headersSent) {
        console.error('  Failed to send PDF:', err);
        res.status(500).json({
          success: false,
          error: 'Failed to send PDF'
        });
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);

    // Clean up temp file on error
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }
});

/**
 * Validation endpoint (for quick URL check without conversion)
 * POST /validate
 * Body: { url: string }
 */
app.post('/validate', (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    const normalizedUrl = URLClassifier.normalize(url);
    const classification = URLClassifier.classify(normalizedUrl);

    res.json({
      success: classification.valid,
      classification,
      normalizedUrl
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Validation failed',
      details: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
async function start() {
  await initTempDir();

  app.listen(PORT, () => {
    console.log(`X Content to PDF Converter Backend`);
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`\nEndpoints:`);
    console.log(`  POST /convert   - Convert X URL to PDF`);
    console.log(`  POST /validate  - Validate X URL`);
  });
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

start().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
