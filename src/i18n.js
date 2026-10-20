import Gettext from 'gettext';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import { ROOT, CONFIG_DIR } from './paths.js';
import { normalizeLanguage } from './language.js';
import { setTranslations } from './translation.js';

const domain = 'wallshader';
const localeDirectory = Gio.File.new_for_path(
  GLib.getenv('WALLSHADER_LOCALEDIR') ||
    GLib.build_filenamev([ROOT, 'build', 'locale']),
);

const catalogLanguages = [];
if (localeDirectory.query_exists(null)) {
  const entries = localeDirectory.enumerate_children(
    'standard::name',
    Gio.FileQueryInfoFlags.NONE,
    null,
  );
  try {
    for (
      let entry = entries.next_file(null);
      entry;
      entry = entries.next_file(null)
    ) {
      const code = entry.get_name();
      if (
        normalizeLanguage(code) &&
        code !== 'en' &&
        !catalogLanguages.includes(code) &&
        localeDirectory
          .resolve_relative_path(`${code}/LC_MESSAGES/${domain}.mo`)
          .query_exists(null)
      )
        catalogLanguages.push(code);
    }
  } finally {
    entries.close(null);
  }
}
export const availableLanguages = Object.freeze([
  '',
  'en',
  ...catalogLanguages.sort(),
]);

function readLanguage() {
  try {
    // Read before importing widgets or Store; importing Store here would create
    // a cycle through the catalog and could translate text before initialization.
    const [, bytes] = Gio.File.new_for_path(
      GLib.build_filenamev([CONFIG_DIR, 'state.json']),
    ).load_contents(null);
    const code = normalizeLanguage(
      JSON.parse(new TextDecoder().decode(bytes))?.language,
    );
    return availableLanguages.includes(code) ? code : '';
  } catch {
    // Store reports unreadable settings after the application has a window.
    return '';
  }
}

export const startupLanguage = readLanguage();
if (startupLanguage) {
  GLib.setenv('LANGUAGE', startupLanguage, true);
  const messages = Gettext.setlocale(Gettext.LocaleCategory.MESSAGES, null);
  if (/^(?:C|POSIX)(?:[.@]|$)/.test(messages)) {
    // gettext ignores LANGUAGE in the C locale. Use an installed UTF-8 message
    // locale when available, without changing number/date formatting.
    for (const locale of ['en_US.UTF-8', `${startupLanguage}.UTF-8`])
      if (Gettext.setlocale(Gettext.LocaleCategory.MESSAGES, locale)) break;
  }
}
Gettext.bindtextdomain(domain, localeDirectory.get_path());
setTranslations(Gettext.domain(domain));

export { _, ngettext, pgettext, format } from './translation.js';
