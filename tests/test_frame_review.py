import http.server
import json
import os
from pathlib import Path
import sys
import tempfile
import threading
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'engine/scripts'))
import frame_review

REPLY = 'VERDICT: NEEDS FIXES\nREVIEWED: x\nFINDINGS:\n1. [P1] 0:01 · a\n2. [P2] 0:03 · b\n'


class Gateway(http.server.BaseHTTPRequestHandler):
    requests = []
    fail = {}      # model -> list of HTTP codes to return, in order
    replies = {}   # model -> reply text

    def log_message(self, *args):
        pass

    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
        Gateway.requests.append(dict(path=self.path, auth=self.headers['Authorization'], body=body))
        codes = Gateway.fail.get(body['model'])
        if codes:
            code = codes.pop(0)
            self.send_response(code)
            self.end_headers()
            self.wfile.write(b'{"error":"nope"}')
            return
        text = Gateway.replies.get(body['model'], REPLY)
        data = json.dumps({'choices': [{'message': {'content': text}, 'finish_reason': 'stop'}],
                           'usage': {'prompt_tokens': 100, 'completion_tokens': 10}}).encode()
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)


class FrameReviewTests(unittest.TestCase):
    def setUp(self):
        Gateway.requests, Gateway.fail, Gateway.replies = [], {}, {}
        self.server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Gateway)
        threading.Thread(target=self.server.serve_forever, daemon=True).start()
        self.tmp = tempfile.TemporaryDirectory()
        root = self.root = Path(self.tmp.name)/'ep'
        brand = Path(self.tmp.name)/'brand'
        brand.mkdir()
        (brand/'style-guide.md').write_text('BRAND RULES: blue only.', encoding='utf-8')
        review = root/'review'
        (review/'sheets').mkdir(parents=True)
        (review/'issues').mkdir()
        sheets = []
        times = [1.0 + 2 * i for i in range(18)]  # 18 frames: 5 sheets, the last one with 2 frames
        for n, i in enumerate(range(0, len(times), 4), 1):
            (review/'sheets'/f'{n:03d}.jpg').write_bytes(b'\xff\xd8sheet%d' % n)
            sheets.append(dict(file=f'sheets/{n:03d}.jpg', times=times[i:i + 4]))
        (review/'issues'/'0003.00.jpg').write_bytes(b'\xff\xd8marked')
        findings = [dict(id='3.00#1', t=3.0, mark=1, key='text_overlap:A / B', waived=None,
                         type='text_overlap', severity='error', text='A / B'),
                    dict(id='5.00#1', t=5.0, mark=1, key='shapes_overlap:x', waived=None,
                         type='shapes_overlap', severity='warning', text='x / y')]
        (review/'layout.json').write_text(json.dumps(dict(version=1, summary={}, findings=findings, sheets=sheets,
            scenes=[dict(title='Intro', start=0, end=20), dict(title='Outro', start=20, end=36)])), encoding='utf-8')
        (root/'timings.json').write_text(json.dumps(dict(words=[dict(text='Hello', start=1.0, end=1.4),
            dict(text='later', start=30.0, end=30.4)])), encoding='utf-8')
        self.state = dict(pipeline=dict(brand=str(brand), product='antares', format='horizontal', duration=36.0),
                          secret_instructions='AGENT INSTRUCTIONS MUST NOT LEAK')
        env = {'OPENAI_BASE_URL': f'http://127.0.0.1:{self.server.server_port}/v1', 'OPENAI_API_KEY': 'k-test'}
        self.env = patch.dict(os.environ, env)
        self.env.start()

    def tearDown(self):
        self.env.stop()
        self.server.shutdown()
        self.server.server_close()
        self.tmp.cleanup()

    def run_review(self, **kw):
        return frame_review.review(self.root, self.state, batch_sheets=2, parallel=2, **kw)

    def test_requests_carry_only_rules_frames_and_their_share(self):
        result = self.run_review()
        brief = frame_review.brief_path().read_text(encoding='utf-8')
        detail = [r for r in Gateway.requests if r['body']['model'] == frame_review.DETAIL_MODEL]
        overall = [r for r in Gateway.requests if r['body']['model'] == frame_review.OVERALL_MODEL]
        self.assertEqual((len(detail), len(overall)), (3, 1))  # 5 sheets in batches of 2, plus overall
        for r in Gateway.requests:
            self.assertEqual(r['path'], '/v1/chat/completions')
            self.assertEqual(r['auth'], 'Bearer k-test')
            messages = r['body']['messages']
            self.assertEqual([m['role'] for m in messages], ['system', 'user'])
            self.assertEqual(messages[0]['content'], brief)
            dump = json.dumps(r['body'])
            self.assertNotIn('AGENT INSTRUCTIONS', dump)
            self.assertIn('BRAND RULES: blue only.', dump)
        first = json.dumps(detail[0]['body'])
        images = [p for p in detail[0]['body']['messages'][1]['content'] if p['type'] == 'image_url']
        self.assertEqual(len(images), 3)  # two sheets and one marked frame
        self.assertIn('text_overlap', first)
        self.assertIn('Hello', first)
        self.assertNotIn('later', first)  # narration outside this share
        self.assertNotIn('Outro', first)
        last = json.dumps(detail[-1]['body'])
        self.assertIn('Only 2 of 4 tiles are frames', last)
        overall_images = [p for p in overall[0]['body']['messages'][1]['content'] if p['type'] == 'image_url']
        self.assertEqual(len(overall_images), 5)
        self.assertIn('OVERALL pass', json.dumps(overall[0]['body']))
        self.assertEqual(result['verdict'], 'NEEDS FIXES')
        self.assertEqual(result['findings'], {'P0': 0, 'P1': 4, 'P2': 4, 'P3': 0})
        self.assertEqual(result['tokens'], {'prompt_tokens': 400, 'completion_tokens': 40})
        report = Path(result['report']).read_text(encoding='utf-8')
        self.assertIn('Whole video (consistency)', report)
        self.assertNotIn('k-test', report)

    def test_clean_rounds_are_numbered_and_kept(self):
        Gateway.replies = {m: 'VERDICT: CLEAN\nREVIEWED: x\nFINDINGS:\n1. [P3] polish\n'
                           for m in (frame_review.DETAIL_MODEL, frame_review.OVERALL_MODEL)}
        first = self.run_review()
        second = self.run_review(overall=False)
        self.assertEqual((first['verdict'], first['round'], second['round']), ('CLEAN', 1, 2))
        self.assertEqual(second['requests'], 3)
        self.assertTrue((self.root/'frame-review/round-1/report.md').is_file())

    def test_failed_request_is_retried_once_then_reported(self):
        Gateway.fail = {frame_review.OVERALL_MODEL: [500, 500]}
        Gateway.replies = {frame_review.DETAIL_MODEL: 'VERDICT: CLEAN\nREVIEWED: x\nFINDINGS:\n'}
        result = self.run_review()
        self.assertEqual(result['verdict'], 'INCOMPLETE')
        self.assertEqual([f['name'] for f in result['failed']], ['overall'])
        self.assertEqual(len([r for r in Gateway.requests if r['body']['model'] == frame_review.OVERALL_MODEL]), 2)

    def test_budget_error_is_not_retried(self):
        Gateway.fail = {frame_review.DETAIL_MODEL: [402] * 3, frame_review.OVERALL_MODEL: [402]}
        result = self.run_review()
        self.assertEqual(result['verdict'], 'FAILED')
        self.assertEqual(len(Gateway.requests), 4)

    def test_reply_without_verdict_counts_as_failure(self):
        Gateway.replies = {frame_review.OVERALL_MODEL: ''}
        result = self.run_review()
        self.assertEqual([f['name'] for f in result['failed']], ['overall'])

    def test_missing_gateway_is_an_error(self):
        with patch.dict(os.environ, {'OPENAI_API_KEY': ''}):
            with self.assertRaises(ValueError):
                self.run_review()


if __name__ == '__main__':
    unittest.main()
