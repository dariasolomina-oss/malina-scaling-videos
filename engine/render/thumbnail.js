// Render a thumbnail page to JPG, plus a small preview to check it reads at phone size.
//   node thumbnail.js <thumb.html> <out.jpg>             (size taken from the page: body width/height)
// Writes <out.jpg>, plus <name>-preview-320.jpg next to the page (320 px wide = how it looks in a YouTube mobile feed).
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');const os=require('os');const {execSync}=require('child_process');
(async()=>{
  const [html,out]=process.argv.slice(2);
  if(!html||!out){console.log('usage: node thumbnail.js <thumb.html> <out.jpg>');process.exit(1)}
  let b;try{b=await chromium.launch()}catch(e){const c=path.join(os.homedir(),'Library/Caches/ms-playwright');const d=fs.readdirSync(c).filter(x=>x.startsWith('chromium_headless_shell-')).sort().pop();
    b=await chromium.launch({executablePath:path.join(c,d,'chrome-headless-shell-mac-arm64/chrome-headless-shell')})}
  const p=await b.newPage({viewport:{width:2000,height:2000}});
  await p.goto('file://'+path.resolve(html),{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
  await p.evaluate(()=>Promise.all([...document.images].map(i=>i.complete?1:new Promise(r=>i.onload=i.onerror=r))));
  const {w,h}=await p.evaluate(()=>({w:document.body.offsetWidth,h:document.body.offsetHeight}));
  await p.setViewportSize({width:w,height:h});
  await p.screenshot({path:out,type:'jpeg',quality:92});await b.close();
  // the small preview is a check, not a deliverable: it goes next to the source page, not into publish/
  const prev=path.join(path.dirname(path.resolve(html)),path.basename(out).replace(/\.jpg$/,'')+'-preview-320.jpg');
  execSync(`ffmpeg -loglevel error -y -i "${out}" -vf scale=320:-1 "${prev}"`);
  const kb=Math.round(fs.statSync(out).size/1024);
  console.log(`wrote ${out} (${w}x${h}, ${kb} KB${kb>2000?' — OVER YouTube 2 MB limit!':''}) + ${path.basename(prev)}`);
})();
