const PDFGenerator = require('../src/pdf/pdfGenerator');

describe('PDFGenerator helpers', () => {
  const generator = new PDFGenerator();

  test('escapes HTML safely', () => {
    expect(generator.escapeHtml('<script>alert("x")</script>')).toBe('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
  });

  test('generates deterministic safe filenames', () => {
    expect(generator.generateFilename({ type: 'post', author: 'Prashi / Test' })).toMatch(/^post_prashi_test_\d{4}-\d{2}-\d{2}\.pdf$/);
    expect(generator.generateFilename({ type: 'thread', author: 'A&B', postCount: 3 })).toMatch(/^thread_a_b_3_\d{4}-\d{2}-\d{2}\.pdf$/);
  });

  test('formats invalid dates without throwing', () => {
    expect(generator.formatDate('not-a-date')).toBe('Unknown date');
  });
});
