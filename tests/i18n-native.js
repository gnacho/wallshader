import Gtk from 'gi://Gtk?version=4.0';
import GLib from 'gi://GLib';
import { exportSettings, parseSettings } from '../src/sharing.js';
import Adw from 'gi://Adw?version=1';
import { Store } from '../src/storage.js';
import { localeExpectation } from './i18n-expectations.js';
import { languageName } from '../src/language.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const settle = () =>
  new Promise((resolve) =>
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, 150, () => {
      resolve();
      return GLib.SOURCE_REMOVE;
    }),
  );

async function screenshot(window, name) {
  const directory = GLib.getenv('WALLSHADER_ARTIFACTS');
  if (!directory) return;
  await settle();
  const paintable = new Gtk.WidgetPaintable({ widget: window });
  for (let attempt = 0; attempt < 5; attempt++) {
    window.present();
    window.queue_draw();
    await settle();
    const snapshot = new Gtk.Snapshot();
    paintable.snapshot(snapshot, window.get_width(), window.get_height());
    const node = snapshot.to_node();
    if (!node) continue;
    const texture = window
      .get_native()
      .get_renderer()
      .render_texture(node, null);
    GLib.mkdir_with_parents(`${directory}/i18n`, 0o755);
    texture.save_to_png(
      `${directory}/i18n/${GLib.getenv('LANGUAGE')}-${name}.png`,
    );
    return;
  }
  throw new Error('Localized window snapshot was empty');
}

export async function run(window) {
  assert(
    GLib.getenv('GSETTINGS_BACKEND') === 'memory' &&
      GLib.getenv('XDG_CONFIG_HOME')?.includes('wallshader-test.'),
    'Localization smoke tests require isolated settings and data',
  );
  const language = GLib.getenv('LANGUAGE');
  const expected = localeExpectation(language);
  const background = window.wallpaper.settings.get_string('picture-uri');
  await window.ready;
  await window.preview.pause(true);
  assert(
    window.applyButton.label === expected.animated,
    'Wallpaper action was not localized',
  );
  assert(
    window.categoryLabel.label === expected.all,
    'Category label was not localized',
  );
  assert(
    window.liveFps.get_model().get_string(0) === expected.fps,
    'Frame-rate choices were not translated',
  );
  await window.selectPreset('daybreak');
  assert(
    window.nameLabel.label === expected.daybreak &&
      window.preset.name === 'Daybreak',
    'Display name changed the canonical preset name',
  );
  window.search.set_text(expected.daybreak);
  window._filter();
  assert(
    window._cards.get('daybreak').child.visible &&
      !window._cards.get('aurora').child.visible,
    'Localized search did not filter the gallery',
  );
  window.search.set_text('daybreak');
  window._filter();
  assert(
    window._cards.get('daybreak').child.visible,
    'Original English search stopped working',
  );
  window.search.set_text('');
  window._filter();
  assert(
    window.editor.fitChoice.choice.get_model().get_string(2) === expected.cover,
    'Shader option display was not translated',
  );
  window.editor.fitChoice.choice.selected = 2;
  assert(
    window.preset.fit === 'cover' &&
      parseSettings(exportSettings(window.preset)).params.fit === 'cover',
    'Translated choice changed the shader enum value',
  );
  await screenshot(window, 'wide');
  window.application.lookup_action('preferences').activate(null);
  let preferences = window.preferencesDialog;
  assert(
    preferences instanceof Adw.PreferencesDialog,
    'Preferences action did not open a native dialog',
  );
  assert(
    preferences.title === expected.preferences &&
      preferences.languageRow.get_model().get_string(0) === expected.system,
    'Preferences labels were not translated correctly',
  );
  for (const code of [
    'en',
    'es',
    'de',
    'fr',
    'ja',
    'ko',
    'pt_BR',
    'zh_CN',
    'zh_TW',
  ])
    assert(
      preferences.languageRow
        .get_model()
        .get_string(preferences.languageCodes.indexOf(code)) ===
        languageName(code),
      `Language choice ${code} is missing its native name`,
    );
  const changeTo = language === 'es' ? 'en' : 'es';
  preferences.languageRow.selected =
    preferences.languageCodes.indexOf(changeTo);
  assert(
    new Store().state.language === changeTo &&
      window.nameLabel.label === expected.daybreak,
    'Language preference was not saved independently of the current UI',
  );
  await screenshot(window, 'preferences');
  preferences.close();
  await settle();
  window.application.lookup_action('preferences').activate(null);
  preferences = window.preferencesDialog;
  assert(
    preferences.languageCodes[preferences.languageRow.selected] === changeTo,
    'Preferences did not remember the saved language',
  );
  const save = window.store.save;
  window.store.save = () => {
    throw new Error('Language setting test failed');
  };
  try {
    preferences.languageRow.selected = 0;
    assert(
      preferences.languageCodes[preferences.languageRow.selected] ===
        changeTo &&
        window.store.state.language === changeTo &&
        preferences.errorLabel.visible &&
        new Store().state.language === changeTo,
      'A failed settings write did not restore the language selection',
    );
  } finally {
    window.store.save = save;
  }
  preferences.languageRow.selected = 0;
  assert(
    new Store().state.language === '',
    'System language could not be restored',
  );
  preferences.close();
  await settle();
  window.wallpaperSettings.present(window);
  await screenshot(window, 'settings');
  window.wallpaperSettings.close();
  const dialog = window.showSavePreset();
  await dialog.ready;
  await screenshot(window, 'save');
  dialog.nameEntry.set_text('Save');
  await dialog.save();
  const saved = window.store.state.savedPresets.find(
    (item) => item.name === 'Save',
  );
  assert(
    saved &&
      window.presetGrid.cards
        .get(`saved:${saved.id}`)
        .card.tooltip_text.startsWith('Save'),
    'A user-entered preset name was translated',
  );
  window.set_default_size(560, 700);
  assert(
    window._collectionName({ name: 'Custom', builtinName: true }) ===
      expected.custom &&
      window._collectionName({ name: 'Custom' }) === 'Custom',
    'Collection labels confused application text with a user name',
  );
  await screenshot(window, 'narrow');
  window.application.lookup_action('preferences').activate(null);
  await screenshot(window, 'preferences-narrow');
  window.preferencesDialog.close();
  await settle();
  window.split.show_sidebar = true;
  await screenshot(window, 'narrow-inspector');
  if (GLib.getenv('LANGUAGE') === 'ar')
    assert(
      Gtk.Widget.get_default_direction() === Gtk.TextDirection.RTL,
      'RTL layout was not enabled',
    );
  assert(
    window.wallpaper.settings.get_string('picture-uri') === background,
    'Localization smoke test changed the wallpaper',
  );
  console.log(
    'Verified localized labels, search, shader values, user names, and responsive layout.',
  );
}
