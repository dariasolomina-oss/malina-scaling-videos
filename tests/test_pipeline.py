import base64
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'engine/scripts'))
import episode
import pipeline


class PipelineTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.base = Path(self.tmp.name)
        self.root = self.base/'ep'

    def create(self, mode='none', format='horizontal'):
        return pipeline.init(self.root, 'test', ROOT/'brands/lakesentry', format,
                             1, mode, 'Test author', 'https://example.test/thread')

    def approve_script(self):
        # Synthetic approval only in temporary test fixtures, not a real production approval.
        (self.root/'script.md').write_text('Bonjour LakeSentry.\n', encoding='utf-8')
        episode.load(self.root)
        episode.approve(self.root, 'script', 'TEST FIXTURE', True)

    def ready(self):
        self.create()
        self.approve_script()
        pipeline.build(self.root)  # real prepare_page + Node CSS, no browser

    @staticmethod
    def fake_node(command, **kwargs):
        if command[0] != 'node' or not command[1].endswith('render.js'):
            raise AssertionError(command)
        Path(command[command.index('--video')+1]).write_bytes(b'mocked video, NOT browser evidence')
        return subprocess.CompletedProcess(command, 0)

    def test_init_cli_en_metadata_and_single_state(self):
        result = subprocess.run([sys.executable, str(ROOT/'engine/scripts/pipeline.py'),
            'init', '--episode', str(self.root), '--id', 'fr-test', '--brand',
            str(ROOT/'brands/lakesentry'), '--format', 'vertical', '--duration', '1',
            '--voice', 'none', '--author', 'Auteur'], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        state = episode.load(self.root)
        self.assertEqual(state['metadata']['language'], 'en')
        self.assertEqual(state['branch']['format'], 'vertical')
        self.assertEqual(state['approvals'], {})
        self.assertEqual(state['status'], 'script')
        self.assertEqual(list(self.root.glob('*.yaml')), [self.root/'episode.yaml'])

    def test_guard_before_subprocess_and_work_effects(self):
        self.create('mp3')
        before = sorted(str(p.relative_to(self.root)) for p in self.root.rglob('*'))
        with patch.object(pipeline.subprocess, 'run') as run:
            for operation in (lambda: pipeline.build(self.root),
                              lambda: pipeline.render(self.root),
                              lambda: pipeline.render(self.root, final60=True),
                              lambda: pipeline.import_voice(self.root, mp3='missing', words='missing')):
                with self.assertRaisesRegex(ValueError, 'script approval'):
                    operation()
            run.assert_not_called()
        self.assertEqual(before, sorted(str(p.relative_to(self.root)) for p in self.root.rglob('*')))

    def test_script_change_invalidates_before_node(self):
        self.ready()
        (self.root/'script.md').write_text('Changed script')
        with patch.object(pipeline.subprocess, 'run') as run:
            with self.assertRaisesRegex(ValueError, 'script approval'):
                pipeline.render(self.root)
            run.assert_not_called()
        self.assertEqual(episode.load(self.root)['approvals'], {})

    def test_build_self_contained_both_formats(self):
        for format in ('horizontal', 'vertical'):
            with self.subTest(format=format):
                self.root = self.base/format
                self.create(format=format)
                self.approve_script()
                pipeline.build(self.root)
                self.assertTrue((self.root/'source/assets/fonts/Outfit[wght].ttf').is_file())
                self.assertIn('window.PAGE_DATA', (self.root/'source/index.html').read_text())
                self.assertEqual((self.root/'source/script.md').read_bytes(), (self.root/'script.md').read_bytes())
                self.assertTrue((self.root/'source/brand.json').exists())

    def test_content_source_and_config_changes_block_before_node(self):
        self.ready()
        paths = [self.root/'content.json', self.root/'source/index.html']
        for path in paths:
            original = path.read_bytes()
            path.write_bytes(original+b' ')
            with patch.object(pipeline.subprocess, 'run') as run:
                with self.assertRaisesRegex(ValueError, 'changed'):
                    pipeline.render(self.root)
                run.assert_not_called()
            path.write_bytes(original)
        state = episode.load(self.root)
        state['pipeline']['format'] = 'vertical'
        episode.write_json(self.root/'episode.yaml', state)
        with patch.object(pipeline.subprocess, 'run') as run:
            with self.assertRaisesRegex(ValueError, 'changed'):
                pipeline.render(self.root)
            run.assert_not_called()

    def test_brand_mutation_blocks_before_node(self):
        brand = self.base/'brand'
        shutil.copytree(ROOT/'brands/lakesentry', brand)
        pipeline.init(self.root, 'test', brand, 'horizontal', 1, 'none', 'Tester')
        self.approve_script()
        pipeline.build(self.root)
        with (brand/'brand.json').open('a') as stream:
            stream.write(' ')
        with patch.object(pipeline.subprocess, 'run') as run:
            with self.assertRaisesRegex(ValueError, 'changed'):
                pipeline.render(self.root)
            run.assert_not_called()

    def test_mock_node_draft_final_and_new_approval_required(self):
        self.ready()
        with patch.object(pipeline.subprocess, 'run') as run:
            with self.assertRaisesRegex(ValueError, 'video approval'):
                pipeline.render(self.root, final60=True)
            run.assert_not_called()
        with patch.object(pipeline.subprocess, 'run', side_effect=self.fake_node) as run:
            result = pipeline.render(self.root, chunk_frames=15, resume=True)
            command = run.call_args.args[0]
            self.assertIn('--resume', command)
            self.assertEqual(command[command.index('--fps')+1], '30')
            self.assertEqual(command[command.index('--chunk-frames')+1], '15')
            self.assertEqual(result['audio'], 'silent')
        self.assertEqual(episode.load(self.root)['status'], 'review')
        episode.approve(self.root, 'video', 'TEST FIXTURE', True)
        with patch.object(pipeline.subprocess, 'run', side_effect=self.fake_node):
            pipeline.render(self.root, final60=True)
        state = episode.load(self.root)
        self.assertEqual(state['status'], 'review')
        self.assertNotIn('video', state['approvals'])
        self.assertEqual(state['history'][-1]['fps'], 60)

    def test_node_failure_is_not_masked_or_installed(self):
        self.ready()
        with patch.object(pipeline.subprocess, 'run', side_effect=subprocess.CalledProcessError(17, ['node'])):
            with self.assertRaises(subprocess.CalledProcessError) as caught:
                pipeline.render(self.root)
        self.assertEqual(caught.exception.returncode, 17)
        self.assertFalse((self.root/'media/video.mp4').exists())
        self.assertNotEqual(episode.load(self.root)['status'], 'review')

    def test_missing_build_and_invalid_content_before_node(self):
        self.create()
        self.approve_script()
        with patch.object(pipeline.subprocess, 'run') as run:
            with self.assertRaisesRegex(ValueError, 'build missing'):
                pipeline.render(self.root)
            data = pipeline.read(self.root/'content.json')
            data['html'] = '<script>bad</script>'
            episode.write_json(self.root/'content.json', data)
            with self.assertRaisesRegex(ValueError, 'Unknown content keys'):
                pipeline.build(self.root)
            run.assert_not_called()

    @unittest.skipUnless(shutil.which('ffmpeg') and shutil.which('ffprobe'), 'requires real ffmpeg/ffprobe')
    def test_real_mp3_probe_and_ready_words_required(self):
        self.create('mp3')
        self.approve_script()
        audio = self.base/'speech.mp3'
        subprocess.run(['ffmpeg', '-v', 'error', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=0.5',
                        '-c:a', 'libmp3lame', str(audio)], check=True)
        words = self.base/'words.json'
        episode.write_json(words, {'words': [{'text': 'Bonjour', 'start': 0, 'end': .4}]})
        with self.assertRaisesRegex(ValueError, 'ready'):
            pipeline.import_voice(self.root, mp3=audio)
        pipeline.import_voice(self.root, mp3=audio, words=words)
        self.assertEqual((self.root/'inputs/voiceover.mp3').read_bytes(), audio.read_bytes())
        self.assertEqual(pipeline.read(self.root/'timings.json')['source'], 'words')
        pipeline.build(self.root)
        with (self.root/'inputs/voiceover.mp3').open('ab') as stream:
            stream.write(b'changed')
        with patch.object(pipeline.subprocess, 'run') as run:
            with self.assertRaisesRegex(ValueError, 'changed'):
                pipeline.render(self.root)
            run.assert_not_called()
        wav = self.base/'renamed.mp3'
        subprocess.run(['ffmpeg', '-v', 'error', '-f', 'lavfi', '-i', 'sine=duration=0.5',
                        '-f', 'wav', str(wav)], check=True)
        with self.assertRaisesRegex(ValueError, 'actual MP3'):
            pipeline.import_voice(self.root, mp3=wav, words=words)
        bad = self.base/'bad.mp3'
        bad.write_bytes(b'not audio')
        with self.assertRaises(subprocess.CalledProcessError):
            pipeline.import_voice(self.root, mp3=bad, words=words)

    @unittest.skipUnless(shutil.which('ffmpeg') and shutil.which('ffprobe'), 'requires real ffmpeg/ffprobe')
    def test_elevenlabs_offline_import_and_real_audio_mux_mock_node(self):
        self.create('elevenlabs')
        self.approve_script()
        audio = self.base/'provided.mp3'
        subprocess.run(['ffmpeg', '-v', 'error', '-f', 'lavfi', '-i', 'sine=duration=0.5',
                        '-c:a', 'libmp3lame', str(audio)], check=True)
        response = self.base/'connector.json'
        episode.write_json(response, dict(audio_base64=base64.b64encode(audio.read_bytes()).decode(),
            alignment=dict(characters=['B', 'o', 'n'],
                character_start_times_seconds=[0, .1, .2], character_end_times_seconds=[.1, .2, .3])))
        pipeline.import_voice(self.root, response=response, authorized=True)
        self.assertTrue((self.root/'inputs/voiceover.mp3').is_file())
        self.assertEqual(pipeline.read(self.root/'timings.json')['source'], 'elevenlabs')
        pipeline.build(self.root)
        real_run = subprocess.run

        def node_stub(command, **kwargs):
            if command[0] == 'node':
                # This is a tiny FFmpeg fixture, NOT a browser/template render.
                dest = command[command.index('--video')+1]
                return real_run(['ffmpeg', '-v', 'error', '-f', 'lavfi', '-i',
                    'color=c=white:s=64x64:r=30:d=1', '-c:v', 'libx264', '-pix_fmt',
                    'yuv420p', dest], check=True)
            return real_run(command, **kwargs)

        with patch.object(pipeline.subprocess, 'run', side_effect=node_stub):
            pipeline.render(self.root)
        self.assertGreater(pipeline.probe_audio(self.root/'media/video.mp4'), 0)
        self.assertEqual(episode.load(self.root)['status'], 'review')

    def test_elevenlabs_requires_explicit_authorization(self):
        self.create('elevenlabs')
        self.approve_script()
        response = self.base/'connector.json'
        episode.write_json(response, {})
        with self.assertRaisesRegex(ValueError, 'authorization'):
            pipeline.import_voice(self.root, response=response)
        self.assertFalse((self.root/'media/voice.audio').exists())


if __name__ == '__main__':
    unittest.main()
