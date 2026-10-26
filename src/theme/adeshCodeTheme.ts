import type { PrismTheme } from 'prism-react-renderer';

/**
 * Single dark syntax theme for the whole site so code surfaces stay stable
 * across light/dark color modes (Material "inverse" code surface).
 */
export const adeshCodeTheme: PrismTheme = {
  plain: {
    color: '#dce6df',
    backgroundColor: '#101713',
  },
  styles: [
    {
      types: ['comment', 'prolog', 'doctype', 'cdata'],
      style: { color: '#7e9488', fontStyle: 'italic' },
    },
    {
      types: ['punctuation'],
      style: { color: '#a7b9ae' },
    },
    {
      types: ['property', 'tag', 'constant', 'symbol', 'deleted'],
      style: { color: '#ffb4ab' },
    },
    {
      types: ['boolean', 'number'],
      style: { color: '#ffd48a' },
    },
    {
      types: ['selector', 'attr-name', 'char', 'builtin', 'inserted'],
      style: { color: '#9ff5c9' },
    },
    {
      types: ['string'],
      style: { color: '#8fe3b0' },
    },
    {
      types: ['operator', 'entity', 'url'],
      style: { color: '#9fd7e8' },
    },
    {
      types: ['atrule', 'attr-value', 'keyword'],
      style: { color: '#7ee2c0', fontWeight: '500' },
    },
    {
      types: ['function', 'class-name'],
      style: { color: '#b8d4ff' },
    },
    {
      types: ['regex', 'important', 'variable'],
      style: { color: '#f0b6ff' },
    },
  ],
};
