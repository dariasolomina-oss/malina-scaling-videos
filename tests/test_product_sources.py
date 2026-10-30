"""Offline consistency checks: not network/semantic evidence verification."""
import json
from pathlib import Path
import re
import unittest
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
BRAND = ROOT / 'brands/lakesentry'


class ProductSourcesTests(unittest.TestCase):
    def test_brand_points_to_existing_brief_and_registry(self):
        product = json.loads((BRAND/'brand.json').read_text())['product']
        self.assertEqual(product['documentation_url'], 'https://docs.lakesentry.io/')
        for key in ('brief', 'source_registry'):
            path = (BRAND/product[key]).resolve()
            self.assertTrue(path.is_relative_to(BRAND.resolve()))
            self.assertTrue(path.is_file())

    def test_read_status_has_provenance_not_live_execution_claim(self):
        data = json.loads((BRAND/'sources.json').read_text())
        self.assertEqual(data['schema_version'], 1)
        ids = [source['id'] for source in data['sources']]
        self.assertEqual(len(ids), len(set(ids)))
        for source in data['sources']:
            self.assertEqual(urlparse(source['url']).scheme, 'https')
            self.assertIn(source['status'], ('read', 'discovered-unread'))
            self.assertTrue(source['verification_scope'])
            if source['status'] == 'read':
                self.assertRegex(source['checked_at'], r'^\d{4}-\d{2}-\d{2}$')
            else:
                self.assertIsNone(source['checked_at'])
            if source['kind'] == 'official_product_documentation':
                self.assertEqual(source['http_status'], 200)
                self.assertEqual(urlparse(source['url']).hostname, 'docs.lakesentry.io')
                self.assertTrue(source['sections_read'])
                self.assertRegex(source['extracted_text_sha256'], r'^[0-9a-f]{64}$')

    def test_content_board_is_supplemental_and_actor_access_is_separate(self):
        data = json.loads((BRAND/'sources.json').read_text())
        board = next(source for source in data['sources']
                     if source['url'] == 'https://content-machine.spot.t1a.dev/ls/')
        self.assertEqual(board['kind'], 'supplemental_editorial_context')
        self.assertIs(board['required'], False)
        self.assertIs(board['topic_origin_required'], False)
        self.assertIs(board['read_only'], True)
        actors = {check['actor'] for check in board['access_checks']}
        self.assertIn('Project Assistant', actors)
        self.assertIn('Video Producer', actors)
        self.assertTrue(board['verification_scope'])
        product = json.loads((BRAND/'brand.json').read_text())['product']
        self.assertIn(board['url'], product['supplemental_context_urls'])
        self.assertIn(board['url'], (ROOT/'docs/product-research.md').read_text())
        self.assertIn('S13', (BRAND/'product.md').read_text())

    def test_brief_source_ids_resolve_and_research_gate_exists(self):
        data = json.loads((BRAND/'sources.json').read_text())
        ids = {s['id'] for s in data['sources']}
        text = (BRAND/'product.md').read_text()
        used = set(re.findall(r'\bS\d{2}\b', text))
        self.assertTrue(used)
        self.assertTrue(used <= ids)
        self.assertIn('RESEARCH.md', text)
        self.assertTrue((ROOT/'templates/research.md').is_file())
        self.assertIn('source-first', (ROOT/'agent/INSTRUCTIONS.md').read_text().lower())


if __name__ == '__main__':
    unittest.main()
