#!/usr/bin/env python3
"""Verify packaged file integrity relative to the release manifest."""
import hashlib
import json
from pathlib import Path, PurePosixPath


def verify(root):
    root = Path(root).resolve()
    manifest = json.loads((root/'manifest.json').read_text())
    for relative, expected in manifest['files'].items():
        rel = PurePosixPath(relative)
        if not relative or rel.is_absolute() or '..' in rel.parts or '\\' in relative:
            raise ValueError('Unsafe manifest path')
        path = root/relative
        if any(p.is_symlink() for p in (path, *path.parents)) or not path.resolve().is_relative_to(root):
            raise ValueError('Unsafe release file')
        if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest() != expected:
            raise ValueError('Release integrity failure: ' + relative)
    print(json.dumps({'version': manifest['version'], 'files_checked':len(manifest['files']), 'result':'passed'}))


if __name__ == '__main__':
    verify(Path(__file__).resolve().parent)
