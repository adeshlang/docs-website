/**
 * Client module that registers the custom AdeshLang Prism language definition.
 *
 * This file is loaded via a Docusaurus plugin's `getClientModules` hook,
 * ensuring the language is available before any code blocks are rendered.
 */

import { Prism } from 'prism-react-renderer';
import { adeshLanguage } from './adeshLang.js';

if (typeof Prism !== 'undefined') {
  Prism.languages.adesh = adeshLanguage;
}
