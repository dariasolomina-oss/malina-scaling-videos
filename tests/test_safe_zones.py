"""Shared platform policy checks; these are not production approvals."""
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'engine/scripts'))
import episode
import pipeline
import prepare_page


class SafeZoneTests(unittest.TestCase):
    def test_profiles_do_not_own_platform_geometry(self):
        for config in (ROOT/'brands').glob('*/brand.json'):
            self.assertNotIn('safe_zone_shorts', json.loads(config.read_text()))
            self.assertIn('var(--shorts-right)', (config.parent/'templates/universal-vertical.html').read_text())
        self.assertTrue((ROOT/'formats/shorts/shorts-safe-zone-2025.png').is_file())

    def test_shared_policy_applies_to_every_brand_and_is_recorded(self):
        policy = json.loads((ROOT/'formats/shorts/safe-zone.json').read_text())
        for config in (ROOT/'brands').glob('*/brand.json'):
            brand = config.parent
            with self.subTest(brand=brand.name), tempfile.TemporaryDirectory() as tmp:
                page = prepare_page.prepare_page(brand, 'universal-vertical.html', Path(tmp)/'out')
                html = page.read_text()
                # 10px inset inside x=60..880, y=240..1540, excluding action buttons.
                for token in ('--shorts-top: 250px;', '--shorts-right: 210px;',
                              '--shorts-bottom: 390px;', '--shorts-left: 70px;'):
                    self.assertIn(token, html)
                self.assertEqual(json.loads((page.parent/'build.json').read_text())['format_policy'], policy)

    def test_horizontal_build_is_not_constrained_by_shorts(self):
        with tempfile.TemporaryDirectory() as tmp:
            page = prepare_page.prepare_page(ROOT/'brands/antares', 'universal-landscape.html', Path(tmp)/'out')
            self.assertNotIn('--shorts-right:', page.read_text())
            self.assertIsNone(json.loads((page.parent/'build.json').read_text())['format_policy'])


    def test_policy_change_invalidates_vertical_build_only(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            policy_path = base/'safe-zone.json'
            policy = json.loads(prepare_page.SHORTS_SAFE_ZONE.read_text())
            policy_path.write_text(json.dumps(policy))
            with patch.object(prepare_page, 'SHORTS_SAFE_ZONE', policy_path):
                for orientation in ('horizontal', 'vertical'):
                    root = base/orientation
                    pipeline.init(root, orientation, ROOT/'brands/antares', orientation, 8, 'none',
                                  'AUTOMATED TEST FIXTURE ONLY')
                    (root/'script.md').write_text('Synthetic script for the layout test.\n')
                    episode.approve(root, 'script', 'AUTOMATED TEST FIXTURE ONLY', True)
                    pipeline.build(root)

                policy['content_padding'] += 1
                policy_path.write_text(json.dumps(policy))
                horizontal = base/'horizontal'
                pipeline.checked_build(horizontal, episode.load(horizontal))
                vertical = base/'vertical'
                with self.assertRaisesRegex(ValueError, 'inputs changed'):
                    pipeline.checked_build(vertical, episode.load(vertical))


if __name__ == '__main__':
    unittest.main()
