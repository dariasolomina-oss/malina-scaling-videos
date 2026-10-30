// Screen-recording driver for product shots (Playwright).
//
//   node record_screen.js --login [state.json]            open a headed browser, sign in by hand, press Enter here → saves cookies
//   node record_screen.js <shots.json> <out.mp4>          run the shot list and write an mp4 (needs ffmpeg on PATH)
//
// Env:  W=1920 H=1080   viewport = video size (record 16:9, crop/zoom later in the edit)
//       MODE=video      Playwright recordVideo (webm, ~25 fps, simplest)      [default]
//       MODE=cdp        CDP Page.startScreencast JPEG frames → ffmpeg at FPS (sharper text, exact fps)
//       FPS=60          only for MODE=cdp
//       STATE=…         storageState file from --login (default: OS temporary directory/malina-render-<uid>.state.json (mode 0600))
//       LOGIN_URL=…     sign-in page for --login (default: the brand pack's "demo_login_url" when BRAND=brands/<name>/brand.json)
//       HEADED=1        watch it run
//       SLOW=600        default settle time (ms) after every step
//
// Shot list = JSON array of steps. Every step may add "wait": ms (overrides SLOW).
//   {"goto":"https://demo.example.com/some-page"}
//   {"click":"text=Comparison"}            Playwright selector (text=, role=, css)
//   {"hover":"text=Approve"}
//   {"fill":["input[name=search]","etl_daily"]}
//   {"press":"Enter"}
//   {"scroll":600}                         wheel pixels (negative = up), eased over ~0.8 s
//   {"move":[900,520]}                     glide the mouse to x,y over ~0.6 s (visible cursor, see CURSOR below)
//   {"hold":2500}                          sit still (so the voice-over has room)
//   {"hide":"css selector"}                display:none for an element you don't want on screen (emails…)
//   {"eval":"document.title"}              arbitrary JS
//
// Playwright has no page.screencast() in Node; the CDP mode below is the equivalent (Page.startScreencast).
const {openBrowser,serveHTML}=require('./browser');const {fileURLToPath}=require('url');const path=require('path');const fs=require('fs');const os=require('os');
const {execFileSync}=require('child_process');
const HERE=__dirname;const STATE=process.env.STATE||path.join(os.tmpdir(),'malina-render-'+process.getuid()+'.state.json');
const W=+(process.env.W||1920),H=+(process.env.H||1080),SLOW=+(process.env.SLOW||600);
const MODE=process.env.MODE||'video',FPS=+(process.env.FPS||60);
// A fake cursor drawn by the page (the real one isn't captured in headless video).
const CURSOR=`(()=>{if(window.__cur)return;const c=document.createElement('div');c.id='__cur';c.style.cssText='position:fixed;z-index:2147483647;width:22px;height:22px;pointer-events:none;left:0;top:0;transform:translate(-3px,-2px)';
c.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22"><path d="M5 3l14 8-6 1.5L9.5 19z" fill="#111" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>';document.body.appendChild(c);window.__cur=c;
document.addEventListener('mousemove',e=>{c.style.left=e.clientX+'px';c.style.top=e.clientY+'px'},true)})()`;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));const ease=t=>t<.5?2*t*t:-1+(4-2*t)*t;
let session,workTmp;const servers=[];
async function cleanup(){if(session){await session.close();session=null;}if(workTmp)fs.rmSync(workTmp,{recursive:true,force:true});for(const server of servers.splice(0))await server.close();}

