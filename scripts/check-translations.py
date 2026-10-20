"""Validate gettext catalogs and named placeholders without installing anything."""

import gettext
import pathlib
import re
import subprocess
import tempfile

ROOT = pathlib.Path(__file__).resolve().parent.parent


def run(*args):
    subprocess.run(args, cwd=ROOT, check=True)


run("bun", "scripts/update-translations.js", "--check")
potfiles = set((ROOT / "po/POTFILES").read_text().splitlines())
for source in (ROOT / "src").rglob("*.js"):
    if re.search(r"(?<![\w.])(?:_|N_|ngettext|pgettext)\(", source.read_text()):
        if source.relative_to(ROOT).as_posix() not in potfiles:
            raise SystemExit(f"Missing translation source in po/POTFILES: {source}")

with tempfile.TemporaryDirectory(prefix="wallshader-translations.") as directory:
    current_pot = pathlib.Path(directory) / "wallshader.pot"
    run(
        "xgettext",
        *(["--no-git"] if b"--no-git" in subprocess.check_output(["xgettext", "--help"]) else []),
        "--from-code=UTF-8", "--keyword=_", "--keyword=N_",
        "--keyword=ngettext:1,2", "--keyword=pgettext:1c,2",
        "--files-from=po/POTFILES", "--output", str(current_pot),
    )
    linguas = (ROOT / "po/LINGUAS").read_text()
    for language in re.sub(r"#.*", "", linguas).split():
        if not re.fullmatch(r"[a-z]{2,3}(?:_[A-Z]{2})?(?:@[a-z]+)?", language):
            raise SystemExit(f"Invalid locale in po/LINGUAS: {language}")
        catalog = ROOT / "po" / f"{language}.po"
        mo = pathlib.Path(directory) / f"{language}.mo"
        run("msgfmt", "--check", "--statistics", "-o", str(mo), str(catalog))
        # Include untranslated entries: partial catalogs use English fallback,
        # but every current source message must still be available to translators.
        run("msgcmp", "--use-untranslated", "--use-fuzzy", str(catalog), str(current_pot))
        with mo.open("rb") as stream:
            translations = gettext.GNUTranslations(stream)
        for source, translated in translations._catalog.items():
            if not source:
                continue
            message = source[0] if isinstance(source, tuple) else source
            message = message.split("\x04")[-1]
            placeholders = set(re.findall(r"\{\w+\}", message))
            if placeholders != set(re.findall(r"\{\w+\}", translated)):
                raise SystemExit(f"{language}: placeholder mismatch for {message!r}")

print("Translation catalogs and placeholders are valid.")
