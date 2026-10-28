import base64
import json
from pathlib import Path
import sys
import subprocess
import os
import tempfile
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1]/'engine/scripts'))
import episode as ep
import voice_elevenlabs as voice


class EpisodeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        self.root = self.base/'episode'
        ep.create(self.root, 'test', 'Sujet français')

    def script(self):
        (self.root/'script.md').write_text('Bonjour le monde.', encoding='utf-8')
        self.assertEqual(ep.load(self.root)['status'], 'script')

    def approve_script(self):
        self.script()
        ep.approve(self.root, 'script', 'Reviewer', True)

    def review(self):
        self.approve_script()
        ep.transition(self.root, 'voice')
        ep.transition(self.root, 'render')
        (self.root/'media/video.mp4').write_bytes(b'test-video-not-real-codec')
        ep.transition(self.root, 'review')

    def test_real_cli(self):
        command = [sys.executable, str(Path(ep.__file__))]
        env = dict(os.environ, PYTHONDONTWRITEBYTECODE='1')
        out = self.base/'cli'
        run = subprocess.run(command+['create', str(out), '--id', 'cli', '--title', 'Test'], capture_output=True, text=True, env=env)
        self.assertEqual(run.returncode, 0, run.stderr)
        self.assertEqual(json.loads(run.stdout)['status'], 'topic')
        run = subprocess.run(command+['transition', str(out), 'voice'], capture_output=True, text=True, env=env)
        self.assertEqual(run.returncode, 2)
        self.assertIn('error:', run.stderr)
        (out/'script.md').write_text('A real script')
        run = subprocess.run(command+['status', str(out)], capture_output=True, text=True, env=env)
        self.assertEqual(json.loads(run.stdout)['status'], 'script')
        run = subprocess.run(command+['approve', str(out), 'script', '--human', 'Reviewer'], capture_output=True, text=True, env=env)
        self.assertEqual(run.returncode, 2)
        self.assertEqual(ep.load(out)['approvals'], {})

    def test_create_default_english_and_separate_work(self):
        state = ep.load(self.root)
        self.assertEqual(state['language'], 'en')
        self.assertEqual(state['status'], 'topic')
        a, b = ep.work_dir(self.root), ep.work_dir(self.root)
        self.assertNotEqual(a, b)
        self.assertTrue(a.is_relative_to(self.root/'work'))

    def test_negative_approvals_and_production(self):
        for action in ('voice', 'render', 'package'):
            with self.assertRaises(ValueError): ep.require_production(self.root, action)
        with self.assertRaises(ValueError): ep.approve(self.root, 'script', 'A', True)
        self.script()
        for human, confirm in [('A', False), (' ', True)]:
            with self.assertRaises(ValueError): ep.approve(self.root, 'script', human, confirm)
        with self.assertRaises(ValueError): ep.transition(self.root, 'script_approved')
        with self.assertRaises(ValueError): ep.transition(self.root, 'voice')
        with self.assertRaises(ValueError): ep.approve(self.root, 'video', 'A', True)

    def test_script_change_invalidates(self):
        self.approve_script()
        ep.require_production(self.root, 'voice')
        (self.root/'script.md').write_text('New script')
        state = ep.load(self.root)
        self.assertEqual(state['approvals'], {})
        self.assertEqual(state['revision'], 3)
        with self.assertRaises(ValueError): ep.require_production(self.root, 'render')

    def test_full_lifecycle_and_video_invalidation(self):
        self.review()
        with self.assertRaises(ValueError): ep.require_production(self.root, 'package')
        ep.approve(self.root, 'video', 'Actual human', True)
        ep.transition(self.root, 'publish_ready')
        ep.transition(self.root, 'published')
        (self.root/'media/video.mp4').write_bytes(b'changed')
        self.assertEqual(ep.load(self.root)['status'], 'review')
        with self.assertRaises(ValueError): ep.require_production(self.root, 'package')

    def test_empty_review_video_rejected(self):
        self.review()
        (self.root/'media/video.mp4').write_bytes(b'')
        with self.assertRaises(ValueError): ep.approve(self.root, 'video', 'A', True)

    def test_version_restore_and_ephemeral_exclusion(self):
        self.review()
        ep.approve(self.root, 'video', 'A', True)
        work = ep.work_dir(self.root)
        (work/'secret.tmp').write_text('ephemeral')
        storage = ep.LocalDirectoryStorage(self.base/'storage')
        version = storage.version(self.root)
        manifest = json.loads((storage.root/version/'manifest.json').read_text())
        self.assertFalse(any(p.startswith('work/') for p in manifest['files']))
        out = self.base/'restore'
        state = storage.restore(version, out)
        self.assertEqual((out/'media/video.mp4').read_bytes(), (self.root/'media/video.mp4').read_bytes())
        self.assertEqual((out/'script.md').read_bytes(), (self.root/'script.md').read_bytes())
        self.assertEqual(state['approvals'], {})
        with self.assertRaises(ValueError): ep.require_production(out, 'voice')
        with self.assertRaises(ValueError): storage.restore(version, out)

    def test_corruption_and_traversal(self):
        self.script()
        storage = ep.LocalDirectoryStorage(self.base/'storage')
        v = storage.version(self.root)
        (storage.root/v/'files/script.md').write_text('corrupt')
        with self.assertRaises(ValueError): storage.restore(v, self.base/'new')
        self.assertFalse((self.base/'new').exists())
        mpath = storage.root/v/'manifest.json'
        m = json.loads(mpath.read_text())
        m['files']['../escape'] = dict(sha256='0'*64, size=0)
        mpath.write_text(json.dumps(m))
        with self.assertRaises(ValueError): storage.restore(v, self.base/'new')
        for rel in ('../escape', '/etc/passwd', 'media/../../escape', 'media\\escape', './script.md'):
            with self.assertRaises(ValueError): ep.safe_path(self.root, rel)
        with self.assertRaises(ValueError): storage.restore('../bad', self.base/'new')

    def test_symlink_rejected(self):
        (self.root/'media/link').symlink_to(self.base)
        with self.assertRaises(ValueError): ep.LocalDirectoryStorage(self.base/'storage').version(self.root)
        with self.assertRaises(ValueError): ep.safe_path(self.root, 'media/link/out')

    def test_connector_gates_and_parser(self):
        response = dict(audio_base64=base64.b64encode(b'fake-audio').decode(), alignment=dict(characters=['H','i'], character_start_times_seconds=[0, .1], character_end_times_seconds=[.1,.2]))
        with self.assertRaises(ValueError): voice.import_response(self.root, response, True)
        self.approve_script()
        with self.assertRaises(ValueError): voice.import_response(self.root, response)
        voice.import_response(self.root, response, True)
        self.assertEqual((self.root/'media/voice.audio').read_bytes(), b'fake-audio')
        self.assertEqual(list((self.root/'work').iterdir()), [])
        for bad in ('!!!', ''):
            with self.assertRaises(ValueError): voice.import_response(self.root, dict(response, audio_base64=bad), True)


if __name__ == '__main__': unittest.main()
