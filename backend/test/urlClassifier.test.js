const URLClassifier = require('../src/utils/urlClassifier');

describe('URLClassifier', () => {
  test('normalises twitter status URLs to x.com and strips tracking params', () => {
    const url = URLClassifier.normalize('https://twitter.com/prashi/status/12345?t=abc&s=20&utm_source=test#frag');
    expect(url).toBe('https://x.com/prashi/status/12345?s=20');
  });

  test('adds https protocol when omitted', () => {
    const url = URLClassifier.normalize('x.com/prashi/status/12345');
    expect(url).toBe('https://x.com/prashi/status/12345');
  });

  test('classifies status URL', () => {
    expect(URLClassifier.classify('https://x.com/prashi/status/12345')).toMatchObject({
      type: 'post',
      valid: true,
      username: 'prashi',
      tweetId: '12345'
    });
  });

  test('classifies article URL', () => {
    expect(URLClassifier.classify('https://x.com/i/articles/abc_123')).toMatchObject({
      type: 'article',
      valid: true,
      articleId: 'abc_123'
    });
  });

  test('rejects non-X domains', () => {
    expect(URLClassifier.classify('https://example.com/prashi/status/12345')).toMatchObject({
      valid: false
    });
  });
});
