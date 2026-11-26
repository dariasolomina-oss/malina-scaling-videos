"""Frame review of an animatic by a vision model, called directly through the model
gateway (OPENAI_BASE_URL, OPENAI_API_KEY).

The reviewer receives only the review rules (references/frame-review.md), the brand
style guide, and for its share of the video: the frames, the marked frames of the
geometry check, the geometry findings, the scene list and the narration. It does not
receive agent instructions, other skills or the conversation.

Two kinds of request run in parallel:
- detail: the sheets in batches (default 4 sheets = 16 frames), one request each;
- overall: every sheet in one request, for consistency across scenes only.

Results go to frame-review/round-N/ in the episode (one Markdown file per request, report.md
and result.json). A request that fails twice is reported as failed; its sheets must be
reviewed another way before the animatic is shown.
"""

import base64
import concurrent.futures
import json
import os
from pathlib import Path
import re
import sys
import time
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
BRIEF_CANDIDATES = (
    ROOT.parent/'references/frame-review.md',                         # installed skill
    ROOT/'distribution/secondstack/content/references/frame-review.md',  # repository
)
DETAIL_MODEL = 'claude-sonnet-5-5'
OVERALL_MODEL = 'gpt-5.5'
BATCH_SHEETS = 4
PARALLEL = 6
MAX_MARKED = 4
MAX_WARNINGS = 20
TIMEOUT = 180
FORMAT_NAMES = {'horizontal': '16:9 (1920x1080)', 'vertical': '9:16 Shorts (1080x1920)',
                'square': '1:1 (1080x1080)'}
PRIORITY = re.compile(r'\[(P[0-3])\]')
VERDICT = re.compile(r'VERDICT:\s*(CLEAN|NEEDS FIXES)')

OVERALL_TASK = """This is the OVERALL pass over the whole video. Other reviewers check every
frame in detail, so do not list single-frame geometry defects (overlaps, clipping,
cramped edges) unless the same defect repeats across scenes. Report only what needs
the whole video to see:
- the same role styled differently in different scenes (badges, labels, headings,
  buttons, cards, icons, number formats, capitalisation);
- brand drift between scenes (logo use, colours, fonts, icon family, emoji instead
  of icons);
- story flow: a scene that does not match its place in the scene list, repeated or
  missing moments, leftovers from a previous scene, blank or broken stretches;
- density and pacing across the video.
Use the same reply format; REVIEWED covers the whole video."""


def brief_path():
    for path in BRIEF_CANDIDATES:
        if path.is_file():
            return path
    raise FileNotFoundError('frame-review.md not found next to the runtime')


def fmt_time(t):
    t = float(t)
    return f'{int(t // 60)}:{t % 60:05.2f}'


def image_part(path):
    data = base64.b64encode(Path(path).read_bytes()).decode()
    return {'type': 'image_url', 'image_url': {'url': 'data:image/jpeg;base64,' + data}}


def sheet_label(index, sheet, per_sheet):
    times = ', '.join(f"{t:.2f}" for t in sheet['times'])
    text = f"Sheet {index:03d}: frames at {times} s, left to right, top to bottom."
    if len(sheet['times']) < per_sheet:
        text += (f" Only {len(sheet['times'])} of {per_sheet} tiles are frames; the rest is empty"
                 " padding of the sheet, not part of the video.")
    return text


def narration(root, start, end):
    path = Path(root)/'timings.json'
    if not path.is_file():
        return ''
    try:
        words = json.loads(path.read_text(encoding='utf-8')).get('words', [])
    except (ValueError, AttributeError):
        return ''
    return ' '.join(w['text'] for w in words if start - 1 <= w.get('start', -1) <= end + 1)


def scene_lines(scenes, start=None, end=None):
    lines = []
    for s in scenes:
        if start is not None and (s['end'] < start or s['start'] > end):
            continue
        lines.append(f"- {fmt_time(s['start'])}–{fmt_time(s['end'])}: {s['title']}")
    return '\n'.join(lines) or '- (no scene list)'


