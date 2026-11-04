"""Offline profile checks; synthetic fixtures are NOT production approvals."""
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'engine/scripts'))
import episode
import language_policy
import pipeline
import prepare_page
import youtube_metadata

PRODUCTS = {'lakesentry': ('LakeSentry', 'ls'), 'antares': ('Antares', 'ant'),
            'secondstack': ('SecondStack', '2s'), 'alchemist': ('Alchemist', 'alch')}


class MultiProductTests(unittest.TestCase):
    def test_all_profiles_initialize_and_guard_build(self):
        for slug, (name, _) in PRODUCTS.items():
            for fmt in ('horizontal', 'vertical'):
                with self.subTest(product=slug, format=fmt), tempfile.TemporaryDirectory() as tmp:
                    root = Path(tmp) / 'episode'
                    state = pipeline.init(root, 'test', ROOT/'brands'/slug, fmt, 8, 'none',
                                          'AUTOMATED TEST FIXTURE ONLY')
                    self.assertEqual(state['language'], 'en')
                    self.assertEqual(state['pipeline']['product'], slug)
                    self.assertEqual(state['title'], name + ' demo')
                    self.assertEqual(state['branch']['name'], 'ep/' + slug + '/test')
                    self.assertEqual(state['approvals'], {})
                    with patch.object(pipeline.subprocess, 'run') as run:
                        with self.assertRaisesRegex(ValueError, 'script approval'):
                            pipeline.build(root)
                        run.assert_not_called()
                    # Test attestation only; never a human production approval.
                    (root/'script.md').write_text('Synthetic editorial layout fixture. Not a production video.\n')
                    episode.load(root)
                    episode.approve(root, 'script', 'AUTOMATED TEST FIXTURE ONLY', True)
                    pipeline.build(root)
                    html = (root/'source/index.html').read_text()
                    self.assertIn(name, html)
                    prepare_page.check_resources(html, root/'source')
                    if slug != 'lakesentry':
                        self.assertNotIn('LakeSentry', html)
                        self.assertNotIn('lakesentry', html)
                        self.assertFalse(any('lakesentry' in str(p) for p in (root/'source/assets').rglob('*')))
                        self.assertIn('brand.editorial.disclosure', html)
                        self.assertIn('brand.logo[brand.editorial.logo_variant]', html)
                        self.assertIn("document.getElementById('brand-name').remove()", html)
                        self.assertNotIn('window.PAGE_DATA.demo?', html)
                    (root/'script.md').write_text('Revised synthetic fixture.\n')
                    with self.assertRaisesRegex(ValueError, 'script approval'):
                        pipeline.build(root)

    def test_registry_and_asset_provenance(self):
        for slug, (name, board) in PRODUCTS.items():
            brand = ROOT/'brands'/slug
            config = json.loads((brand/'brand.json').read_text())
            sources = json.loads((brand/'sources.json').read_text())
            self.assertEqual(config['name'], name)
            self.assertEqual(sources['product'], name)
            for key in ('brief', 'source_registry'):
                self.assertTrue((brand/config['product'][key]).is_file())
            scheduler = next(s for s in sources['sources'] if s['kind'] == 'supplemental_editorial_context')
            self.assertEqual(scheduler['url'], 'https://content-machine.spot.t1a.dev/' + board + '/')
            self.assertFalse(scheduler['required'])
            self.assertTrue(scheduler['read_only'])
            self.assertIn(scheduler['url'], config['product']['supplemental_context_urls'])
            if slug != 'lakesentry':
                for asset in json.loads((brand/'assets/provenance.json').read_text())['assets']:
                    file = brand/asset['path']
                    self.assertEqual(hashlib.sha256(file.read_bytes()).hexdigest(), asset['sha256'])
                    if 'license' in asset:
                        self.assertIn('SIL OPEN FONT LICENSE', (brand/asset['license']).read_text())
                self.assertNotIn('demo_login_url', config)
                self.assertIsNone(config['voice'])
                self.assertEqual(config['output_language'], 'en')

    def test_brand_constraints_and_no_inherited_assets(self):
        a = json.loads((ROOT/'brands/antares/brand.json').read_text())
        self.assertEqual(a['colors']['primary'], '#2563EB')
        self.assertEqual(a['font_faces'], [])
        self.assertIn('Arial', a['fonts']['ui'])
        self.assertIn('Example data', a['editorial']['disclosure'])
        s = json.loads((ROOT/'brands/secondstack/brand.json').read_text())
        self.assertEqual(s['colors']['primary'], '#0A6E9C')
        self.assertEqual(s['fonts']['headline'], 'Geist')
        a = json.loads((ROOT/'brands/alchemist/brand.json').read_text())
        self.assertEqual(a['editorial']['logo_variant'], 'dark')
        self.assertEqual(a['colors']['page'], '#181818')
        self.assertEqual(a['colors']['accent'], '#5EC269')
        for slug in ('antares', 'secondstack', 'alchemist'):
            for file in (ROOT/'brands'/slug/'templates').glob('*.html'):
                self.assertNotRegex(file.read_text(), r'(?i)lakesentry|databricks|--color-chart-sql|box-shadow|linear-gradient')

    def test_init_rejects_unsafe_brand_before_episode_creation(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            for config in ({'name': 'Test', 'id': '../bad'}, {'name': 'Test', 'id': 'test', 'output_language': 'fr'}, {'id': 'test'}):
                brand = base/'brand'
                brand.mkdir(exist_ok=True)
                (brand/'brand.json').write_text(json.dumps(config))
                with self.assertRaises(ValueError):
                    pipeline.init(base/'episode', 'test', brand, 'horizontal', 1, 'none', 'Tester')
                self.assertFalse((base/'episode').exists())

    def test_fixed_en_metadata_and_non_latin_prose_guard(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)/'episode'
            with self.assertRaisesRegex(ValueError, 'exactly en'):
                episode.create(root, 'test', 'English title', 'fr')
            self.assertFalse(root.exists())
            for field in ('headline', 'subtitle', 'footer'):
                with self.assertRaisesRegex(ValueError, 'non-Latin'):
                    prepare_page.validate_data({'headline': 'English title', field: '\u041f\u0440\u0438\u0432\u0435\u0442'})
            state = episode.create(root, 'test', 'English title')
            state['language'] = 'de'
            episode.write_json(root/'episode.yaml', state)
            with self.assertRaisesRegex(ValueError, 'exactly en'):
                episode.load(root)
        # Deliberate limitation: Latin-script non-English passes; semantic review is mandatory.
        language_policy.check_prose('Bonjour')
        with self.assertRaisesRegex(ValueError, 'exactly en'):
            youtube_metadata.validate({'title': 'Title', 'description': 'Description', 'language': 'fr',
                'primary_keyword': 'keyword', 'evidence': [], 'script_hash': '0'*64, 'video_hash': '0'*64})


if __name__ == '__main__':
    unittest.main()
