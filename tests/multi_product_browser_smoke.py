#!/usr/bin/env python3
"""Opt-in local DOM/font/asset smoke, not a video render or production approval.

Run: python tests/multi_product_browser_smoke.py --run [--cdp http://127.0.0.1:9222]
Requires Python Playwright + Chromium (or an already authorized workspace browser).
No screenshots, private site requests, external writes or approval attestations.
"""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import sys
import tempfile
from threading import Thread

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT/'engine/scripts'))
import prepare_page


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--run', action='store_true')
    parser.add_argument('--cdp')
    args = parser.parse_args()
    if not args.run:
        parser.error('--run required for synthetic layout test')
    from playwright.sync_api import sync_playwright
    results = []
    with tempfile.TemporaryDirectory(prefix='multi-product-smoke-') as tmp:
        root = Path(tmp)
        for brand in ('lakesentry', 'antares', 'secondstack', 'alchemist'):
            for orientation in ('landscape', 'vertical'):
                prepare_page.prepare_page(ROOT/'brands'/brand, 'universal-'+orientation+'.html',
                                          root/(brand+'-'+orientation))
        server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=tmp))
        Thread(target=server.serve_forever, daemon=True).start()
        try:
            with sync_playwright() as pw:
                browser = pw.chromium.connect_over_cdp(args.cdp) if args.cdp else pw.chromium.launch()
                context = browser.contexts[0] if args.cdp else browser.new_context()
                page = context.new_page()
                try:
                    external = []
                    def route(request):
                        if request.request.url.startswith('http://127.0.0.1:'):
                            request.continue_()
                        else:
                            external.append(request.request.url)
                            request.abort()
                    page.route('**/*', route)
                    for brand in ('lakesentry', 'antares', 'secondstack', 'alchemist'):
                        config = json.loads((ROOT/'brands'/brand/'brand.json').read_text())
                        for orientation, size in [('landscape', (1920,1080)), ('vertical', (1080,1920))]:
                            page.set_viewport_size({'width': size[0], 'height': size[1]})
                            response = page.goto(f'http://127.0.0.1:{server.server_port}/{brand}-{orientation}/index.html')
                            assert response.status == 200
                            page.evaluate('document.fonts.ready')
                            for font in config.get('font_faces', []):
                                page.evaluate('(family)=>document.fonts.load(`16px "${family}"`)', font['family'])
                            page.evaluate('window.render(1)')
                            state = page.evaluate('''() => ({
                                language: document.documentElement.lang,
                                background: getComputedStyle(document.body).backgroundColor,
                                disclosure: document.getElementById('disclosure').textContent,
                                logo: (()=>{const l=document.getElementById('brand-logo');return {loaded:l.complete&&l.naturalWidth>0,width:l.getBoundingClientRect().width,height:l.getBoundingClientRect().height};})(),
                                fonts: [...document.fonts].map(f=>({family:f.family,status:f.status})),
                                overflow: [...document.querySelectorAll('#headline,#subtitle,article,footer')].some(e=>(getComputedStyle(e).overflowY!=='visible'&&e.scrollHeight>e.clientHeight+1)||e.scrollWidth>e.clientWidth+1),
                                bounds: [...document.querySelectorAll('#stage > *')].map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom};})
                            })''')
                            assert state['language'] == 'en'
                            assert state['logo']['loaded'] and state['logo']['width'] >= 120, state
                            assert not state['overflow'], (state, page.evaluate("[...document.querySelectorAll('#headline,#subtitle,article,footer')].map(e=>({id:e.id,sw:e.scrollWidth,cw:e.clientWidth,sh:e.scrollHeight,ch:e.clientHeight,css:getComputedStyle(e).overflow}))"))
                            for box in state['bounds']:
                                assert box['x'] >= 0 and box['y'] >= 0 and box['right'] <= size[0] and box['bottom'] <= size[1], state
                            if brand != 'lakesentry':
                                assert state['disclosure'] == config['editorial']['disclosure']
                                for font in config['font_faces']:
                                    assert any(f['family'].strip('"') == font['family'] and f['status'] == 'loaded' for f in state['fonts']), state
                            if brand == 'alchemist':
                                assert state['background'] == 'rgb(24, 24, 24)'
                            page.evaluate('window.render(0);window.render(1)')
                            assert page.locator('#disclosure').inner_text() == state['disclosure']
                            results.append({'product':brand,'orientation':orientation,'result':'passed','fonts':state['fonts']})
                    assert not external, external
                finally:
                    page.close()
                    if not args.cdp:
                        browser.close()
        finally:
            server.shutdown()
            server.server_close()
    print(json.dumps({'kind':'synthetic_layout_test_NOT_production_approval','cases':results}, indent=2))


if __name__ == '__main__':
    main()
