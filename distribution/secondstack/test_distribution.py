"""Packaging layer tests; no changes to the developer runtime or Agent settings."""
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import zipfile

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('distribution_builder', HERE/'build.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


class DistributionTests(unittest.TestCase):
    def test_repeat_builds_are_identical_and_source_is_unchanged(self):
        watched = [p for name in ('engine','brands','schemas','skills','agent','templates','formats')
                   for p in (builder.ROOT/name).rglob('*') if p.is_file() and '__pycache__' not in p.parts]
        before = {p:builder.digest(p) for p in watched}
        with tempfile.TemporaryDirectory() as tmp:
            a=builder.build(Path(tmp)/'a')
            b=builder.build(Path(tmp)/'b')
            for name in ('video-production-toolkit.zip','product-collections.zip','agent-instructions.txt'):
                self.assertEqual((a/name).read_bytes(),(b/name).read_bytes())
            self.assertEqual(before,{p:builder.digest(p) for p in watched})
            with zipfile.ZipFile(a/'video-production-toolkit.zip') as z:
                names=set(z.namelist())
                self.assertIn('SKILL.md',names)
                self.assertIn('runtime/formats/shorts/safe-zone.json',names)
                history = 'references/lakesentry-history/'
                self.assertIn('references/lakesentry-history.md', names)
                lake = builder.ROOT/'brands/lakesentry'
                self.assertEqual(z.read(history + 'style-guide.md'),
                                 (lake/'style-guide.md').read_bytes())
                for name in ('landscape-product-demo.html', 'vertical-teaser.html',
                             'thumbnail-horizontal.html', 'thumbnail-vertical.html',
                             'publish-horizontal.md', 'publish-vertical.md'):
                    self.assertEqual(z.read(history + name),
                                     (lake/'templates'/name).read_bytes())
                    self.assertNotIn('runtime/brands/lakesentry/templates/' + name, names)
                self.assertNotIn('runtime/agent/INSTRUCTIONS.md',names)
                self.assertFalse(any(n.endswith('/product.md') or n.endswith('/sources.json') for n in names))
                self.assertFalse(any('/episodes/' in n or '/node_modules/' in n or '__pycache__' in n for n in names))
            for p in (a/'collections').rglob('*.md'):
                text=p.read_text()
                self.assertNotIn('`sources.json`',text)
                self.assertNotIn('](sources.json)',text)
            with self.assertRaisesRegex(ValueError,'already exist'):
                builder.build(a)

    def test_bundled_verifier_detects_removed_asset(self):
        with tempfile.TemporaryDirectory() as tmp:
            out=builder.build(Path(tmp)/'out')
            verifier=out/'skill/verify.py'
            subprocess.run([sys.executable,str(verifier)],check=True,capture_output=True)
            (out/'skill/runtime/brands/antares/brand.json').unlink()
            proc=subprocess.run([sys.executable,str(verifier)],capture_output=True)
            self.assertNotEqual(proc.returncode,0)
            self.assertIn(b'Release integrity failure',proc.stderr)


if __name__=='__main__':
    unittest.main()
