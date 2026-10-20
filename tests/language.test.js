import { expect, test } from 'bun:test';
import { normalizeLanguage, languageName } from '../src/language.js';
import { normalizeState } from '../src/catalog.js';

test('language preferences survive state normalization without changing shader data', () => {
  expect(normalizeState().language).toBe('');
  for (const code of ['en', 'es', 'pt_BR', 'zh_TW', 'sr@latin'])
    expect(normalizeState({ language: code }).language).toBe(code);
  for (const value of [null, 42, '../es', 'es:en', 'es.UTF-8', ''])
    expect(normalizeLanguage(value)).toBe('');
});

test('language choices use their own names so they remain recognizable', () => {
  expect(languageName('en')).toBe('English');
  expect(languageName('es')).toBe('Español');
  expect(languageName('fr')).toBe('Français');
  expect(languageName('de')).toBe('Deutsch');
  expect(languageName('ja')).toBe('日本語');
  expect(languageName('ko')).toBe('한국어');
  expect(languageName('pt_BR')).toBe('Português (Brasil)');
  expect(languageName('zh_CN')).toBe('简体中文');
  expect(languageName('zh_TW')).toBe('繁體中文');
});
