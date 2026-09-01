/**
 * Prism language definition for AdeshLang.
 *
 * To add new keywords or types, edit src/tokens/adeshTokens.js.
 * This file automatically picks up new additions from there.
 */

import {
  KEYWORDS_PATTERN,
  TYPES_PATTERN,
  BUILTIN_FUNCTIONS_PATTERN,
  LITERALS_PATTERN,
} from '../tokens/adeshTokens.js';

function lang() {
  const NUMBER_PATTERN = [
    // Hex: 0xFF, 0xABCD, with optional type suffix
    '0[xX][\\da-fA-F](?:_?[\\da-fA-F])*(?:u(?:8|16|32|64|128)|i(?:8|16|32|64|128))?',
    // Binary: 0b1010, with optional type suffix
    '0[bB][01](?:_?[01])*(?:u(?:8|16|32|64|128)|i(?:8|16|32|64|128))?',
    // Octal: 0o755, with optional type suffix
    '0[oO][0-7](?:_?[0-7])*(?:u(?:8|16|32|64|128)|i(?:8|16|32|64|128))?',
    // Decimal, float, scientific: 42, 3.14, 1e10, with optional type suffix
    '\\d+(?:_?\\d+)*(?:\\.\\d+(?:_?\\d+)*)?(?:[eE][+-]?\\d+(?:_?\\d+)*)?',
    '(?:u(?:8|16|32|64|128)|i(?:8|16|32|64|128)|f(?:32|64)|n)?',
  ].join('');

  return {
    /**
     * Comments – greedy to prevent partial matches inside strings etc.
     */
    comment: [
      { pattern: /\/\/[^\n]*/, greedy: true },
      { pattern: /#(?:[^\n]*)/, greedy: true },
      { pattern: /\/\*\*[\s\S]*?\*\//, greedy: true },
      { pattern: /\/\*[\s\S]*?\*\//, greedy: true },
    ],

    /**
     * Template literals with ${} interpolation.
     */
    'template-string': {
      pattern: /`(?:\\[\s\S]|\$\{(?:[^}]*)\}|[^\\`])*`/,
      greedy: true,
      inside: {
        interpolation: {
          pattern: /\$\{(?:[^}]*)\}/,
          inside: {
            expression: /[\s\S]+/,
          },
        },
      },
    },

    /**
     * Double-quoted strings.
     */
    string: {
      pattern: /"(?:\\[\s\S]|[^\\"])*"/,
      greedy: true,
    },

    /**
     * Single-quoted character literals.
     */
    char: {
      pattern: /'(?:\\[\s\S]|[^\\'])'/,
      greedy: true,
    },

    /**
     * Numeric literals: decimal, hex, binary, octal,
     * float, scientific notation, underscores, type suffixes.
     */
    number: {
      pattern: RegExp(`\\b(?:${NUMBER_PATTERN})\\b`),
      greedy: false,
    },

    /**
     * Language keywords.
     */
    keyword: RegExp(KEYWORDS_PATTERN),

    /**
     * Primitive and built-in type names.
     */
    builtin: RegExp(TYPES_PATTERN),

    /**
     * Function calls: any identifier followed by (.
     */
    function: [
      // Built-in functions
      RegExp(BUILTIN_FUNCTIONS_PATTERN),
      // Any identifier followed by opening paren – function call
      /\b\w+(?=\s*\()/,
    ],

    /**
     * Decorators / annotations: @name
     */
    decorator: {
      pattern: /@\w+/,
      alias: 'annotation',
    },

    /**
     * Boolean, null, and literal constants.
     */
    constant: RegExp(LITERALS_PATTERN),

    /**
     * Operators (multi-char first to take priority).
     */
    operator: {
      pattern: RegExp([
        // Multi-char operators (longest first)
        '\\*\\*=', '<<=', '>>=',
        '\\|\\|=', '\\^=', '/=', '%=', '\\*=', '-=', '\\+=', '&=',
        '!==', '===', '==', '!=',
        '>=', '<=', '=>', '->',
        '&&', '\\|\\|',
        '\\?\\?=', '\\?\\?', '\\?\\.',
        '\\.\\.\\.', '\\.\\.',
        '~\\/',
        '::',
        '<<', '>>',
        '\\+\\+', '--', '\\*\\*',
        // Single-char operators
        '[+\\-*/%!~<>&|^?=]',
      ].join('|')),
      greedy: true,
    },

    /**
     * Punctuation / delimiters.
     */
    punctuation: /[{}()\[\],;:.]/,
  };
}

export const adeshLanguage = lang();
export default adeshLanguage;
