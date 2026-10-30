#!/usr/bin/env python3
"""Local LakeSentry production CLI. Human approvals belong to episode.py only."""
import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
from uuid import uuid4

import episode
import prepare_page
import timings
import voice_elevenlabs

REPO = Path(__file__).resolve().parents[2]


def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))


def tree_hash(root):
    root = Path(root)
    result = {}
    for p in sorted(root.rglob('*')):
        if p.is_symlink():
            raise ValueError('symlinks are not supported')
        if p.is_file():
            result[p.relative_to(root).as_posix()] = episode.digest(p)
    return result


def checksum(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, allow_nan=False).encode()).hexdigest()


def save(root, state):
    episode.write_json(episode.safe_path(root, 'episode.yaml'), state)


def init(root, episode_id, brand, format, duration, voice, author, thread_url=None):
    if format not in ('horizontal', 'vertical') or voice not in ('none', 'mp3', 'elevenlabs'):
        raise ValueError('invalid format/voice')
    if not math.isfinite(duration) or not 0 < duration <= 3600 or not author.strip():
        raise ValueError('positive finite duration <=3600 and author required')
    brand = Path(brand).resolve()
    config = read(brand/'brand.json')
    if config.get('name') != 'LakeSentry':
        raise ValueError('LakeSentry brand required')
    root = Path(root)
    state = episode.create(root, episode_id, 'LakeSentry demo', 'en')
    state['metadata'] = dict(language='en', author=author, thread_url=thread_url)
    state['branch'] = dict(name='ep/lakesentry/'+episode_id, language='en', format=format)
    state['pipeline'] = dict(brand=str(brand), format=format, duration=duration, voice=voice)
    save(root, state)
    # No facts/results or product UI are invented here. Editor replaces placeholders.
    (root/'script.md').write_text('# LakeSentry demo\n\nTODO: write the script and obtain explicit human approval.\n', encoding='utf-8')
    episode.write_json(root/'content.json', dict(demo=True, headline='LakeSentry',
        subtitle='Editorial demo', footer='Pending review', blocks=[], duration=duration))
    (root/'inputs').mkdir()
    (root/'source').mkdir()
    # This is a local branch descriptor, not a git operation.
    return episode.load(root)


def probe_audio(path, mp3=False):
    result = subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format',
        '-of', 'json', str(path)], check=True, capture_output=True, text=True)
    info = json.loads(result.stdout)
    streams = [s for s in info.get('streams', []) if s.get('codec_type') == 'audio']
    duration = float(info.get('format', {}).get('duration', 0))
    if not streams or not math.isfinite(duration) or duration <= 0:
        raise ValueError('nonempty decodable audio with positive duration required')
    if mp3 and (streams[0].get('codec_name') != 'mp3' or
                'mp3' not in info.get('format', {}).get('format_name', '').split(',')):
        raise ValueError('input must be an actual MP3, not a renamed audio file')
    return duration


def import_voice(root, mp3=None, words=None, response=None, authorized=False):
    state = episode.require_production(root, 'voice')  # before probe, temp files or connector parser
    root = Path(root)
    mode = state['pipeline']['voice']
    if mode == 'mp3':
        if mp3 is None or words is None or response is not None:
            raise ValueError('mp3 mode requires --mp3 and ready --timings words JSON')
        normalized = timings.normalize(read(words), 'words')
        duration = probe_audio(mp3, mp3=True)
        if normalized['words'][-1]['end'] > duration + .1:
            raise ValueError('word timings exceed audio duration')
        if duration > state['pipeline']['duration'] + .1:
            raise ValueError('audio exceeds episode duration')
        with tempfile.TemporaryDirectory(dir=episode.safe_path(root, 'work')) as tmp:
            staged = Path(tmp)/'voiceover.mp3'
            shutil.copyfile(mp3, staged)
            episode.require_production(root, 'voice')
            os.replace(staged, episode.safe_path(root, 'inputs/voiceover.mp3'))
        episode.write_json(episode.safe_path(root, 'timings.json'), normalized)
        audio = 'inputs/voiceover.mp3'
    elif mode == 'elevenlabs':
        if response is None or mp3 is not None or words is not None:
            raise ValueError('elevenlabs mode requires supplied --response only')
        # Run the existing offline parser in an isolated copy, validating before install.
        if not authorized:
            raise ValueError('explicit authorization for supplied connector response required')
        with tempfile.TemporaryDirectory(dir=episode.safe_path(root, 'work')) as tmp:
            staged = Path(tmp)
            episode.write_json(staged/'episode.yaml', state)
            shutil.copyfile(root/'script.md', staged/'script.md')
            (staged/'media').mkdir()
            (staged/'work').mkdir()
            voice_elevenlabs.import_response(staged, read(response), authorized)
            duration = probe_audio(staged/'media/voice.audio')
            normalized = read(staged/'timings.json')
            if normalized['words'][-1]['end'] > duration + .1:
                raise ValueError('word timings exceed audio duration')
            if duration > state['pipeline']['duration'] + .1:
                raise ValueError('audio exceeds episode duration')
            # Generic supplied codec becomes an ignored .mp3 production input.
            subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(staged/'media/voice.audio'),
                '-vn', '-c:a', 'libmp3lame', str(staged/'voiceover.mp3')], check=True)
            episode.require_production(root, 'voice')
            os.replace(staged/'voiceover.mp3', episode.safe_path(root, 'inputs/voiceover.mp3'))
            episode.write_json(episode.safe_path(root, 'timings.json'), normalized)
        audio = 'inputs/voiceover.mp3'
    else:
        raise ValueError('voice none has no import; output is silent')
    if duration > state['pipeline']['duration'] + .1:
        raise ValueError('audio exceeds episode duration; edit duration before building')
    state = episode.require_production(root, 'voice')
    state['pipeline']['audio'] = audio
    state['pipeline'].pop('build', None)
    state['status'] = 'voice'
    state['history'].append(dict(event='voice_import', at=episode.now(), audio=audio))
    save(root, state)
    return state