def geometry_lines(findings, start, end):
    inside = [f for f in findings if start <= f['t'] <= end]
    errors = [f for f in inside if f['severity'] == 'error']
    warnings, seen = [], set()
    for f in inside:
        if f['severity'] != 'error' and f['key'] not in seen and len(warnings) < MAX_WARNINGS:
            seen.add(f['key'])
            warnings.append(f)
    lines = []
    for f in errors + warnings:
        waived = f" (waived: {f['waived']})" if f.get('waived') else ''
        lines.append(f"- {f['t']:.2f}s mark {f['mark']}: {f['severity']} {f['type']}: \"{f['text'][:120]}\"{waived}")
    more = len([f for f in inside if f['severity'] != 'error']) - len(warnings)
    if more > 0:
        lines.append(f'- and {more} more warnings of the same kinds')
    return lines or ['- none'], errors


def context_text(state, style_guide, scenes, start, end, root, whole=False):
    pipe = state.get('pipeline', {})
    parts = [f"Brand: {pipe.get('product', '?')}. Format: {FORMAT_NAMES.get(pipe.get('format'), pipe.get('format'))}. "
             f"Video length: {fmt_time(pipe.get('duration', 0))}.",
             'Your share: the whole video.' if whole else f'Your share: {start:.2f}–{end:.2f} s.',
             '', 'Brand style guide:', style_guide.strip() or '(none)', '',
             'Scenes' + ('' if whole else ' in your share') + ':', scene_lines(scenes, None if whole else start, end)]
    if not whole:
        spoken = narration(root, start, end)
        if spoken:
            parts += ['', 'Narration in your share:', spoken]
    return '\n'.join(parts)


def call(base, key, model, system, content, max_tokens):
    body = {'model': model, 'max_tokens': max_tokens,
            'messages': [{'role': 'system', 'content': system}, {'role': 'user', 'content': content}]}
    request = urllib.request.Request(base.rstrip('/') + '/chat/completions', data=json.dumps(body).encode(),
        headers={'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'})
    with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
        reply = json.load(response)
    choice = reply['choices'][0]
    text = (choice.get('message') or {}).get('content') or ''
    if not VERDICT.search(text):
        raise RuntimeError(f"no verdict in the reply (finish_reason={choice.get('finish_reason')})")
    return text, reply.get('usage') or {}


def run_request(job, base, key, system):
    errors = []
    for attempt in range(2):
        started = time.time()
        try:
            text, usage = call(base, key, job['model'], system, job['content'], job['max_tokens'])
            return dict(job, text=text, usage=usage, seconds=round(time.time() - started, 1), error=None)
        except urllib.error.HTTPError as error:
            detail = error.read()[:300].decode('utf-8', 'replace')
            errors.append(f'HTTP {error.code}: {detail}')
            if error.code == 402:
                break  # budget exceeded: never retry
        except Exception as error:  # network, timeout, malformed reply
            errors.append(f'{type(error).__name__}: {error}')
    return dict(job, text='', usage={}, seconds=None, error=' | '.join(errors))


