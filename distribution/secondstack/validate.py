#!/usr/bin/env python3
"""Validate a built candidate without installing or publishing it."""
from pathlib import Path
import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[2]


def run(command, **kwargs):
    return subprocess.run(command, check=True, **kwargs)


def validate(output, browser=False):
    output = Path(output).resolve()
    with tempfile.TemporaryDirectory(prefix='secondstack-validation-') as tmp:
        root = Path(tmp)
        with zipfile.ZipFile(output/'video-production-toolkit.zip') as z:
            for name in z.namelist():
                if name.startswith('/') or '..' in Path(name).parts:
                    raise ValueError('Unsafe archive entry')
            z.extractall(root/'skill')
        skill = root/'skill'
        runtime = skill/'runtime'
        run([sys.executable, str(skill/'verify.py')])
        assert not (runtime/'agent').exists()
        assert not (runtime/'docs').exists()
        for p in skill.rglob('*.md'):
            if p.is_relative_to(skill/'references/lakesentry-history'):
                continue
            text = p.read_text()
            for stale in ('../../agent/', 'agent/INSTRUCTIONS.md', '_flow/', '_toolkit/', 'dev/s2-', 'origin/main'):
                assert stale not in text, (p, stale)
        for brand in (runtime/'brands').iterdir():
            assert not (brand/'product.md').exists()
            assert not (brand/'sources.json').exists()
            config = json.loads((brand/'brand.json').read_text())
            assert 'brief' not in config['product'] and 'source_registry' not in config['product']
            assert config['product']['knowledge_collection'].endswith(' Product Knowledge')
            assert sorted(p.name for p in (brand/'templates').glob('*.html')) == ['universal-landscape.html', 'universal-vertical.html']
        # Port tests into a disposable extracted runtime; developer files stay unchanged.
        shutil.copytree(ROOT/'tests', runtime/'tests')
        pipeline_test = runtime/'tests/test_pipeline.py'
        pipeline_test.write_text(pipeline_test.read_text().replace("state['branch']", "state['episode_metadata']").replace('Bonjour LakeSentry.', 'Hello LakeSentry.'))
        multi = runtime/'tests/test_multi_product.py'
        text = multi.read_text().replace("self.assertEqual(state['branch']['name'], 'ep/' + slug + '/test')", "self.assertEqual(state['episode_metadata']['product'], slug)")
        multi.write_text(text)
        runner = '''import sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path.cwd()/'tests'))
loader=unittest.TestLoader()
suite=unittest.TestSuite()
names=['test_episode','test_pipeline','test_timings','test_script_check','test_youtube_metadata','test_safe_zones','test_prepare_page','test_multi_product']
skip={'test_legacy_builds_keep_motion_but_reject_data_overrides','test_registry_and_asset_provenance'}
for name in names:
 s=loader.loadTestsFromName(name)
 def flatten(s):
  for item in s:
   if isinstance(item,unittest.TestSuite):yield from flatten(item)
   else:yield item
 for test in flatten(s):
  if test._testMethodName not in skip:suite.addTest(test)
result=unittest.TextTestRunner(verbosity=1).run(suite)
sys.exit(not result.wasSuccessful())
'''
        run([sys.executable, '-c', runner], cwd=runtime)
        run(['node','--test','tests/test_render.test.js'], cwd=runtime)
        # Direct contract check for fresh state and stale package state.
        probe = '''import sys,json,tempfile
from pathlib import Path
sys.path.insert(0,str(Path.cwd()/'engine/scripts'))
import pipeline,episode
with tempfile.TemporaryDirectory() as tmp:
 root=Path(tmp)/'episode'
 state=pipeline.init(root,'probe',Path.cwd()/'brands/antares','vertical',1,'none','TEST ONLY')
 assert 'branch' not in state and state['episode_metadata']['toolkit_version']=='1.0.0-candidate.1'
 state['branch']={'language':'en'}
 episode.write_json(root/'episode.yaml',state)
 try:episode.load(root)
 except ValueError as e:assert 'Legacy episode' in str(e)
 else:raise AssertionError('Legacy state accepted silently')
'''
        run([sys.executable,'-c',probe], cwd=runtime)
        if browser:
            run([sys.executable, 'tests/multi_product_browser_smoke.py', '--run'], cwd=runtime)
        # Tampering must fail verification, without needing an online service.
        target = runtime/'brands/antares/brand.json'
        target.write_text(target.read_text()+'\n')
        proc = subprocess.run([sys.executable, str(skill/'verify.py')], capture_output=True)
        assert proc.returncode != 0 and b'Release integrity failure' in proc.stderr
        with zipfile.ZipFile(output/'product-collections.zip') as z:
            assert len(z.namelist()) == 8
            assert all(name.endswith('.md') for name in z.namelist())
    return {'status':'passed', 'installer':'not_tested', 'browser_layout':browser,
            'production_media':'not_generated', 'collections_access':'not_tested',
            'notes':['Ported regression suite excludes source-registry file checks and removed legacy-template rendering; replacement structural checks executed.',
                     'No Agent installation, publication or user approval was performed.']}


if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',required=True,type=Path)
    parser.add_argument('--browser',action='store_true')
    args=parser.parse_args()
    result=validate(args.output,args.browser)
    (args.output/'validation.json').write_text(json.dumps(result,indent=2)+'\n')
    manifest_path=args.output/'delivery-manifest.json'
    manifest=json.loads(manifest_path.read_text())
    file=args.output/'validation.json'
    manifest['artifacts']['validation.json']={'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'bytes':file.stat().st_size}
    manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
    print(json.dumps(result,indent=2))
