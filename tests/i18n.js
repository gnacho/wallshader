import { localeExpectation } from './i18n-expectations.js';

const source =
  ARGV[1] === 'extension'
    ? '../build/extension/app/src/'
    : (ARGV[1] ?? '../src/');
const { _, ngettext, pgettext, format } = await import(`${source}i18n.js`);
const { createPreset, filterPresets, paperParams } = await import(
  `${source}catalog.js`
);
// Sharing is app-only; the renderer's shared catalog must still stay canonical.
const { exportSettings, parseSettings } = await import('../src/sharing.js');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const expected = localeExpectation(ARGV[0]);
assert(
  _('Save') === expected.save &&
    _('Preferences') === expected.preferences &&
    _('System Default') === expected.system,
  'Gettext locale or fallback failed',
);
assert(
  _('A missing translation') === 'A missing translation',
  'Missing message fallback failed',
);
assert(
  pgettext('button', 'Save') === 'Save',
  'Missing context fallback failed',
);
assert(ngettext('one', 'many', 2) === 'many', 'Plural fallback failed');
for (const count of [0, 1, 2, 5, 11, 101]) {
  const singular =
    count === 1 || (['fr', 'pt_BR'].includes(ARGV[0]) && count === 0);
  assert(
    format(
      ngettext(
        '{interval} / {count} frame observed',
        '{interval} / {count} frames observed',
        count,
      ),
      { interval: '16 ms', count },
    ) ===
      format(singular ? expected.one : expected.many, {
        interval: '16 ms',
        count,
      }),
    `Translated plural lookup failed for ${count}`,
  );
}
assert(
  format(_('{name} set as wallpaper'), { name: 'Ω {name}' }) ===
    format(expected.applied, { name: 'Ω {name}' }),
  'Translated placeholders failed',
);
assert(
  filterPresets('All', expected.daybreak).some(
    (item) => item.id === 'daybreak',
  ),
  'Translated catalog search failed',
);
assert(
  filterPresets('All', 'daybreak').some((item) => item.id === 'daybreak'),
  'Original catalog search failed',
);
const preset = createPreset('daybreak');
assert(
  preset.name === 'Daybreak',
  'Localization changed the persisted preset name',
);
const settings = parseSettings(exportSettings(preset));
assert(
  JSON.stringify(settings.params) === JSON.stringify(paperParams(preset)),
  'Localization changed exported shader parameters',
);
console.log(
  `Verified ${ARGV[0]} gettext lookup, fallback, search, and settings round trip.`,
);
