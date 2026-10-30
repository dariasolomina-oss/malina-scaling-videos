#!/usr/bin/env python3
"""Export agent-written YouTube copy; no generation, network or publishing.

Input JSON (exact fields; alternative_titles and notes optional)::

  {"title":"LakeSentry: Databricks cost visibility", "description":"An overview of the approved video topic.",
   "language":"en", "primary_keyword":"Databricks cost visibility", "alternative_titles":[],
   "evidence":[{"claim":"This video covers Databricks cost visibility", "references":["script.md: section 2"]}],
   "notes":[], "video_hash":"<64 lowercase hex>", "script_hash":"<64 lowercase hex>"}

alternative_titles must contain zero or two titles. References/notes are retained
for human review, not semantically verified. Short titles are a recommendation,
not a rule. No SEO score, CTR or ranking promises. Each output is atomically
replaced; the pair is not a filesystem transaction (check detects partial writes).
Use a single writer; concurrent hostile filesystem mutations are not supported.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import tempfile
import unicodedata

import episode


def _bytes(value):
    return (json.dumps(value, ensure_ascii=False, sort_keys=True, indent=2) + '\n').encode('utf-8')


def _hash(data):
    return hashlib.sha256(data).hexdigest()


def _text(value, field, limit=None, multiline=False):
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f'{field}: nonempty text required')
    if any(unicodedata.category(c).startswith('C') and not (multiline and c == '\n') for c in value):
        raise ValueError(f'{field}: control characters forbidden')
    if re.search(r'\b(?:TODO|TBD|REPLACE_WITH_[A-Z0-9_]+)\b|<[^>]*>|\{\{.*?\}\}', value, re.I | re.S):
        raise ValueError(f'{field}: placeholder forbidden')
    if limit is not None and len(value) > limit:
        raise ValueError(f'{field}: maximum {limit} characters')
    return value


def validate(value):
    required = {'title', 'description', 'language', 'primary_keyword', 'evidence', 'video_hash', 'script_hash'}
    if not isinstance(value, dict) or not required <= value.keys() or value.keys() - required - {'alternative_titles', 'notes'}:
        raise ValueError('invalid metadata fields')
    result = dict(value)
    for field, limit in [('title', 100), ('description', 5000), ('language', None), ('primary_keyword', None)]:
        _text(result[field], field, limit, field == 'description')
    for field in ('video_hash', 'script_hash'):
        if not isinstance(result[field], str) or not re.fullmatch('[0-9a-f]{64}', result[field]):
            raise ValueError(f'{field}: SHA-256 required')
    titles = result.setdefault('alternative_titles', [])
    if not isinstance(titles, list) or len(titles) not in (0, 2):
        raise ValueError('alternative_titles: zero or two titles required')
    for title in titles:
        _text(title, 'alternative title', 100)
    notes = result.setdefault('notes', [])
    if not isinstance(notes, list):
        raise ValueError('notes: list required')
    for note in notes:
        _text(note, 'note', multiline=True)
    evidence = result['evidence']
    if not isinstance(evidence, list) or not evidence:
        raise ValueError('nonempty evidence list required')
    for item in evidence:
        if not isinstance(item, dict) or set(item) != {'claim', 'references'}:
            raise ValueError('evidence: claim and references required')
        _text(item['claim'], 'claim', multiline=True)
        refs = item['references']
        if not isinstance(refs, list) or not refs:
            raise ValueError('claim references required')
        for ref in refs:
            _text(ref, 'reference')
    return result


def _snapshot(root):
    # This must precede output-directory creation or any output writes.
    state = episode.require_production(root, 'package')
    if state['status'] not in ('video_approved', 'publish_ready'):
        raise ValueError('video_approved or publish_ready status required')
    hashes = {kind + '_hash': episode.digest(episode.safe_path(root, state[kind + '_path']))
              for kind in ('video', 'script')}
    if hashes['script_hash'] != state['script_hash'] or hashes['video_hash'] != state['approvals']['video'].get('video_hash'):
        raise ValueError('approved asset bytes changed')
    return state, hashes


def _render(metadata):
    lines = ['# ' + metadata['title'], '', metadata['description'], '', '## Alternative titles']
    lines += ['- ' + x for x in metadata['alternative_titles']]
    lines += ['', 'Language: ' + metadata['language'], 'Primary keyword: ' + metadata['primary_keyword'],
              '', '## Evidence / claim mapping (human review required)']
    for item in metadata['evidence']:
        lines += ['- Claim: ' + item['claim']] + ['  - Reference: ' + ref for ref in item['references']]
    lines += ['', '## Notes'] + ['- ' + note for note in metadata['notes']]
    lines += ['', 'Human review required. Evidence coverage and factual accuracy are not verified.',
              'No CTR or ranking guarantee.', '', 'Video SHA-256: ' + metadata['video_hash'],
              'Script SHA-256: ' + metadata['script_hash'], '']
    markdown = '\n'.join(lines).encode('utf-8')
    payload = dict(schema_version=1, metadata=metadata, human_review_required=True,
                   checksums=dict(metadata_sha256=_hash(_bytes(metadata)), youtube_md_sha256=_hash(markdown),
                                  video_sha256=metadata['video_hash'], script_sha256=metadata['script_hash']))
    return _bytes(payload), markdown


def _targets(root):
    return [episode.safe_path(root, 'publish/' + name) for name in ('youtube.json', 'youtube.md')]


def export(root, metadata):
    root = Path(root).absolute()
    initial, hashes = _snapshot(root)
    metadata = validate(metadata)
    if any(metadata[key] != value for key, value in hashes.items()):
        raise ValueError('stale generator input: approved asset hashes differ')
    contents = _render(metadata)
    targets = _targets(root)
    if all(path.is_file() and path.read_bytes() == data for path, data in zip(targets, contents)):
        return dict(result='unchanged', human_review_required=True)
    episode.safe_path(root, 'publish').mkdir(exist_ok=True)
    temps = []
    try:
        for data in contents:
            directory = episode.safe_path(root, 'publish')
            fd, name = tempfile.mkstemp(prefix='.youtube-', suffix='.tmp', dir=directory)
            temps.append(Path(name))
            with os.fdopen(fd, 'wb') as stream:
                stream.write(data)
                stream.flush()
                os.fsync(stream.fileno())
        # Reject edits/reapprovals during preparation, before installing either file.
        current, current_hashes = _snapshot(root)
        if current != initial or current_hashes != hashes:
            raise ValueError('episode changed during export')
        targets = _targets(root)
        for temp, target in zip(temps, targets):
            episode.safe_path(root, temp.relative_to(root).as_posix())
            episode.safe_path(root, target.relative_to(root).as_posix())
            os.replace(temp, target)
    finally:
        for temp in temps:
            if temp.exists():
                temp.unlink()
    return dict(result='exported', human_review_required=True)


def check(root):
    """Read-only diagnostics except episode.load's existing approval invalidation."""
    try:
        _, hashes = _snapshot(root)
        paths = _targets(root)
        payload = json.loads(paths[0].read_text(encoding='utf-8'))
        metadata = validate(payload['metadata'])
        if any(metadata[key] != value for key, value in hashes.items()):
            raise ValueError('stale exported asset hashes')
        expected = _render(metadata)
        if any(path.read_bytes() != data for path, data in zip(paths, expected)):
            raise ValueError('export checksum/content mismatch')
        return dict(ok=True, human_review_required=True)
    except (ValueError, OSError, KeyError, TypeError) as error:
        return dict(ok=False, human_review_required=True, diagnostic=str(error))


def _read_metadata(path):
    path = Path(path).absolute()
    return json.loads(episode.safe_path(path.parent, path.name).read_text(encoding='utf-8'))


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    commands = parser.add_subparsers(dest='command', required=True)
    cmd = commands.add_parser('export')
    cmd.add_argument('episode', type=Path)
    cmd.add_argument('--metadata', required=True, type=Path)
    cmd = commands.add_parser('check')
    cmd.add_argument('episode', type=Path)
    args = parser.parse_args()
    try:
        if args.command == 'export':
            _snapshot(args.episode)  # guard even before reading generator input
            result = export(args.episode, _read_metadata(args.metadata))
        else:
            result = check(args.episode)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0 if result.get('ok', True) else 2
    except (ValueError, OSError, KeyError, TypeError) as error:
        parser.exit(2, f'error: {error}\n')


if __name__ == '__main__':
    raise SystemExit(main())
