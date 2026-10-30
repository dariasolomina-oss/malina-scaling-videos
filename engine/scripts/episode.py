#!/usr/bin/env python3
"""Local, JSON-compatible YAML episode state and checksummed snapshots (stdlib)."""
import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import tempfile
from datetime import datetime, timezone
from uuid import uuid4

STATUSES = ['topic', 'script', 'script_approved', 'voice', 'render', 'review', 'video_approved', 'publish_ready', 'published']


def now():
    return datetime.now(timezone.utc).isoformat()


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def safe_path(root, relative):
    p = PurePosixPath(relative)
    if not relative or p.is_absolute() or '..' in p.parts or '\\' in relative or p.as_posix() != relative:
        raise ValueError('unsafe relative path')
    root = Path(root).absolute()
    if any(x.is_symlink() for x in [root, *root.parents]):
        raise ValueError('symlinks are not supported')
    root = root.resolve()
    result = root.joinpath(*p.parts)
    if not result.resolve().is_relative_to(root):
        raise ValueError('path escapes root')
    if any(x.is_symlink() for x in [result, *result.parents] if x != root.parent):
        raise ValueError('symlinks are not supported')
    return result


def write_json(path, value):
    path = Path(path)
    temp = path.with_name(path.name + '.' + uuid4().hex + '.tmp')
    temp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    os.replace(temp, path)


def create(root, episode_id, title, language='en'):
    if not re.fullmatch(r'[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}', episode_id):
        raise ValueError('invalid episode id')
    root = Path(root)
    root.mkdir(parents=True, exist_ok=False)
    (root / 'media').mkdir()
    (root / 'work').mkdir()
    (root / 'script.md').write_text('', encoding='utf-8')
    state = dict(schema_version=1, id=episode_id, title=title, language=language,
                 status='topic', revision=1, script_path='script.md', script_hash=digest(root/'script.md'),
                 video_path='media/video.mp4', approvals={}, history=[], created_at=now())
    write_json(root/'episode.yaml', state)
    return state


def load(root):
    root = Path(root)
    state = json.loads(safe_path(root, 'episode.yaml').read_text(encoding='utf-8'))
    if state.get('schema_version') != 1 or state.get('status') not in STATUSES:
        raise ValueError('invalid episode state')
    current = digest(safe_path(root, state['script_path']))
    if current != state['script_hash']:
        state.update(script_hash=current, revision=state['revision']+1, approvals={}, status='script')
        state['history'].append(dict(event='script_changed', at=now()))
        write_json(root/'episode.yaml', state)
    video = state['approvals'].get('video')
    if video:
        path = safe_path(root, state['video_path'])
        if not path.is_file() or digest(path) != video.get('video_hash'):
            del state['approvals']['video']
            if STATUSES.index(state['status']) >= STATUSES.index('video_approved'):
                state['status'] = 'review'
            write_json(root/'episode.yaml', state)
    return state


def approved(state, kind):
    a = state['approvals'].get(kind, {})
    return bool(a.get('human') and a.get('confirmed') is True and a.get('script_hash') == state['script_hash'] and a.get('revision') == state['revision'])


def require_production(root, action):
    state = load(root)
    if action not in ('voice', 'render', 'package'):
        raise ValueError('unknown production action')
    if not approved(state, 'script'):
        raise ValueError('explicit current script approval required')
    if action == 'package' and not approved(state, 'video'):
        raise ValueError('explicit current video approval required')
    return state


def approve(root, kind, human, confirm=False):
    state = load(root)
    if kind not in ('script', 'video') or not confirm or not human.strip():
        raise ValueError('explicit --confirm and named human required')
    if state['status'] != ('script' if kind == 'script' else 'review'):
        raise ValueError('approval not allowed in current status')
    if not safe_path(root, state['script_path']).read_text(encoding='utf-8').strip():
        raise ValueError('empty script')
    a = dict(human=human.strip(), confirmed=True, at=now(), script_hash=state['script_hash'], revision=state['revision'])
    if kind == 'video':
        require_production(root, 'render')
        path = safe_path(root, state['video_path'])
        if not path.is_file() or path.stat().st_size == 0:
            raise ValueError('nonempty review video required')
        a['video_hash'] = digest(path)
    state['approvals'][kind] = a
    state['status'] = kind + '_approved'
    state['history'].append(dict(event='human_approval', kind=kind, **a))
    write_json(Path(root)/'episode.yaml', state)
    return state