def inputs(root, state):
    cfg = state['pipeline']
    content = prepare_page.validate_data(read(episode.safe_path(root, 'content.json')))
    if content['duration'] != cfg['duration']:
        raise ValueError('content duration must equal episode duration')
    files = {'content.json': episode.digest(episode.safe_path(root, 'content.json'))}
    if cfg['voice'] != 'none':
        audio = cfg.get('audio')
        if not audio:
            raise ValueError('import voice and ready word timings first')
        files[audio] = episode.digest(episode.safe_path(root, audio))
        normalized = timings.normalize(read(episode.safe_path(root, 'timings.json')), 'words')
        if normalized['words'][-1]['end'] > cfg['duration']:
            raise ValueError('word timings exceed episode duration')
        files['timings.json'] = episode.digest(episode.safe_path(root, 'timings.json'))
    return dict(script_hash=state['script_hash'], revision=state['revision'],
        config={k: v for k, v in cfg.items() if k not in ('build', 'review_input_hash')}, files=files,
        brand=tree_hash(Path(cfg['brand'])),
        engine={str(p.relative_to(REPO)): episode.digest(p) for p in
                [Path(__file__), Path(episode.__file__), Path(prepare_page.__file__),
                 Path(timings.__file__), Path(voice_elevenlabs.__file__),
                 *sorted((REPO/'engine/render').glob('*.js'))]})


def build(root):
    state = episode.require_production(root, 'render')
    root = Path(root)
    binding = inputs(root, state)  # validation before Node/creating working directories
    cfg = state['pipeline']
    template = 'universal-landscape.html' if cfg['format'] == 'horizontal' else 'universal-vertical.html'
    work = episode.work_dir(root)
    try:
        page = work/'page'
        prepare_page.prepare_page(cfg['brand'], template, page, root/'content.json')
        # Keep the editable trusted template plus prepared HTML, content and brand tokens.
        shutil.copyfile(Path(cfg['brand'])/'templates'/template, page/template)
        shutil.copyfile(root/'script.md', page/'script.md')
        if inputs(root, episode.require_production(root, 'render')) != binding:
            raise ValueError('production inputs changed during build')
        source = episode.safe_path(root, 'source')
        if source.exists():
            shutil.rmtree(source)
        os.replace(page, source)
        state = episode.require_production(root, 'render')
        state['pipeline']['build'] = dict(binding=binding, source=tree_hash(source))
        # Rebuilding changed inputs never preserves a video approval.
        state['approvals'].pop('video', None)
        state['status'] = 'render'
        save(root, state)
    finally:
        shutil.rmtree(work)
    return dict(source=str(root/'source/index.html'), input_hash=checksum(binding))


def checked_build(root, state):
    built = state['pipeline'].get('build')
    if not built or built['binding'] != inputs(root, state):
        raise ValueError('build missing or inputs changed; run build after script approval')
    if tree_hash(episode.safe_path(root, 'source')) != built['source']:
        raise ValueError('source changed; rebuild required')
    return checksum(built)


