const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const {pathToFileURL} = require('url');

async function openBrowser(options = {}) {
  const {chromium} = require('playwright');
  const remote = !!process.env.CDP_URL;
  const browser = remote ? await chromium.connectOverCDP(process.env.CDP_URL) : await chromium.launch({headless: !process.env.HEADED, ...(options.launch || {})});
  let context;
  try { context = await browser.newContext(options.context || {}); }
  catch (e) { await browser.close(); throw e; }
  return {browser, context, close: async () => { try { await context.close(); } finally {
    // Pinned Playwright 1.48.2 connectOverCDP supplies browserProcess.close =
    // chromeTransport.closeAndWait (server/chromium/chromium.js), NOT Browser.close CDP.
    // This disconnects our CDP transport without terminating the shared Chromium.
    // Omitting it leaves the WebSocket alive and the CLI process hanging.
    await browser.close();
  } }};
}
async function serveHTML(html) {
  html = path.resolve(html);
  if (!process.env.CDP_URL) return {url: pathToFileURL(html).href, close: async () => {}};
  const root = fs.realpathSync(process.env.HTML_ROOT || path.dirname(html));
  if (path.relative(root, html).startsWith('..')) throw new Error('HTML must be inside HTML_ROOT');
  const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.svg':'image/svg+xml','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.otf':'font/otf','.json':'application/json','.mp4':'video/mp4','.m4v':'video/mp4','.webm':'video/webm','.mov':'video/quicktime','.mp3':'audio/mpeg','.wav':'audio/wav'};
  const server = http.createServer((req,res) => {
    try {
      const rel = decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/, '');
      const file = fs.realpathSync(path.join(root, rel));
      if (path.relative(root,file).startsWith('..') || !fs.statSync(file).isFile()) {res.writeHead(403);res.end();return;}
      res.setHeader('Content-Type',types[path.extname(file).toLowerCase()] || 'application/octet-stream');
      res.setHeader('Cache-Control','no-store');
      res.setHeader('Accept-Ranges','bytes');
      // Media elements seek with Range requests; without 206 responses Chromium
      // cannot seek a served video and keeps showing its first frame.
      const size=fs.statSync(file).size;let start=0,end=size-1,status=200;
      const range=req.headers.range;
      if (range) {
        const m=/^bytes=(\d*)-(\d*)$/.exec(range.trim());
        if (!m || (m[1]==='' && m[2]==='')) {res.writeHead(416,{'Content-Range':`bytes */${size}`});res.end();return;}
        if (m[1]==='') {start=Math.max(0,size-Number(m[2]));} else {start=Number(m[1]);if(m[2]!=='')end=Math.min(end,Number(m[2]));}
        if (start>end || start>=size) {res.writeHead(416,{'Content-Range':`bytes */${size}`});res.end();return;}
        status=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${size}`);
      }
      res.setHeader('Content-Length',String(end-start+1));res.writeHead(status);
      if (req.method==='HEAD') {res.end();return;}
      const stream=fs.createReadStream(file,{start,end});stream.on('error',()=>res.destroy());stream.pipe(res);
    } catch {res.writeHead(404);res.end();}
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'0.0.0.0',resolve);});
  const host = process.env.BROWSER_HTTP_HOST || os.hostname();
  return {url:`http://${host}:${server.address().port}/${path.relative(root,html).split(path.sep).map(encodeURIComponent).join('/')}`,close:()=>new Promise(r=>server.close(r))};
}
async function ready(page,url) {
  await page.goto(url,{waitUntil:'networkidle'});
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.complete?null:new Promise(r=>{i.onload=i.onerror=r;})));});
}
module.exports={openBrowser,serveHTML,ready};
