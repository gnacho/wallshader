"""Check saved overrides in fresh GJS processes with isolated settings."""

import json
import os
import pathlib
import subprocess
import tempfile

with tempfile.TemporaryDirectory(prefix="wallshader-language-test.") as directory:
    root = pathlib.Path(directory)
    config = root / "config" / "wallshader"
    config.mkdir(parents=True)
    cases = [
        ("", "es", "en_US.UTF-8", "es"),
        ("es", "en", "en_US.UTF-8", "es"),
        ("en", "es", "en_US.UTF-8", "en"),
        ("zz", "es", "en_US.UTF-8", "es"),
        ("../es", "en", "en_US.UTF-8", "en"),
        ("es", "en", "C.UTF-8", "es"),
    ]
    languages = [line.split('#')[0].strip() for line in pathlib.Path('po/LINGUAS').read_text().splitlines()]
    for language in filter(None, languages):
        cases.extend([
            (language, "en", "en_US.UTF-8", language),
            (language, "en", "C.UTF-8", language),
        ])
    for saved, system, locale, expected in cases:
        (config / "state.json").write_text(json.dumps({"language": saved}))
        env = {
            **os.environ,
            "GSETTINGS_BACKEND": "memory",
            "XDG_CONFIG_HOME": str(root / "config"),
            "XDG_DATA_HOME": str(root / "data"),
            "XDG_CACHE_HOME": str(root / "cache"),
            "LANGUAGE": system,
            "LC_ALL": locale,
        }
        subprocess.run(["gjs", "-m", "tests/i18n.js", expected], env=env, check=True)
    print("Verified saved app language, system default, invalid preferences, and C.UTF-8 startup.")
