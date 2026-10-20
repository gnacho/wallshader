// Empty means follow the system. Keep the preference independent of installed
// catalogs so a temporarily unavailable language survives an app update.
export function normalizeLanguage(value) {
  return typeof value === 'string' &&
    /^[a-z]{2,3}(?:_[A-Z]{2})?(?:@[a-z]+)?$/.test(value)
    ? value
    : '';
}

export function languageName(code) {
  // Identify the writing system explicitly; both catalogs are Chinese.
  if (code === 'zh_CN') return '简体中文';
  if (code === 'zh_TW') return '繁體中文';
  const tag = code.split('@')[0].replaceAll('_', '-');
  try {
    const name = new Intl.DisplayNames([tag], { type: 'language' }).of(tag);
    return name[0].toLocaleUpperCase(tag) + name.slice(1);
  } catch {
    return code;
  }
}
