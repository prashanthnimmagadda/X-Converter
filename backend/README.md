# X Content to PDF Converter - Backend Service

Backend service for converting X (Twitter) content to PDF using dynamic rendering.

## Features

- Dynamic content rendering using Puppeteer
- Support for X articles, posts, and threads
- High-fidelity PDF generation
- Automatic thread detection
- Clean, print-friendly output

## Requirements

- Node.js 18+
- npm or yarn

## Installation

```bash
cd backend
npm install
```

## Configuration

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```
PORT=3000
NODE_ENV=development
TEMP_DIR=./temp
MAX_PROCESSING_TIME=30000
```

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### POST /convert

Convert an X URL to PDF.

**Request:**
```json
{
  "url": "https://x.com/username/status/1234567890"
}
```

**Response:**
- Content-Type: `application/pdf`
- Headers:
  - `Content-Disposition`: filename
  - `X-Processing-Time`: processing time in ms
  - `X-Content-Type`: detected type (article/post/thread)

**Status Codes:**
- 200: Success, returns PDF file
- 400: Invalid URL or request
- 500: Processing error

### POST /validate

Validate an X URL without conversion.

**Request:**
```json
{
  "url": "https://x.com/username/status/1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "classification": {
    "type": "post",
    "valid": true,
    "username": "username",
    "tweetId": "1234567890"
  },
  "normalizedUrl": "https://x.com/username/status/1234567890"
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-16T12:00:00.000Z"
}
```

## Architecture

### URL Classification
- Validates X domain
- Detects content type (article/post/thread)
- Normalizes URLs

### Content Rendering
- Uses Puppeteer for dynamic rendering
- Waits for content to load
- Extracts clean content
- Detects threads automatically

### PDF Generation
- Mobile-optimized layout
- Proper pagination
- Source URL in footer
- Consistent formatting

## Error Handling

The service includes:
- Retry logic for transient failures
- Graceful error messages
- Automatic cleanup of temp files
- Request timeout protection

## Deployment

### Docker (Recommended)

```dockerfile
FROM node:18-alpine

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "src/server.js"]
```

### Environment Variables for Production

```
NODE_ENV=production
PORT=3000
TEMP_DIR=/tmp/x-converter
MAX_PROCESSING_TIME=30000
```

## Performance

- Average processing time: 3-6 seconds
- Concurrent request handling
- Automatic temp file cleanup
- Memory-efficient rendering

## Limitations

- Public content only (no authentication)
- Videos are not embedded
- Very long threads may be truncated
- Rate limiting by X may apply

## Troubleshooting

### Puppeteer Issues

If Puppeteer fails to launch:
1. Install required dependencies (see Dockerfile)
2. Run with `--no-sandbox` flag (already configured)
3. Check Chrome/Chromium installation

### Rendering Timeouts

If content fails to render:
1. Check URL accessibility
2. Increase `MAX_PROCESSING_TIME`
3. Check network connectivity

## License

MIT
