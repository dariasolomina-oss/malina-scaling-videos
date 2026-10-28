#!/usr/bin/env python3
"""Opt-in REAL browser smoke, synthetic fixtures only. Never production approval.
Run from repo root: CDP_URL=... BROWSER_HTTP_HOST=... python tests/browser_smoke.py --run
Artifacts remain in /tmp; report path is printed. No external service or Git writes.
"""
import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import time

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'engine/scripts'))
import episode
import pipeline


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--run', action='store_true', help='explicitly run real browser fixture')
    a = p.parse_args()
    if not a.run:
        p.error('--run required: this is an opt-in synthetic fixture, not a production episode')
    base = Path(tempfile.mkdtemp(prefix='malina-browser-smoke-'))
    report = dict(kind='synthetic_browser_smoke_NOT_production_approval', cases=[], directory=str(base))
    for fmt in ('horizontal', 'vertical'):
        ep = base/fmt
        pipeline.init(ep, 'smoke-'+fmt, ROOT/'brands/lakesentry', fmt, 1, 'none', 'AUTOMATED TEST FIXTURE')
        (ep/'script.md').write_text('# Synthetic smoke fixture\nShow the LakeSentry demo layout for one second. Not a production video.\n')
        content = json.loads((ROOT/'brands/lakesentry/examples/demo-content.json').read_text())
        content['duration'] = 1
        episode.write_json(ep/'content.json', content)
        episode.load(ep)
        episode.approve(ep, 'script', 'AUTOMATED TEST FIXTURE ONLY', True)
        pipeline.build(ep)
        for fps in (30, 60):
            if fps == 60:
                episode.approve(ep, 'video', 'AUTOMATED TEST FIXTURE ONLY', True)
            start = time.monotonic()
            pipeline.render(ep, fps=fps, chunk_frames=15, resume=True)
            result = subprocess.run(['ffprobe', '-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', str(ep/'media/video.mp4')], check=True, capture_output=True, text=True)
            info = json.loads(result.stdout)
            video = next(s for s in info['streams'] if s['codec_type'] == 'video')
            assert int(video['nb_read_frames']) == fps, video
            assert (video['width'], video['height']) == ((1920,1080) if fmt=='horizontal' else (1080,1920))
            state = episode.load(ep)
            assert state['status']=='review' and 'video' not in state['approvals']
            report['cases'].append(dict(format=fmt, fps=fps, frames=int(video['nb_read_frames']), width=video['width'], height=video['height'], elapsed_seconds=round(time.monotonic()-start,2), status=state['status']))
            episode.write_json(base/'report.json', report)
    print(json.dumps(report, indent=2))


if __name__=='__main__':
    main()
