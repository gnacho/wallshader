import { expect, test } from 'bun:test';
import { _, N_, ngettext, pgettext, format } from '../src/translation.js';
import {
  createPreset,
  addFavorite,
  recordRecent,
  normalizeState,
} from '../src/catalog.js';

test('shared translation helpers work without GJS in Bun and the renderer', () => {
  expect(_('Save')).toBe('Save');
  expect(N_('Original')).toBe('Original');
  expect(pgettext('button', 'Save')).toBe('Save');
  expect(ngettext('one frame', 'many frames', 1)).toBe('one frame');
  expect(ngettext('one frame', 'many frames', 0)).toBe('many frames');
});

test('named placeholders can be reordered and user text is substituted once', () => {
  expect(format('{second} / {first}', { first: 'a', second: 'b' })).toBe(
    'b / a',
  );
  expect(format('Saved “{name}”', { name: '{name} $& <b>Ω</b>' })).toBe(
    'Saved “{name} $& <b>Ω</b>”',
  );
});

test('collection entries retain whether a name is application text or user text', () => {
  const preset = createPreset('aurora');
  const builtin = addFavorite([], preset, 'Original', true);
  const user = recordRecent([], preset, 'Custom', 'desktop');
  const state = normalizeState({
    version: 3,
    favorites: builtin,
    recent: user,
  });
  expect(state.favorites[0].builtinName).toBe(true);
  expect(state.favorites[0].name).toBe('Original');
  expect(state.recent[0].builtinName).toBeUndefined();
  expect(state.recent[0].name).toBe('Custom');
  expect(
    normalizeState({
      version: 3,
      favorites: [{ ...builtin[0], builtinName: 'true' }],
    }).favorites[0].builtinName,
  ).toBeUndefined();
});
