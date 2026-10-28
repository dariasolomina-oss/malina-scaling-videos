// Deterministic frame renderer for code-driven motion pages.
// The page must expose window.render(t) (draws the frame at t seconds) and window.DURATION.
//
//   node render.js <page.html> <outDir> [fps]                 -> full render, frames f_00000.jpg…
//   node render.js <page.html> <outDir> --test 1.5 7.2 22.4   -> a few stills for checking
//
// Size comes from env W/H (default 1920x1080; use W=1080 H=1920 for vertical).
// ALPHA=1 writes transparent PNGs (f_00000.png…) instead of JPGs, for overlay layers such as burned-in captions.
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');const os=require('os');
(async()=>{
  const [html,out,...rest]=process.argv.slice(2);
  if(!html||!out){console.log('usage: node render.js <page.html> <outDir> [fps] | --test t1 t2 …');process.exit(1)}
  const W=+(process.env.W||1920),H=+(process.env.H||1080);
  let b;
  try{b=await chromium.launch()}catch(e){
    // fall back to any headless shell already in the Playwright cache
    const cache=path.join(os.homedir(),'Library/Caches/ms-playwright');
    const dir=fs.readdirSync(cache).filter(d=>d.startsWith('chromium_headless_shell-')).sort().pop();
    b=await chromium.launch({executablePath:path.join(cache,dir,'chrome-headless-shell-mac-arm64/chrome-headless-shell')});
  }
  const p=await b.newPage({viewport:{width:W,height:H}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+path.resolve(html),{waitUntil:'networkidle'});
  await p.evaluate(()=>document.fonts.ready);
  await p.evaluate(()=>Promise.all([...document.images].map(i=>i.complete?1:new Promise(r=>i.onload=i.onerror=r))));
  fs.mkdirSync(out,{recursive:true});
  if(rest[0]==='--test'){
    for(const t of rest.slice(1).map(Number)){await p.evaluate(t=>render(t),t);await p.screenshot(process.env.ALPHA?{path:`${out}/t_${t.toFixed(2)}.png`,type:'png',omitBackground:true}:{path:`${out}/t_${t.toFixed(2)}.jpg`,type:'jpeg',quality:85})}
  }else{
    const fps=+(rest[0]||60);const n=Math.round(await p.evaluate(()=>DURATION)*fps);const st=Date.now();
    for(let i=0;i<n;i++){await p.evaluate(t=>render(t),i/fps);await p.screenshot(process.env.ALPHA?{path:`${out}/f_${String(i).padStart(5,'0')}.png`,type:'png',omitBackground:true}:{path:`${out}/f_${String(i).padStart(5,'0')}.jpg`,type:'jpeg',quality:93});
      if(i%240===0)console.log(i,'/',n,((Date.now()-st)/1000).toFixed(0)+'s')}
  }
  if(errs.length)console.log('PAGE ERRORS',errs);
  await b.close();
})();
