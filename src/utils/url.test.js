const URLUtils = require('./url');

test('?param=abc to equal abc', () => {
    
    expect(URLUtils.getQueryStringParameter('?param=abc', 'param')).toBe('abc');
    
});