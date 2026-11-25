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
    def fake_animatic_run(command, **kwargs):
        # Stand-ins for the browser and ffmpeg: NOT browser evidence.
        if command[0] == 'node':
            out = Path(command[3]); out.mkdir(parents=True, exist_ok=True)
            for t in command[5:]:
                (out/f't_{float(t):.2f}.jpg').write_bytes(b'still')
        else:
            Path(command[-1]).write_bytes(b'image')
        return subprocess.CompletedProcess(command, 0)

    def approve_animatic(self):
        with patch.object(pipeline.subprocess, 'run', side_effect=self.fake_animatic_run):
            pipeline.animatic(self.root)
        episode.approve(self.root, 'animatic', 'TEST FIXTURE', True)

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
        for format in ('horizontal', 'vertical', 'square'):
            with self.subTest(format=format):
                self.root = self.base/format
                self.create(format=format)
                self.approve_script()
                pipeline.build(self.root)
                self.assertTrue((self.root/'source/assets/fonts/Outfit[wght].ttf').is_file())
                self.assertIn('window.PAGE_DATA', (self.root/'source/index.html').read_text())
                self.assertEqual((self.root/'source/script.md').read_bytes(), (self.root/'script.md').read_bytes())
                self.assertTrue((self.root/'source/brand.json').exists())

    def test_cover_requires_build_and_uses_cover_sizes(self):
        self.create()
        with patch.object(pipeline.subprocess, 'run') as run:
            with self.assertRaisesRegex(ValueError, 'script approval'):
                pipeline.cover(self.root)
            run.assert_not_called()
        self.approve_script()
        with patch.object(pipeline.subprocess, 'run') as run:
            with self.assertRaisesRegex(ValueError, 'build missing'):
                pipeline.cover(self.root)
            run.assert_not_called()
        pipeline.build(self.root)
        calls = []
        def fake(command, **kwargs):
            calls.append((command, kwargs.get('env', {})))
            if command[0] == 'node':
                out = Path(command[3]); out.mkdir(parents=True, exist_ok=True)
                (out/f't_{float(command[5]):.2f}.jpg').write_bytes(b'still')
            else:
                Path(command[-1]).write_bytes(b'cover')
            return subprocess.CompletedProcess(command, 0)
        with patch.object(pipeline.subprocess, 'run', side_effect=fake):
            result = pipeline.cover(self.root)
        self.assertEqual(result['size'], [1280, 720])
        self.assertEqual((calls[0][1]['W'], calls[0][1]['H']), ('1920', '1080'))
        self.assertIn('scale=1280:720:flags=lanczos', calls[1][0])
        self.assertTrue((self.root/'media/cover.jpg').is_file())
        self.assertEqual(episode.load(self.root)['history'][-1]['event'], 'pipeline_cover')
        self.assertFalse(list((self.root/'work').glob('cover-*')) if (self.root/'work').exists() else [])
        with self.assertRaisesRegex(ValueError, 'within the video duration'):
            pipeline.cover(self.root, at=99)

    def test_default_cover_time_uses_title_scene(self):
        content = {'layout': 'scenes', 'duration': 8, 'scenes': [
            {'id': 'k', 'kind': 'kpi', 'start': 0, 'end': 2},
            {'id': 't', 'kind': 'title', 'start': 2, 'end': 4}]}
        self.assertEqual(pipeline.default_cover_time(content), 3)
        self.assertEqual(pipeline.default_cover_time({'duration': 1}), 0.5)

    def test_square_render_uses_square_viewport(self):
        self.root = self.base/'square'
        self.create(format='square')
        self.approve_script()
        pipeline.build(self.root)
        self.assertEqual(json.loads((self.root/'source/build.json').read_text())['viewport'], [1080, 1080])
        self.approve_animatic()
        with patch.object(pipeline.subprocess, 'run', side_effect=self.fake_node) as run:
            pipeline.render(self.root)
            command = run.call_args.args[0]
            self.assertIn('--fps', command)
        self.assertTrue((self.root/'media/video.mp4').is_file())

    def test_build_multi_scene_uses_shared_template(self):
        self.create(format='vertical')
        self.approve_script()
        content = pipeline.read(self.root/'content.json')
        content.update({
            'layout': 'scenes',
            'scenes': [
                {'id': 'intro', 'kind': 'title', 'start': 0, 'end': .4, 'title': 'Problem'},
                {'id': 'result', 'kind': 'screen', 'start': .4, 'end': .8, 'title': 'Result',
                 'src': 'assets/episode/capture.mp4'},
                {'id': 'cta', 'kind': 'cta', 'start': .8, 'end': 1, 'title': 'Try it'},
            ],
        })
        (self.root/'inputs/capture.mp4').write_bytes(b'fixture capture, not a real video')
        episode.write_json(self.root/'content.json', content)
        pipeline.build(self.root)
        source = (self.root/'source/index.html').read_text()
        self.assertIn("scene.kind==='screen'", source)
        self.assertEqual((self.root/'source/assets/episode/capture.mp4').read_bytes(), b'fixture capture, not a real video')
        build = json.loads((self.root/'source/build.json').read_text())
        self.assertEqual(build['template'], 'video-scenes.html')
        # Episode format drives scene geometry: vertical scenes get the Shorts safe zone.
        self.assertEqual(build['viewport'], [1080, 1920])
        self.assertEqual(build['format_policy']['id'], 'shorts')
        self.assertIn('--shorts-top', source)

    def test_multi_scene_format_must_match_episode(self):
        self.create(format='vertical')
        self.approve_script()
        content = pipeline.read(self.root/'content.json')
        content.update({'layout': 'scenes', 'format': 'square', 'scenes': [
            {'id': 'intro', 'kind': 'title', 'start': 0, 'end': 1, 'title': 'Problem'}]})
        episode.write_json(self.root/'content.json', content)
        with self.assertRaisesRegex(ValueError, 'format must match'):
            pipeline.build(self.root)

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

    def test_render_requires_approved_animatic_then_final(self):
        self.ready()
        with patch.object(pipeline.subprocess, 'run') as run:
            for kwargs in ({}, {'final60': True}):
                with self.assertRaisesRegex(ValueError, 'animatic approval'):
                    pipeline.render(self.root, **kwargs)
            run.assert_not_called()
        with self.assertRaisesRegex(ValueError, 'build the animatic'):
            episode.approve(self.root, 'animatic', 'TEST FIXTURE', True)
        with patch.object(pipeline.subprocess, 'run', side_effect=self.fake_animatic_run):
            result = pipeline.animatic(self.root)
        self.assertTrue((self.root/'animatic/index.html').is_file())
        self.assertTrue((self.root/'animatic/source/index.html').is_file())
        self.assertTrue((self.root/'media/animatic-sheet.jpg').is_file())
        self.assertTrue((self.root/'media/animatic.mp4').is_file())
        self.assertIn('frame_step', result)
        info = json.loads((self.root/'animatic/animatic.json').read_text())
        self.assertEqual(info['viewport'], [1920, 1080])
        self.assertIsNone(info['audio'])
        self.assertEqual(len(info['scenes']), result['scenes'])
        self.assertEqual(episode.load(self.root)['status'], 'render')
        with patch.object(pipeline.subprocess, 'run') as run:
            with self.assertRaisesRegex(ValueError, 'animatic approval'):
                pipeline.render(self.root, final60=True)
            run.assert_not_called()
        episode.approve(self.root, 'animatic', 'TEST FIXTURE', True)
        state = episode.load(self.root)
        self.assertEqual(state['status'], 'render')
        # Straight to the 60 fps final: no preview render needed.
        with patch.object(pipeline.subprocess, 'run', side_effect=self.fake_node) as run:
            pipeline.render(self.root, final60=True, chunk_frames=15, resume=True)
            command = run.call_args.args[0]
            self.assertEqual(command[command.index('--fps')+1], '60')
            self.assertIn('--resume', command)
        state = episode.load(self.root)
        self.assertEqual(state['status'], 'review')
        self.assertEqual(state['history'][-1]['fps'], 60)
        episode.approve(self.root, 'video', 'TEST FIXTURE', True)
        self.assertEqual(episode.load(self.root)['status'], 'video_approved')

    def test_changed_inputs_need_new_animatic_approval(self):
        self.ready()
        self.approve_animatic()
        data = pipeline.read(self.root/'content.json')
        data['headline'] = 'Changed headline'
        episode.write_json(self.root/'content.json', data)
        pipeline.build(self.root)
        with patch.object(pipeline.subprocess, 'run') as run:
            with self.assertRaisesRegex(ValueError, 'animatic approval'):
                pipeline.render(self.root, final60=True)
            run.assert_not_called()
        # The old animatic no longer matches the build and cannot be approved.
        with self.assertRaisesRegex(ValueError, 'out of date'):
            episode.approve(self.root, 'animatic', 'TEST FIXTURE', True)
        self.approve_animatic()
        with patch.object(pipeline.subprocess, 'run', side_effect=self.fake_node):
            pipeline.render(self.root, final60=True)
        # A changed script drops every approval, the animatic one included.
        (self.root/'script.md').write_text('Changed script.\n', encoding='utf-8')
        self.assertEqual(episode.load(self.root)['approvals'], {})

    def test_animatic_points_per_scene_or_evenly_spaced(self):
        content = {'layout': 'scenes', 'duration': 8, 'scenes': [
            {'id': 'a', 'kind': 'title', 'title': 'Intro', 'start': 0, 'end': 2},
            {'id': 'b', 'kind': 'kpi', 'title': 'Number', 'start': 2, 'end': 8}]}
        self.assertEqual([p['at'] for p in pipeline.animatic_points(content)], [1, 5])
        self.assertEqual(pipeline.animatic_points(content)[1]['label'], 'Number')
        long = pipeline.animatic_points({'duration': 480})
        self.assertEqual(len(long), 48)
        self.assertEqual(long[-1]['end'], 480)
        self.assertLessEqual(len(pipeline.animatic_points({'duration': 3600})), pipeline.ANIMATIC_MAX_STILLS)
        times, step = pipeline.animatic_timeline(480)
        self.assertEqual((len(times), step, times[1]), (240, 2.0, 2.0))
        times, step = pipeline.animatic_timeline(3600)
        self.assertLessEqual(len(times), pipeline.ANIMATIC_MAX_FRAMES)
        self.assertEqual(pipeline.animatic_timeline(1)[0], [0])
        self.assertEqual(pipeline.animatic_sample(12, 2, 480), 13)
        self.assertEqual(pipeline.animatic_sample(0, 2, 1), 0.999)

    def test_node_failure_is_not_masked_or_installed(self):
        self.ready()
        self.approve_animatic()
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
        self.approve_animatic()
        self.assertEqual(json.loads((self.root/'animatic/animatic.json').read_text())['audio'], 'audio.mp3')
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