(async()=>{
  const a=process.argv.slice(2);
  if(a[0]==='--login'){
    const out=a[1]||STATE;session=await openBrowser({launch:{headless:false},context:{viewport:{width:W,height:H}}});const ctx=session.context;const p=await ctx.newPage();
    const LOGIN=process.env.LOGIN_URL||(process.env.BRAND?JSON.parse(fs.readFileSync(process.env.BRAND,'utf8')).demo_login_url:null);
    if(!LOGIN)throw new Error('set LOGIN_URL or BRAND');
    await p.goto(LOGIN);
    console.log('Sign in in the browser window, land on the dashboard, then press Enter here…');
    await new Promise(r=>process.stdin.once('data',r));
    fs.mkdirSync(path.dirname(path.resolve(out)),{recursive:true});fs.writeFileSync(out,JSON.stringify(await ctx.storageState()),{mode:0o600});fs.chmodSync(out,0o600);console.log('saved private storageState',out);await cleanup();process.exit(0);
  }
  const [shotsFile,outMp4]=a;if(!shotsFile||!outMp4){console.log('usage: see header');process.exit(1)}
  const shots=JSON.parse(fs.readFileSync(shotsFile,'utf8'));
  if(!fs.existsSync(STATE))console.warn('no saved login at',STATE,'- run --login first if the demo asks to sign in');
  const tmp=workTmp=fs.mkdtempSync(path.join(os.tmpdir(),'lsrec-'));
  session=await openBrowser({context:{viewport:{width:W,height:H},deviceScaleFactor:1,storageState:fs.existsSync(STATE)?JSON.parse(fs.readFileSync(STATE,'utf8')):undefined,
    ...(MODE==='video'?{recordVideo:{dir:tmp,size:{width:W,height:H}}}:{})}});
  const ctx=session.context;
  const p=await ctx.newPage();let mouse={x:W/2,y:H/2};
  p.on('load',()=>p.evaluate(CURSOR).catch(()=>{}));
  // CDP screencast: frames with timestamps, assembled later at a fixed fps.
  let cdp,frames=[];
  if(MODE==='cdp'){cdp=await ctx.newCDPSession(p);let i=0;
    cdp.on('Page.screencastFrame',async f=>{frames.push({t:f.metadata.timestamp,file:path.join(tmp,`f${String(i++).padStart(6,'0')}.jpg`)});
      fs.writeFileSync(frames[frames.length-1].file,Buffer.from(f.data,'base64'));await cdp.send('Page.screencastFrameAck',{sessionId:f.sessionId}).catch(()=>{})});
    await cdp.send('Page.startScreencast',{format:'jpeg',quality:92,maxWidth:W,maxHeight:H,everyNthFrame:1});}
  const glide=async(x,y,ms=600)=>{const s={...mouse};const n=Math.max(6,Math.round(ms/16));for(let i=1;i<=n;i++){const k=ease(i/n);await p.mouse.move(s.x+(x-s.x)*k,s.y+(y-s.y)*k);await sleep(ms/n)}mouse={x,y}};
  const center=async sel=>{const el=p.locator(sel).first();await el.scrollIntoViewIfNeeded();const bb=await el.boundingBox();if(!bb)throw new Error('no box for '+sel);return {x:bb.x+bb.width/2,y:bb.y+bb.height/2}};
  const t0=Date.now();
  for(const s of shots){const w=s.wait??SLOW;
    if(s.goto){let url=s.goto;if(url.startsWith('file:')){const server=await serveHTML(fileURLToPath(url));servers.push(server);url=server.url;}await p.goto(url,{waitUntil:'networkidle'});await p.evaluate(CURSOR).catch(()=>{})}
    if(s.hide)await p.addStyleTag({content:`${s.hide}{visibility:hidden!important}`});
    if(s.hover){const c=await center(s.hover);await glide(c.x,c.y)}
    if(s.click){const c=await center(s.click);await glide(c.x,c.y);await sleep(120);await p.mouse.down();await sleep(70);await p.mouse.up()}
    if(s.fill){await p.locator(s.fill[0]).first().click();await p.keyboard.type(s.fill[1],{delay:55})}
    if(s.press)await p.keyboard.press(s.press);
    if(s.move)await glide(s.move[0],s.move[1]);
    if(s.scroll){const n=24;for(let i=0;i<n;i++){await p.mouse.wheel(0,s.scroll/n);await sleep(800/n)}}
    if(s.eval)console.log(await p.evaluate(s.eval));
    if(s.hold)await sleep(s.hold);
    console.log(((Date.now()-t0)/1000).toFixed(1)+'s',JSON.stringify(s.fill?{...s,fill:[s.fill[0],'[redacted]']}:s));
    await sleep(w)}
  if(cdp)await cdp.send('Page.stopScreencast');
  const video=MODE==='video'?p.video():null;
  await ctx.close();
  fs.mkdirSync(path.dirname(path.resolve(outMp4)),{recursive:true});
  if(MODE==='video'){const webm=await video.path();
    execFileSync('ffmpeg',['-y','-i',webm,'-c:v','libx264','-crf','16','-pix_fmt','yuv420p','-r','25','-an',outMp4],{stdio:'inherit'})}
  else{ // concat demuxer with real frame durations, then resample to FPS
    if(!frames.length)throw new Error('No screencast frames received');const list=path.join(tmp,'list.txt');let s='';for(let i=0;i<frames.length;i++){const d=i+1<frames.length?frames[i+1].t-frames[i].t:1/FPS;s+=`file '${frames[i].file}'\nduration ${Math.max(d,0.001).toFixed(4)}\n`}
    s+=`file '${frames[frames.length-1].file}'\n`;fs.writeFileSync(list,s);
    execFileSync('ffmpeg',['-y','-f','concat','-safe','0','-i',list,'-vf',`fps=${FPS},scale=${W}:${H}`,'-c:v','libx264','-crf','16','-pix_fmt','yuv420p','-an',outMp4],{stdio:'inherit'})}
  await cleanup();console.log('wrote',outMp4,`(${MODE})`);
})().catch(async e=>{console.error(e);await cleanup();process.exitCode=1});