def review(root, state, detail_model=DETAIL_MODEL, overall_model=OVERALL_MODEL,
           batch_sheets=BATCH_SHEETS, parallel=PARALLEL, overall=True):
    base, key = os.environ.get('OPENAI_BASE_URL'), os.environ.get('OPENAI_API_KEY')
    if not base or not key:
        raise ValueError('OPENAI_BASE_URL and OPENAI_API_KEY are required for the frame review; '
                         'review the sheets yourself with the image viewer and frame-review.md')
    root = Path(root)
    review_dir = root/'review'
    layout = json.loads((review_dir/'layout.json').read_text(encoding='utf-8'))
    sheets, findings, scenes = layout['sheets'], layout['findings'], layout.get('scenes', [])
    if not sheets:
        raise ValueError('the review pack has no sheets; build the animatic first')
    per_sheet = max(len(s['times']) for s in sheets)
    brief = brief_path().read_text(encoding='utf-8')
    brand = Path(state.get('pipeline', {}).get('brand', ''))
    style_guide = (brand/'style-guide.md').read_text(encoding='utf-8') if (brand/'style-guide.md').is_file() else ''

    jobs = []
    for i in range(0, len(sheets), batch_sheets):
        batch = sheets[i:i + batch_sheets]
        start, end = batch[0]['times'][0], batch[-1]['times'][-1]
        geometry, errors = geometry_lines(findings, start, end)
        content = [{'type': 'text', 'text': context_text(state, style_guide, scenes, start, end, root)
                    + '\n\nGeometry check for your share:\n' + '\n'.join(geometry)}]
        for n, sheet in enumerate(batch, i + 1):
            content += [{'type': 'text', 'text': sheet_label(n, sheet, per_sheet)}, image_part(review_dir/sheet['file'])]
        marked = sorted({f['t'] for f in errors if not f.get('waived')})[:MAX_MARKED]
        for t in marked:
            path = review_dir/'issues'/f'{t:07.2f}.jpg'
            if path.is_file():
                content += [{'type': 'text', 'text': f'Marked frame at {t:.2f} s (numbers match the marks above):'},
                            image_part(path)]
        jobs.append(dict(kind='detail', name=f'detail-{len(jobs) + 1:02d}', start=start, end=end,
                         model=detail_model, max_tokens=16000, content=content))
    if overall:
        content = [{'type': 'text', 'text': OVERALL_TASK + '\n\n' + context_text(state, style_guide, scenes, 0, 0, root, whole=True)
                    + f'\n\nAll {len(sheets)} sheets follow in time order.'}]
        for n, sheet in enumerate(sheets, 1):
            content += [{'type': 'text', 'text': sheet_label(n, sheet, per_sheet)}, image_part(review_dir/sheet['file'])]
        jobs.append(dict(kind='overall', name='overall', start=0, end=state.get('pipeline', {}).get('duration', 0),
                         model=overall_model, max_tokens=16000, content=content))

    out_root = root/'frame-review'
    out_root.mkdir(exist_ok=True)
    round_no = 1 + len([p for p in out_root.glob('round-*') if p.is_dir()])
    out = out_root/f'round-{round_no}'
    out.mkdir()
    started = time.time()
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, parallel)) as pool:
        futures = [pool.submit(run_request, job, base, key, brief) for job in jobs]
        for future in concurrent.futures.as_completed(futures):
            r = future.result()
            results.append(r)
            if not r['error']:
                (out/f"{r['name']}.md").write_text(r['text'], encoding='utf-8')
            status = 'failed' if r['error'] else f"done in {r['seconds']} s"
            print(f"frame review: {r['name']} {status} ({len(results)}/{len(jobs)})", file=sys.stderr, flush=True)
    order = {job['name']: n for n, job in enumerate(jobs)}
    results.sort(key=lambda r: order[r['name']])

    counts = {p: 0 for p in ('P0', 'P1', 'P2', 'P3')}
    failed, report = [], ['# Frame review', '']
    usage = dict(prompt_tokens=0, completion_tokens=0)
    for r in results:
        label = 'Whole video (consistency)' if r['kind'] == 'overall' else f"{fmt_time(r['start'])}–{fmt_time(r['end'])}"
        report += [f"## {label}", '']
        if r['error']:
            failed.append(dict(name=r['name'], start=r['start'], end=r['end'], error=r['error']))
            report += [f"REQUEST FAILED: {r['error']}", 'Review these sheets yourself before showing the animatic.', '']
            continue
        for p in PRIORITY.findall(r['text']):
            counts[p] += 1
        for k in usage:
            usage[k] += int(r['usage'].get(k) or 0)
        report += [r['text'].strip().strip('`').strip(), '']
    verdict = 'FAILED' if failed and len(failed) == len(results) else (
        'NEEDS FIXES' if counts['P0'] or counts['P1'] else ('INCOMPLETE' if failed else 'CLEAN'))
    (out/'report.md').write_text('\n'.join(report) + '\n', encoding='utf-8')
    result = dict(round=round_no, verdict=verdict, findings=counts, requests=len(results), failed=failed,
                  models=dict(detail=detail_model, overall=overall_model if overall else None),
                  tokens=usage, seconds=round(time.time() - started),
                  per_request=[dict(name=r['name'], seconds=r['seconds'], usage=r['usage'], error=r['error'])
                               for r in results],
                  report=str(out/'report.md'))
    (out/'result.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    return result
