// Shared with Bun and the canvas renderer; native applications install gettext.
let translations = {
  gettext: (message) => message,
  ngettext: (singular, plural, count) => (count === 1 ? singular : plural),
  pgettext: (_context, message) => message,
};

export function setTranslations(value) {
  translations = value;
}

export const _ = (message) => translations.gettext(message);
export const ngettext = (singular, plural, count) =>
  translations.ngettext(singular, plural, count);
export const pgettext = (context, message) =>
  translations.pgettext(context, message);

// Mark metadata for extraction without translating persisted values.
export const N_ = (message) => message;

// Named placeholders let translators change word order. Values are inserted once.
export function format(message, values) {
  return message.replace(/\{(\w+)\}/g, (placeholder, key) =>
    Object.hasOwn(values, key) ? String(values[key]) : placeholder,
  );
}
