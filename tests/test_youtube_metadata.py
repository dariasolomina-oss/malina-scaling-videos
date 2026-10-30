"""Offline stdlib tests. Approvals below are TEST FIXTURE approvals, never real ones."""
import copy
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'engine/scripts'))
import episode as ep
import youtube_metadata as ym


class MetadataTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        self.root = self.base / 'episode'
        ep.create(self.root, 'fixture', 'TEST FIXTURE')
        (self.root / 'script.md').write_text('TEST FIXTURE: LakeSentry detects data drift.', encoding='utf-8')
        ep.load(self.root)
        ep.approve(self.root, 'script', 'TEST FIXTURE ONLY', True)
        ep.transition(self.root, 'voice')
        ep.transition(self.root, 'render')
        (self.root / 'media/video.mp4').write_bytes(b'TEST FIXTURE video bytes, not a real codec')
        ep.transition(self.root, 'review')
        ep.approve(self.root, 'video', 'TEST FIXTURE ONLY', True)
        self.metadata = dict(title='LakeSentry: data drift detection', description='How LakeSentry detects data drift.\nA demonstration.',
                             language='en', primary_keyword='data drift', alternative_titles=['Detect data drift with LakeSentry', 'LakeSentry drift demonstration'],
                             evidence=[dict(claim='LakeSentry detects data drift', references=['script.md: first sentence'])],
                             notes=['Human must verify evidence coverage.'], script_hash=ep.digest(self.root / 'script.md'),
                             video_hash=ep.digest(self.root / 'media/video.mp4'))

    def test_export_and_idempotency(self):
        state = (self.root / 'episode.yaml').read_bytes()
        self.assertEqual(ym.export(self.root, self.metadata)['result'], 'exported')
        paths = [self.root / 'publish' / name for name in ('youtube.json', 'youtube.md')]
        before = [(p.read_bytes(), p.stat().st_mtime_ns) for p in paths]
        self.assertEqual(ym.export(self.root, self.metadata)['result'], 'unchanged')
        self.assertEqual(before, [(p.read_bytes(), p.stat().st_mtime_ns) for p in paths])
        payload = json.loads(paths[0].read_text())
        self.assertTrue(payload['human_review_required'])
        self.assertEqual(payload['metadata'], self.metadata)
        self.assertEqual(payload['checksums']['youtube_md_sha256'], ep.digest(paths[1]))
        self.assertTrue(ym.check(self.root)['ok'])
        self.assertEqual(state, (self.root / 'episode.yaml').read_bytes())

    def test_missing_approvals_before_mkdir(self):
        state = ep.load(self.root)
        for kind in ('script', 'video'):
            changed = copy.deepcopy(state)
            del changed['approvals'][kind]
            ep.write_json(self.root / 'episode.yaml', changed)
            with mock.patch.object(Path, 'mkdir', side_effect=AssertionError('mkdir before guard')):
                with self.assertRaises(ValueError):
                    ym.export(self.root, self.metadata)
        self.assertFalse((self.root / 'publish').exists())

    def test_status_restrictions(self):
        state = ep.load(self.root)
        for status in ('review', 'published'):
            state['status'] = status
            ep.write_json(self.root / 'episode.yaml', state)
            with self.assertRaises(ValueError):
                ym.export(self.root, self.metadata)
        state['status'] = 'publish_ready'
        ep.write_json(self.root / 'episode.yaml', state)
        ym.export(self.root, self.metadata)
        self.assertEqual(ep.load(self.root)['status'], 'publish_ready')

    def test_changed_assets_invalidate(self):
        for relative in ('script.md', 'media/video.mp4'):
            with self.subTest(relative=relative):
                path = self.root / relative
                original = path.read_bytes()
                state = (self.root / 'episode.yaml').read_bytes()
                path.write_bytes(original + b' changed')
                with self.assertRaises(ValueError):
                    ym.export(self.root, self.metadata)
                self.assertFalse((self.root / 'publish').exists())
                path.write_bytes(original)
                (self.root / 'episode.yaml').write_bytes(state)

    def test_stale_generator_hashes(self):
        for key in ('video_hash', 'script_hash'):
            metadata = dict(self.metadata, **{key: '0' * 64})
            with self.assertRaisesRegex(ValueError, 'stale generator'):
                ym.export(self.root, metadata)
        self.assertFalse((self.root / 'publish').exists())

    def test_invalid_fields(self):
        cases = [('title', ''), ('description', ' '), ('title', 'x' * 101), ('description', 'x' * 5001),
                 ('title', 'TODO'), ('description', 'TBD later'), ('title', '<title>'),
                 ('description', '{{description}}'), ('language', '\x00'), ('title', 'Hi\nthere'),
                 ('description', 'Hi\rthere'), ('primary_keyword', 'a\u202eb'), ('video_hash', None),
                 ('script_hash', 'no'), ('evidence', []), ('evidence', [{'claim': 'Claim', 'references': []}]),
                 ('alternative_titles', ['only one']), ('notes', ['TODO'])]
        for field, value in cases:
            with self.subTest(field=field, value=value):
                metadata = dict(self.metadata, **{field: value})
                with self.assertRaises(ValueError):
                    ym.export(self.root, metadata)
        self.assertFalse((self.root / 'publish').exists())

    def test_exact_limits_and_optional_fields(self):
        metadata = dict(self.metadata, title='x' * 100, description='x' * 5000)
        del metadata['alternative_titles']
        del metadata['notes']
        ym.export(self.root, metadata)
        self.assertTrue(ym.check(self.root)['ok'])

    def test_symlinks(self):
        outside = self.base / 'outside'
        outside.mkdir()
        publish = self.root / 'publish'
        publish.symlink_to(outside, target_is_directory=True)
        with self.assertRaises(ValueError):
            ym.export(self.root, self.metadata)
        publish.unlink()
        publish.mkdir()
        for name in ('youtube.json', 'youtube.md'):
            path = publish / name
            path.symlink_to(outside / 'target')
            with self.assertRaises(ValueError):
                ym.export(self.root, self.metadata)
            path.unlink()
        self.assertEqual(list(outside.iterdir()), [])
        script = self.root / 'script.md'
        target = outside / 'script.md'
        target.write_bytes(script.read_bytes())
        script.unlink()
        script.symlink_to(target)
        with self.assertRaises(ValueError):
            ym.export(self.root, self.metadata)

    def test_metadata_and_episode_root_symlinks(self):
        source = self.base / 'metadata.json'
        source.write_text(json.dumps(self.metadata))
        link = self.base / 'link.json'
        link.symlink_to(source)
        with self.assertRaises(ValueError):
            ym._read_metadata(link)
        root_link = self.base / 'root-link'
        root_link.symlink_to(self.root, target_is_directory=True)
        with self.assertRaises(ValueError):
            ym.export(root_link, self.metadata)

    def test_recheck_before_install(self):
        original = ym._snapshot
        calls = []
        def changing(root):
            calls.append(root)
            if len(calls) == 2:
                (self.root / 'media/video.mp4').write_bytes(b'changed during preparation')
            return original(root)
        with mock.patch.object(ym, '_snapshot', side_effect=changing):
            with self.assertRaises(ValueError):
                ym.export(self.root, self.metadata)
        self.assertEqual(list((self.root / 'publish').iterdir()), [])

    def test_check_stale_and_no_output_mutation(self):
        ym.export(self.root, self.metadata)
        files = {p: p.read_bytes() for p in (self.root / 'publish').iterdir()}
        (self.root / 'media/video.mp4').write_bytes(b'changed after export')
        self.assertFalse(ym.check(self.root)['ok'])
        self.assertEqual(ep.load(self.root)['status'], 'review')
        self.assertEqual(files, {p: p.read_bytes() for p in files})

    def test_check_tamper_and_missing(self):
        self.assertFalse(ym.check(self.root)['ok'])
        self.assertFalse((self.root / 'publish').exists())
        ym.export(self.root, self.metadata)
        path = self.root / 'publish/youtube.md'
        path.write_text('tampered')
        self.assertFalse(ym.check(self.root)['ok'])
        ym.export(self.root, self.metadata)
        path = self.root / 'publish/youtube.json'
        payload = json.loads(path.read_text())
        payload['checksums']['metadata_sha256'] = '0' * 64
        path.write_text(json.dumps(payload))
        self.assertFalse(ym.check(self.root)['ok'])

    def test_cli(self):
        source = self.base / 'metadata.json'
        source.write_text(json.dumps(self.metadata), encoding='utf-8')
        command = [sys.executable, str(Path(ym.__file__))]
        env = dict(os.environ, PYTHONDONTWRITEBYTECODE='1')
        for args in (['export', str(self.root), '--metadata', str(source)], ['check', str(self.root)]):
            result = subprocess.run(command + args, capture_output=True, text=True, env=env)
            self.assertEqual(result.returncode, 0, result.stderr)
        (self.root / 'media/video.mp4').write_bytes(b'changed')
        result = subprocess.run(command + ['check', str(self.root)], capture_output=True, text=True, env=env)
        self.assertEqual(result.returncode, 2)
        self.assertFalse(json.loads(result.stdout)['ok'])


if __name__ == '__main__':
    unittest.main()
