import Gettext from 'gettext';
import GLib from 'gi://GLib';
import { ROOT } from './paths.js';
import { setTranslations } from './translation.js';

const domain = 'wallshader';
Gettext.bindtextdomain(
  domain,
  GLib.getenv('WALLSHADER_LOCALEDIR') ||
    GLib.build_filenamev([ROOT, 'build', 'locale']),
);
setTranslations(Gettext.domain(domain));

export { _, ngettext, pgettext, format } from './translation.js';
