#!/usr/bin/env python3
"""Read-only local tool/CDP-config/disk diagnostics. Never probes a browser."""
import argparse
import json
import os
from pathlib import Path
import shutil
import sys


def diagnose(path):
    disk = shutil.disk_usage(path)
    return dict(python=dict(version='.'.join(map(str, sys.version_info[:3])), supported=sys.version_info >= (3, 10)),
                tools={name: shutil.which(name) is not None for name in ['ffmpeg', 'ffprobe', 'node', 'npm', 'whisper', 'whisper-cli']},
                cdp=dict(configuration_present=any(bool(os.environ.get(k)) for k in ['CDP_URL', 'CDP_ENDPOINT', 'BROWSER_CDP_URL']), connection_tested=False),
                disk=dict(total_bytes=disk.total, free_bytes=disk.free),
                integrations=dict(elevenlabs='not_connected', media_storage='local_directory_test_adapter_only'))


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--path', type=Path, default=Path.cwd())
    a = p.parse_args()
    try: print(json.dumps(diagnose(a.path), indent=2))
    except OSError: p.exit(2, 'error: diagnostic path unavailable\n')


if __name__ == '__main__': main()
