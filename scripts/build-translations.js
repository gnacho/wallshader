import { mkdir, readFile, readdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dir, '..');

export async function languages() {
  return (await readFile(`${root}/po/LINGUAS`, 'utf8'))
    .replace(/#.*$/gm, '')
    .split(/\s+/)
    .filter(Boolean);
}

export function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed`);
}

export async function buildTranslations(directory = `${root}/build/locale`) {
  const locales = await languages();
  await mkdir(directory, { recursive: true });
  for (const previous of await readdir(directory))
    if (!locales.includes(previous))
      await rm(`${directory}/${previous}`, { recursive: true, force: true });
  for (const language of locales) {
    if (!/^[a-z]{2,3}(?:_[A-Z]{2})?(?:@[a-z]+)?$/.test(language))
      throw new Error(`Invalid locale in po/LINGUAS: ${language}`);
    const output = `${directory}/${language}/LC_MESSAGES`;
    await mkdir(output, { recursive: true });
    run('msgfmt', [
      '--check',
      '--output-file',
      `${output}/wallshader.mo`,
      `po/${language}.po`,
    ]);
  }
}

if (import.meta.main) await buildTranslations();
