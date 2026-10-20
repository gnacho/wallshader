import Adw from 'gi://Adw?version=1';
import Gtk from 'gi://Gtk?version=4.0';
import { _, availableLanguages } from './i18n.js';
import { languageName } from './language.js';

export function showPreferences(window) {
  if (window.preferencesDialog) {
    window.preferencesDialog.present(window);
    return window.preferencesDialog;
  }
  const dialog = new Adw.PreferencesDialog({
    title: _('Preferences'),
    content_width: 460,
    content_height: 300,
  });
  const page = new Adw.PreferencesPage({
    title: _('General'),
    icon_name: 'preferences-system-symbolic',
  });
  const group = new Adw.PreferencesGroup({
    title: _('Interface'),
    description: _(
      'Language changes take effect the next time you open Wallshader.',
    ),
  });
  const selected = Math.max(
    0,
    availableLanguages.indexOf(window.store.state.language),
  );
  const row = new Adw.ComboRow({
    title: _('Language'),
    model: Gtk.StringList.new(
      availableLanguages.map((code) =>
        code ? languageName(code) : _('System Default'),
      ),
    ),
    selected,
  });
  const error = new Gtk.Label({
    wrap: true,
    xalign: 0,
    visible: false,
    css_classes: ['error'],
    margin_top: 12,
  });
  let previous = selected;
  let updating = false;
  row.connect('notify::selected', () => {
    if (updating) return;
    const saved = window.store.state.language;
    window.store.state.language = availableLanguages[row.selected];
    try {
      window._remember();
      window.store.save();
      previous = row.selected;
      error.visible = false;
    } catch (exception) {
      window.store.state.language = saved;
      updating = true;
      row.selected = previous;
      updating = false;
      error.label = exception.message;
      error.visible = true;
    }
  });
  group.add(row);
  group.add(error);
  page.add(group);
  dialog.add(page);
  dialog.languageRow = row;
  dialog.languageCodes = availableLanguages;
  dialog.errorLabel = error;
  dialog.connect('closed', () => {
    window.preferencesDialog = null;
  });
  window.preferencesDialog = dialog;
  dialog.present(window);
  return dialog;
}
