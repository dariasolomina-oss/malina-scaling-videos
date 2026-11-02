"""Offline policy tests; all approvals here are synthetic test fixtures."""
import copy
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'engine/scripts'))
import episode
import language_policy as policy
import pipeline
import prepare_page
import youtube_metadata

NON_LATIN = '\u041f\u0440\u0438\u0432\u0435\u0442'


class LanguagePolicyTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        self.root = self.base / 'episode'

    def approved(self, mode='none'):
        pipeline.init(self.root, 'fixture', ROOT / 'brands/lakesentry',
                      'horizontal', 1, mode, '\u674e Reviewer')
        (self.root / 'script.md').write_text('Review the workload with LakeSentry.\n', encoding='utf-8')
        episode.load(self.root)
        episode.approve(self.root, 'script', '\u674e Reviewer', True)

    def snapshot(self):
        return {str(p.relative_to(self.root)): p.read_bytes()
                for p in self.root.rglob('*') if p.is_file()}

    def metadata(self):
        return dict(title='LakeSentry workload review', description='Review the workload.',
                    language='en', primary_keyword='workload', alternative_titles=[],
                    evidence=[dict(claim='A workload review', references=['https://example.test/' + NON_LATIN])],
                    video_hash='0' * 64, script_hash='0' * 64)

    def test_exact_declared_language_before_creation(self):
        for language in ('fr', 'ru', 'EN', 'en-US', 'en ', '', None):
            with self.subTest(language=language):
                with patch.object(Path, 'mkdir', side_effect=AssertionError('directory creation')):
                    with self.assertRaisesRegex(ValueError, "exact 'en'"):
                        episode.create(self.root, 'fixture', 'English topic', language)
                self.assertFalse(self.root.exists())

    def test_tampered_language_fails_before_state_update_or_production(self):
        self.approved('mp3')
        state = episode.load(self.root)
        state['language'] = 'fr'
        episode.write_json(self.root / 'episode.yaml', state)
        # A script edit must not cause load() to rewrite this invalid state.
        (self.root / 'script.md').write_text('Changed English script.', encoding='utf-8')
        before = self.snapshot()
        with patch.object(pipeline.subprocess, 'run') as run, patch.object(Path, 'mkdir', side_effect=AssertionError('mkdir')):
            for operation in (lambda: episode.load(self.root), lambda: episode.work_dir(self.root),
                              lambda: pipeline.build(self.root), lambda: pipeline.render(self.root),
                              lambda: pipeline.import_voice(self.root, mp3='missing', words='missing'),
                              lambda: youtube_metadata.export(self.root, self.metadata())):
                with self.assertRaisesRegex(ValueError, "exact 'en'"):
                    operation()
            run.assert_not_called()
        self.assertEqual(before, self.snapshot())

    def test_legacy_approved_non_latin_script_fails_without_translation(self):
        self.approved()
        state = episode.load(self.root)
        (self.root / 'script.md').write_text(NON_LATIN, encoding='utf-8')
        # Simulate a historical approval already bound to non-English bytes.
        state['script_hash'] = episode.digest(self.root / 'script.md')
        state['approvals']['script']['script_hash'] = state['script_hash']
        episode.write_json(self.root / 'episode.yaml', state)
        before = self.snapshot()
        with patch.object(pipeline.subprocess, 'run') as run:
            for action in ('voice', 'render', 'package'):
                with self.assertRaisesRegex(ValueError, 'non-Latin'):
                    episode.require_production(self.root, action)
            with self.assertRaisesRegex(ValueError, 'non-Latin'):
                pipeline.build(self.root)
            run.assert_not_called()
        self.assertEqual(before, self.snapshot())

    def test_script_approval_blocks_non_latin_but_not_legal_author_name(self):
        self.approved()
        (self.root / 'script.md').write_text(NON_LATIN, encoding='utf-8')
        episode.load(self.root)
        with self.assertRaisesRegex(ValueError, 'Semantic English review'):
            episode.approve(self.root, 'script', '\u674e Reviewer', True)
        self.assertFalse(episode.load(self.root)['approvals'])

    def test_static_content_all_prose_fields_before_writes(self):
        data = dict(headline='Workload review', subtitle='English overview', footer='Editorial demo',
                    blocks=[dict(title='Outfit', body='Review the workload.')])
        for field in ('headline', 'subtitle', 'footer', 'title', 'body'):
            bad = copy.deepcopy(data)
            if field in ('title', 'body'):
                bad['blocks'][0][field] = NON_LATIN
            else:
                bad[field] = NON_LATIN
            with self.subTest(field=field), patch.object(prepare_page.subprocess, 'run') as run:
                with self.assertRaisesRegex(ValueError, 'non-Latin'):
                    prepare_page.prepare_page(ROOT / 'brands/lakesentry', 'universal-landscape.html', self.base / 'page', bad)
                run.assert_not_called()
                self.assertFalse((self.base / 'page').exists())
        self.assertEqual(prepare_page.validate_data(data)['headline'], 'Workload review')

    def test_metadata_fields_and_language_before_export_writes(self):
        self.approved()
        episode.transition(self.root, 'voice')
        episode.transition(self.root, 'render')
        (self.root / 'media/video.mp4').write_bytes(b'fixture, not video evidence')
        episode.transition(self.root, 'review')
        episode.approve(self.root, 'video', 'Reviewer', True)
        metadata = self.metadata()
        metadata.update(script_hash=episode.digest(self.root / 'script.md'),
                        video_hash=episode.digest(self.root / 'media/video.mp4'))
        for field in ('title', 'description', 'primary_keyword', 'alternative_titles', 'language'):
            bad = copy.deepcopy(metadata)
            bad[field] = [NON_LATIN, 'English alternative'] if field == 'alternative_titles' else ('fr' if field == 'language' else NON_LATIN)
            with self.subTest(field=field):
                with patch.object(Path, 'mkdir', side_effect=AssertionError('mkdir before validation')):
                    with self.assertRaises(ValueError):
                        youtube_metadata.export(self.root, bad)
                self.assertFalse((self.root / 'publish').exists())
        youtube_metadata.export(self.root, metadata)
        self.assertTrue(youtube_metadata.check(self.root)['ok'])

    def test_supplied_mp3_words_rejected_before_probe_or_install(self):
        self.approved('mp3')
        words = self.base / 'words.json'
        episode.write_json(words, dict(words=[dict(text=NON_LATIN, start=0, end=.4)]))
        before = self.snapshot()
        with patch.object(pipeline, 'probe_audio') as probe:
            with self.assertRaisesRegex(ValueError, 'voice/caption words'):
                pipeline.import_voice(self.root, mp3='missing', words=words)
            probe.assert_not_called()
        self.assertEqual(before, self.snapshot())

    def test_supplied_alignment_rejected_before_staging(self):
        self.approved('elevenlabs')
        response = self.base / 'response.json'
        episode.write_json(response, dict(alignment=dict(characters=list(NON_LATIN),
            character_start_times_seconds=[i / 10 for i in range(len(NON_LATIN))],
            character_end_times_seconds=[(i + 1) / 10 for i in range(len(NON_LATIN))])))
        before = self.snapshot()
        with patch.object(pipeline, 'probe_audio') as probe, patch.object(pipeline.tempfile, 'TemporaryDirectory') as temp:
            with self.assertRaisesRegex(ValueError, 'voice/caption words'):
                pipeline.import_voice(self.root, response=response, authorized=True)
            probe.assert_not_called()
            temp.assert_not_called()
        self.assertEqual(before, self.snapshot())

    def test_latin_accents_smart_quotes_and_source_urls(self):
        text = 'Review Jos\u00e9\u2019s workload with Outfit \u2014 42%.'
        self.assertEqual(policy.require_script(text), text)
        policy.require_script(text + '\nSource: https://example.test/' + NON_LATIN)
        metadata = self.metadata()
        metadata['description'] += '\nSource: https://example.test/' + NON_LATIN
        youtube_metadata.validate(metadata)
        for text in (NON_LATIN, '\u4e2d\u6587', '\u0395\u03bb\u03bb\u03b7\u03bd\u03b9\u03ba\u03ac'):
            with self.assertRaises(ValueError):
                policy.require_script(text)

    def test_guard_explicitly_does_not_prove_english(self):
        # Latin-script non-English text is deliberately not misrepresented as detected.
        policy.require_script('Bonjour le monde.')
        policy.require_script('Hola mundo.')
        self.assertIn('does not prove English', policy.REVIEW)
        self.assertIn('Semantic English review is mandatory', policy.REVIEW)


    def test_nested_language_cannot_contradict_episode(self):
        self.approved()
        good = episode.load(self.root)
        for field in ('metadata', 'branch'):
            state = copy.deepcopy(good)
            state[field]['language'] = 'ru'
            episode.write_json(self.root / 'episode.yaml', state)
            with self.assertRaisesRegex(ValueError, "exact 'en'"):
                episode.load(self.root)
        episode.write_json(self.root / 'episode.yaml', good)

    def test_script_checker_marks_output_language_for_editorial_review(self):
        import script_check
        result = script_check.check(NON_LATIN)
        self.assertFalse(result['machine']['passed'])
        self.assertIn('english_output_policy', result['machine']['errors'])
        self.assertIn('english_language_and_audio', result['editorial']['checks'])
        self.assertFalse(result['grants_approval'])

    def test_subtitles_reject_before_overwriting_existing_output(self):
        import make_srt
        output = self.base / 'captions.srt'
        output.write_text('previous valid output', encoding='utf-8')
        with self.assertRaisesRegex(ValueError, 'non-Latin'):
            make_srt.write([[0, 1, NON_LATIN]], make_srt.FORMATS['vertical'], output)
        self.assertEqual(output.read_text(), 'previous valid output')

    def test_standalone_voice_parser_rejects_supplied_non_latin_words(self):
        import voice_elevenlabs
        self.approved('elevenlabs')
        before = self.snapshot()
        response = dict(audio_base64='dGVzdA==', alignment=dict(
            characters=list(NON_LATIN),
            character_start_times_seconds=[i * .1 for i in range(len(NON_LATIN))],
            character_end_times_seconds=[i * .1 + .08 for i in range(len(NON_LATIN))]))
        with self.assertRaisesRegex(ValueError, 'non-Latin'):
            voice_elevenlabs.import_response(self.root, response, True)
        self.assertEqual(before, self.snapshot())


if __name__ == '__main__':
    unittest.main()
