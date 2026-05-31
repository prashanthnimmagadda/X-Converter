/**
 * X Content to PDF Converter - Backend Server
 */

const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

const URLClassifier = require('./utils/urlClassifier');
const ContentRenderer = require('./renderer/contentRenderer');
const PDFGenerator = require('./pdf/pdfGenerator');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const TEMP_DIR = path.resolve(process.env.TEMP_DIR || './temp');

app.use(cors());
app.use(express.json({ limit: '32kb' }));
app.use(express.urlencoded({ extended: true, limit: '32kb' }));

async function initTempDir() {
  await fs.mkdir(TEMP_DIR, { recursive: true });
}

function parseUrlFromBody(body) {
  if (!body || typeof body.url !== 'string') {
    return null;
  }

  const url = body.url.trim();
  return url.length > 0 && url.length <= 2048 ? url : null;
}

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'x-converter-backend',
    timestamp: new Date().toISOString()
  });
});

app.post('/convert', async (req, res) => {
  const startTime = Date.now();
  let tempFilePath = null;

  try {
    const url = parseUrlFromBody(req.body);

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'A non-empty URL string is required'
      });
    }

    console.log(`[${new Date().toISOString()}] Converting URL: ${url}`);

    const normalizedUrl = URLClassifier.normalize(url);
    const classification = URLClassifier.classify(normalizedUrl);

    if (!classification.valid) {
      return res.status(400).json({
        success: false,
        error: classification.error || 'Invalid X/Twitter URL'
      });
    }

    const renderer = new ContentRenderer();
    let renderResult;

    try {
      renderResult = await renderer.render(normalizedUrl, classification);
    } finally {
      await renderer.close();
    }

    if (!renderResult?.success || !renderResult.content) {
      return res.status(502).json({
        success: false,
        error: 'Failed to render content from X/Twitter'
      });
    }

    const pdfGenerator = new PDFGenerator();
    tempFilePath = path.join(TEMP_DIR, `${crypto.randomUUID()}.pdf`);
    let pdfResult;

    try {
      pdfResult = await pdfGenerator.generate(renderResult.content, normalizedUrl, tempFilePath);
    } finally {
      await pdfGenerator.close();
    }

    const processingTime = Date.now() - startTime;
    console.log(`  PDF generated in ${processingTime}ms: ${pdfResult.filename}`);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pdfResult.filename}"`);
    res.setHeader('X-Processing-Time', String(processingTime));
    res.setHeader('X-Content-Type', renderResult.classification.type);

    return res.sendFile(path.resolve(tempFilePath), async (err) => {
      try {
        await fs.unlink(tempFilePath);
      } catch (cleanupError) {
        if (cleanupError.code !== 'ENOENT') {
          console.error('Failed to clean up temp PDF:', cleanupError);
        }
      }

      if (err) {
        console.error('Failed to send PDF:', err);
      }
    });
  } catch (error) {
    console.error('Conversion failed:', error);

    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
      } catch (_) {
        // Ignore cleanup errors after a failed conversion.
      }
    }

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: 'Conversion failed',
        details: error.message
      });
    }
  }
});

app.post('/validate', (req, res) => {
  try {
    const url = parseUrlFromBody(req.body);

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'A non-empty URL string is required'
      });
    }

    const normalizedUrl = URLClassifier.normalize(url);
    const classification = URLClassifier.classify(normalizedUrl);

    return res.status(classification.valid ? 200 : 400).json({
      success: classification.valid,
      classification,
      normalizedUrl
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Validation failed',
      details: error.message
    });
  }
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (!res.headersSent) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

async function start() {
  await initTempDir();

  const server = app.listen(PORT, () => {
    console.log('X Content to PDF Converter Backend');
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log('\nEndpoints:');
    console.log('  POST /convert   - Convert X/Twitter URL to PDF');
    console.log('  POST /validate  - Validate X/Twitter URL');
  });

  return server;
}

if (require.main === module) {
  let server;

  start()
    .then((startedServer) => {
      server = startedServer;
    })
    .catch((error) => {
      console.error('Failed to start server:', error);
      process.exit(1);
    });

  const shutdown = (signal) => {
    console.log(`Received ${signal}, shutting down gracefully...`);
    if (!server) {
      process.exit(0);
    }
    server.close(() => process.exit(0));
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = { app, start, initTempDir, parseUrlFromBody };