def render(root, fps=30, chunk_frames=240, resume=False, final60=False):
    state = episode.require_production(root, 'render')
    root = Path(root)
    if final60:
        fps = 60
    if fps not in (30, 60) or chunk_frames < 1:
        raise ValueError('fps must be 30/60 and chunk-frames positive')
    key = checked_build(root, state)
    if fps == 60:
        episode.require_production(root, 'package')
        if state['pipeline'].get('review_input_hash') != key:
            raise ValueError('final60 requires video approval for these exact build inputs')
    # No subprocess, mkdir or output installation above this line (except episode.load invalidation).
    cache = episode.safe_path(root, f'work/render-{key}-{fps}-{chunk_frames}')
    cache.mkdir(parents=True, exist_ok=True)
    version = episode.safe_path(root, 'media/'+uuid4().hex+'.mp4')
    raw = cache/'silent.mp4'
    cfg = state['pipeline']
    width, height = (1920, 1080) if cfg['format'] == 'horizontal' else (1080, 1920)
    env = dict(os.environ, W=str(width), H=str(height),
        HTML_ROOT=str((root/'source').resolve()), RENDER_CACHE_KEY=key)
    env.pop('ALPHA', None)
    command = ['node', str(REPO/'engine/render/render.js'), str((root/'source/index.html').resolve()),
        str(cache.resolve()), '--video', str(raw.resolve()), '--fps', str(fps),
        '--chunk-frames', str(chunk_frames)]
    if resume:
        command.append('--resume')
    try:
        subprocess.run(command, check=True, env=env)
        if cfg['voice'] == 'none':
            shutil.copyfile(raw, version)
        else:
            subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(raw), '-i',
                str(episode.safe_path(root, cfg['audio'])), '-map', '0:v:0', '-map', '1:a:0',
                '-c:v', 'copy', '-af', 'apad,loudnorm=I=-14:TP=-1:LRA=11',
                '-t', str(cfg['duration']), '-c:a', 'aac', '-movflags', '+faststart', str(version)], check=True)
        current = episode.require_production(root, 'render')
        if checked_build(root, current) != key:
            raise ValueError('production inputs changed during render')
        if not version.is_file() or version.stat().st_size == 0:
            raise ValueError('renderer produced no video')
        os.replace(version, episode.safe_path(root, 'media/video.mp4'))
        # load() revokes any previous video approval on new bytes. Never transfer it.
        current = episode.load(root)
        current['approvals'].pop('video', None)
        current['status'] = 'review'
        current['pipeline']['review_input_hash'] = key
        current['history'].append(dict(event='pipeline_render', at=episode.now(), fps=fps,
            input_hash=key, video_hash=episode.digest(root/'media/video.mp4')))
        save(root, current)
    finally:
        version.unlink(missing_ok=True)
    return dict(video=str(root/'media/video.mp4'), status='review', fps=fps,
        audio='silent' if cfg['voice'] == 'none' else 'loudnorm target -14 LUFS; measurement not certified')


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    for name in ('init', 'build', 'voice', 'render'):
        p = sub.add_parser(name)
        p.add_argument('--episode', required=True, type=Path)
        if name == 'init':
            p.add_argument('--id', required=True)
            p.add_argument('--brand', required=True, type=Path)
            p.add_argument('--format', required=True, choices=['horizontal', 'vertical'])
            p.add_argument('--duration', required=True, type=float)
            p.add_argument('--voice', required=True, choices=['none', 'mp3', 'elevenlabs'])
            p.add_argument('--author', required=True)
            p.add_argument('--thread-url')
        if name == 'voice':
            p.add_argument('--mp3', type=Path)
            p.add_argument('--timings', dest='words', type=Path)
            p.add_argument('--response', type=Path)
            p.add_argument('--authorized-connector-response', dest='authorized', action='store_true')
        if name == 'render':
            p.add_argument('--fps', type=int, choices=[30, 60], default=30)
            p.add_argument('--final60', action='store_true')
            p.add_argument('--chunk-frames', type=int, default=240)
            p.add_argument('--resume', action='store_true')
    args = vars(parser.parse_args(argv))
    command = args.pop('command')
    root = args.pop('episode')
    if command == 'init':
        args['episode_id'] = args.pop('id')
    try:
        result = {'init': init, 'build': build, 'voice': import_voice, 'render': render}[command](root, **args)
    except subprocess.CalledProcessError as error:
        parser.exit(error.returncode if error.returncode > 0 else 1, f'error: subprocess failed: {error}\n')
    except (ValueError, OSError, KeyError, TypeError, AttributeError) as error:
        parser.exit(2, f'error: {error}\n')
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
