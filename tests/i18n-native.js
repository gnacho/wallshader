import Gtk from 'gi://Gtk?version=4.0';
import GLib from 'gi://GLib';
import { exportSettings, parseSettings } from '../src/sharing.js';

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
  const spanish = GLib.getenv('LANGUAGE') === 'es';
  const background = window.wallpaper.settings.get_string('picture-uri');
  await window.ready;
  await window.preview.pause(true);
  assert(
    window.applyButton.label ===
      (spanish ? 'Establecer fondo animado' : 'Set Animated Wallpaper'),
    'Wallpaper action was not localized',
  );
  assert(
    window.categoryLabel.label === (spanish ? 'Todos' : 'All'),
    'Category label was not localized',
  );
  assert(
    window.liveFps.get_model().get_string(0) ===
      (spanish ? '30 FPS · menor consumo' : '30 FPS · less power'),
    'Frame-rate choices were not translated',
  );
  await window.selectPreset('daybreak');
  assert(
    window.nameLabel.label === (spanish ? 'Amanecer' : 'Daybreak') &&
      window.preset.name === 'Daybreak',
    'Display name changed the canonical preset name',
  );
  window.search.set_text(spanish ? 'amanecer' : 'daybreak');
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
    window.editor.fitChoice.choice.get_model().get_string(2) ===
      (spanish ? 'cubrir' : 'cover'),
    'Shader option display was not translated',
  );
  window.editor.fitChoice.choice.selected = 2;
  assert(
    window.preset.fit === 'cover' &&
      parseSettings(exportSettings(window.preset)).params.fit === 'cover',
    'Translated choice changed the shader enum value',
  );
  await screenshot(window, 'wide');
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
      (spanish ? 'Personalizado' : 'Custom') &&
      window._collectionName({ name: 'Custom' }) === 'Custom',
    'Collection labels confused application text with a user name',
  );
  await screenshot(window, 'narrow');
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
