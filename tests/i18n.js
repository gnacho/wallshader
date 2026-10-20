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

const spanish = ARGV[0] === 'es';
assert(
  _('Save') === (spanish ? 'Guardar' : 'Save'),
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
assert(
  format(
    ngettext(
      '{interval} / {count} frame observed',
      '{interval} / {count} frames observed',
      2,
    ),
    { interval: '16 ms', count: 2 },
  ) ===
    (spanish ? '16 ms / 2 fotogramas observados' : '16 ms / 2 frames observed'),
  'Translated plural lookup failed',
);
assert(
  format(_('{name} set as wallpaper'), { name: 'Ω {name}' }) ===
    (spanish
      ? 'Ω {name} establecido como fondo de pantalla'
      : 'Ω {name} set as wallpaper'),
  'Translated placeholders failed',
);
assert(
  filterPresets('All', spanish ? 'amanecer' : 'daybreak').some(
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