def transition(root, target):
    state = load(root)
    if target not in STATUSES or target.endswith('_approved'):
        raise ValueError('approval requires explicit approve command')
    if STATUSES.index(target) != STATUSES.index(state['status']) + 1:
        raise ValueError('only next lifecycle transition allowed')
    if target == 'script' and not safe_path(root, state['script_path']).read_text(encoding='utf-8').strip():
        raise ValueError('empty script')
    if STATUSES.index(target) >= STATUSES.index('voice'):
        require_production(root, 'package' if target in ('publish_ready', 'published') else 'render')
    if target == 'review' and not safe_path(root, state['video_path']).is_file():
        raise ValueError('review video missing')
    state['status'] = target
    state['history'].append(dict(event='transition', status=target, at=now()))
    write_json(Path(root)/'episode.yaml', state)
    return state


def work_dir(root):
    """Fresh per-run ephemeral directory. Caller removes it after the operation."""
    load(root)
    base = safe_path(root, 'work')
    base.mkdir(exist_ok=True)
    return Path(tempfile.mkdtemp(prefix='run-', dir=base))


class LocalDirectoryStorage:
    """Only a local test adapter; no external service is connected."""
    def __init__(self, directory):
        self.root = Path(directory).resolve()
        self.root.mkdir(parents=True, exist_ok=True)

    def version(self, episode):
        episode = Path(episode).resolve()
        if self.root.is_relative_to(episode) or episode.is_relative_to(self.root):
            raise ValueError('storage and episode must be disjoint')
        state = load(episode)
        version = uuid4().hex
        dest = self.root / version
        dest.mkdir()
        files = {}
        try:
            for p in sorted(episode.rglob('*')):
                rel = p.relative_to(episode).as_posix()
                if rel == 'work' or rel.startswith('work/'):
                    continue
                safe_path(episode, rel)
                if p.is_file():
                    out = safe_path(dest/'files', rel)
                    out.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copyfile(p, out)
                    files[rel] = dict(sha256=digest(out), size=out.stat().st_size)
            write_json(dest/'manifest.json', dict(schema_version=1, version=version, episode_id=state['id'], files=files, created_at=now()))
        except Exception:
            shutil.rmtree(dest)
            raise
        return version

    def restore(self, version, destination):
        if not re.fullmatch('[0-9a-f]{32}', version):
            raise ValueError('invalid version id')
        source = safe_path(self.root, version)
        manifest = json.loads(safe_path(source, 'manifest.json').read_text())
        if manifest.get('schema_version') != 1 or manifest.get('version') != version:
            raise ValueError('invalid manifest')
        if not {'episode.yaml', 'script.md'} <= set(manifest['files']):
            raise ValueError('incomplete snapshot')
        destination = Path(destination)
        if destination.exists():
            raise ValueError('restore destination must not exist')
        # Validate every path and checksum before writing anything.
        for rel, meta in manifest['files'].items():
            if rel == 'work' or rel.startswith('work/'):
                raise ValueError('work files are not restorable')
            path = safe_path(source/'files', rel)
            safe_path(destination, rel)
            if not path.is_file() or digest(path) != meta['sha256'] or path.stat().st_size != meta['size']:
                raise ValueError('snapshot checksum mismatch')
        destination.mkdir(parents=True)
        try:
            for rel in manifest['files']:
                out = safe_path(destination, rel)
                out.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(safe_path(source/'files', rel), out)
            state = load(destination)
            # Restoring never grants historical approvals to a new working copy.
            state.update(approvals={}, status='script', revision=state['revision']+1)
            state['history'].append(dict(event='restored', version=version, at=now()))
            write_json(destination/'episode.yaml', state)
            (destination/'work').mkdir(exist_ok=True)
        except Exception:
            shutil.rmtree(destination)
            raise
        return state


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    for cmd in ('create', 'status', 'approve', 'transition', 'version', 'restore'):
        p = sub.add_parser(cmd)
        p.add_argument('episode', type=Path)
        if cmd == 'create':
            p.add_argument('--id', required=True); p.add_argument('--title', required=True); p.add_argument('--language', default='en')
        if cmd == 'approve':
            p.add_argument('kind', choices=['script', 'video']); p.add_argument('--human', required=True); p.add_argument('--confirm', action='store_true')
        if cmd == 'transition':
            p.add_argument('target', choices=STATUSES)
        if cmd in ('version', 'restore'):
            p.add_argument('--storage', required=True, type=Path)
        if cmd == 'restore':
            p.add_argument('--version', required=True)
    a = parser.parse_args()
    try:
        if a.command == 'create': result = create(a.episode, a.id, a.title, a.language)
        elif a.command == 'status': result = load(a.episode)
        elif a.command == 'approve': result = approve(a.episode, a.kind, a.human, a.confirm)
        elif a.command == 'transition': result = transition(a.episode, a.target)
        elif a.command == 'version': result = dict(version=LocalDirectoryStorage(a.storage).version(a.episode))
        else: result = LocalDirectoryStorage(a.storage).restore(a.version, a.episode)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    except (ValueError, OSError, KeyError, TypeError) as e:
        parser.exit(2, f'error: {e}\n')


if __name__ == '__main__':
    main()
