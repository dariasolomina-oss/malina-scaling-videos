#!/usr/bin/env python3
"""Offline parser of an explicitly authorized connector response. No network/keys."""
import argparse
import base64
import binascii
import json
from pathlib import Path
from episode import require_production, safe_path, work_dir, write_json
from timings import normalize
import shutil


def import_response(episode, response, authorized=False):
    if not authorized:
        raise ValueError('explicit authorization for supplied connector response required')
    require_production(episode, 'voice')
    if not isinstance(response.get('audio_base64'), str):
        raise ValueError('audio_base64 required')
    try:
        audio = base64.b64decode(response['audio_base64'], validate=True)
    except (ValueError, binascii.Error) as e:
        raise ValueError('invalid base64 audio') from e
    if not audio:
        raise ValueError('empty audio')
    timings = normalize(response, 'elevenlabs')
    # Generic extension: parser does not guess the supplied audio codec.
    audio_path = safe_path(episode, 'media/voice.audio')
    timings_path = safe_path(episode, 'timings.json')
    audio_path.parent.mkdir(exist_ok=True)
    work = work_dir(episode)
    try:
        (work/'voice.audio').write_bytes(audio)
        write_json(work/'timings.json', timings)
        # Check again after parsing before installing production artifacts.
        require_production(episode, 'voice')
        (work/'voice.audio').replace(audio_path)
        (work/'timings.json').replace(timings_path)
    finally:
        shutil.rmtree(work)
    return dict(audio=str(audio_path), timings=str(timings_path), integration='supplied_connector_response_only')


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('episode', type=Path); p.add_argument('response', type=Path)
    p.add_argument('--authorized-connector-response', action='store_true')
    a = p.parse_args()
    try:
        result = import_response(a.episode, json.loads(a.response.read_text()), a.authorized_connector_response)
        print(json.dumps(result))
    except (OSError, ValueError, KeyError, TypeError) as e:
        p.exit(2, f'error: {e}\n')


if __name__ == '__main__':
    main()
