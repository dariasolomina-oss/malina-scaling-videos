import json
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'engine/scripts'))
import prepare_page as pp

BRAND = ROOT / 'brands/lakesentry'


class PreparePageTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)

    def build(self, name='universal-landscape.html', brand=BRAND, data=None, target='page'):
        return pp.prepare_page(brand, name, self.base / target, data)

    def test_real_cli_and_self_contained_build_both_formats(self):
        for name, viewport in [('universal-landscape.html', [1920, 1080]),
                               ('universal-vertical.html', [1080, 1920]),
                               ('universal-square.html', [1080, 1080])]:
            out = self.base / name
            proc = subprocess.run([sys.executable, str(Path(pp.__file__)), '--brand', str(BRAND),
                '--template', name, '--data', str(BRAND / 'examples/demo-content.json'), '--out', str(out)],
                capture_output=True, text=True)
            self.assertEqual(proc.returncode, 0, proc.stderr)
            page = Path(json.loads(proc.stdout)['html'])
            text = page.read_text()
            self.assertIn('id="generated-brand-css"', text)
            self.assertIn('window.DURATION=data.duration', text)
            self.assertIn('window.render=function(t)', text)
            self.assertNotIn('fonts.googleapis.com', text)
            self.assertNotIn('../assets', text)
            self.assertTrue((out / 'assets/fonts/Outfit[wght].ttf').is_file())
            self.assertTrue((out / 'assets/fonts/outfit-OFL.txt').is_file())
            self.assertEqual(json.loads((out / 'build.json').read_text())['viewport'], viewport)
            pp.check_resources(text, out)
            # Parse emitted JavaScript with Node, without starting a browser.
            scripts = '\n'.join(re.findall(r'<script[^>]*>(.*?)</script>', text, re.S))
            script = self.base / 'check.js'
            script.write_text(scripts)
            run = subprocess.run(['node', '--check', str(script)], capture_output=True, text=True)
            self.assertEqual(run.returncode, 0, run.stderr)

    def test_multi_scene_template_builds_ordered_storyboard(self):
        data = {
            'layout': 'scenes', 'format': 'vertical', 'demo': True, 'duration': 6,
            'scenes': [
                {'id': 'intro', 'kind': 'title', 'start': 0, 'end': 2,
                 'eyebrow': 'Problem', 'title': 'Too much guesswork', 'body': 'Start with evidence.'},
                {'id': 'proof', 'kind': 'kpi', 'start': 2, 'end': 4,
                 'title': 'A visible result', 'value': '$42K', 'body': 'Hold the number.'},
                {'id': 'finish', 'kind': 'cta', 'start': 4, 'end': 6,
                 'title': 'Take the next step', 'button': 'Open the demo'},
            ],
        }
        page = self.build(str(ROOT / 'templates/video-scenes.html'), data=data, target='scenes')
        text = page.read_text()
        self.assertIn("scene.kind==='kpi'", text)
        self.assertIn('window.DURATION=data.duration', text)
        build = json.loads((page.parent / 'build.json').read_text())
        self.assertEqual(build['template'], 'video-scenes.html')
        self.assertEqual(build['layout'], 'scenes')
        scripts = self.base / 'scenes.js'
        scripts.write_text('\n'.join(re.findall(r'<script[^>]*>(.*?)</script>', text, re.S)))
        run = subprocess.run(['node', '--check', str(scripts)], capture_output=True, text=True)
        self.assertEqual(run.returncode, 0, run.stderr)

    def test_multi_scene_rejects_overlap_and_remote_asset(self):
        base = {'layout': 'scenes', 'duration': 4, 'scenes': [
            {'id': 'a', 'kind': 'title', 'start': 0, 'end': 3, 'title': 'A'},
            {'id': 'b', 'kind': 'cta', 'start': 2, 'end': 4, 'title': 'B'},
        ]}
        with self.assertRaisesRegex(ValueError, 'overlap'):
            self.build(str(ROOT / 'templates/video-scenes.html'), data=base, target='overlap')
        base['scenes'][1]['start'] = 3
        base['scenes'][0]['kind'] = 'screen'
        base['scenes'][0]['src'] = 'https://example.org/capture.mp4'
        with self.assertRaises(ValueError):
            self.build(str(ROOT / 'templates/video-scenes.html'), data=base, target='remote')

    def test_multi_scene_disclosure_and_vertical_safe_zone(self):
        data = {'layout': 'scenes', 'format': 'vertical', 'duration': 4,
                'disclosure': 'Illustrative example.', 'scenes': [
            {'id': 'a', 'kind': 'title', 'start': 0, 'end': 2, 'title': 'A'},
            {'id': 'b', 'kind': 'screen', 'start': 2, 'end': 4, 'title': 'B',
             'src': 'assets/logo/lakesentry-lockup-fordark-transparent-2400.png', 'disclosure': 'Product UI recorded with demo data.'},
        ]}
        page = self.build(str(ROOT / 'templates/video-scenes.html'), data=data, target='disclosure')
        text = page.read_text()
        self.assertIn('--shorts-top', text)
        self.assertIn('Product UI recorded with demo data.', text)
        self.assertNotIn('DEMO DATA', text)
        build = json.loads((page.parent / 'build.json').read_text())
        self.assertEqual(build['viewport'], [1080, 1920])
        self.assertEqual(build['format_policy']['id'], 'shorts')
        data['scenes'][0]['subtitle'] = 'unknown'
        with self.assertRaisesRegex(ValueError, 'Unknown scene keys'):
            self.build(str(ROOT / 'templates/video-scenes.html'), data=data, target='unknown')
        del data['scenes'][0]['subtitle']
        data['disclosure'] = 'x' * 121
        with self.assertRaisesRegex(ValueError, 'disclosure'):
            self.build(str(ROOT / 'templates/video-scenes.html'), data=data, target='long')

    def test_multi_scene_rejects_non_screen_media(self):
        data = {'layout': 'scenes', 'duration': 2, 'scenes': [
            {'id': 'title', 'kind': 'title', 'start': 0, 'end': 2,
             'title': 'Title', 'src': 'assets/logo/light.svg'},
        ]}
        with self.assertRaisesRegex(ValueError, 'Only screen'):
            self.build(str(ROOT / 'templates/video-scenes.html'), data=data, target='wrong-kind')

    def test_brand_switch_uses_generated_css_and_new_assets(self):
        first = self.build(target='first').read_text()
        alternate = self.base / 'alternate'
        shutil.copytree(BRAND, alternate)
        config = json.loads((alternate / 'brand.json').read_text())
        config['name'] = 'Alternate editorial brand'
        config['colors']['primary'] = '#123456'
        config['colors']['accent'] = '#654321'
        config['colors']['border'] = '#112233'
        config['colors']['chart']['sql'] = '#224466'
        config['fonts']['headline'] = 'Montserrat'
        config['logo']['light'] = config['logo']['mark']
        (alternate / 'brand.json').write_text(json.dumps(config))
        second = self.build(brand=alternate, target='second').read_text()
        self.assertIn('--color-primary: #0950C3;', first)
        for token in ['--color-primary: #123456;', '--color-accent: #654321;',
                      '--color-border: #112233;', '--color-chart-sql: #224466;',
                      '--font-headline: Montserrat;', 'Alternate editorial brand']:
            self.assertIn(token, second)
        self.assertIn('var(--font-headline),sans-serif', second)
        self.assertIn('var(--color-chart-sql)', second)
        self.assertEqual((self.base / 'second/assets/logo' / Path(config['logo']['light']).name).read_bytes(),
                         (alternate / config['logo']['light']).read_bytes())

    def test_content_is_safe_json_and_text_not_markup(self):
        data = json.loads((BRAND / 'examples/demo-content.json').read_text())
        data['headline'] = '</script><script>alert("x")</script>&\u2028'
        text = self.build(data=data).read_text()
        self.assertNotIn(data['headline'], text)
        self.assertIn('\\u003c/script\\u003e', text)
        self.assertIn('\\u2028', text)
        self.assertIn('h.textContent=block.title', text)
        self.assertNotIn('innerHTML', text)
        match = re.search(r'window.PAGE_DATA=(.*?);window.PAGE_BRAND=', text)
        self.assertEqual(json.loads(match.group(1))['headline'], data['headline'])

    def test_legacy_builds_keep_motion_but_reject_data_overrides(self):
        for name in ['landscape-product-demo.html', 'vertical-teaser.html',
                     'thumbnail-horizontal.html', 'thumbnail-vertical.html']:
            page = self.build(name, target=name)
            text = page.read_text()
            self.assertIn('LEGACY RECONSTRUCTION', text)
            self.assertNotIn('fonts.googleapis.com', text)
            self.assertNotIn('../assets', text)
            pp.check_resources(text, page.parent)
            if name in ['landscape-product-demo.html', 'vertical-teaser.html']:
                self.assertIn('window.render=render;window.DURATION=T.end', text)
                js = self.base / 'legacy.js'
                js.write_text('\n'.join(re.findall(r'<script[^>]*>(.*?)</script>', text, re.S)))
                run = subprocess.run(['node', '--check', str(js)], capture_output=True, text=True)
                self.assertEqual(run.returncode, 0, run.stderr)
        with self.assertRaisesRegex(ValueError, 'Legacy templates'):
            self.build('vertical-teaser.html', data={'headline': 'Ignored?'})

    def test_invalid_content_and_overwrite_rejected(self):
        self.build()
        with self.assertRaisesRegex(ValueError, 'empty directory'):
            self.build()
        for data in [{'headline': 'x', 'duration': float('nan')}, {'headline': 'x', 'duration': True},
                     {'headline': 'x', 'blocks': [{}]}, {'headline': 'x', 'html': '<b>bad</b>'},
                     {'headline': 'x' * 101}]:
            with self.assertRaises(ValueError):
                self.build(data=data, target='invalid')
            self.assertFalse((self.base / 'invalid').exists())

    def test_remote_missing_or_escaping_assets_rejected(self):
        for asset in ['https://example.org/font.ttf', '//example.org/font.ttf',
                      '../secret', 'assets/%2e%2e/%2e%2e/secret', '/etc/passwd',
                      'assets/fonts/missing.ttf', 'assets/fonts/Outfit[wght].ttf?remote=1']:
            with self.assertRaises(ValueError):
                pp.local_asset(asset, BRAND)
        for html in ['<script src="https://example.org/a.js"></script>',
                     '<style>@import "https://example.org/a.css";</style>',
                     '<style>body{background:url(https://example.org/a.png)}</style>']:
            with self.assertRaises(ValueError):
                pp.check_resources(html, BRAND)

    def test_brand_symlink_and_unsafe_css_rejected(self):
        alternate = self.base / 'alternate'
        shutil.copytree(BRAND, alternate)
        (alternate / 'assets/leak').symlink_to('/etc/passwd')
        with self.assertRaisesRegex(ValueError, 'symlinks'):
            self.build(brand=alternate)
        (alternate / 'assets/leak').unlink()
        config = json.loads((alternate / 'brand.json').read_text())
        config['colors']['primary'] = 'red; } body { color: red'
        (alternate / 'brand.json').write_text(json.dumps(config))
        with self.assertRaises(subprocess.CalledProcessError):
            self.build(brand=alternate)


if __name__ == '__main__':
    unittest.main()
