const request = require('supertest');
const { app, parseUrlFromBody } = require('../src/server');

describe('server', () => {
  test('GET /health returns service status', async () => {
    const response = await request(app).get('/health').expect(200);
    expect(response.body).toMatchObject({ status: 'ok', service: 'x-converter-backend' });
    expect(response.body.timestamp).toBeTruthy();
  });

  test('POST /validate validates X status URLs', async () => {
    const response = await request(app)
      .post('/validate')
      .send({ url: 'https://twitter.com/prashi/status/12345?utm_source=noise' })
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      normalizedUrl: 'https://x.com/prashi/status/12345',
      classification: { type: 'post', valid: true, username: 'prashi', tweetId: '12345' }
    });
  });

  test('POST /validate rejects missing URLs', async () => {
    const response = await request(app).post('/validate').send({}).expect(400);
    expect(response.body.success).toBe(false);
  });

  test('parseUrlFromBody trims strings and rejects empty values', () => {
    expect(parseUrlFromBody({ url: '  https://x.com/a/status/1  ' })).toBe('https://x.com/a/status/1');
    expect(parseUrlFromBody({ url: '   ' })).toBeNull();
    expect(parseUrlFromBody({ url: 123 })).toBeNull();
  });
});
